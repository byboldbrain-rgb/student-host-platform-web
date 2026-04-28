'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { requirePropertyCreatorAccess, isSuperAdmin } from '@/src/lib/admin-auth'

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

type RoomSellableOptionInput = {
  code: 'single_room' | 'double_room' | 'triple_room'
  name_en: string
  name_ar: string
  occupancy_size: number
  pricing_mode: 'per_person'
  consumes_beds_count: number
  is_exclusive: boolean
  price_egp: number
  sort_order: number
}

type RoomRowInput = {
  room_name: string
  room_name_ar: string | null
  room_type: 'single' | 'double' | 'triple' | 'quad' | 'custom'
  rental_duration: 'daily' | 'monthly'
  beds_count: number
  private_bathroom: boolean
  is_active: boolean
  sort_order: number
  enabled_options: RoomSellableOptionInput[]
}

type InsertedRoomSummary = {
  id: string
  sort_order: number
  enabled_options: RoomSellableOptionInput[]
}

type PropertyOptionCode =
  | 'full_apartment'
  | 'single_room'
  | 'double_room'
  | 'triple_room'

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

function getOptionLabel(code: RoomSellableOptionInput['code']) {
  switch (code) {
    case 'single_room':
      return 'Single Room'
    case 'double_room':
      return 'Double Room'
    case 'triple_room':
      return 'Triple Room'
    default:
      return code
  }
}

function normalizeRentalDuration(value: string): 'daily' | 'monthly' {
  return value === 'daily' ? 'daily' : 'monthly'
}

function buildPropertySellableOptionRows(params: {
  propertyIdRef: string
  rentalDuration: 'daily' | 'monthly'
  fullApartmentPrice: number
  insertedRooms: InsertedRoomSummary[]
}) {
  const { propertyIdRef, rentalDuration, fullApartmentPrice, insertedRooms } =
    params

  const singleOptionPrices = insertedRooms
    .flatMap((room) =>
      room.enabled_options.filter((option) => option.code === 'single_room')
    )
    .map((option) => option.price_egp)

  const doubleOptionPrices = insertedRooms
    .flatMap((room) =>
      room.enabled_options.filter((option) => option.code === 'double_room')
    )
    .map((option) => option.price_egp)

  const tripleOptionPrices = insertedRooms
    .flatMap((room) =>
      room.enabled_options.filter((option) => option.code === 'triple_room')
    )
    .map((option) => option.price_egp)

  return [
    {
      property_id: propertyIdRef,
      code: 'full_apartment',
      option_code: 'full_apartment',
      name_en: 'Full Apartment',
      name_ar: 'الشقة بالكامل',
      sell_mode: 'entire_property',
      occupancy_size: null,
      price_egp: fullApartmentPrice,
      rental_duration: rentalDuration,
      is_active: true,
      sort_order: 0,
      source_scope: 'property',
      pricing_mode: 'per_room',
    },
    ...(singleOptionPrices.length > 0
      ? [
          {
            property_id: propertyIdRef,
            code: 'single_room',
            option_code: 'single_room',
            name_en: 'Single Room',
            name_ar: 'غرفة سينجل',
            sell_mode: 'bed',
            occupancy_size: 1,
            price_egp: Math.min(...singleOptionPrices),
            rental_duration: rentalDuration,
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
            property_id: propertyIdRef,
            code: 'double_room',
            option_code: 'double_room',
            name_en: 'Double Room',
            name_ar: 'غرفة دابل',
            sell_mode: 'bed',
            occupancy_size: 2,
            price_egp: Math.min(...doubleOptionPrices),
            rental_duration: rentalDuration,
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
            property_id: propertyIdRef,
            code: 'triple_room',
            option_code: 'triple_room',
            name_en: 'Triple Room',
            name_ar: 'غرفة تربل',
            sell_mode: 'bed',
            occupancy_size: 3,
            price_egp: Math.min(...tripleOptionPrices),
            rental_duration: rentalDuration,
            is_active: true,
            sort_order: 3,
            source_scope: 'room',
            pricing_mode: 'per_person',
          } satisfies PropertySellableOptionRow,
        ]
      : []),
  ].filter((row) => row.price_egp > 0) as PropertySellableOptionRow[]
}

