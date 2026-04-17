import { createClient } from "@/src/lib/supabase/server";

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

async function getHealthCategoryId() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_categories")
    .select("id")
    .eq("slug", "health")
    .single();

  if (error || !data) {
    throw new Error("Health category not found");
  }

  return data.id as number;
}

export async function createHealthClinic(payload: any) {
  const supabase = await createClient();
  const categoryId = await getHealthCategoryId();

  if (!payload.name_en?.trim()) {
    throw new Error("name_en is required");
  }

  const slug = payload.slug?.trim()
    ? normalizeSlug(payload.slug)
    : normalizeSlug(payload.name_en);

  const { data, error } = await supabase
    .from("service_providers")
    .insert({
      category_id: categoryId,
      name_en: payload.name_en.trim(),
      name_ar: payload.name_ar?.trim() || null,
      slug,
      short_description_en: payload.short_description_en?.trim() || null,
      short_description_ar: payload.short_description_ar?.trim() || null,
      full_description_en: payload.full_description_en?.trim() || null,
      full_description_ar: payload.full_description_ar?.trim() || null,
      phone: payload.phone?.trim() || null,
      email: payload.email?.trim() || null,
      website_url: payload.website_url?.trim() || null,
      address_line: payload.address_line?.trim() || null,
      google_maps_url: payload.google_maps_url?.trim() || null,
      logo_url: payload.logo_url?.trim() || null,
      cover_image_url: payload.cover_image_url?.trim() || null,
      whatsapp_number: payload.whatsapp_number?.trim() || null,
      is_featured: Boolean(payload.is_featured),
      is_active: payload.is_active ?? true,
      extra_data: {
        provider_type: "clinic",
      },
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create clinic");
  }

  return data;
}

export async function updateHealthClinic(id: string, payload: any) {
  const supabase = await createClient();

  if (!id) {
    throw new Error("Clinic id is required");
  }

  const updates: Record<string, unknown> = {
    name_en: payload.name_en?.trim(),
    name_ar: payload.name_ar?.trim() || null,
    short_description_en: payload.short_description_en?.trim() || null,
    short_description_ar: payload.short_description_ar?.trim() || null,
    full_description_en: payload.full_description_en?.trim() || null,
    full_description_ar: payload.full_description_ar?.trim() || null,
    phone: payload.phone?.trim() || null,
    email: payload.email?.trim() || null,
    website_url: payload.website_url?.trim() || null,
    address_line: payload.address_line?.trim() || null,
    google_maps_url: payload.google_maps_url?.trim() || null,
    logo_url: payload.logo_url?.trim() || null,
    cover_image_url: payload.cover_image_url?.trim() || null,
    whatsapp_number: payload.whatsapp_number?.trim() || null,
    is_featured: Boolean(payload.is_featured),
    is_active: payload.is_active ?? true,
  };

  if (payload.slug !== undefined) {
    updates.slug = payload.slug?.trim()
      ? normalizeSlug(payload.slug)
      : null;
  }

  const { data, error } = await supabase
    .from("service_providers")
    .update(updates)
    .eq("id", Number(id))
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to update clinic");
  }

  return data;
}