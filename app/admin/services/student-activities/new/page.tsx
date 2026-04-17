"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type City = {
  id: string;
  name_en: string;
  name_ar?: string;
};

type University = {
  id: string;
  city_id: string;
  name_en: string;
  name_ar?: string;
};

export default function CreateStudentActivityPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);

  const [cities, setCities] = useState<City[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [logoPreview, setLogoPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  const [form, setForm] = useState({
    name_en: "",
    name_ar: "",
    slug: "",
    city_id: "",
    university_id: "",
    short_description_en: "",
    full_description_en: "",
    is_featured: false,
    is_active: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadMeta() {
      try {
        setMetaLoading(true);

        const res = await fetch("/api/student-activities/meta", {
          cache: "no-store",
        });

        if (!res.ok) {
          if (isMounted) {
            setCities([]);
            setUniversities([]);
          }
          return;
        }

        const data = await res.json();

        if (isMounted) {
          setCities(Array.isArray(data.cities) ? data.cities : []);
          setUniversities(Array.isArray(data.universities) ? data.universities : []);
        }
      } catch {
        if (isMounted) {
          setCities([]);
          setUniversities([]);
        }
      } finally {
        if (isMounted) {
          setMetaLoading(false);
        }
      }
    }

    loadMeta();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUniversities = useMemo(() => {
    if (!form.city_id) return [];
    return universities.filter(
      (university) => university.city_id === form.city_id
    );
  }, [universities, form.city_id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target as HTMLInputElement;

    if (name === "city_id") {
      setForm((prev) => ({
        ...prev,
        city_id: value,
        university_id: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);

    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoPreview("");
    }
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setCoverFile(file);

    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
    }

    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    } else {
      setCoverPreview("");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const body = new FormData();

      body.append("name_en", form.name_en);
      body.append("name_ar", form.name_ar);
      body.append("slug", form.slug);
      body.append("city_id", form.city_id);
      body.append("university_id", form.university_id);
      body.append("short_description_en", form.short_description_en);
      body.append("full_description_en", form.full_description_en);
      body.append("is_featured", String(form.is_featured));
      body.append("is_active", String(form.is_active));

      if (logoFile) {
        body.append("logo", logoFile);
      }

      if (coverFile) {
        body.append("cover_image", coverFile);
      }

      const res = await fetch("/api/admin/student-activities", {
        method: "POST",
        body,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push(`/admin/services/student-activities/${data.item.id}`);
    } catch {
      alert("Failed to create activity");
    }

    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Create Student Activity
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Add a new student activity and configure its details.
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Name (EN)
            </label>
            <input
              name="name_en"
              value={form.name_en}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Name (AR)
            </label>
            <input
              name="name_ar"
              value={form.name_ar}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Slug
            </label>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Governorate / City
            </label>
            <select
              name="city_id"
              value={form.city_id}
              onChange={handleChange}
              required
              disabled={metaLoading}
              className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="">
                {metaLoading ? "Loading cities..." : "Select governorate"}
              </option>

              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name_en}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              University
            </label>
            <select
              name="university_id"
              value={form.university_id}
              onChange={handleChange}
              required
              disabled={!form.city_id || metaLoading}
              className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="">
                {!form.city_id
                  ? "Select governorate first"
                  : metaLoading
                  ? "Loading universities..."
                  : "Select university"}
              </option>

              {filteredUniversities.map((university) => (
                <option key={university.id} value={university.id}>
                  {university.name_en}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Short Description
          </label>
          <textarea
            name="short_description_en"
            value={form.short_description_en}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Full Description
          </label>
          <textarea
            name="full_description_en"
            value={form.full_description_en}
            onChange={handleChange}
            className="mt-2 min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Logo Upload
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="mt-2 block w-full rounded-2xl border px-4 py-3 text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium"
            />

            {logoPreview ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-28 w-28 rounded-2xl object-cover"
                />
              </div>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Cover Image Upload
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="mt-2 block w-full rounded-2xl border px-4 py-3 text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium"
            />

            {coverPreview ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="h-40 w-full rounded-2xl object-cover"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_featured"
              checked={form.is_featured}
              onChange={handleChange}
            />
            Featured
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            Active
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Creating..." : "Create Activity"}
        </button>
      </form>
    </main>
  );
}