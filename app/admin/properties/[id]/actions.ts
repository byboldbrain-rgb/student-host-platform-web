'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { notifyWaitingListStudentsForNewProperty } from '@/src/lib/waiting-list/notify-new-property'
import {
  requirePropertyEditorAccess,
  isSuperAdmin,
} from '@/src/lib/admin-auth'

const PROPERTY_IMAGES_BUCKET = 'property-images'

const ACTIVE_RESERVATION_STATUSES = ['pending', 'reserved', 'checked_in'] as const

function toNullableNumber(value: FormDataEntryValue | null) {
  const str = String(value || '').trim()
  if (!str) return null
  const num = Number(str)
  return Number.isNaN(num) ? null : num
}

function toNumberOrDefault(value: FormDataEntryValue | null, defaultValue = 0) {
  const str = String(value || '').trim()
  if (!str) return defaultValue
  const num = Number(str)
  return Number.isNaN(num) ? defaultValue : num
}

function toBoolean(value: string) {
  return value === 'true'
}

function slugifyFileName(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf('.')
  const name = lastDotIndex >= 0 ? fileName.slice(0, lastDotIndex) : fileName
  const extension =
    lastDotIndex >= 0 ? fileName.slice(lastDotIndex + 1).toLowerCase() : ''

  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return extension ? `${safeName || 'image'}.${extension}` : safeName || 'image'
}

type AdminSupabaseClient = ReturnType<typeof createAdminClient>

type PropertyAvailabilityStatus =
  | 'available'
  | 'partially_reserved'
  | 'fully_reserved'
  | 'inactive'

type PropertyAdminStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'archived'

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

type RoomOptionCode = 'single_room' | 'double_room' | 'triple_room'

type PropertyOptionCode =
  | 'full_apartment'
  | 'single_room'
  | 'double_room'
  | 'triple_room'

type ParsedRoomOption = {
  code: RoomOptionCode
  name_en: string
  name_ar: string
  occupancy_size: number
  pricing_mode: 'per_person'
  price_egp: number
  consumes_beds_count: number
  is_exclusive: boolean
  is_active: boolean
  sort_order: number
}

type ParsedRoomRow = {
  id?: string | null
  room_name: string
  room_name_ar: string | null
  room_type: 'single' | 'double' | 'triple' | 'quad' | 'custom'
  rental_duration: 'daily' | 'monthly'
  beds_count: number
  private_bathroom: boolean
  is_reserved: boolean
  is_active: boolean
  sort_order: number
  option_rows: ParsedRoomOption[]
}

type InsertedRoomSummary = {
  id: string
  sort_order: number
  option_rows: ParsedRoomOption[]
}

type PropertySellableOptionRow = {
  property_id: string
  code: PropertyOptionCode
  option_code: PropertyOptionCode
  name_en: string
  name_ar: string
  sell_mode: 'entire_property' | 'bed'
  occupancy_size: number | null
  price_egp: number
  rental_duration: 'daily' | 'monthly'
  is_active: boolean
  sort_order: number
  source_scope: 'property' | 'room'
  pricing_mode: 'per_person' | 'per_room'
}

type ExistingRoomRow = {
  id: string
  room_name: string | null
  room_name_ar: string | null
  sort_order: number | null
  is_active: boolean
  status: RoomStatus
}

type ExistingRoomOptionRow = {
  id: string
  room_id: string
  code: RoomOptionCode
  is_active: boolean
}

type ExistingBedRow = {
  id: string
  room_id: string
  bed_label: string | null
  bed_label_ar?: string | null
  status: BedStatus
  is_active: boolean
  sort_order: number | null
  created_at?: string | null
}

function normalizeAvailabilityStatus(value: string): PropertyAvailabilityStatus {
  if (
    value === 'available' ||
    value === 'partially_reserved' ||
    value === 'fully_reserved' ||
    value === 'inactive'
  ) {
    return value
  }

  return 'available'
}

function normalizeAdminStatus(value: string): PropertyAdminStatus {
  if (
    value === 'draft' ||
    value === 'pending_review' ||
    value === 'published' ||
    value === 'rejected' ||
    value === 'archived'
  ) {
    return value
  }

  return 'draft'
}

function normalizeRentalDuration(value: string): 'daily' | 'monthly' {
  return value === 'daily' ? 'daily' : 'monthly'
}

function buildRoomOptions(params: {
  singleEnabled: boolean
  singlePrice: number
  doubleEnabled: boolean
  doublePrice: number
  tripleEnabled: boolean
  triplePrice: number
  beds_count: number
}) {
  const options: ParsedRoomOption[] = []

  if (params.singleEnabled) {
    if (!Number.isFinite(params.singlePrice) || params.singlePrice <= 0) {
      throw new Error('Single room price must be a valid positive number')
    }

    if (params.beds_count < 1) {
      throw new Error('Single room option requires at least 1 bed')
    }

    options.push({
      code: 'single_room',
      name_en: 'Single Room',
      name_ar: 'غرفة سنجل',
      occupancy_size: 1,
      pricing_mode: 'per_person',
      price_egp: params.singlePrice,
      consumes_beds_count: 1,
      is_exclusive: false,
      is_active: true,
      sort_order: 0,
    })
  }

  if (params.doubleEnabled) {
    if (!Number.isFinite(params.doublePrice) || params.doublePrice <= 0) {
      throw new Error('Double room price must be a valid positive number')
    }

    if (params.beds_count < 2) {
      throw new Error('Double room option requires at least 2 beds')
    }

    options.push({
      code: 'double_room',
      name_en: 'Double Room',
      name_ar: 'غرفة دابل',
      occupancy_size: 2,
      pricing_mode: 'per_person',
      price_egp: params.doublePrice,
      consumes_beds_count: 1,
      is_exclusive: false,
      is_active: true,
      sort_order: 1,
    })
  }

  if (params.tripleEnabled) {
    if (!Number.isFinite(params.triplePrice) || params.triplePrice <= 0) {
      throw new Error('Triple room price must be a valid positive number')
    }

    if (params.beds_count < 3) {
      throw new Error('Triple room option requires at least 3 beds')
    }

    options.push({
      code: 'triple_room',
      name_en: 'Triple Room',
      name_ar: 'غرفة تربل',
      occupancy_size: 3,
      pricing_mode: 'per_person',
      price_egp: params.triplePrice,
      consumes_beds_count: 1,
      is_exclusive: false,
      is_active: true,
      sort_order: 2,
    })
  }

  return options
}

