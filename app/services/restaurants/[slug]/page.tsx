import Link from 'next/link'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '../../../../src/lib/supabase/server'
import RestaurantDetailsClient from './RestaurantDetailsClient'
import LanguageDropdown from '../../LanguageDropdown'

type SearchParams = {
  lang?: string
  currency?: string
  city_id?: string
  university_id?: string
  category_id?: string
  page?: string
}

type SupportedLanguage = 'en' | 'ar'
type SupportedCurrency =
  | 'EGP'
  | 'USD'
  | 'EUR'
  | 'BHD'
  | 'DZD'
  | 'IQD'
  | 'JOD'
  | 'KWD'
  | 'LBP'
  | 'LYD'
  | 'MAD'
  | 'OMR'
  | 'QAR'
  | 'SAR'
  | 'TND'

type ServiceAsset = {
  file_url?: string | null
  asset_type?: string | null
  sort_order?: number | null
}

type ProviderBusinessHour = {
  day_of_week: number
  is_open: boolean
  open_time?: string | null
  close_time?: string | null
}

type Restaurant = {
  id: string | number
  category_id: string | number
  city_id?: string | null
  primary_university_id?: string | null
  name_en: string
  name_ar?: string | null
  slug?: string | null
  short_description_en?: string | null
  short_description_ar?: string | null
  logo_url?: string | null
  cover_image_url?: string | null
  is_featured?: boolean | null
  is_active?: boolean | null
  discount_percentage?: number | null
  discount_title_en?: string | null
  discount_title_ar?: string | null
  is_manually_closed?: boolean | null
  manual_closed_note?: string | null
  provider_business_hours?: ProviderBusinessHour[] | null
  service_provider_assets?: ServiceAsset[] | null
}

type MenuCategory = {
  id: string | number
  restaurant_id: string | number
  name_en: string
  name_ar: string
  sort_order?: number | null
}

