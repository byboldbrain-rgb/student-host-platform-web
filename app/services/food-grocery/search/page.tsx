import Link from 'next/link'
import type { ReactNode } from 'react'
import { createClient } from '../../../../src/lib/supabase/server'
import LanguageDropdown from '../../LanguageDropdown'

type SearchParams = {
  lang?: string
  currency?: string
  city_id?: string
  university_id?: string
  subcategory_id?: string
  q?: string
}

type City = {
  id: string | number
  name_en: string
  name_ar: string
}

type University = {
  id: string | number
  name_en: string
  name_ar: string
  city_id: string | number
}

type ServiceCategory = {
  id: string | number
  slug: string
  name_en: string
  name_ar: string
  icon?: string | null
  sort_order?: number | null
  is_active?: boolean | null
}

type ServiceSubcategory = {
  id: string | number
  category_id: string | number
  slug: string
  name_en: string
  name_ar: string
  icon?: string | null
  sort_order?: number | null
  is_active?: boolean | null
}

type ServiceAsset = {
  file_url?: string | null
  asset_type?: string | null
  sort_order?: number | null
}

type ServiceProviderUniversity = {
  university_id: string | number
}

type ServiceProviderSubcategoryRelation = {
  subcategory_id: string | number
}

type ProviderBusinessHour = {
  day_of_week: number
  is_open: boolean
  open_time?: string | null
  close_time?: string | null
}

type ServiceProvider = {
  id: string | number
  category_id: string | number
  city_id?: string | null
  primary_university_id?: string | null
  name_en: string
  name_ar?: string | null
  slug?: string | null
  logo_url?: string | null
  cover_image_url?: string | null
  whatsapp_number?: string | null
  whatsapp_message_template?: string | null
  is_featured?: boolean | null
  is_active?: boolean | null
  discount_percentage?: number | null
  is_manually_closed?: boolean | null
  manual_closed_note?: string | null
  service_provider_assets?: ServiceAsset[] | null
  service_provider_universities?: ServiceProviderUniversity[] | null
  service_provider_subcategories?: ServiceProviderSubcategoryRelation[] | null
  provider_business_hours?: ProviderBusinessHour[] | null
}

