import { createClient } from "@/src/lib/supabase/server";

export type AdminDoctorPayload = {
  full_name_en: string;
  full_name_ar?: string | null;
  slug?: string | null;
  title_en?: string | null;
  title_ar?: string | null;
  gender?: "male" | "female" | null;
  bio_en?: string | null;
  bio_ar?: string | null;
  photo_url?: string | null;
  years_of_experience?: number | null;
  consultation_fee?: number | null;

  phone?: string | null;
  whatsapp_number?: string | null;
  email?: string | null;

  city_id?: string | null;
  specialty_subcategory_id?: number | null;

  clinic_name_en?: string | null;
  clinic_name_ar?: string | null;
  clinic_slug?: string | null;
  clinic_phone?: string | null;
  clinic_email?: string | null;
  clinic_website_url?: string | null;
  clinic_whatsapp_number?: string | null;
  clinic_address_line?: string | null;
  clinic_google_maps_url?: string | null;
  clinic_logo_url?: string | null;
  clinic_cover_image_url?: string | null;
  clinic_short_description_en?: string | null;
  clinic_short_description_ar?: string | null;
  clinic_full_description_en?: string | null;
  clinic_full_description_ar?: string | null;

  is_featured?: boolean;
  is_active?: boolean;
};

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function randomSlugSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

async function generateUniqueDoctorSlug(params: {
  requestedSlug?: string | null;
  fullNameEn: string;
  existingDoctorId?: string;
}) {
  const supabase = await createClient();

  const baseFromRequested = normalizeSlug(params.requestedSlug || "");
  const baseFromName = normalizeSlug(params.fullNameEn || "");

  let baseSlug = baseFromRequested || baseFromName;

  if (!baseSlug) {
    baseSlug = `doctor-${randomSlugSuffix()}`;
  }

  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    let query = supabase
      .from("health_doctors")
      .select("id")
      .eq("slug", candidate)
      .limit(1);

    if (params.existingDoctorId) {
      query = query.neq("id", params.existingDoctorId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message || "Failed to validate doctor slug");
    }

    if (!data || data.length === 0) {
      return candidate;
    }

    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }
}

