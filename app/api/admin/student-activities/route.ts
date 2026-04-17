import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

const STORAGE_BUCKET = "student-activities";

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
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

function sanitizeFileName(fileName: string) {
  const parts = fileName.split(".");
  const extension = parts.length > 1 ? parts.pop()?.toLowerCase() : "";
  const baseName = parts.join(".") || "file";

  const safeBaseName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return extension ? `${safeBaseName}.${extension}` : safeBaseName;
}

async function uploadFileToStorage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File,
  folder: "logos" | "covers"
) {
  const fileName = sanitizeFileName(file.name || "image");
  const filePath = `student-activities/${folder}/${Date.now()}-${crypto.randomUUID()}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

export async function GET() {
  try {
    const supabase = await createClient();

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
      `)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = (data || []).map((activity: any) => ({
      id: activity.id,
      city_id: activity.city_id,
      university_id: activity.university_id,
      name_en: activity.name_en,
      name_ar: activity.name_ar,
      slug: activity.slug,
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
      city_name_en: activity.city?.name_en || null,
      city_name_ar: activity.city?.name_ar || null,
      university_name_en: activity.university?.name_en || null,
      university_name_ar: activity.university?.name_ar || null,
    }));

    return NextResponse.json({
      items,
      total: items.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load admin student activities",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const contentType = request.headers.get("content-type") || "";

    let city_id = "";
    let university_id = "";
    let name_en = "";
    let name_ar = "";
    let slug = "";
    let short_description_en = "";
    let short_description_ar = "";
    let full_description_en = "";
    let full_description_ar = "";
    let logo_url = "";
    let cover_image_url = "";
    let contact_email = "";
    let contact_phone = "";
    let contact_whatsapp = "";
    let instagram_url = "";
    let facebook_url = "";
    let website_url = "";
    let location_text = "";
    let join_button_text_en = "Join Us";
    let join_button_text_ar = "انضم إلينا";
    let is_featured = false;
    let is_active = true;
    let sort_order = 0;

    let logoFile: File | null = null;
    let coverFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      city_id = String(formData.get("city_id") || "").trim();
      university_id = String(formData.get("university_id") || "").trim();
      name_en = String(formData.get("name_en") || "").trim();
      name_ar = String(formData.get("name_ar") || "").trim();
      slug = normalizeSlug(String(formData.get("slug") || name_en));
      short_description_en = String(formData.get("short_description_en") || "").trim();
      short_description_ar = String(formData.get("short_description_ar") || "").trim();
      full_description_en = String(formData.get("full_description_en") || "").trim();
      full_description_ar = String(formData.get("full_description_ar") || "").trim();
      logo_url = String(formData.get("logo_url") || "").trim();
      cover_image_url = String(formData.get("cover_image_url") || "").trim();
      contact_email = String(formData.get("contact_email") || "").trim();
      contact_phone = String(formData.get("contact_phone") || "").trim();
      contact_whatsapp = String(formData.get("contact_whatsapp") || "").trim();
      instagram_url = String(formData.get("instagram_url") || "").trim();
      facebook_url = String(formData.get("facebook_url") || "").trim();
      website_url = String(formData.get("website_url") || "").trim();
      location_text = String(formData.get("location_text") || "").trim();
      join_button_text_en = String(formData.get("join_button_text_en") || "Join Us").trim();
      join_button_text_ar = String(formData.get("join_button_text_ar") || "انضم إلينا").trim();
      is_featured = parseBoolean(formData.get("is_featured"), false);
      is_active = parseBoolean(formData.get("is_active"), true);
      sort_order = parseNumber(formData.get("sort_order"), 0);

      const rawLogoFile = formData.get("logo");
      const rawCoverFile = formData.get("cover_image");

      logoFile =
        rawLogoFile instanceof File && rawLogoFile.size > 0 ? rawLogoFile : null;
      coverFile =
        rawCoverFile instanceof File && rawCoverFile.size > 0 ? rawCoverFile : null;
    } else {
      const body = await request.json();

      city_id = String(body.city_id || "").trim();
      university_id = String(body.university_id || "").trim();
      name_en = String(body.name_en || "").trim();
      name_ar = String(body.name_ar || "").trim();
      slug = normalizeSlug(String(body.slug || name_en));
      short_description_en = String(body.short_description_en || "").trim();
      short_description_ar = String(body.short_description_ar || "").trim();
      full_description_en = String(body.full_description_en || "").trim();
      full_description_ar = String(body.full_description_ar || "").trim();
      logo_url = String(body.logo_url || "").trim();
      cover_image_url = String(body.cover_image_url || "").trim();
      contact_email = String(body.contact_email || "").trim();
      contact_phone = String(body.contact_phone || "").trim();
      contact_whatsapp = String(body.contact_whatsapp || "").trim();
      instagram_url = String(body.instagram_url || "").trim();
      facebook_url = String(body.facebook_url || "").trim();
      website_url = String(body.website_url || "").trim();
      location_text = String(body.location_text || "").trim();
      join_button_text_en = String(body.join_button_text_en || "Join Us").trim();
      join_button_text_ar = String(body.join_button_text_ar || "انضم إلينا").trim();
      is_featured = parseBoolean(body.is_featured, false);
      is_active = parseBoolean(body.is_active, true);
      sort_order = parseNumber(body.sort_order, 0);
    }

    if (!city_id || !university_id || !name_en || !name_ar || !slug) {
      return NextResponse.json(
        {
          error:
            "city_id, university_id, name_en, name_ar, and slug are required",
        },
        { status: 400 }
      );
    }

    const { data: existingSlug, error: existingSlugError } = await supabase
      .from("student_activities")
      .select("id")
      .eq("slug", slug)
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

    if (logoFile) {
      logo_url = await uploadFileToStorage(supabase, logoFile, "logos");
    }

    if (coverFile) {
      cover_image_url = await uploadFileToStorage(supabase, coverFile, "covers");
    }

    const { data, error } = await supabase
      .from("student_activities")
      .insert({
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
      .select("id, slug")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        item: data,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create student activity",
      },
      { status: 500 }
    );
  }
}