import Link from 'next/link'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  requirePropertyBookingRequestsAccess,
  isSuperAdmin,
} from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'
import BookingRequestActionsPanel from './BookingRequestActionsPanel'

type RequestedOptionCode =
  | 'single_room'
  | 'double_room'
  | 'triple_room'
  | 'full_apartment'
  | null

type BookingRequest = {
  id: string
  property_id: string
  broker_id: string | null
  user_id: string | null
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  customer_whatsapp: string | null
  preferred_start_date: string | null
  preferred_end_date: string | null
  message: string | null
  requested_option_code: string | null
  status: 'new' | 'contacted' | 'in_progress' | 'converted' | 'cancelled'
  created_at: string
  updated_at: string
  properties:
    | {
        id: string
        property_id: string
        title_en: string | null
        title_ar: string | null
        broker_id: string | null
        price_egp: number | null
        rental_duration: 'daily' | 'monthly' | null
        availability_status:
          | 'available'
          | 'partially_reserved'
          | 'fully_reserved'
          | 'inactive'
          | null
      }
    | {
        id: string
        property_id: string
        title_en: string | null
        title_ar: string | null
        broker_id: string | null
        price_egp: number | null
        rental_duration: 'daily' | 'monthly' | null
        availability_status:
          | 'available'
          | 'partially_reserved'
          | 'fully_reserved'
          | 'inactive'
          | null
      }[]
    | null
}

type PropertySellableOption = {
  id: string
  property_id: string
  code: string
  name_en: string | null
  name_ar: string | null
  sell_mode: 'entire_property' | 'entire_room' | 'bed' | string
  occupancy_size: number | null
  price_egp: number | null
  rental_duration: 'daily' | 'monthly' | string | null
  is_active: boolean | null
  sort_order: number | null
  pricing_mode: 'per_person' | 'per_room' | string | null
  option_code: string | null
}

type RoomSellableOption = {
  id: string
  room_id: string
  code: string
  name_en: string | null
  name_ar: string | null
  occupancy_size: number | null
  pricing_mode: 'per_person' | 'per_room' | string | null
  price_egp: number | null
  consumes_beds_count: number | null
  is_exclusive: boolean | null
  is_active: boolean | null
  sort_order: number | null
}

type RoomBed = {
  id: string
  room_id: string
  status:
    | 'available'
    | 'reserved'
    | 'occupied'
    | 'maintenance'
    | 'inactive'
    | string
}

type PropertyRoom = {
  id: string
  property_id_ref: string
  room_name: string | null
  room_name_ar: string | null
  room_type?: 'single' | 'double' | 'triple' | 'quad' | 'custom' | string | null
  status:
    | 'available'
    | 'partially_reserved'
    | 'fully_reserved'
    | 'inactive'
    | string
  sort_order: number | null
  room_beds: RoomBed[]
  room_sellable_options: RoomSellableOption[]
}

type MappedRoom = PropertyRoom & {
  availableBedsCount: number
  totalBedsCount: number
  sellableOptions: RoomSellableOption[]
}

type ActiveReservation = {
  id: string
  property_id: string
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  customer_whatsapp: string | null
  start_date: string | null
  end_date: string | null
  status: 'pending' | 'reserved' | 'checked_in' | 'completed' | 'cancelled' | string
  reservation_scope: 'entire_property' | 'entire_room' | 'beds' | string
  total_price_egp: number | null
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded' | string | null
  wallet_amount_used: number | null
  notes: string | null
  created_at: string
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

function PhoneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.61 2.62a2 2 0 0 1-.45 2.11L8 9.59a16 16 0 0 0 6.4 6.4l1.14-1.27a2 2 0 0 1 2.11-.45c.84.28 1.72.49 2.62.61A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 4h16v16H4z" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  )
}

function MessageSquareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
        No booking requests found
      </h3>
      <p className="mt-2 text-sm text-gray-500">
        There are no open property booking requests right now.
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
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  } catch {
    return '—'
  }
}