function derivePropertyAvailabilityStatus(
  submittedStatus: PropertyAvailabilityStatus
): PropertyAvailabilityStatus {
  if (submittedStatus === 'inactive') {
    return 'inactive'
  }

  return 'available'
}

function deriveRoomStatus(params: {
  propertyAvailabilityStatus: PropertyAvailabilityStatus
  existingStatus?: RoomStatus | null
}): RoomStatus {
  if (params.propertyAvailabilityStatus === 'inactive') {
    return 'inactive'
  }

  if (
    params.existingStatus === 'partially_reserved' ||
    params.existingStatus === 'fully_reserved'
  ) {
    return params.existingStatus
  }

  return 'available'
}

function deriveBedStatus(params: {
  propertyAvailabilityStatus: PropertyAvailabilityStatus
  existingStatus?: BedStatus | null
}): BedStatus {
  if (params.propertyAvailabilityStatus === 'inactive') {
    return 'inactive'
  }

  if (
    params.existingStatus === 'reserved' ||
    params.existingStatus === 'occupied' ||
    params.existingStatus === 'maintenance'
  ) {
    return params.existingStatus
  }

  return 'available'
}

function buildPropertySellableOptionRows(params: {
  propertyDbId: string
  rental_duration: 'daily' | 'monthly'
  fullApartmentPrice: number
  insertedRooms: InsertedRoomSummary[]
}) {
  const {
    propertyDbId,
    rental_duration,
    fullApartmentPrice,
    insertedRooms,
  } = params

  const singleOptionPrices = insertedRooms
    .flatMap((room) =>
      room.option_rows.filter((option) => option.code === 'single_room')
    )
    .map((option) => option.price_egp)

  const doubleOptionPrices = insertedRooms
    .flatMap((room) =>
      room.option_rows.filter((option) => option.code === 'double_room')
    )
    .map((option) => option.price_egp)

  const tripleOptionPrices = insertedRooms
    .flatMap((room) =>
      room.option_rows.filter((option) => option.code === 'triple_room')
    )
    .map((option) => option.price_egp)

  return [
    {
      property_id: propertyDbId,
      code: 'full_apartment',
      option_code: 'full_apartment',
      name_en: 'Full Apartment',
      name_ar: 'الشقة بالكامل',
      sell_mode: 'entire_property',
      occupancy_size: null,
      price_egp: fullApartmentPrice,
      rental_duration,
      is_active: true,
      sort_order: 0,
      source_scope: 'property',
      pricing_mode: 'per_room',
    },
    ...(singleOptionPrices.length > 0
      ? [
          {
            property_id: propertyDbId,
            code: 'single_room',
            option_code: 'single_room',
            name_en: 'Single Room',
            name_ar: 'غرفة سنجل',
            sell_mode: 'bed',
            occupancy_size: 1,
            price_egp: Math.min(...singleOptionPrices),
            rental_duration,
            is_active: true,
            sort_order: 1,
            source_scope: 'room',
            pricing_mode: 'per_person',
          } satisfies PropertySellableOptionRow,
        ]
      : []),
    ...(doubleOptionPrices.length > 0
      ? [
          {
            property_id: propertyDbId,
            code: 'double_room',
            option_code: 'double_room',
            name_en: 'Double Room',
            name_ar: 'غرفة دابل',
            sell_mode: 'bed',
            occupancy_size: 2,
            price_egp: Math.min(...doubleOptionPrices),
            rental_duration,
            is_active: true,
            sort_order: 2,
            source_scope: 'room',
            pricing_mode: 'per_person',
          } satisfies PropertySellableOptionRow,
        ]
      : []),
    ...(tripleOptionPrices.length > 0
      ? [
          {
            property_id: propertyDbId,
            code: 'triple_room',
            option_code: 'triple_room',
            name_en: 'Triple Room',
            name_ar: 'غرفة تربل',
            sell_mode: 'bed',
            occupancy_size: 3,
            price_egp: Math.min(...tripleOptionPrices),
            rental_duration,
            is_active: true,
            sort_order: 3,
            source_scope: 'room',
            pricing_mode: 'per_person',
          } satisfies PropertySellableOptionRow,
        ]
      : []),
  ].filter((row) => row.price_egp > 0) as PropertySellableOptionRow[]
}

async function assertBrokerExists(params: {
  supabase: AdminSupabaseClient
  brokerId: string
}) {
  const { supabase, brokerId } = params

  const { data: broker, error } = await supabase
    .from('brokers')
    .select('id')
    .eq('id', brokerId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!broker) {
    throw new Error('Selected broker was not found')
  }
}

