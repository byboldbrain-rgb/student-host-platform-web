import { notFound } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

type SpaceImageRow = {
  id: string
  image_url: string
  is_cover?: boolean | null
  sort_order?: number | null
}

type UnitImageRow = {
  id: string
  image_url: string
  is_cover?: boolean | null
  sort_order?: number | null
}

type UnitRow = {
  id: string
  name_en: string
  name_ar?: string | null
  unit_type: string
  description_en?: string | null
  description_ar?: string | null
  capacity?: number | null
  price_per_hour_egp: number
  min_booking_hours?: number | null
  max_booking_hours?: number | null
  is_active?: boolean | null
  coworking_space_unit_images?: UnitImageRow[] | null
}

export default async function CoWorkingSpaceDetailsPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const [{ data: space, error: spaceError }, { data: images, error: imagesError }, { data: units, error: unitsError }] =
    await Promise.all([
      supabase
        .from('coworking_spaces')
        .select(`
          id,
          slug,
          name_en,
          name_ar,
          short_description_en,
          short_description_ar,
          full_description_en,
          full_description_ar,
          address_line,
          phone,
          email,
          website_url,
          google_maps_url,
          whatsapp_number,
          logo_url,
          cover_image_url,
          opening_time,
          closing_time,
          price_starts_from_egp,
          cities (
            id,
            name_en,
            name_ar
          ),
          universities!coworking_spaces_primary_university_id_fkey (
            id,
            name_en,
            name_ar
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle(),

      supabase
        .from('coworking_space_images')
        .select('id, image_url, is_cover, sort_order')
        .order('sort_order', { ascending: true }),

      supabase
        .from('coworking_space_units')
        .select(`
          id,
          name_en,
          name_ar,
          unit_type,
          description_en,
          description_ar,
          capacity,
          price_per_hour_egp,
          min_booking_hours,
          max_booking_hours,
          is_active
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    ])

  if (spaceError) {
    throw new Error(spaceError.message)
  }

  if (imagesError) {
    throw new Error(imagesError.message)
  }

  if (unitsError) {
    throw new Error(unitsError.message)
  }

  if (!space) {
    notFound()
  }

  const { data: filteredImages, error: filteredImagesError } = await supabase
    .from('coworking_space_images')
    .select('id, image_url, is_cover, sort_order')
    .eq('space_id', space.id)
    .order('sort_order', { ascending: true })

  if (filteredImagesError) {
    throw new Error(filteredImagesError.message)
  }

  const { data: filteredUnits, error: filteredUnitsError } = await supabase
    .from('coworking_space_units')
    .select(`
      id,
      name_en,
      name_ar,
      unit_type,
      description_en,
      description_ar,
      capacity,
      price_per_hour_egp,
      min_booking_hours,
      max_booking_hours,
      is_active
    `)
    .eq('space_id', space.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (filteredUnitsError) {
    throw new Error(filteredUnitsError.message)
  }

  const unitIds = (filteredUnits || []).map((unit) => unit.id)

  let unitImagesMap = new Map<string, UnitImageRow[]>()

  if (unitIds.length > 0) {
    const { data: unitImages, error: unitImagesError } = await supabase
      .from('coworking_space_unit_images')
      .select('id, unit_id, image_url, is_cover, sort_order')
      .in('unit_id', unitIds)
      .order('sort_order', { ascending: true })

    if (unitImagesError) {
      throw new Error(unitImagesError.message)
    }

    unitImagesMap = new Map<string, UnitImageRow[]>()

    for (const image of unitImages || []) {
      const current = unitImagesMap.get((image as any).unit_id) || []
      current.push({
        id: image.id,
        image_url: image.image_url,
        is_cover: image.is_cover,
        sort_order: image.sort_order,
      })
      unitImagesMap.set((image as any).unit_id, current)
    }
  }

  const unitsWithImages: UnitRow[] = (filteredUnits || []).map((unit) => ({
    ...unit,
    coworking_space_unit_images: unitImagesMap.get(unit.id) || [],
  }))

  async function submitBookingRequest(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const payload = {
      space_id: String(formData.get('space_id') || '').trim(),
      unit_id: String(formData.get('unit_id') || '').trim() || null,
      customer_name: String(formData.get('customer_name') || '').trim(),
      customer_phone: String(formData.get('customer_phone') || '').trim() || null,
      customer_email: String(formData.get('customer_email') || '').trim() || null,
      customer_whatsapp: String(formData.get('customer_whatsapp') || '').trim() || null,
      booking_date: String(formData.get('booking_date') || '').trim(),
      start_time: String(formData.get('start_time') || '').trim(),
      end_time: String(formData.get('end_time') || '').trim(),
      notes: String(formData.get('notes') || '').trim() || null,
    }

    if (
      !payload.space_id ||
      !payload.customer_name ||
      !payload.booking_date ||
      !payload.start_time ||
      !payload.end_time
    ) {
      throw new Error('Missing required booking data.')
    }

    const { error } = await supabase.from('coworking_booking_requests').insert({
      ...payload,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-gray-800">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-4 md:px-6">
          <a
            href="/services/co-working-spaces"
            className="inline-flex rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Back to search
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-8">
            <section className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <div className="aspect-[16/8] w-full bg-gray-100">
                {space.cover_image_url ? (
                  <img
                    src={space.cover_image_url}
                    alt={space.name_en}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No cover image
                  </div>
                )}
              </div>

              <div className="p-6">
                <h1 className="text-3xl font-semibold text-gray-900">
                  {space.name_en || space.name_ar}
                </h1>

                {space.name_ar ? (
                  <p className="mt-2 text-lg text-gray-500">{space.name_ar}</p>
                ) : null}

                <p className="mt-4 text-sm text-gray-600">
                  {space.full_description_en ||
                    space.full_description_ar ||
                    space.short_description_en ||
                    space.short_description_ar ||
                    'Co-working space near your university.'}
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <InfoCard
                    label="City"
                    value={space.cities?.name_en || space.cities?.name_ar || '—'}
                  />
                  <InfoCard
                    label="University"
                    value={
                      space.universities?.name_en || space.universities?.name_ar || '—'
                    }
                  />
                  <InfoCard label="Address" value={space.address_line || '—'} />
                  <InfoCard
                    label="Working Hours"
                    value={`${space.opening_time || '—'} - ${space.closing_time || '—'}`}
                  />
                  <InfoCard label="Phone" value={space.phone || '—'} />
                  <InfoCard label="WhatsApp" value={space.whatsapp_number || '—'} />
                  <InfoCard label="Email" value={space.email || '—'} />
                  <InfoCard
                    label="Starts From"
                    value={
                      space.price_starts_from_egp != null
                        ? `${space.price_starts_from_egp} EGP / hour`
                        : '—'
                    }
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <div className="mb-5">
                <h2 className="text-2xl font-semibold text-gray-900">Place Images</h2>
              </div>

              {filteredImages && filteredImages.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredImages.map((image: SpaceImageRow) => (
                    <div
                      key={image.id}
                      className="overflow-hidden rounded-[24px] border border-gray-200 bg-gray-50"
                    >
                      <div className="aspect-[4/3]">
                        <img
                          src={image.image_url}
                          alt="Co-working image"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
                  No images added yet.
                </div>
              )}
            </section>

            <section className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <div className="mb-5">
                <h2 className="text-2xl font-semibold text-gray-900">Available Spaces Inside</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Each space can have its own details and hourly price.
                </p>
              </div>

              <div className="space-y-6">
                {unitsWithImages.map((unit) => {
                  const cover =
                    unit.coworking_space_unit_images?.find((img) => img.is_cover) ||
                    unit.coworking_space_unit_images?.[0]

                  return (
                    <div
                      key={unit.id}
                      className="overflow-hidden rounded-[28px] border border-gray-200"
                    >
                      <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
                        <div className="aspect-[4/3] bg-gray-100 lg:aspect-auto">
                          {cover ? (
                            <img
                              src={cover.image_url}
                              alt={unit.name_en}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-gray-400">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="p-5">
                          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">
                                {unit.name_en || unit.name_ar}
                              </h3>
                              {unit.name_ar ? (
                                <p className="mt-1 text-sm text-gray-500">{unit.name_ar}</p>
                              ) : null}
                            </div>

                            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              {unit.unit_type}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600">
                            {unit.description_en ||
                              unit.description_ar ||
                              'Book this unit for studying, working, or meetings.'}
                          </p>

                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <InfoCard
                              label="Capacity"
                              value={
                                unit.capacity != null ? `${unit.capacity} person(s)` : '—'
                              }
                            />
                            <InfoCard
                              label="Price"
                              value={`${unit.price_per_hour_egp} EGP / hour`}
                            />
                            <InfoCard
                              label="Booking Range"
                              value={`${unit.min_booking_hours || '—'} - ${
                                unit.max_booking_hours || '—'
                              } hr`}
                            />
                          </div>

                          {unit.coworking_space_unit_images &&
                          unit.coworking_space_unit_images.length > 1 ? (
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                              {unit.coworking_space_unit_images.slice(0, 3).map((image) => (
                                <div
                                  key={image.id}
                                  className="overflow-hidden rounded-2xl border border-gray-200"
                                >
                                  <div className="aspect-[4/3]">
                                    <img
                                      src={image.image_url}
                                      alt={unit.name_en}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {unitsWithImages.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
                    No units available yet.
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <aside>
            <div className="sticky top-6 rounded-[32px] border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <h2 className="text-2xl font-semibold text-gray-900">Book Now</h2>
              <p className="mt-2 text-sm text-gray-500">
                Send your request and the admin will contact you after checking availability.
              </p>

              <form action={submitBookingRequest} className="mt-6 space-y-4">
                <input type="hidden" name="space_id" value={space.id} />

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    name="customer_name"
                    required
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    name="customer_phone"
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    WhatsApp
                  </label>
                  <input
                    name="customer_whatsapp"
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    name="customer_email"
                    type="email"
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Choose Unit
                  </label>
                  <select
                    name="unit_id"
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
                    defaultValue=""
                  >
                    <option value="">General booking / no specific unit</option>
                    {unitsWithImages.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name_en} - {unit.price_per_hour_egp} EGP/hr
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Booking Date
                  </label>
                  <input
                    name="booking_date"
                    type="date"
                    required
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Start Time
                    </label>
                    <input
                      name="start_time"
                      type="time"
                      required
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      End Time
                    </label>
                    <input
                      name="end_time"
                      type="time"
                      required
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={4}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
                    placeholder="Any extra details about your booking request..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#175cd3] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1849a9]"
                >
                  Send Booking Request
                </button>
              </form>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-sm text-gray-900">{value}</p>
    </div>
  )
}