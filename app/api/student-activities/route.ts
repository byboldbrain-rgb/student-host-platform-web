import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type RelationItem = {
  id?: string | null;
  name_en?: string | null;
  name_ar?: string | null;
};

function pickRelation(
  relation: RelationItem | RelationItem[] | null | undefined
): RelationItem | null {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] || null : relation;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);

    const city = searchParams.get("city");
    const university = searchParams.get("university");
    const featured = searchParams.get("featured");
    const limitParam = searchParams.get("limit");

    const parsedLimit = limitParam ? Number(limitParam) : null;
    const limit =
      parsedLimit && Number.isFinite(parsedLimit) && parsedLimit > 0
        ? parsedLimit
        : null;

    let query = supabase
      .from("student_activities")
      .select(
        `
        id,
        slug,
        name_en,
        name_ar,
        short_description_en,
        short_description_ar,
        full_description_en,
        full_description_ar,
        logo_url,
        cover_image_url,
        join_button_text_en,
        join_button_text_ar,
        is_featured,
        is_active,
        sort_order,
        created_at,
        updated_at,
        city:cities (
          id,
          name_en,
          name_ar
        ),
        university:universities (
          id,
          name_en,
          name_ar
        )
      `
      )
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (city) {
      query = query.eq("city_id", city);
    }

    if (university) {
      query = query.eq("university_id", university);
    }

    if (featured === "true") {
      query = query.eq("is_featured", true);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = (data || []).map((activity: any) => {
      const cityRelation = pickRelation(
        activity.city as RelationItem | RelationItem[] | null
      );
      const universityRelation = pickRelation(
        activity.university as RelationItem | RelationItem[] | null
      );

      return {
        id: activity.id,
        slug: activity.slug,
        name_en: activity.name_en,
        name_ar: activity.name_ar,
        short_description_en: activity.short_description_en,
        short_description_ar: activity.short_description_ar,
        full_description_en: activity.full_description_en,
        full_description_ar: activity.full_description_ar,
        logo_url: activity.logo_url,
        cover_image_url: activity.cover_image_url,
        join_button_text_en: activity.join_button_text_en,
        join_button_text_ar: activity.join_button_text_ar,
        is_featured: activity.is_featured,
        is_active: activity.is_active,
        sort_order: activity.sort_order,
        created_at: activity.created_at,
        updated_at: activity.updated_at,
        city_id: cityRelation?.id || null,
        city_name_en: cityRelation?.name_en || null,
        city_name_ar: cityRelation?.name_ar || null,
        university_id: universityRelation?.id || null,
        university_name_en: universityRelation?.name_en || null,
        university_name_ar: universityRelation?.name_ar || null,
      };
    });

    return NextResponse.json({
      items,
      total: items.length,
      filters: {
        city,
        university,
        featured: featured === "true",
        limit,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load student activities",
      },
      { status: 500 }
    );
  }
}