const SUPPORTED_CURRENCIES = [
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

type SupportedLanguage = 'en' | 'ar'
type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

const TRANSLATIONS = {
  en: {
    homes: 'Homes',
    services: 'Services',
    career: 'Career',
    lost: 'Lost',
    marketplace: 'MarketPlace',
    language: 'Language',
    currency: 'Currency',
    english: 'English',
    arabic: 'العربية',
    startSearch: 'Start your search',
    foodSearchHint: 'Choose city and university to browse food & grocery services.',
    noServices: 'No food & grocery services matched your search.',
    availableNow: 'Available now',
    closedNow: 'Closed now',
    temporarilyClosed: 'Temporarily closed',
    upTo: 'Up to',
    off: 'OFF',
    browseSubcategories: 'Browse subcategories',
    allResults: 'Food & Grocery results',
    selectedSubcategory: 'Selected subcategory',
    city: 'City',
    university: 'University',
    selectCity: 'Select city',
    selectUniversity: 'Select university',
    anyCity: 'Any city',
    anyUniversity: 'Any university',
    search: 'Search',
  },
  ar: {
    homes: 'المنازل',
    services: 'الخدمات',
    career: 'الوظائف',
    lost: 'المفقودات',
    marketplace: 'المتجر',
    language: 'اللغة',
    currency: 'العملة',
    english: 'English',
    arabic: 'العربية',
    startSearch: 'ابدأ بحثك',
    foodSearchHint: 'اختر المدينة والجامعة لتصفح خدمات الطعام والبقالة.',
    noServices: 'لا توجد خدمات طعام وبقالة مطابقة لبحثك.',
    availableNow: 'متاح الآن',
    closedNow: 'مغلق الآن',
    temporarilyClosed: 'مغلق مؤقتًا',
    upTo: 'حتى',
    off: 'خصم',
    browseSubcategories: 'تصفح التصنيفات الفرعية',
    allResults: 'نتائج الطعام والبقالة',
    selectedSubcategory: 'التصنيف الفرعي المختار',
    city: 'المدينة',
    university: 'الجامعة',
    selectCity: 'اختر المدينة',
    selectUniversity: 'اختر الجامعة',
    anyCity: 'أي مدينة',
    anyUniversity: 'أي جامعة',
    search: 'بحث',
  },
} as const

const SUBCATEGORY_ICON_MAP = [
  { keywords: ['pizza', 'بيتزا'], url: 'https://i.ibb.co/tMX3tD2Z/Untitled-design-6.png' },
  { keywords: ['grill', 'grills', 'مشويات'], url: 'https://i.ibb.co/QjrmYY3z/Untitled-design-11.png' },
  { keywords: ['fried chicken', 'fried-chicken', 'دجاج مقلي', 'فرايد'], url: 'https://i.ibb.co/FqVZXnsC/Untitled-design-7.png' },
  { keywords: ['dessert', 'desserts', 'sweet', 'sweets', 'حلويات', 'ديسرت'], url: 'https://i.ibb.co/6cHM7Zb8/5.png' },
  { keywords: ['koshary', 'كشري'], url: 'https://i.ibb.co/WWdm0pvc/Untitled-design-8.png' },
  { keywords: ['bakery', 'baked', 'مخبوزات', 'مخبز'], url: 'https://i.ibb.co/3YyVD8wz/Untitled-design-9.png' },
  { keywords: ['breakfast', 'فطار', 'إفطار', 'افطار'], url: 'https://i.ibb.co/6JZk3VpY/Untitled-design-10.png' },
  { keywords: ['syrian', 'سوري', 'شامي', 'shawarma', 'شاورما'], url: 'https://i.ibb.co/wZqsBVPF/Untitled-design-12.png' },
  {
    keywords: ['grocery', 'groceries', 'market', 'supermarket', 'بقالة', 'ماركت', 'سوبر ماركت'],
    url: 'https://i.ibb.co/d46SrHjx/Untitled-design-3.png',
  },
] as const

function normalizeLanguage(value?: string): SupportedLanguage {
  return value === 'ar' ? 'ar' : 'en'
}

function normalizeCurrency(value?: string): SupportedCurrency {
  const upper = value?.toUpperCase()
  return SUPPORTED_CURRENCIES.includes(upper as SupportedCurrency)
    ? (upper as SupportedCurrency)
    : 'EGP'
}

function getCairoNowDate() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(new Date())
  const get = (type: string) => parts.find((part) => part.type === type)?.value || ''

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  return {
    dayOfWeek: weekdayMap[get('weekday')] ?? 0,
    hour: Number(get('hour') || '0'),
    minute: Number(get('minute') || '0'),
  }
}

function timeToMinutes(time?: string | null) {
  if (!time || !time.includes(':')) return null

  const [hours, minutes] = time.split(':')
  const h = Number(hours)
  const m = Number(minutes)

  if (Number.isNaN(h) || Number.isNaN(m)) return null

  return h * 60 + m
}

