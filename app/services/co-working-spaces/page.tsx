import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'

type SearchParams = Promise<{
  city?: string
  university?: string
}>

type CityRow = {
  id: string
  name_en: string
  name_ar?: string | null
}

type UniversityRow = {
  id: string
  name_en: string
  name_ar?: string | null
  city_id?: string | null
}

type CoworkingSpaceRow = {
  id: string
  slug: string
  name_en: string
  name_ar?: string | null
  short_description_en?: string | null
  short_description_ar?: string | null
  address_line?: string | null
  phone?: string | null
  whatsapp_number?: string | null
  logo_url?: string | null
  cover_image_url?: string | null
  price_starts_from_egp?: number | null
  is_featured?: boolean | null
  city_name_en?: string | null
  city_name_ar?: string | null
  primary_university_name_en?: string | null
  primary_university_name_ar?: string | null
}

function BrandLogo() {
  return (
    <img
      src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
      alt="Navienty"
      className="h-auto w-[120px] object-contain md:w-[145px]"
    />
  )
}

export default async function CoWorkingSpacesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const selectedCity = params.city || ''
  const selectedUniversity = params.university || ''

  const supabase = await createClient()

  const [{ data: cities, error: citiesError }, { data: universities, error: universitiesError }] =
    await Promise.all([
      supabase.from('cities').select('id, name_en, name_ar').order('name_en'),
      supabase
        .from('universities')
        .select('id, name_en, name_ar, city_id')
        .order('name_en'),
    ])

  if (citiesError) {
    throw new Error(citiesError.message)
  }

  if (universitiesError) {
    throw new Error(universitiesError.message)
  }

  let spaces: CoworkingSpaceRow[] = []

  if (selectedCity && selectedUniversity) {
    const { data, error } = await supabase.rpc('search_coworking_spaces_for_university', {
      p_city_id: selectedCity,
      p_university_id: selectedUniversity,
    })

    if (error) {
      throw new Error(error.message)
    }

    spaces = (data || []) as CoworkingSpaceRow[]
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-gray-800">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center">
            <BrandLogo />
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/services"
              className="rounded-full border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Back to Services
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
        <div className="mb-8 rounded-[32px] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#175cd3]">
              Services
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900">
              Co-working Spaces
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Choose your city and university to find co-working spaces near your campus.
            </p>
          </div>

          <form method="GET" className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                City
              </label>
              <select
                name="city"
                defaultValue={selectedCity}
                required
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
              >
                <option value="">Select city</option>
                {(cities as CityRow[]).map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name_en || city.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                University
              </label>
              <select
                name="university"
                defaultValue={selectedUniversity}
                required
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
              >
                <option value="">Select university</option>
                {(universities as UniversityRow[]).map((university) => (
                  <option key={university.id} value={university.id}>
                    {university.name_en || university.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-2xl bg-[#175cd3] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1849a9]"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {selectedCity && selectedUniversity ? (
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Results</h2>
              <p className="mt-1 text-sm text-gray-500">
                Found {spaces.length} co-working space(s).
              </p>
            </div>

            {spaces.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {spaces.map((space) => (
                  <Link
                    key={space.id}
                    href={`/services/co-working-spaces/${space.slug}`}
                    className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition hover:-translate-y-1"
                  >
                    <div className="aspect-[16/9] w-full bg-gray-100">
                      {space.cover_image_url ? (
                        <img
                          src={space.cover_image_url}
                          alt={space.name_en}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {space.name_en || space.name_ar}
                          </h3>
                          {space.name_ar ? (
                            <p className="mt-1 text-sm text-gray-500">{space.name_ar}</p>
                          ) : null}
                        </div>

                        {space.is_featured ? (
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            Featured
                          </span>
                        ) : null}
                      </div>

                      <p className="text-sm text-gray-600">
                        {space.short_description_en ||
                          space.short_description_ar ||
                          'Co-working space near your university.'}
                      </p>

                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <p>
                          <span className="font-medium text-gray-800">City:</span>{' '}
                          {space.city_name_en || space.city_name_ar || '—'}
                        </p>
                        <p>
                          <span className="font-medium text-gray-800">University:</span>{' '}
                          {space.primary_university_name_en ||
                            space.primary_university_name_ar ||
                            '—'}
                        </p>
                        <p>
                          <span className="font-medium text-gray-800">Address:</span>{' '}
                          {space.address_line || '—'}
                        </p>
                        <p>
                          <span className="font-medium text-gray-800">Starts from:</span>{' '}
                          {space.price_starts_from_egp != null
                            ? `${space.price_starts_from_egp} EGP / hour`
                            : '—'}
                        </p>
                      </div>

                      <div className="mt-5">
                        <span className="inline-flex rounded-full bg-[#175cd3] px-4 py-2 text-sm font-semibold text-white">
                          View details
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
                No co-working spaces found for the selected city and university.
              </div>
            )}
          </section>
        ) : (
          <div className="rounded-[28px] border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
            Choose a city and university, then press Search.
          </div>
        )}
      </section>
    </main>
  )
}