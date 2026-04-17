import { createClient } from "@/src/lib/supabase/server";
import { mergeScheduleSlots } from "./slots";
import { validateCreateHealthAppointmentInput } from "./validators";
import type { CreateHealthAppointmentInput } from "./types";

function getDayOfWeek(dateString: string): number {
  return new Date(dateString).getDay();
}

export async function getAvailableDoctorSlots(params: {
  doctorId: string;
  clinicProviderId: number;
  date: string;
}) {
  const supabase = await createClient();
  const dayOfWeek = getDayOfWeek(params.date);

  const { data: doctorClinicRows, error: clinicError } = await supabase
    .from("health_doctor_clinics")
    .select("id")
    .eq("doctor_id", params.doctorId)
    .eq("clinic_provider_id", params.clinicProviderId)
    .eq("is_active", true);

  if (clinicError || !doctorClinicRows?.length) return [];

  const doctorClinicIds = doctorClinicRows.map((row) => row.id);

  const { data: schedules } = await supabase
    .from("health_doctor_schedules")
    .select("id, doctor_clinic_id, day_of_week, is_active, start_time, end_time, slot_duration_minutes")
    .in("doctor_clinic_id", doctorClinicIds)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true);

  const { data: unavailable } = await supabase
    .from("health_doctor_unavailable_dates")
    .select("id")
    .eq("doctor_id", params.doctorId)
    .eq("clinic_provider_id", params.clinicProviderId)
    .eq("unavailable_date", params.date)
    .limit(1);

  if (unavailable && unavailable.length > 0) return [];

  const { data: appointments } = await supabase
    .from("health_appointments")
    .select("appointment_time")
    .eq("doctor_id", params.doctorId)
    .eq("clinic_provider_id", params.clinicProviderId)
    .eq("appointment_date", params.date)
    .in("status", ["pending", "confirmed"]);

  const bookedTimes = (appointments ?? []).map((row) => row.appointment_time);

  return mergeScheduleSlots(schedules ?? [], bookedTimes);
}

export async function createHealthAppointment(
  input: CreateHealthAppointmentInput,
) {
  const validationErrors = validateCreateHealthAppointmentInput(input);
  if (validationErrors.length) {
    throw new Error(validationErrors.join(", "));
  }

  const supabase = await createClient();

  const availableSlots = await getAvailableDoctorSlots({
    doctorId: input.doctor_id,
    clinicProviderId: input.clinic_provider_id,
    date: input.appointment_date,
  });

  const targetTime = input.appointment_time.slice(0, 5);
  const matchingSlot = availableSlots.find((slot) => slot.time === targetTime);

  if (!matchingSlot || !matchingSlot.available) {
    throw new Error("Selected time slot is not available");
  }

  const { data, error } = await supabase
    .from("health_appointments")
    .insert({
      doctor_id: input.doctor_id,
      clinic_provider_id: input.clinic_provider_id,
      specialty_subcategory_id: input.specialty_subcategory_id ?? null,
      patient_name: input.patient_name.trim(),
      patient_phone: input.patient_phone.trim(),
      patient_email: input.patient_email?.trim() || null,
      patient_whatsapp: input.patient_whatsapp?.trim() || null,
      appointment_date: input.appointment_date,
      appointment_time: targetTime,
      end_time: matchingSlot.end_time,
      booking_source: "website",
      status: "pending",
      notes: input.notes?.trim() || null,
    })
    .select("id, status")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create appointment");
  }

  return {
    success: true,
    appointment_id: data.id as string,
    status: data.status as "pending" | "confirmed",
    message: "Appointment booked successfully",
  };
}