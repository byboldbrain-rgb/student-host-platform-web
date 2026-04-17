import Link from "next/link";

type Props = {
  clinic: {
    id: number;
    slug: string | null;
    name_en: string;
    name_ar: string | null;
    short_description_en?: string | null;
    address_line?: string | null;
    phone?: string | null;
  };
};

export default function ClinicCard({ clinic }: Props) {
  return (
    <article className="rounded-2xl border p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-lg font-semibold">{clinic.name_en}</h3>
        {clinic.name_ar ? (
          <p className="text-sm text-gray-500">{clinic.name_ar}</p>
        ) : null}
      </div>

      {clinic.short_description_en ? (
        <p className="mb-3 line-clamp-3 text-sm text-gray-600">
          {clinic.short_description_en}
        </p>
      ) : null}

      <div className="space-y-1 text-sm text-gray-500">
        <div>{clinic.address_line || "Address not specified"}</div>
        <div>{clinic.phone || "Phone not specified"}</div>
      </div>

      <div className="mt-4">
        <Link
          href={`/services/health/clinics/${clinic.slug}`}
          className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          View clinic
        </Link>
      </div>
    </article>
  );
}