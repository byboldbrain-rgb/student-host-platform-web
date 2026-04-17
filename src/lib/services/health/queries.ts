import { createClient } from "../../supabase/server";
import type {
  HealthClinicSummary,
  HealthDoctorSpecialty,
  HealthDoctorSummary,
  HealthSpecialty,
} from "./types";

type RawDoctorRow = {
  id: string;
  slug: string | null;
  full_name_en: string;
  full_name_ar: string | null;
  title_en: string | null;
  title_ar: string | null;
  gender: "male" | "female" | null;
  bio_en: string | null;
  bio_ar: string | null;
  photo_url: string | null;
  years_of_experience: number | null;
  consultation_fee: number | null;
  rating_avg: number | null;
  rating_count: number | null;
  is_featured: boolean | null;
  is_active: boolean | null;

  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;

  city_id: string | null;
  specialty_subcategory_id: number | null;

  clinic_name_en: string | null;
  clinic_name_ar: string | null;
  clinic_slug: string | null;
  clinic_phone: string | null;
  clinic_email: string | null;
  clinic_website_url: string | null;
  clinic_whatsapp_number: string | null;
  clinic_address_line: string | null;
  clinic_google_maps_url: string | null;
  clinic_logo_url: string | null;
  clinic_cover_image_url: string | null;
  clinic_short_description_en: string | null;
  clinic_short_description_ar: string | null;
  clinic_full_description_en: string | null;
  clinic_full_description_ar: string | null;

  cities?:
    | {
        id?: string | null;
        name_en?: string | null;
        name_ar?: string | null;
      }
    | {
        id?: string | null;
        name_en?: string | null;
        name_ar?: string | null;
      }[]
    | null;

  service_subcategories?:
    | {
        id?: number | null;
        slug?: string | null;
        name_en?: string | null;
        name_ar?: string | null;
        icon?: string | null;
        category_id?: number | null;
        is_active?: boolean | null;
      }
    | {
        id?: number | null;
        slug?: string | null;
        name_en?: string | null;
        name_ar?: string | null;
        icon?: string | null;
        category_id?: number | null;
        is_active?: boolean | null;
      }[]
    | null;
};

type SearchHealthDoctorsParams = {
  q?: string;
  specialty?: string;
  city_id?: string;
  gender?: "male" | "female";
  page?: number;
  pageSize?: number;
};

export function mapSpecialty(row: any): HealthSpecialty {
  return {
    id: row.id,
    slug: row.slug,
    name_en: row.name_en,
    name_ar: row.name_ar,
    icon: row.icon ?? null,
  };
}

export function mapDoctorSpecialty(row: any): HealthDoctorSpecialty {
  return {
    id: row.subcategory_id ?? row.id,
    slug: row.slug,
    name_en: row.name_en,
    name_ar: row.name_ar,
    icon: row.icon ?? null,
    is_primary: row.is_primary ?? true,
  };
}

export function mapClinicSummary(row: any): HealthClinicSummary {
  return {
    provider_id: row.provider_id ?? row.id ?? row.doctor_id ?? 0,
    name_en: row.name_en ?? null,
    name_ar: row.name_ar ?? null,
    slug: row.slug ?? null,
    city_id: row.city_id ?? null,
    city_name_en: row.city_name_en ?? null,
    city_name_ar: row.city_name_ar ?? null,
    primary_university_id: row.primary_university_id ?? null,
    address_line: row.address_line ?? null,
    phone: row.phone ?? null,
    whatsapp_number: row.whatsapp_number ?? null,
    consultation_fee:
      typeof row.consultation_fee === "number" ? row.consultation_fee : null,
    discount_percentage:
      typeof row.discount_percentage === "number"
        ? row.discount_percentage
        : null,
    discount_title_en: row.discount_title_en ?? null,
    discount_title_ar: row.discount_title_ar ?? null,
  };
}

