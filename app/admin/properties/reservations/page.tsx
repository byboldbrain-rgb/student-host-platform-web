import Link from 'next/link'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  requirePropertiesSectionAccess,
  isSuperAdmin,
  canReceivePropertyBookingRequests,
} from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'
import {
  cancelLegacyBedReservationAction,
  cancelPropertyReservationAction,
  renewPropertyReservationAction,
} from '../booking-requests/actions'

type SearchParams = Promise<{
  property_id?: string
}>

type BillingCycleSummary = {
  last_renewal_date: string | null
  last_billing_period_start: string | null
  last_billing_period_end: string | null
}

type ActiveUnifiedReservation =
  | {
      source: 'property_reservations'
      id: string
      property_id: string
      user_id: string | null
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
      user_wallet_balance: number | null
      user_wallet_currency: string | null
      last_renewal_date: string | null
      last_billing_period_start: string | null
      last_billing_period_end: string | null
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
      user_id: string | null
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
      user_wallet_balance: number | null
      user_wallet_currency: string | null
      last_renewal_date: null
      last_billing_period_start: null
      last_billing_period_end: null
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
  broker_id: string | null
}

type PropertyImage = {
  id: string
  property_id_ref: string
  image_url: string
  is_cover: boolean
  sort_order: number
  created_at?: string
}

type BookingRequestNotification = {
  id: string
}

function BrandLogo() {
  return (
    <Link
      href="/admin/properties"
      className="navienty-logo"
      aria-label="Navienty admin home"
    >
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

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
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

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-[20px] w-[20px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
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

function ReservationCardCover({
  reservation,
}: {
  reservation: ActiveUnifiedReservation
}) {
  return (
    <div className="relative flex w-full overflow-hidden bg-gradient-to-br from-[#eef4ff] via-[#f8fbff] to-[#edf2ff] px-5 py-4">
      <div className="relative z-[1] flex w-full flex-col justify-start">
        <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">
          {reservation.customer_name || '—'}
        </h3>
      </div>
    </div>
  )
}

function EmptyPropertiesState() {
  return (
    <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <GridIcon />
      </div>

      <h3 className="text-lg font-semibold text-slate-900">No properties found</h3>
      <p className="mt-2 text-sm text-slate-500">
        There are no properties available for this account right now.
      </p>
    </div>
  )
}

function EmptyReservationsState({ propertyTitle }: { propertyTitle?: string | null }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <InboxIcon />
      </div>

      <h3 className="text-lg font-semibold text-slate-900">
        No active reservations found
      </h3>
      <p className="mt-2 text-sm text-slate-500">
        {propertyTitle
          ? `There are no active reservations for ${propertyTitle} right now.`
          : 'Select a property to view its active reservations.'}
      </p>
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
    }).format(new Date(date))
  } catch {
    return '—'
  }
}

function formatPrice(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `${Number(value).toLocaleString()} EGP`
}

function getRenewButtonState(reservation: ActiveUnifiedReservation) {
  if (reservation.source !== 'property_reservations') {
    return {
      canRenew: false,
      reason: 'Renewal is only available for property reservations.',
    }
  }

  if (!reservation.user_id) {
    return {
      canRenew: false,
      reason: 'This reservation is not linked to a user account.',
    }
  }

  const amount = Number(reservation.total_price_egp || 0)
  const balance = Number(reservation.user_wallet_balance || 0)

  if (!amount || amount <= 0) {
    return {
      canRenew: false,
      reason: 'Reservation amount is missing.',
    }
  }

  if (balance < amount) {
    return {
      canRenew: false,
      reason: 'Insufficient wallet balance.',
    }
  }

  return {
    canRenew: true,
    reason: null,
  }
}

