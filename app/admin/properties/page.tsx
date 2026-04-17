import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import {
  requirePropertiesSectionAccess,
  isSuperAdmin,
  canReceivePropertyBookingRequests,
} from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

type Property = {
  id: string
  property_id: string
  title_en?: string | null
  title_ar?: string | null
  price_egp?: number | null
  availability_status?:
    | 'available'
    | 'partially_reserved'
    | 'fully_reserved'
    | 'inactive'
    | null
  admin_status:
    | 'draft'
    | 'pending_review'
    | 'published'
    | 'rejected'
    | 'archived'
  is_active: boolean
  created_at?: string
  broker_id: string | null
}

function getPropertyAvailabilityBadgeClass(
  status?: 'available' | 'partially_reserved' | 'fully_reserved' | 'inactive' | null
) {
  if (status === 'available') {
    return 'border-green-200 bg-green-50 text-green-700'
  }

  if (status === 'partially_reserved') {
    return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  }

  if (status === 'fully_reserved') {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  return 'border-gray-200 bg-gray-100 text-gray-600'
}

function getAdminStatusBadgeClass(
  status:
    | 'draft'
    | 'pending_review'
    | 'published'
    | 'rejected'
    | 'archived'
) {
  if (status === 'published') {
    return 'border-green-200 bg-green-50 text-green-700'
  }

  if (status === 'pending_review') {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  if (status === 'rejected') {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  if (status === 'archived') {
    return 'border-gray-200 bg-gray-200 text-gray-700'
  }

  return 'border-yellow-200 bg-yellow-50 text-yellow-700'
}

function formatAvailabilityLabel(
  status?: 'available' | 'partially_reserved' | 'fully_reserved' | 'inactive' | null
) {
  if (status === 'available') return 'Available'
  if (status === 'partially_reserved') return 'Partially Reserved'
  if (status === 'fully_reserved') return 'Fully Reserved'
  if (status === 'inactive') return 'Inactive'
  return 'Unknown'
}

function formatAdminStatusLabel(
  status:
    | 'draft'
    | 'pending_review'
    | 'published'
    | 'rejected'
    | 'archived'
) {
  if (status === 'pending_review') return 'Pending Review'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatDate(date?: string) {
  if (!date) return '—'

  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date))
  } catch {
    return '—'
  }
}

function getAdminDisplayName(admin: any) {
  const possibleName =
    admin?.full_name ||
    admin?.name ||
    admin?.broker_name ||
    admin?.display_name ||
    admin?.email

  if (!possibleName || typeof possibleName !== 'string') {
    return 'Broker'
  }

  if (possibleName.includes('@')) {
    return possibleName.split('@')[0]
  }

  return possibleName
}

function BrandLogo() {
  return (
    <img
      src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
      alt="Navienty"
      className="h-auto w-[120px] md:w-[145px] object-contain"
    />
  )
}

function GridIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function InboxIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 13V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7" />
      <path d="M4 13l2.2 4.4A2 2 0 0 0 8 18h8a2 2 0 0 0 1.8-1.1L20 13" />
      <path d="M9 13h6" />
    </svg>
  )
}

function BanIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M5 19L19 5" />
    </svg>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[28px] border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-600">
        <GridIcon />
      </div>

      <h3 className="text-lg font-semibold text-gray-900">No properties found</h3>
      <p className="mt-2 text-sm text-gray-500">
        There are no properties available for this account right now.
      </p>
    </div>
  )
}

