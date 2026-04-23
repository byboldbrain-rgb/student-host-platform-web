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

type RoomCurrentMode = 'single_room' | 'double_room' | 'triple_room' | null

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
  is_active?: boolean | null
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
  currentMode: RoomCurrentMode
}

type ActiveReservation = {
  id: string
  property_id: string
  room_sellable_option_id: string | null
  sellable_option_id: string | null
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

type PropertyImage = {
  id: string
  property_id_ref: string
  image_url: string
  is_cover: boolean
  sort_order: number
  created_at?: string
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
    <Link href="/admin/properties" className="navienty-logo" aria-label="Navienty admin home">
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

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
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

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
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

function BuildingIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 10h.01" />
      <path d="M15 10h.01" />
      <path d="M9 14h.01" />
      <path d="M15 14h.01" />
    </svg>
  )
}

function ClipboardListIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-[20px] w-[20px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  )
}

function MobileNavIcon({
  src,
  alt,
}: {
  src: string
  alt: string
}) {
  return <img src={src} alt={alt} className="h-[20px] w-[20px] object-contain" />
}

function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null

  return (
    <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-[5px] text-[10px] font-bold leading-none text-white shadow-md">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <InboxIcon />
      </div>

      <h3 className="text-lg font-semibold text-slate-900">No new reservations found</h3>
      <p className="mt-2 text-sm text-slate-500">
        There are no open guest reservation requests right now.
      </p>
    </div>
  )
}

function PropertyImagePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
      <div className="flex flex-col items-center justify-center text-slate-500">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 shadow-sm">
          <BuildingIcon />
        </div>
        <p className="text-sm font-medium">No image available</p>
      </div>
    </div>
  )
}