export async function createAdminDoctor(payload: AdminDoctorPayload) {
  const supabase = await createClient();

  const fullName = payload.full_name_en?.trim();
  if (!fullName) {
    throw new Error("full_name_en is required");
  }

  const slug = await generateUniqueDoctorSlug({
    requestedSlug: payload.slug,
    fullNameEn: fullName,
  });

  const clinicSlugRaw = payload.clinic_slug?.trim();
  const clinicSlug = clinicSlugRaw ? normalizeSlug(clinicSlugRaw) : null;

  const { data, error } = await supabase
    .from("health_doctors")
    .insert({
      full_name_en: fullName,
      full_name_ar: cleanString(payload.full_name_ar),
      slug,
      title_en: cleanString(payload.title_en),
      title_ar: cleanString(payload.title_ar),
      gender: payload.gender || null,
      bio_en: cleanString(payload.bio_en),
      bio_ar: cleanString(payload.bio_ar),
      photo_url: cleanString(payload.photo_url),
      years_of_experience: payload.years_of_experience ?? null,
      consultation_fee: payload.consultation_fee ?? null,

      phone: cleanString(payload.phone),
      whatsapp_number: cleanString(payload.whatsapp_number),
      email: cleanString(payload.email),

      city_id: cleanString(payload.city_id),
      specialty_subcategory_id: payload.specialty_subcategory_id ?? null,

      clinic_name_en: cleanString(payload.clinic_name_en),
      clinic_name_ar: cleanString(payload.clinic_name_ar),
      clinic_slug: clinicSlug,
      clinic_phone: cleanString(payload.clinic_phone),
      clinic_email: cleanString(payload.clinic_email),
      clinic_website_url: cleanString(payload.clinic_website_url),
      clinic_whatsapp_number: cleanString(payload.clinic_whatsapp_number),
      clinic_address_line: cleanString(payload.clinic_address_line),
      clinic_google_maps_url: cleanString(payload.clinic_google_maps_url),
      clinic_logo_url: cleanString(payload.clinic_logo_url),
      clinic_cover_image_url: cleanString(payload.clinic_cover_image_url),
      clinic_short_description_en: cleanString(
        payload.clinic_short_description_en,
      ),
      clinic_short_description_ar: cleanString(
        payload.clinic_short_description_ar,
      ),
      clinic_full_description_en: cleanString(
        payload.clinic_full_description_en,
      ),
      clinic_full_description_ar: cleanString(
        payload.clinic_full_description_ar,
      ),

      is_featured: Boolean(payload.is_featured),
      is_active: payload.is_active ?? true,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create doctor");
  }

  return data;
}

export async function updateAdminDoctor(
  id: string,
  payload: AdminDoctorPayload,
) {
  const supabase = await createClient();

  if (!id) {
    throw new Error("Doctor id is required");
  }

  const fullName = payload.full_name_en?.trim();
  if (!fullName) {
    throw new Error("full_name_en is required");
  }

  const updates: Record<string, unknown> = {
    full_name_en: fullName,
    full_name_ar: cleanString(payload.full_name_ar),
    title_en: cleanString(payload.title_en),
    title_ar: cleanString(payload.title_ar),
    gender: payload.gender || null,
    bio_en: cleanString(payload.bio_en),
    bio_ar: cleanString(payload.bio_ar),
    photo_url: cleanString(payload.photo_url),
    years_of_experience: payload.years_of_experience ?? null,
    consultation_fee: payload.consultation_fee ?? null,

    phone: cleanString(payload.phone),
    whatsapp_number: cleanString(payload.whatsapp_number),
    email: cleanString(payload.email),

    city_id: cleanString(payload.city_id),
    specialty_subcategory_id: payload.specialty_subcategory_id ?? null,

    clinic_name_en: cleanString(payload.clinic_name_en),
    clinic_name_ar: cleanString(payload.clinic_name_ar),
    clinic_phone: cleanString(payload.clinic_phone),
    clinic_email: cleanString(payload.clinic_email),
    clinic_website_url: cleanString(payload.clinic_website_url),
    clinic_whatsapp_number: cleanString(payload.clinic_whatsapp_number),
    clinic_address_line: cleanString(payload.clinic_address_line),
    clinic_google_maps_url: cleanString(payload.clinic_google_maps_url),
    clinic_logo_url: cleanString(payload.clinic_logo_url),
    clinic_cover_image_url: cleanString(payload.clinic_cover_image_url),
    clinic_short_description_en: cleanString(
      payload.clinic_short_description_en,
    ),
    clinic_short_description_ar: cleanString(
      payload.clinic_short_description_ar,
    ),
    clinic_full_description_en: cleanString(
      payload.clinic_full_description_en,
    ),
    clinic_full_description_ar: cleanString(
      payload.clinic_full_description_ar,
    ),

    is_featured: Boolean(payload.is_featured),
    is_active: payload.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (payload.slug !== undefined) {
    updates.slug = await generateUniqueDoctorSlug({
      requestedSlug: payload.slug,
      fullNameEn: fullName,
      existingDoctorId: id,
    });
  }

  if (payload.clinic_slug !== undefined) {
    updates.clinic_slug = payload.clinic_slug?.trim()
      ? normalizeSlug(payload.clinic_slug)
      : null;
  }

  const { data, error } = await supabase
    .from("health_doctors")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to update doctor");
  }

  return data;
}

export async function getAdminDoctorById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("health_doctors")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getCitiesForAdmin() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cities")
    .select("id, name_en, name_ar")
    .order("name_en", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function getHealthSpecialtiesForAdmin() {
  const supabase = await createClient();

  const { data: healthCategory, error: categoryError } = await supabase
    .from("service_categories")
    .select("id")
    .eq("slug", "health")
    .single();

  if (categoryError || !healthCategory) return [];

  const { data, error } = await supabase
    .from("service_subcategories")
    .select("id, name_en, name_ar")
    .eq("category_id", healthCategory.id)
    .eq("is_active", true)
    .order("name_en", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function getAdminDoctors() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("health_doctors")
    .select(`
      id,
      full_name_en,
      full_name_ar,
      slug,
      consultation_fee,
      phone,
      whatsapp_number,
      clinic_address_line,
      city_id,
      specialty_subcategory_id,
      is_active,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}