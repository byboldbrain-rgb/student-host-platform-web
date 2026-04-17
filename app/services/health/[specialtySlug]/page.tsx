import { getHealthSpecialties, searchHealthDoctors } from "@/src/lib/services/health/queries";
import DoctorCard from "../DoctorCard";

type Props = {
  params: Promise<{
    specialtySlug: string;
  }>;
};

export default async function HealthSpecialtyPage({ params }: Props) {
  const { specialtySlug } = await params;

  const [specialties, doctorsResult] = await Promise.all([
    getHealthSpecialties(),
    searchHealthDoctors({
      specialty: specialtySlug,
      page: 1,
      pageSize: 12,
    }),
  ]);

  const specialty = specialties.find((item) => item.slug === specialtySlug);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-bold">
          {specialty?.name_en ?? specialtySlug}
        </h1>
        {specialty?.name_ar ? (
          <p className="mt-2 text-gray-600">{specialty.name_ar}</p>
        ) : null}
      </section>

      {doctorsResult.items.length === 0 ? (
        <div className="rounded-2xl border p-8 text-sm text-gray-500">
          No doctors found in this specialty yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {doctorsResult.items.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}
    </main>
  );
}