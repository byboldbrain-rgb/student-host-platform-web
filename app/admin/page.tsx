import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import {
  requireSuperAdminAccess,
} from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

type SearchParams = {
  admin_status?: string
  availability_status?: string
}

type PropertyRow = {
  id: string
  property_id: string
  title_en: string | null
  title_ar: string | null
  price_egp: number | null
  admin_status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'
  availability_status: 'available' | 'reserved' | null
  is_active: boolean
  created_at: string
  created_by_admin_id: string | null
  updated_by_admin_id: string | null
}

type AdminUser = {
  id: string
  full_name: string
  email: string
}

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-[18px] border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_14px_30px_rgba(37,99,235,0.35)]'

const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[18px] border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-[#222222] shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-400 hover:bg-[#fafafa] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]'

const subtleButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[16px] border border-gray-200 bg-[#f8fafb] px-4 py-2.5 text-sm font-semibold text-[#222222] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-300 hover:bg-white hover:shadow-[0_8px_18px_rgba(15,23,42,0.06)]'

const tableButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[14px] border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-400 hover:bg-[#fafafa] hover:shadow-[0_10px_22px_rgba(15,23,42,0.08)]'

function getAdminStatusBadgeClass(status: string) {
  if (status === 'published') {
    return 'border border-emerald-200/80 bg-emerald-50 text-emerald-700'
  }

  if (status === 'pending_review') {
    return 'border border-sky-200/80 bg-sky-50 text-sky-700'
  }

  if (status === 'rejected') {
    return 'border border-rose-200/80 bg-rose-50 text-rose-700'
  }

  if (status === 'archived') {
    return 'border border-gray-200 bg-gray-100 text-gray-700'
  }

  return 'border border-amber-200/80 bg-amber-50 text-amber-700'
}

function getAvailabilityBadgeClass(status: string | null) {
  if (status === 'available') {
    return 'border border-emerald-200/80 bg-emerald-50 text-emerald-700'
  }

  if (status === 'reserved') {
    return 'border border-orange-200/80 bg-orange-50 text-orange-700'
  }

  return 'border border-gray-200 bg-gray-100 text-gray-600'
}

function formatAdminStatusLabel(status: PropertyRow['admin_status']) {
  if (status === 'pending_review') return 'Pending Review'
  if (status === 'published') return 'Published'
  if (status === 'rejected') return 'Rejected'
  if (status === 'archived') return 'Archived'
  return 'Draft'
}

function formatAvailabilityLabel(status: PropertyRow['availability_status']) {
  if (status === 'available') return 'Available'
  if (status === 'reserved') return 'Reserved'
  return '—'
}

function formatPrice(price: number | null) {
  if (!price) return '—'

  return new Intl.NumberFormat('en-US').format(price) + ' EGP'
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
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

export default async function AdminPropertiesPage({
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
      admin_status,
      availability_status,
      is_active,
      created_at,
      created_by_admin_id,
      updated_by_admin_id
    `)
    .order('created_at', { ascending: false })

  if (admin_status) {
    propertiesQuery = propertiesQuery.eq('admin_status', admin_status)
  }

  if (availability_status) {
    propertiesQuery = propertiesQuery.eq('availability_status', availability_status)
  }

  const [{ data, error }, adminsRes] = await Promise.all([
    propertiesQuery,
    supabase.from('admin_users').select('id, full_name, email'),
  ])

  if (error) {
    throw new Error(error.message)
  }

  const properties = (data || []) as PropertyRow[]
  const admins = (adminsRes.data || []) as AdminUser[]
  const adminMap = new Map(admins.map((admin) => [admin.id, admin]))

  const reservedCount = properties.filter(
    (property) => property.availability_status === 'reserved'
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

  return (
    <main className="min-h-screen bg-[#fbfbfb] text-gray-700">
      <header className="sticky top-0 z-40 h-[130px] border-b border-gray-200/80 bg-[#F5F7F9]">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 bg-[#F5F7F9] px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/properties" className="shrink-0">
              <img
                src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
                alt="Navienty"
                className="block h-auto w-[180px] md:w-[130px]"
              />
            </Link>

            <div className="hidden md:block"></div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <Link href="/admin/properties/new" className={primaryButtonClass}>
              Add Property
            </Link>

            <Link href="/admin/cities/new" className={secondaryButtonClass}>
              Add City
            </Link>

            <Link href="/admin/universities/new" className={secondaryButtonClass}>
              Add University
            </Link>

            <Link href="/admin/brokers/new" className={secondaryButtonClass}>
              Add Broker
            </Link>

            <Link href="/admin/properties/review" className={secondaryButtonClass}>
              Review Queue
            </Link>

            <Link href="/admin/properties/admins" className={secondaryButtonClass}>
              Property Admins
            </Link>

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
                      label="Reserved Rooms"
                      value={reservedCount}
                      helper="Currently reserved listings"
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

        {properties.length > 0 && (
          <section className="mt-6 overflow-hidden rounded-[32px] border border-black/[0.06] bg-white shadow-[0_10px_36px_rgba(15,23,42,0.05)]">
            <div className="border-b border-gray-200/80 px-5 py-5 md:px-6 lg:px-8">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                    Inventory
                  </div>
                  <h3 className="mt-1 text-[24px] font-semibold tracking-tight text-[#222222]">
                    Property Records
                  </h3>
                </div>
              </div>
            </div>

            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[1300px] text-left">
                  <thead className="bg-[#fafafa]">
                    <tr>
                      <th className="px-8 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Property
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Price
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Admin Status
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Availability
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Created By
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Updated By
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Created At
                      </th>
                      <th className="px-8 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {properties.map((property) => {
                      const title =
                        property.title_en || property.title_ar || 'Untitled Property'

                      const createdBy = property.created_by_admin_id
                        ? adminMap.get(property.created_by_admin_id)
                        : null

                      const updatedBy = property.updated_by_admin_id
                        ? adminMap.get(property.updated_by_admin_id)
                        : null

                      return (
                        <tr
                          key={property.id}
                          className="border-t border-gray-100 transition hover:bg-[#fcfcfc]"
                        >
                          <td className="px-8 py-6 align-top">
                            <div className="flex items-start gap-4">
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-lg">
                                🏠
                              </div>

                              <div className="min-w-0">
                                <div className="truncate text-[16px] font-semibold text-[#222222]">
                                  {title}
                                </div>

                                <div className="mt-1 text-sm text-gray-500">
                                  Code: {property.property_id}
                                </div>

                                <div className="mt-2">
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                      property.is_active
                                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border border-gray-200 bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {property.is_active ? 'Active Listing' : 'Inactive Listing'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-6 align-top text-[15px] font-semibold text-[#222222]">
                            {formatPrice(property.price_egp)}
                          </td>

                          <td className="px-6 py-6 align-top">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getAdminStatusBadgeClass(
                                property.admin_status
                              )}`}
                            >
                              {formatAdminStatusLabel(property.admin_status)}
                            </span>
                          </td>

                          <td className="px-6 py-6 align-top">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getAvailabilityBadgeClass(
                                property.availability_status
                              )}`}
                            >
                              {formatAvailabilityLabel(property.availability_status)}
                            </span>
                          </td>

                          <td className="px-6 py-6 align-top text-sm text-gray-600">
                            {createdBy?.full_name || '—'}
                          </td>

                          <td className="px-6 py-6 align-top text-sm text-gray-600">
                            {updatedBy?.full_name || '—'}
                          </td>

                          <td className="px-6 py-6 align-top text-sm text-gray-600">
                            {formatDate(property.created_at)}
                          </td>

                          <td className="px-8 py-6 align-top">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/properties/${property.id}`}
                                className={tableButtonClass}
                              >
                                Edit
                              </Link>

                              <Link
                                href={`/properties/${property.property_id}`}
                                className={subtleButtonClass}
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 md:p-6 xl:hidden">
                {properties.map((property) => {
                  const title =
                    property.title_en || property.title_ar || 'Untitled Property'

                  const createdBy = property.created_by_admin_id
                    ? adminMap.get(property.created_by_admin_id)
                    : null

                  const updatedBy = property.updated_by_admin_id
                    ? adminMap.get(property.updated_by_admin_id)
                    : null

                  return (
                    <div
                      key={property.id}
                      className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_6px_22px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-lg">
                          🏠
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="truncate text-[17px] font-semibold text-[#222222]">
                                {title}
                              </h4>
                              <p className="mt-1 text-sm text-gray-500">
                                Code: {property.property_id}
                              </p>
                            </div>

                            <Link
                              href={`/admin/properties/${property.id}`}
                              className={tableButtonClass}
                            >
                              Edit
                            </Link>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getAdminStatusBadgeClass(
                                property.admin_status
                              )}`}
                            >
                              {formatAdminStatusLabel(property.admin_status)}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getAvailabilityBadgeClass(
                                property.availability_status
                              )}`}
                            >
                              {formatAvailabilityLabel(property.availability_status)}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                property.is_active
                                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border border-gray-200 bg-gray-100 text-gray-600'
                              }`}
                            >
                              {property.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-[#fafafa] p-4">
                          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                            Price
                          </div>
                          <div className="mt-2 text-[15px] font-semibold text-[#222222]">
                            {formatPrice(property.price_egp)}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-[#fafafa] p-4">
                          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                            Created At
                          </div>
                          <div className="mt-2 text-[15px] font-semibold text-[#222222]">
                            {formatDate(property.created_at)}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-[#fafafa] p-4">
                          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                            Created By
                          </div>
                          <div className="mt-2 text-[15px] font-semibold text-[#222222]">
                            {createdBy?.full_name || '—'}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-[#fafafa] p-4">
                          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                            Updated By
                          </div>
                          <div className="mt-2 text-[15px] font-semibold text-[#222222]">
                            {updatedBy?.full_name || '—'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/admin/properties/${property.id}`}
                          className={`${primaryButtonClass} flex-1`}
                        >
                          Edit Property
                        </Link>

                        <Link
                          href={`/properties/${property.property_id}`}
                          className={`${secondaryButtonClass} flex-1`}
                        >
                          View Listing
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          </section>
        )}

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
    </main>
  )
}