async function validateBrokerAccess({
  supabase,
  admin,
  brokerId,
}: {
  supabase: AdminSupabaseClient
  admin: {
    id: string
    broker_id?: string | null
  }
  brokerId: string
}) {
  if (!brokerId) {
    throw new Error('Broker is required')
  }

  if (!isSuperAdmin(admin as any)) {
    if (!admin.broker_id) {
      throw new Error('Editor account is missing broker assignment')
    }

    if (brokerId !== admin.broker_id) {
      throw new Error('You are not allowed to create properties for this broker')
    }
  }

  const { data: broker, error: brokerError } = await supabase
    .from('brokers')
    .select('id')
    .eq('id', brokerId)
    .maybeSingle()

  if (brokerError) {
    throw new Error(brokerError.message)
  }

  if (!broker) {
    throw new Error('Selected broker was not found')
  }
}

async function validateOwner({
  supabase,
  ownerId,
}: {
  supabase: AdminSupabaseClient
  ownerId: string
}) {
  if (!ownerId) {
    throw new Error('Owner is required')
  }

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
    throw new Error('Selected owner is inactive')
  }
}

async function validateOwnerServiceArea({
  supabase,
  ownerId,
  cityId,
  universityId,
}: {
  supabase: AdminSupabaseClient
  ownerId: string
  cityId: string
  universityId: string
}) {
  if (!ownerId) {
    throw new Error('Owner is required')
  }

  if (!cityId) {
    throw new Error('City is required')
  }

  if (!universityId) {
    throw new Error('University is required')
  }

  const { data: serviceArea, error: serviceAreaError } = await supabase
    .from('owner_service_areas')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('city_id', cityId)
    .eq('university_id', universityId)
    .eq('is_active', true)
    .maybeSingle()

  if (serviceAreaError) {
    throw new Error(serviceAreaError.message)
  }

  if (!serviceArea) {
    throw new Error(
      'Selected owner is not assigned to the selected city and university'
    )
  }
}

async function validateBrokerOwnerLink({
  supabase,
  brokerId,
  ownerId,
}: {
  supabase: AdminSupabaseClient
  brokerId: string
  ownerId: string
}) {
  const { data: existingLink, error: linkError } = await supabase
    .from('broker_property_owners')
    .select('id, status')
    .eq('broker_id', brokerId)
    .eq('owner_id', ownerId)
    .maybeSingle()

  if (linkError) {
    throw new Error(linkError.message)
  }

  if (existingLink && existingLink.status === 'blocked') {
    throw new Error('This owner is blocked for the selected broker')
  }

  if (!existingLink) {
    const { error: insertLinkError } = await supabase
      .from('broker_property_owners')
      .insert({
        broker_id: brokerId,
        owner_id: ownerId,
        relationship_type: 'managed_by',
        status: 'active',
      })

    if (insertLinkError) {
      throw new Error(
        `Failed to link owner with broker: ${insertLinkError.message}`
      )
    }
  }
}

