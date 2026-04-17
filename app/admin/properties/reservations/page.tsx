import Link from 'next/link'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  requirePropertiesSectionAccess,
  isSuperAdmin,
} from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'
import {
  cancelLegacyBedReservationAction,
  cancelPropertyReservationAction,
} from '../booking-requests/actions'

type SearchParams = Promise<{
  property_id?: string
}>

type ActiveUnifiedReservation =
  | {
      source: 'property_reservations'
      id: string
      property_id: string
      customer_name: string
      customer_phone: string | null
      customer_email: string | null
      customer_whatsapp: string | null
      start_date: string | null
      end_date: string | null
      status: 'pending' | 'reserved' | 'checked_in'
      reservation_scope: 'entire_property' | 'entire_room' | 'beds'
      total_price_egp: number | null
      payment_status: string | null
      wallet_amount_used: number | null
      notes: string | null
      created_at: string
      property_title: string
      property_code: string
      room_names: string[]
      bed_labels: string[]
    }
  | {
      source: 'bed_reservations'
      id: string
      property_id: string
      customer_name: string
      customer_phone: string | null
      customer_email: string | null
      customer_whatsapp: string | null
      start_date: string | null
      end_date: string | null
      status: 'pending' | 'reserved' | 'checked_in'
      reservation_scope: 'beds'
      total_price_egp: null
      payment_status: null
      wallet_amount_used: null
      notes: string | null
      created_at: string
      property_title: string
      property_code: string
      room_names: string[]
      bed_labels: string[]
    }

