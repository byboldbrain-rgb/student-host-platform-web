import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { requireFoodGroceryPageAccess } from '@/src/lib/admin-auth'
import FoodProviderEditor from './FoodProviderEditor'

type FoodProvider = {
  id: number
  category_id: number | string
  city_id?: string | null
  primary_university_id?: string | null
  name_en: string
  name_ar?: string | null
  slug?: string | null
  short_description_en?: string | null
  short_description_ar?: string | null
  full_description_en?: string | null
  full_description_ar?: string | null
  phone?: string | null
  email?: string | null
  website_url?: string | null
  address_line?: string | null
  google_maps_url?: string | null
  logo_url?: string | null
  cover_image_url?: string | null
  whatsapp_number?: string | null
  whatsapp_message_template?: string | null
  is_featured?: boolean | null
  is_active?: boolean | null
  discount_percentage?: number | null
  discount_title_en?: string | null
  discount_title_ar?: string | null
  created_at?: string | null
  updated_at?: string | null
  service_categories?: {
    id?: number | string
    slug?: string | null
    name_en?: string | null
    name_ar?: string | null
  } | null
  service_provider_subcategories?: Array<{
    subcategory_id: number | string
    service_subcategories?: Array<{
      id: number | string
      category_id: number | string
      slug?: string | null
      name_en?: string | null
      name_ar?: string | null
    }> | null
  }> | null
  service_provider_universities?: Array<{
    university_id: number | string
  }> | null
}

type ServiceCategory = {
  id: number
  slug: string
  name_en: string
  name_ar?: string | null
}

type ServiceSubcategory = {
  id: number
  category_id: number
  slug: string
  name_en: string
  name_ar: string
  is_active?: boolean | null
}

type MenuCategory = {
  id: number
  restaurant_id: number
  name_en: string
  name_ar: string
  sort_order?: number | null
}

type MenuItemVariant = {
  id: number
  menu_item_id: number
  name_en: string
  name_ar?: string | null
  price?: number | null
  compare_at_price?: number | null
  sku?: string | null
  is_default?: boolean | null
  is_available?: boolean | null
  sort_order?: number | null
}

