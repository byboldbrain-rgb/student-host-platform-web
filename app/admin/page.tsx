import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import { requireSuperAdminAccess } from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

type SearchParams = {
  admin_status?: string
  availability_status?: string
}

type AvailabilityStatus =
  | 'available'
  | 'reserved'
  | 'partially_reserved'
  | 'fully_reserved'
  | 'inactive'
  | null

type NamedRelation = {
  id: string
  name_en: string | null
  name_ar: string | null
}

type PropertyRow = {
  id: string
  property_id: string
  title_en: string | null
  title_ar: string | null
  price_egp: number | null
  beds_count: number | null
  admin_status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'
  availability_status: AvailabilityStatus
  is_active: boolean
  created_at: string
  created_by_admin_id: string | null
  updated_by_admin_id: string | null
  city_id: string | null
  university_id: string | null
  area_id: string | null
  city: NamedRelation | NamedRelation[] | null
  university: NamedRelation | NamedRelation[] | null
  area: NamedRelation | NamedRelation[] | null
}

type ExecutiveMetricRow = {
  id: string
  label: string
  subLabel?: string
  bedsCount: number
  propertiesCount: number
}

function getRelation(
  relation: NamedRelation | NamedRelation[] | null | undefined
): NamedRelation | null {
  if (!relation) return null
  if (Array.isArray(relation)) return relation[0] || null
  return relation
}

function getDisplayName(
  relation: NamedRelation | NamedRelation[] | null | undefined,
  fallback: string
) {
  const normalizedRelation = getRelation(relation)
  return normalizedRelation?.name_en || normalizedRelation?.name_ar || fallback
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function DashboardStatCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string | number
  helper: string
}) {
  return (
    <div className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.06)] md:p-6">
      <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
        {label}
      </div>
      <div className="mt-3 text-[28px] font-semibold tracking-tight text-[#222222] md:text-[34px]">
        {value}
      </div>
      <div className="mt-2 text-sm text-gray-500">{helper}</div>
    </div>
  )
}

function ExecutiveSummaryCard({
  label,
  value,
  helper,
  iconUrl,
}: {
  label: string
  value: string | number
  helper: string
  iconUrl: string
}) {
  return (
    <div className="group overflow-hidden rounded-[30px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(15,23,42,0.09)] md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            {label}
          </div>
          <div className="mt-4 text-[34px] font-semibold tracking-tight text-[#111827] md:text-[42px]">
            {value}
          </div>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f7fb] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <img src={iconUrl} alt="" className="h-6 w-6 object-contain" />
        </div>
      </div>

      <div className="mt-3 text-sm leading-6 text-gray-500">{helper}</div>
    </div>
  )
}

