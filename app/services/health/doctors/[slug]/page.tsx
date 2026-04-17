import { getDoctorBySlug } from "@/src/lib/services/health/queries";
import type {
  HealthClinicSummary,
  HealthDoctorSpecialty,
} from "@/src/lib/services/health/types";
import BookingForm from "../../BookingForm";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function DoctorProfilePage({ params }: Props) {
  const { slug } = await params;
  const doctor = await getDoctorBySlug(slug);

  if (!doctor) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border p-8 text-sm text-gray-500">
          Doctor not found.
        </div>
      </main>
    );
  }

  const primarySpecialty =
    doctor.specialties.find(
      (item: HealthDoctorSpecialty) => item.is_primary,
    ) ?? doctor.specialties[0];

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-6">
        <div className="rounded-2xl border p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gray-100 text-sm text-gray-500">
              {doctor.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doctor.photo_url}
                  alt={doctor.full_name_en}
                  className="h-28 w-28 rounded-full object-cover"
                />
              ) : (
                "Doctor"
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold">{doctor.full_name_en}</h1>

              {doctor.title_en ? (
                <p className="mt-2 text-gray-700">{doctor.title_en}</p>
              ) : null}

              {primarySpecialty ? (
                <p className="mt-2 text-sm text-gray-600">
                  {primarySpecialty.name_en} · {primarySpecialty.name_ar}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                <span>Experience: {doctor.years_of_experience ?? "-"}</span>
                <span>
                  Rating: {doctor.rating_avg.toFixed(1)} ({doctor.rating_count})
                </span>
                <span>Fee: {doctor.consultation_fee ?? "Contact clinic"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border p-6">
          <h2 className="mb-3 text-xl font-semibold">About doctor</h2>
          <p className="whitespace-pre-line text-sm leading-7 text-gray-700">
            {doctor.bio_en || doctor.bio_ar || "No biography available yet."}
          </p>
        </div>

        <div className="rounded-2xl border p-6">
          <h2 className="mb-3 text-xl font-semibold">Specialties</h2>
          <div className="flex flex-wrap gap-2">
            {doctor.specialties.length ? (
              doctor.specialties.map((specialty: HealthDoctorSpecialty) => (
                <span
                  key={specialty.id}
                  className="rounded-full border px-3 py-1 text-sm"
                >
                  {specialty.name_en}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">
                No specialties added yet.
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border p-6">
          <h2 className="mb-3 text-xl font-semibold">Clinics</h2>

          {doctor.clinics.length ? (
            <div className="space-y-4">
              {doctor.clinics.map((clinic: HealthClinicSummary) => (
                <div key={clinic.provider_id} className="rounded-xl border p-4">
                  <div className="font-semibold">{clinic.name_en}</div>

                  {clinic.name_ar ? (
                    <div className="text-sm text-gray-600">{clinic.name_ar}</div>
                  ) : null}

                  {clinic.address_line ? (
                    <div className="mt-2 text-sm text-gray-500">
                      {clinic.address_line}
                    </div>
                  ) : null}

                  <div className="mt-2 text-sm text-gray-500">
                    Fee: {clinic.consultation_fee ?? doctor.consultation_fee ?? "-"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No clinics available yet.</div>
          )}
        </div>
      </section>

      <aside>
        <BookingForm
          doctorId={doctor.id}
          specialtySubcategoryId={primarySpecialty?.id ?? null}
          clinics={doctor.clinics.map((clinic: HealthClinicSummary) => ({
            provider_id: clinic.provider_id,
            name_en: clinic.name_en,
            consultation_fee: clinic.consultation_fee,
          }))}
        />
      </aside>
    </main>
  );
}