import ClinicCard from "../../ClinicCard";
import { getPublicHealthClinics } from "@/src/lib/services/health/clinic-queries";

type ClinicListItem = {
  id: number;
  slug: string | null;
  name_en: string;
  name_ar: string | null;
  short_description_en?: string | null;
  address_line?: string | null;
  phone?: string | null;
};

export default async function HealthClinicsPage() {
  const clinics = await getPublicHealthClinics();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-bold">Health clinics</h1>
        <p className="mt-2 text-sm text-gray-600">
          Browse clinics and medical centers available in Health services.
        </p>
      </section>

      {clinics.length === 0 ? (
        <div className="rounded-2xl border p-8 text-sm text-gray-500">
          No clinics available yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clinics.map((clinic: ClinicListItem) => (
            <ClinicCard key={clinic.id} clinic={clinic} />
          ))}
        </div>
      )}
    </main>
  );
}