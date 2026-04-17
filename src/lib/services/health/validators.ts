import type {
  CreateHealthAppointmentInput,
  DoctorSearchFilters,
} from "./types";
import { DEFAULT_HEALTH_PAGE_SIZE } from "./constants";

export function normalizeDoctorSearchFilters(
  input: DoctorSearchFilters,
): Required<Pick<DoctorSearchFilters, "page" | "pageSize">> & DoctorSearchFilters {
  const page =
    typeof input.page === "number" && input.page > 0 ? Math.floor(input.page) : 1;

  const pageSize =
    typeof input.pageSize === "number" && input.pageSize > 0
      ? Math.min(Math.floor(input.pageSize), 50)
      : DEFAULT_HEALTH_PAGE_SIZE;

  return {
    ...input,
    q: input.q?.trim() || undefined,
    specialty: input.specialty?.trim() || undefined,
    cityId: input.cityId?.trim() || undefined,
    universityId: input.universityId?.trim() || undefined,
    gender: input.gender || undefined,
    availableToday: Boolean(input.availableToday),
    page,
    pageSize,
  };
}

export function validateCreateHealthAppointmentInput(
  input: CreateHealthAppointmentInput,
): string[] {
  const errors: string[] = [];

  if (!input.doctor_id?.trim()) errors.push("doctor_id is required");
  if (!input.clinic_provider_id) errors.push("clinic_provider_id is required");
  if (!input.patient_name?.trim()) errors.push("patient_name is required");
  if (!input.patient_phone?.trim()) errors.push("patient_phone is required");
  if (!input.appointment_date?.trim()) errors.push("appointment_date is required");
  if (!input.appointment_time?.trim()) errors.push("appointment_time is required");

  if (input.patient_email && !/^\S+@\S+\.\S+$/.test(input.patient_email)) {
    errors.push("patient_email is invalid");
  }

  if (input.appointment_date && !/^\d{4}-\d{2}-\d{2}$/.test(input.appointment_date)) {
    errors.push("appointment_date must be YYYY-MM-DD");
  }

  if (input.appointment_time && !/^\d{2}:\d{2}(:\d{2})?$/.test(input.appointment_time)) {
    errors.push("appointment_time must be HH:mm or HH:mm:ss");
  }

  return errors;
}