function getCoverImage(
  propertyId: string,
  imagesMap: Record<string, PropertyImage[]>
) {
  const propertyImages = imagesMap[propertyId] || []

  if (propertyImages.length === 0) {
    return null
  }

  const sortedImages = [...propertyImages].sort((a, b) => {
    if (a.is_cover !== b.is_cover) {
      return Number(b.is_cover) - Number(a.is_cover)
    }

    if ((a.sort_order ?? 0) !== (b.sort_order ?? 0)) {
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    }

    return 0
  })

  return sortedImages[0]?.image_url || null
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
    return 'border-[#dbe5ff] bg-[#f3f6ff] text-[#054aff]'
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

function sanitizePropertyRooms(rooms: PropertyRoom[]) {
  return rooms.map((room) => {
    const roomBeds = Array.isArray(room.room_beds)
      ? room.room_beds.filter((bed) => bed && bed.is_active !== false)
      : []

    const roomSellableOptions = Array.isArray(room.room_sellable_options)
      ? room.room_sellable_options.filter(
          (option) => option && option.is_active !== false
        )
      : []

    return {
      ...room,
      room_beds: roomBeds,
      room_sellable_options: roomSellableOptions,
    }
  })
}

function getOptionCodeFromRoomOptionId(
  roomOptionId: string | null | undefined,
  roomOptions: RoomSellableOption[]
): RoomCurrentMode {
  if (!roomOptionId) return null

  const matchedOption = roomOptions.find((option) => option.id === roomOptionId)
  const normalizedCode = normalizeRoomOptionCode(matchedOption?.code)

  if (
    normalizedCode === 'single_room' ||
    normalizedCode === 'double_room' ||
    normalizedCode === 'triple_room'
  ) {
    return normalizedCode
  }

  return null
}

function resolveRoomCurrentMode(params: {
  roomOptions: RoomSellableOption[]
  roomReservations: ActiveReservation[]
}): RoomCurrentMode {
  const { roomOptions, roomReservations } = params

  for (const reservation of roomReservations) {
    if (reservation.reservation_scope === 'entire_room') {
      return 'single_room'
    }

    const optionCode = getOptionCodeFromRoomOptionId(
      reservation.room_sellable_option_id,
      roomOptions
    )

    if (optionCode === 'single_room') return 'single_room'
    if (optionCode === 'double_room') return 'double_room'
    if (optionCode === 'triple_room') return 'triple_room'
  }

  return null
}

function MobileBottomNav({ newReservationsCount }: { newReservationsCount: number }) {
  const items = [
    {
      href: '/admin/properties/booking-requests',
      label: 'New Reservations',
      icon: (
        <MobileNavIcon
          src="https://i.ibb.co/hxXpLKv3/add-event-6756388.png"
          alt="New Reservations"
        />
      ),
      active: true,
      badgeCount: newReservationsCount,
    },
    {
      href: '/admin/properties',
      label: 'Properties',
      icon: (
        <MobileNavIcon
          src="https://i.ibb.co/Dfs0dvX3/property-11608478.png"
          alt="Properties"
        />
      ),
      active: false,
      badgeCount: 0,
    },
    {
      href: '/admin/properties/reservations',
      label: 'Manage Reservations',
      icon: (
        <MobileNavIcon
          src="https://i.ibb.co/zTk4mxj1/delete-event-5577905.png"
          alt="Manage Reservations"
        />
      ),
      active: false,
      badgeCount: 0,
    },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e8e8ee] bg-white md:hidden">
      <div className="mx-auto flex h-[74px] max-w-md items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const activeClass = item.active ? 'text-[#155dfc]' : 'text-[#6b7280]'

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-[88px] flex-col items-center justify-center gap-1 px-2 py-2 text-center transition"
            >
              <span className={`relative flex items-center justify-center ${activeClass}`}>
                {item.icon}

                {item.badgeCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-[5px] text-[10px] font-bold text-white shadow-md">
                    {item.badgeCount > 99 ? '99+' : item.badgeCount}
                  </span>
                )}
              </span>

              <span
                className={`text-[11px] leading-[1.1] ${activeClass} ${
                  item.active ? 'font-semibold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
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
  const newReservationsCount = requests.length

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
  let propertyImagesMap: Record<string, PropertyImage[]> = {}

  if (propertyIds.length > 0) {
    const [propertySellableOptionsRes, roomsRes, activeReservationsRes, imagesRes] =
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
              status,
              is_active
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
            room_sellable_option_id,
            sellable_option_id,
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

        supabase
          .from('property_images')
          .select(`
            id,
            property_id_ref,
            image_url,
            is_cover,
            sort_order,
            created_at
          `)
          .in('property_id_ref', propertyIds)
          .order('is_cover', { ascending: false })
          .order('sort_order', { ascending: true }),
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

    if (imagesRes.error) {
      throw new Error(imagesRes.error.message)
    }

    const propertySellableOptions = (propertySellableOptionsRes.data ||
      []) as PropertySellableOption[]

    const rooms = sanitizePropertyRooms((roomsRes.data || []) as PropertyRoom[])

    const activeReservations = (activeReservationsRes.data ||
      []) as ActiveReservation[]

    const images = (imagesRes.data || []) as PropertyImage[]

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

    propertyImagesMap = images.reduce<Record<string, PropertyImage[]>>((acc, image) => {
      if (!acc[image.property_id_ref]) {
        acc[image.property_id_ref] = []
      }

      acc[image.property_id_ref].push(image)
      return acc
    }, {})
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

      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef4ff,_#f8fafc_45%,_#f8fafc_100%)] pb-24 text-slate-700 md:pb-8">
        <header className="sticky top-0 z-[110] bg-[#f5f7f9]">
          <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
            <BrandLogo />

            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/admin/properties/booking-requests"
                className="desktop-header-nav-button desktop-header-nav-button-active"
              >
                <span className="inline-flex items-center gap-2">
                  <span>New Reservations</span>
                  <NotificationBadge count={newReservationsCount} />
                </span>
              </Link>

              <Link
                href="/admin/properties"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Properties
              </Link>

              <Link
                href="/admin/properties/reservations"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Manage Reservations
              </Link>

              {isSuperAdmin(admin) && (
                <Link
                  href="/admin/properties/review"
                  className="desktop-header-nav-button desktop-header-nav-button-inactive"
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
            <section className="mt-8 rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-200 px-5 py-5 md:px-7">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">
                  New Reservation Requests
                </h3>
              </div>

              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
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

                    const coverImage = propertyDbId
                      ? getCoverImage(propertyDbId, propertyImagesMap)
                      : null

                    const mappedRooms: MappedRoom[] = propertyRooms.map((room) => {
                      const roomBeds = Array.isArray(room.room_beds)
                        ? room.room_beds.filter((bed) => bed && bed.is_active !== false)
                        : []

                      const roomOptions = Array.isArray(room.room_sellable_options)
                        ? room.room_sellable_options.filter(
                            (option) => option && option.is_active !== false
                          )
                        : []

                      const roomOptionIds = new Set(roomOptions.map((option) => option.id))

                      const roomReservations = activeReservations.filter((reservation) => {
                        if (!reservation.room_sellable_option_id) {
                          return false
                        }

                        return roomOptionIds.has(reservation.room_sellable_option_id)
                      })

                      return {
                        ...room,
                        room_beds: roomBeds,
                        room_sellable_options: roomOptions,
                        availableBedsCount: roomBeds.filter(
                          (bed) => bed.status === 'available'
                        ).length,
                        totalBedsCount: roomBeds.length,
                        sellableOptions: roomOptions,
                        currentMode: resolveRoomCurrentMode({
                          roomOptions,
                          roomReservations,
                        }),
                      }
                    })

                    const currentWalletBalance = request.user_id
                      ? walletBalanceByUserId.get(request.user_id) ?? 0
                      : 0

                    const requestedOptionCode =
                      (request.requested_option_code as RequestedOptionCode) ?? null

                    const optionPrice = getOptionPrice(
                      propertySellableOptions,
                      propertyRooms,
                      requestedOptionCode,
                      property?.price_egp
                    )

                    return (
                      <div
                        key={request.id}
                        className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.10)]"
                      >
                        <div className="relative h-56 overflow-hidden bg-slate-100">
                          {coverImage ? (
                            <img
                              src={coverImage}
                              alt={propertyTitle}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <PropertyImagePlaceholder />
                          )}

                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-5">
                            <div className="flex items-end justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="truncate text-lg font-semibold text-white">
                                  {propertyTitle}
                                </h4>
                               
                              </div>

                             
                            </div>
                          </div>
                        </div>

                        <div className="p-5">
                          <div className="mt-4 grid gap-3">
                            {request.customer_phone && (
                              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                                <div className="mt-0.5 text-slate-500">
                                  <PhoneIcon />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                                    Phone
                                  </p>
                                  <p className="truncate text-sm font-medium text-slate-700">
                                    {request.customer_phone}
                                  </p>
                                </div>
                              </div>
                            )}

                            {request.customer_name && (
                              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                                <div className="mt-0.5 text-slate-500">
                                  <UserIcon />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                                    Customer Name
                                  </p>
                                  <p className="truncate text-sm font-medium text-slate-700">
                                    {request.customer_name}
                                  </p>
                                </div>
                              </div>
                            )}

                          </div>

                          

                         

                          <div className="mt-5 border-t border-slate-200 pt-5">
                            <BookingRequestActionsPanel
                              requestId={request.id}
                              propertyId={propertyDbId}
                              requestedOptionCode={requestedOptionCode}
                              propertySellableOptions={propertySellableOptions}
                              rooms={mappedRooms}
                              userId={request.user_id}
                              currentWalletBalance={currentWalletBalance}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          )}
        </section>

        <MobileBottomNav newReservationsCount={newReservationsCount} />
      </main>
    </>
  )
}