type MenuItem = {
  id: number
  restaurant_id: number
  menu_category_id: number
  name_en: string
  name_ar?: string | null
  description_en?: string | null
  description_ar?: string | null
  price?: number | null
  image_url?: string | null
  is_available?: boolean | null
  sort_order?: number | null
  restaurant_menu_item_variants?: MenuItemVariant[] | null
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

type ProviderDeliveryAreaOverride = {
  id: number
  provider_id: number
  area_id: number
  is_enabled?: boolean | null
  delivery_fee?: number | null
  estimated_delivery_minutes?: number | null
  minimum_order_amount?: number | null
}

type ProviderDeliveryArea = {
  area_id: number
  city_id: string
  code: string
  name_en: string
  name_ar: string
  sort_order?: number | null
  is_active?: boolean
  provider_area_fee_id?: number | null
  provider_is_available: boolean
  delivery_fee: number
  estimated_delivery_minutes?: number | null
  minimum_order_amount?: number | null
  default_delivery_fee: number
  default_estimated_delivery_minutes?: number | null
  default_minimum_order_amount?: number | null
  is_overridden?: boolean
}

type ServiceAsset = {
  id: number
  provider_id: number
  asset_type: string
  title?: string | null
  file_url: string
  file_mime_type?: string | null
  sort_order?: number | null
  is_active?: boolean | null
}

export default async function FoodProviderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireFoodGroceryPageAccess()

  async function handleLogout() {
    'use server'

    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/admin/login')
  }

  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('service_providers')
    .select(`
      id,
      category_id,
      city_id,
      primary_university_id,
      name_en,
      name_ar,
      slug,
      short_description_en,
      short_description_ar,
      full_description_en,
      full_description_ar,
      phone,
      email,
      website_url,
      address_line,
      google_maps_url,
      logo_url,
      cover_image_url,
      whatsapp_number,
      whatsapp_message_template,
      is_featured,
      is_active,
      discount_percentage,
      discount_title_en,
      discount_title_ar,
      created_at,
      updated_at,
      service_categories!service_providers_category_id_fkey (
        id,
        slug,
        name_en,
        name_ar
      ),
      service_provider_subcategories (
        subcategory_id,
        service_subcategories (
          id,
          category_id,
          slug,
          name_en,
          name_ar
        )
      ),
      service_provider_universities (
        university_id
      )
    `)
    .eq('id', Number(id))
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) notFound()

  const provider = data as unknown as FoodProvider

  const deliveryAreasPromise = provider.city_id
    ? supabase
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
        .eq('city_id', provider.city_id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name_en', { ascending: true })
    : Promise.resolve({ data: [], error: null })

  const providerAreaOverridesPromise = provider.city_id
    ? supabase
        .from('provider_delivery_area_overrides')
        .select(
          'id, provider_id, area_id, is_enabled, delivery_fee, estimated_delivery_minutes, minimum_order_amount'
        )
        .eq('provider_id', provider.id)
    : Promise.resolve({ data: [], error: null })

  const [
    menuCategoriesRes,
    menuItemsRes,
    deliveryAreasRes,
    providerAreaOverridesRes,
    assetsRes,
    citiesRes,
    universitiesRes,
    serviceCategoriesRes,
    serviceSubcategoriesRes,
  ] = await Promise.all([
    supabase
      .from('restaurant_menu_categories')
      .select('id, restaurant_id, name_en, name_ar, sort_order')
      .eq('restaurant_id', provider.id)
      .order('sort_order', { ascending: true }),

    supabase
      .from('restaurant_menu_items')
      .select(`
        id,
        restaurant_id,
        menu_category_id,
        name_en,
        name_ar,
        description_en,
        description_ar,
        price,
        image_url,
        is_available,
        sort_order,
        restaurant_menu_item_variants (
          id,
          menu_item_id,
          name_en,
          name_ar,
          price,
          compare_at_price,
          sku,
          is_default,
          is_available,
          sort_order
        )
      `)
      .eq('restaurant_id', provider.id)
      .order('sort_order', { ascending: true }),

    deliveryAreasPromise,
    providerAreaOverridesPromise,

    supabase
      .from('service_provider_assets')
      .select(
        'id, provider_id, asset_type, title, file_url, file_mime_type, sort_order, is_active'
      )
      .eq('provider_id', provider.id)
      .order('sort_order', { ascending: true }),

    supabase
      .from('cities')
      .select('id, name_en, name_ar')
      .order('name_en', { ascending: true }),

    supabase
      .from('universities')
      .select('id, name_en, name_ar')
      .order('name_en', { ascending: true }),

    supabase
      .from('service_categories')
      .select('id, slug, name_en, name_ar')
      .order('sort_order', { ascending: true }),

    supabase
      .from('service_subcategories')
      .select('id, category_id, slug, name_en, name_ar, is_active')
      .order('sort_order', { ascending: true }),
  ])

  if (menuCategoriesRes.error) throw new Error(menuCategoriesRes.error.message)
  if (menuItemsRes.error) throw new Error(menuItemsRes.error.message)
  if ('error' in deliveryAreasRes && deliveryAreasRes.error) {
    throw new Error(deliveryAreasRes.error.message)
  }
  if ('error' in providerAreaOverridesRes && providerAreaOverridesRes.error) {
    throw new Error(providerAreaOverridesRes.error.message)
  }
  if (assetsRes.error) throw new Error(assetsRes.error.message)
  if (citiesRes.error) throw new Error(citiesRes.error.message)
  if (universitiesRes.error) throw new Error(universitiesRes.error.message)
  if (serviceCategoriesRes.error) throw new Error(serviceCategoriesRes.error.message)
  if (serviceSubcategoriesRes.error) throw new Error(serviceSubcategoriesRes.error.message)

  const normalizedMenuItems = ((menuItemsRes.data || []) as MenuItem[]).map((item) => ({
    ...item,
    restaurant_menu_item_variants: (item.restaurant_menu_item_variants || []).sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
    ),
  }))

  const cityAreas = (deliveryAreasRes.data || []) as CityDeliveryArea[]
  const providerAreaOverrides =
    (providerAreaOverridesRes.data || []) as ProviderDeliveryAreaOverride[]

  const overridesMap = new Map<number, ProviderDeliveryAreaOverride>()
  for (const override of providerAreaOverrides) {
    overridesMap.set(Number(override.area_id), override)
  }

  const normalizedDeliveryAreas: ProviderDeliveryArea[] = cityAreas.map((area) => {
    const override = overridesMap.get(Number(area.id))

    const defaultDeliveryFee = Number(area.default_delivery_fee ?? 0)
    const defaultEstimatedDeliveryMinutes =
      area.default_estimated_delivery_minutes ?? null
    const defaultMinimumOrderAmount =
      area.default_minimum_order_amount != null
        ? Number(area.default_minimum_order_amount)
        : null

    const deliveryFee =
      override?.delivery_fee != null
        ? Number(override.delivery_fee)
        : defaultDeliveryFee

    const estimatedDeliveryMinutes =
      override?.estimated_delivery_minutes != null
        ? override.estimated_delivery_minutes
        : defaultEstimatedDeliveryMinutes

    const minimumOrderAmount =
      override?.minimum_order_amount != null
        ? Number(override.minimum_order_amount)
        : defaultMinimumOrderAmount

    return {
      area_id: Number(area.id),
      city_id: String(area.city_id),
      code: area.code,
      name_en: area.name_en,
      name_ar: area.name_ar,
      sort_order: area.sort_order ?? 0,
      is_active: area.is_active !== false,
      provider_area_fee_id: override?.id ?? null,
      provider_is_available: override?.is_enabled ?? true,
      delivery_fee: deliveryFee,
      estimated_delivery_minutes: estimatedDeliveryMinutes,
      minimum_order_amount: minimumOrderAmount,
      default_delivery_fee: defaultDeliveryFee,
      default_estimated_delivery_minutes: defaultEstimatedDeliveryMinutes,
      default_minimum_order_amount: defaultMinimumOrderAmount,
      is_overridden: !!override,
    }
  })

  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <div className="mx-auto max-w-[1440px] px-4 py-5 md:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-end">
          <form action={handleLogout}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-[#fda29b] bg-white px-4 py-2 text-sm font-medium text-[#b42318] transition hover:border-[#f97066] hover:bg-[#fff5f5]"
            >
              <span>↪</span>
              <span>Logout</span>
            </button>
          </form>
        </div>

        <FoodProviderEditor
          provider={provider}
          menuCategories={(menuCategoriesRes.data || []) as MenuCategory[]}
          menuItems={normalizedMenuItems}
          deliveryAreas={normalizedDeliveryAreas}
          assets={(assetsRes.data || []) as ServiceAsset[]}
          cities={citiesRes.data || []}
          universities={universitiesRes.data || []}
          serviceCategories={(serviceCategoriesRes.data || []) as ServiceCategory[]}
          serviceSubcategories={(serviceSubcategoriesRes.data || []) as ServiceSubcategory[]}
        />
      </div>
    </main>
  )
}
