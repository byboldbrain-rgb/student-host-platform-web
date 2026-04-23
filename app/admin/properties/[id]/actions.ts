'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  requirePropertyEditorAccess,
  isSuperAdmin,
} from '@/src/lib/admin-auth'

const PROPERTY_IMAGES_BUCKET = 'property-images'

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
  submittedStatus: PropertyAvailabilityStatus,
  roomRows: ParsedRoomRow[]
): PropertyAvailabilityStatus {
  if (submittedStatus === 'inactive') {
    return 'inactive'
  }

  if (roomRows.length === 0) {
    return 'available'
  }

  const reservedRoomsCount = roomRows.filter((room) => room.is_reserved).length

  if (reservedRoomsCount === 0) {
    return 'available'
  }

  if (reservedRoomsCount === roomRows.length) {
    return 'fully_reserved'
  }

  return 'partially_reserved'
}

function deriveRoomStatus(params: {
  propertyAvailabilityStatus: PropertyAvailabilityStatus
  isReserved: boolean
}): RoomStatus {
  if (params.propertyAvailabilityStatus === 'inactive') {
    return 'inactive'
  }

  return params.isReserved ? 'fully_reserved' : 'available'
}

function deriveBedStatus(params: {
  propertyAvailabilityStatus: PropertyAvailabilityStatus
  isReserved: boolean
}): BedStatus {
  if (params.propertyAvailabilityStatus === 'inactive') {
    return 'inactive'
  }

  return params.isReserved ? 'reserved' : 'available'
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

async function insertRoomSellableOptions(params: {
  supabase: AdminSupabaseClient
  roomId: string
  optionRows: ParsedRoomOption[]
}) {
  const { supabase, roomId, optionRows } = params

  if (optionRows.length === 0) return

  const roomOptionRows = optionRows.map((option) => ({
    room_id: roomId,
    code: option.code,
    name_en: option.name_en,
    name_ar: option.name_ar,
    occupancy_size: option.occupancy_size,
    pricing_mode: option.pricing_mode,
    price_egp: option.price_egp,
    consumes_beds_count: option.consumes_beds_count,
    is_exclusive: option.is_exclusive,
    is_active: option.is_active,
    sort_order: option.sort_order,
    deleted_at: null,
    retired_reason: null,
  }))

  const { error: roomOptionsError } = await supabase
    .from('property_room_sellable_options')
    .insert(roomOptionRows)

  if (roomOptionsError) {
    throw new Error(
      `Failed to update room booking options: ${roomOptionsError.message}`
    )
  }
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

async function retireExistingPropertyStructure(params: {
  supabase: AdminSupabaseClient
  propertyDbId: string
}) {
  const { supabase, propertyDbId } = params
  const retiredAt = new Date().toISOString()
  const retiredReason = 'Replaced during property structure update'

  const { data: existingRooms, error: existingRoomsError } = await supabase
    .from('property_rooms')
    .select('id')
    .eq('property_id_ref', propertyDbId)
    .eq('is_active', true)

  if (existingRoomsError) {
    throw new Error(`Failed to load existing rooms: ${existingRoomsError.message}`)
  }

  const existingRoomIds = (existingRooms || []).map((room) => room.id)

  if (existingRoomIds.length > 0) {
    const { error: bedsRetireError } = await supabase
      .from('room_beds')
      .update({
        is_active: false,
        status: 'inactive',
        deleted_at: retiredAt,
        retired_reason: retiredReason,
      })
      .in('room_id', existingRoomIds)
      .eq('is_active', true)

    if (bedsRetireError) {
      throw new Error(`Failed to retire room beds: ${bedsRetireError.message}`)
    }

    const { error: roomOptionsRetireError } = await supabase
      .from('property_room_sellable_options')
      .update({
        is_active: false,
        deleted_at: retiredAt,
        retired_reason: retiredReason,
      })
      .in('room_id', existingRoomIds)
      .eq('is_active', true)

    if (roomOptionsRetireError) {
      throw new Error(
        `Failed to retire room sellable options: ${roomOptionsRetireError.message}`
      )
    }

    const { error: roomsRetireError } = await supabase
      .from('property_rooms')
      .update({
        is_active: false,
        status: 'inactive',
        deleted_at: retiredAt,
        retired_reason: retiredReason,
      })
      .in('id', existingRoomIds)
      .eq('is_active', true)

    if (roomsRetireError) {
      throw new Error(`Failed to retire existing rooms: ${roomsRetireError.message}`)
    }
  }

  const { data: remainingActiveRooms, error: remainingActiveRoomsError } = await supabase
    .from('property_rooms')
    .select('id')
    .eq('property_id_ref', propertyDbId)
    .eq('is_active', true)

  if (remainingActiveRoomsError) {
    throw new Error(
      `Failed to verify existing rooms retirement: ${remainingActiveRoomsError.message}`
    )
  }

  if ((remainingActiveRooms?.length || 0) > 0) {
    throw new Error(
      'Old active rooms still exist after retiring the previous property structure.'
    )
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
    .select('id, broker_id, admin_status, availability_status, property_id')
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
  const rental_duration = String(
    formData.get('rental_duration') || 'monthly'
  ).trim()
  const submittedAdminStatus = String(
    formData.get('admin_status') || 'draft'
  ).trim()
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

  const price_egp = toNullableNumber(formData.get('price_egp'))
  if (price_egp === null || price_egp < 0) {
    throw new Error('Valid full apartment price is required')
  }

  if (!['daily', 'monthly'].includes(rental_duration)) {
    throw new Error('Invalid rental duration')
  }

  if (isSuperAdmin(admin) && !['draft', 'pending_review'].includes(admin_status)) {
    throw new Error('Invalid admin status')
  }

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
    normalizedSubmittedAvailabilityStatus,
    roomRows
  )

  const finalBedroomsCount = roomRows.length
  const finalBedsCount = roomRows.reduce((sum, room) => sum + room.beds_count, 0)

  const propertyPayload = {
    property_id,
    title_en,
    title_ar,
    description_en,
    description_ar,
    city_id,
    university_id,
    broker_id,
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
    gender: String(formData.get('gender') || '').trim() || null,
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

  await retireExistingPropertyStructure({
    supabase,
    propertyDbId,
  })

  const insertedRooms: InsertedRoomSummary[] = []

  for (const room of roomRows) {
    const roomStatus = deriveRoomStatus({
      propertyAvailabilityStatus: availability_status,
      isReserved: room.is_reserved,
    })

    const bedStatus = deriveBedStatus({
      propertyAvailabilityStatus: availability_status,
      isReserved: room.is_reserved,
    })

    const lowestRoomOptionPrice =
      room.option_rows
        .map((option) => option.price_egp)
        .sort((a, b) => a - b)[0] ?? null

    const { data: insertedRoom, error: roomError } = await supabase
      .from('property_rooms')
      .insert([
        {
          property_id_ref: propertyDbId,
          room_name: room.room_name,
          room_name_ar: room.room_name_ar,
          room_type: room.room_type,
          gender: String(formData.get('gender') || '').trim() || null,
          base_price_egp: lowestRoomOptionPrice,
          private_room_price_egp: null,
          shared_bed_price_egp: null,
          private_bathroom: room.private_bathroom,
          status: roomStatus,
          is_active: room.is_active,
          sort_order: room.sort_order,
          deleted_at: null,
          retired_reason: null,
        },
      ])
      .select('id')
      .single()

    if (roomError || !insertedRoom) {
      throw new Error(
        `Failed to update property room: ${roomError?.message || 'Unknown error'}`
      )
    }

    await insertRoomSellableOptions({
      supabase,
      roomId: insertedRoom.id,
      optionRows: room.option_rows,
    })

    const bedRows = Array.from({ length: room.beds_count }).map((_, bedIndex) => ({
      room_id: insertedRoom.id,
      bed_label: `Bed ${bedIndex + 1}`,
      bed_type: room.beds_count === 1 ? 'single' : 'custom',
      price_egp: null,
      status: bedStatus,
      is_active: availability_status !== 'inactive',
      sort_order: bedIndex,
      deleted_at: null,
      retired_reason: null,
    }))

    if (bedRows.length > 0) {
      const { error: bedsError } = await supabase.from('room_beds').insert(bedRows)

      if (bedsError) {
        throw new Error(`Failed to update room beds: ${bedsError.message}`)
      }
    }

    insertedRooms.push({
      id: insertedRoom.id,
      sort_order: room.sort_order,
      option_rows: room.option_rows,
    })
  }

  const { data: activeRoomsAfterInsert, error: activeRoomsAfterInsertError } =
    await supabase
      .from('property_rooms')
      .select('id')
      .eq('property_id_ref', propertyDbId)
      .eq('is_active', true)

  if (activeRoomsAfterInsertError) {
    throw new Error(
      `Failed to verify active rooms after insert: ${activeRoomsAfterInsertError.message}`
    )
  }

  if ((activeRoomsAfterInsert?.length || 0) !== roomRows.length) {
    throw new Error(
      `Property rooms verification failed after save. Expected ${roomRows.length} active room(s), found ${activeRoomsAfterInsert?.length || 0}.`
    )
  }

  const { error: syncPropertyCountsError } = await supabase
    .from('properties')
    .update({
      bedrooms_count: roomRows.length,
      beds_count: finalBedsCount,
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
    rental_duration: rental_duration as 'daily' | 'monthly',
    fullApartmentPrice: price_egp,
    insertedRooms,
  })

  revalidatePath('/admin/properties')
  revalidatePath('/admin/properties/review')
  revalidatePath(`/admin/properties/${propertyDbId}`)
  revalidatePath('/admin/properties/reservations')
  revalidatePath(`/properties/${property_id}`)
}