type MenuItemVariant = {
  id: string | number
  menu_item_id: string | number
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
  id: string | number
  restaurant_id: string | number
  menu_category_id: string | number
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

type DeliveryZone = {
  id: string | number
  restaurant_id: string | number
  area_name: string
  area_name_ar?: string | null
  delivery_fee: number
}

const TRANSLATIONS = {
  en: {
    back: 'Back',
    menu: 'Menu',
    unavailable: 'Unavailable',
    add: 'Add',
    noMenu: 'No menu items available yet.',
    deliveryTime: 'Delivery time',
    minimumOrder: 'Minimum order',
    deliveryFee: 'Delivery fee',
    openNow: 'Open now',
    closedNow: 'Closed now',
    featured: 'Featured',
    searchInMenu: 'Search in menu',
    reviews: 'Reviews',
    mostSelling: 'Most Selling',
    currency: 'EGP',
    viewCart: 'View cart',
    items: 'items',
    orderNow: 'Order now',
    freeDelivery: 'Free delivery',
    deliveredBy: 'Delivered by',
    home: 'Home',
    all: 'All',
    categories: 'Categories',
    showMore: 'Show More',
    save: 'Save',
    language: 'AR',
    homes: 'Homes',
    services: 'Services',
    career: 'Career',
    pricesIncludeFees: 'Prices include all fees',
    english: 'English',
    arabic: 'العربية',
    customerInfo: 'Customer Information',
    fullName: 'Full Name',
    phone: 'Phone Number',
    address: 'Address',
    area: 'Area',
    chooseArea: 'Choose your area',
    cartSummary: 'Cart Summary',
    subtotal: 'Subtotal',
    total: 'Total',
    quantity: 'Quantity',
    emptyCart: 'Your cart is empty',
    placeOrder: 'Place Order',
    orderPlaced: 'Order placed successfully',
    requiredFields: 'Please fill all required fields',
    lost: 'Lost',
    marketplace: 'MarketPlace',
    languageLabel: 'Language',
    sizes: 'Sizes',
    chooseSize: 'Choose size',
    selectedSize: 'Selected size',
    additionalNotes: 'Additional notes',
    loading: 'Loading...',
    basePrice: 'Starting from',
  },
  ar: {
    back: 'رجوع',
    menu: 'المنيو',
    unavailable: 'غير متاح',
    add: 'إضافة',
    noMenu: 'لا توجد عناصر متاحة في المنيو حالياً.',
    deliveryTime: 'وقت التوصيل',
    minimumOrder: 'الحد الأدنى',
    deliveryFee: 'رسوم التوصيل',
    openNow: 'مفتوح الآن',
    closedNow: 'مغلق الآن',
    featured: 'مميز',
    searchInMenu: 'ابحث في المنيو',
    reviews: 'التقييمات',
    mostSelling: 'الأكثر مبيعاً',
    currency: 'ج.م',
    viewCart: 'عرض السلة',
    items: 'عناصر',
    orderNow: 'اطلب الآن',
    freeDelivery: 'توصيل مجاني',
    deliveredBy: 'التوصيل بواسطة',
    home: 'الرئيسية',
    all: 'الكل',
    categories: 'التصنيفات',
    showMore: 'عرض المزيد',
    save: 'وفّر',
    language: 'AR',
    homes: 'المنازل',
    services: 'الخدمات',
    career: 'الوظائف',
    pricesIncludeFees: 'الأسعار تشمل جميع الرسوم',
    english: 'English',
    arabic: 'العربية',
    customerInfo: 'بيانات العميل',
    fullName: 'الاسم بالكامل',
    phone: 'رقم التليفون',
    address: 'العنوان',
    area: 'المنطقة',
    chooseArea: 'اختر منطقتك',
    cartSummary: 'ملخص السلة',
    subtotal: 'الإجمالي الفرعي',
    total: 'الإجمالي النهائي',
    quantity: 'الكمية',
    emptyCart: 'السلة فارغة',
    placeOrder: 'تأكيد الطلب',
    orderPlaced: 'تم إرسال الطلب بنجاح',
    requiredFields: 'من فضلك املأ كل البيانات المطلوبة',
    lost: 'المفقودات',
    marketplace: 'المتجر',
    languageLabel: 'اللغة',
    sizes: 'الأحجام',
    chooseSize: 'اختر الحجم',
    selectedSize: 'الحجم المختار',
    additionalNotes: 'ملاحظات إضافية للمطعم',
    loading: 'جاري التحميل...',
    basePrice: 'يبدأ من',
  },
} as const

function normalizeLanguage(value?: string): SupportedLanguage {
  return value === 'ar' ? 'ar' : 'en'
}

function normalizeCurrency(value?: string): SupportedCurrency {
  const supported = [
    'EGP',
    'USD',
    'EUR',
    'BHD',
    'DZD',
    'IQD',
    'JOD',
    'KWD',
    'LBP',
    'LYD',
    'MAD',
    'OMR',
    'QAR',
    'SAR',
    'TND',
  ] as const

  const upper = value?.toUpperCase()
  return supported.includes(upper as SupportedCurrency)
    ? (upper as SupportedCurrency)
    : 'EGP'
}

function HomeNavIcon({ className = '' }: { className?: string }) {
  return (
    <img
      src="https://i.ibb.co/vCgqsdFp/home.png"
      alt="Home"
      className={`object-contain ${className}`}
    />
  )
}

function ServicesNavIcon({ className = '' }: { className?: string }) {
  return (
    <img
      src="https://i.ibb.co/vvg4L37Z/settings.png"
      alt="Services"
      className={`object-contain ${className}`}
    />
  )
}

function CareerNavIcon({ className = '' }: { className?: string }) {
  return (
    <img
      src="https://i.ibb.co/kV4SdYVK/business.png"
      alt="Career"
      className={`object-contain ${className}`}
    />
  )
}

function MarketPlaceNavIcon({ className = '' }: { className?: string }) {
  return (
    <img
      src="https://i.ibb.co/4ZG5y0SG/store.png"
      alt="MarketPlace"
      className={`object-contain ${className}`}
    />
  )
}

function LostNavIcon({ className = '' }: { className?: string }) {
  return (
    <img
      src="https://i.ibb.co/xKksFJD1/left-1.png"
      alt="Lost"
      className={`object-contain ${className}`}
    />
  )
}

export default async function RestaurantDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<SearchParams>
}) {
  const { slug } = await params
  const { lang, currency, city_id, university_id, category_id, page } =
    await searchParams

  const selectedLanguage = normalizeLanguage(lang)
  const selectedCurrency = normalizeCurrency(currency)
  const isArabic = selectedLanguage === 'ar'
  const t = TRANSLATIONS[selectedLanguage]
  const supabase = await createClient()

  const restaurantSelect = `
    id,
    category_id,
    city_id,
    primary_university_id,
    name_en,
    name_ar,
    slug,
    short_description_en,
    short_description_ar,
    logo_url,
    cover_image_url,
    is_featured,
    is_active,
    discount_percentage,
    discount_title_en,
    discount_title_ar,
    is_manually_closed,
    manual_closed_note,
    provider_business_hours(day_of_week, is_open, open_time, close_time),
    service_provider_assets(file_url, asset_type, sort_order)
  `

  const { data: restaurantBySlug } = await supabase
    .from('service_providers')
    .select(restaurantSelect)
    .eq('is_active', true)
    .eq('slug', slug)
    .limit(1)
    .maybeSingle()

  let restaurant = restaurantBySlug

  if (!restaurant && /^\d+$/.test(slug)) {
    const { data: restaurantById } = await supabase
      .from('service_providers')
      .select(restaurantSelect)
      .eq('is_active', true)
      .eq('id', Number(slug))
      .limit(1)
      .maybeSingle()

    restaurant = restaurantById
  }

  if (!restaurant) notFound()

  const { data: menuCategories } = await supabase
    .from('restaurant_menu_categories')
    .select('id, restaurant_id, name_en, name_ar, sort_order')
    .eq('restaurant_id', restaurant.id)
    .order('sort_order', { ascending: true })

  const { data: menuItems } = await supabase
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
    .eq('restaurant_id', restaurant.id)
    .order('sort_order', { ascending: true })

  const normalizedMenuItems =
    (menuItems as MenuItem[] | null)?.map((item) => ({
      ...item,
      restaurant_menu_item_variants: (
        item.restaurant_menu_item_variants ?? []
      ).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    })) ?? []

  const restaurantCityId = restaurant.city_id ? String(restaurant.city_id) : null
  const restaurantId = Number(restaurant.id)

  const [cityAreasRes, providerOverridesRes] = await Promise.all([
    restaurantCityId
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
          .eq('city_id', restaurantCityId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('name_en', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    Number.isFinite(restaurantId)
      ? supabase
          .from('provider_delivery_area_overrides')
          .select(`
            id,
            provider_id,
            area_id,
            is_enabled,
            delivery_fee,
            estimated_delivery_minutes,
            minimum_order_amount
          `)
          .eq('provider_id', restaurantId)
      : Promise.resolve({ data: [], error: null }),
  ])

  if ('error' in cityAreasRes && cityAreasRes.error) {
    throw new Error(cityAreasRes.error.message)
  }

  if ('error' in providerOverridesRes && providerOverridesRes.error) {
    throw new Error(providerOverridesRes.error.message)
  }

  const cityAreas = (cityAreasRes.data || []) as CityDeliveryArea[]
  const providerOverrides =
    (providerOverridesRes.data || []) as ProviderDeliveryAreaOverride[]

  const overridesMap = new Map<number, ProviderDeliveryAreaOverride>()
  for (const override of providerOverrides) {
    overridesMap.set(Number(override.area_id), override)
  }

  const deliveryZones: DeliveryZone[] = cityAreas
    .map((area) => {
      const override = overridesMap.get(Number(area.id))
      const isEnabled = override?.is_enabled ?? true

      if (!isEnabled) {
        return null
      }

      const deliveryFee =
        override?.delivery_fee != null
          ? Number(override.delivery_fee)
          : Number(area.default_delivery_fee ?? 0)

      return {
        id: override?.id ?? area.id,
        restaurant_id: restaurant.id,
        area_name: area.name_en,
        area_name_ar: area.name_ar ?? null,
        delivery_fee: deliveryFee,
      }
    })
    .filter(Boolean)
    .sort((a, b) => Number(a!.delivery_fee) - Number(b!.delivery_fee)) as DeliveryZone[]

  const buildSimpleNavLink = (path: string) => {
    const params = new URLSearchParams()
    params.set('lang', selectedLanguage)
    params.set('currency', selectedCurrency)
    return `${path}?${params.toString()}`
  }

  const buildServicesHomeLink = () => {
    const params = new URLSearchParams()
    params.set('lang', selectedLanguage)
    params.set('currency', selectedCurrency)
    if (city_id) params.set('city_id', city_id)
    if (university_id) params.set('university_id', university_id)
    if (category_id) params.set('category_id', category_id)
    return `/services?${params.toString()}`
  }

  const menuButtonClass =
    'flex h-12 min-w-12 items-center justify-center rounded-full border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 shadow-sm transition hover:border-black'

  const menuPanelClass = isArabic
    ? 'absolute left-0 top-[calc(100%+10px)] z-40 min-w-[240px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]'
    : 'absolute right-0 top-[calc(100%+10px)] z-40 min-w-[240px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]'

  const menuLinkClass =
    'block px-4 py-3 text-sm text-gray-800 transition hover:bg-gray-50'

  const renderTopNavItem = ({
    href,
    label,
    icon,
    isActive = false,
    isMobile = false,
  }: {
    href: string
    label: string
    icon: ReactNode
    isActive?: boolean
    isMobile?: boolean
  }) => (
    <Link
      href={href}
      className={`group relative flex items-center transition shrink-0 ${
        isMobile
          ? 'flex-col items-center justify-start px-2 py-1 min-w-[58px]'
          : 'flex-row gap-2 px-3 pt-2 pb-1'
      } ${
        isActive ? 'text-[#222222]' : 'text-[#6A6A6A] hover:text-[#222222]'
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center ${
          isMobile ? 'mb-1.5' : ''
        }`}
      >
        {icon}
      </span>

      <span
        className={`font-sans font-semibold tracking-tight leading-none ${
          isActive ? 'text-[#222222]' : 'text-inherit'
        } ${isMobile ? 'text-[14px]' : 'text-[18px]'}`}
      >
        {label}
      </span>

      {!isMobile && isActive && (
        <div className="absolute -bottom-[8px] left-0 right-0 h-[3px] bg-[#222222] rounded-full" />
      )}

      {isMobile && isActive && (
        <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-black w-full" />
      )}
    </Link>
  )

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="relative min-h-screen bg-white pb-20 text-gray-700 md:pb-0"
    >
      <header className="border-b border-gray-200 bg-white md:bg-[#f7f7f7] sticky top-0 md:static z-40 shadow-sm md:shadow-none">
        <div className="md:hidden w-full bg-white pb-1">
          <div className="flex items-start justify-center gap-4 px-3 pt-1 pb-2">
            {renderTopNavItem({
              href: buildSimpleNavLink('/properties'),
              label: t.homes,
              icon: <HomeNavIcon className="h-[40px] w-[40px]" />,
              isMobile: true,
            })}

            {renderTopNavItem({
              href: buildServicesHomeLink(),
              label: t.services,
              icon: <ServicesNavIcon className="h-[40px] w-[40px]" />,
              isActive: true,
              isMobile: true,
            })}

            {renderTopNavItem({
              href: buildSimpleNavLink('/career'),
              label: t.career,
              icon: <CareerNavIcon className="h-[40px] w-[40px]" />,
              isMobile: true,
            })}

            {renderTopNavItem({
              href: buildSimpleNavLink('/marketplace'),
              label: t.marketplace,
              icon: <MarketPlaceNavIcon className="h-[40px] w-[40px]" />,
              isMobile: true,
            })}

            {renderTopNavItem({
              href: buildSimpleNavLink('/lost'),
              label: t.lost,
              icon: <LostNavIcon className="h-[40px] w-[40px]" />,
              isMobile: true,
            })}
          </div>
        </div>

        <div className="hidden md:block mx-auto max-w-[1920px] px-6">
          <div className="flex items-center justify-between pt-0 pb-4">
            <div className="flex items-center">
              <Link
                href={buildSimpleNavLink('/properties')}
                className="flex items-center gap-2"
              >
                <img
                  src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
                  alt="Logo"
                  style={{
                    width: '140px',
                    height: 'auto',
                    marginTop: '-15px',
                    display: 'block',
                  }}
                />
              </Link>
            </div>

            <div className="flex items-center justify-center gap-5 xl:gap-8">
              {renderTopNavItem({
                href: buildSimpleNavLink('/properties'),
                label: t.homes,
                icon: <HomeNavIcon className="h-[40px] w-[40px]" />,
              })}

              {renderTopNavItem({
                href: buildServicesHomeLink(),
                label: t.services,
                icon: <ServicesNavIcon className="h-[40px] w-[40px]" />,
                isActive: true,
              })}

              {renderTopNavItem({
                href: buildSimpleNavLink('/career'),
                label: t.career,
                icon: <CareerNavIcon className="h-[40px] w-[40px]" />,
              })}

              {renderTopNavItem({
                href: buildSimpleNavLink('/marketplace'),
                label: t.marketplace,
                icon: <MarketPlaceNavIcon className="h-[40px] w-[40px]" />,
              })}

              {renderTopNavItem({
                href: buildSimpleNavLink('/lost'),
                label: t.lost,
                icon: <LostNavIcon className="h-[40px] w-[40px]" />,
              })}
            </div>

            <div className="flex items-center gap-3">
              <LanguageDropdown
                selectedLanguage={selectedLanguage}
                menuButtonClass={menuButtonClass}
                menuPanelClass={menuPanelClass}
                menuLinkClass={menuLinkClass}
                translations={TRANSLATIONS}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="relative">
        <RestaurantDetailsClient
          restaurant={restaurant as Restaurant}
          menuCategories={(menuCategories as MenuCategory[]) ?? []}
          menuItems={normalizedMenuItems}
          deliveryZones={deliveryZones}
          selectedLanguage={selectedLanguage}
          selectedCurrency={selectedCurrency}
          searchState={{
            city_id,
            university_id,
            category_id,
            page,
          }}
          translations={TRANSLATIONS}
        />
      </div>

      <footer className="mt-8 bg-gray-100 py-6">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4">
          <p className="text-sm text-gray-600">© 2026 Navienty, Inc.</p>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <a
              href="https://www.facebook.com/yourPage"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                className="h-6 w-6 text-blue-600"
              >
                <path d="M576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 440 146.7 540.8 258.2 568.5L258.2 398.2L205.4 398.2L205.4 320L258.2 320L258.2 286.3C258.2 199.2 297.6 158.8 383.2 158.8C399.4 158.8 427.4 162 438.9 165.2L438.9 236C432.9 235.4 422.4 235 409.3 235C367.3 235 351.1 250.9 351.1 292.2L351.1 320L434.7 320L420.3 398.2L351 398.2L351 574.1C477.8 558.8 576 450.9 576 320z" />
              </svg>
            </a>

            <a
              href="https://www.instagram.com/yourPage"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                className="h-6 w-6 text-purple-600"
              >
                <path d="M320.3 205C256.8 204.8 205.2 256.2 205 319.7C204.8 383.2 256.2 434.8 319.7 435C383.2 435.2 434.8 383.8 435 320.3C435.2 256.8 383.8 205.2 320.3 205zM319.7 245.4C360.9 245.2 394.4 278.5 394.6 319.7C394.8 360.9 361.5 394.4 320.3 394.6C279.1 394.8 245.6 361.5 245.4 320.3C245.2 279.1 278.5 245.6 319.7 245.4zM413.1 200.3C413.1 185.5 425.1 173.5 439.9 173.5C454.7 173.5 466.7 185.5 466.7 200.3C466.7 215.1 454.7 227.1 439.9 227.1C425.1 227.1 413.1 215.1 413.1 200.3zM542.8 227.5C541.1 191.6 532.9 159.8 506.6 133.6C480.4 107.4 448.6 99.2 412.7 97.4C375.7 95.3 264.8 95.3 227.8 97.4C192 99.1 160.2 107.3 133.9 133.5C107.6 159.7 99.5 191.5 97.7 227.4C95.6 264.4 95.6 375.3 97.7 412.3C99.4 448.2 107.6 480 133.9 506.2C160.2 532.4 191.9 540.6 227.8 542.4C264.8 544.5 375.7 544.5 412.7 542.4C448.6 540.7 480.4 532.5 506.6 506.2C532.8 480 541 448.2 542.8 412.3C544.9 375.3 544.9 264.5 542.8 227.5zM495 452C487.2 471.6 472.1 486.7 452.4 494.6C422.9 506.3 352.9 503.6 320.3 503.6C287.7 503.6 217.6 506.2 188.2 494.6C168.6 486.8 153.5 471.7 145.6 452C133.9 422.5 136.6 352.5 136.6 319.9C136.6 287.3 134 217.2 145.6 187.8C153.4 168.2 168.5 153.1 188.2 145.2C217.7 133.5 287.7 136.2 320.3 136.2C352.9 136.2 423 133.6 452.4 145.2C472 153 487.1 168.1 495 187.8C506.7 217.3 504 287.3 504 319.9C504 352.5 506.7 422.6 495 452z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}