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
    brokerUniversitiesRes,
    amenitiesRes,
    facilitiesRes,
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
      .from('broker_universities')
      .select('broker_id, university_id'),
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
  ])

  let brokers = brokersRes.data ?? []
  let brokerUniversities = brokerUniversitiesRes.data ?? []

  // لو الحساب مربوط بـ broker واحد فقط نقيّد الاختيارات عليه
  // أما لو admin.broker_id = null فنعرض كل الـ brokers بشكل طبيعي
  if (!isSuperAdmin(admin) && admin.broker_id) {
    brokers = brokers.filter((b) => b.id === admin.broker_id)

    brokerUniversities = brokerUniversities.filter(
      (bu) => bu.broker_id === admin.broker_id
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-8 lg:px-10">
        <NewPropertyForm
          cities={citiesRes.data ?? []}
          universities={universitiesRes.data ?? []}
          brokers={brokers}
          brokerUniversities={brokerUniversities}
          amenities={amenitiesRes.data ?? []}
          facilities={facilitiesRes.data ?? []}
          billTypes={billTypesRes.data ?? []}
        />
      </div>
    </div>
  )
}