function AnalyticsTable({
  title,
  description,
  rows,
  primaryColumnLabel,
  emptyLabel,
  valueLabel = 'Beds',
  showProperties = true,
}: {
  title: string
  description: string
  rows: ExecutiveMetricRow[]
  primaryColumnLabel: string
  emptyLabel: string
  valueLabel?: string
  showProperties?: boolean
}) {
  const maxBeds = Math.max(...rows.map((row) => row.bedsCount), 1)

  return (
    <section className="overflow-hidden rounded-[32px] border border-black/[0.06] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
      <div className="border-b border-gray-100 px-5 py-5 md:px-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[#111827]">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {description}
            </p>
          </div>

          <div className="rounded-full bg-[#f5f7fb] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            {formatNumber(rows.length)} rows
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-14 text-center text-sm text-gray-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#fbfbfc] text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                <th className="whitespace-nowrap px-5 py-4 md:px-6">
                  {primaryColumnLabel}
                </th>
                <th className="whitespace-nowrap px-5 py-4 md:px-6">
                  {valueLabel}
                </th>
                {showProperties && (
                  <th className="whitespace-nowrap px-5 py-4 md:px-6">
                    Apartments
                  </th>
                )}
                <th className="whitespace-nowrap px-5 py-4 md:px-6">Share</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const percentage = Math.round((row.bedsCount / maxBeds) * 100)

                return (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    <td className="min-w-[240px] px-5 py-4 md:px-6">
                      <div className="font-semibold text-[#111827]">
                        {row.label}
                      </div>
                      {row.subLabel && (
                        <div className="mt-1 text-xs text-gray-500">
                          {row.subLabel}
                        </div>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-[#111827] md:px-6">
                      {formatNumber(row.bedsCount)}
                    </td>

                    {showProperties && (
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600 md:px-6">
                        {formatNumber(row.propertiesCount)}
                      </td>
                    )}

                    <td className="min-w-[220px] px-5 py-4 md:px-6">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
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

function buildExecutiveRows(properties: PropertyRow[]) {
  const areaMap = new Map<string, ExecutiveMetricRow>()
  const cityMap = new Map<string, ExecutiveMetricRow>()
  const universityMap = new Map<string, ExecutiveMetricRow>()

  properties.forEach((property) => {
    const bedsCount = Number(property.beds_count || 0)

    const cityName = getDisplayName(property.city, 'Unassigned city')
    const universityName = getDisplayName(
      property.university,
      'Unassigned university'
    )
    const areaName = getDisplayName(property.area, 'Unassigned area')

    const cityKey = property.city_id || 'unassigned-city'
    const universityKey = property.university_id || 'unassigned-university'
    const areaKey = property.area_id || `unassigned-area-${cityKey}`

    const existingArea = areaMap.get(areaKey)
    areaMap.set(areaKey, {
      id: areaKey,
      label: areaName,
      subLabel: cityName,
      bedsCount: (existingArea?.bedsCount || 0) + bedsCount,
      propertiesCount: (existingArea?.propertiesCount || 0) + 1,
    })

    const existingCity = cityMap.get(cityKey)
    cityMap.set(cityKey, {
      id: cityKey,
      label: cityName,
      bedsCount: (existingCity?.bedsCount || 0) + bedsCount,
      propertiesCount: (existingCity?.propertiesCount || 0) + 1,
    })

    const existingUniversity = universityMap.get(universityKey)
    universityMap.set(universityKey, {
      id: universityKey,
      label: universityName,
      subLabel: cityName,
      bedsCount: (existingUniversity?.bedsCount || 0) + bedsCount,
      propertiesCount: (existingUniversity?.propertiesCount || 0) + 1,
    })
  })

  const sortByBedsThenProperties = (
    a: ExecutiveMetricRow,
    b: ExecutiveMetricRow
  ) => {
    if (b.bedsCount !== a.bedsCount) return b.bedsCount - a.bedsCount
    return b.propertiesCount - a.propertiesCount
  }

  const sortByPropertiesThenBeds = (
    a: ExecutiveMetricRow,
    b: ExecutiveMetricRow
  ) => {
    if (b.propertiesCount !== a.propertiesCount) {
      return b.propertiesCount - a.propertiesCount
    }
    return b.bedsCount - a.bedsCount
  }

  return {
    areaRows: Array.from(areaMap.values()).sort(sortByBedsThenProperties),
    cityRows: Array.from(cityMap.values()).sort(sortByBedsThenProperties),
    universityRows: Array.from(universityMap.values()).sort(
      sortByPropertiesThenBeds
    ),
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireSuperAdminAccess()

  const { admin_status, availability_status } = await searchParams
  const supabase = await createClient()

  let propertiesQuery = supabase
    .from('properties')
    .select(`
      id,
      property_id,
      title_en,
      title_ar,
      price_egp,
      beds_count,
      admin_status,
      availability_status,
      is_active,
      created_at,
      created_by_admin_id,
      updated_by_admin_id,
      city_id,
      university_id,
      area_id,
      city:cities (
        id,
        name_en,
        name_ar
      ),
      university:universities (
        id,
        name_en,
        name_ar
      ),
      area:property_areas (
        id,
        name_en,
        name_ar
      )
    `)
    .order('created_at', { ascending: false })

  if (admin_status) {
    propertiesQuery = propertiesQuery.eq('admin_status', admin_status)
  }

  if (availability_status) {
    propertiesQuery = propertiesQuery.eq(
      'availability_status',
      availability_status
    )
  }

  const { data, error } = await propertiesQuery

  if (error) {
    throw new Error(error.message)
  }

  const properties = (data || []) as PropertyRow[]

  const reservedCount = properties.filter((property) =>
    ['reserved', 'partially_reserved', 'fully_reserved'].includes(
      property.availability_status || ''
    )
  ).length

  const publishedCount = properties.filter(
    (property) => property.admin_status === 'published'
  ).length

  const pendingCount = properties.filter(
    (property) => property.admin_status === 'pending_review'
  ).length

  const availableCount = properties.filter(
    (property) => property.availability_status === 'available'
  ).length

  const activeInventoryProperties = properties.filter(
    (property) => property.is_active && property.admin_status !== 'archived'
  )

  const totalBedsCount = activeInventoryProperties.reduce(
    (total, property) => total + Number(property.beds_count || 0),
    0
  )

  const totalApartmentsCount = activeInventoryProperties.length

  const { areaRows, cityRows, universityRows } =
    buildExecutiveRows(activeInventoryProperties)

  const averageBedsPerApartment =
    totalApartmentsCount > 0
      ? (totalBedsCount / totalApartmentsCount).toFixed(1)
      : '0'

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
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
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

              <Link
                href="/admin/whatsapp"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                WhatsApp Inbox
              </Link>

              <AdminLogoutButton />
            </div>

            <div className="md:hidden">
              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <section className="overflow-hidden rounded-[32px] border border-black/[0.05] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
            <div className="relative">
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#f7f8fa] to-white" />
              <div className="absolute right-[-80px] top-[-80px] h-[220px] w-[220px] rounded-full bg-blue-50/60 blur-3xl" />

              <div className="relative px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-9">
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_420px] xl:items-center">
                  <div className="max-w-7xl">
                    <img
                      src="https://i.ibb.co/x87wxX1Z/Navigate-Your-Future-1.png"
                      alt="Navigate Your Future"
                      className="w-full max-w-[3000px] object-contain"
                    />
                  </div>

                  <div className="rounded-[28px] border border-gray-200 bg-[#fcfcfd] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] md:p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                          CEO Snapshot
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          Quick numbers for your current inventory
                        </div>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
                        <img
                          src="https://i.ibb.co/jZVKpdq7/dashboard.png"
                          alt="Dashboard"
                          className="h-5 w-5 object-contain"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <DashboardStatCard
                        label="Reserved"
                        value={reservedCount}
                        helper="Reserved or partially reserved"
                      />
                      <DashboardStatCard
                        label="Published"
                        value={publishedCount}
                        helper="Live on platform"
                      />
                      <DashboardStatCard
                        label="Pending"
                        value={pendingCount}
                        helper="Waiting for review"
                      />
                      <DashboardStatCard
                        label="Available"
                        value={availableCount}
                        helper="Open for booking"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ExecutiveSummaryCard
              label="Total Beds"
              value={formatNumber(totalBedsCount)}
              helper="Total beds across active, non-archived inventory"
              iconUrl="https://i.ibb.co/jZVKpdq7/dashboard.png"
            />

            <ExecutiveSummaryCard
              label="Apartments"
              value={formatNumber(totalApartmentsCount)}
              helper="Total active apartments currently tracked"
              iconUrl="https://i.ibb.co/jZVKpdq7/dashboard.png"
            />

            <ExecutiveSummaryCard
              label="Covered Areas"
              value={formatNumber(areaRows.length)}
              helper="Areas with at least one active apartment"
              iconUrl="https://i.ibb.co/jZVKpdq7/dashboard.png"
            />

            <ExecutiveSummaryCard
              label="Avg Beds / Apt"
              value={averageBedsPerApartment}
              helper="Average inventory density per apartment"
              iconUrl="https://i.ibb.co/jZVKpdq7/dashboard.png"
            />
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <AnalyticsTable
              title="Beds by Area"
              description="Total number of beds available in every area."
              rows={areaRows}
              primaryColumnLabel="Area"
              emptyLabel="No area-level bed data available."
            />

            <AnalyticsTable
              title="Beds by City"
              description="Total number of beds grouped by city."
              rows={cityRows}
              primaryColumnLabel="City"
              emptyLabel="No city-level bed data available."
            />
          </div>

          <div className="mt-6">
            <AnalyticsTable
              title="Apartments by University"
              description="Total number of apartments connected to every university."
              rows={universityRows}
              primaryColumnLabel="University"
              valueLabel="Apartments"
              emptyLabel="No university-level apartment data available."
              showProperties={false}
            />
          </div>

          {properties.length === 0 && (
            <section className="mt-6 rounded-[32px] border border-dashed border-gray-300 bg-white px-6 py-24 text-center shadow-sm">
              <div className="mx-auto max-w-xl">
                <h2 className="text-2xl font-semibold text-[#111827]">
                  No properties found
                </h2>
                <p className="mt-3 text-sm leading-6 text-gray-500">
                  There are currently no property records to display.
                </p>
              </div>
            </section>
          )}
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-[640px] grid-cols-3 gap-2">
            <MobileBottomNavItem
              href="/admin/properties/new"
              label="Add Property"
              isPrimary
            />
            <MobileBottomNavItem href="/admin/cities/new" label="Add City" />
            <MobileBottomNavItem
              href="/admin/universities/new"
              label="Add University"
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
            <MobileBottomNavItem
              href="/admin/whatsapp"
              label="WhatsApp Inbox"
            />
          </div>
        </nav>
      </main>
    </>
  )
}