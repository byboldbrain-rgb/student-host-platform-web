import { createClient } from '@/src/lib/supabase/server'
import {
  requirePropertyCreatorAccess,
  isSuperAdmin,
} from '@/src/lib/admin-auth'
import NewPropertyForm from './NewPropertyForm'

export default async function NewPropertyPage() {
  const adminContext = await requirePropertyCreatorAccess()
  const supabase = await createClient()
  const admin = adminContext.admin

  const [
    citiesRes,
    universitiesRes,
    brokersRes,
    ownersRes,
    ownerServiceAreasRes,
    brokerUniversitiesRes,
    amenitiesRes,
    billTypesRes,
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
  ])

  let brokers = brokersRes.data ?? []
  let brokerUniversities = brokerUniversitiesRes.data ?? []

  if (!isSuperAdmin(admin) && admin.broker_id) {
    brokers = brokers.filter((broker) => broker.id === admin.broker_id)

    brokerUniversities = brokerUniversities.filter(
      (brokerUniversity) => brokerUniversity.broker_id === admin.broker_id
    )
  }

  if (citiesRes.error) {
    throw new Error(citiesRes.error.message)
  }

  if (universitiesRes.error) {
    throw new Error(universitiesRes.error.message)
  }

  if (brokersRes.error) {
    throw new Error(brokersRes.error.message)
  }

  if (ownersRes.error) {
    throw new Error(ownersRes.error.message)
  }

  if (ownerServiceAreasRes.error) {
    throw new Error(ownerServiceAreasRes.error.message)
  }

  if (brokerUniversitiesRes.error) {
    throw new Error(brokerUniversitiesRes.error.message)
  }

  if (amenitiesRes.error) {
    throw new Error(amenitiesRes.error.message)
  }

  if (billTypesRes.error) {
    throw new Error(billTypesRes.error.message)
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-8 lg:px-10">
        <NewPropertyForm
          cities={citiesRes.data ?? []}
          universities={universitiesRes.data ?? []}
          brokers={brokers}
          owners={ownersRes.data ?? []}
          ownerServiceAreas={ownerServiceAreasRes.data ?? []}
          brokerUniversities={brokerUniversities}
          amenities={amenitiesRes.data ?? []}
          billTypes={billTypesRes.data ?? []}
        />
      </div>
    </div>
  )
}