function MobileBottomNav({
  newReservationsCount,
}: {
  newReservationsCount: number
}) {
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
      active: false,
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
      active: true,
      badgeCount: 0,
    },
    {
      href: '/admin/change-password',
      label: 'Password',
      icon: <LockIcon />,
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
              className="flex min-w-[72px] flex-col items-center justify-center gap-1 px-1 py-2 text-center transition"
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
                className={`text-[10px] leading-[1.1] ${activeClass} ${
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

function RenewPropertyReservationForm({
  reservation,
}: {
  reservation: ActiveUnifiedReservation
}) {
  const { canRenew, reason } = getRenewButtonState(reservation)

  if (reservation.source !== 'property_reservations') {
    return null
  }

  return (
    <div>
      <form action={renewPropertyReservationAction}>
        <input type="hidden" name="reservation_id" value={reservation.id} />

        <button
          type="submit"
          disabled={!canRenew}
          className={`inline-flex w-full items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
            canRenew
              ? 'border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700'
              : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
          }`}
        >
          Renew Reservation
        </button>
      </form>

      {!canRenew && reason ? (
        <p className="mt-2 text-center text-xs font-medium text-slate-500">
          {reason}
        </p>
      ) : null}
    </div>
  )
}

function CancelPropertyReservationForm({
  reservationId,
}: {
  reservationId: string
}) {
  return (
    <form action={cancelPropertyReservationAction}>
      <input type="hidden" name="reservation_id" value={reservationId} />

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-full border border-red-600 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-red-700 hover:bg-red-700"
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
    <form action={cancelLegacyBedReservationAction}>
      <input
        type="hidden"
        name="legacy_reservation_id"
        value={reservationId}
      />

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-full border border-red-600 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-red-700 hover:bg-red-700"
      >
        Cancel Reservation
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
      broker_id: property.broker_id ?? null,
    })
  )

  const allowedPropertyIds = propertyOptions.map((property) => property.id)

  let propertyImagesMap: Record<string, PropertyImage[]> = {}

  if (allowedPropertyIds.length > 0) {
    const { data: imagesData, error: imagesError } = await supabase
      .from('property_images')
      .select(`
        id,
        property_id_ref,
        image_url,
        is_cover,
        sort_order,
        created_at
      `)
      .in('property_id_ref', allowedPropertyIds)
      .order('is_cover', { ascending: false })
      .order('sort_order', { ascending: true })

    if (imagesError) {
      throw new Error(imagesError.message)
    }

    const images = (imagesData || []) as PropertyImage[]

    propertyImagesMap = images.reduce<Record<string, PropertyImage[]>>((acc, image) => {
      if (!acc[image.property_id_ref]) {
        acc[image.property_id_ref] = []
      }

      acc[image.property_id_ref].push(image)
      return acc
    }, {})
  }

  const activeStatuses = ['pending', 'reserved', 'checked_in']

  let propertyReservationCountsQuery = supabase
    .from('property_reservations')
    .select('id, property_id, properties!inner(broker_id)')
    .in('status', activeStatuses)

  let legacyReservationCountsQuery = supabase
    .from('bed_reservations')
    .select('id, property_id, properties!inner(broker_id)')
    .in('status', activeStatuses)

  if (!isSuperAdmin(admin)) {
    propertyReservationCountsQuery = propertyReservationCountsQuery.eq(
      'properties.broker_id',
      admin.broker_id
    )
    legacyReservationCountsQuery = legacyReservationCountsQuery.eq(
      'properties.broker_id',
      admin.broker_id
    )
  }

  if (allowedPropertyIds.length > 0) {
    propertyReservationCountsQuery = propertyReservationCountsQuery.in(
      'property_id',
      allowedPropertyIds
    )
    legacyReservationCountsQuery = legacyReservationCountsQuery.in(
      'property_id',
      allowedPropertyIds
    )
  }

  const [
    { data: propertyReservationCountsData, error: propertyReservationCountsError },
    { data: legacyReservationCountsData, error: legacyReservationCountsError },
  ] = await Promise.all([
    propertyReservationCountsQuery,
    legacyReservationCountsQuery,
  ])

  if (propertyReservationCountsError) {
    throw new Error(propertyReservationCountsError.message)
  }

  if (legacyReservationCountsError) {
    throw new Error(legacyReservationCountsError.message)
  }

  const reservationCountsByProperty = new Map<string, number>()

  ;((propertyReservationCountsData || []) as any[]).forEach((reservation) => {
    const propertyId = reservation.property_id
    if (!propertyId) return

    reservationCountsByProperty.set(
      propertyId,
      (reservationCountsByProperty.get(propertyId) || 0) + 1
    )
  })

  ;((legacyReservationCountsData || []) as any[]).forEach((reservation) => {
    const propertyId = reservation.property_id
    if (!propertyId) return

    reservationCountsByProperty.set(
      propertyId,
      (reservationCountsByProperty.get(propertyId) || 0) + 1
    )
  })

  let unifiedReservations: ActiveUnifiedReservation[] = []

  if (selectedPropertyId && allowedPropertyIds.includes(selectedPropertyId)) {
    let propertyReservationsQuery = supabase
      .from('property_reservations')
      .select(`
        id,
        property_id,
        user_id,
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
      .in('status', activeStatuses)
      .eq('property_id', selectedPropertyId)
      .order('created_at', { ascending: false })

    let legacyBedReservationsQuery = supabase
      .from('bed_reservations')
      .select(`
        id,
        property_id,
        user_id,
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
      .in('status', activeStatuses)
      .eq('property_id', selectedPropertyId)
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

    const propertyReservationIds = ((propertyReservationsData || []) as any[]).map(
      (reservation) => reservation.id
    )

    const allUserIds = Array.from(
      new Set(
        [
          ...((propertyReservationsData || []) as any[]).map(
            (reservation) => reservation.user_id
          ),
          ...((legacyBedReservationsData || []) as any[]).map(
            (reservation) => reservation.user_id
          ),
        ].filter(Boolean)
      )
    ) as string[]

    const walletsMap = new Map<
      string,
      {
        balance: number
        currency: string
      }
    >()

    if (allUserIds.length > 0) {
      const { data: walletsData, error: walletsError } = await supabase
        .from('user_wallets')
        .select('user_id, balance, currency')
        .in('user_id', allUserIds)

      if (walletsError) {
        throw new Error(walletsError.message)
      }

      ;((walletsData || []) as any[]).forEach((wallet) => {
        walletsMap.set(wallet.user_id, {
          balance: Number(wallet.balance || 0),
          currency: wallet.currency || 'EGP',
        })
      })
    }

    const billingCyclesMap = new Map<string, BillingCycleSummary>()

    if (propertyReservationIds.length > 0) {
      const { data: billingCyclesData, error: billingCyclesError } = await supabase
        .from('reservation_billing_cycles')
        .select(`
          reservation_id,
          billing_period_start,
          billing_period_end,
          status,
          paid_at,
          created_at
        `)
        .in('reservation_id', propertyReservationIds)
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })

      if (billingCyclesError) {
        throw new Error(billingCyclesError.message)
      }

      ;((billingCyclesData || []) as any[]).forEach((cycle) => {
        if (billingCyclesMap.has(cycle.reservation_id)) return

        billingCyclesMap.set(cycle.reservation_id, {
          last_renewal_date: cycle.paid_at || cycle.created_at || null,
          last_billing_period_start: cycle.billing_period_start || null,
          last_billing_period_end: cycle.billing_period_end || null,
        })
      })
    }

    unifiedReservations = [
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

        const wallet = reservation.user_id
          ? walletsMap.get(reservation.user_id)
          : null

        const billingSummary = billingCyclesMap.get(reservation.id)

        return {
          source: 'property_reservations' as const,
          id: reservation.id,
          property_id: reservation.property_id,
          user_id: reservation.user_id,
          customer_name: reservation.customer_name,
          customer_phone: reservation.customer_phone,
          customer_email: reservation.customer_email,
          customer_whatsapp: reservation.customer_whatsapp,
          start_date: reservation.start_date || reservation.created_at,
          end_date: reservation.end_date,
          status: reservation.status,
          reservation_scope: reservation.reservation_scope,
          total_price_egp: Number(reservation.total_price_egp || 0),
          payment_status: reservation.payment_status,
          wallet_amount_used: reservation.wallet_amount_used,
          user_wallet_balance: wallet?.balance ?? null,
          user_wallet_currency: wallet?.currency ?? 'EGP',
          last_renewal_date: billingSummary?.last_renewal_date || null,
          last_billing_period_start:
            billingSummary?.last_billing_period_start || null,
          last_billing_period_end: billingSummary?.last_billing_period_end || null,
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

        const wallet = reservation.user_id
          ? walletsMap.get(reservation.user_id)
          : null

        return {
          source: 'bed_reservations' as const,
          id: reservation.id,
          property_id: reservation.property_id,
          user_id: reservation.user_id,
          customer_name: reservation.student_name,
          customer_phone: reservation.student_phone,
          customer_email: reservation.student_email,
          customer_whatsapp: reservation.student_whatsapp,
          start_date: reservation.start_date || reservation.created_at,
          end_date: reservation.end_date,
          status: reservation.status,
          reservation_scope: 'beds' as const,
          total_price_egp: null,
          payment_status: null,
          wallet_amount_used: null,
          user_wallet_balance: wallet?.balance ?? null,
          user_wallet_currency: wallet?.currency ?? 'EGP',
          last_renewal_date: null,
          last_billing_period_start: null,
          last_billing_period_end: null,
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
  }

  let newReservationsCount = 0

  if (canReceivePropertyBookingRequests(admin)) {
    let bookingRequestsQuery = supabase
      .from('property_booking_requests')
      .select(`
        id
      `)
      .in('status', ['new', 'contacted', 'in_progress'])
      .order('created_at', { ascending: false })

    if (!isSuperAdmin(admin)) {
      if (!admin.broker_id) {
        throw new Error('Editor account is missing broker assignment')
      }

      bookingRequestsQuery = bookingRequestsQuery.eq('broker_id', admin.broker_id)
    }

    const { data: bookingRequestsData, error: bookingRequestsError } =
      await bookingRequestsQuery

    if (bookingRequestsError) {
      throw new Error(bookingRequestsError.message)
    }

    const bookingRequests = (bookingRequestsData || []) as BookingRequestNotification[]
    newReservationsCount = bookingRequests.length
  }

  const selectedProperty = propertyOptions.find(
    (property) => property.id === selectedPropertyId
  )
  const selectedPropertyLabel = selectedProperty?.title || null

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

        .property-select-button {
          display: inline-flex;
          width: 100%;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 9999px;
          background-color: #155dfc;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #ffffff !important;
          text-decoration: none;
          transition:
            background-color 0.2s ease,
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .property-select-button:hover,
        .property-select-button:focus-visible {
          background-color: #0f4fe0;
          color: #ffffff !important;
        }

        .property-select-button svg {
          color: #ffffff !important;
        }

        .close-reservations-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 9999px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          padding: 12px 18px;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a !important;
          text-decoration: none;
          transition:
            border-color 0.2s ease,
            background-color 0.2s ease,
            color 0.2s ease;
        }

        .close-reservations-button:hover,
        .close-reservations-button:focus-visible {
          border-color: #0f172a;
          background-color: #f8fafc;
          color: #0f172a !important;
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
              {canReceivePropertyBookingRequests(admin) && (
                <Link
                  href="/admin/properties/booking-requests"
                  className="desktop-header-nav-button desktop-header-nav-button-inactive"
                >
                  <span className="inline-flex items-center gap-2">
                    <span>New Reservations</span>
                    <NotificationBadge count={newReservationsCount} />
                  </span>
                </Link>
              )}

              <Link
                href="/admin/properties"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Properties
              </Link>

              {canReceivePropertyBookingRequests(admin) && (
                <Link
                  href="/admin/properties/reservations"
                  className="desktop-header-nav-button desktop-header-nav-button-active"
                >
                  Manage Reservations
                </Link>
              )}

              {isSuperAdmin(admin) && (
                <Link
                  href="/admin/properties/review"
                  className="desktop-header-nav-button desktop-header-nav-button-inactive"
                >
                  Review Queue
                </Link>
              )}

              <Link
                href="/admin/change-password"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Change Password
              </Link>

              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1600px] px-4 pb-8 pt-6 md:px-6 md:pt-8">
          {!selectedPropertyId ? (
            <section className="rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div className="p-4 md:p-6">
                {propertyOptions.length === 0 ? (
                  <EmptyPropertiesState />
                ) : (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {propertyOptions.map((property) => {
                      const coverImage = getCoverImage(property.id, propertyImagesMap)

                      return (
                        <div
                          key={property.id}
                          className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.10)]"
                        >
                          <div className="relative h-56 overflow-hidden bg-slate-100">
                            {coverImage ? (
                              <img
                                src={coverImage}
                                alt={property.title}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <PropertyImagePlaceholder />
                            )}
                          </div>

                          <div className="p-5">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {property.title}
                            </h3>

                            <div className="mt-5">
                              <Link
                                href={`/admin/properties/reservations?property_id=${property.id}`}
                                className="property-select-button"
                              >
                                <EyeIcon />
                                <span className="text-white">View Reservations</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-200 px-5 py-5 md:px-7">
                <div className="flex items-center justify-between gap-3">
                  <h1 className="truncate text-lg font-semibold text-slate-900">
                    {selectedPropertyLabel || 'Property Reservations'}
                  </h1>

                  <Link
                    href="/admin/properties/reservations"
                    className="close-reservations-button"
                  >
                    Close
                  </Link>
                </div>
              </div>

              <div className="p-4 md:p-6">
                {unifiedReservations.length === 0 ? (
                  <EmptyReservationsState propertyTitle={selectedPropertyLabel} />
                ) : (
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
                    {unifiedReservations.map((reservation) => (
                      <div
                        key={`${reservation.source}-${reservation.id}`}
                        className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.10)]"
                      >
                        <ReservationCardCover reservation={reservation} />

                        <div className="p-4">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
                              <p className="text-xs text-slate-500">Total Price</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {formatPrice(reservation.total_price_egp)}
                              </p>
                            </div>

                            <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
                              <p className="text-xs text-slate-500">Wallet Balance</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {formatPrice(reservation.user_wallet_balance)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 rounded-[22px] border border-slate-100 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Reservation Dates
                            </p>

                            <div className="mt-3 space-y-2 text-sm text-slate-700">
                              <p>
                                <span className="font-medium text-slate-900">
                                  Start Date:
                                </span>{' '}
                                {formatDate(reservation.start_date)}
                              </p>

                              <p>
                                <span className="font-medium text-slate-900">
                                  Renewal Date:
                                </span>{' '}
                                {reservation.last_renewal_date
                                  ? formatDate(reservation.last_renewal_date)
                                  : 'Not renewed yet'}
                              </p>

                              {reservation.last_billing_period_start ||
                              reservation.last_billing_period_end ? (
                                <p>
                                  <span className="font-medium text-slate-900">
                                    Last Renewal Period:
                                  </span>{' '}
                                  {formatDate(reservation.last_billing_period_start)}
                                  {' - '}
                                  {formatDate(reservation.last_billing_period_end)}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-4 rounded-[22px] border border-slate-100 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Contact Details
                            </p>

                            <div className="mt-3 space-y-2 text-sm text-slate-700">
                              {reservation.customer_phone ? (
                                <p>
                                  <span className="font-medium text-slate-900">
                                    Phone:
                                  </span>{' '}
                                  {reservation.customer_phone}
                                </p>
                              ) : null}

                              {reservation.customer_whatsapp ? (
                                <p>
                                  <span className="font-medium text-slate-900">
                                    WhatsApp:
                                  </span>{' '}
                                  {reservation.customer_whatsapp}
                                </p>
                              ) : null}

                              {!reservation.customer_phone &&
                              !reservation.customer_email &&
                              !reservation.customer_whatsapp ? (
                                <p className="text-slate-500">
                                  No contact details available
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-3">
                            <RenewPropertyReservationForm reservation={reservation} />

                            {reservation.source === 'property_reservations' ? (
                              <CancelPropertyReservationForm
                                reservationId={reservation.id}
                              />
                            ) : (
                              <CancelLegacyBedReservationForm
                                reservationId={reservation.id}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </section>

        {canReceivePropertyBookingRequests(admin) && (
          <MobileBottomNav newReservationsCount={newReservationsCount} />
        )}

        {!canReceivePropertyBookingRequests(admin) && (
          <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e8e8ee] bg-white md:hidden">
            <div className="mx-auto flex h-[74px] max-w-md items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
              <Link
                href="/admin/properties"
                className="flex min-w-[72px] flex-col items-center justify-center gap-1 px-1 py-2 text-center transition"
              >
                <span className="relative flex items-center justify-center text-[#6b7280]">
                  <GridIcon />
                </span>
                <span className="text-[10px] font-medium leading-[1.1] text-[#6b7280]">
                  Properties
                </span>
              </Link>

              <Link
                href="/admin/properties/reservations"
                className="flex min-w-[72px] flex-col items-center justify-center gap-1 px-1 py-2 text-center transition"
              >
                <span className="relative flex items-center justify-center text-[#155dfc]">
                  <BanIcon />
                </span>
                <span className="text-[10px] font-semibold leading-[1.1] text-[#155dfc]">
                  Reservations
                </span>
              </Link>

              {isSuperAdmin(admin) && (
                <Link
                  href="/admin/properties/review"
                  className="flex min-w-[72px] flex-col items-center justify-center gap-1 px-1 py-2 text-center transition"
                >
                  <span className="relative flex items-center justify-center text-[#6b7280]">
                    <ClipboardListIcon />
                  </span>
                  <span className="text-[10px] font-medium leading-[1.1] text-[#6b7280]">
                    Review
                  </span>
                </Link>
              )}

              <Link
                href="/admin/change-password"
                className="flex min-w-[72px] flex-col items-center justify-center gap-1 px-1 py-2 text-center transition"
              >
                <span className="relative flex items-center justify-center text-[#6b7280]">
                  <LockIcon />
                </span>
                <span className="text-[10px] font-medium leading-[1.1] text-[#6b7280]">
                  Password
                </span>
              </Link>
            </div>
          </nav>
        )}
      </main>
    </>
  )
}