function pickRelationObject<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function buildDoctorSpecialties(
  doctor: RawDoctorRow,
  healthCategoryId: number | null,
): HealthDoctorSpecialty[] {
  const specialtyRow = pickRelationObject(doctor.service_subcategories);

  if (!specialtyRow) return [];
  if (specialtyRow.is_active === false) return [];

  if (
    healthCategoryId &&
    specialtyRow.category_id &&
    String(specialtyRow.category_id) !== String(healthCategoryId)
  ) {
    return [];
  }

  return [
    mapDoctorSpecialty({
      ...specialtyRow,
      subcategory_id: doctor.specialty_subcategory_id,
      is_primary: true,
    }),
  ];
}

function buildDoctorClinics(doctor: RawDoctorRow): HealthClinicSummary[] {
  const city = pickRelationObject(doctor.cities);

  const hasClinicData = Boolean(
    doctor.clinic_name_en ||
      doctor.clinic_name_ar ||
      doctor.clinic_phone ||
      doctor.clinic_whatsapp_number ||
      doctor.clinic_address_line ||
      doctor.city_id,
  );

  if (!hasClinicData) return [];

  return [
    mapClinicSummary({
      id: 0,
      name_en: doctor.clinic_name_en,
      name_ar: doctor.clinic_name_ar,
      slug: doctor.clinic_slug,
      city_id: doctor.city_id,
      city_name_en: city?.name_en ?? null,
      city_name_ar: city?.name_ar ?? null,
      address_line: doctor.clinic_address_line,
      phone: doctor.clinic_phone ?? doctor.phone,
      whatsapp_number:
        doctor.clinic_whatsapp_number ?? doctor.whatsapp_number,
      consultation_fee: doctor.consultation_fee,
    }),
  ];
}

export function mapDoctorSummary(
  doctor: RawDoctorRow,
  healthCategoryId: number | null,
): HealthDoctorSummary {
  const specialties = buildDoctorSpecialties(doctor, healthCategoryId);
  const clinics = buildDoctorClinics(doctor);

  return {
    id: doctor.id,
    slug: doctor.slug ?? doctor.id,
    full_name_en: doctor.full_name_en,
    full_name_ar: doctor.full_name_ar,
    title_en: doctor.title_en,
    title_ar: doctor.title_ar,
    gender: doctor.gender,
    bio_en: doctor.bio_en,
    bio_ar: doctor.bio_ar,
    photo_url: doctor.photo_url,
    years_of_experience: doctor.years_of_experience,
    consultation_fee: doctor.consultation_fee,
    rating_avg: Number(doctor.rating_avg ?? 0),
    rating_count: Number(doctor.rating_count ?? 0),
    is_featured: Boolean(doctor.is_featured),
    is_active: Boolean(doctor.is_active),
    specialties,
    clinics,
  };
}

function isHealthCategory(row: any) {
  const slug = String(row?.slug ?? "").toLowerCase().trim();
  const nameEn = String(row?.name_en ?? "").toLowerCase().trim();
  const nameAr = String(row?.name_ar ?? "").trim();

  return (
    slug === "health" ||
    slug === "medical" ||
    slug === "health-care" ||
    slug === "healthcare" ||
    nameEn === "health" ||
    nameEn === "medical" ||
    nameEn === "health care" ||
    nameAr === "الصحة" ||
    nameAr === "صحة" ||
    nameAr === "طبي"
  );
}

async function getHealthCategoryId() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("service_categories")
    .select("id, slug, name_en, name_ar, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const healthCategory = (categories ?? []).find(isHealthCategory);

  return healthCategory?.id ?? null;
}

