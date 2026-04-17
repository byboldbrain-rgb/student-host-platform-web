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
    is_primary: row.is_primary ?? false,
  };
}

export function mapClinicSummary(row: any): HealthClinicSummary {
  return {
    provider_id: row.provider_id ?? row.id,
    name_en: row.name_en,
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
export function mapDoctorSummary(
  doctor: RawDoctorRow,
  specialties: HealthDoctorSpecialty[] = [],
  clinics: HealthClinicSummary[] = [],
): HealthDoctorSummary {
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