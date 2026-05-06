import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase/server'
import { requirePropertiesSectionAccess } from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

type CityRow = {
  id: string
  name_en: string
  name_ar: string
}

type PropertyAreaRow = {
  id: string
  city_id: string
  name_en: string
  name_ar: string | null
  is_active: boolean
  sort_order: number | null
}

const primaryButtonClass =
  'inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_12px_26px_rgba(37,99,235,0.28)]'

const secondaryButtonClass =
  'inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-300 hover:bg-[#fafafa]'

const inputClass =
  'h-14 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-[#222222] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

function getString(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
}

function getStringArray(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value || '').trim())
    .filter(Boolean)
}

function BrandLogo() {
  return (
    <Link href="/admin" className="navienty-logo" aria-label="Navienty admin home">
      <img
        src="https://i.ibb.co/p6CBgjz0/Navienty-13.png"
        alt="Navienty icon"
        className="navienty-logo-icon"
      />
      <span className="navienty-logo-text-wrap">
        <img
          src="https://i.ibb.co/kVC7z9x7/Navienty-15.png"
          alt="Navienty"
          className="navienty-logo-text"
        />
      </span>
    </Link>
  )
}

function MobileBottomNavItem({
  href,
  label,
  isPrimary = false,
}: {
  href: string
  label: string
  isPrimary?: boolean
}) {
  return (
    <Link
      href={href}
      className={[
        'flex min-h-[52px] items-center justify-center rounded-2xl px-3 text-center text-[11px] font-semibold leading-tight transition-all duration-200',
        isPrimary
          ? 'border border-blue-600 bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]'
          : 'border border-gray-200 bg-white text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.05)]',
      ].join(' ')}
    >
      {label}
    </Link>
  )
}

