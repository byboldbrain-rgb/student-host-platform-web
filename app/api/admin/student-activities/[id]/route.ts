import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function toNullableString(value: unknown) {
  const parsed = String(value || "").trim();
  return parsed || null;
}

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;

  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "true") return true;
  if (normalized === "false") return false;

  return fallback;
}

function parseNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const activityId = String(id || "").trim();

    if (!activityId || !isValidUuid(activityId)) {
      return NextResponse.json(
        { error: "Invalid student activity id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("student_activities")
      .select(`
        id,
        city_id,
        university_id,
        name_en,
        name_ar,
        slug,
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
        updated_at
      `)
      .eq("id", activityId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Student activity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load student activity",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const activityId = String(id || "").trim();

    if (!activityId || !isValidUuid(activityId)) {
      return NextResponse.json(
        { error: "Invalid student activity id" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const city_id = String(body.city_id || "").trim();
    const university_id = String(body.university_id || "").trim();
    const name_en = String(body.name_en || "").trim();
    const name_ar = String(body.name_ar || "").trim();
    const slug = normalizeSlug(String(body.slug || body.name_en || ""));
    const short_description_en = String(body.short_description_en || "").trim();
    const short_description_ar = String(body.short_description_ar || "").trim();
    const full_description_en = String(body.full_description_en || "").trim();
    const full_description_ar = String(body.full_description_ar || "").trim();
    const logo_url = String(body.logo_url || "").trim();
    const cover_image_url = String(body.cover_image_url || "").trim();
    const contact_email = String(body.contact_email || "").trim();
    const contact_phone = String(body.contact_phone || "").trim();
    const contact_whatsapp = String(body.contact_whatsapp || "").trim();
    const instagram_url = String(body.instagram_url || "").trim();
    const facebook_url = String(body.facebook_url || "").trim();
    const website_url = String(body.website_url || "").trim();
    const location_text = String(body.location_text || "").trim();
    const join_button_text_en = String(
      body.join_button_text_en || "Join Us"
    ).trim();
    const join_button_text_ar = String(
      body.join_button_text_ar || "انضم إلينا"
    ).trim();
    const is_featured = parseBoolean(body.is_featured, false);
    const is_active = parseBoolean(body.is_active, true);
    const sort_order = parseNumber(body.sort_order, 0);

    if (!city_id || !isValidUuid(city_id)) {
      return NextResponse.json(
        { error: "Valid city_id is required" },
        { status: 400 }
      );
    }

    if (!university_id || !isValidUuid(university_id)) {
      return NextResponse.json(
        { error: "Valid university_id is required" },
        { status: 400 }
      );
    }

    if (!name_en || !name_ar || !slug) {
      return NextResponse.json(
        { error: "name_en, name_ar, and slug are required" },
        { status: 400 }
      );
    }

    const { data: existingActivity, error: existingActivityError } =
      await supabase
        .from("student_activities")
        .select("id")
        .eq("id", activityId)
        .maybeSingle();

    if (existingActivityError) {
      return NextResponse.json(
        { error: existingActivityError.message },
        { status: 500 }
      );
    }

    if (!existingActivity) {
      return NextResponse.json(
        { error: "Student activity not found" },
        { status: 404 }
      );
    }

    const { data: existingSlug, error: existingSlugError } = await supabase
      .from("student_activities")
      .select("id")
      .eq("slug", slug)
      .neq("id", activityId)
      .maybeSingle();

    if (existingSlugError) {
      return NextResponse.json(
        { error: existingSlugError.message },
        { status: 500 }
      );
    }

    if (existingSlug) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );
    }

    const { data: matchedUniversity, error: matchedUniversityError } =
      await supabase
        .from("universities")
        .select("id, city_id")
        .eq("id", university_id)
        .eq("city_id", city_id)
        .maybeSingle();

    if (matchedUniversityError) {
      return NextResponse.json(
        { error: matchedUniversityError.message },
        { status: 500 }
      );
    }

    if (!matchedUniversity) {
      return NextResponse.json(
        { error: "Selected university does not belong to the selected city" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("student_activities")
      .update({
        city_id,
        university_id,
        name_en,
        name_ar,
        slug,
        short_description_en: toNullableString(short_description_en),
        short_description_ar: toNullableString(short_description_ar),
        full_description_en: toNullableString(full_description_en),
        full_description_ar: toNullableString(full_description_ar),
        logo_url: toNullableString(logo_url),
        cover_image_url: toNullableString(cover_image_url),
        contact_email: toNullableString(contact_email),
        contact_phone: toNullableString(contact_phone),
        contact_whatsapp: toNullableString(contact_whatsapp),
        instagram_url: toNullableString(instagram_url),
        facebook_url: toNullableString(facebook_url),
        website_url: toNullableString(website_url),
        location_text: toNullableString(location_text),
        join_button_text_en,
        join_button_text_ar,
        is_featured,
        is_active,
        sort_order,
      })
      .eq("id", activityId)
      .select("id, slug, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update student activity",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const activityId = String(id || "").trim();

    if (!activityId || !isValidUuid(activityId)) {
      return NextResponse.json(
        { error: "Invalid student activity id" },
        { status: 400 }
      );
    }

    const { data: existingActivity, error: existingActivityError } =
      await supabase
        .from("student_activities")
        .select("id")
        .eq("id", activityId)
        .maybeSingle();

    if (existingActivityError) {
      return NextResponse.json(
        { error: existingActivityError.message },
        { status: 500 }
      );
    }

    if (!existingActivity) {
      return NextResponse.json(
        { error: "Student activity not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("student_activities")
      .delete()
      .eq("id", activityId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete student activity",
      },
      { status: 500 }
    );
  }
}