async function ensureOwnerAvailableForPropertyLocation(params: {
  supabase: AdminSupabaseClient
  ownerId: string
  cityId: string
  universityId: string
  adminId: string
}) {
  const { supabase, ownerId, cityId, universityId, adminId } = params

  const { data: owner, error: ownerError } = await supabase
    .from('property_owners')
    .select('id, is_active')
    .eq('id', ownerId)
    .maybeSingle()

  if (ownerError) {
    throw new Error(ownerError.message)
  }

  if (!owner) {
    throw new Error('Selected owner was not found')
  }

  if (owner.is_active === false) {
    throw new Error('Selected owner is not active')
  }

  const { data: serviceArea, error: serviceAreaError } = await supabase
    .from('property_owner_service_areas')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('city_id', cityId)
    .eq('university_id', universityId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (serviceAreaError) {
    throw new Error(serviceAreaError.message)
  }

  if (serviceArea) return

  const { error: insertServiceAreaError } = await supabase
    .from('property_owner_service_areas')
    .insert({
      owner_id: ownerId,
      city_id: cityId,
      university_id: universityId,
      is_active: true,
      created_by_admin_id: adminId,
      updated_by_admin_id: adminId,
    })

  if (insertServiceAreaError) {
    throw new Error(
      `Failed to link owner to selected city and university: ${insertServiceAreaError.message}`
    )
  }
}

async function syncPrimaryOwnerPropertyLink(params: {
  supabase: AdminSupabaseClient
  ownerId: string
  propertyDbId: string
  brokerId: string
  adminId: string
}) {
  const { supabase, ownerId, propertyDbId, brokerId, adminId } = params

  const { data: existingLinks, error: existingLinksError } = await supabase
    .from('owner_properties')
    .select('id, owner_id, is_active')
    .eq('property_id_ref', propertyDbId)

  if (existingLinksError) {
    throw new Error(
      `Failed to load owner-property links: ${existingLinksError.message}`
    )
  }

  const activeLinksForOtherOwners = (existingLinks ?? []).filter(
    (link) => link.owner_id !== ownerId && link.is_active !== false
  )

  if (activeLinksForOtherOwners.length > 0) {
    const { error: deactivateOldLinksError } = await supabase
      .from('owner_properties')
      .update({
        is_active: false,
        is_primary_owner: false,
        updated_by_admin_id: adminId,
        updated_at: new Date().toISOString(),
      })
      .in(
        'id',
        activeLinksForOtherOwners.map((link) => link.id)
      )

    if (deactivateOldLinksError) {
      throw new Error(
        `Failed to deactivate old owner-property links: ${deactivateOldLinksError.message}`
      )
    }
  }

  const existingCurrentOwnerLink = (existingLinks ?? []).find(
    (link) => link.owner_id === ownerId
  )

  if (existingCurrentOwnerLink) {
    const { error: updateCurrentLinkError } = await supabase
      .from('owner_properties')
      .update({
        broker_id: brokerId,
        ownership_percentage: 100,
        payout_percentage: 100,
        is_primary_owner: true,
        is_active: true,
        updated_by_admin_id: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingCurrentOwnerLink.id)

    if (updateCurrentLinkError) {
      throw new Error(
        `Failed to update owner-property link: ${updateCurrentLinkError.message}`
      )
    }

    return
  }

  const { error: insertOwnerPropertyError } = await supabase
    .from('owner_properties')
    .insert({
      owner_id: ownerId,
      property_id_ref: propertyDbId,
      broker_id: brokerId,
      ownership_percentage: 100,
      payout_percentage: 100,
      is_primary_owner: true,
      is_active: true,
      created_by_admin_id: adminId,
      updated_by_admin_id: adminId,
      metadata: {},
    })

  if (insertOwnerPropertyError) {
    throw new Error(
      `Failed to create owner-property link: ${insertOwnerPropertyError.message}`
    )
  }
}

function sortBeds(beds: ExistingBedRow[]) {
  return [...beds].sort((a, b) => {
    const sortA = a.sort_order ?? 0
    const sortB = b.sort_order ?? 0

    if (sortA !== sortB) return sortA - sortB

    return String(a.created_at || '').localeCompare(String(b.created_at || ''))
  })
}

async function getActivePropertyReservationIds(params: {
  supabase: AdminSupabaseClient
  propertyDbId: string
}) {
  const { supabase, propertyDbId } = params

  const { data, error } = await supabase
    .from('property_reservations')
    .select('id')
    .eq('property_id', propertyDbId)
    .in('status', [...ACTIVE_RESERVATION_STATUSES])

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map((row) => row.id as string)
}

async function assertRoomCanBeRetired(params: {
  supabase: AdminSupabaseClient
  roomId: string
  activeReservationIds: string[]
}) {
  const { supabase, roomId, activeReservationIds } = params

  if (activeReservationIds.length === 0) return

  const { data, error } = await supabase
    .from('property_reservation_allocations')
    .select('id')
    .eq('room_id', roomId)
    .in('reservation_id', activeReservationIds)
    .limit(1)

  if (error) {
    throw new Error(error.message)
  }

  if ((data || []).length > 0) {
    throw new Error(
      'Cannot remove a room that has active reservations. Cancel the reservations first.'
    )
  }
}

async function assertBedCanBeRetired(params: {
  supabase: AdminSupabaseClient
  bedId: string
  activeReservationIds: string[]
}) {
  const { supabase, bedId, activeReservationIds } = params

  if (activeReservationIds.length > 0) {
    const { data, error } = await supabase
      .from('property_reservation_allocations')
      .select('id')
      .eq('bed_id', bedId)
      .in('reservation_id', activeReservationIds)
      .limit(1)

    if (error) {
      throw new Error(error.message)
    }

    if ((data || []).length > 0) {
      throw new Error(
        'Cannot reduce/remove a bed that has an active reservation. Cancel the reservation first.'
      )
    }
  }

  const { data: legacyData, error: legacyError } = await supabase
    .from('bed_reservations')
    .select('id')
    .eq('bed_id', bedId)
    .in('status', [...ACTIVE_RESERVATION_STATUSES])
    .limit(1)

  if (legacyError) {
    throw new Error(legacyError.message)
  }

  if ((legacyData || []).length > 0) {
    throw new Error(
      'Cannot reduce/remove a bed that has an active legacy reservation. Cancel the reservation first.'
    )
  }
}

async function assertOptionCanBeRetired(params: {
  supabase: AdminSupabaseClient
  optionId: string
}) {
  const { supabase, optionId } = params

  const { data, error } = await supabase
    .from('property_reservations')
    .select('id')
    .eq('room_sellable_option_id', optionId)
    .in('status', [...ACTIVE_RESERVATION_STATUSES])
    .limit(1)

  if (error) {
    throw new Error(error.message)
  }

  if ((data || []).length > 0) {
    throw new Error(
      'Cannot disable a room booking option that has active reservations. Cancel the reservations first.'
    )
  }
}

async function syncRoomSellableOptions(params: {
  supabase: AdminSupabaseClient
  roomId: string
  optionRows: ParsedRoomOption[]
}) {
  const { supabase, roomId, optionRows } = params

  const { data: existingOptions, error: existingOptionsError } = await supabase
    .from('property_room_sellable_options')
    .select('id, room_id, code, is_active')
    .eq('room_id', roomId)

  if (existingOptionsError) {
    throw new Error(
      `Failed to load room booking options: ${existingOptionsError.message}`
    )
  }

  const existingByCode = new Map<RoomOptionCode, ExistingRoomOptionRow>()

  for (const option of (existingOptions || []) as ExistingRoomOptionRow[]) {
    if (
      option.code === 'single_room' ||
      option.code === 'double_room' ||
      option.code === 'triple_room'
    ) {
      existingByCode.set(option.code, option)
    }
  }

  const desiredCodes = new Set(optionRows.map((option) => option.code))

  for (const option of optionRows) {
    const existing = existingByCode.get(option.code)

    if (existing) {
      const { error: updateError } = await supabase
        .from('property_room_sellable_options')
        .update({
          name_en: option.name_en,
          name_ar: option.name_ar,
          occupancy_size: option.occupancy_size,
          pricing_mode: option.pricing_mode,
          price_egp: option.price_egp,
          consumes_beds_count: option.consumes_beds_count,
          is_exclusive: option.is_exclusive,
          is_active: true,
          sort_order: option.sort_order,
          deleted_at: null,
          retired_reason: null,
        })
        .eq('id', existing.id)

      if (updateError) {
        throw new Error(
          `Failed to update room option ${option.code}: ${updateError.message}`
        )
      }
    } else {
      const { error: insertError } = await supabase
        .from('property_room_sellable_options')
        .insert({
          room_id: roomId,
          code: option.code,
          name_en: option.name_en,
          name_ar: option.name_ar,
          occupancy_size: option.occupancy_size,
          pricing_mode: option.pricing_mode,
          price_egp: option.price_egp,
          consumes_beds_count: option.consumes_beds_count,
          is_exclusive: option.is_exclusive,
          is_active: true,
          sort_order: option.sort_order,
          deleted_at: null,
          retired_reason: null,
        })

      if (insertError) {
        throw new Error(
          `Failed to insert room option ${option.code}: ${insertError.message}`
        )
      }
    }
  }

  const optionsToRetire = ((existingOptions || []) as ExistingRoomOptionRow[]).filter(
    (option) =>
      option.is_active !== false &&
      (option.code === 'single_room' ||
        option.code === 'double_room' ||
        option.code === 'triple_room') &&
      !desiredCodes.has(option.code)
  )

  for (const option of optionsToRetire) {
    await assertOptionCanBeRetired({
      supabase,
      optionId: option.id,
    })

    const { error: retireError } = await supabase
      .from('property_room_sellable_options')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        retired_reason: 'Disabled during property structure update',
      })
      .eq('id', option.id)

    if (retireError) {
      throw new Error(
        `Failed to retire room option ${option.code}: ${retireError.message}`
      )
    }
  }
}

