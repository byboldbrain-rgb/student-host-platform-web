import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

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

export async function GET(_request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { slug } = await context.params;
    const activitySlug = decodeURIComponent(String(slug || "").trim());

    if (!activitySlug) {
      return NextResponse.json(
        { error: "Student activity slug is required" },
        { status: 400 }
      );
    }

    const { data: activity, error: activityError } = await supabase
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
        contact_email,
        contact_phone,
        contact_whatsapp,
        instagram_url,
        facebook_url,
        website_url,
        location_text,
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
      .eq("slug", activitySlug)
      .eq("is_active", true)
      .maybeSingle();

    if (activityError) {
      return NextResponse.json(
        { error: activityError.message },
        { status: 500 }
      );
    }

    if (!activity) {
      return NextResponse.json(
        { error: "Student activity not found" },
        { status: 404 }
      );
    }

    const city = pickRelation(
      activity.city as RelationItem | RelationItem[] | null
    );
    const university = pickRelation(
      activity.university as RelationItem | RelationItem[] | null
    );

    const { data: posts, error: postsError } = await supabase
      .from("student_activity_posts")
      .select(
        `
        id,
        activity_id,
        title_en,
        title_ar,
        description_en,
        description_ar,
        image_url,
        post_type,
        event_date,
        is_published,
        sort_order,
        created_at,
        updated_at
      `
      )
      .eq("activity_id", activity.id)
      .eq("is_published", true)
      .order("event_date", { ascending: false, nullsFirst: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (postsError) {
      return NextResponse.json(
        { error: postsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      activity: {
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
        contact_email: activity.contact_email,
        contact_phone: activity.contact_phone,
        contact_whatsapp: activity.contact_whatsapp,
        instagram_url: activity.instagram_url,
        facebook_url: activity.facebook_url,
        website_url: activity.website_url,
        location_text: activity.location_text,
        join_button_text_en: activity.join_button_text_en,
        join_button_text_ar: activity.join_button_text_ar,
        is_featured: activity.is_featured,
        is_active: activity.is_active,
        sort_order: activity.sort_order,
        created_at: activity.created_at,
        updated_at: activity.updated_at,
        city_id: city?.id || null,
        city_name_en: city?.name_en || null,
        city_name_ar: city?.name_ar || null,
        university_id: university?.id || null,
        university_name_en: university?.name_en || null,
        university_name_ar: university?.name_ar || null,
      },
      posts: (posts || []).map((post) => ({
        id: post.id,
        activity_id: post.activity_id,
        title_en: post.title_en,
        title_ar: post.title_ar,
        description_en: post.description_en,
        description_ar: post.description_ar,
        image_url: post.image_url,
        post_type: post.post_type,
        event_date: post.event_date,
        is_published: post.is_published,
        sort_order: post.sort_order,
        created_at: post.created_at,
        updated_at: post.updated_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load student activity details",
      },
      { status: 500 }
    );
  }
}