'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  requirePropertyBookingRequestsAccess,
  isSuperAdmin,
} from '@/src/lib/admin-auth'
import { applyWalletTransactionByAdmin } from '@/src/lib/services/wallet-service'

type BookingRequestStatus =
  | 'new'
  | 'contacted'
  | 'in_progress'
  | 'converted'
  | 'cancelled'

type ReservationScope = 'entire_property' | 'entire_room' | 'beds'
type PropertyAvailabilityStatus =
  | 'available'
  | 'partially_reserved'
  | 'fully_reserved'
  | 'inactive'
type RoomStatus =
  | 'available'
  | 'partially_reserved'
  | 'fully_reserved'
  | 'inactive'
type BedStatus =
  | 'available'
  | 'reserved'
  | 'occupied'
  | 'maintenance'
  | 'inactive'

type PropertyReservationStatus =
  | 'pending'
  | 'reserved'
  | 'checked_in'
  | 'completed'
  | 'cancelled'

type LegacyBedReservationStatus =
  | 'pending'
  | 'reserved'
  | 'checked_in'
  | 'completed'
  | 'cancelled'

type RequestedOptionCode =
  | 'single_room'
  | 'double_room'
  | 'triple_room'
  | 'full_apartment'
  | null

type ActiveReservationStatus = 'pending' | 'reserved' | 'checked_in'

type AuthorizedBookingRequest = {
  id: string
  broker_id: string | null
  property_id: string
  user_id: string | null
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  customer_whatsapp: string | null
  preferred_start_date: string | null
  preferred_end_date: string | null
  message: string | null
  status: BookingRequestStatus
  requested_option_code: string | null
}

type AuthorizedReservation = {
  id: string
  property_id: string
  user_id: string | null
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  customer_whatsapp: string | null
  reservation_scope: ReservationScope
  room_sellable_option_id: string | null
  sellable_option_id: string | null
  reserved_units_count: number
  total_price_egp: number
  start_date: string | null
  end_date: string | null
  status: PropertyReservationStatus
  notes: string | null
  wallet_amount_used: number | null
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded' | string
  created_at: string
}

type AuthorizedLegacyBedReservation = {
  id: string
  property_id: string
  room_id: string
  bed_id: string
  student_name: string
  student_phone: string | null
  student_email: string | null
  student_whatsapp: string | null
  start_date: string | null
  end_date: string | null
  status: LegacyBedReservationStatus
  notes: string | null
  created_at: string
  user_id: string | null
}

type ReservationAllocationRow = {
  id: string
  reservation_id: string
  property_id: string
  room_id: string | null
  bed_id: string | null
  allocation_type: 'property' | 'room' | 'bed'
}

type RoomRow = {
  id: string
  status: RoomStatus
  is_active: boolean
}

type BedRow = {
  id: string
  room_id: string
  status: BedStatus
  is_active: boolean
  sort_order: number | null
  created_at?: string | null
}

type RoomSellableOptionRow = {
  id: string
  room_id: string
  code: string
  is_active: boolean
}

type RoomWithBeds = {
  id: string
  property_id_ref: string
  status: RoomStatus
  is_active: boolean
  room_beds: BedRow[]
  room_sellable_options: RoomSellableOptionRow[]
}

type RoomReservationRow = {
  id: string
  status: ActiveReservationStatus
  reservation_scope: ReservationScope
  room_sellable_option_id: string | null
}

type RoomModeState = {
  totalActiveBeds: number
  activeAvailableBeds: BedRow[]
  singleReservationsCount: number
  doubleReservationsCount: number
  tripleReservationsCount: number
  hasSingleMode: boolean
  hasDoubleMode: boolean
  hasTripleMode: boolean
  doubleCapacity: number
  tripleCapacity: number
  optionIds: {
    single: string[]
    double: string[]
    triple: string[]
  }
}

type ReferralRewardRpcResult = {
  success?: boolean
  reason?: string
  referral_id?: string
  inviter_bonus_amount?: number
  invited_bonus_amount?: number
}

const ACTIVE_RESERVATION_STATUSES: ActiveReservationStatus[] = [
  'pending',
  'reserved',
  'checked_in',
]

function parseRequestId(formData: FormData) {
  const requestId = String(formData.get('request_id') || '').trim()

  if (!requestId) {
    throw new Error('Booking request id is required')
  }

  return requestId
}

function parseReservationId(formData: FormData) {
  const reservationId = String(formData.get('reservation_id') || '').trim()

  if (!reservationId) {
    throw new Error('Reservation id is required')
  }

  return reservationId
}

function parseLegacyReservationId(formData: FormData) {
  const reservationId = String(formData.get('legacy_reservation_id') || '').trim()

  if (!reservationId) {
    throw new Error('Legacy reservation id is required')
  }

  return reservationId
}

function parseOptionalString(value: FormDataEntryValue | null) {
  const parsed = String(value || '').trim()
  return parsed || null
}

function parsePositiveInteger(
  value: FormDataEntryValue | null,
  fallback = 1
): number {
  const parsed = String(value || '').trim()

  if (!parsed) {
    return fallback
  }

  const num = Number(parsed)

  if (!Number.isInteger(num) || num <= 0) {
    throw new Error('Reserved units count must be a positive integer')
  }

  return num
}

function parseNullableNumber(value: FormDataEntryValue | null) {
  const parsed = String(value || '').trim()

  if (!parsed) {
    return null
  }

  const num = Number(parsed)

  if (!Number.isFinite(num) || num < 0) {
    throw new Error('Total price must be a valid non-negative number')
  }

  return num
}

function parseReservationScope(value: FormDataEntryValue | null): ReservationScope {
  const parsed = String(value || '').trim()

  if (
    parsed === 'entire_property' ||
    parsed === 'entire_room' ||
    parsed === 'beds'
  ) {
    return parsed
  }

  return 'beds'
}

function parseRequestedOptionCode(
  value: FormDataEntryValue | string | null | undefined
): RequestedOptionCode {
  const parsed = String(value || '').trim()

  if (
    parsed === 'single_room' ||
    parsed === 'double_room' ||
    parsed === 'triple_room' ||
    parsed === 'full_apartment'
  ) {
    return parsed
  }

  return null
}

