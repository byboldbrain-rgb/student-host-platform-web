export type HealthDoctorGender = "male" | "female";

export type HealthAppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type HealthBookingSource =
  | "website"
  | "manual"
  | "call"
  | "whatsapp";

export type HealthSpecialty = {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  icon: string | null;
};

export type HealthClinicSummary = {
  provider_id: number;
  name_en: string;
  name_ar: string | null;
  slug: string | null;
  city_id: string | null;
  city_name_en: string | null;
  city_name_ar: string | null;
  primary_university_id: string | null;
  address_line: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  consultation_fee: number | null;
  discount_percentage: number | null;
  discount_title_en: string | null;
  discount_title_ar: string | null;
};

export type HealthDoctorSpecialty = HealthSpecialty & {
  is_primary?: boolean;
};

export type HealthDoctorSummary = {
  id: string;
  slug: string;
  full_name_en: string;
  full_name_ar: string | null;
  title_en: string | null;
  title_ar: string | null;
  gender: HealthDoctorGender | null;
  bio_en: string | null;
  bio_ar: string | null;
  photo_url: string | null;
  years_of_experience: number | null;
  consultation_fee: number | null;
  rating_avg: number;
  rating_count: number;
  is_featured: boolean;
  is_active: boolean;
  specialties: HealthDoctorSpecialty[];
  clinics: HealthClinicSummary[];
};

export type HealthDoctorSchedule = {
  id: number;
  doctor_clinic_id: number;
  day_of_week: number;
  is_active: boolean;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
};

export type AvailableSlot = {
  time: string;
  end_time: string;
  available: boolean;
};

export type HealthAppointment = {
  id: string;
  doctor_id: string;
  clinic_provider_id: number;
  specialty_subcategory_id: number | null;
  patient_name: string;
  patient_phone: string;
  patient_email: string | null;
  patient_whatsapp: string | null;
  appointment_date: string;
  appointment_time: string;
  end_time: string | null;
  booking_source: HealthBookingSource;
  status: HealthAppointmentStatus;
  notes: string | null;
  handled_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateHealthAppointmentInput = {
  doctor_id: string;
  clinic_provider_id: number;
  specialty_subcategory_id?: number | null;
  patient_name: string;
  patient_phone: string;
  patient_email?: string | null;
  patient_whatsapp?: string | null;
  appointment_date: string;
  appointment_time: string;
  notes?: string | null;
};

export type DoctorSearchFilters = {
  q?: string;
  specialty?: string;
  city_id?: string;
  cityId?: string;
  universityId?: string;
  gender?: HealthDoctorGender;
  availableToday?: boolean;
  page?: number;
  pageSize?: number;
};

export type SearchHealthDoctorsResult = {
  items: HealthDoctorSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};