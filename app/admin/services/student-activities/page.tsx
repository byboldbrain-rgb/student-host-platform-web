import Link from "next/link";

async function getStudentActivities() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/admin/student-activities`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export default async function AdminStudentActivitiesPage() {
  const activities = await getStudentActivities();

  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Admin / Services / Student Activities
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Student Activities
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage student activities, posts, join forms, and applications.
          </p>
        </div>

        <Link
          href="/admin/services/student-activities/new"
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Add New Activity
        </Link>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            All Activities
          </h2>
        </div>

        {activities.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-slate-500">
              No student activities found yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Activity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    University
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    City
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Featured
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {activities.map((activity: any) => (
                  <tr key={activity.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {activity.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={activity.logo_url}
                            alt={activity.name_en}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                            {activity.name_en?.slice(0, 1) || "A"}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {activity.name_en}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            {activity.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {activity.university_name_en || "-"}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {activity.city_name_en || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          activity.is_featured
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {activity.is_featured ? "Featured" : "Normal"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          activity.is_active
                            ? "bg-blue-100 text-blue-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {activity.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/services/student-activities/${activity.id}`}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </Link>

                        <Link
                          href={`/admin/services/student-activities/${activity.id}/posts`}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Posts
                        </Link>

                        <Link
                          href={`/admin/services/student-activities/${activity.id}/form`}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Form
                        </Link>

                        <Link
                          href={`/admin/services/student-activities/${activity.id}/applications`}
                          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          Applications
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}