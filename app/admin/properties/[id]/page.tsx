import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { requirePropertyEditorAccess, isSuperAdmin } from '@/src/lib/admin-auth'
import EditPropertyForm from './EditPropertyForm'

type PageProps = {
  params: Promise<{ id: string }>
}

type PricingSeasonCode = 'summer_course' | 'academic_year'

type RawSeasonalPriceRow = {
  id?: string
  sellable_option_id?: string | null
  room_sellable_option_id?: string | null
  season_id?: string | null
  price_egp?: number | string | null
  is_active?: boolean | null
  property_pricing_seasons?:
    | {
        code?: PricingSeasonCode | string | null
      }
    | Array<{
        code?: PricingSeasonCode | string | null
      }>
    | null
}

type SeasonalPriceRow = {
  id?: string
  sellable_option_id?: string | null
  room_sellable_option_id?: string | null
  season_id?: string | null
  price_egp?: number | string | null
  is_active?: boolean | null
  property_pricing_seasons?: {
    code?: PricingSeasonCode | string | null
  } | null
}

function normalizeOwnerRows(rows: any[] | null | undefined) {
  const uniqueOwners = new Map<string, any>()

  ;(rows ?? []).forEach((row) => {
    const owner = row.property_owners

    if (!owner || owner.is_active === false || !owner.id) return

    const serviceArea = {
      id: row.id,
      city_id: row.city_id,
      university_id: row.university_id,
      is_active: row.is_active,
    }

    const existingOwner = uniqueOwners.get(owner.id)

    if (existingOwner) {
      uniqueOwners.set(owner.id, {
        ...existingOwner,
        property_owner_service_areas: [
          ...(existingOwner.property_owner_service_areas ?? []),
          serviceArea,
        ],
      })

      return
    }

    uniqueOwners.set(owner.id, {
      ...owner,
      property_owner_service_areas: [serviceArea],
    })
  })

  return Array.from(uniqueOwners.values()).sort((a, b) =>
    String(a.full_name || '').localeCompare(String(b.full_name || '')),
  )
}

function normalizeSeasonalPriceRow(
  row: RawSeasonalPriceRow,
): SeasonalPriceRow {
  const seasonRelation = Array.isArray(row.property_pricing_seasons)
    ? row.property_pricing_seasons[0] ?? null
    : row.property_pricing_seasons ?? null

  return {
    id: row.id,
    sellable_option_id: row.sellable_option_id ?? null,
    room_sellable_option_id: row.room_sellable_option_id ?? null,
    season_id: row.season_id ?? null,
    price_egp: row.price_egp ?? null,
    is_active: row.is_active ?? null,
    property_pricing_seasons: seasonRelation
      ? {
          code: seasonRelation.code ?? null,
        }
      : null,
  }
}

function getSeasonCode(row: SeasonalPriceRow) {
  return row.property_pricing_seasons?.code ?? null
}

function buildSeasonalPriceMap(rows: SeasonalPriceRow[]) {
  const result: Partial<Record<PricingSeasonCode, number | string | null>> = {}

  rows.forEach((row) => {
    if (row.is_active === false || row.price_egp == null) return

    const seasonCode = getSeasonCode(row)

    if (
      seasonCode === 'summer_course' ||
      seasonCode === 'academic_year'
    ) {
      result[seasonCode] = row.price_egp
    }
  })

  return result
}