export async function getHealthSpecialties(): Promise<HealthSpecialty[]> {
  const supabase = await createClient();
  const healthCategoryId = await getHealthCategoryId();

  if (!healthCategoryId) {
    return [];
  }

  const { data, error } = await supabase
    .from("service_subcategories")
    .select("id, slug, name_en, name_ar, icon")
    .eq("category_id", healthCategoryId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(mapSpecialty);
}

export async function getDoctorBySlug(
  slug: string,
): Promise<HealthDoctorSummary | null> {
  const supabase = await createClient();
  const healthCategoryId = await getHealthCategoryId();

  const { data: doctorRow, error: doctorError } = await supabase
    .from("health_doctors")
    .select(
      `
      id,
      slug,
      full_name_en,
      full_name_ar,
      title_en,
      title_ar,
      gender,
      bio_en,
      bio_ar,
      photo_url,
      years_of_experience,
      consultation_fee,
      rating_avg,
      rating_count,
      is_featured,
      is_active,
      phone,
      whatsapp_number,
      email,
      city_id,
      specialty_subcategory_id,
      clinic_name_en,
      clinic_name_ar,
      clinic_slug,
      clinic_phone,
      clinic_email,
      clinic_website_url,
      clinic_whatsapp_number,
      clinic_address_line,
      clinic_google_maps_url,
      clinic_logo_url,
      clinic_cover_image_url,
      clinic_short_description_en,
      clinic_short_description_ar,
      clinic_full_description_en,
      clinic_full_description_ar,
      cities (
        id,
        name_en,
        name_ar
      ),
      service_subcategories (
        id,
        slug,
        name_en,
        name_ar,
        icon,
        category_id,
        is_active
      )
    `,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (doctorError || !doctorRow) {
    return null;
  }

  return mapDoctorSummary(doctorRow as RawDoctorRow, healthCategoryId);
}

export async function searchHealthDoctors({
  q,
  specialty,
  city_id,
  gender,
  page = 1,
  pageSize = 12,
}: SearchHealthDoctorsParams): Promise<{
  items: HealthDoctorSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const supabase = await createClient();
  const healthCategoryId = await getHealthCategoryId();

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 12;

  let doctorsQuery = supabase
    .from("health_doctors")
    .select(
      `
      id,
      slug,
      full_name_en,
      full_name_ar,
      title_en,
      title_ar,
      gender,
      bio_en,
      bio_ar,
      photo_url,
      years_of_experience,
      consultation_fee,
      rating_avg,
      rating_count,
      is_featured,
      is_active,
      phone,
      whatsapp_number,
      email,
      city_id,
      specialty_subcategory_id,
      clinic_name_en,
      clinic_name_ar,
      clinic_slug,
      clinic_phone,
      clinic_email,
      clinic_website_url,
      clinic_whatsapp_number,
      clinic_address_line,
      clinic_google_maps_url,
      clinic_logo_url,
      clinic_cover_image_url,
      clinic_short_description_en,
      clinic_short_description_ar,
      clinic_full_description_en,
      clinic_full_description_ar,
      cities (
        id,
        name_en,
        name_ar
      ),
      service_subcategories (
        id,
        slug,
        name_en,
        name_ar,
        icon,
        category_id,
        is_active
      )
    `,
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("rating_avg", { ascending: false })
    .order("full_name_en", { ascending: true })
    .limit(500);

  if (q?.trim()) {
    const value = q.trim();
    doctorsQuery = doctorsQuery.or(
      `full_name_en.ilike.%${value}%,full_name_ar.ilike.%${value}%,title_en.ilike.%${value}%,title_ar.ilike.%${value}%,clinic_name_en.ilike.%${value}%,clinic_name_ar.ilike.%${value}%,clinic_address_line.ilike.%${value}%`,
    );
  }

  if (gender) {
    doctorsQuery = doctorsQuery.eq("gender", gender);
  }

  if (city_id?.trim()) {
    doctorsQuery = doctorsQuery.eq("city_id", city_id);
  }

  const { data: doctorsRows, error: doctorsError } = await doctorsQuery;

  if (doctorsError || !doctorsRows || doctorsRows.length === 0) {
    return {
      items: [],
      total: 0,
      page: safePage,
      pageSize: safePageSize,
      totalPages: 0,
    };
  }

  const doctors = (doctorsRows as RawDoctorRow[])
    .map((doctor) => mapDoctorSummary(doctor, healthCategoryId))
    .filter((doctor) => {
      if (specialty?.trim()) {
        const matchesSpecialty = doctor.specialties.some(
          (item) => item.slug === specialty,
        );
        if (!matchesSpecialty) return false;
      }

      if (city_id?.trim()) {
        if (doctor.clinics.length === 0) return false;
      }

      return true;
    });

  const total = doctors.length;
  const totalPages = total > 0 ? Math.ceil(total / safePageSize) : 0;
  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;
  const items = doctors.slice(start, end);

  return {
    items,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}