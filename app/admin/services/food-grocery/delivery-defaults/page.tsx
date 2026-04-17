import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import { requireFoodGroceryPageAccess } from '@/src/lib/admin-auth'
import DeliveryDefaultsManager from './DeliveryDefaultsManager'

type City = {
  id: string
  name_en: string | null
  name_ar?: string | null
}

type CityDeliveryArea = {
  id: number
  city_id: string
  code: string
  name_en: string
  name_ar: string
  sort_order?: number | null
  is_active?: boolean | null
  default_delivery_fee: number
  default_estimated_delivery_minutes?: number | null
  default_minimum_order_amount?: number | null
}

export default async function DeliveryDefaultsPage() {
  await requireFoodGroceryPageAccess()
  const supabase = await createClient()

  const [citiesRes, areasRes] = await Promise.all([
    supabase.from('cities').select('id, name_en, name_ar').order('name_en', { ascending: true }),
    supabase
      .from('city_delivery_areas')
      .select(`
        id,
        city_id,
        code,
        name_en,
        name_ar,
        sort_order,
        is_active,
        default_delivery_fee,
        default_estimated_delivery_minutes,
        default_minimum_order_amount
      `)
      .order('sort_order', { ascending: true }),
  ])

  if (citiesRes.error) throw new Error(citiesRes.error.message)
  if (areasRes.error) throw new Error(areasRes.error.message)

  return (
    <main className="min-h-screen bg-[#fbfbfb]">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/admin/services/food-grocery"
              className="inline-flex items-center gap-2 rounded-[16px] border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-[#fafafa]"
            >
              <span>←</span>
              <span>Back to Food & Grocery</span>
            </Link>

            <h1 className="mt-4 text-[32px] font-semibold tracking-tight text-[#222222]">
              Cities & Delivery Defaults
            </h1>
            
          </div>
        </div>

        <DeliveryDefaultsManager
          initialCities={(citiesRes.data || []) as City[]}
          initialAreas={(areasRes.data || []) as CityDeliveryArea[]}
        />
      </div>
    </main>
  )
}