type PropertyOption = {
  id: string
  property_id: string
  title: string
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
      className="h-auto w-[120px] object-contain md:w-[145px]"
    />
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

function FilterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
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

function EmptyState() {
  return (
    <div className="rounded-[28px] border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-600">
        <InboxIcon />
      </div>

      <h3 className="text-lg font-semibold text-gray-900">
        No active reservations found
      </h3>
      <p className="mt-2 text-sm text-gray-500">
        There are no active reservations blocking property room updates right now.
      </p>
    </div>
  )
}

function formatDate(date?: string | null) {
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

function formatDateTime(date?: string | null) {
  if (!date) return '—'

  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  } catch {
    return '—'
  }
}

function formatPrice(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `${Number(value).toLocaleString()} EGP`
}

function getReservationStatusLabel(status: 'pending' | 'reserved' | 'checked_in') {
  if (status === 'checked_in') return 'Checked In'
  if (status === 'reserved') return 'Reserved'
  return 'Pending'
}

function getReservationStatusClass(status: 'pending' | 'reserved' | 'checked_in') {
  if (status === 'pending') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (status === 'reserved') {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  return 'border-violet-200 bg-violet-50 text-violet-700'
}

function getPaymentStatusClass(status?: string | null) {
  if (status === 'paid') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'partial') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (status === 'refunded') {
    return 'border-sky-200 bg-sky-50 text-sky-700'
  }

  return 'border-gray-200 bg-gray-100 text-gray-700'
}

function getScopeLabel(scope: 'entire_property' | 'entire_room' | 'beds') {
  if (scope === 'entire_property') return 'Entire Property'
  if (scope === 'entire_room') return 'Entire Room'
  return 'Beds'
}

function CancelPropertyReservationForm({
  reservationId,
}: {
  reservationId: string
}) {
  return (
    <form action={cancelPropertyReservationAction} className="space-y-3">
      <input type="hidden" name="reservation_id" value={reservationId} />

      <textarea
        name="cancellation_reason"
        rows={3}
        placeholder="Optional cancellation note"
        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-rose-400"
      />

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100"
      >
        Cancel Reservation
      </button>
    </form>
  )
}

function CancelLegacyBedReservationForm({
  reservationId,
}: {
  reservationId: string
}) {
  return (
    <form action={cancelLegacyBedReservationAction} className="space-y-3">
      <input
        type="hidden"
        name="legacy_reservation_id"
        value={reservationId}
      />

      <textarea
        name="cancellation_reason"
        rows={3}
        placeholder="Optional cancellation note"
        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-rose-400"
      />

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100"
      >
        Cancel Legacy Reservation
      </button>
    </form>
  )
}

export default async function PropertyReservationsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const resolvedSearchParams = await searchParams
  const selectedPropertyId = resolvedSearchParams?.property_id?.trim() || ''

  const adminContext = await requirePropertiesSectionAccess()
  const supabase = createAdminClient()
  const admin = adminContext.admin
  const brokerName = getAdminDisplayName(admin)

  let propertiesQuery = supabase
    .from('properties')
    .select('id, property_id, title_en, title_ar, broker_id')
    .order('created_at', { ascending: false })

  if (!isSuperAdmin(admin)) {
    if (!admin.broker_id) {
      throw new Error('Editor account is missing broker assignment')
    }

    propertiesQuery = propertiesQuery.eq('broker_id', admin.broker_id)
  }

  const { data: propertiesData, error: propertiesError } = await propertiesQuery

  if (propertiesError) {
    throw new Error(propertiesError.message)
  }

  const propertyOptions: PropertyOption[] = (propertiesData || []).map(
    (property: any) => ({
      id: property.id,
      property_id: property.property_id,
      title: property.title_en || property.title_ar || 'Untitled Property',
    })
  )

  const allowedPropertyIds = propertyOptions.map((property) => property.id)

  let propertyReservationsQuery = supabase
    .from('property_reservations')
    .select(`
      id,
      property_id,
      customer_name,
      customer_phone,
      customer_email,
      customer_whatsapp,
      start_date,
      end_date,
      status,
      reservation_scope,
      total_price_egp,
      payment_status,
      wallet_amount_used,
      notes,
      created_at,
      properties!inner (
        id,
        property_id,
        title_en,
        title_ar,
        broker_id
      ),
      property_reservation_allocations (
        id,
        room_id,
        bed_id,
        allocation_type,
        property_rooms (
          id,
          room_name,
          room_name_ar
        ),
        room_beds (
          id,
          bed_label,
          bed_label_ar
        )
      )
    `)
    .in('status', ['pending', 'reserved', 'checked_in'])
    .order('created_at', { ascending: false })

  let legacyBedReservationsQuery = supabase
    .from('bed_reservations')
    .select(`
      id,
      property_id,
      room_id,
      bed_id,
      student_name,
      student_phone,
      student_email,
      student_whatsapp,
      start_date,
      end_date,
      status,
      notes,
      created_at,
      properties!inner (
        id,
        property_id,
        title_en,
        title_ar,
        broker_id
      ),
      property_rooms (
        id,
        room_name,
        room_name_ar
      ),
      room_beds (
        id,
        bed_label,
        bed_label_ar
      )
    `)
    .in('status', ['pending', 'reserved', 'checked_in'])
    .order('created_at', { ascending: false })

  if (!isSuperAdmin(admin)) {
    propertyReservationsQuery = propertyReservationsQuery.eq(
      'properties.broker_id',
      admin.broker_id
    )

    legacyBedReservationsQuery = legacyBedReservationsQuery.eq(
      'properties.broker_id',
      admin.broker_id
    )
  }

  if (selectedPropertyId) {
    propertyReservationsQuery = propertyReservationsQuery.eq(
      'property_id',
      selectedPropertyId
    )
    legacyBedReservationsQuery = legacyBedReservationsQuery.eq(
      'property_id',
      selectedPropertyId
    )
  } else if (allowedPropertyIds.length > 0) {
    propertyReservationsQuery = propertyReservationsQuery.in(
      'property_id',
      allowedPropertyIds
    )
    legacyBedReservationsQuery = legacyBedReservationsQuery.in(
      'property_id',
      allowedPropertyIds
    )
  }

  const [
    { data: propertyReservationsData, error: propertyReservationsError },
    { data: legacyBedReservationsData, error: legacyBedReservationsError },
  ] = await Promise.all([propertyReservationsQuery, legacyBedReservationsQuery])

  if (propertyReservationsError) {
    throw new Error(propertyReservationsError.message)
  }

  if (legacyBedReservationsError) {
    throw new Error(legacyBedReservationsError.message)
  }

  const unifiedReservations: ActiveUnifiedReservation[] = [
    ...((propertyReservationsData || []) as any[]).map((reservation) => {
      const property = Array.isArray(reservation.properties)
        ? reservation.properties[0]
        : reservation.properties

      const allocations = Array.isArray(reservation.property_reservation_allocations)
        ? reservation.property_reservation_allocations
        : []

      const roomNames = Array.from(
        new Set(
          allocations
            .map((allocation: any) => {
              const room = Array.isArray(allocation.property_rooms)
                ? allocation.property_rooms[0]
                : allocation.property_rooms

              return room?.room_name || room?.room_name_ar || null
            })
            .filter(Boolean)
        )
      ) as string[]

      const bedLabels = Array.from(
        new Set(
          allocations
            .map((allocation: any) => {
              const bed = Array.isArray(allocation.room_beds)
                ? allocation.room_beds[0]
                : allocation.room_beds

              return bed?.bed_label || bed?.bed_label_ar || null
            })
            .filter(Boolean)
        )
      ) as string[]

      return {
        source: 'property_reservations' as const,
        id: reservation.id,
        property_id: reservation.property_id,
        customer_name: reservation.customer_name,
        customer_phone: reservation.customer_phone,
        customer_email: reservation.customer_email,
        customer_whatsapp: reservation.customer_whatsapp,
        start_date: reservation.start_date,
        end_date: reservation.end_date,
        status: reservation.status,
        reservation_scope: reservation.reservation_scope,
        total_price_egp: reservation.total_price_egp,
        payment_status: reservation.payment_status,
        wallet_amount_used: reservation.wallet_amount_used,
        notes: reservation.notes,
        created_at: reservation.created_at,
        property_title:
          property?.title_en || property?.title_ar || 'Untitled Property',
        property_code: property?.property_id || '—',
        room_names: roomNames,
        bed_labels: bedLabels,
      }
    }),

    ...((legacyBedReservationsData || []) as any[]).map((reservation) => {
      const property = Array.isArray(reservation.properties)
        ? reservation.properties[0]
        : reservation.properties

      const room = Array.isArray(reservation.property_rooms)
        ? reservation.property_rooms[0]
        : reservation.property_rooms

      const bed = Array.isArray(reservation.room_beds)
        ? reservation.room_beds[0]
        : reservation.room_beds

      const roomNames =
        room?.room_name || room?.room_name_ar
          ? [room?.room_name || room?.room_name_ar]
          : []

      const bedLabels =
        bed?.bed_label || bed?.bed_label_ar
          ? [bed?.bed_label || bed?.bed_label_ar]
          : []

      return {
        source: 'bed_reservations' as const,
        id: reservation.id,
        property_id: reservation.property_id,
        customer_name: reservation.student_name,
        customer_phone: reservation.student_phone,
        customer_email: reservation.student_email,
        customer_whatsapp: reservation.student_whatsapp,
        start_date: reservation.start_date,
        end_date: reservation.end_date,
        status: reservation.status,
        reservation_scope: 'beds' as const,
        total_price_egp: null,
        payment_status: null,
        wallet_amount_used: null,
        notes: reservation.notes,
        created_at: reservation.created_at,
        property_title:
          property?.title_en || property?.title_ar || 'Untitled Property',
        property_code: property?.property_id || '—',
        room_names: roomNames,
        bed_labels: bedLabels,
      }
    }),
  ].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime()
    const bTime = new Date(b.created_at).getTime()
    return bTime - aTime
  })

  const selectedPropertyLabel =
    propertyOptions.find((property) => property.id === selectedPropertyId)
      ?.title || null

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
            <Link
              href="/admin/properties"
              className="hidden rounded-full border border-gray-400 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:border-gray-900 hover:text-gray-900 md:inline-flex"
            >
              Properties
            </Link>

            <Link
              href="/admin/properties/booking-requests"
              className="hidden rounded-full border border-gray-400 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:border-gray-900 hover:text-gray-900 md:inline-flex"
            >
              Booking Requests
            </Link>

            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-4 pb-8 pt-6 md:px-6 md:pt-8">
        <section className="rounded-[32px] border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-5 md:px-7">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-gray-900 md:text-xl">
                  Active Reservation Cancellations
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  These are the active reservations currently blocking room and bed structure updates.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <BanIcon />
                <span>{unifiedReservations.length} active reservations</span>
              </div>
            </div>

            <form method="get" className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="w-full md:max-w-[420px]">
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Filter by property
                </label>
                <div className="relative">
                  <select
                    name="property_id"
                    defaultValue={selectedPropertyId}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 pr-10 text-sm text-gray-900 outline-none transition focus:border-blue-500"
                  >
                    <option value="">All properties</option>
                    {propertyOptions.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title} — {property.property_id}
                      </option>
                    ))}
                  </select>

                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FilterIcon />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Apply Filter
                </button>

                <Link
                  href="/admin/properties/reservations"
                  className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:border-gray-900 hover:text-gray-900"
                >
                  Reset
                </Link>
              </div>
            </form>

            {selectedPropertyLabel ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Showing active reservations for:{' '}
                <span className="font-semibold">{selectedPropertyLabel}</span>
              </div>
            ) : null}
          </div>

          <div className="p-4 md:p-6">
            {unifiedReservations.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {unifiedReservations.map((reservation) => (
                  <div
                    key={`${reservation.source}-${reservation.id}`}
                    className="rounded-[24px] border border-gray-200 bg-[#fcfcfc] p-4 shadow-sm"
                  >
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-[20px] border border-gray-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-base font-semibold text-gray-900">
                                {reservation.customer_name || '—'}
                              </h4>
                              <p className="mt-1 text-xs text-gray-500">
                                Reservation ID: {reservation.id}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Source: {reservation.source}
                              </p>
                            </div>

                            <span
                              className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getReservationStatusClass(
                                reservation.status
                              )}`}
                            >
                              {getReservationStatusLabel(reservation.status)}
                            </span>
                          </div>

                          <div className="mt-4 space-y-2 text-sm text-gray-700">
                            {reservation.customer_phone ? (
                              <p>
                                <span className="font-medium text-gray-900">Phone:</span>{' '}
                                {reservation.customer_phone}
                              </p>
                            ) : null}

                            {reservation.customer_email ? (
                              <p>
                                <span className="font-medium text-gray-900">Email:</span>{' '}
                                {reservation.customer_email}
                              </p>
                            ) : null}

                            {reservation.customer_whatsapp ? (
                              <p>
                                <span className="font-medium text-gray-900">WhatsApp:</span>{' '}
                                {reservation.customer_whatsapp}
                              </p>
                            ) : null}
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">Scope</p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">
                                {getScopeLabel(reservation.reservation_scope)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">Created</p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">
                                {formatDateTime(reservation.created_at)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">Start Date</p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">
                                {formatDate(reservation.start_date)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">End Date</p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">
                                {formatDate(reservation.end_date)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[20px] border border-gray-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                            Property
                          </p>

                          <h4 className="mt-2 text-base font-semibold text-gray-900">
                            {reservation.property_title}
                          </h4>

                          <p className="mt-1 text-xs text-gray-500">
                            Property ID: {reservation.property_code}
                          </p>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">Total Price</p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">
                                {formatPrice(reservation.total_price_egp)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">Wallet Used</p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">
                                {formatPrice(reservation.wallet_amount_used)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 sm:col-span-2">
                              <p className="text-xs text-gray-500">Payment Status</p>
                              <span
                                className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentStatusClass(
                                  reservation.payment_status
                                )}`}
                              >
                                {reservation.payment_status || '—'}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Allocated To</p>

                            {reservation.room_names.length > 0 ? (
                              <p className="mt-2 text-sm text-gray-900">
                                <span className="font-semibold">Rooms:</span>{' '}
                                {reservation.room_names.join(', ')}
                              </p>
                            ) : null}

                            {reservation.bed_labels.length > 0 ? (
                              <p className="mt-2 text-sm text-gray-900">
                                <span className="font-semibold">Beds:</span>{' '}
                                {reservation.bed_labels.join(', ')}
                              </p>
                            ) : null}

                            {reservation.room_names.length === 0 &&
                            reservation.bed_labels.length === 0 ? (
                              <p className="mt-1 text-sm text-gray-500">
                                No allocation details
                              </p>
                            ) : null}
                          </div>

                          {reservation.notes ? (
                            <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">Notes</p>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                                {reservation.notes}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 shadow-sm">
                        <div className="rounded-2xl border border-rose-200 bg-white px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-rose-700">
                            Cancellation
                          </p>
                          <p className="mt-1 text-sm font-semibold text-rose-900">
                            Cancel this active reservation
                          </p>
                        </div>

                        <div className="mt-4 space-y-3 text-sm text-rose-900">
                          <p>
                            This item appears because it is currently blocking room and bed structure updates.
                          </p>

                          {reservation.source === 'property_reservations' ? (
                            <div className="mt-4">
                              <CancelPropertyReservationForm
                                reservationId={reservation.id}
                              />
                            </div>
                          ) : (
                            <div className="mt-4">
                              <CancelLegacyBedReservationForm
                                reservationId={reservation.id}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}