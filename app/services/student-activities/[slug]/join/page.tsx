import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getJoinPageData(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/student-activities/${slug}/join`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}

function renderField(question: any) {
  const commonClassName =
    "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500";

  switch (question.field_type) {
    case "textarea":
      return (
        <textarea
          id={question.question_key}
          name={`question_${question.id}`}
          required={question.is_required}
          placeholder={question.placeholder_en || ""}
          className={`${commonClassName} min-h-[120px] resize-none`}
        />
      );

    case "select":
      return (
        <select
          id={question.question_key}
          name={`question_${question.id}`}
          required={question.is_required}
          defaultValue=""
          className={commonClassName}
        >
          <option value="" disabled>
            {question.placeholder_en || "Select an option"}
          </option>

          {Array.isArray(question.options_json) &&
            question.options_json.map((option: any, index: number) => (
              <option
                key={`${question.id}-${index}`}
                value={option.value || option.label_en || option.label || ""}
              >
                {option.label_en || option.label || option.value || "Option"}
              </option>
            ))}
        </select>
      );

    case "date":
      return (
        <input
          id={question.question_key}
          name={`question_${question.id}`}
          type="date"
          required={question.is_required}
          className={commonClassName}
        />
      );

    case "number":
      return (
        <input
          id={question.question_key}
          name={`question_${question.id}`}
          type="number"
          required={question.is_required}
          placeholder={question.placeholder_en || ""}
          className={commonClassName}
        />
      );

    case "email":
      return (
        <input
          id={question.question_key}
          name={`question_${question.id}`}
          type="email"
          required={question.is_required}
          placeholder={question.placeholder_en || ""}
          className={commonClassName}
        />
      );

    case "phone":
      return (
        <input
          id={question.question_key}
          name={`question_${question.id}`}
          type="tel"
          required={question.is_required}
          placeholder={question.placeholder_en || ""}
          className={commonClassName}
        />
      );

    case "radio":
      return (
        <div className="space-y-3">
          {Array.isArray(question.options_json) &&
            question.options_json.map((option: any, index: number) => {
              const value =
                option.value || option.label_en || option.label || `option-${index}`;
              const label =
                option.label_en || option.label || option.value || "Option";

              return (
                <label
                  key={`${question.id}-${index}`}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value={value}
                    required={question.is_required}
                  />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              );
            })}
        </div>
      );

    case "checkbox":
      return (
        <div className="space-y-3">
          {Array.isArray(question.options_json) &&
            question.options_json.map((option: any, index: number) => {
              const value =
                option.value || option.label_en || option.label || `option-${index}`;
              const label =
                option.label_en || option.label || option.value || "Option";

              return (
                <label
                  key={`${question.id}-${index}`}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    name={`question_${question.id}`}
                    value={value}
                  />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              );
            })}
        </div>
      );

    case "text":
    default:
      return (
        <input
          id={question.question_key}
          name={`question_${question.id}`}
          type="text"
          required={question.is_required}
          placeholder={question.placeholder_en || ""}
          className={commonClassName}
        />
      );
  }
}

export default async function StudentActivityJoinPage({ params }: PageProps) {
  const { slug } = await params;
  const activitySlug = decodeURIComponent(String(slug || "").trim());

  if (!activitySlug) {
    notFound();
  }

  const data = await getJoinPageData(activitySlug);

  if (!data || !data.activity) {
    notFound();
  }

  const { activity, form, questions } = data;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href={`/services/student-activities/${activity.slug}`}
          className="text-sm font-medium text-slate-600 underline"
        >
          Back to activity
        </Link>
      </div>

      <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-4">
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
              {form?.title_en || `Join ${activity.name_en}`}
            </h1>
            <p className="text-sm text-slate-500">
              {activity.university_name_en || "University"} •{" "}
              {activity.city_name_en || "City"}
            </p>
          </div>
        </div>

        <p className="text-sm leading-7 text-slate-600">
          {form?.description_en ||
            "Fill in the form below to submit your request to join this student activity."}
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form
          action={`/api/student-activities/${activity.slug}/join`}
          method="POST"
          className="space-y-6"
        >
          <input type="hidden" name="activity_id" value={activity.id} />
          <input type="hidden" name="form_id" value={form?.id || ""} />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="full_name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder="Enter your full name"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="whatsapp"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                WhatsApp Number
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                placeholder="Enter your WhatsApp number"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
            </div>
          </div>

          {questions?.length > 0 ? (
            <div className="space-y-5 border-t border-slate-200 pt-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Additional Questions
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Please answer the following questions before submitting your
                  request.
                </p>
              </div>

              {questions.map((question: any) => (
                <div key={question.id}>
                  <label
                    htmlFor={question.question_key}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    {question.label_en}
                    {question.is_required ? (
                      <span className="text-red-500"> *</span>
                    ) : null}
                  </label>

                  {question.helper_text_en ? (
                    <p className="mb-2 text-xs text-slate-500">
                      {question.helper_text_en}
                    </p>
                  ) : null}

                  {renderField(question)}
                </div>
              ))}
            </div>
          ) : null}

          <div className="border-t border-slate-200 pt-6">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 md:w-auto"
            >
              Submit Join Request
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}