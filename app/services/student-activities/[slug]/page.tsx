import Link from "next/link";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getActivity(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/student-activities/${slug}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch {
    return null;
  }
}

export default async function StudentActivityDetailsPage({
  params,
}: PageProps) {
  const { slug } = await params;
  const activitySlug = decodeURIComponent(String(slug || "").trim());

  if (!activitySlug) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Activity not found
        </h1>
        <Link
          href="/services/student-activities"
          className="mt-6 inline-block text-slate-700 underline"
        >
          Back to activities
        </Link>
      </main>
    );
  }

  const data = await getActivity(activitySlug);

  if (!data || !data.activity) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Activity not found
        </h1>
        <Link
          href="/services/student-activities"
          className="mt-6 inline-block text-slate-700 underline"
        >
          Back to activities
        </Link>
      </main>
    );
  }

  const { activity, posts } = data;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-8 overflow-hidden rounded-3xl">
        <div className="aspect-[16/6] bg-slate-100">
          {activity.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activity.cover_image_url}
              alt={activity.name_en}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No cover image
            </div>
          )}
        </div>
      </div>

      <section className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {activity.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activity.logo_url}
              alt={activity.name_en}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">
              {activity.name_en?.slice(0, 1) || "A"}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              {activity.name_en}
            </h1>
            <p className="text-sm text-slate-500">
              {activity.university_name_en || "University"} •{" "}
              {activity.city_name_en || "City"}
            </p>
          </div>
        </div>

        <Link
          href={`/services/student-activities/${activity.slug}/join`}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {activity.join_button_text_en || "Join Us"}
        </Link>
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-xl font-semibold text-slate-900">
          About Activity
        </h2>
        <p className="text-sm leading-7 text-slate-600">
          {activity.full_description_en ||
            "No description available for this activity."}
        </p>
      </section>

      <section>
        <h2 className="mb-5 text-xl font-semibold text-slate-900">
          Latest Activities
        </h2>

        {(!posts || posts.length === 0) && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            No activities posted yet.
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {posts?.map((post: any) => (
            <div
              key={post.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="aspect-[16/9] bg-slate-100">
                {post.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.image_url}
                    alt={post.title_en}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    No image
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  {post.title_en}
                </h3>

                <p className="mb-3 line-clamp-3 text-sm text-slate-600">
                  {post.description_en}
                </p>

                {post.event_date && (
                  <p className="text-xs text-slate-400">
                    {new Date(post.event_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}