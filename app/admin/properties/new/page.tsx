import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  requirePropertyCreatorAccess,
  isSuperAdmin,
} from '@/src/lib/admin-auth'
import NewPropertyForm from './NewPropertyForm'

export default async function NewPropertyPage() {
  const adminContext = await requirePropertyCreatorAccess()
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  const admin = adminContext.admin

  const [
    citiesRes,
    universitiesRes,
    propertyAreasRes,
    brokersRes,
    ownersRes,
    ownerServiceAreasRes,
    brokerUniversitiesRes,
    amenitiesRes,
    billTypesRes,
    existingPropertiesRes,
  ] = await Promise.all([
    supabase.from('cities').select('id, name_en, name_ar').order('name_en'),

    supabase
      .from('universities')
      .select('id, city_id, name_en, name_ar')
      .order('name_en'),

    supabase
      .from('property_areas')
      .select('id, city_id, code, name_en, name_ar, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name_en', { ascending: true }),

    supabase
      .from('brokers')
      .select('id, full_name, company_name')
      .order('full_name'),

    supabase
      .from('property_owners')
      .select(
        'id, full_name, company_name, phone_number, whatsapp_number, email, tax_id, national_id, is_active'
      )
      .eq('is_active', true)
      .order('full_name'),

    supabase
      .from('property_owner_service_areas')
      .select('id, owner_id, city_id, university_id, is_active')
      .eq('is_active', true),

    supabase.from('broker_universities').select('broker_id, university_id'),

    supabase
      .from('amenities')
      .select(
        'id, name_en, name_ar, icon_key, icon_url, category_en, category_ar, sort_order, is_active'
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name_en', { ascending: true }),

    supabase
      .from('bill_types')
      .select('id, name_en, name_ar, icon_url, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name_en', { ascending: true }),

    adminSupabase
      .from('properties')
      .select(
        'id, property_id, title_en, title_ar, address_en, latitude, longitude, admin_status, is_active'
      )
      .not('latitude', 'is', null)
      .not('longitude', 'is', null),
  ])

  if (citiesRes.error) throw new Error(citiesRes.error.message)
  if (universitiesRes.error) throw new Error(universitiesRes.error.message)
  if (propertyAreasRes.error) throw new Error(propertyAreasRes.error.message)
  if (brokersRes.error) throw new Error(brokersRes.error.message)
  if (ownersRes.error) throw new Error(ownersRes.error.message)
  if (ownerServiceAreasRes.error) {
    throw new Error(ownerServiceAreasRes.error.message)
  }
  if (brokerUniversitiesRes.error) {
    throw new Error(brokerUniversitiesRes.error.message)
  }
  if (amenitiesRes.error) throw new Error(amenitiesRes.error.message)
  if (billTypesRes.error) throw new Error(billTypesRes.error.message)
  if (existingPropertiesRes.error) {
    throw new Error(existingPropertiesRes.error.message)
  }

  const existingProperties = (existingPropertiesRes.data ?? []).flatMap(
    (property) => {
      const latitude = Number(property.latitude)
      const longitude = Number(property.longitude)

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
          ...property,
          latitude,
          longitude,
        },
      ]
    }
  )

  let brokers = brokersRes.data ?? []
  let brokerUniversities = brokerUniversitiesRes.data ?? []

  if (!isSuperAdmin(admin) && admin.broker_id) {
    brokers = brokers.filter((broker) => broker.id === admin.broker_id)

    brokerUniversities = brokerUniversities.filter(
      (brokerUniversity) => brokerUniversity.broker_id === admin.broker_id
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-8 lg:px-10">
        <NewPropertyForm
          cities={citiesRes.data ?? []}
          universities={universitiesRes.data ?? []}
          propertyAreas={propertyAreasRes.data ?? []}
          brokers={brokers}
          owners={ownersRes.data ?? []}
          ownerServiceAreas={ownerServiceAreasRes.data ?? []}
          brokerUniversities={brokerUniversities}
          amenities={amenitiesRes.data ?? []}
          billTypes={billTypesRes.data ?? []}
          existingProperties={existingProperties}
        />
      </div>
    </div>
  )
}