export default async function EditPropertyPage({ params }: PageProps) {
  const adminContext = await requirePropertyEditorAccess()
  const { id } = await params
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  const admin = adminContext.admin

  const propertyRes = await supabase
    .from('properties')
    .select(
      `
      id,
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
      availability_status,
      address_en,
      address_ar,
      latitude,
      longitude,
      bedrooms_count,
      bathrooms_count,
      beds_count,
      guests_count,
      gender,
      airbnb_price_min,
      airbnb_price_max,
      smoking_policy,
      admin_status,
      is_active,
      floor_number,
      is_featured,
      featured_rank,
      featured_until,
      featured_at,
      featured_by_admin_id
    `,
    )
    .eq('id', id)
    .maybeSingle()

  if (propertyRes.error) {
    throw new Error(propertyRes.error.message)
  }

  if (!propertyRes.data) {
    notFound()
  }

  const property = propertyRes.data

  if (!isSuperAdmin(admin)) {
    if (!admin.broker_id) {
      throw new Error('Editor account is missing broker assignment')
    }

    if (property.broker_id !== admin.broker_id) {
      redirect('/admin/unauthorized')
    }
  }

  const [
    citiesRes,
    universitiesRes,
    brokersRes,
    ownerServiceAreasRes,
    allOwnersRes,
    currentOwnerRes,
    amenitiesRes,
    facilitiesRes,
    billTypesRes,
    imagesRes,
    videosRes,
    propertyAmenitiesRes,
    propertyFacilitiesRes,
    propertyBillsRes,
    roomsRes,
    fullApartmentOptionRes,
    seasonalPricesRes,
    existingPropertiesRes,
  ] = await Promise.all([
    supabase.from('cities').select('id, name_en, name_ar').order('name_en'),

    supabase
      .from('universities')
      .select('id, city_id, name_en, name_ar')
      .order('name_en'),

    supabase
      .from('brokers')
      .select('id, full_name, company_name')
      .order('full_name'),

    supabase
      .from('property_owner_service_areas')
      .select(
        `
        id,
        owner_id,
        city_id,
        university_id,
        is_active,
        property_owners (
          id,
          full_name,
          phone_number,
          whatsapp_number,
          email,
          company_name,
          is_active
        )
      `,
      )
      .eq('is_active', true)
      .eq('property_owners.is_active', true)
      .order('created_at', { ascending: false }),

    supabase
      .from('property_owners')
      .select(
        `
        id,
        full_name,
        phone_number,
        whatsapp_number,
        email,
        company_name,
        is_active
      `,
      )
      .eq('is_active', true)
      .order('full_name'),

    property.owner_id
      ? supabase
          .from('property_owners')
          .select(
            `
            id,
            full_name,
            phone_number,
            whatsapp_number,
            email,
            company_name,
            is_active
          `,
          )
          .eq('id', property.owner_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),

    supabase
      .from('amenities')
      .select('id, name_en, name_ar')
      .eq('is_active', true)
      .order('sort_order'),

    supabase
      .from('facilities')
      .select('id, name_en, name_ar')
      .eq('is_active', true)
      .order('sort_order'),

    supabase
      .from('bill_types')
      .select('id, name_en, name_ar')
      .eq('is_active', true)
      .order('sort_order'),

    supabase
      .from('property_images')
      .select('id, image_url, storage_path, is_cover, sort_order')
      .eq('property_id_ref', id)
      .order('sort_order'),

    adminSupabase
      .from('property_videos')
      .select(
        'id, video_url, storage_path, file_mime_type, file_size_bytes, duration_seconds, sort_order, is_active',
      )
      .eq('property_id_ref', id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1),

    supabase
      .from('property_amenities')
      .select('amenity_id')
      .eq('property_id_ref', id),

    supabase
      .from('property_facilities')
      .select('facility_id')
      .eq('property_id_ref', id),

    supabase
      .from('property_bill_includes')
      .select('bill_type_id')
      .eq('property_id_ref', id),

    adminSupabase
      .from('property_rooms')
      .select(
        `
        id,
        room_name,
        room_name_ar,
        room_type,
        base_price_egp,
        private_room_price_egp,
        shared_bed_price_egp,
        private_bathroom,
        is_reserved_summer_course,
        is_reserved_academic_year,
        status,
        sort_order,
        is_active,
        room_beds (
          id,
          status,
          price_egp,
          is_active
        ),
        room_sellable_options:property_room_sellable_options (
          id,
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
      `,
      )
      .eq('property_id_ref', id)
      .eq('is_active', true)
      .order('sort_order'),

    adminSupabase
      .from('property_sellable_options')
      .select('id, code, price_egp, is_active')
      .eq('property_id', id)
      .eq('code', 'full_apartment')
      .eq('is_active', true)
      .maybeSingle(),

    adminSupabase
      .from('property_option_seasonal_prices')
      .select(
        `
        id,
        property_id,
        sellable_option_id,
        room_sellable_option_id,
        season_id,
        price_egp,
        is_active,
        property_pricing_seasons (
          code
        )
      `,
      )
      .eq('property_id', id)
      .eq('is_active', true),

    adminSupabase
      .from('properties')
      .select(
        'id, property_id, title_en, title_ar, address_en, latitude, longitude, admin_status, is_active',
      )
      .neq('id', id)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null),
  ])

  if (citiesRes.error) throw new Error(citiesRes.error.message)
  if (universitiesRes.error) throw new Error(universitiesRes.error.message)
  if (brokersRes.error) throw new Error(brokersRes.error.message)
  if (ownerServiceAreasRes.error) {
    throw new Error(ownerServiceAreasRes.error.message)
  }
  if (allOwnersRes.error) throw new Error(allOwnersRes.error.message)
  if (currentOwnerRes.error) throw new Error(currentOwnerRes.error.message)
  if (amenitiesRes.error) throw new Error(amenitiesRes.error.message)
  if (facilitiesRes.error) throw new Error(facilitiesRes.error.message)
  if (billTypesRes.error) throw new Error(billTypesRes.error.message)
  if (imagesRes.error) throw new Error(imagesRes.error.message)
  if (videosRes.error) throw new Error(videosRes.error.message)
  if (propertyAmenitiesRes.error) {
    throw new Error(propertyAmenitiesRes.error.message)
  }
  if (propertyFacilitiesRes.error) {
    throw new Error(propertyFacilitiesRes.error.message)
  }
  if (propertyBillsRes.error) throw new Error(propertyBillsRes.error.message)
  if (roomsRes.error) throw new Error(roomsRes.error.message)
  if (fullApartmentOptionRes.error) {
    throw new Error(fullApartmentOptionRes.error.message)
  }
  if (seasonalPricesRes.error) {
    throw new Error(seasonalPricesRes.error.message)
  }
  if (existingPropertiesRes.error) {
    throw new Error(existingPropertiesRes.error.message)
  }

  const existingProperties = (existingPropertiesRes.data ?? []).flatMap(
    (existingProperty) => {
      const latitude = Number(existingProperty.latitude)
      const longitude = Number(existingProperty.longitude)

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return []
      }

      return [
        {
          ...existingProperty,
          latitude,
          longitude,
        },
      ]
    },
  )

  const brokers = isSuperAdmin(admin)
    ? (brokersRes.data ?? [])
    : (brokersRes.data ?? []).filter((broker) => broker.id === admin.broker_id)

  const serviceAreaOwners = normalizeOwnerRows(ownerServiceAreasRes.data)
  const ownersMap = new Map<string, any>()

  ;((allOwnersRes.data ?? []) as any[]).forEach((owner) => {
    if (owner?.id && owner.is_active !== false) {
      ownersMap.set(owner.id, {
        ...owner,
        property_owner_service_areas: [],
      })
    }
  })

  serviceAreaOwners.forEach((owner) => {
    const existingOwner = ownersMap.get(owner.id)

    ownersMap.set(owner.id, {
      ...existingOwner,
      ...owner,
      property_owner_service_areas: owner.property_owner_service_areas ?? [],
    })
  })

  if (currentOwnerRes.data && currentOwnerRes.data.is_active !== false) {
    const existingOwner = ownersMap.get(currentOwnerRes.data.id)

    if (existingOwner) {
      ownersMap.set(currentOwnerRes.data.id, {
        ...currentOwnerRes.data,
        property_owner_service_areas:
          existingOwner.property_owner_service_areas ?? [],
      })
    }
  }

  const owners = Array.from(ownersMap.values()).sort((a, b) =>
    String(a.full_name || '').localeCompare(String(b.full_name || '')),
  )

  const seasonalPriceRows = (
    (seasonalPricesRes.data ?? []) as RawSeasonalPriceRow[]
  ).map(normalizeSeasonalPriceRow)
  const fullApartmentOption = fullApartmentOptionRes.data

  const activeRooms = (roomsRes.data ?? []).map((room: any) => ({
    ...room,
    room_beds: Array.isArray(room.room_beds)
      ? room.room_beds.filter(
          (bed: any) =>
            bed && bed.is_active !== false && bed.status !== 'inactive',
        )
      : [],
    room_sellable_options: Array.isArray(room.room_sellable_options)
      ? room.room_sellable_options
          .filter((option: any) => option && option.is_active !== false)
          .map((option: any) => {
            const optionSeasonalRows = seasonalPriceRows.filter(
              (row) => row.room_sellable_option_id === option.id,
            )

            return {
              ...option,
              seasonal_prices: buildSeasonalPriceMap(optionSeasonalRows),
              property_option_seasonal_prices: optionSeasonalRows,
            }
          })
      : [],
  }))

  const fullApartmentSeasonalRows = fullApartmentOption?.id
    ? seasonalPriceRows.filter(
        (row) => row.sellable_option_id === fullApartmentOption.id,
      )
    : []

  const syncedProperty = {
    ...property,
    price_egp:
      fullApartmentOption?.price_egp != null
        ? fullApartmentOption.price_egp
        : property.price_egp,
    seasonal_prices: buildSeasonalPriceMap(fullApartmentSeasonalRows),
    property_option_seasonal_prices: fullApartmentSeasonalRows,
    bedrooms_count: activeRooms.length,
    beds_count: activeRooms.reduce((sum: number, room: any) => {
      const roomBedsCount = Array.isArray(room.room_beds)
        ? room.room_beds.length
        : 0
      return sum + roomBedsCount
    }, 0),
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Edit Property</h1>

      <EditPropertyForm
        property={syncedProperty}
        cities={citiesRes.data ?? []}
        universities={universitiesRes.data ?? []}
        brokers={brokers}
        owners={owners}
        amenities={amenitiesRes.data ?? []}
        facilities={facilitiesRes.data ?? []}
        billTypes={billTypesRes.data ?? []}
        images={imagesRes.data ?? []}
        video={(videosRes.data ?? [])[0] ?? null}
        selectedAmenityIds={(propertyAmenitiesRes.data ?? []).map(
          (x: any) => x.amenity_id,
        )}
        selectedFacilityIds={(propertyFacilitiesRes.data ?? []).map(
          (x: any) => x.facility_id,
        )}
        selectedBillTypeIds={(propertyBillsRes.data ?? []).map(
          (x: any) => x.bill_type_id,
        )}
        rooms={activeRooms}
        bookingRequests={[]}
        canChangeBroker={isSuperAdmin(admin)}
        canChangeAdminStatus={isSuperAdmin(admin)}
        existingProperties={existingProperties}
      />
    </div>
  )
}
