"use client";

import { useEffect, useMemo, useState } from "react";
import AvailableSlots from "./AvailableSlots";
import type { AvailableSlot } from "@/src/lib/services/health/types";

type ClinicOption = {
  provider_id: number;
  name_en: string;
  consultation_fee: number | null;
};

type Props = {
  doctorId: string;
  specialtySubcategoryId?: number | null;
  clinics: ClinicOption[];
};

export default function BookingForm({
  doctorId,
  specialtySubcategoryId,
  clinics,
}: Props) {
  const defaultClinicId = clinics[0]?.provider_id ?? 0;

  const [clinicProviderId, setClinicProviderId] = useState<number>(defaultClinicId);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientWhatsapp, setPatientWhatsapp] = useState("");
  const [notes, setNotes] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canLoadSlots = useMemo(
    () => Boolean(doctorId && clinicProviderId && appointmentDate),
    [doctorId, clinicProviderId, appointmentDate],
  );

  useEffect(() => {
    async function loadSlots() {
      if (!canLoadSlots) {
        setSlots([]);
        return;
      }

      setSlotsLoading(true);
      setErrorMessage(null);
      setSelectedTime("");

      try {
        const response = await fetch(
          `/api/health/doctors/${doctorId}/slots?clinicProviderId=${clinicProviderId}&date=${appointmentDate}`,
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load slots");
        }

        setSlots(data.slots ?? []);
      } catch (error) {
        setSlots([]);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load slots",
        );
      } finally {
        setSlotsLoading(false);
      }
    }

    void loadSlots();
  }, [canLoadSlots, clinicProviderId, appointmentDate, doctorId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitLoading(true);
    setErrorMessage(null);
    setMessage(null);

    try {
      const response = await fetch("/api/health/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctor_id: doctorId,
          clinic_provider_id: clinicProviderId,
          specialty_subcategory_id: specialtySubcategoryId ?? null,
          patient_name: patientName,
          patient_phone: patientPhone,
          patient_email: patientEmail || null,
          patient_whatsapp: patientWhatsapp || null,
          appointment_date: appointmentDate,
          appointment_time: selectedTime,
          notes: notes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to book appointment");
      }

      setMessage(data.message || "Appointment booked successfully");
      setSelectedTime("");
      setPatientName("");
      setPatientPhone("");
      setPatientEmail("");
      setPatientWhatsapp("");
      setNotes("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to book appointment",
      );
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border p-5">
      <div>
        <h2 className="text-xl font-semibold">Book appointment</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Clinic</label>
          <select
            value={clinicProviderId}
            onChange={(e) => setClinicProviderId(Number(e.target.value))}
            className="w-full rounded-xl border px-4 py-3 outline-none"
          >
            {clinics.map((clinic) => (
              <option key={clinic.provider_id} value={clinic.provider_id}>
                {clinic.name_en}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Date</label>
          <input
            type="date"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
          />
        </div>
      </div>

      {slotsLoading ? (
        <div className="rounded-xl border p-4 text-sm text-gray-500">
          Loading available slots...
        </div>
      ) : (
        <AvailableSlots
          slots={slots}
          selectedTime={selectedTime}
          onSelect={setSelectedTime}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Full name</label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Phone</label>
          <input
            type="text"
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={patientEmail}
            onChange={(e) => setPatientEmail(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">WhatsApp</label>
          <input
            type="text"
            value={patientWhatsapp}
            onChange={(e) => setPatientWhatsapp(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full rounded-xl border px-4 py-3 outline-none"
        />
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitLoading || !selectedTime}
        className="rounded-xl border px-5 py-3 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitLoading ? "Booking..." : "Confirm booking"}
      </button>
    </form>
  );
}