function formatStatusLabel(
  status: 'new' | 'contacted' | 'in_progress' | 'converted' | 'cancelled'
) {
  if (status === 'in_progress') return 'In Progress'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function getStatusBadgeClass(
  status: 'new' | 'contacted' | 'in_progress' | 'converted' | 'cancelled'
) {
  if (status === 'new') {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  if (status === 'contacted') {
    return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  }

  if (status === 'in_progress') {
    return 'border-purple-200 bg-purple-50 text-purple-700'
  }

  if (status === 'converted') {
    return 'border-green-200 bg-green-50 text-green-700'
  }

  return 'border-gray-200 bg-gray-100 text-gray-600'
}

function formatPrice(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `EGP ${Number(value).toLocaleString()}`
}

function formatRentalDuration(value?: string | null) {
  if (value === 'daily') return '/ day'
  if (value === 'monthly') return '/ month'
  return ''
}

function formatAvailabilityLabel(
  status?:
    | 'available'
    | 'partially_reserved'
    | 'fully_reserved'
    | 'inactive'
    | null
) {
  if (status === 'available') return 'available'
  if (status === 'partially_reserved') return 'partially reserved'
  if (status === 'fully_reserved') return 'fully reserved'
  if (status === 'inactive') return 'inactive'
  return 'unknown'
}

function getRequestedOptionLabel(optionCode?: string | null) {
  switch (optionCode) {
    case 'triple_room':
      return 'Triple Room'
    case 'double_room':
      return 'Double Room'
    case 'single_room':
      return 'Single Room'
    case 'full_apartment':
      return 'Full Apartment'
    default:
      return '—'
  }
}

function normalizeRoomOptionCode(value?: string | null): RequestedOptionCode {
  const normalized = String(value || '').trim().toLowerCase()

  if (normalized === 'single_room' || normalized === 'single') return 'single_room'
  if (normalized === 'double_room' || normalized === 'double') return 'double_room'
  if (normalized === 'triple_room' || normalized === 'triple') return 'triple_room'
  if (normalized === 'full_apartment') return 'full_apartment'

  return null
}

function getOptionPrice(
  propertySellableOptions: PropertySellableOption[],
  rooms: PropertyRoom[],
  optionCode: RequestedOptionCode,
  fallbackPropertyPrice?: number | null
) {
  if (optionCode === 'full_apartment') {
    const fullApartmentOption = propertySellableOptions.find(
      (option) =>
        option.is_active !== false &&
        (option.code === 'full_apartment' ||
          option.option_code === 'full_apartment' ||
          option.sell_mode === 'entire_property')
    )

    return fullApartmentOption?.price_egp ?? fallbackPropertyPrice ?? null
  }

  const matchedRoomOption = rooms
    .flatMap((room) => room.room_sellable_options || [])
    .filter((option) => option.is_active !== false)
    .find((option) => normalizeRoomOptionCode(option.code) === optionCode)

  return matchedRoomOption?.price_egp ?? null
}

export default async function PropertyBookingRequestsPage() {
  const adminContext = await requirePropertyBookingRequestsAccess()
  const supabase = createAdminClient()
  const admin = adminContext.admin
  const brokerName = getAdminDisplayName(admin)

  let query = supabase
    .from('property_booking_requests')
    .select(`
      id,
      property_id,
      broker_id,
      user_id,
      customer_name,
      customer_phone,
      customer_email,
      customer_whatsapp,
      preferred_start_date,
      preferred_end_date,
      message,
      requested_option_code,
      status,
      created_at,
      updated_at,
      properties (
        id,
        property_id,
        title_en,
        title_ar,
        broker_id,
        price_egp,
        rental_duration,
        availability_status
      )
    `)
    .in('status', ['new', 'contacted', 'in_progress'])
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

  const requests = (data || []) as BookingRequest[]
  const propertyIds = Array.from(
    new Set(
      requests
        .map((request) => {
          const property = Array.isArray(request.properties)
            ? request.properties[0]
            : request.properties

          return property?.id || null
        })
        .filter(Boolean)
    )
  ) as string[]

  const userIds = Array.from(
    new Set(
      requests
        .map((request) => request.user_id)
        .filter((value): value is string => Boolean(value))
    )
  )

  let propertySellableOptionsByPropertyId = new Map<
    string,
    PropertySellableOption[]
  >()
  let roomsByPropertyId = new Map<string, PropertyRoom[]>()
  let walletBalanceByUserId = new Map<string, number>()
  let activeReservationsByPropertyId = new Map<string, ActiveReservation[]>()

  if (propertyIds.length > 0) {
    const [propertySellableOptionsRes, roomsRes, activeReservationsRes] =
      await Promise.all([
        supabase
          .from('property_sellable_options')
          .select(`
            id,
            property_id,
            code,
            name_en,
            name_ar,
            sell_mode,
            occupancy_size,
            price_egp,
            rental_duration,
            is_active,
            sort_order,
            pricing_mode,
            option_code
          `)
          .in('property_id', propertyIds)
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),

        supabase
          .from('property_rooms')
          .select(`
            id,
            property_id_ref,
            room_name,
            room_name_ar,
            room_type,
            status,
            sort_order,
            room_beds (
              id,
              room_id,
              status
            ),
            room_sellable_options:property_room_sellable_options (
              id,
              room_id,
              code,
              name_en,
              name_ar,
              occupancy_size,
              pricing_mode,
              price_egp,
              consumes_beds_count,
              is_exclusive,
              is_active,
              sort_order
            )
          `)
          .in('property_id_ref', propertyIds)
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),

        supabase
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
            created_at
          `)
          .in('property_id', propertyIds)
          .in('status', ['pending', 'reserved', 'checked_in'])
          .order('created_at', { ascending: false }),
      ])

    if (propertySellableOptionsRes.error) {
      throw new Error(propertySellableOptionsRes.error.message)
    }

    if (roomsRes.error) {
      throw new Error(roomsRes.error.message)
    }

    if (activeReservationsRes.error) {
      throw new Error(activeReservationsRes.error.message)
    }

    const propertySellableOptions = (propertySellableOptionsRes.data ||
      []) as PropertySellableOption[]

    const rooms = (roomsRes.data || []) as PropertyRoom[]

    const activeReservations = (activeReservationsRes.data ||
      []) as ActiveReservation[]

    propertySellableOptionsByPropertyId = propertySellableOptions.reduce(
      (map, option) => {
        const current = map.get(option.property_id) || []
        current.push(option)
        map.set(option.property_id, current)
        return map
      },
      new Map<string, PropertySellableOption[]>()
    )

    roomsByPropertyId = rooms.reduce((map, room) => {
      const current = map.get(room.property_id_ref) || []
      current.push(room)
      map.set(room.property_id_ref, current)
      return map
    }, new Map<string, PropertyRoom[]>())

    activeReservationsByPropertyId = activeReservations.reduce((map, reservation) => {
      const current = map.get(reservation.property_id) || []
      current.push(reservation)
      map.set(reservation.property_id, current)
      return map
    }, new Map<string, ActiveReservation[]>())
  }

  if (userIds.length > 0) {
    const { data: walletRows, error: walletError } = await supabase
      .from('user_wallets')
      .select('user_id, balance')
      .in('user_id', userIds)

    if (walletError) {
      throw new Error(walletError.message)
    }

    walletBalanceByUserId = new Map(
      (walletRows || []).map((row: any) => [row.user_id, Number(row.balance || 0)])
    )
  }

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

            {isSuperAdmin(admin) && (
              <Link
                href="/admin/properties/review"
                className="hidden rounded-full border border-gray-400 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:border-gray-900 hover:text-gray-900 md:inline-flex"
              >
                Review Queue
              </Link>
            )}

            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-4 pb-8 pt-6 md:px-6 md:pt-8">
        {requests.length === 0 ? (
          <div className="mt-6">
            <EmptyState />
          </div>
        ) : (
          <section className="mt-8 rounded-[32px] border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-gray-900 md:text-xl">
                  Open Booking Requests
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Accept pending requests and manage active reservations for the same property.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                <ClockIcon />
                <span>{requests.length} open requests</span>
              </div>
            </div>

            <div className="space-y-4 p-4 md:p-6">
              {requests.map((request) => {
                const property = Array.isArray(request.properties)
                  ? request.properties[0]
                  : request.properties

                const propertyTitle =
                  property?.title_en || property?.title_ar || 'Untitled Property'

                const propertyDbId = property?.id || ''
                const propertySellableOptions = propertyDbId
                  ? propertySellableOptionsByPropertyId.get(propertyDbId) || []
                  : []

                const propertyRooms = propertyDbId
                  ? roomsByPropertyId.get(propertyDbId) || []
                  : []

                const activeReservations = propertyDbId
                  ? activeReservationsByPropertyId.get(propertyDbId) || []
                  : []

                const mappedRooms: MappedRoom[] = propertyRooms.map((room) => {
                  const roomBeds = Array.isArray(room.room_beds)
                    ? room.room_beds
                    : []
                  const roomOptions = Array.isArray(room.room_sellable_options)
                    ? room.room_sellable_options
                    : []

                  return {
                    ...room,
                    room_beds: roomBeds,
                    room_sellable_options: roomOptions,
                    availableBedsCount: roomBeds.filter(
                      (bed) => bed.status === 'available'
                    ).length,
                    totalBedsCount: roomBeds.filter(
                      (bed) => bed.status !== 'inactive'
                    ).length,
                    sellableOptions: roomOptions,
                  }
                })

                const requestedPrice = getOptionPrice(
                  propertySellableOptions,
                  mappedRooms,
                  (request.requested_option_code as RequestedOptionCode) ?? null,
                  property?.price_egp ?? null
                )

                const currentWalletBalance = request.user_id
                  ? walletBalanceByUserId.get(request.user_id) ?? 0
                  : 0

                return (
                  <div
                    key={request.id}
                    className="rounded-[24px] border border-gray-200 bg-[#fcfcfc] p-4 shadow-sm"
                  >
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-[20px] border border-gray-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-base font-semibold text-gray-900">
                                {request.customer_name || '—'}
                              </h4>
                              <p className="mt-1 text-xs text-gray-500">
                                Request ID: {request.id}
                              </p>
                            </div>

                            <span
                              className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                                request.status
                              )}`}
                            >
                              {formatStatusLabel(request.status)}
                            </span>
                          </div>

                          <div className="mt-4 space-y-2 text-sm text-gray-700">
                            {request.customer_phone && (
                              <div className="flex items-center gap-2">
                                <PhoneIcon />
                                <span>{request.customer_phone}</span>
                              </div>
                            )}

                            {request.customer_email && (
                              <div className="flex items-center gap-2">
                                <MailIcon />
                                <span>{request.customer_email}</span>
                              </div>
                            )}

                            {request.customer_whatsapp && (
                              <div className="flex items-center gap-2">
                                <MessageSquareIcon />
                                <span>{request.customer_whatsapp}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">Requested Option</p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">
                                {getRequestedOptionLabel(request.requested_option_code)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">Created</p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">
                                {formatDate(request.created_at)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 sm:col-span-2">
                              <p className="text-xs text-gray-500">Current Wallet Balance</p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">
                                {request.user_id
                                  ? formatPrice(currentWalletBalance)
                                  : 'No linked user'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[20px] border border-gray-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                            Property
                          </p>

                          <h4 className="mt-2 text-base font-semibold text-gray-900">
                            {propertyTitle}
                          </h4>

                          <p className="mt-1 text-xs text-gray-500">
                            Property ID: {property?.property_id || '—'}
                          </p>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">Requested Price</p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">
                                {formatPrice(requestedPrice)}
                                <span className="text-gray-500">
                                  {formatRentalDuration(property?.rental_duration)}
                                </span>
                              </p>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">Availability</p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">
                                {formatAvailabilityLabel(property?.availability_status)}
                              </p>
                            </div>
                          </div>

                          {request.message ? (
                            <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">Message</p>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                                {request.message}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <BookingRequestActionsPanel
                        requestId={request.id}
                        propertyId={propertyDbId}
                        requestedOptionCode={
                          (request.requested_option_code as RequestedOptionCode) ?? null
                        }
                        propertySellableOptions={propertySellableOptions}
                        rooms={mappedRooms}
                        userId={request.user_id}
                        currentWalletBalance={currentWalletBalance}
                        activeReservations={activeReservations}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </section>
    </main>
  )
}