export default async function NewUniversityPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>
}) {
  await requirePropertiesSectionAccess()

  const supabase = await createClient()

  const { data: citiesData, error: citiesError } = await supabase
    .from('cities')
    .select('id, name_en, name_ar')
    .order('name_en', { ascending: true })

  if (citiesError) {
    throw new Error(citiesError.message)
  }

  const { data: areasData, error: areasError } = await supabase
    .from('property_areas')
    .select('id, city_id, name_en, name_ar, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name_en', { ascending: true })

  if (areasError) {
    throw new Error(areasError.message)
  }

  const cities = (citiesData || []) as CityRow[]
  const areas = (areasData || []) as PropertyAreaRow[]

  async function createUniversityAction(formData: FormData) {
    'use server'

    await requirePropertiesSectionAccess()

    const city_id = getString(formData, 'city_id')
    const name_en = getString(formData, 'name_en')
    const name_ar = getString(formData, 'name_ar')
    const selectedAreaIds = getStringArray(formData, 'area_ids')

    if (!city_id || !name_en || !name_ar) {
      redirect('/admin/universities/new?error=Please fill all required fields')
    }

    const supabase = await createClient()

    let validAreaIds: string[] = []

    if (selectedAreaIds.length > 0) {
      const { data: validAreasData, error: validAreasError } = await supabase
        .from('property_areas')
        .select('id')
        .eq('city_id', city_id)
        .eq('is_active', true)
        .in('id', selectedAreaIds)

      if (validAreasError) {
        redirect(
          `/admin/universities/new?error=${encodeURIComponent(
            validAreasError.message
          )}`
        )
      }

      validAreaIds = (validAreasData || []).map((area) => String(area.id))

      if (validAreaIds.length !== selectedAreaIds.length) {
        redirect(
          '/admin/universities/new?error=Some selected areas do not belong to the selected city'
        )
      }
    }

    const { data: createdUniversity, error: universityError } = await supabase
      .from('universities')
      .insert({
        city_id,
        name_en,
        name_ar,
      })
      .select('id')
      .single()

    if (universityError) {
      redirect(
        `/admin/universities/new?error=${encodeURIComponent(
          universityError.message
        )}`
      )
    }

    if (!createdUniversity?.id) {
      redirect('/admin/universities/new?error=University was not created')
    }

    if (validAreaIds.length > 0) {
      const rows = validAreaIds.map((area_id) => ({
        university_id: createdUniversity.id,
        area_id,
      }))

      const { error: universityAreasError } = await supabase
        .from('university_property_areas')
        .insert(rows)

      if (universityAreasError) {
        redirect(
          `/admin/universities/new?error=${encodeURIComponent(
            universityAreasError.message
          )}`
        )
      }
    }

    revalidatePath('/admin/properties')
    revalidatePath('/admin/universities/new')
    redirect('/admin/properties')
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const errorMessage = resolvedSearchParams?.error

  const areasByCityId = areas.reduce<Record<string, PropertyAreaRow[]>>(
    (acc, area) => {
      const key = String(area.city_id)

      if (!acc[key]) {
        acc[key] = []
      }

      acc[key].push(area)

      return acc
    },
    {}
  )

  return (
    <>
      <style>{`
        .navienty-logo {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          overflow: visible;
          transform: none;
          margin-top: -10px;
        }

        .navienty-logo-icon {
          width: 56px;
          height: 56px;
          object-fit: contain;
          flex-shrink: 0;
          display: block;
        }

        .navienty-logo-text-wrap {
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateX(-6px);
          transition:
            max-width 0.35s ease,
            opacity 0.25s ease,
            transform 0.35s ease;
          display: flex;
          align-items: center;
        }

        .navienty-logo:hover .navienty-logo-text-wrap,
        .navienty-logo:focus-visible .navienty-logo-text-wrap {
          max-width: 120px;
          opacity: 1;
          transform: translateX(0);
        }

        .navienty-logo-text {
          width: 112px;
          min-width: 112px;
          height: auto;
          object-fit: contain;
          display: block;
          transform: translateY(-2px);
        }

        .desktop-header-nav-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #20212a;
          text-decoration: none;
          font-size: 15px;
          line-height: 1;
          border: none;
          background: none;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          padding: 8px 0;
          transition: color 0.3s ease;
        }

        .desktop-header-nav-button::before {
          margin-left: auto;
        }

        .desktop-header-nav-button::after,
        .desktop-header-nav-button::before {
          content: '';
          width: 0%;
          height: 2px;
          background: #000000;
          display: block;
          transition: 0.5s;
          position: absolute;
          left: 0;
        }

        .desktop-header-nav-button::before {
          top: 0;
        }

        .desktop-header-nav-button::after {
          bottom: 0;
        }

        .desktop-header-nav-button:hover::after,
        .desktop-header-nav-button:hover::before,
        .desktop-header-nav-button:focus-visible::after,
        .desktop-header-nav-button:focus-visible::before {
          width: 100%;
        }

        .desktop-header-nav-button-active {
          color: #054aff;
        }

        .desktop-header-nav-button-inactive {
          color: #20212a;
        }

        .desktop-header-nav-button-inactive:hover,
        .desktop-header-nav-button-inactive:focus-visible {
          color: #054aff;
        }

        @media (max-width: 768px) {
          .navienty-logo {
            transform: none;
            margin-top: 0;
          }

          .navienty-logo-icon {
            width: 42px;
            height: 42px;
          }

          .navienty-logo-text-wrap {
            display: none;
          }

          .mobile-header-inner {
            justify-content: center !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-[#fbfbfb] pb-28 text-gray-700 md:pb-0">
        <header className="sticky top-0 z-[110] bg-[#f5f7f9]">
          <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
            <BrandLogo />

            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/admin/properties/new"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Add Property
              </Link>

              <Link
                href="/admin/cities/new"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Add City
              </Link>

              <Link
                href="/admin/universities/new"
                className="desktop-header-nav-button desktop-header-nav-button-active"
              >
                Add University
              </Link>

              <Link
                href="/admin/brokers/new"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Add Broker
              </Link>

              <Link
                href="/admin/properties/review"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Review Queue
              </Link>

              <Link
                href="/admin/properties/admins"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Property Admins
              </Link>

              <AdminLogoutButton />
            </div>

            <div className="md:hidden">
              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <section className="mt-6 rounded-[32px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_36px_rgba(15,23,42,0.05)] md:p-8">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#222222]">
                  Enter university information
                </h2>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-6 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {errorMessage}
              </div>
            )}

            {cities.length === 0 ? (
              <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                You need to create at least one city first before adding a university.
              </div>
            ) : (
              <form action={createUniversityAction} className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-[#222222]">
                      City *
                    </label>
                    <select name="city_id" className={inputClass} required defaultValue="">
                      <option value="" disabled>
                        Select city
                      </option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name_en} — {city.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#222222]">
                      University Name (English) *
                    </label>
                    <input
                      type="text"
                      name="name_en"
                      placeholder="University Name"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#222222]">
                      University Name (Arabic) *
                    </label>
                    <input
                      type="text"
                      name="name_ar"
                      placeholder="اسم جامعة"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="mb-3 flex flex-col gap-1">
                      <label className="block text-sm font-semibold text-[#222222]">
                        University Areas
                      </label>
                      <p className="text-sm text-gray-500">
                        Select the areas where students of this university usually live.
                      </p>
                    </div>

                    {areas.length === 0 ? (
                      <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                        No active property areas found. Create areas first from the property areas table/admin page.
                      </div>
                    ) : (
                      <div className="rounded-[24px] border border-gray-200 bg-[#fafafa] p-4">
                        <div className="space-y-5">
                          {cities.map((city) => {
                            const cityAreas = areasByCityId[String(city.id)] || []

                            if (cityAreas.length === 0) {
                              return null
                            }

                            return (
                              <div
                                key={city.id}
                                className="rounded-[20px] border border-gray-200 bg-white p-4"
                              >
                                <div className="mb-3">
                                  <h3 className="text-sm font-semibold text-[#222222]">
                                    {city.name_en} — {city.name_ar}
                                  </h3>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                  {cityAreas.map((area) => (
                                    <label
                                      key={area.id}
                                      className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm transition hover:border-blue-200 hover:bg-blue-50/40"
                                    >
                                      <input
                                        type="checkbox"
                                        name="area_ids"
                                        value={area.id}
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />

                                      <span className="min-w-0">
                                        <span className="block font-semibold text-[#222222]">
                                          {area.name_en}
                                        </span>

                                        {area.name_ar && (
                                          <span className="mt-0.5 block text-gray-500">
                                            {area.name_ar}
                                          </span>
                                        )}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button type="submit" className={primaryButtonClass}>
                    Save University
                  </button>

                  <Link href="/admin/properties" className={secondaryButtonClass}>
                    Cancel
                  </Link>
                </div>
              </form>
            )}
          </section>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-[640px] grid-cols-3 gap-2">
            <MobileBottomNavItem href="/admin/properties/new" label="Add Property" />
            <MobileBottomNavItem href="/admin/cities/new" label="Add City" />
            <MobileBottomNavItem
              href="/admin/universities/new"
              label="Add University"
              isPrimary
            />
            <MobileBottomNavItem href="/admin/brokers/new" label="Add Broker" />
            <MobileBottomNavItem
              href="/admin/properties/review"
              label="Review Queue"
            />
            <MobileBottomNavItem
              href="/admin/properties/admins"
              label="Property Admins"
            />
          </div>
        </nav>
      </main>
    </>
  )
}