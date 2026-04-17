"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

type Activity = {
  id: string;
  slug: string;
  name_en: string;
  short_description_en?: string;
  logo_url?: string;
  cover_image_url?: string;
  university_name_en?: string;
  city_name_en?: string;
};

export default function StudentActivitiesSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const cityFromUrl = searchParams.get("city") || "";
  const universityFromUrl = searchParams.get("university") || "";

  const [cities, setCities] = useState<City[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedCity, setSelectedCity] = useState(cityFromUrl);
  const [selectedUniversity, setSelectedUniversity] = useState(universityFromUrl);
  const [metaLoading, setMetaLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(true);

  useEffect(() => {
    setSelectedCity(cityFromUrl);
    setSelectedUniversity(universityFromUrl);
  }, [cityFromUrl, universityFromUrl]);

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

  useEffect(() => {
    let isMounted = true;

    async function loadActivities() {
      try {
        setResultsLoading(true);

        const params = new URLSearchParams();

        if (cityFromUrl) {
          params.set("city", cityFromUrl);
        }

        if (universityFromUrl) {
          params.set("university", universityFromUrl);
        }

        const queryString = params.toString();
        const url = queryString
          ? `/api/student-activities?${queryString}`
          : "/api/student-activities";

        const res = await fetch(url, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (isMounted) {
            setActivities([]);
          }
          return;
        }

        const data = await res.json();

        if (isMounted) {
          setActivities(Array.isArray(data.items) ? data.items : []);
        }
      } catch {
        if (isMounted) {
          setActivities([]);
        }
      } finally {
        if (isMounted) {
          setResultsLoading(false);
        }
      }
    }

    loadActivities();

    return () => {
      isMounted = false;
    };
  }, [cityFromUrl, universityFromUrl]);

  const filteredUniversities = useMemo(() => {
    if (!selectedCity) return [];
    return universities.filter((university) => university.city_id === selectedCity);
  }, [universities, selectedCity]);

  useEffect(() => {
    if (!selectedCity) {
      if (selectedUniversity) {
        setSelectedUniversity("");
      }
      return;
    }

    const universityStillValid = filteredUniversities.some(
      (university) => university.id === selectedUniversity
    );

    if (!universityStillValid && selectedUniversity) {
      setSelectedUniversity("");
    }
  }, [selectedCity, selectedUniversity, filteredUniversities]);

  const selectedCityName =
    cities.find((city) => city.id === cityFromUrl)?.name_en || "";
  const selectedUniversityName =
    universities.find((university) => university.id === universityFromUrl)?.name_en || "";

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (selectedCity) {
      params.set("city", selectedCity);
    }

    if (selectedUniversity) {
      params.set("university", selectedUniversity);
    }

    const queryString = params.toString();
    router.push(
      queryString
        ? `/services/student-activities/search?${queryString}`
        : "/services/student-activities/search"
    );
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-500">
            Services / Student Activities / Search
          </p>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Find Student Activities
          </h1>
          <p className="text-sm text-slate-600">
            Filter by city and university to explore the available student
            activities.
          </p>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="city"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              City
            </label>
            <select
              id="city"
              name="city"
              value={selectedCity}
              onChange={(e) => {
                const cityId = e.target.value;
                setSelectedCity(cityId);
                setSelectedUniversity("");
              }}
              disabled={metaLoading}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="">
                {metaLoading ? "Loading cities..." : "Select city"}
              </option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name_en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="university"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              University
            </label>
            <select
              id="university"
              name="university"
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              disabled={!selectedCity || metaLoading}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="">
                {!selectedCity
                  ? "Select city first"
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

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Search
            </button>
          </div>
        </form>
      </section>

      <section className="mb-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Current filters:</span>

          {selectedCityName ? (
            <span className="rounded-full bg-slate-100 px-3 py-1">
              City: {selectedCityName}
            </span>
          ) : null}

          {selectedUniversityName ? (
            <span className="rounded-full bg-slate-100 px-3 py-1">
              University: {selectedUniversityName}
            </span>
          ) : null}

          {!selectedCityName && !selectedUniversityName ? (
            <span className="rounded-full bg-slate-100 px-3 py-1">
              No filters selected
            </span>
          ) : null}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Search Results
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {resultsLoading
                ? "Loading activities..."
                : `${activities.length} activit${
                    activities.length === 1 ? "y" : "ies"
                  } found`}
            </p>
          </div>
        </div>

        {resultsLoading ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              Loading activities
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Please wait while we fetch the student activities.
            </p>
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              No activities found
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Try changing the selected city or university and search again.
            </p>

            <Link
              href="/services/student-activities"
              className="mt-5 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to Student Activities
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                href={`/services/student-activities/${activity.slug}`}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="aspect-[16/9] bg-slate-100">
                  {activity.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activity.cover_image_url}
                      alt={activity.name_en}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="mb-3 flex items-center gap-3">
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
                      <h3 className="truncate text-lg font-semibold text-slate-900">
                        {activity.name_en}
                      </h3>
                      <p className="truncate text-sm text-slate-500">
                        {activity.university_name_en || "University"}
                      </p>
                    </div>
                  </div>

                  <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                    {activity.short_description_en ||
                      "Explore the latest events, announcements, and membership details."}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      {activity.city_name_en || "City"}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      View Details
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}