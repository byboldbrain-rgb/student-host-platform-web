import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import {
  requirePropertyEditorAccess,
  isSuperAdmin,
} from '@/src/lib/admin-auth'
import EditPropertyForm from './EditPropertyForm'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditPropertyPage({ params }: PageProps) {
  const adminContext = await requirePropertyEditorAccess()
  const { id } = await params
  const supabase = await createClient()
  const admin = adminContext.admin

  const [
    propertyRes,
    citiesRes,
    universitiesRes,
    brokersRes,
    amenitiesRes,
    facilitiesRes,
    billTypesRes,
    imagesRes,
    propertyAmenitiesRes,
    propertyFacilitiesRes,
    propertyBillsRes,
    roomsRes,
  ] = await Promise.all([
    supabase
      .from('properties')
      .select(`
        id,
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
        is_active
      `)
      .eq('id', id)
      .maybeSingle(),

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

    supabase
      .from('property_rooms')
      .select(`
        id,
        room_name,
        room_name_ar,
        room_type,
        base_price_egp,
        private_room_price_egp,
        shared_bed_price_egp,
        private_bathroom,
        status,
        sort_order,
        room_beds (
          id,
          status,
          price_egp
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
      `)
      .eq('property_id_ref', id)
      .order('sort_order'),
  ])

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

  const brokers = isSuperAdmin(admin)
    ? brokersRes.data ?? []
    : (brokersRes.data ?? []).filter((broker) => broker.id === admin.broker_id)

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Edit Property</h1>

      <EditPropertyForm
        property={property}
        cities={citiesRes.data ?? []}
        universities={universitiesRes.data ?? []}
        brokers={brokers}
        amenities={amenitiesRes.data ?? []}
        facilities={facilitiesRes.data ?? []}
        billTypes={billTypesRes.data ?? []}
        images={imagesRes.data ?? []}
        selectedAmenityIds={(propertyAmenitiesRes.data ?? []).map(
          (x: any) => x.amenity_id
        )}
        selectedFacilityIds={(propertyFacilitiesRes.data ?? []).map(
          (x: any) => x.facility_id
        )}
        selectedBillTypeIds={(propertyBillsRes.data ?? []).map(
          (x: any) => x.bill_type_id
        )}
        rooms={roomsRes.data ?? []}
        canChangeBroker={isSuperAdmin(admin)}
        canChangeAdminStatus={isSuperAdmin(admin)}
      />
    </div>
  )
}