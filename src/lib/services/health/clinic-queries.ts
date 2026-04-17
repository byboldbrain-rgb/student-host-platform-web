import { createClient } from "@/src/lib/supabase/server";

type ClinicDoctor = {
  id: string;
  slug: string;
  full_name_en: string;
  title_en: string | null;
  consultation_fee: number | null;
};

export async function getPublicHealthClinics() {
  const supabase = await createClient();

  const { data: category, error: categoryError } = await supabase
    .from("service_categories")
    .select("id")
    .eq("slug", "health")
    .single();

  if (categoryError || !category) return [];

  const { data, error } = await supabase
    .from("service_providers")
    .select(`
      id,
      slug,
      name_en,
      name_ar,
      short_description_en,
      address_line,
      phone
    `)
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function getClinicBySlugPublic(slug: string) {
  const supabase = await createClient();

  const { data: clinic, error } = await supabase
    .from("service_providers")
    .select(`
      id,
      name_en,
      name_ar,
      slug,
      short_description_en,
      short_description_ar,
      full_description_en,
      full_description_ar,
      phone,
      email,
      website_url,
      address_line,
      google_maps_url,
      logo_url,
      cover_image_url,
      whatsapp_number,
      is_active
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !clinic) return null;

  const { data: doctorLinks } = await supabase
    .from("health_doctor_clinics")
    .select(`
      consultation_fee,
      health_doctors!inner (
        id,
        slug,
        full_name_en,
        title_en,
        consultation_fee,
        is_active
      )
    `)
    .eq("clinic_provider_id", clinic.id)
    .eq("is_active", true);

  const doctors: ClinicDoctor[] = (doctorLinks ?? [])
    .map((row: any) => {
      const doctor = Array.isArray(row.health_doctors)
        ? row.health_doctors[0]
        : row.health_doctors;

      if (!doctor || !doctor.is_active) return null;

      return {
        id: doctor.id,
        slug: doctor.slug,
        full_name_en: doctor.full_name_en,
        title_en: doctor.title_en,
        consultation_fee: row.consultation_fee ?? doctor.consultation_fee ?? null,
      };
    })
    .filter((doctor): doctor is ClinicDoctor => doctor !== null);

  return {
    ...clinic,
    doctors,
  };
}