export async function createPropertyAction(formData: FormData) {
  const adminContext = await requirePropertyCreatorAccess()
  const supabase = createAdminClient()
  const admin = adminContext.admin

  const property_id = String(formData.get('property_id') || '').trim()
  const title_en = String(formData.get('title_en') || '').trim()
  const rawTitleAr = String(formData.get('title_ar') || '').trim()
  const description_en = String(formData.get('description_en') || '').trim()
  const rawDescriptionAr = String(formData.get('description_ar') || '').trim()
  const city_id = String(formData.get('city_id') || '').trim()
  const university_id = String(formData.get('university_id') || '').trim()
  const submittedBrokerId = String(formData.get('broker_id') || '').trim()
  const owner_id = String(formData.get('owner_id') || '').trim()
  const rental_duration = normalizeRentalDuration(
    String(formData.get('rental_duration') || 'monthly').trim()
  )
  const admin_status = String(formData.get('admin_status') || 'draft').trim()
  const gender = String(formData.get('gender') || '').trim() || null
  const smoking_policy =
    String(formData.get('smoking_policy') || '').trim() || null

  const title_ar = rawTitleAr || title_en
  const description_ar = rawDescriptionAr || description_en
  const address_en = String(formData.get('address_en') || '').trim() || null
  const rawAddressAr = String(formData.get('address_ar') || '').trim()
  const address_ar = rawAddressAr || address_en

  const broker_id = admin.broker_id || submittedBrokerId

  if (!property_id) {
    throw new Error('Property code is required')
  }

  if (!['draft', 'pending_review'].includes(admin_status)) {
    throw new Error('Invalid admin status')
  }

  await validateBrokerAccess({
    supabase,
    admin,
    brokerId: broker_id,
  })

  await validateOwner({
    supabase,
    ownerId: owner_id,
  })

  await validateOwnerServiceArea({
    supabase,
    ownerId: owner_id,
    cityId: city_id,
    universityId: university_id,
  })

  await validateBrokerOwnerLink({
    supabase,
    brokerId: broker_id,
    ownerId: owner_id,
  })

  const price_egp = toNullableNumber(formData.get('price_egp'))
  const uploadedImages = formData
    .getAll('images')
    .filter((item): item is File => item instanceof File && item.size > 0)

  const roomNames = formData.getAll('room_name').map((v) => String(v).trim())
  const roomNameArs = formData
    .getAll('room_name_ar')
    .map((v) => String(v).trim())
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
      const room_name_ar_input = roomNameArs[index] || ''
      const room_type = roomTypes[index] || 'custom'
      const rawBedsCount = roomBedsCounts[index] || '1'

      const singleEnabled = toBoolean(roomSingleEnabled[index] || 'false')
      const doubleEnabled = toBoolean(roomDoubleEnabled[index] || 'false')
      const tripleEnabled = toBoolean(roomTripleEnabled[index] || 'false')

      const parsedSinglePrice = Number(roomSinglePrices[index] || 0)
      const parsedDoublePrice = Number(roomDoublePrices[index] || 0)
      const parsedTriplePrice = Number(roomTriplePrices[index] || 0)
      const parsedBedsCount = Number(rawBedsCount || 0)

      const hasAnyValue =
        room_name ||
        room_name_ar_input ||
        rawBedsCount ||
        singleEnabled ||
        doubleEnabled ||
        tripleEnabled ||
        (roomSinglePrices[index] || '').trim() ||
        (roomDoublePrices[index] || '').trim() ||
        (roomTriplePrices[index] || '').trim()

      if (!hasAnyValue) {
        return null
      }

      const beds_count =
        Number.isNaN(parsedBedsCount) || parsedBedsCount < 1
          ? 1
          : parsedBedsCount

      const enabled_options: RoomSellableOptionInput[] = []

      if (
        singleEnabled &&
        !Number.isNaN(parsedSinglePrice) &&
        parsedSinglePrice > 0
      ) {
        enabled_options.push({
          code: 'single_room',
          name_en: 'Single Room',
          name_ar: 'غرفة سينجل',
          occupancy_size: 1,
          pricing_mode: 'per_person',
          consumes_beds_count: 1,
          is_exclusive: false,
          price_egp: parsedSinglePrice,
          sort_order: 0,
        })
      }

      if (
        doubleEnabled &&
        !Number.isNaN(parsedDoublePrice) &&
        parsedDoublePrice > 0
      ) {
        enabled_options.push({
          code: 'double_room',
          name_en: 'Double Room',
          name_ar: 'غرفة دابل',
          occupancy_size: 2,
          pricing_mode: 'per_person',
          consumes_beds_count: 1,
          is_exclusive: false,
          price_egp: parsedDoublePrice,
          sort_order: 1,
        })
      }

      if (
        tripleEnabled &&
        !Number.isNaN(parsedTriplePrice) &&
        parsedTriplePrice > 0
      ) {
        enabled_options.push({
          code: 'triple_room',
          name_en: 'Triple Room',
          name_ar: 'غرفة تربل',
          occupancy_size: 3,
          pricing_mode: 'per_person',
          consumes_beds_count: 1,
          is_exclusive: false,
          price_egp: parsedTriplePrice,
          sort_order: 2,
        })
      }

      const normalizedRoomName = room_name || `Room ${index + 1}`
      const normalizedRoomNameAr = room_name_ar_input || normalizedRoomName

      return {
        room_name: normalizedRoomName,
        room_name_ar: normalizedRoomNameAr,
        room_type: ['single', 'double', 'triple', 'quad', 'custom'].includes(
          room_type
        )
          ? (room_type as RoomRowInput['room_type'])
          : 'custom',
        rental_duration: roomDurations[index] === 'daily' ? 'daily' : 'monthly',
        beds_count,
        private_bathroom: toBoolean(roomPrivateBathrooms[index] || 'false'),
        is_active: true,
        sort_order: index,
        enabled_options,
      }
    })
    .filter(Boolean) as RoomRowInput[]

  for (const room of roomRows) {
    if (!room.room_name.trim()) {
      throw new Error('Each room must have a room name in English')
    }

    if (room.enabled_options.length === 0) {
      throw new Error(
        `Room "${room.room_name}" must have at least one enabled booking option`
      )
    }

    for (const option of room.enabled_options) {
      if (option.occupancy_size > room.beds_count) {
        throw new Error(
          `${getOptionLabel(option.code)} in room "${room.room_name}" requires at least ${option.occupancy_size} beds`
        )
      }
    }
  }

  if (admin_status === 'pending_review') {
    if (!title_en) {
      throw new Error('English title is required')
    }

    if (!description_en) {
      throw new Error('English description is required')
    }

    if (!address_en) {
      throw new Error('English address is required')
    }

    if (!city_id) throw new Error('City is required')
    if (!university_id) throw new Error('University is required')
    if (!broker_id) throw new Error('Broker is required')
    if (!owner_id) throw new Error('Owner is required')

    if (price_egp === null || price_egp <= 0) {
      throw new Error('Valid full apartment price is required')
    }

    if (uploadedImages.length === 0) {
      throw new Error('At least one image is required')
    }

    const hasValidRoom = roomRows.some(
      (room) =>
        room.room_name.trim() !== '' &&
        room.beds_count > 0 &&
        room.enabled_options.length > 0
    )

    if (!hasValidRoom) {
      throw new Error(
        'At least one valid room with at least one enabled booking option is required'
      )
    }
  }

  const finalBedroomsCount =
    roomRows.length > 0
      ? roomRows.length
      : toNumberOrDefault(formData.get('bedrooms_count'), 0)

  const finalBedsCount =
    roomRows.length > 0
      ? roomRows.reduce((sum, room) => sum + room.beds_count, 0)
      : toNumberOrDefault(formData.get('beds_count'), 0)

  const propertyPayload = {
    property_id,
    title_en,
    title_ar,
    description_en,
    description_ar,
    city_id,
    university_id,
    broker_id,
    owner_id,
    price_egp,
    rental_duration,
    availability_status: 'available',
    address_en,
    address_ar,
    bedrooms_count: finalBedroomsCount,
    bathrooms_count: toNumberOrDefault(formData.get('bathrooms_count'), 0),
    beds_count: finalBedsCount,
    guests_count: toNumberOrDefault(formData.get('guests_count'), 0),
    gender,
    smoking_policy,
    admin_status,
    is_active: true,
    created_by_admin_id: admin.id,
    updated_by_admin_id: admin.id,
  }

  const { data: insertedProperty, error: propertyError } = await supabase
    .from('properties')
    .insert([propertyPayload])
    .select('id')
    .single()

  if (propertyError || !insertedProperty) {
    throw new Error(
      `Failed to create property: ${propertyError?.message || 'Unknown error'}`
    )
  }

  const propertyIdRef = insertedProperty.id
  const coverIndex = Number(String(formData.get('cover_index') || '0'))

  if (uploadedImages.length > 0) {
    const imageRows: Array<{
      property_id_ref: string
      image_url: string
      storage_path: string
      is_cover: boolean
      sort_order: number
    }> = []

    for (let index = 0; index < uploadedImages.length; index++) {
      const file = uploadedImages[index]
      const safeFileName = slugifyFileName(file.name)
      const filePath = `properties/${propertyIdRef}/${Date.now()}-${index}-${safeFileName}`

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

      imageRows.push({
        property_id_ref: propertyIdRef,
        image_url: publicUrlData.publicUrl,
        storage_path: filePath,
        is_cover: index === coverIndex,
        sort_order: index,
      })
    }

    if (imageRows.length > 0 && !imageRows.some((image) => image.is_cover)) {
      imageRows[0].is_cover = true
    }

    const { error: imagesError } = await supabase
      .from('property_images')
      .insert(imageRows)

    if (imagesError) {
      throw new Error(`Failed to insert property images: ${imagesError.message}`)
    }
  }

  const amenityIds = formData
    .getAll('amenity_ids')
    .map((v) => String(v).trim())
    .filter(Boolean)

  if (amenityIds.length > 0) {
    const rows = amenityIds.map((amenity_id) => ({
      property_id_ref: propertyIdRef,
      amenity_id,
    }))

    const { error } = await supabase.from('property_amenities').insert(rows)

    if (error) {
      throw new Error(`Failed to insert property amenities: ${error.message}`)
    }
  }

  const facilityIds = formData
    .getAll('facility_ids')
    .map((v) => Number(String(v).trim()))
    .filter((v) => !Number.isNaN(v))

  if (facilityIds.length > 0) {
    const rows = facilityIds.map((facility_id) => ({
      property_id_ref: propertyIdRef,
      facility_id,
    }))

    const { error } = await supabase.from('property_facilities').insert(rows)

    if (error) {
      throw new Error(`Failed to insert property facilities: ${error.message}`)
    }
  }

  const billTypeIds = formData
    .getAll('bill_type_ids')
    .map((v) => Number(String(v).trim()))
    .filter((v) => !Number.isNaN(v))

  if (billTypeIds.length > 0) {
    const rows = billTypeIds.map((bill_type_id) => ({
      property_id_ref: propertyIdRef,
      bill_type_id,
    }))

    const { error } = await supabase.from('property_bill_includes').insert(rows)

    if (error) {
      throw new Error(`Failed to insert property bill includes: ${error.message}`)
    }
  }

  const insertedRooms: InsertedRoomSummary[] = []

  if (roomRows.length > 0) {
    for (const room of roomRows) {
      const fallbackBasePrice =
        room.enabled_options.length > 0
          ? Math.min(...room.enabled_options.map((option) => option.price_egp))
          : null

      const { data: insertedRoom, error: roomError } = await supabase
        .from('property_rooms')
        .insert([
          {
            property_id_ref: propertyIdRef,
            room_name: room.room_name,
            room_name_ar: room.room_name_ar,
            room_type: room.room_type,
            gender,
            base_price_egp: fallbackBasePrice,
            private_room_price_egp: null,
            shared_bed_price_egp: null,
            private_bathroom: room.private_bathroom,
            status: 'available',
            is_active: room.is_active,
            sort_order: room.sort_order,
          },
        ])
        .select('id')
        .single()

      if (roomError || !insertedRoom) {
        throw new Error(
          `Failed to insert property room: ${roomError?.message || 'Unknown error'}`
        )
      }

      const bedRows = Array.from({ length: room.beds_count }).map(
        (_, bedIndex) => ({
          room_id: insertedRoom.id,
          bed_label: `Bed ${bedIndex + 1}`,
          bed_label_ar: `Bed ${bedIndex + 1}`,
          bed_type: room.beds_count === 1 ? 'single' : 'custom',
          price_egp: null,
          status: 'available',
          is_active: true,
          sort_order: bedIndex,
        })
      )

      if (bedRows.length > 0) {
        const { error: bedsError } = await supabase.from('room_beds').insert(bedRows)

        if (bedsError) {
          throw new Error(`Failed to insert room beds: ${bedsError.message}`)
        }
      }

      if (room.enabled_options.length > 0) {
        const roomSellableRows = room.enabled_options.map((option) => ({
          room_id: insertedRoom.id,
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
        }))

        const { error: roomSellableError } = await supabase
          .from('property_room_sellable_options')
          .insert(roomSellableRows)

        if (roomSellableError) {
          throw new Error(
            `Failed to insert room sellable options: ${roomSellableError.message}`
          )
        }
      }

      insertedRooms.push({
        id: insertedRoom.id,
        sort_order: room.sort_order,
        enabled_options: room.enabled_options,
      })
    }
  }

  if (price_egp && price_egp > 0) {
    const sellableOptionsRows = buildPropertySellableOptionRows({
      propertyIdRef,
      rentalDuration: rental_duration,
      fullApartmentPrice: price_egp,
      insertedRooms,
    })

    if (sellableOptionsRows.length > 0) {
      const { error: sellableOptionsError } = await supabase
        .from('property_sellable_options')
        .insert(sellableOptionsRows)

      if (sellableOptionsError) {
        throw new Error(
          `Failed to insert property sellable options: ${sellableOptionsError.message}`
        )
      }
    }
  }

  await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.id,
    action_type: 'property_created',
    target_table: 'properties',
    target_id: propertyIdRef,
    details: {
      property_id,
      broker_id,
      owner_id,
      city_id,
      university_id,
      admin_status,
    },
  })

  revalidatePath('/admin/properties')
  revalidatePath('/admin/properties/review')
  revalidatePath('/admin/owners')
  revalidatePath('/admin/finance/owner-settlements')
  revalidatePath(`/properties/${property_id}`)
}