function parseBoolean(value: FormDataEntryValue | null, fallback = false) {
  const parsed = String(value || '').trim().toLowerCase()

  if (parsed === 'true') return true
  if (parsed === 'false') return false

  return fallback
}

function resolveReservationScope(params: {
  explicitScope: ReservationScope
  requestedOptionCode: RequestedOptionCode
}) {
  const { explicitScope, requestedOptionCode } = params

  if (requestedOptionCode === 'full_apartment') {
    return 'entire_property' as ReservationScope
  }

  if (requestedOptionCode === 'single_room') {
    return 'entire_room' as ReservationScope
  }

  if (requestedOptionCode === 'double_room') {
    return 'beds' as ReservationScope
  }

  if (requestedOptionCode === 'triple_room') {
    return 'beds' as ReservationScope
  }

  return explicitScope
}

function buildReservationNotes(
  request: AuthorizedBookingRequest,
  adminNotes?: string | null
) {
  const parts: string[] = []

  parts.push(`Booking request id: ${request.id}`)

  if (request.requested_option_code?.trim()) {
    parts.push(`Requested option: ${request.requested_option_code.trim()}`)
  }

  if (request.message?.trim()) {
    parts.push(`Booking request message: ${request.message.trim()}`)
  }

  if (adminNotes?.trim()) {
    parts.push(`Admin note: ${adminNotes.trim()}`)
  }

  return parts.join('\n\n') || null
}

function appendCancellationNote(
  currentNotes: string | null | undefined,
  cancellationReason?: string | null
) {
  const parts = [String(currentNotes || '').trim()].filter(Boolean)

  if (cancellationReason?.trim()) {
    parts.push(`Cancellation note: ${cancellationReason.trim()}`)
  } else {
    parts.push('Cancellation note: Cancelled by broker')
  }

  return parts.join('\n\n')
}

function sortBeds(beds: BedRow[]) {
  return [...beds].sort((a, b) => {
    const sortA = a.sort_order ?? 0
    const sortB = b.sort_order ?? 0

    if (sortA !== sortB) return sortA - sortB

    return String(a.created_at || '').localeCompare(String(b.created_at || ''))
  })
}

function getOptionIdsByCode(options: RoomSellableOptionRow[], code: RequestedOptionCode) {
  return options
    .filter((option) => option.is_active !== false)
    .filter((option) => option.code === code)
    .map((option) => option.id)
}

function getPaymentStatusFromWalletUsage(params: {
  totalPrice: number
  walletAmountUsed: number
}) {
  if (params.walletAmountUsed <= 0) return 'unpaid'
  if (params.walletAmountUsed >= params.totalPrice) return 'paid'
  return 'partial'
}