export default async function AdminPropertiesPage() {
  const adminContext = await requirePropertiesSectionAccess()
  const supabase = await createClient()
  const admin = adminContext.admin
  const brokerName = getAdminDisplayName(admin)

  if (admin.role === 'property_adder') {
    redirect('/admin/properties/new')
  }

  if (admin.role === 'property_receiver') {
    redirect('/admin/properties/booking-requests')
  }

  let query = supabase
    .from('properties')
    .select(`
      id,
      property_id,
      title_en,
      title_ar,
      price_egp,
      availability_status,
      admin_status,
      is_active,
      created_at,
      broker_id
    `)
    .order('created_at', { ascending: false })

  if (!isSuperAdmin(admin)) {
    if (!admin.broker_id) {
      throw new Error('Editor account is missing broker assignment')
    }

    query = query.eq('broker_id', admin.broker_id)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  const properties = (data || []) as Property[]

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-gray-700">
      <header className="z-30 border-b border-gray-300 bg-[#f5f7f9]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/properties" className="flex items-center">
              <BrandLogo />
            </Link>

            <div className="hidden md:block">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                Welcome back
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-gray-900">
                {brokerName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canReceivePropertyBookingRequests(admin) && (
              <Link
                href="/admin/properties/booking-requests"
                className="hidden rounded-full border border-gray-400 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:border-gray-900 hover:text-gray-900 md:inline-flex"
              >
                <span className="inline-flex items-center gap-2">
                  <InboxIcon />
                  Booking Requests
                </span>
              </Link>
            )}

            {canReceivePropertyBookingRequests(admin) && (
              <Link
                href="/admin/properties/reservations"
                className="hidden rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-400 hover:bg-rose-100 md:inline-flex"
              >
                <span className="inline-flex items-center gap-2">
                  <BanIcon />
                  Cancel Reservations
                </span>
              </Link>
            )}

            {isSuperAdmin(admin) && (
              <Link
                href="/admin/properties/review"
                className="hidden rounded-full border border-gray-400 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:border-gray-900 hover:text-gray-900 md:inline-flex"
              >
                Review Queue
              </Link>
            )}

            {isSuperAdmin(admin) && (
              <Link
                href="/admin/properties/new"
                className="inline-flex rounded-full bg-[#222222] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                + Add Property
              </Link>
            )}

            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-4 pb-8 pt-6 md:px-6 md:pt-8">
        {properties.length === 0 ? (
          <div className="mt-6">
            <EmptyState />
          </div>
        ) : (
          <>
            <section className="mt-8 rounded-[32px] border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-gray-900 md:text-xl">
                    Property Listings
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Browse and manage all properties with availability and admin
                    status.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    <ClockIcon />
                    <span>{properties.length} properties loaded</span>
                  </div>

                  {canReceivePropertyBookingRequests(admin) && (
                    <Link
                      href="/admin/properties/reservations"
                      className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-400 hover:bg-rose-100"
                    >
                      <BanIcon />
                      Manage Reservation Cancellations
                    </Link>
                  )}
                </div>
              </div>

              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-[#fafafa] text-left">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                        Property
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                        Price
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                        Availability
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                        Admin Status
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                        Active
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                        Created
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {properties.map((property) => {
                      const title =
                        property.title_en || property.title_ar || 'Untitled Property'

                      return (
                        <tr
                          key={property.id}
                          className="border-b border-gray-100 align-top transition hover:bg-gray-50/70"
                        >
                          <td className="px-6 py-5">
                            <div className="max-w-[280px]">
                              <p className="line-clamp-2 text-sm font-semibold leading-6 text-gray-900">
                                {title}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Property ID: {property.property_id}
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <p className="text-sm font-semibold text-green-600">
                              {property.price_egp != null
                                ? `${Number(property.price_egp).toLocaleString()} EGP`
                                : '—'}
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getPropertyAvailabilityBadgeClass(
                                property.availability_status
                              )}`}
                            >
                              {formatAvailabilityLabel(property.availability_status)}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getAdminStatusBadgeClass(
                                property.admin_status
                              )}`}
                            >
                              {formatAdminStatusLabel(property.admin_status)}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                property.is_active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {property.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm text-gray-500">
                            {formatDate(property.created_at)}
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/admin/properties/${property.id}`}
                                className="inline-flex rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 transition hover:border-gray-900 hover:text-gray-900"
                              >
                                Edit Property
                              </Link>

                              {canReceivePropertyBookingRequests(admin) && (
                                <Link
                                  href={`/admin/properties/reservations?property_id=${property.id}`}
                                  className="inline-flex rounded-full border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100"
                                >
                                  Cancel Reservations
                                </Link>
                              )}

                              {isSuperAdmin(admin) && (
                                <Link
                                  href="/admin/properties/review"
                                  className="inline-flex rounded-full bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                                >
                                  Review
                                </Link>
                              )}
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

                  return (
                    <div
                      key={property.id}
                      className="rounded-[28px] border border-gray-200 bg-[#fcfcfc] p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold leading-6 text-gray-900">
                            {title}
                          </h4>
                          <p className="mt-1 text-xs text-gray-500">
                            Property ID: {property.property_id}
                          </p>
                        </div>

                        <span
                          className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getAdminStatusBadgeClass(
                            property.admin_status
                          )}`}
                        >
                          {formatAdminStatusLabel(property.admin_status)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-gray-200 bg-white p-3">
                          <p className="text-xs text-gray-500">Price</p>
                          <p className="mt-1 text-sm font-semibold text-green-600">
                            {property.price_egp != null
                              ? `${Number(property.price_egp).toLocaleString()} EGP`
                              : '—'}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-3">
                          <p className="text-xs text-gray-500">Availability</p>
                          <span
                            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPropertyAvailabilityBadgeClass(
                              property.availability_status
                            )}`}
                          >
                            {formatAvailabilityLabel(property.availability_status)}
                          </span>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-3">
                          <p className="text-xs text-gray-500">Active</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {property.is_active ? 'Yes' : 'No'}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-3">
                          <p className="text-xs text-gray-500">Created</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {formatDate(property.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/admin/properties/${property.id}`}
                          className="inline-flex rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-900"
                        >
                          Edit Property
                        </Link>

                        {canReceivePropertyBookingRequests(admin) && (
                          <Link
                            href={`/admin/properties/reservations?property_id=${property.id}`}
                            className="inline-flex rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100"
                          >
                            Cancel Reservations
                          </Link>
                        )}

                        {isSuperAdmin(admin) && (
                          <Link
                            href="/admin/properties/review"
                            className="inline-flex rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                          >
                            Review
                          </Link>
                        )}

                        {canReceivePropertyBookingRequests(admin) && (
                          <Link
                            href="/admin/properties/booking-requests"
                            className="inline-flex rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-900"
                          >
                            Booking Requests
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  )
}