function isProviderClosedNow(provider: ServiceProvider) {
  if (provider.is_manually_closed) {
    return true
  }

  const businessHours = Array.isArray(provider.provider_business_hours)
    ? provider.provider_business_hours
    : []

  if (businessHours.length === 0) {
    return false
  }

  const now = getCairoNowDate()
  const currentMinutes = now.hour * 60 + now.minute
  const todayRow = businessHours.find(
    (row) => Number(row.day_of_week) === Number(now.dayOfWeek)
  )

  if (!todayRow) {
    return true
  }

  if (!todayRow.is_open) {
    return true
  }

  const openMinutes = timeToMinutes(todayRow.open_time)
  const closeMinutes = timeToMinutes(todayRow.close_time)

  if (openMinutes == null || closeMinutes == null) {
    return true
  }

  if (openMinutes === closeMinutes) {
    return false
  }

  if (closeMinutes > openMinutes) {
    return !(currentMinutes >= openMinutes && currentMinutes < closeMinutes)
  }

  return !(currentMinutes >= openMinutes || currentMinutes < closeMinutes)
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

function dedupeProvidersById(providers: ServiceProvider[]): ServiceProvider[] {
  const map = new Map<string, ServiceProvider>()

  for (const provider of providers) {
    const key = String(provider.id)

    if (!map.has(key)) {
      map.set(key, {
        ...provider,
        service_provider_assets: provider.service_provider_assets ?? [],
        service_provider_universities: provider.service_provider_universities ?? [],
        service_provider_subcategories: provider.service_provider_subcategories ?? [],
        provider_business_hours: provider.provider_business_hours ?? [],
      })
      continue
    }

    const existing = map.get(key)!

    const mergedAssets = [
      ...(existing.service_provider_assets ?? []),
      ...(provider.service_provider_assets ?? []),
    ]

    const mergedUniversities = [
      ...(existing.service_provider_universities ?? []),
      ...(provider.service_provider_universities ?? []),
    ]

    const mergedSubcategories = [
      ...(existing.service_provider_subcategories ?? []),
      ...(provider.service_provider_subcategories ?? []),
    ]

    const mergedBusinessHours = [
      ...(existing.provider_business_hours ?? []),
      ...(provider.provider_business_hours ?? []),
    ]

    const uniqueAssets = Array.from(
      new Map(
        mergedAssets.map((asset, index) => [
          `${asset.file_url ?? ''}-${asset.asset_type ?? ''}-${asset.sort_order ?? index}`,
          asset,
        ])
      ).values()
    )

    const uniqueUniversities = Array.from(
      new Map(mergedUniversities.map((item) => [String(item.university_id), item])).values()
    )

    const uniqueSubcategories = Array.from(
      new Map(mergedSubcategories.map((item) => [String(item.subcategory_id), item])).values()
    )

    const uniqueBusinessHours = Array.from(
      new Map(mergedBusinessHours.map((item) => [String(item.day_of_week), item])).values()
    )

    map.set(key, {
      ...existing,
      ...provider,
      service_provider_assets: uniqueAssets,
      service_provider_universities: uniqueUniversities,
      service_provider_subcategories: uniqueSubcategories,
      provider_business_hours: uniqueBusinessHours,
    })
  }

  return Array.from(map.values())
}

function getUniqueProviderUniversityIds(provider: ServiceProvider): string[] {
  return Array.from(
    new Set(
      [
        provider.primary_university_id ? String(provider.primary_university_id) : null,
        ...((provider.service_provider_universities ?? []).map((item) =>
          String(item.university_id)
        )),
      ].filter(Boolean) as string[]
    )
  )
}

function isFoodGroceryCategory(category?: ServiceCategory | null) {
  if (!category) return false

  const slug = category.slug?.toLowerCase().trim()
  const nameEn = category.name_en?.toLowerCase().trim()
  const nameAr = category.name_ar?.trim()

  return (
    slug === 'food-grocery' ||
    slug === 'food_and_grocery' ||
    slug === 'food-grocery-services' ||
    nameEn === 'food & grocery' ||
    nameAr === 'طعام وبقالة'
  )
}

function getMappedSubcategoryIcon(subcategory: ServiceSubcategory) {
  const slug = (subcategory.slug ?? '').toLowerCase().trim()
  const nameEn = (subcategory.name_en ?? '').toLowerCase().trim()
  const nameAr = (subcategory.name_ar ?? '').toLowerCase().trim()
  const combined = `${slug} ${nameEn} ${nameAr}`

  const match = SUBCATEGORY_ICON_MAP.find((item) =>
    item.keywords.some((keyword) => combined.includes(keyword.toLowerCase()))
  )

  return match?.url ?? null
}

function getSubcategoryVisual(subcategory: ServiceSubcategory) {
  const mappedIcon = getMappedSubcategoryIcon(subcategory)
  if (mappedIcon) {
    return { type: 'image' as const, value: mappedIcon }
  }

  if (subcategory.icon && /^https?:\/\//i.test(subcategory.icon)) {
    return { type: 'image' as const, value: subcategory.icon }
  }

  return {
    type: 'image' as const,
    value: 'https://i.ibb.co/d46SrHjx/Untitled-design-3.png',
  }
}

function FoodGrocerySearchBar({
  cities,
  universities,
  selectedLanguage,
  selectedCurrency,
  initialCityId = '',
  initialUniversityId = '',
  selectedSubcategoryId = '',
  query = '',
  action = '/services/food-grocery/search',
}: {
  cities: City[]
  universities: University[]
  selectedLanguage: SupportedLanguage
  selectedCurrency: SupportedCurrency
  initialCityId?: string
  initialUniversityId?: string
  selectedSubcategoryId?: string
  query?: string
  action?: string
}) {
  const isArabic = selectedLanguage === 'ar'
  const t = TRANSLATIONS[selectedLanguage]

  const visibleUniversities = initialCityId
    ? universities.filter((university) => String(university.city_id) === String(initialCityId))
    : universities

  return (
    <form
      action={action}
      method="get"
      className="w-full rounded-[28px] border border-[#dddddd] bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.08)] md:rounded-full md:p-2"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <input type="hidden" name="lang" value={selectedLanguage} />
      <input type="hidden" name="currency" value={selectedCurrency} />
      {selectedSubcategoryId ? (
        <input type="hidden" name="subcategory_id" value={selectedSubcategoryId} />
      ) : null}
      {query ? <input type="hidden" name="q" value={query} /> : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-0">
        <div className="min-w-0 flex-1 px-2 md:px-4">
          <label
            htmlFor="food-grocery-city"
            className="mb-1 block text-[14px] font-semibold leading-none text-[#222222]"
          >
            {t.city}
          </label>
          <select
            id="food-grocery-city"
            name="city_id"
            defaultValue={initialCityId}
            className="w-full rounded-2xl border border-[#dddddd] bg-white px-4 py-3 text-[16px] text-[#6a6a6a] outline-none transition focus:border-[#0047ff] md:border-none md:px-0 md:py-0"
          >
            <option value="">{t.anyCity}</option>
            {cities.map((city) => (
              <option key={city.id} value={String(city.id)}>
                {isArabic ? city.name_ar || city.name_en : city.name_en}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden h-8 w-px bg-[#dddddd] md:block" />

        <div className="min-w-0 flex-1 px-2 md:px-4">
          <label
            htmlFor="food-grocery-university"
            className="mb-1 block text-[14px] font-semibold leading-none text-[#222222]"
          >
            {t.university}
          </label>
          <select
            id="food-grocery-university"
            name="university_id"
            defaultValue={initialUniversityId}
            className="w-full rounded-2xl border border-[#dddddd] bg-white px-4 py-3 text-[16px] text-[#6a6a6a] outline-none transition focus:border-[#0047ff] md:border-none md:px-0 md:py-0"
          >
            <option value="">{t.anyUniversity}</option>
            {visibleUniversities.map((university) => (
              <option key={university.id} value={String(university.id)}>
                {isArabic ? university.name_ar || university.name_en : university.name_en}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end px-2 md:px-3">
          <button
            type="submit"
            className="flex h-[52px] min-w-[52px] items-center justify-center rounded-full bg-[#0047ff] px-5 text-[16px] font-semibold text-white shadow-sm transition hover:scale-[1.02]"
          >
            <span className="md:hidden">{t.search}</span>
            <span className="hidden md:inline">⌕</span>
          </button>
        </div>
      </div>
    </form>
  )
}

export default async function FoodGrocerySearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { lang, currency, city_id, university_id, subcategory_id, q } = await searchParams

  const selectedLanguage = normalizeLanguage(lang)
  const selectedCurrency = normalizeCurrency(currency)
  const t = TRANSLATIONS[selectedLanguage]
  const isArabic = selectedLanguage === 'ar'
  const searchSectionId = 'food-grocery-search-section'

  const supabase = await createClient()

  const [{ data: cities }, { data: universities }, { data: categories }, { data: subcategories }] =
    await Promise.all([
      supabase.from('cities').select('id, name_en, name_ar').order('name_en', { ascending: true }),
      supabase
        .from('universities')
        .select('id, name_en, name_ar, city_id')
        .order('name_en', { ascending: true }),
      supabase
        .from('service_categories')
        .select('id, slug, name_en, name_ar, icon, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('service_subcategories')
        .select('id, category_id, slug, name_en, name_ar, icon, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    ])

  const allCities = (cities as City[]) ?? []
  const allUniversities = (universities as University[]) ?? []
  const serviceCategories = (categories as ServiceCategory[]) ?? []
  const serviceSubcategories = (subcategories as ServiceSubcategory[]) ?? []

  const foodGroceryCategory = serviceCategories.find(isFoodGroceryCategory) ?? null
  const foodCategoryId = foodGroceryCategory ? String(foodGroceryCategory.id) : ''

  const { data: providers } = await supabase
    .from('service_providers')
    .select(`
      id,
      category_id,
      city_id,
      primary_university_id,
      name_en,
      name_ar,
      slug,
      logo_url,
      cover_image_url,
      whatsapp_number,
      whatsapp_message_template,
      is_featured,
      is_active,
      discount_percentage,
      is_manually_closed,
      manual_closed_note,
      service_provider_assets(file_url, asset_type, sort_order),
      service_provider_universities(university_id),
      service_provider_subcategories(subcategory_id),
      provider_business_hours(day_of_week, is_open, open_time, close_time)
    `)
    .eq('is_active', true)
    .eq('category_id', foodCategoryId || '__no_match__')
    .order('created_at', { ascending: false })
    .limit(500)

  const rawServiceProviders = dedupeProvidersById(
    ((providers as ServiceProvider[]) ?? []).filter(
      (provider) => provider.is_active !== false
    )
  )

  const foodSubcategories = serviceSubcategories.filter(
    (subcategory) => String(subcategory.category_id) === foodCategoryId
  )

  const selectedSubcategory =
    foodSubcategories.find((subcategory) => String(subcategory.id) === String(subcategory_id)) ??
    null

  const getSubcategoryName = (subcategory: ServiceSubcategory) =>
    isArabic ? subcategory.name_ar : subcategory.name_en

  const filteredUniversitiesForSearchBar = city_id
    ? allUniversities.filter((university) => String(university.city_id) === String(city_id))
    : allUniversities

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
    return `/services?${params.toString()}`
  }

  const buildServiceDetailsLink = (provider: ServiceProvider) => {
    const params = new URLSearchParams()
    params.set('lang', selectedLanguage)
    params.set('currency', selectedCurrency)

    if (city_id) params.set('city_id', city_id)
    if (university_id) params.set('university_id', university_id)
    if (foodCategoryId) params.set('category_id', foodCategoryId)
    if (subcategory_id) params.set('subcategory_id', subcategory_id)

    const identifier = provider.slug || String(provider.id)
    return `/services/restaurants/${identifier}?${params.toString()}`
  }

  const filteredServiceProviders = rawServiceProviders.filter((provider) => {
    const matchesCity = city_id ? String(provider.city_id) === String(city_id) : true

    const linkedUniversityIds = getUniqueProviderUniversityIds(provider)
    const matchesUniversity = university_id
      ? linkedUniversityIds.includes(String(university_id))
      : true

    const linkedSubcategoryIds = (provider.service_provider_subcategories ?? []).map((item) =>
      String(item.subcategory_id)
    )
    const matchesSubcategory = subcategory_id
      ? linkedSubcategoryIds.includes(String(subcategory_id))
      : true

    const providerName = `${provider.name_en ?? ''} ${provider.name_ar ?? ''}`.toLowerCase()
    const matchesQuery = q ? providerName.includes(q.toLowerCase()) : true

    return matchesCity && matchesUniversity && matchesSubcategory && matchesQuery
  })

  const uniqueVisibleProviders = dedupeProvidersById(filteredServiceProviders).sort((a, b) => {
    const aClosed = isProviderClosedNow(a)
    const bClosed = isProviderClosedNow(b)

    if (aClosed !== bClosed) {
      return aClosed ? 1 : -1
    }

    const aFeatured = a.is_featured === true ? 1 : 0
    const bFeatured = b.is_featured === true ? 1 : 0

    if (aFeatured !== bFeatured) {
      return bFeatured - aFeatured
    }

    return String(a.name_en || a.name_ar || '').localeCompare(
      String(b.name_en || b.name_ar || ''),
      selectedLanguage === 'ar' ? 'ar' : 'en'
    )
  })

  const getProviderImage = (provider: ServiceProvider) => {
    if (provider.cover_image_url) return provider.cover_image_url
    if (provider.logo_url) return provider.logo_url

    const assets = [...(provider.service_provider_assets ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    )

    const preferred =
      assets.find((asset) => asset.asset_type === 'cover') ||
      assets.find((asset) => asset.asset_type === 'gallery') ||
      assets.find((asset) => asset.asset_type === 'menu') ||
      assets[0]

    return preferred?.file_url || null
  }

  const renderServiceImage = (provider: ServiceProvider, isClosed: boolean) => {
    const firstImage = getProviderImage(provider)

    return (
      <div className="relative h-[110px] w-[110px] shrink-0 overflow-hidden rounded-2xl bg-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] md:h-[130px] md:w-[130px]">
        {firstImage ? (
          <img
            src={firstImage}
            alt={
              selectedLanguage === 'ar'
                ? provider.name_ar || provider.name_en
                : provider.name_en
            }
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] ${
              isClosed ? 'brightness-[0.55]' : ''
            }`}
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 transition duration-500 group-hover:scale-[1.03] group-hover:bg-black/5 ${
              isClosed ? 'brightness-[0.7]' : ''
            }`}
          />
        )}

        {isClosed ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-white/95 px-4 py-2 text-[13px] font-bold text-[#1d2939] shadow-md md:text-[14px]">
              {t.closedNow}
            </span>
          </div>
        ) : null}
      </div>
    )
  }

  const renderServiceCard = (provider: ServiceProvider) => {
    const providerName =
      selectedLanguage === 'ar'
        ? provider.name_ar || provider.name_en
        : provider.name_en || provider.name_ar || ''

    const isClosed = isProviderClosedNow(provider)
    const hasDiscount =
      typeof provider.discount_percentage === 'number' && provider.discount_percentage > 0

    return (
      <Link
        key={`provider-${String(provider.id)}`}
        href={buildServiceDetailsLink(provider)}
        className={`group flex w-full items-center gap-4 rounded-2xl border bg-white p-3 transition hover:shadow-md md:gap-5 md:p-4 ${
          isClosed
            ? 'border-gray-200 opacity-95 hover:border-gray-300'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {renderServiceImage(provider, isClosed)}

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="flex w-full items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="line-clamp-2 text-[16px] font-semibold leading-snug text-gray-900 md:text-[20px]">
                  {providerName}
                </h3>

                {isClosed ? (
                  <span className="inline-flex items-center rounded-full bg-[#fef3f2] px-2.5 py-1 text-[11px] font-semibold text-[#b42318] md:text-[12px]">
                    {provider.is_manually_closed ? t.temporarilyClosed : t.closedNow}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-[#ecfdf3] px-2.5 py-1 text-[11px] font-semibold text-[#027a48] md:text-[12px]">
                    {t.availableNow}
                  </span>
                )}
              </div>

              {hasDiscount && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-[12px] font-bold text-red-600 md:text-[13px]">
                    {isArabic
                      ? `${provider.discount_percentage}% ${t.off}`
                      : `${t.upTo} ${provider.discount_percentage}% ${t.off}`}
                  </span>
                </div>
              )}

              {provider.is_manually_closed && provider.manual_closed_note ? (
                <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-gray-500 md:text-[14px]">
                  {provider.manual_closed_note}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Link>
    )
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
        <div className="absolute -bottom-[8px] left-0 right-0 h-[3px] rounded-full bg-[#222222]" />
      )}

      {isMobile && isActive && (
        <div className="absolute -bottom-1 left-0 right-0 h-[2px] w-full bg-black" />
      )}
    </Link>
  )

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="relative min-h-screen bg-white pb-20 text-gray-700 md:pb-0"
    >
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm md:static md:bg-[#f7f7f7] md:shadow-none">
        <div className="w-full bg-white pb-1 pt-1 md:hidden">
          <details className="group [&_summary::-webkit-details-marker]:hidden">
            <summary className="mx-4 mb-4 mt-2 flex cursor-pointer list-none items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-3.5 shadow-[0_3px_10px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="h-5 w-5 text-gray-900"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <span className="translate-y-[1px] text-center text-[14px] font-semibold leading-none text-gray-900">
                {t.startSearch}
              </span>
            </summary>

            <div
              id={searchSectionId}
              className="px-4 pb-4 scroll-mt-28"
            >
              <div className="mb-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
                {t.foodSearchHint}
              </div>

              <FoodGrocerySearchBar
                cities={allCities}
                universities={filteredUniversitiesForSearchBar}
                selectedLanguage={selectedLanguage}
                selectedCurrency={selectedCurrency}
                initialCityId={city_id ?? ''}
                initialUniversityId={university_id ?? ''}
                selectedSubcategoryId={subcategory_id ?? ''}
                query={q ?? ''}
              />
            </div>
          </details>

          <div className="flex items-start justify-center gap-4 px-3 pb-2 pt-1">
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

        <div className="mx-auto hidden max-w-[1920px] px-6 md:block">
          <div className="flex items-center justify-between pt-0">
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

          <div
            id={searchSectionId}
            className="flex justify-center pb-10 pt-3 scroll-mt-28"
          >
            <div className="w-full max-w-6xl">
              <FoodGrocerySearchBar
                cities={allCities}
                universities={filteredUniversitiesForSearchBar}
                selectedLanguage={selectedLanguage}
                selectedCurrency={selectedCurrency}
                initialCityId={city_id ?? ''}
                initialUniversityId={university_id ?? ''}
                selectedSubcategoryId={subcategory_id ?? ''}
                query={q ?? ''}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
        {selectedSubcategory ? (
          <section className="mb-6">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="h-14 w-14 overflow-hidden rounded-2xl bg-gray-50">
                {(() => {
                  const visual = getSubcategoryVisual(selectedSubcategory)
                  return (
                    <img
                      src={visual.value}
                      alt={getSubcategoryName(selectedSubcategory)}
                      className="h-full w-full object-cover"
                    />
                  )
                })()}
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.selectedSubcategory}</p>
                <h2 className="text-lg font-semibold text-gray-900">
                  {getSubcategoryName(selectedSubcategory)}
                </h2>
              </div>
            </div>
          </section>
        ) : null}

        {uniqueVisibleProviders.length > 0 ? (
          <section className="mb-10 space-y-4 md:mb-14">
            {uniqueVisibleProviders.map((provider) => renderServiceCard(provider))}
          </section>
        ) : (
          <section className="py-20">
            <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-900">
                {t.noServices}
              </h2>
            </div>
          </section>
        )}
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

      <style
        dangerouslySetInnerHTML={{
          __html: `
            html {
              scroll-behavior: smooth;
            }

            @media (max-width: 767px) {
              #food-grocery-search-section form {
                border-radius: 28px !important;
              }
            }
          `,
        }}
      />
    </main>
  )
}