async function awardReferralAfterPaidReservationDirectly(params: {
  supabase: ReturnType<typeof createAdminClient>
  invitedUserId: string
  sourceReservationId: string
  adminUserId?: string | null
}) {
  const { supabase, invitedUserId, sourceReservationId, adminUserId } = params

  const { data, error } = await supabase.rpc('award_referral_first_paid_bonus', {
    p_invited_user_id: invitedUserId,
    p_source_reservation_id: sourceReservationId,
    p_created_by_admin_id: adminUserId ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  const result = (data || {}) as ReferralRewardRpcResult

  return result
}

async function getAuthorizedBookingRequest(requestId: string) {
  const adminContext = await requirePropertyBookingRequestsAccess()
  const supabase = createAdminClient()
  const admin = adminContext.admin

  const { data: request, error } = await supabase
    .from('property_booking_requests')
    .select(`
      id,
      broker_id,
      property_id,
      user_id,
      customer_name,
      customer_phone,
      customer_email,
      customer_whatsapp,
      preferred_start_date,
      preferred_end_date,
      message,
      status,
      requested_option_code
    `)
    .eq('id', requestId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!request) {
    throw new Error('Booking request not found')
  }

  if (!isSuperAdmin(admin)) {
    if (!admin.broker_id) {
      throw new Error('Editor account is missing broker assignment')
    }

    if (request.broker_id !== admin.broker_id) {
      throw new Error('You are not allowed to manage this booking request')
    }
  }

  return {
    admin,
    supabase,
    request: request as AuthorizedBookingRequest,
  }
}

async function getAuthorizedReservation(reservationId: string) {
  const adminContext = await requirePropertyBookingRequestsAccess()
  const supabase = createAdminClient()
  const admin = adminContext.admin

  const { data: reservation, error } = await supabase
    .from('property_reservations')
    .select(`
      id,
      property_id,
      user_id,
      customer_name,
      customer_phone,
      customer_email,
      customer_whatsapp,
      reservation_scope,
      room_sellable_option_id,
      sellable_option_id,
      reserved_units_count,
      total_price_egp,
      start_date,
      end_date,
      status,
      notes,
      wallet_amount_used,
      payment_status,
      created_at,
      properties!inner (
        id,
        broker_id
      )
    `)
    .eq('id', reservationId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!reservation) {
    throw new Error('Reservation not found')
  }

  const property = Array.isArray((reservation as any).properties)
    ? (reservation as any).properties[0]
    : (reservation as any).properties

  if (!isSuperAdmin(admin)) {
    if (!admin.broker_id) {
      throw new Error('Editor account is missing broker assignment')
    }

    if (!property?.broker_id || property.broker_id !== admin.broker_id) {
      throw new Error('You are not allowed to manage this reservation')
    }
  }

  const { properties, ...reservationFields } = reservation as any

  return {
    admin,
    supabase,
    reservation: reservationFields as AuthorizedReservation,
  }
}

async function getAuthorizedLegacyBedReservation(reservationId: string) {
  const adminContext = await requirePropertyBookingRequestsAccess()
  const supabase = createAdminClient()
  const admin = adminContext.admin

  const { data: reservation, error } = await supabase
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
      user_id,
      properties!inner (
        id,
        broker_id
      )
    `)
    .eq('id', reservationId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!reservation) {
    throw new Error('Legacy bed reservation not found')
  }

  const property = Array.isArray((reservation as any).properties)
    ? (reservation as any).properties[0]
    : (reservation as any).properties

  if (!isSuperAdmin(admin)) {
    if (!admin.broker_id) {
      throw new Error('Editor account is missing broker assignment')
    }

    if (!property?.broker_id || property.broker_id !== admin.broker_id) {
      throw new Error('You are not allowed to manage this reservation')
    }
  }

  const { properties, ...reservationFields } = reservation as any

  return {
    admin,
    supabase,
    reservation: reservationFields as AuthorizedLegacyBedReservation,
  }
}

/**
 * Full recalculation for the entire property.
 * This is the main fix that prevents stale reserved room/bed states.
 */
async function recalculatePropertyAvailabilityState(params: {
  supabase: ReturnType<typeof createAdminClient>
  propertyId: string
}) {
  const { supabase, propertyId } = params

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, is_active')
    .eq('id', propertyId)
    .maybeSingle()

  if (propertyError) {
    throw new Error(propertyError.message)
  }

  if (!property) {
    throw new Error('Property not found')
  }

  const { data: rooms, error: roomsError } = await supabase
    .from('property_rooms')
    .select('id, is_active')
    .eq('property_id_ref', propertyId)

  if (roomsError) {
    throw new Error(roomsError.message)
  }

  const typedRooms = (rooms || []) as Array<{
    id: string
    is_active: boolean
  }>

  const roomIds = typedRooms.map((room) => room.id)

  const bedsByRoomId = new Map<
    string,
    Array<{ id: string; room_id: string; is_active: boolean }>
  >()

  if (roomIds.length > 0) {
    const { data: allBeds, error: allBedsError } = await supabase
      .from('room_beds')
      .select('id, room_id, is_active')
      .in('room_id', roomIds)

    if (allBedsError) {
      throw new Error(allBedsError.message)
    }

    for (const bed of (allBeds || []) as Array<{
      id: string
      room_id: string
      is_active: boolean
    }>) {
      const current = bedsByRoomId.get(bed.room_id) || []
      current.push(bed)
      bedsByRoomId.set(bed.room_id, current)
    }
  }

  const { data: activePropertyReservations, error: activePropertyReservationsError } =
    await supabase
      .from('property_reservations')
      .select('id, status')
      .eq('property_id', propertyId)
      .in('status', ACTIVE_RESERVATION_STATUSES)

  if (activePropertyReservationsError) {
    throw new Error(activePropertyReservationsError.message)
  }

  const activePropertyReservationIds = (activePropertyReservations || []).map(
    (reservation: any) => reservation.id
  )

  let activeAllocations: Array<{
    reservation_id: string
    room_id: string | null
    bed_id: string | null
    allocation_type: 'property' | 'room' | 'bed'
  }> = []

  if (activePropertyReservationIds.length > 0) {
    const { data: allocations, error: allocationsError } = await supabase
      .from('property_reservation_allocations')
      .select('reservation_id, room_id, bed_id, allocation_type')
      .in('reservation_id', activePropertyReservationIds)

    if (allocationsError) {
      throw new Error(allocationsError.message)
    }

    activeAllocations = (allocations || []) as Array<{
      reservation_id: string
      room_id: string | null
      bed_id: string | null
      allocation_type: 'property' | 'room' | 'bed'
    }>
  }

  const { data: activeLegacyReservations, error: activeLegacyReservationsError } =
    await supabase
      .from('bed_reservations')
      .select('id, room_id, bed_id, status')
      .eq('property_id', propertyId)
      .in('status', ACTIVE_RESERVATION_STATUSES)

  if (activeLegacyReservationsError) {
    throw new Error(activeLegacyReservationsError.message)
  }

  const hasActiveEntirePropertyReservation = activeAllocations.some(
    (allocation) => allocation.allocation_type === 'property'
  )

  const activeReservedRoomIds = new Set<string>(
    activeAllocations
      .filter(
        (allocation) =>
          allocation.allocation_type === 'room' && Boolean(allocation.room_id)
      )
      .map((allocation) => allocation.room_id as string)
  )

  const activeReservedBedIds = new Set<string>([
    ...activeAllocations
      .filter(
        (allocation) =>
          allocation.allocation_type === 'bed' && Boolean(allocation.bed_id)
      )
      .map((allocation) => allocation.bed_id as string),
    ...((activeLegacyReservations || []) as Array<{
      id: string
      room_id: string
      bed_id: string
      status: ActiveReservationStatus
    }>)
      .filter((reservation) => Boolean(reservation.bed_id))
      .map((reservation) => reservation.bed_id),
  ])

  for (const room of typedRooms) {
    const roomBeds = bedsByRoomId.get(room.id) || []

    for (const bed of roomBeds) {
      const nextBedStatus: BedStatus = !bed.is_active
        ? 'inactive'
        : activeReservedBedIds.has(bed.id)
        ? 'reserved'
        : 'available'

      const { error: updateBedError } = await supabase
        .from('room_beds')
        .update({
          status: nextBedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bed.id)

      if (updateBedError) {
        throw new Error(updateBedError.message)
      }
    }
  }

  const recalculatedRoomStatuses: RoomStatus[] = []

  for (const room of typedRooms) {
    let nextRoomStatus: RoomStatus = 'available'

    if (!room.is_active) {
      nextRoomStatus = 'inactive'
    } else if (hasActiveEntirePropertyReservation) {
      nextRoomStatus = 'fully_reserved'
    } else if (activeReservedRoomIds.has(room.id)) {
      nextRoomStatus = 'fully_reserved'
    } else {
      const roomBeds = bedsByRoomId.get(room.id) || []
      const activeRoomBeds = roomBeds.filter((bed) => bed.is_active)

      if (activeRoomBeds.length === 0) {
        nextRoomStatus = 'available'
      } else {
        const reservedBedsCount = activeRoomBeds.filter((bed) =>
          activeReservedBedIds.has(bed.id)
        ).length

        if (reservedBedsCount === 0) {
          nextRoomStatus = 'available'
        } else if (reservedBedsCount === activeRoomBeds.length) {
          nextRoomStatus = 'fully_reserved'
        } else {
          nextRoomStatus = 'partially_reserved'
        }
      }
    }

    recalculatedRoomStatuses.push(nextRoomStatus)

    const { error: updateRoomError } = await supabase
      .from('property_rooms')
      .update({
        status: nextRoomStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', room.id)

    if (updateRoomError) {
      throw new Error(updateRoomError.message)
    }
  }

  let nextPropertyStatus: PropertyAvailabilityStatus = 'available'

  if (!property.is_active) {
    nextPropertyStatus = 'inactive'
  } else if (hasActiveEntirePropertyReservation) {
    nextPropertyStatus = 'fully_reserved'
  } else {
    const activeRoomStatuses = typedRooms
      .filter((room) => room.is_active)
      .map((_, index) => recalculatedRoomStatuses[index])
      .filter((status) => status !== 'inactive')

    if (activeRoomStatuses.length === 0) {
      nextPropertyStatus = 'available'
    } else {
      const fullyReservedCount = activeRoomStatuses.filter(
        (status) => status === 'fully_reserved'
      ).length
      const partiallyReservedCount = activeRoomStatuses.filter(
        (status) => status === 'partially_reserved'
      ).length

      if (fullyReservedCount === 0 && partiallyReservedCount === 0) {
        nextPropertyStatus = 'available'
      } else if (fullyReservedCount === activeRoomStatuses.length) {
        nextPropertyStatus = 'fully_reserved'
      } else {
        nextPropertyStatus = 'partially_reserved'
      }
    }
  }

  const { error: updatePropertyError } = await supabase
    .from('properties')
    .update({
      availability_status: nextPropertyStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId)

  if (updatePropertyError) {
    throw new Error(updatePropertyError.message)
  }
}

async function updateRoomStatusFromBeds(params: {
  supabase: ReturnType<typeof createAdminClient>
  roomId: string
}) {
  const { supabase, roomId } = params

  const { data: room, error: roomError } = await supabase
    .from('property_rooms')
    .select('id, property_id_ref')
    .eq('id', roomId)
    .maybeSingle()

  if (roomError) {
    throw new Error(roomError.message)
  }

  if (!room) {
    throw new Error('Room not found')
  }

  await recalculatePropertyAvailabilityState({
    supabase,
    propertyId: (room as any).property_id_ref,
  })
}

async function updatePropertyAvailabilityFromRooms(params: {
  supabase: ReturnType<typeof createAdminClient>
  propertyId: string
}) {
  await recalculatePropertyAvailabilityState(params)
}

async function updateBookingRequestStatus(params: {
  requestId: string
  nextStatus: BookingRequestStatus
}) {
  const { supabase, request } = await getAuthorizedBookingRequest(params.requestId)

  if (request.status === params.nextStatus) {
    revalidatePath('/admin/properties/booking-requests')
    return
  }

  const { error } = await supabase
    .from('property_booking_requests')
    .update({
      status: params.nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.requestId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/properties/booking-requests')
  revalidatePath('/admin/properties')
  revalidatePath('/admin/properties/reservations')
}

async function getRoomWithBeds(params: {
  supabase: ReturnType<typeof createAdminClient>
  request: AuthorizedBookingRequest
  roomId: string
}) {
  const { supabase, request, roomId } = params

  const { data: room, error } = await supabase
    .from('property_rooms')
    .select(`
      id,
      property_id_ref,
      status,
      is_active,
      room_beds (
        id,
        room_id,
        status,
        is_active,
        sort_order,
        created_at
      ),
      room_sellable_options:property_room_sellable_options (
        id,
        room_id,
        code,
        is_active
      )
    `)
    .eq('id', roomId)
    .eq('property_id_ref', request.property_id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!room || !room.is_active) {
    throw new Error('Selected room was not found')
  }

  return room as RoomWithBeds
}

async function getRoomModeState(params: {
  supabase: ReturnType<typeof createAdminClient>
  room: RoomWithBeds
}) {
  const { supabase, room } = params

  const activeBeds = Array.isArray(room.room_beds)
    ? room.room_beds.filter((bed) => bed.is_active)
    : []

  const activeAvailableBeds = sortBeds(
    activeBeds.filter((bed) => bed.status === 'available')
  )

  const activeOptions = Array.isArray(room.room_sellable_options)
    ? room.room_sellable_options.filter((option) => option.is_active !== false)
    : []

  const singleOptionIds = getOptionIdsByCode(activeOptions, 'single_room')
  const doubleOptionIds = getOptionIdsByCode(activeOptions, 'double_room')
  const tripleOptionIds = getOptionIdsByCode(activeOptions, 'triple_room')

  const allRoomOptionIds = activeOptions.map((option) => option.id)

  let reservations: RoomReservationRow[] = []

  if (allRoomOptionIds.length > 0) {
    const { data: reservationsData, error } = await supabase
      .from('property_reservations')
      .select('id, status, reservation_scope, room_sellable_option_id')
      .in('room_sellable_option_id', allRoomOptionIds)
      .in('status', ACTIVE_RESERVATION_STATUSES)

    if (error) {
      throw new Error(error.message)
    }

    reservations = (reservationsData || []) as RoomReservationRow[]
  }

  const singleReservationsCount = reservations.filter(
    (reservation) =>
      reservation.reservation_scope === 'entire_room' ||
      (reservation.room_sellable_option_id &&
        singleOptionIds.includes(reservation.room_sellable_option_id))
  ).length

  const doubleReservationsCount = reservations.filter(
    (reservation) =>
      reservation.room_sellable_option_id &&
      doubleOptionIds.includes(reservation.room_sellable_option_id)
  ).length

  const tripleReservationsCount = reservations.filter(
    (reservation) =>
      reservation.room_sellable_option_id &&
      tripleOptionIds.includes(reservation.room_sellable_option_id)
  ).length

  return {
    totalActiveBeds: activeBeds.length,
    activeAvailableBeds,
    singleReservationsCount,
    doubleReservationsCount,
    tripleReservationsCount,
    hasSingleMode: singleReservationsCount > 0,
    hasDoubleMode: doubleReservationsCount > 0,
    hasTripleMode: tripleReservationsCount > 0,
    doubleCapacity: doubleOptionIds.length > 0 ? 2 : 0,
    tripleCapacity: tripleOptionIds.length > 0 ? 3 : 0,
    optionIds: {
      single: singleOptionIds,
      double: doubleOptionIds,
      triple: tripleOptionIds,
    },
  } satisfies RoomModeState
}

function getBedsToReserveForDouble(modeState: RoomModeState) {
  const nextCount = modeState.doubleReservationsCount + 1

  if (nextCount >= 2) {
    return modeState.activeAvailableBeds.map((bed) => bed.id)
  }

  return modeState.activeAvailableBeds.slice(0, 1).map((bed) => bed.id)
}

function getBedsToReserveForTriple(modeState: RoomModeState) {
  const nextCount = modeState.tripleReservationsCount + 1

  if (nextCount >= 3) {
    return modeState.activeAvailableBeds.map((bed) => bed.id)
  }

  return modeState.activeAvailableBeds.slice(0, 1).map((bed) => bed.id)
}

async function createReservationWithBeds(params: {
  supabase: ReturnType<typeof createAdminClient>
  request: AuthorizedBookingRequest
  roomId: string
  bedIds: string[]
  totalPrice: number
  roomSellableOptionId: string | null
  notes: string | null
  reservationScope: ReservationScope
  addRoomAllocation?: boolean
  reservedUnitsCount?: number
}) {
  const {
    supabase,
    request,
    roomId,
    bedIds,
    totalPrice,
    roomSellableOptionId,
    notes,
    reservationScope,
    addRoomAllocation = false,
    reservedUnitsCount = 1,
  } = params

  const { data: reservation, error: reservationError } = await supabase
    .from('property_reservations')
    .insert({
      property_id: request.property_id,
      sellable_option_id: null,
      room_sellable_option_id: roomSellableOptionId,
      reservation_scope: reservationScope,
      customer_name: request.customer_name,
      customer_phone: request.customer_phone,
      customer_email: request.customer_email,
      customer_whatsapp: request.customer_whatsapp,
      reserved_units_count: reservedUnitsCount,
      total_price_egp: totalPrice,
      start_date: request.preferred_start_date,
      end_date: request.preferred_end_date,
      notes,
      user_id: request.user_id,
      payment_status: 'unpaid',
      wallet_amount_used: 0,
    })
    .select('id')
    .single()

  if (reservationError || !reservation) {
    throw new Error(
      reservationError?.message || 'Failed to create property reservation'
    )
  }

  const allocationRows = [
    ...(addRoomAllocation
      ? [
          {
            reservation_id: reservation.id,
            property_id: request.property_id,
            room_id: roomId,
            bed_id: null,
            allocation_type: 'room' as const,
          },
        ]
      : []),
    ...bedIds.map((bedId) => ({
      reservation_id: reservation.id,
      property_id: request.property_id,
      room_id: roomId,
      bed_id: bedId,
      allocation_type: 'bed' as const,
    })),
  ]

  if (allocationRows.length > 0) {
    const { error: allocationError } = await supabase
      .from('property_reservation_allocations')
      .insert(allocationRows)

    if (allocationError) {
      throw new Error(allocationError.message)
    }
  }

  await recalculatePropertyAvailabilityState({
    supabase,
    propertyId: request.property_id,
  })

  return reservation.id as string
}

async function acceptTripleRoomReservation(params: {
  supabase: ReturnType<typeof createAdminClient>
  request: AuthorizedBookingRequest
  roomId: string
  totalPrice: number
  roomSellableOptionId: string | null
  notes: string | null
}) {
  const { supabase, request, roomId, totalPrice, roomSellableOptionId, notes } =
    params

  const room = await getRoomWithBeds({ supabase, request, roomId })

  if (room.status === 'fully_reserved' || room.status === 'inactive') {
    throw new Error('Selected room is not available for reservation')
  }

  const modeState = await getRoomModeState({ supabase, room })

  if (modeState.hasSingleMode) {
    throw new Error('This room is already reserved as Single Room')
  }

  if (modeState.hasDoubleMode) {
    throw new Error('This room is currently operating as Double Room')
  }

  if (modeState.tripleCapacity <= 0) {
    throw new Error('This room does not support Triple Room')
  }

  if (modeState.tripleReservationsCount >= modeState.tripleCapacity) {
    throw new Error('This room is already full for Triple Room')
  }

  if (modeState.activeAvailableBeds.length < 1) {
    throw new Error('There are no available beds in this room')
  }

  const bedIds = getBedsToReserveForTriple(modeState)

  if (bedIds.length === 0) {
    throw new Error('This room does not have remaining Triple Room capacity')
  }

  return await createReservationWithBeds({
    supabase,
    request,
    roomId,
    bedIds,
    totalPrice,
    roomSellableOptionId,
    notes,
    reservationScope: 'beds',
    reservedUnitsCount: 1,
  })
}

async function acceptDoubleRoomReservation(params: {
  supabase: ReturnType<typeof createAdminClient>
  request: AuthorizedBookingRequest
  roomId: string
  totalPrice: number
  roomSellableOptionId: string | null
  notes: string | null
}) {
  const { supabase, request, roomId, totalPrice, roomSellableOptionId, notes } =
    params

  const room = await getRoomWithBeds({ supabase, request, roomId })

  if (room.status === 'fully_reserved' || room.status === 'inactive') {
    throw new Error('Selected room is not available for reservation')
  }

  const modeState = await getRoomModeState({ supabase, room })

  if (modeState.hasSingleMode) {
    throw new Error('This room is already reserved as Single Room')
  }

  if (modeState.hasTripleMode) {
    throw new Error('This room is currently operating as Triple Room')
  }

  if (modeState.doubleCapacity <= 0) {
    throw new Error('This room does not support Double Room')
  }

  if (modeState.doubleReservationsCount >= modeState.doubleCapacity) {
    throw new Error('This room is already full for Double Room')
  }

  if (modeState.activeAvailableBeds.length < 1) {
    throw new Error('There are no available beds in this room')
  }

  const bedIds = getBedsToReserveForDouble(modeState)

  if (bedIds.length === 0) {
    throw new Error('This room does not have remaining Double Room capacity')
  }

  return await createReservationWithBeds({
    supabase,
    request,
    roomId,
    bedIds,
    totalPrice,
    roomSellableOptionId,
    notes,
    reservationScope: 'beds',
    reservedUnitsCount: 1,
  })
}

async function acceptSingleRoomReservation(params: {
  supabase: ReturnType<typeof createAdminClient>
  request: AuthorizedBookingRequest
  roomId: string
  totalPrice: number
  roomSellableOptionId: string | null
  notes: string | null
}) {
  const { supabase, request, roomId, totalPrice, roomSellableOptionId, notes } =
    params

  const room = await getRoomWithBeds({ supabase, request, roomId })

  if (room.status !== 'available') {
    throw new Error('Selected room is not fully available')
  }

  const modeState = await getRoomModeState({ supabase, room })

  if (
    modeState.hasSingleMode ||
    modeState.hasDoubleMode ||
    modeState.hasTripleMode
  ) {
    throw new Error('This room already contains another reservation mode')
  }

  if (modeState.totalActiveBeds === 0) {
    throw new Error('This room has no active beds to reserve')
  }

  if (modeState.activeAvailableBeds.length !== modeState.totalActiveBeds) {
    throw new Error('This room already contains reserved or occupied beds')
  }

  return await createReservationWithBeds({
    supabase,
    request,
    roomId,
    bedIds: modeState.activeAvailableBeds.map((bed) => bed.id),
    totalPrice,
    roomSellableOptionId,
    notes,
    reservationScope: 'entire_room',
    addRoomAllocation: true,
    reservedUnitsCount: 1,
  })
}

async function acceptEntirePropertyReservation(params: {
  supabase: ReturnType<typeof createAdminClient>
  request: AuthorizedBookingRequest
  totalPrice: number
  sellableOptionId: string | null
  notes: string | null
}) {
  const { supabase, request, totalPrice, sellableOptionId, notes } = params

  const { data: rooms, error: roomsError } = await supabase
    .from('property_rooms')
    .select('id, status, is_active')
    .eq('property_id_ref', request.property_id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (roomsError) {
    throw new Error(roomsError.message)
  }

  const typedRooms = (rooms || []) as RoomRow[]

  if (typedRooms.length === 0) {
    throw new Error('This property has no active rooms')
  }

  const blockedRoom = typedRooms.find(
    (room) =>
      room.status === 'fully_reserved' || room.status === 'partially_reserved'
  )

  if (blockedRoom) {
    throw new Error(
      'The property is not fully available because one or more rooms are already reserved'
    )
  }

  const roomIds = typedRooms.map((room) => room.id)

  const { data: beds, error: bedsError } = await supabase
    .from('room_beds')
    .select('id, room_id, status, is_active, sort_order, created_at')
    .in('room_id', roomIds)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (bedsError) {
    throw new Error(bedsError.message)
  }

  const typedBeds = (beds || []) as BedRow[]

  if (typedBeds.length === 0) {
    throw new Error('This property has no active beds')
  }

  const unavailableBed = typedBeds.find((bed) => bed.status !== 'available')

  if (unavailableBed) {
    throw new Error(
      'The property is not fully available because one or more beds are already reserved'
    )
  }

  const { data: reservation, error: reservationError } = await supabase
    .from('property_reservations')
    .insert({
      property_id: request.property_id,
      sellable_option_id: sellableOptionId,
      room_sellable_option_id: null,
      reservation_scope: 'entire_property',
      customer_name: request.customer_name,
      customer_phone: request.customer_phone,
      customer_email: request.customer_email,
      customer_whatsapp: request.customer_whatsapp,
      reserved_units_count: typedBeds.length,
      total_price_egp: totalPrice,
      start_date: request.preferred_start_date,
      end_date: request.preferred_end_date,
      notes,
      user_id: request.user_id,
      payment_status: 'unpaid',
      wallet_amount_used: 0,
    })
    .select('id')
    .single()

  if (reservationError || !reservation) {
    throw new Error(
      reservationError?.message || 'Failed to create property reservation'
    )
  }

  const allocationRows = [
    {
      reservation_id: reservation.id,
      property_id: request.property_id,
      room_id: null,
      bed_id: null,
      allocation_type: 'property' as const,
    },
    ...typedRooms.map((room) => ({
      reservation_id: reservation.id,
      property_id: request.property_id,
      room_id: room.id,
      bed_id: null,
      allocation_type: 'room' as const,
    })),
    ...typedBeds.map((bed) => ({
      reservation_id: reservation.id,
      property_id: request.property_id,
      room_id: bed.room_id,
      bed_id: bed.id,
      allocation_type: 'bed' as const,
    })),
  ]

  const { error: allocationError } = await supabase
    .from('property_reservation_allocations')
    .insert(allocationRows)

  if (allocationError) {
    throw new Error(allocationError.message)
  }

  await recalculatePropertyAvailabilityState({
    supabase,
    propertyId: request.property_id,
  })

  return reservation.id as string
}

async function applyWalletToReservation(params: {
  supabase: ReturnType<typeof createAdminClient>
  adminUserId: string
  reservationId: string
  request: AuthorizedBookingRequest
  totalPrice: number
  useWalletBalance: boolean
  walletAmountToUse: number
}) {
  const {
    supabase,
    adminUserId,
    reservationId,
    request,
    totalPrice,
    useWalletBalance,
    walletAmountToUse,
  } = params

  if (!useWalletBalance || !request.user_id || walletAmountToUse <= 0) {
    const { error: updateError } = await supabase
      .from('property_reservations')
      .update({
        wallet_amount_used: 0,
        payment_status: 'unpaid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    return {
      walletAmountUsed: 0,
      paymentStatus: 'unpaid' as const,
    }
  }

  if (walletAmountToUse > totalPrice) {
    throw new Error('Wallet amount cannot be greater than total price')
  }

  const { data: walletRow, error: walletError } = await supabase
    .from('user_wallets')
    .select('balance')
    .eq('user_id', request.user_id)
    .maybeSingle()

  if (walletError) {
    throw new Error(walletError.message)
  }

  const currentBalance = Number(walletRow?.balance || 0)

  if (currentBalance <= 0) {
    throw new Error('This user does not have available wallet balance')
  }

  if (walletAmountToUse > currentBalance) {
    throw new Error('Wallet amount exceeds current wallet balance')
  }

  await applyWalletTransactionByAdmin({
    userId: request.user_id,
    direction: 'debit',
    transactionType: 'booking_payment',
    amount: walletAmountToUse,
    referenceTable: 'property_reservations',
    referenceId: reservationId,
    notes: `Wallet deduction for booking request ${request.id}`,
    createdByAdminId: adminUserId,
  })

  const paymentStatus = getPaymentStatusFromWalletUsage({
    totalPrice,
    walletAmountUsed: walletAmountToUse,
  })

  const { error: reservationUpdateError } = await supabase
    .from('property_reservations')
    .update({
      wallet_amount_used: walletAmountToUse,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)

  if (reservationUpdateError) {
    throw new Error(reservationUpdateError.message)
  }

  return {
    walletAmountUsed: walletAmountToUse,
    paymentStatus,
  }
}

async function releaseReservationAllocations(params: {
  supabase: ReturnType<typeof createAdminClient>
  reservation: AuthorizedReservation
}) {
  const { supabase, reservation } = params

  const { data: allocations, error: allocationsError } = await supabase
    .from('property_reservation_allocations')
    .select('id, reservation_id, property_id, room_id, bed_id, allocation_type')
    .eq('reservation_id', reservation.id)

  if (allocationsError) {
    throw new Error(allocationsError.message)
  }

  const typedAllocations = (allocations || []) as ReservationAllocationRow[]

  const affectedRoomIds = new Set<string>()
  const affectedBedIds = new Set<string>()

  for (const allocation of typedAllocations) {
    if (allocation.room_id) {
      affectedRoomIds.add(allocation.room_id)
    }

    if (allocation.bed_id) {
      affectedBedIds.add(allocation.bed_id)
    }
  }

  const { error: deleteAllocationsError } = await supabase
    .from('property_reservation_allocations')
    .delete()
    .eq('reservation_id', reservation.id)

  if (deleteAllocationsError) {
    throw new Error(deleteAllocationsError.message)
  }

  await recalculatePropertyAvailabilityState({
    supabase,
    propertyId: reservation.property_id,
  })
}

async function releaseLegacyBedReservation(params: {
  supabase: ReturnType<typeof createAdminClient>
  reservation: AuthorizedLegacyBedReservation
}) {
  const { supabase, reservation } = params

  await recalculatePropertyAvailabilityState({
    supabase,
    propertyId: reservation.property_id,
  })
}

export async function markBookingRequestContactedAction(formData: FormData) {
  const requestId = parseRequestId(formData)

  await updateBookingRequestStatus({
    requestId,
    nextStatus: 'contacted',
  })
}

export async function markBookingRequestInProgressAction(formData: FormData) {
  const requestId = parseRequestId(formData)

  await updateBookingRequestStatus({
    requestId,
    nextStatus: 'in_progress',
  })
}

export async function acceptBookingRequestAction(formData: FormData) {
  const requestId = parseRequestId(formData)

  const { supabase, request, admin } = await getAuthorizedBookingRequest(requestId)

  if (request.status === 'converted') {
    revalidatePath('/admin/properties/booking-requests')
    return
  }

  if (request.status === 'cancelled') {
    throw new Error('This booking request has already been cancelled')
  }

  const requestedOptionCode = parseRequestedOptionCode(
    formData.get('requested_option_code') || request.requested_option_code
  )

  const explicitReservationScope = parseReservationScope(
    formData.get('reservation_scope')
  )

  const reservationScope = resolveReservationScope({
    explicitScope: explicitReservationScope,
    requestedOptionCode,
  })

  const roomId = parseOptionalString(formData.get('room_id'))
  const adminNotes = parseOptionalString(formData.get('admin_notes'))
  const notes = buildReservationNotes(request, adminNotes)

  const rawRoomSellableOptionId = parseOptionalString(
    formData.get('room_sellable_option_id')
  )
  const rawSellableOptionId = parseOptionalString(formData.get('sellable_option_id'))

  const roomSellableOptionId =
    reservationScope === 'entire_property' ? null : rawRoomSellableOptionId

  const sellableOptionId =
    reservationScope === 'entire_property' ? rawSellableOptionId : null

  const useWalletBalance = parseBoolean(formData.get('use_wallet_balance'), false)
  const walletAmountToUse =
    parseNullableNumber(formData.get('wallet_amount_to_use')) ?? 0

  let reservedUnitsCount = parsePositiveInteger(
    formData.get('reserved_units_count'),
    1
  )

  if (requestedOptionCode === 'single_room') {
    reservedUnitsCount = 1
  } else if (requestedOptionCode === 'double_room') {
    reservedUnitsCount = 1
  } else if (requestedOptionCode === 'triple_room') {
    reservedUnitsCount = 1
  }

  let totalPrice = parseNullableNumber(formData.get('total_price_egp'))

  if (reservationScope === 'entire_property' && totalPrice === null) {
    if (sellableOptionId) {
      const { data: propertyOption, error: propertyOptionError } = await supabase
        .from('property_sellable_options')
        .select('price_egp')
        .eq('id', sellableOptionId)
        .maybeSingle()

      if (propertyOptionError) {
        throw new Error(propertyOptionError.message)
      }

      totalPrice = Number(propertyOption?.price_egp || 0)
    } else {
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('price_egp')
        .eq('id', request.property_id)
        .maybeSingle()

      if (propertyError) {
        throw new Error(propertyError.message)
      }

      totalPrice = Number(property?.price_egp || 0)
    }
  }

  if (reservationScope === 'beds' && totalPrice === null) {
    if (roomSellableOptionId) {
      const { data: option, error: optionError } = await supabase
        .from('property_room_sellable_options')
        .select('price_egp')
        .eq('id', roomSellableOptionId)
        .maybeSingle()

      if (optionError) {
        throw new Error(optionError.message)
      }

      totalPrice = Number(option?.price_egp || 0) * reservedUnitsCount
    } else {
      totalPrice = 0
    }
  }

  if (reservationScope === 'entire_room' && totalPrice === null) {
    if (roomSellableOptionId) {
      const { data: option, error: optionError } = await supabase
        .from('property_room_sellable_options')
        .select('price_egp')
        .eq('id', roomSellableOptionId)
        .maybeSingle()

      if (optionError) {
        throw new Error(optionError.message)
      }

      totalPrice = Number(option?.price_egp || 0)
    } else if (roomId) {
      const { data: room, error: roomError } = await supabase
        .from('property_rooms')
        .select('base_price_egp')
        .eq('id', roomId)
        .maybeSingle()

      if (roomError) {
        throw new Error(roomError.message)
      }

      totalPrice = Number((room as any)?.base_price_egp || 0)
    } else {
      totalPrice = 0
    }
  }

  if (totalPrice === null || totalPrice < 0) {
    throw new Error('A valid total price is required before accepting the request')
  }

  if (useWalletBalance && walletAmountToUse <= 0) {
    throw new Error('Wallet amount must be a valid positive number')
  }

  if (useWalletBalance && walletAmountToUse > totalPrice) {
    throw new Error('Wallet amount cannot be greater than total price')
  }

  let reservationId: string | null = null

  if (
    requestedOptionCode === 'full_apartment' ||
    reservationScope === 'entire_property'
  ) {
    reservationId = await acceptEntirePropertyReservation({
      supabase,
      request,
      totalPrice,
      sellableOptionId,
      notes,
    })
  } else if (requestedOptionCode === 'single_room') {
    if (!roomId) {
      throw new Error('Room is required for Single Room reservation')
    }

    reservationId = await acceptSingleRoomReservation({
      supabase,
      request,
      roomId,
      totalPrice,
      roomSellableOptionId,
      notes,
    })
  } else if (requestedOptionCode === 'double_room') {
    if (!roomId) {
      throw new Error('Room is required for Double Room reservation')
    }

    reservationId = await acceptDoubleRoomReservation({
      supabase,
      request,
      roomId,
      totalPrice,
      roomSellableOptionId,
      notes,
    })
  } else if (requestedOptionCode === 'triple_room') {
    if (!roomId) {
      throw new Error('Room is required for Triple Room reservation')
    }

    reservationId = await acceptTripleRoomReservation({
      supabase,
      request,
      roomId,
      totalPrice,
      roomSellableOptionId,
      notes,
    })
  } else if (reservationScope === 'entire_room') {
    if (!roomId) {
      throw new Error('Room is required for room reservation')
    }

    reservationId = await acceptSingleRoomReservation({
      supabase,
      request,
      roomId,
      totalPrice,
      roomSellableOptionId,
      notes,
    })
  } else {
    if (!roomId) {
      throw new Error('Room is required for bed reservation')
    }

    reservationId = await acceptTripleRoomReservation({
      supabase,
      request,
      roomId,
      totalPrice,
      roomSellableOptionId,
      notes,
    })
  }

  if (!reservationId) {
    throw new Error('Failed to create reservation')
  }

  const walletResult = await applyWalletToReservation({
    supabase,
    adminUserId: admin.id,
    reservationId,
    request,
    totalPrice,
    useWalletBalance,
    walletAmountToUse,
  })

  const { error: updateRequestError } = await supabase
    .from('property_booking_requests')
    .update({
      status: 'converted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (updateRequestError) {
    throw new Error(updateRequestError.message)
  }

  if (request.user_id && reservationId && walletResult.paymentStatus === 'paid') {
    const rewardResult = await awardReferralAfterPaidReservationDirectly({
      supabase,
      invitedUserId: request.user_id,
      sourceReservationId: reservationId,
      adminUserId: admin.id,
    })

    console.log('Referral reward RPC result:', rewardResult)

    if (
      rewardResult.success === false &&
      rewardResult.reason !== 'NO_REFERRAL_FOUND' &&
      rewardResult.reason !== 'FIRST_PAID_BONUS_ALREADY_GRANTED'
    ) {
      throw new Error(
        `Referral reward was not applied: ${rewardResult.reason || 'UNKNOWN_REASON'}`
      )
    }
  }

  revalidatePath('/admin/properties/booking-requests')
  revalidatePath('/admin/properties')
  revalidatePath('/admin/properties/reservations')
  revalidatePath('/account')
  revalidatePath('/account/referrals')
  revalidatePath('/account/wallet')
}

export async function cancelPropertyReservationAction(formData: FormData) {
  const reservationId = parseReservationId(formData)
  const cancellationReason = parseOptionalString(formData.get('cancellation_reason'))

  const { supabase, reservation } = await getAuthorizedReservation(reservationId)

  if (reservation.status === 'cancelled') {
    revalidatePath('/admin/properties/booking-requests')
    revalidatePath('/admin/properties')
    revalidatePath('/admin/properties/reservations')
    return
  }

  if (reservation.status === 'completed') {
    throw new Error('Completed reservations cannot be cancelled')
  }

  const nextNotes = appendCancellationNote(reservation.notes, cancellationReason)

  const { error: updateReservationError } = await supabase
    .from('property_reservations')
    .update({
      status: 'cancelled',
      notes: nextNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)

  if (updateReservationError) {
    throw new Error(updateReservationError.message)
  }

  await releaseReservationAllocations({
    supabase,
    reservation,
  })

  revalidatePath('/admin/properties/booking-requests')
  revalidatePath('/admin/properties')
  revalidatePath('/admin/properties/reservations')
}

export async function cancelLegacyBedReservationAction(formData: FormData) {
  const reservationId = parseLegacyReservationId(formData)
  const cancellationReason = parseOptionalString(formData.get('cancellation_reason'))

  const { supabase, reservation } = await getAuthorizedLegacyBedReservation(
    reservationId
  )

  if (reservation.status === 'cancelled') {
    revalidatePath('/admin/properties/booking-requests')
    revalidatePath('/admin/properties')
    revalidatePath('/admin/properties/reservations')
    return
  }

  if (reservation.status === 'completed') {
    throw new Error('Completed reservations cannot be cancelled')
  }

  const nextNotes = appendCancellationNote(reservation.notes, cancellationReason)

  const { error: updateReservationError } = await supabase
    .from('bed_reservations')
    .update({
      status: 'cancelled',
      notes: nextNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)

  if (updateReservationError) {
    throw new Error(updateReservationError.message)
  }

  await releaseLegacyBedReservation({
    supabase,
    reservation,
  })

  revalidatePath('/admin/properties/booking-requests')
  revalidatePath('/admin/properties')
  revalidatePath('/admin/properties/reservations')
}

export async function rejectBookingRequestAction(formData: FormData) {
  const requestId = parseRequestId(formData)

  await updateBookingRequestStatus({
    requestId,
    nextStatus: 'cancelled',
  })
}