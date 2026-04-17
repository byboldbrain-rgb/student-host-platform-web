"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

export default function EditStudentActivityPage() {
  const params = useParams();
  const activityId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState<{ cities: any[]; universities: any[] }>({
    cities: [],
    universities: [],
  });

  const [form, setForm] = useState({
    id: "",
    city_id: "",
    university_id: "",
    name_en: "",
    name_ar: "",
    slug: "",
    short_description_en: "",
    short_description_ar: "",
    full_description_en: "",
    full_description_ar: "",
    logo_url: "",
    cover_image_url: "",
    contact_email: "",
    contact_phone: "",
    contact_whatsapp: "",
    instagram_url: "",
    facebook_url: "",
    website_url: "",
    location_text: "",
    join_button_text_en: "Join Us",
    join_button_text_ar: "انضم إلينا",
    is_featured: false,
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    if (!activityId) {
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [activityRes, metaRes] = await Promise.all([
          fetch(`/api/admin/student-activities/${activityId}`, {
            cache: "no-store",
          }),
          fetch(`/api/student-activities/meta`, {
            cache: "no-store",
          }),
        ]);

        const activityData = await activityRes.json();
        const metaData = await metaRes.json();

        if (!activityRes.ok) {
          throw new Error(activityData.error || "Failed to load activity");
        }

        setMeta({
          cities: metaData.cities || [],
          universities: metaData.universities || [],
        });

        const item = activityData.item;

        setForm({
          id: item.id || "",
          city_id: item.city_id || "",
          university_id: item.university_id || "",
          name_en: item.name_en || "",
          name_ar: item.name_ar || "",
          slug: item.slug || "",
          short_description_en: item.short_description_en || "",
          short_description_ar: item.short_description_ar || "",
          full_description_en: item.full_description_en || "",
          full_description_ar: item.full_description_ar || "",
          logo_url: item.logo_url || "",
          cover_image_url: item.cover_image_url || "",
          contact_email: item.contact_email || "",
          contact_phone: item.contact_phone || "",
          contact_whatsapp: item.contact_whatsapp || "",
          instagram_url: item.instagram_url || "",
          facebook_url: item.facebook_url || "",
          website_url: item.website_url || "",
          location_text: item.location_text || "",
          join_button_text_en: item.join_button_text_en || "Join Us",
          join_button_text_ar: item.join_button_text_ar || "انضم إلينا",
          is_featured: Boolean(item.is_featured),
          is_active: Boolean(item.is_active),
          sort_order: Number(item.sort_order || 0),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load activity");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [activityId]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => {
      if (name === "city_id") {
        return {
          ...prev,
          city_id: value,
          university_id: "",
        };
      }

      return {
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : name === "sort_order"
            ? Number(value)
            : value,
      };
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!activityId) {
      setError("Invalid activity id");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const res = await fetch(`/api/admin/student-activities/${activityId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update activity");
      }

      alert("Activity updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update activity");
    } finally {
      setSaving(false);
    }
  }

  const filteredUniversities = useMemo(() => {
    return meta.universities.filter(
      (university) => !form.city_id || university.city_id === form.city_id
    );
  }, [meta.universities, form.city_id]);

  if (!activityId) {
    return (
      <main className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <p className="text-sm text-rose-700">Invalid activity id</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Loading activity...</p>
        </div>
      </main>
    );
  }

  if (error && !form.id) {
    return (
      <main className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Admin / Services / Student Activities / Edit
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Edit Student Activity
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Update activity details, contact info, media, and visibility.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/services/student-activities/${activityId}/posts`}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Manage Posts
          </Link>

          <Link
            href={`/admin/services/student-activities/${activityId}/form`}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Manage Form
          </Link>

          <Link
            href={`/admin/services/student-activities/${activityId}/applications`}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            View Applications
          </Link>
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{error}</p>
        </section>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Name (EN) *
              </label>
              <input
                name="name_en"
                value={form.name_en}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Name (AR) *
              </label>
              <input
                name="name_ar"
                value={form.name_ar}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Slug *
              </label>
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Sort Order
              </label>
              <input
                name="sort_order"
                type="number"
                value={form.sort_order}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                City *
              </label>
              <select
                name="city_id"
                value={form.city_id}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Select city</option>
                {meta.cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                University *
              </label>
              <select
                name="university_id"
                value={form.university_id}
                onChange={handleChange}
                required
                disabled={!form.city_id}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">
                  {!form.city_id ? "Select city first" : "Select university"}
                </option>
                {filteredUniversities.map((university) => (
                  <option key={university.id} value={university.id}>
                    {university.name_en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Descriptions
          </h2>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Short Description (EN)
            </label>
            <textarea
              name="short_description_en"
              value={form.short_description_en}
              onChange={handleChange}
              className="min-h-[90px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Short Description (AR)
            </label>
            <textarea
              name="short_description_ar"
              value={form.short_description_ar}
              onChange={handleChange}
              className="min-h-[90px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Full Description (EN)
            </label>
            <textarea
              name="full_description_en"
              value={form.full_description_en}
              onChange={handleChange}
              className="min-h-[140px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Full Description (AR)
            </label>
            <textarea
              name="full_description_ar"
              value={form.full_description_ar}
              onChange={handleChange}
              className="min-h-[140px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Media & Contact
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Logo URL
              </label>
              <input
                name="logo_url"
                value={form.logo_url}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Cover Image URL
              </label>
              <input
                name="cover_image_url"
                value={form.cover_image_url}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Contact Email
              </label>
              <input
                name="contact_email"
                type="email"
                value={form.contact_email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Contact Phone
              </label>
              <input
                name="contact_phone"
                value={form.contact_phone}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Contact WhatsApp
              </label>
              <input
                name="contact_whatsapp"
                value={form.contact_whatsapp}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Website URL
              </label>
              <input
                name="website_url"
                value={form.website_url}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Instagram URL
              </label>
              <input
                name="instagram_url"
                value={form.instagram_url}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Facebook URL
              </label>
              <input
                name="facebook_url"
                value={form.facebook_url}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Location Text
            </label>
            <input
              name="location_text"
              value={form.location_text}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Join Button & Visibility
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Join Button Text (EN)
              </label>
              <input
                name="join_button_text_en"
                value={form.join_button_text_en}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Join Button Text (AR)
              </label>
              <input
                name="join_button_text_ar"
                value={form.join_button_text_ar}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_featured"
                checked={form.is_featured}
                onChange={handleChange}
              />
              Featured Activity
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              Active
            </label>
          </div>
        </section>

        <div className="border-t border-slate-200 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </main>
  );
}