async function syncRoomBeds(params: {
  supabase: AdminSupabaseClient
  roomId: string
  desiredBedsCount: number
  propertyAvailabilityStatus: PropertyAvailabilityStatus
  activeReservationIds: string[]
}) {
  const {
    supabase,
    roomId,
    desiredBedsCount,
    propertyAvailabilityStatus,
    activeReservationIds,
  } = params

  const { data: existingBedsData, error: existingBedsError } = await supabase
    .from('room_beds')
    .select('id, room_id, bed_label, status, is_active, sort_order, created_at')
    .eq('room_id', roomId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (existingBedsError) {
    throw new Error(`Failed to load room beds: ${existingBedsError.message}`)
  }

  const existingBeds = sortBeds((existingBedsData || []) as ExistingBedRow[])
  const bedsToKeep = existingBeds.slice(0, desiredBedsCount)
  const bedsToRetire = existingBeds.slice(desiredBedsCount)

  for (let index = 0; index < bedsToKeep.length; index++) {
    const bed = bedsToKeep[index]

    const nextStatus = deriveBedStatus({
      propertyAvailabilityStatus,
      existingStatus: bed.status,
    })

    const { error: updateError } = await supabase
      .from('room_beds')
      .update({
        bed_label: bed.bed_label || `Bed ${index + 1}`,
        bed_type: desiredBedsCount === 1 ? 'single' : 'custom',
        price_egp: null,
        status: nextStatus,
        is_active: propertyAvailabilityStatus !== 'inactive',
        sort_order: index,
        deleted_at: null,
        retired_reason: null,
      })
      .eq('id', bed.id)

    if (updateError) {
      throw new Error(`Failed to update room bed: ${updateError.message}`)
    }
  }

  for (const bed of bedsToRetire) {
    if (bed.is_active !== false) {
      await assertBedCanBeRetired({
        supabase,
        bedId: bed.id,
        activeReservationIds,
      })

      const { error: retireError } = await supabase
        .from('room_beds')
        .update({
          is_active: false,
          status: 'inactive',
          deleted_at: new Date().toISOString(),
          retired_reason: 'Removed during property structure update',
        })
        .eq('id', bed.id)

      if (retireError) {
        throw new Error(`Failed to retire room bed: ${retireError.message}`)
      }
    }
  }

  const missingBedsCount = desiredBedsCount - bedsToKeep.length

  if (missingBedsCount > 0) {
    const newBedRows = Array.from({ length: missingBedsCount }).map(
      (_, missingIndex) => {
        const bedIndex = bedsToKeep.length + missingIndex

        return {
          room_id: roomId,
          bed_label: `Bed ${bedIndex + 1}`,
          bed_type: desiredBedsCount === 1 ? 'single' : 'custom',
          price_egp: null,
          status: propertyAvailabilityStatus === 'inactive' ? 'inactive' : 'available',
          is_active: propertyAvailabilityStatus !== 'inactive',
          sort_order: bedIndex,
          deleted_at: null,
          retired_reason: null,
        }
      }
    )

    const { error: insertError } = await supabase.from('room_beds').insert(newBedRows)

    if (insertError) {
      throw new Error(`Failed to insert room beds: ${insertError.message}`)
    }
  }
}

async function recalculatePropertyAvailabilityState(params: {
  supabase: AdminSupabaseClient
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
      .in('status', [...ACTIVE_RESERVATION_STATUSES])

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
      .in('status', [...ACTIVE_RESERVATION_STATUSES])

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
      status: string
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

async function syncPropertyRoomsStructure(params: {
  supabase: AdminSupabaseClient
  propertyDbId: string
  roomRows: ParsedRoomRow[]
  availabilityStatus: PropertyAvailabilityStatus
  gender: string | null
}) {
  const { supabase, propertyDbId, roomRows, availabilityStatus, gender } = params

  const activeReservationIds = await getActivePropertyReservationIds({
    supabase,
    propertyDbId,
  })

  const { data: existingRoomsData, error: existingRoomsError } = await supabase
    .from('property_rooms')
    .select('id, room_name, room_name_ar, sort_order, is_active, status')
    .eq('property_id_ref', propertyDbId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (existingRoomsError) {
    throw new Error(`Failed to load existing rooms: ${existingRoomsError.message}`)
  }

  const existingRooms = (existingRoomsData || []) as ExistingRoomRow[]
  const existingById = new Map(existingRooms.map((room) => [room.id, room]))
  const existingBySortOrder = new Map(
    existingRooms.map((room) => [room.sort_order ?? 0, room])
  )

  const usedExistingRoomIds = new Set<string>()
  const syncedRooms: InsertedRoomSummary[] = []

  for (const room of roomRows) {
    const matchedRoom =
      room.id && existingById.has(room.id)
        ? existingById.get(room.id)
        : existingBySortOrder.get(room.sort_order)

    const lowestRoomOptionPrice =
      room.option_rows
        .map((option) => option.price_egp)
        .sort((a, b) => a - b)[0] ?? null

    let roomId: string

    if (matchedRoom) {
      usedExistingRoomIds.add(matchedRoom.id)
      roomId = matchedRoom.id

      const roomStatus = deriveRoomStatus({
        propertyAvailabilityStatus: availabilityStatus,
        existingStatus: matchedRoom.status,
      })

      const { error: updateRoomError } = await supabase
        .from('property_rooms')
        .update({
          room_name: room.room_name,
          room_name_ar: room.room_name_ar,
          room_type: room.room_type,
          gender,
          base_price_egp: lowestRoomOptionPrice,
          private_room_price_egp: null,
          shared_bed_price_egp: null,
          private_bathroom: room.private_bathroom,
          status: roomStatus,
          is_active: room.is_active,
          sort_order: room.sort_order,
          deleted_at: null,
          retired_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchedRoom.id)

      if (updateRoomError) {
        throw new Error(`Failed to update property room: ${updateRoomError.message}`)
      }
    } else {
      const roomStatus = deriveRoomStatus({
        propertyAvailabilityStatus: availabilityStatus,
      })

      const { data: insertedRoom, error: insertRoomError } = await supabase
        .from('property_rooms')
        .insert({
          property_id_ref: propertyDbId,
          room_name: room.room_name,
          room_name_ar: room.room_name_ar,
          room_type: room.room_type,
          gender,
          base_price_egp: lowestRoomOptionPrice,
          private_room_price_egp: null,
          shared_bed_price_egp: null,
          private_bathroom: room.private_bathroom,
          status: roomStatus,
          is_active: room.is_active,
          sort_order: room.sort_order,
          deleted_at: null,
          retired_reason: null,
        })
        .select('id')
        .single()

      if (insertRoomError || !insertedRoom) {
        throw new Error(
          `Failed to insert property room: ${insertRoomError?.message || 'Unknown error'}`
        )
      }

      roomId = insertedRoom.id
      usedExistingRoomIds.add(roomId)
    }

    await syncRoomSellableOptions({
      supabase,
      roomId,
      optionRows: room.option_rows,
    })

    await syncRoomBeds({
      supabase,
      roomId,
      desiredBedsCount: room.beds_count,
      propertyAvailabilityStatus: availabilityStatus,
      activeReservationIds,
    })

    syncedRooms.push({
      id: roomId,
      sort_order: room.sort_order,
      option_rows: room.option_rows,
    })
  }

  const roomsToRetire = existingRooms.filter(
    (room) => !usedExistingRoomIds.has(room.id)
  )

  for (const room of roomsToRetire) {
    await assertRoomCanBeRetired({
      supabase,
      roomId: room.id,
      activeReservationIds,
    })

    const { data: roomOptions, error: roomOptionsError } = await supabase
      .from('property_room_sellable_options')
      .select('id')
      .eq('room_id', room.id)
      .eq('is_active', true)

    if (roomOptionsError) {
      throw new Error(roomOptionsError.message)
    }

    for (const option of roomOptions || []) {
      await assertOptionCanBeRetired({
        supabase,
        optionId: option.id,
      })
    }

    const { data: roomBeds, error: roomBedsError } = await supabase
      .from('room_beds')
      .select('id')
      .eq('room_id', room.id)
      .eq('is_active', true)

    if (roomBedsError) {
      throw new Error(roomBedsError.message)
    }

    for (const bed of roomBeds || []) {
      await assertBedCanBeRetired({
        supabase,
        bedId: bed.id,
        activeReservationIds,
      })
    }

    const retiredAt = new Date().toISOString()

    const { error: retireBedsError } = await supabase
      .from('room_beds')
      .update({
        is_active: false,
        status: 'inactive',
        deleted_at: retiredAt,
        retired_reason: 'Room removed during property structure update',
      })
      .eq('room_id', room.id)
      .eq('is_active', true)

    if (retireBedsError) {
      throw new Error(retireBedsError.message)
    }

    const { error: retireOptionsError } = await supabase
      .from('property_room_sellable_options')
      .update({
        is_active: false,
        deleted_at: retiredAt,
        retired_reason: 'Room removed during property structure update',
      })
      .eq('room_id', room.id)
      .eq('is_active', true)

    if (retireOptionsError) {
      throw new Error(retireOptionsError.message)
    }

    const { error: retireRoomError } = await supabase
      .from('property_rooms')
      .update({
        is_active: false,
        status: 'inactive',
        deleted_at: retiredAt,
        retired_reason: 'Removed during property structure update',
        updated_at: retiredAt,
      })
      .eq('id', room.id)

    if (retireRoomError) {
      throw new Error(retireRoomError.message)
    }
  }

  return syncedRooms
}

async function upsertPropertySellableOptions(params: {
  supabase: AdminSupabaseClient
  propertyDbId: string
  rental_duration: 'daily' | 'monthly'
  fullApartmentPrice: number
  insertedRooms: InsertedRoomSummary[]
}) {
  const {
    supabase,
    propertyDbId,
    rental_duration,
    fullApartmentPrice,
    insertedRooms,
  } = params

  const desiredRows = buildPropertySellableOptionRows({
    propertyDbId,
    rental_duration,
    fullApartmentPrice,
    insertedRooms,
  })

  const desiredCodes = desiredRows.map((row) => row.code)

  const { data: existingRows, error: existingRowsError } = await supabase
    .from('property_sellable_options')
    .select('id, code')
    .eq('property_id', propertyDbId)

  if (existingRowsError) {
    throw new Error(
      `Failed to load property sellable options: ${existingRowsError.message}`
    )
  }

  const existingByCode = new Map(
    (existingRows ?? []).map((row) => [row.code as PropertyOptionCode, row])
  )

  for (const row of desiredRows) {
    const existing = existingByCode.get(row.code)

    if (existing) {
      const { error: updateError } = await supabase
        .from('property_sellable_options')
        .update({
          option_code: row.option_code,
          name_en: row.name_en,
          name_ar: row.name_ar,
          sell_mode: row.sell_mode,
          occupancy_size: row.occupancy_size,
          price_egp: row.price_egp,
          rental_duration: row.rental_duration,
          is_active: true,
          sort_order: row.sort_order,
          source_scope: row.source_scope,
          pricing_mode: row.pricing_mode,
          deleted_at: null,
          retired_reason: null,
        })
        .eq('id', existing.id)

      if (updateError) {
        throw new Error(
          `Failed to update property sellable option ${row.code}: ${updateError.message}`
        )
      }
    } else {
      const { error: insertError } = await supabase
        .from('property_sellable_options')
        .insert({
          ...row,
          deleted_at: null,
          retired_reason: null,
        })

      if (insertError) {
        throw new Error(
          `Failed to insert property sellable option ${row.code}: ${insertError.message}`
        )
      }
    }
  }

  const rowsToRetire = (existingRows ?? []).filter(
    (row) => !desiredCodes.includes(row.code as PropertyOptionCode)
  )

  if (rowsToRetire.length > 0) {
    const { error: retireError } = await supabase
      .from('property_sellable_options')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        retired_reason: 'Replaced during property structure update',
      })
      .in(
        'id',
        rowsToRetire.map((row) => row.id)
      )

    if (retireError) {
      throw new Error(
        `Failed to retire old property sellable options: ${retireError.message}`
      )
    }
  }
}

export async function updatePropertyAction(formData: FormData) {
  const adminContext = await requirePropertyEditorAccess()
  const supabase = createAdminClient()
  const admin = adminContext.admin

  const propertyDbId = String(formData.get('property_db_id') || '').trim()
  if (!propertyDbId) {
    throw new Error('Property ID is required')
  }

  const { data: existingProperty, error: existingPropertyError } = await supabase
    .from('properties')
    .select('id, broker_id, owner_id, admin_status, availability_status, property_id')
    .eq('id', propertyDbId)
    .maybeSingle()

  if (existingPropertyError) {
    throw new Error(existingPropertyError.message)
  }

  if (!existingProperty) {
    throw new Error('Property not found')
  }

  if (!isSuperAdmin(admin)) {
    if (!admin.broker_id) {
      throw new Error('Editor account is missing broker assignment')
    }

    if (existingProperty.broker_id !== admin.broker_id) {
      throw new Error('You are not allowed to edit this property')
    }
  }

  const { data: existingImagesRows, error: existingImagesError } = await supabase
    .from('property_images')
    .select('id, image_url, storage_path')
    .eq('property_id_ref', propertyDbId)
    .order('sort_order')

  if (existingImagesError) {
    throw new Error(existingImagesError.message)
  }

  const property_id = String(formData.get('property_id') || '').trim()
  const title_en = String(formData.get('title_en') || '').trim()
  const title_ar = String(formData.get('title_ar') || '').trim()
  const description_en = String(formData.get('description_en') || '').trim()
  const description_ar = String(formData.get('description_ar') || '').trim()
  const city_id = String(formData.get('city_id') || '').trim()
  const university_id = String(formData.get('university_id') || '').trim()
  const submittedBrokerId = String(formData.get('broker_id') || '').trim()
  const submittedOwnerId = String(formData.get('owner_id') || '').trim()

  const rental_duration = normalizeRentalDuration(
    String(formData.get('rental_duration') || 'monthly').trim()
  )

  const submittedAdminStatus = normalizeAdminStatus(
    String(formData.get('admin_status') || 'draft').trim()
  )

  const submittedAvailabilityStatus = String(
    formData.get('availability_status') ||
      existingProperty.availability_status ||
      'available'
  ).trim()

  const broker_id = isSuperAdmin(admin)
    ? submittedBrokerId
    : existingProperty.broker_id

  const admin_status = isSuperAdmin(admin)
    ? submittedAdminStatus
    : existingProperty.admin_status

  const normalizedSubmittedAvailabilityStatus =
    normalizeAvailabilityStatus(submittedAvailabilityStatus)

  if (!property_id) throw new Error('Property code is required')

  if (!title_en || !title_ar) {
    throw new Error('Both Arabic and English titles are required')
  }

  if (!description_en || !description_ar) {
    throw new Error('Both Arabic and English descriptions are required')
  }

  if (!city_id) throw new Error('City is required')
  if (!university_id) throw new Error('University is required')
  if (!broker_id) throw new Error('Broker is required')
  if (!submittedOwnerId) throw new Error('Owner is required')

  await assertBrokerExists({
    supabase,
    brokerId: broker_id,
  })

  await ensureOwnerAvailableForPropertyLocation({
    supabase,
    ownerId: submittedOwnerId,
    cityId: city_id,
    universityId: university_id,
    adminId: admin.id,
  })

  const price_egp = toNullableNumber(formData.get('price_egp'))

  if (price_egp === null || price_egp < 0) {
    throw new Error('Valid full apartment price is required')
  }

  const roomIds = formData.getAll('room_id').map((v) => String(v).trim())
  const roomNames = formData.getAll('room_name').map((v) => String(v).trim())
  const roomNameArs = formData.getAll('room_name_ar').map((v) => String(v).trim())
  const roomTypes = formData.getAll('room_type').map((v) => String(v).trim())

  const roomDurations = formData
    .getAll('room_rental_duration')
    .map((v) => String(v).trim())

  const roomBedsCounts = formData
    .getAll('room_beds_count')
    .map((v) => String(v).trim())

  const roomPrivateBathrooms = formData
    .getAll('room_private_bathroom')
    .map((v) => String(v).trim())

  const roomIsReserved = formData
    .getAll('room_is_reserved')
    .map((v) => String(v).trim())

  const roomSingleEnabled = formData
    .getAll('room_single_room_enabled')
    .map((v) => String(v).trim())

  const roomSinglePrices = formData
    .getAll('room_single_room_price_egp')
    .map((v) => String(v).trim())

  const roomDoubleEnabled = formData
    .getAll('room_double_room_enabled')
    .map((v) => String(v).trim())

  const roomDoublePrices = formData
    .getAll('room_double_room_price_egp')
    .map((v) => String(v).trim())

  const roomTripleEnabled = formData
    .getAll('room_triple_room_enabled')
    .map((v) => String(v).trim())

  const roomTriplePrices = formData
    .getAll('room_triple_room_price_egp')
    .map((v) => String(v).trim())

  const roomRows = roomNames
    .map((room_name, index) => {
      const room_name_ar = roomNameArs[index] || ''
      const room_type = roomTypes[index] || 'custom'
      const rawBedsCount = roomBedsCounts[index] || '1'
      const parsedBedsCount = Number(rawBedsCount || 0)

      const normalizedRentalDuration =
        roomDurations[index] === 'daily' ? 'daily' : 'monthly'

      const singleEnabled = toBoolean(roomSingleEnabled[index] || 'false')
      const singlePrice = Number(roomSinglePrices[index] || 0)

      const doubleEnabled = toBoolean(roomDoubleEnabled[index] || 'false')
      const doublePrice = Number(roomDoublePrices[index] || 0)

      const tripleEnabled = toBoolean(roomTripleEnabled[index] || 'false')
      const triplePrice = Number(roomTriplePrices[index] || 0)

      const hasAnyOptionValue =
        singleEnabled ||
        doubleEnabled ||
        tripleEnabled ||
        Boolean(roomSinglePrices[index]) ||
        Boolean(roomDoublePrices[index]) ||
        Boolean(roomTriplePrices[index])

      if (!room_name && !room_name_ar && !rawBedsCount && !hasAnyOptionValue) {
        return null
      }

      if (Number.isNaN(parsedBedsCount) || parsedBedsCount < 1) {
        throw new Error(`Room ${index + 1} must have at least 1 bed`)
      }

      const option_rows = buildRoomOptions({
        singleEnabled,
        singlePrice,
        doubleEnabled,
        doublePrice,
        tripleEnabled,
        triplePrice,
        beds_count: parsedBedsCount,
      })

      if (option_rows.length === 0) {
        throw new Error(
          `Room ${index + 1} must have at least one enabled booking option`
        )
      }

      return {
        id: roomIds[index] || null,
        room_name: room_name || `Room ${index + 1}`,
        room_name_ar: room_name_ar || null,
        room_type: ['single', 'double', 'triple', 'quad', 'custom'].includes(
          room_type
        )
          ? (room_type as 'single' | 'double' | 'triple' | 'quad' | 'custom')
          : 'custom',
        rental_duration: normalizedRentalDuration,
        beds_count: parsedBedsCount,
        private_bathroom: toBoolean(roomPrivateBathrooms[index] || 'false'),
        is_reserved: toBoolean(roomIsReserved[index] || 'false'),
        is_active: normalizedSubmittedAvailabilityStatus !== 'inactive',
        sort_order: index,
        option_rows,
      }
    })
    .filter(Boolean) as ParsedRoomRow[]

  if (roomRows.length === 0) {
    throw new Error('At least one room is required')
  }

  const availability_status = derivePropertyAvailabilityStatus(
    normalizedSubmittedAvailabilityStatus
  )

  const finalBedroomsCount = roomRows.length
  const finalBedsCount = roomRows.reduce((sum, room) => sum + room.beds_count, 0)
  const gender = String(formData.get('gender') || '').trim() || null

  const propertyPayload = {
    property_id,
    title_en,
    title_ar,
    description_en,
    description_ar,
    city_id,
    university_id,
    broker_id,
    owner_id: submittedOwnerId,
    price_egp,
    rental_duration,
    availability_status,
    address_en: String(formData.get('address_en') || '').trim() || null,
    address_ar: String(formData.get('address_ar') || '').trim() || null,
    latitude: toNullableNumber(formData.get('latitude')),
    longitude: toNullableNumber(formData.get('longitude')),
    bedrooms_count: finalBedroomsCount,
    bathrooms_count: toNumberOrDefault(formData.get('bathrooms_count'), 0),
    beds_count: finalBedsCount,
    guests_count: toNumberOrDefault(formData.get('guests_count'), 0),
    gender,
    airbnb_price_min: toNullableNumber(formData.get('airbnb_price_min')),
    airbnb_price_max: toNullableNumber(formData.get('airbnb_price_max')),
    smoking_policy: String(formData.get('smoking_policy') || '').trim() || null,
    admin_status,
    is_active: availability_status !== 'inactive',
    updated_by_admin_id: admin.id,
  }

  const { error: propertyError } = await supabase
    .from('properties')
    .update(propertyPayload)
    .eq('id', propertyDbId)

  if (propertyError) {
    throw new Error(propertyError.message)
  }

  await syncPrimaryOwnerPropertyLink({
    supabase,
    ownerId: submittedOwnerId,
    propertyDbId,
    brokerId: broker_id,
    adminId: admin.id,
  })

  const { error: deleteAmenitiesError } = await supabase
    .from('property_amenities')
    .delete()
    .eq('property_id_ref', propertyDbId)

  if (deleteAmenitiesError) {
    throw new Error(`Failed to delete property amenities: ${deleteAmenitiesError.message}`)
  }

  const { error: deleteFacilitiesError } = await supabase
    .from('property_facilities')
    .delete()
    .eq('property_id_ref', propertyDbId)

  if (deleteFacilitiesError) {
    throw new Error(`Failed to delete property facilities: ${deleteFacilitiesError.message}`)
  }

  const { error: deleteBillIncludesError } = await supabase
    .from('property_bill_includes')
    .delete()
    .eq('property_id_ref', propertyDbId)

  if (deleteBillIncludesError) {
    throw new Error(
      `Failed to delete property bill includes: ${deleteBillIncludesError.message}`
    )
  }

  const keptExistingImageIds = formData
    .getAll('existing_image_ids')
    .map((v) => String(v).trim())
    .filter(Boolean)

  const uploadedImages = formData
    .getAll('images')
    .filter((item): item is File => item instanceof File && item.size > 0)

  const coverKind = String(formData.get('cover_kind') || 'existing').trim()
  const coverIndex = Number(String(formData.get('cover_index') || '0'))

  const existingImagesToKeep = (existingImagesRows ?? []).filter((img) =>
    keptExistingImageIds.includes(img.id)
  )

  const existingImagesToDelete = (existingImagesRows ?? []).filter(
    (img) => !keptExistingImageIds.includes(img.id)
  )

  if (existingImagesToDelete.length > 0) {
    const storagePathsToDelete = existingImagesToDelete
      .map((img) => img.storage_path)
      .filter((path): path is string => Boolean(path))

    if (storagePathsToDelete.length > 0) {
      const { error: storageRemoveError } = await supabase.storage
        .from(PROPERTY_IMAGES_BUCKET)
        .remove(storagePathsToDelete)

      if (storageRemoveError) {
        throw new Error(storageRemoveError.message)
      }
    }

    const { error: deleteImagesError } = await supabase
      .from('property_images')
      .delete()
      .in(
        'id',
        existingImagesToDelete.map((img) => img.id)
      )

    if (deleteImagesError) {
      throw new Error(deleteImagesError.message)
    }
  }

  const uploadedImageRows: Array<{
    property_id_ref: string
    image_url: string
    storage_path: string
    is_cover: boolean
    sort_order: number
  }> = []

  for (let index = 0; index < uploadedImages.length; index++) {
    const file = uploadedImages[index]
    const safeFileName = slugifyFileName(file.name)
    const filePath = `properties/${propertyDbId}/${Date.now()}-${index}-${safeFileName}`

    const { error: uploadError } = await supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      })

    if (uploadError) {
      throw new Error(
        `Failed to upload property image: ${uploadError.message || 'Unknown error'}`
      )
    }

    const { data: publicUrlData } = supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .getPublicUrl(filePath)

    uploadedImageRows.push({
      property_id_ref: propertyDbId,
      image_url: publicUrlData.publicUrl,
      storage_path: filePath,
      is_cover: false,
      sort_order: 0,
    })
  }

  const combinedImages = [
    ...existingImagesToKeep.map((img) => ({
      id: img.id,
      property_id_ref: propertyDbId,
      image_url: img.image_url,
      storage_path: img.storage_path ?? null,
      is_cover: false,
      sort_order: 0,
      source: 'existing' as const,
    })),
    ...uploadedImageRows.map((img) => ({
      ...img,
      source: 'new' as const,
    })),
  ]

  const finalImages = combinedImages.map((img, index) => {
    let isCover = false

    if (coverKind === 'existing' && img.source === 'existing') {
      const existingOnlyIndex = combinedImages
        .filter((x) => x.source === 'existing')
        .findIndex((x) => x.id === img.id)

      isCover = existingOnlyIndex === coverIndex
    }

    if (coverKind === 'new' && img.source === 'new') {
      const newOnlyIndex = combinedImages
        .filter((x) => x.source === 'new')
        .findIndex((x) => x.storage_path === img.storage_path)

      isCover = newOnlyIndex === coverIndex
    }

    return {
      ...img,
      is_cover: isCover,
      sort_order: index,
    }
  })

  if (finalImages.length > 0 && !finalImages.some((img) => img.is_cover)) {
    finalImages[0].is_cover = true
  }

  for (const image of finalImages.filter((img) => img.source === 'existing')) {
    const { error } = await supabase
      .from('property_images')
      .update({
        image_url: image.image_url,
        storage_path: image.storage_path,
        is_cover: image.is_cover,
        sort_order: image.sort_order,
      })
      .eq('id', image.id)

    if (error) {
      throw new Error(error.message)
    }
  }

  const newRowsToInsert = finalImages
    .filter((img) => img.source === 'new')
    .map((img) => ({
      property_id_ref: propertyDbId,
      image_url: img.image_url,
      storage_path: img.storage_path,
      is_cover: img.is_cover,
      sort_order: img.sort_order,
    }))

  if (newRowsToInsert.length > 0) {
    const { error } = await supabase.from('property_images').insert(newRowsToInsert)
    if (error) {
      throw new Error(error.message)
    }
  }

  const amenityIds = formData
    .getAll('amenity_ids')
    .map((v) => String(v).trim())
    .filter(Boolean)

  if (amenityIds.length > 0) {
    const rows = amenityIds.map((amenity_id) => ({
      property_id_ref: propertyDbId,
      amenity_id,
    }))

    const { error } = await supabase.from('property_amenities').insert(rows)
    if (error) throw new Error(error.message)
  }

  const facilityIds = formData
    .getAll('facility_ids')
    .map((v) => Number(String(v).trim()))
    .filter((v) => !Number.isNaN(v))

  if (facilityIds.length > 0) {
    const rows = facilityIds.map((facility_id) => ({
      property_id_ref: propertyDbId,
      facility_id,
    }))

    const { error } = await supabase.from('property_facilities').insert(rows)
    if (error) throw new Error(error.message)
  }

  const billTypeIds = formData
    .getAll('bill_type_ids')
    .map((v) => Number(String(v).trim()))
    .filter((v) => !Number.isNaN(v))

  if (billTypeIds.length > 0) {
    const rows = billTypeIds.map((bill_type_id) => ({
      property_id_ref: propertyDbId,
      bill_type_id,
    }))

    const { error } = await supabase.from('property_bill_includes').insert(rows)
    if (error) throw new Error(error.message)
  }

  const syncedRooms = await syncPropertyRoomsStructure({
    supabase,
    propertyDbId,
    roomRows,
    availabilityStatus: availability_status,
    gender,
  })

  const { data: activeRoomsAfterSync, error: activeRoomsAfterSyncError } =
    await supabase
      .from('property_rooms')
      .select('id')
      .eq('property_id_ref', propertyDbId)
      .eq('is_active', true)

  if (activeRoomsAfterSyncError) {
    throw new Error(
      `Failed to verify active rooms after save: ${activeRoomsAfterSyncError.message}`
    )
  }

  if ((activeRoomsAfterSync?.length || 0) !== roomRows.length) {
    throw new Error(
      `Property rooms verification failed after save. Expected ${roomRows.length} active room(s), found ${activeRoomsAfterSync?.length || 0}.`
    )
  }

  const { error: syncPropertyCountsError } = await supabase
    .from('properties')
    .update({
      bedrooms_count: roomRows.length,
      beds_count: finalBedsCount,
      owner_id: submittedOwnerId,
      updated_by_admin_id: admin.id,
    })
    .eq('id', propertyDbId)

  if (syncPropertyCountsError) {
    throw new Error(
      `Failed to sync property bedroom and bed counts: ${syncPropertyCountsError.message}`
    )
  }

  await upsertPropertySellableOptions({
    supabase,
    propertyDbId,
    rental_duration,
    fullApartmentPrice: price_egp,
    insertedRooms: syncedRooms,
  })

  await recalculatePropertyAvailabilityState({
    supabase,
    propertyId: propertyDbId,
  })

  let waitingListNotificationResult: Awaited<
    ReturnType<typeof notifyWaitingListStudentsForNewProperty>
  > | null = null

  const wasNotPublished = existingProperty.admin_status !== 'published'
  const becamePublished = admin_status === 'published'
  const isActiveAfterUpdate = propertyPayload.is_active === true

  if (wasNotPublished && becamePublished && isActiveAfterUpdate) {
    try {
      waitingListNotificationResult =
        await notifyWaitingListStudentsForNewProperty(propertyDbId)
    } catch (error) {
      console.error('Failed to send waiting list notifications:', error)
    }
  }

  await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.id,
    action_type: 'property_updated',
    target_table: 'properties',
    target_id: propertyDbId,
    details: {
      property_id,
      broker_id,
      owner_id: submittedOwnerId,
      city_id,
      university_id,
      admin_status,
      availability_status,
      structure_sync_mode: 'preserve_existing_ids',
      waiting_list_notifications:
        waitingListNotificationResult || {
          success: false,
          sentCount: 0,
          reason:
            wasNotPublished && becamePublished && isActiveAfterUpdate
              ? 'notification_function_failed'
              : 'property_did_not_become_published',
        },
    },
  })

  revalidatePath('/admin/properties')
  revalidatePath('/admin/properties/review')
  revalidatePath(`/admin/properties/${propertyDbId}`)
  revalidatePath('/admin/properties/reservations')
  revalidatePath('/admin/owners')
  revalidatePath('/admin/finance/owner-settlements')
  revalidatePath(`/properties/${property_id}`)
}