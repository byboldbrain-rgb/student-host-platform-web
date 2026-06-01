import Link from 'next/link'
import Script from 'next/script'
import type { Metadata } from 'next'
import { createClient } from '../../src/lib/supabase/server'
import {
  getCachedPropertiesPageData,
  getCachedSakanSeoPages,
  type SakanSeoPage,
} from './data'
import PropertiesSearchBar from './PropertiesSearchBar'
import PropertiesHeader from './PropertiesHeader'
import { Squada_One } from 'next/font/google'

const squadaOne = Squada_One({
  subsets: ['latin'],
  weight: '400',
})

const APP_LOGO_URL = '/og-image.jpg'

const SITE_URL = 'https://navienty.com'

export const metadata: Metadata = {
  title: 'سكن طلاب قريب من الجامعة بدون عمولة',
  description:
    'اكتشف سكن طلاب وسكن طالبات قريب من الجامعة، قارن الأسعار والصور والموقع حسب المدينة أو الجامعة أو المنطقة، وتواصل مباشرة مع المضيف بدون عمولة على الطالب.',
  alternates: {
    canonical: `${SITE_URL}/properties`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'Navienty - سكن طلاب قريب من الجامعة بدون عمولة',
    description:
      'قارن أماكن السكن الطلابي حسب الجامعة والمدينة والمنطقة، شاهد الصور والأسعار، وتواصل مباشرة مع المضيف بدون عمولة.',
    url: `${SITE_URL}/properties`,
    siteName: 'Navienty',
    locale: 'ar_EG',
    type: 'website',
    images: [
      {
        url: APP_LOGO_URL,
        width: 1200,
        height: 630,
        alt: 'Navienty student housing search',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Navienty - سكن طلاب قريب من الجامعة بدون عمولة',
    description:
      'اكتشف وقارن أماكن سكن الطلاب وتواصل مع المضيف مباشرة بدون عمولة.',
    images: [APP_LOGO_URL],
  },
}

type SearchParams = {
  rental_duration?: string
  city_id?: string
  university_id?: string
  area_id?: string
  price_range?: string
  lang?: string
  currency?: string
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

type PropertyArea = {
  id: string | number
  city_id: string | number
  name_en: string
  name_ar: string
  is_active?: boolean | null
}

type UniversityArea = {
  id?: string | number
  university_id: string | number
  area_id: string | number
}

type PropertyImage = {
  image_url?: string | null
  is_cover?: boolean | null
  sort_order?: number | null
}

type PropertySellableOption = {
  code?: string | null
  option_code?: string | null
  price_egp?: number | null
  is_active?: boolean | null
  deleted_at?: string | null
}

type PropertyRoomSellableOption = {
  code?: string | null
  price_egp?: number | null
  is_active?: boolean | null
  deleted_at?: string | null
}

type PropertyRoom = {
  property_room_sellable_options?: PropertyRoomSellableOption[] | null
}

type PropertyUniversityLink = {
  university_id?: string | number | null
}

type Property = {
  id: string | number
  property_id: string
  title_en: string
  title_ar: string
  price_egp: number
  rental_duration: string
  availability_status: string
  gender?: 'boys' | 'girls' | string | null
  city_id?: string | number | null
  university_id?: string | number | null
  area_id?: string | number | null
  property_universities?: PropertyUniversityLink[] | null
  property_images?: PropertyImage[] | null
  property_sellable_options?: PropertySellableOption[] | null
  property_rooms?: PropertyRoom[] | null
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

type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]
type SupportedLanguage = 'en' | 'ar'
type NormalizedAvailabilityStatus =
  | 'available'
  | 'reserved'
  | 'unavailable'
  | 'unknown'

type NormalizedGender = 'boys' | 'girls' | null

type MenuFooterLink = {
  label: string
  href: string
  isEmail?: boolean
}

const PRICE_PRIORITY = [
  'triple_room',
  'double_room',
  'single_room',
  'full_apartment',
] as const

type PricePriorityCode = (typeof PRICE_PRIORITY)[number]

const TRANSLATIONS = {
  en: {
    seeAll: 'See All',
    popularHomesIn: 'Popular stays in',
    popularHomesNear: 'Popular stays near',
    stay: 'stay',
    night: 'night',
    month: 'month',
    city: 'City',
    university: 'University',
    area: 'Area',
    duration: 'Duration',
    searchCities: 'Search cities',
    searchAreas: 'Search areas',
    chooseUniversity: 'Choose university',
    chooseArea: 'Choose area',
    chooseDuration: 'Choose duration',
    selectCity: 'Select city',
    selectUniversity: 'Select university',
    selectArea: 'Select area',
    selectDuration: 'Select duration',
    anyCity: 'Any city',
    anyUniversity: 'Any university',
    anyArea: 'Any area',
    anyDuration: 'Any duration',
    daily: 'Daily',
    monthly: 'Monthly',
    available: 'Available',
    unavailable: 'Unavailable',
    reserved: 'Reserved',
    boys: 'Boys',
    girls: 'Girls',
    startSearch: 'Start your search',
    pricesIncludeFees: 'Prices include all fees',
    help: 'Contact Us',
    signUp: 'Sign up',
    logIn: 'Log in',
    language: 'Language',
    english: 'English',
    arabic: 'العربية',
    close: 'Close',
    login: 'Log in or sign up',
    join: 'Guide',
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedIn: 'LinkedIn',
    footerTitle: 'Find your way to better student living',
    quickLinks: 'Quick Links',
    aboutUs: 'About us',
    board: 'Board',
    contact: 'Contact',
    contactUs: 'Contact Us',
    footerEmail: 'info@navienty.com',
    explore: 'Search',
    community: 'Guide',
    account: 'Account',
    mobileLogin: 'Log in',
    copyright: `© ${new Date().getFullYear()} Navienty | All rights reserved.`,
  },
  ar: {
    seeAll: 'عرض الكل',
    popularHomesIn: 'إقامات شائعة في',
    popularHomesNear: 'إقامات شائعة بالقرب من',
    stay: 'إقامة',
    night: 'ليلة',
    month: 'شهر',
    city: 'المدينة',
    university: 'الجامعة',
    area: 'المنطقة',
    duration: 'المدة',
    searchCities: 'ابحث عن مدينة',
    searchAreas: 'ابحث عن منطقة',
    chooseUniversity: 'اختر الجامعة',
    chooseArea: 'اختر المنطقة',
    chooseDuration: 'اختر المدة',
    selectCity: 'اختر المدينة',
    selectUniversity: 'اختر الجامعة',
    selectArea: 'اختر المنطقة',
    selectDuration: 'اختر المدة',
    anyCity: 'أي مدينة',
    anyUniversity: 'أي جامعة',
    anyArea: 'أي منطقة',
    anyDuration: 'أي مدة',
    daily: 'يومي',
    monthly: 'شهري',
    available: 'متاح',
    unavailable: 'غير متاح',
    reserved: 'محجوز',
    boys: 'ولاد',
    girls: 'بنات',
    startSearch: 'ابدأ بحثك',
    pricesIncludeFees: 'الأسعار تشمل جميع الرسوم',
    help: 'مساعدة',
    signUp: 'إنشاء حساب',
    community: 'الدليل',
    logIn: 'تسجيل الدخول',
    language: 'اللغة',
    english: 'English',
    arabic: 'العربية',
    close: 'إغلاق',
    investors: 'المستثمرون',
    login: 'سجّل الدخول أو أنشئ حسابًا',
    join: 'الدليل',
    facebook: 'فيسبوك',
    instagram: 'إنستجرام',
    linkedIn: 'لينكدإن',
    footerTitle: 'نظرة إلى المستقبل.',
    footerDescription:
      'بفضل تنوع مواقعنا الاستراتيجي، تمنح رؤية Navienty المتكاملة والشاملة تجربة سكن طلابي مبتكرة تخدم مختلف الاحتياجات بكفاءة عالية.',
    quickLinks: 'روابط سريعة',
    aboutUs: 'من نحن',
    board: 'الإدارة',
    news: 'الأخبار',
    contact: 'تواصل معنا',
    contactUs: 'تواصل معنا',
    footerEmail: 'info@navienty.com',
    explore: 'استكشاف',
    account: 'الحساب',
    mobileLogin: 'تسجيل الدخول',
    copyright: `© ${new Date().getFullYear()} نافينتي | جميع الحقوق محفوظة.`,
  },
} as const

function normalizeLanguage(value?: string): SupportedLanguage {
  return value === 'ar' ? 'ar' : 'en'
}

function normalizeCurrency(value?: string): SupportedCurrency {
  const upper = value?.toUpperCase()
  return SUPPORTED_CURRENCIES.includes(upper as SupportedCurrency)
    ? (upper as SupportedCurrency)
    : 'EGP'
}

function normalizeGender(value?: string | null): NormalizedGender {
  const normalized = value?.toLowerCase().trim()

  if (normalized === 'boys') return 'boys'
  if (normalized === 'girls') return 'girls'

  return null
}

function normalizeAvailabilityStatusForUi(
  status?: string
): NormalizedAvailabilityStatus {
  const normalized = status
    ?.toLowerCase()
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')

  if (!normalized) return 'unknown'

  if (
    normalized === 'available' ||
    normalized === 'partial reserved' ||
    normalized === 'partially reserved'
  ) {
    return 'available'
  }

  if (
    normalized === 'reserved' ||
    normalized === 'full reserved' ||
    normalized === 'fully reserved'
  ) {
    return 'reserved'
  }

  if (normalized === 'unavailable') {
    return 'unavailable'
  }

  return 'unknown'
}

function translateAvailabilityStatus(
  value: string,
  language: SupportedLanguage
) {
  const normalized = normalizeAvailabilityStatusForUi(value)

  if (normalized === 'available') return TRANSLATIONS[language].available
  if (normalized === 'reserved') return TRANSLATIONS[language].reserved
  if (normalized === 'unavailable') return TRANSLATIONS[language].unavailable

  return value
}

function translateRentalDuration(value: string, language: SupportedLanguage) {
  const normalized = value?.toLowerCase?.() || ''

  if (normalized === 'daily') return TRANSLATIONS[language].daily
  if (normalized === 'monthly') return TRANSLATIONS[language].monthly

  return value
}

function getAvailabilityRank(status?: string) {
  const normalized = normalizeAvailabilityStatusForUi(status)

  if (normalized === 'available') return 0
  if (normalized === 'reserved') return 1
  if (normalized === 'unavailable') return 2
  return 3
}

function getStablePropertyRank(property: Property) {
  const value = String(property.property_id || property.id || '')
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1000000007
  }

  return hash
}

function normalizeOptionCode(value?: string | null) {
  return value
    ?.toLowerCase()
    .trim()
    .replace(/[-\s]+/g, '_')
}

function getOptionPriority(code?: string | null) {
  const normalizedCode = normalizeOptionCode(code)
  const index = PRICE_PRIORITY.indexOf(normalizedCode as PricePriorityCode)

  return index === -1 ? Number.POSITIVE_INFINITY : index
}

function isUsablePriceOption(option: {
  code?: string | null
  option_code?: string | null
  price_egp?: number | null
  is_active?: boolean | null
  deleted_at?: string | null
}) {
  const code = normalizeOptionCode(option.option_code || option.code)
  const price = Number(option.price_egp)

  return (
    !!code &&
    PRICE_PRIORITY.includes(code as PricePriorityCode) &&
    option.is_active !== false &&
    !option.deleted_at &&
    Number.isFinite(price) &&
    price >= 0
  )
}

function getDisplayPriceEgp(property: Property) {
  const propertyOptions =
    property.property_sellable_options?.map((option) => ({
      code: option.option_code || option.code,
      price_egp: option.price_egp,
      is_active: option.is_active,
      deleted_at: option.deleted_at,
    })) ?? []

  const roomOptions =
    property.property_rooms?.flatMap((room) =>
      (room.property_room_sellable_options ?? []).map((option) => ({
        code: option.code,
        price_egp: option.price_egp,
        is_active: option.is_active,
        deleted_at: option.deleted_at,
      }))
    ) ?? []

  const matchedOption = [...propertyOptions, ...roomOptions]
    .filter(isUsablePriceOption)
    .sort((a, b) => {
      const priorityDiff = getOptionPriority(a.code) - getOptionPriority(b.code)

      if (priorityDiff !== 0) return priorityDiff

      return Number(a.price_egp) - Number(b.price_egp)
    })[0]

  return matchedOption?.price_egp ?? property.price_egp
}

async function getCurrencyRate(currency: SupportedCurrency) {
  if (currency === 'EGP') return 1

  const accessKey = process.env.EXCHANGERATE_API_KEY
  if (!accessKey) return 1

  try {
    const response = await fetch(
      `https://api.exchangerate.host/live?access_key=${accessKey}&currencies=EGP,${currency}`,
      {
        next: {
          revalidate: 60 * 60 * 6,
          tags: [`navienty:currency-rate:${currency}`],
        },
      }
    )

    const data = await response.json()

    if (data?.success && data?.quotes) {
      const egpFromUsd = data.quotes.USDEGP
      const targetFromUsd = data.quotes[`USD${currency}`]

      if (
        typeof egpFromUsd === 'number' &&
        typeof targetFromUsd === 'number' &&
        egpFromUsd > 0
      ) {
        return targetFromUsd / egpFromUsd
      }
    }

    if (data?.rates?.EGP && data?.rates?.[currency]) {
      const egpRate = data.rates.EGP
      const targetRate = data.rates[currency]

      if (
        typeof egpRate === 'number' &&
        typeof targetRate === 'number' &&
        egpRate > 0
      ) {
        return targetRate / egpRate
      }
    }

    return 1
  } catch {
    return 1
  }
}

function formatPrice(
  amountEgp: number,
  currency: SupportedCurrency,
  language: SupportedLanguage,
  rate: number
) {
  const converted = currency === 'EGP' ? amountEgp : amountEgp * rate
  const locale = language === 'ar' ? 'ar-EG' : 'en-US'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'IQD' || currency === 'LBP' ? 0 : 2,
  }).format(converted)
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const {
    rental_duration,
    city_id,
    university_id,
    area_id,
    price_range,
    lang,
    currency,
  } = await searchParams

  const selectedLanguage = normalizeLanguage(lang)
  const selectedCurrency = normalizeCurrency(currency)
  const t = TRANSLATIONS[selectedLanguage]
  const isArabic = selectedLanguage === 'ar'
  const currencyRate = await getCurrencyRate(selectedCurrency)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoggedIn = !!user

  const {
    cities,
    universities,
    areas,
    universityAreas,
    allPopularSource,
  } = await getCachedPropertiesPageData()

  const sakanSeoPages = await getCachedSakanSeoPages()

  const sakanPathByAreaId = new Map(
    (sakanSeoPages as SakanSeoPage[])
      .filter((page) => page.page_type === 'area' && page.area_id && page.path)
      .map((page) => [String(page.area_id), page.path])
  )

  const sakanPathByUniversityId = new Map(
    (sakanSeoPages as SakanSeoPage[])
      .filter(
        (page) =>
          page.page_type === 'university' && page.university_id && page.path
      )
      .map((page) => [String(page.university_id), page.path])
  )

  const seoNavigationLinks = (sakanSeoPages as SakanSeoPage[])
    .filter(
      (page) =>
        page.is_indexable &&
        page.published_properties_count >= 3 &&
        Boolean(page.path) &&
        Boolean(page.seo_h1_ar || page.entity_name_ar)
    )
    .slice(0, 12)
    .map((page) => ({
      href: page.path,
      label: page.seo_h1_ar || page.entity_name_ar,
      count: page.published_properties_count,
    }))

  const seoItemListJsonLd =
    seoNavigationLinks.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Navienty student housing pages',
          itemListElement: seoNavigationLinks.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.label,
            url: `${SITE_URL}${item.href}`,
          })),
        }
      : null

  const propertiesCollectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'سكن طلاب قريب من الجامعة بدون عمولة',
    description:
      'صفحة بحث ومقارنة أماكن السكن الطلابي على Navienty حسب المدينة والجامعة والمنطقة والأسعار.',
    url: `${SITE_URL}/properties`,
    inLanguage: 'ar-EG',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Navienty',
      url: SITE_URL,
    },
    about: [
      { '@type': 'Thing', name: 'سكن طلاب' },
      { '@type': 'Thing', name: 'سكن طالبات' },
      { '@type': 'Thing', name: 'Student accommodation' },
    ],
  }

  const buildPageLink = (updates: Partial<SearchParams> = {}) => {
    const params = new URLSearchParams()

    const nextRentalDuration =
      updates.rental_duration !== undefined
        ? updates.rental_duration
        : rental_duration

    const nextCityId = updates.city_id !== undefined ? updates.city_id : city_id

    const nextUniversityId =
      updates.university_id !== undefined
        ? updates.university_id
        : university_id

    const nextAreaId =
      updates.area_id !== undefined ? updates.area_id : area_id

    const nextPriceRange =
      updates.price_range !== undefined ? updates.price_range : price_range

    const nextLang =
      updates.lang !== undefined ? updates.lang : selectedLanguage

    const nextCurrency =
      updates.currency !== undefined ? updates.currency : selectedCurrency

    if (nextRentalDuration) params.set('rental_duration', nextRentalDuration)
    if (nextCityId) params.set('city_id', nextCityId)
    if (nextUniversityId) params.set('university_id', nextUniversityId)
    if (nextAreaId) params.set('area_id', nextAreaId)
    if (nextPriceRange) params.set('price_range', nextPriceRange)
    if (nextLang) params.set('lang', nextLang)
    if (nextCurrency) params.set('currency', nextCurrency)

    const queryString = params.toString()
    return queryString ? `/properties?${queryString}` : '/properties'
  }

  const buildPropertyHref = (propertyId: string) => {
    const params = new URLSearchParams()
    params.set('lang', selectedLanguage)
    params.set('currency', selectedCurrency)
    return `/properties/${propertyId}?${params.toString()}`
  }

  const buildSimpleNavLink = (
    path: string,
    updates: Partial<SearchParams> = {}
  ) => {
    const params = new URLSearchParams()
    params.set('lang', updates.lang ?? selectedLanguage)
    params.set('currency', updates.currency ?? selectedCurrency)
    const queryString = params.toString()
    return queryString ? `${path}?${queryString}` : path
  }

  const cityMap = new Map<string, string>()
  for (const city of (cities as City[]) ?? []) {
    cityMap.set(String(city.id), isArabic ? city.name_ar : city.name_en)
  }

  const universityMap = new Map<string, string>()
  for (const university of (universities as University[]) ?? []) {
    universityMap.set(
      String(university.id),
      isArabic ? university.name_ar : university.name_en
    )
  }

  const areaMap = new Map<string, string>()
  for (const area of (areas as PropertyArea[]) ?? []) {
    areaMap.set(
      String(area.id),
      isArabic ? area.name_ar || area.name_en : area.name_en
    )
  }

  const sourceProperties = ((allPopularSource as Property[]) ?? [])
    .filter(
      (property) =>
        normalizeAvailabilityStatusForUi(property.availability_status) !==
        'unavailable'
    )
    .sort((a, b) => {
      const availabilityDiff =
        getAvailabilityRank(a.availability_status) -
        getAvailabilityRank(b.availability_status)

      if (availabilityDiff !== 0) return availabilityDiff

      return getStablePropertyRank(a) - getStablePropertyRank(b)
    })

  const POPULAR_SECTION_ITEM_LIMIT = 10
  const POPULAR_SECTIONS_LIMIT = 10

  const areaSectionsMap = new Map<string, Property[]>()
  const universitySectionsMap = new Map<string, Property[]>()

  for (const property of sourceProperties) {
    if (property.area_id) {
      const areaKey = String(property.area_id)
      const existing = areaSectionsMap.get(areaKey) ?? []

      if (existing.length < POPULAR_SECTION_ITEM_LIMIT) {
        existing.push(property)
        areaSectionsMap.set(areaKey, existing)
      }
    }

    const linkedUniversityIds =
      property.property_universities
        ?.map((item) => item.university_id)
        .filter(Boolean)
        .map((id) => String(id)) ?? []

    const universityIdsForSections =
      linkedUniversityIds.length > 0
        ? Array.from(new Set(linkedUniversityIds))
        : property.university_id
          ? [String(property.university_id)]
          : []

    for (const linkedUniversityId of universityIdsForSections) {
      const existing = universitySectionsMap.get(linkedUniversityId) ?? []

      if (existing.length < POPULAR_SECTION_ITEM_LIMIT) {
        existing.push(property)
        universitySectionsMap.set(linkedUniversityId, existing)
      }
    }
  }

  const popularAreaSections = Array.from(areaSectionsMap.entries())
    .filter(([key, items]) => areaMap.has(key) && items.length > 0)
    .slice(0, POPULAR_SECTIONS_LIMIT)
    .map(([key, items]) => ({
      id: key,
      type: 'area' as const,
      title: `${t.popularHomesIn} ${areaMap.get(key)}`,
      items,
    }))

  const popularUniversitySections = Array.from(universitySectionsMap.entries())
    .filter(([key, items]) => universityMap.has(key) && items.length > 0)
    .slice(0, POPULAR_SECTIONS_LIMIT)
    .map(([key, items]) => ({
      id: key,
      type: 'university' as const,
      title: `${t.popularHomesNear} ${universityMap.get(key)}`,
      items,
    }))

  const showcaseSections: Array<
    | (typeof popularAreaSections)[number]
    | (typeof popularUniversitySections)[number]
  > = []

  const maxPopularLength = Math.max(
    popularAreaSections.length,
    popularUniversitySections.length
  )

  for (let index = 0; index < maxPopularLength; index += 1) {
    if (
      popularAreaSections[index] &&
      showcaseSections.length < POPULAR_SECTIONS_LIMIT
    ) {
      showcaseSections.push(popularAreaSections[index])
    }

    if (
      popularUniversitySections[index] &&
      showcaseSections.length < POPULAR_SECTIONS_LIMIT
    ) {
      showcaseSections.push(popularUniversitySections[index])
    }

    if (showcaseSections.length >= POPULAR_SECTIONS_LIMIT) {
      break
    }
  }

  const buildSearchLink = ({
    areaId,
    universityId,
  }: {
    areaId?: string
    universityId?: string
  }) => {
    if (areaId) {
      const seoPath = sakanPathByAreaId.get(String(areaId))

      if (seoPath) return seoPath
    }

    if (universityId) {
      const seoPath = sakanPathByUniversityId.get(String(universityId))

      if (seoPath) return seoPath
    }

    const params = new URLSearchParams()

    if (areaId) params.set('area_id', areaId)
    if (universityId) params.set('university_id', universityId)

    params.set('lang', selectedLanguage)
    params.set('currency', selectedCurrency)

    return `/properties/search?${params.toString()}`
  }

  const getCoverImage = (property: Property) => {
    const images = (property.property_images ?? []).filter(
      (image) => !!image.image_url
    )

    if (images.length === 0) {
      return null
    }

    const coverImage = images.find((image) => image.is_cover === true)

    if (coverImage?.image_url) {
      return coverImage.image_url
    }

    return [...images].sort((a, b) => {
      const sortOrderA = a.sort_order ?? Number.POSITIVE_INFINITY
      const sortOrderB = b.sort_order ?? Number.POSITIVE_INFINITY

      return sortOrderA - sortOrderB
    })[0]?.image_url ?? null
  }

  const renderGenderMeta = (property: Property) => {
    const gender = normalizeGender(property.gender)

    if (!gender) return null

    const label =
      selectedLanguage === 'ar'
        ? gender === 'boys'
          ? 'ولاد فقط'
          : 'بنات فقط'
        : gender === 'boys'
          ? 'Boys only'
          : 'Girls only'

    return <span className="property-meta-gender">{label}</span>
  }

  const renderSeeAllCard = (
    sectionId: string,
    sectionType: 'area' | 'university',
    items: Property[]
  ) => {
    const images = items
      .map(getCoverImage)
      .filter(Boolean)
      .slice(0, 3) as string[]

    return (
      <Link
        key={`see-all-${sectionType}-${sectionId}`}
        href={buildSearchLink({
          areaId: sectionType === 'area' ? sectionId : undefined,
          universityId: sectionType === 'university' ? sectionId : undefined,
        })}
        className="group block min-w-[150px] max-w-[150px] shrink-0 snap-start md:min-w-[160px] md:max-w-[160px]"
      >
        <div className="relative flex aspect-[4/3] w-full items-center justify-center rounded-xl transition duration-300 md:rounded-3xl">
          <div className="relative flex h-full w-full items-center justify-center">
            {images[1] && (
              <img
                src={images[1]}
                className="absolute h-[65%] w-[65%] -translate-x-3 -translate-y-2 -rotate-12 rounded-lg border-[2px] border-white object-cover shadow-sm transition-transform duration-300 group-hover:-rotate-[16deg] md:rounded-xl md:border-[3px]"
                alt=""
              />
            )}
            {images[2] && (
              <img
                src={images[2]}
                className="absolute h-[65%] w-[65%] translate-x-3 -translate-y-2 rotate-12 rounded-lg border-[2px] border-white object-cover shadow-sm transition-transform duration-300 group-hover:rotate-[16deg] md:rounded-xl md:border-[3px]"
                alt=""
              />
            )}
            {images[0] ? (
              <img
                src={images[0]}
                className="absolute z-10 h-[70%] w-[70%] rounded-lg border-[2px] border-white object-cover shadow-md transition-transform duration-300 group-hover:scale-105 md:rounded-xl md:border-[3px]"
                alt=""
              />
            ) : (
              <div className="absolute z-10 flex h-[70%] w-[70%] items-center justify-center rounded-lg border-[2px] border-white bg-gray-100 shadow-md transition-transform duration-300 group-hover:scale-105 dark:border-slate-700 dark:bg-slate-800 md:rounded-xl md:border-[3px]">
                <span className="text-xl text-gray-400 dark:text-slate-500 md:text-2xl">→</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-start justify-center pt-2 md:mt-3">
          <span className="text-[14px] font-semibold text-gray-900 group-hover:text-black dark:text-slate-100 dark:group-hover:text-white md:text-[15px]">
            {t.seeAll}
          </span>
        </div>
      </Link>
    )
  }

  const renderPropertyImage = (property: Property, badgeText: string) => {
    const coverImage = getCoverImage(property)
    const normalizedStatus = normalizeAvailabilityStatusForUi(
      property.availability_status
    )

    const isReserved = normalizedStatus === 'reserved'
    const isAvailable = normalizedStatus === 'available'

    return (
      <div className="property-media-card group/image relative aspect-[4/3] overflow-hidden rounded-[18px] bg-gray-100 shadow-[0_10px_30px_rgba(15,23,42,0.10)] dark:bg-slate-800 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] md:rounded-[28px]">
        {coverImage ? (
          <img
            src={coverImage}
            alt={property.title_en}
            className="h-full w-full object-cover transition duration-700 group-hover/image:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 transition duration-700 group-hover/image:scale-[1.03]" />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/18 via-black/5 to-transparent" />

        {(isAvailable || isReserved) && (
          <div
            className={`status-ribbon ${
              isReserved ? 'status-ribbon--reserved' : 'status-ribbon--available'
            }`}
          >
            <span className="status-ribbon__inner">{badgeText}</span>
          </div>
        )}
      </div>
    )
  }

  const renderPropertyCard = (property: Property) => {
  const displayPriceEgp = getDisplayPriceEgp(property)

  return (
    <Link
      key={property.id}
      href={buildPropertyHref(property.property_id)}
      className="group block min-w-[220px] max-w-[220px] shrink-0 snap-start md:min-w-[200px] md:max-w-[200px]"
    >
      {renderPropertyImage(
        property,
        translateAvailabilityStatus(
          property.availability_status,
          selectedLanguage
        )
      )}

      <div className="mt-2.5 space-y-1.5 md:mt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[16px] font-semibold leading-snug tracking-[-0.02em] text-slate-900 dark:text-slate-100 md:text-[17px]">
            {isArabic ? property.title_ar : property.title_en}
          </h3>
        </div>

        {renderGenderMeta(property) && (
          <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-slate-500 dark:text-slate-400 md:text-[13px]">
            {renderGenderMeta(property)}
          </div>
        )}

        <p className="truncate pt-0.5 text-[15px] md:pt-1 md:text-[14px]">
          <span className="font-semibold text-slate-950 dark:text-white">
            {formatPrice(
              displayPriceEgp,
              selectedCurrency,
              selectedLanguage,
              currencyRate
            )}
          </span>{' '}
          <span className="text-[12px] text-slate-500 dark:text-slate-400 md:text-[12px]">
            / {property.rental_duration === 'daily' ? t.night : t.month}
          </span>
        </p>
      </div>
    </Link>
  )
}

  const primaryMenuLinks = [
    {
      label: isLoggedIn ? t.account : t.login,
      href: isLoggedIn
        ? buildSimpleNavLink('/account')
        : buildSimpleNavLink('/account-login'),
    },
    { label: t.join, href: buildSimpleNavLink('/community') },
  ]

  const socialMenuLinks = [
    { label: t.facebook, href: 'https://www.facebook.com/' },
    { label: t.instagram, href: 'https://www.instagram.com/' },
    { label: t.linkedIn, href: 'https://www.linkedin.com/' },
  ]

  const footerQuickLinks = [
    { label: t.aboutUs, href: buildSimpleNavLink('/about') },
    { label: t.board, href: buildSimpleNavLink('/board') },
    { label: t.contact, href: buildSimpleNavLink('/contact') },
  ]

  const menuFooterLinks: MenuFooterLink[] = [
    ...footerQuickLinks,
    { label: t.footerEmail, href: `mailto:${t.footerEmail}`, isEmail: true },
  ]

  const searchBarProps = {
    cities: (cities as City[]) ?? [],
    universities: (universities as University[]) ?? [],
    areas: (areas as PropertyArea[]) ?? [],
    universityAreas: (universityAreas as UniversityArea[]) ?? [],
    initialCityId: city_id ?? '',
    initialUniversityId: university_id ?? '',
    initialAreaId: area_id ?? '',
    initialRentalDuration: rental_duration ?? '',
    initialPriceRange: price_range ?? '',
    language: selectedLanguage,
    currency: selectedCurrency,
    labels: {
      city: t.city,
      university: t.university,
      area: t.area,
      duration: t.duration,
      searchCities: t.searchCities,
      searchAreas: t.searchAreas,
      chooseUniversity: t.chooseUniversity,
      chooseArea: t.chooseArea,
      chooseDuration: t.chooseDuration,
      selectCity: t.selectCity,
      selectUniversity: t.selectUniversity,
      selectArea: t.selectArea,
      selectDuration: t.selectDuration,
      anyCity: t.anyCity,
      anyUniversity: t.anyUniversity,
      anyArea: t.anyArea,
      anyDuration: t.anyDuration,
      daily: t.daily,
      monthly: t.monthly,
    },
  }

  const nextMobileLanguage: SupportedLanguage = selectedLanguage === 'ar' ? 'en' : 'ar'
  const mobileLanguageHref = buildPageLink({ lang: nextMobileLanguage })
  const mobileLanguageLabel = selectedLanguage === 'ar' ? t.english : t.arabic
  const mobileLanguageAriaLabel =
    selectedLanguage === 'ar' ? 'Switch language to English' : 'تغيير اللغة إلى العربية'

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="relative min-h-screen bg-white pb-32 text-gray-700 dark:bg-[#050816] dark:text-slate-100 md:pb-0"
    >
      <Script
        id="navienty-default-language-script"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              try {
                var storageKey = 'navienty-preferred-language';
                var params = new URLSearchParams(window.location.search);
                var currentLang = params.get('lang');
                var supportedLanguages = { ar: true, en: true };

                function applyDocumentLanguage(language) {
                  if (!supportedLanguages[language]) return;
                  document.documentElement.lang = language;
                  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
                }

                if (supportedLanguages[currentLang]) {
                  localStorage.setItem(storageKey, currentLang);
                  applyDocumentLanguage(currentLang);
                  return;
                }

                var savedLanguage = localStorage.getItem(storageKey);
                var browserLanguage =
                  (navigator.languages && navigator.languages.length
                    ? navigator.languages[0]
                    : navigator.language || 'en') || 'en';

                var detectedLanguage = /^ar(\b|-|_)/i.test(browserLanguage)
                  ? 'ar'
                  : 'en';

                var nextLanguage = supportedLanguages[savedLanguage]
                  ? savedLanguage
                  : detectedLanguage;

                params.set('lang', nextLanguage);

                var nextUrl =
                  window.location.pathname +
                  '?' +
                  params.toString() +
                  window.location.hash;

                applyDocumentLanguage(nextLanguage);
                window.location.replace(nextUrl);
              } catch (error) {}
            })();
          `,
        }}
      />

      <Script
        id="properties-collection-jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(propertiesCollectionJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      {seoItemListJsonLd && (
        <Script
          id="properties-sakan-seo-item-list"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(seoItemListJsonLd).replace(/</g, '\\u003c'),
          }}
        />
      )}

      <input
        id="nav-menu-toggle"
        type="checkbox"
        className="peer sr-only"
        aria-hidden="true"
      />

      <style>{`
        :root {
          --menu-blue: #054aff;
          --menu-cream: #f2ead8;
          --menu-cream-soft: rgba(242, 234, 216, 0.92);
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .popular-desktop-grid > a {
          width: 100%;
          min-width: 0 !important;
          max-width: none !important;
        }

        .navienty-logo {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          overflow: hidden;
          text-decoration: none;
          transform: translateY(-7px);
        }

        .navienty-logo-icon {
          width: 56px;
          height: 56px;
          object-fit: contain;
          flex-shrink: 0;
          display: block;
        }

        .navienty-logo-text-wrap {
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateX(-6px);
          transition:
            max-width 0.35s ease,
            opacity 0.25s ease,
            transform 0.35s ease;
          display: flex;
          align-items: center;
        }

        .navienty-logo:hover .navienty-logo-text-wrap,
        .navienty-logo:focus-visible .navienty-logo-text-wrap {
          max-width: 120px;
          opacity: 1;
          transform: translateX(0);
        }

        .navienty-logo-text {
          width: 112px;
          min-width: 112px;
          height: auto;
          object-fit: contain;
          display: block;
          transform: translateY(-2px);
        }

        .navienty-logo-mobile {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .navienty-logo-mobile img {
          width: 42px;
          height: 42px;
          object-fit: contain;
          display: block;
        }

        .menu-trigger {
          width: 40px;
          height: 40px;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .menu-trigger:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .menu-trigger-lines {
          position: relative;
          width: 26px;
          height: 10px;
          display: block;
        }

        .menu-trigger-lines span {
          position: absolute;
          left: 0;
          width: 100%;
          height: 2px;
          background: #000000;
          border-radius: 2px;
        }

        .menu-trigger-lines span:nth-child(1) {
          top: 0;
        }

        .menu-trigger-lines span:nth-child(2) {
          bottom: 0;
        }

        .mega-menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 140;
          background: var(--menu-blue);
          color: var(--menu-cream);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateY(-8px);
          transition:
            opacity 0.26s ease,
            visibility 0.26s ease,
            transform 0.26s ease;
        }

        .peer:checked ~ .mega-menu-overlay {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateY(0);
        }

        .mega-menu-wrap {
          position: relative;
          min-height: 100dvh;
          padding: 38px 56px 38px;
        }

        .mega-menu-top {
          position: absolute;
          left: 56px;
          right: 56px;
          top: 36px;
          height: 56px;
          z-index: 3;
        }

        .mega-menu-close {
          position: absolute;
          right: 0;
          top: 0;
          display: inline-flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          color: var(--menu-cream);
          font-size: 18px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: -0.02em;
        }

        .mega-menu-close-line {
          width: 46px;
          height: 2px;
          border-radius: 999px;
          background: currentColor;
          display: inline-block;
          transform: translateY(-1px);
        }

        .mega-menu-logo {
          position: absolute;
          left: 50%;
          top: -60px;
          transform: translateX(-50%);
          z-index: 2;
        }

        .mega-menu-logo img {
          width: 160px;
          height: auto;
          object-fit: contain;
          display: block;
        }

        .mega-menu-investors {
          color: var(--menu-cream);
          text-decoration: none;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .mega-menu-investors:hover {
          opacity: 0.88;
        }

        .mega-menu-body {
          position: relative;
          min-height: calc(100dvh - 76px);
          padding-top: 100px;
          width: 100%;
          padding-left: 56px;
          padding-right: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mega-menu-left {
          position: absolute;
          left: 56px;
          bottom: 36px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 220px;
          min-width: 220px;
          min-height: auto;
        }

        .mega-menu-left-spacer {
          display: none;
        }

        .mega-menu-left-bottom {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          padding-bottom: 0;
        }

        .mega-menu-small-link {
          color: var(--menu-cream);
          text-decoration: none;
          font-size: 22px;
          line-height: 1.28;
          font-weight: 600;
          letter-spacing: -0.03em;
          display: block;
          width: fit-content;
        }

        .mega-menu-small-link:hover {
          opacity: 0.88;
        }

        .mega-menu-right {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-width: 0;
          padding-top: 0;
          transform: translateY(-100px);
        }

        .mega-menu-main-links {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          width: 100%;
          max-width: 900px;
          text-align: center;
        }

        .mega-menu-main-link {
          color: var(--menu-cream);
          text-decoration: none;
          font-weight: 600;
          font-size: 64px;
          line-height: 1.15;
          letter-spacing: -0.075em;
          display: block;
          width: fit-content;
        }

        .mega-menu-main-link:hover {
          opacity: 0.9;
        }

        .mega-menu-footer-links {
          position: absolute;
          right: 56px;
          bottom: 12px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          max-width: 240px;
          text-align: right;
        }

        .mega-menu-footer-link {
          color: rgba(242, 234, 216, 0.88);
          text-decoration: none;
          font-size: 18px;
          line-height: 1.35;
          font-weight: 500;
          letter-spacing: -0.02em;
          transition:
            opacity 0.2s ease,
            transform 0.2s ease,
            color 0.2s ease;
        }

        .mega-menu-footer-link:hover {
          opacity: 1;
          color: var(--menu-cream);
          transform: translateX(-2px);
        }

        .mega-menu-footer-link--email {
          margin-top: 8px;
          opacity: 0.76;
          font-size: 16px;
        }

        .property-media-card {
          isolation: isolate;
        }

        .status-ribbon {
          position: absolute;
          top: 0;
          left: 0;
          width: 96px;
          height: 96px;
          overflow: hidden;
          z-index: 30;
          pointer-events: none;
        }

        .status-ribbon__inner {
          position: absolute;
          top: 18px;
          left: -36px;
          width: 142px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(-45deg);
          transform-origin: center;
          color: #ffffff;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border-top: 1px solid rgba(255, 255, 255, 0.42);
          border-bottom: 1px solid rgba(0, 0, 0, 0.18);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
          box-shadow:
            0 10px 18px rgba(15, 23, 42, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.34),
            inset 0 -8px 14px rgba(0, 0, 0, 0.16);
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          transition:
            transform 0.35s ease,
            filter 0.35s ease,
            box-shadow 0.35s ease;
        }

        .status-ribbon__inner::before,
        .status-ribbon__inner::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .status-ribbon__inner::before {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.28) 0%,
            rgba(255, 255, 255, 0.08) 35%,
            rgba(0, 0, 0, 0.10) 100%
          );
          mix-blend-mode: soft-light;
        }

        .status-ribbon__inner::after {
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.18) 0%,
            rgba(255, 255, 255, 0.14) 50%,
            rgba(0, 0, 0, 0.14) 100%
          );
          opacity: 0.55;
        }

        .status-ribbon::before,
        .status-ribbon::after {
          content: none !important;
          display: none !important;
        }

        .status-ribbon--available .status-ribbon__inner {
          background-image: linear-gradient(
            135deg,
            #046947 0%,
            #0b8f63 28%,
            #25c28b 58%,
            #0a7a56 100%
          );
        }

        .status-ribbon--reserved .status-ribbon__inner {
          background-image: linear-gradient(
            135deg,
            #8f1239 0%,
            #c81e4b 28%,
            #fb7185 58%,
            #be123c 100%
          );
        }

        .group:hover .status-ribbon__inner {
          transform: rotate(-45deg) scale(1.03);
          filter: saturate(1.08) brightness(1.03);
          box-shadow:
            0 14px 24px rgba(15, 23, 42, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.38),
            inset 0 -9px 16px rgba(0, 0, 0, 0.17);
        }

        .property-meta-gender {
          display: inline-flex;
          min-width: 0;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.25;
          font-weight: 500;
          letter-spacing: -0.01em;
          white-space: nowrap;
          transition: color 0.2s ease;
        }

        .group:hover .property-meta-gender {
          color: #334155;
        }

        [dir='rtl'] .property-meta-gender {
          flex-direction: row;
        }

        .mobile-bottom-nav {
          position: fixed;
          left: max(14px, env(safe-area-inset-left, 0px));
          right: max(14px, env(safe-area-inset-right, 0px));
          bottom: calc(env(safe-area-inset-bottom, 0px) + 18px);
          z-index: 120;
          display: none;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.72);
          border-radius: 999px;
          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.82),
              rgba(255, 255, 255, 0.58)
            );
          box-shadow:
            0 18px 45px rgba(15, 23, 42, 0.18),
            0 6px 18px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.85),
            inset 0 -1px 0 rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(22px) saturate(1.45);
          -webkit-backdrop-filter: blur(22px) saturate(1.45);
          transform: translate3d(0, 0, 0);
          opacity: 1;
          pointer-events: auto;
          transition:
            transform 0.34s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.22s ease,
            box-shadow 0.28s ease;
          will-change: transform, opacity;
        }

        .mobile-bottom-nav--hidden {
          transform: translate3d(0, calc(100% + 64px), 0) !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .mobile-bottom-nav {
            transition: none;
          }
        }

        .mobile-bottom-nav::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(
              circle at 18% 0%,
              rgba(255, 255, 255, 0.78),
              transparent 34%
            ),
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.34),
              rgba(255, 255, 255, 0.08)
            );
        }

        .mobile-bottom-nav__inner {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: center;
          height: 70px;
          padding: 0 14px;
        }

        .mobile-bottom-nav__item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-decoration: none;
          color: #6b7280;
          min-height: 100%;
          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .mobile-bottom-nav__item:hover {
          color: #111827;
        }

        .mobile-bottom-nav__item--active {
          color: #054aff;
        }

        .mobile-bottom-nav__item--active .mobile-bottom-nav__icon--image {
          filter: brightness(0) saturate(100%) invert(18%) sepia(98%) saturate(5178%)
            hue-rotate(223deg) brightness(104%) contrast(106%);
        }

        .mobile-bottom-nav__icon {
          width: 22px;
          height: 22px;
          display: block;
        }

        .mobile-bottom-nav__icon--image {
          object-fit: contain;
          filter: grayscale(1) brightness(0.55);
          transition: filter 0.2s ease;
        }

        .mobile-bottom-nav__label {
          font-size: 11px;
          line-height: 1;
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        .footer-esaf {
          background: #054aff;
          color: #ffffff;
          margin-top: 56px;
        }

        .footer-esaf-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 72px 48px 34px;
        }

        .footer-esaf-top {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) 320px 280px;
          gap: 72px;
          align-items: start;
        }

        .footer-esaf-title {
          margin: 0;
          color: #ffffff;
          font-size: clamp(42px, 5vw, 64px);
          line-height: 0.98;
          letter-spacing: -0.06em;
          font-weight: 500;
          text-transform: uppercase;
        }

        .footer-esaf-description {
          margin: 28px 0 0;
          max-width: 760px;
          color: rgba(255, 255, 255, 0.95);
          font-size: 17px;
          line-height: 2.05;
          letter-spacing: -0.02em;
        }

        .footer-esaf-heading {
          margin: 0 0 18px;
          color: #ffffff;
          font-size: 24px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .footer-esaf-links {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-esaf-link {
          display: inline-block;
          width: fit-content;
          color: #ffffff;
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 8px;
          font-size: 18px;
          line-height: 1.45;
          font-weight: 500;
          transition: opacity 0.2s ease;
        }

        .footer-esaf-link:hover {
          opacity: 0.78;
        }

        .footer-esaf-email {
          display: inline-block;
          color: #ffffff;
          text-decoration: none;
          font-size: 18px;
          line-height: 1.45;
          font-weight: 500;
          transition: opacity 0.2s ease;
        }

        .footer-esaf-email:hover {
          opacity: 0.78;
        }

        .footer-esaf-bottom {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 34px;
          padding-top: 92px;
        }

        .footer-esaf-socials {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 54px;
        }

        .footer-esaf-social {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          text-decoration: none;
          transition:
            transform 0.2s ease,
            opacity 0.2s ease;
        }

        .footer-esaf-social:hover {
          transform: translateY(-2px);
          opacity: 0.8;
        }

        .footer-esaf-social svg {
          width: 28px;
          height: 28px;
          fill: currentColor;
        }

        .footer-esaf-copyright {
          margin: 0;
          color: #ffffff;
          text-align: center;
          font-size: 16px;
          line-height: 1.5;
          letter-spacing: -0.02em;
        }

        @media (max-width: 1100px) {
          .footer-esaf-top {
            grid-template-columns: 1fr 1fr;
            gap: 48px 36px;
          }

          .footer-esaf-top-left {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 1024px) {
          .mega-menu-wrap {
            padding: 26px 24px 28px;
            overflow-y: auto;
          }

          .mega-menu-top {
            left: 24px;
            right: 24px;
            top: 24px;
            height: 40px;
          }

          .mega-menu-close {
            right: 0;
            top: 0;
            font-size: 16px;
            gap: 12px;
          }

          .mega-menu-close-line {
            width: 34px;
          }

          .mega-menu-logo {
            top: 68px;
          }

          .mega-menu-logo img {
            width: 74px;
            height: 74px;
          }

          .mega-menu-investors {
            font-size: 16px;
          }

          .mega-menu-body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: auto;
            padding-top: 160px;
            padding-left: 0;
            padding-right: 0;
            padding-bottom: 180px;
          }

          .mega-menu-left {
            position: absolute;
            left: 24px;
            bottom: 28px;
            width: auto;
            min-width: 0;
          }

          .mega-menu-left-bottom {
            width: 100%;
            padding-bottom: 0;
            gap: 12px;
          }

          .mega-menu-right {
            width: 100%;
            min-width: 0;
            padding-top: 0;
          }

          .mega-menu-main-links {
            gap: 6px;
            max-width: 100%;
          }

          .mega-menu-main-link {
            font-size: clamp(54px, 14.4vw, 86px);
            line-height: 1.05;
            white-space: normal;
          }

          .mega-menu-small-link {
            font-size: 24px;
          }

          .mega-menu-footer-links {
            right: 24px;
            bottom: 28px;
            max-width: 220px;
          }

          .mega-menu-footer-link {
            font-size: 16px;
          }

          .mega-menu-footer-link--email {
            font-size: 15px;
          }

          .status-ribbon {
            width: 88px;
            height: 88px;
            top: 0;
            left: 0;
          }

          .status-ribbon__inner {
            top: 16px;
            left: -32px;
            width: 124px;
            height: 22px;
            font-size: 7px;
          }


          .property-meta-gender {
            font-size: 12.5px;
          }
        }

        @media (max-width: 768px) {
          .navienty-logo-mobile,
          .menu-trigger {
            display: none !important;
          }

          .mobile-bottom-nav {
            display: block;
          }

          .mega-menu-body {
            padding-bottom: 220px;
          }

          .mega-menu-left {
            left: 24px;
            bottom: 24px;
          }

          .mega-menu-footer-links {
            left: 24px;
            right: 24px;
            bottom: 96px;
            align-items: flex-start;
            text-align: left;
            max-width: none;
            gap: 8px;
          }

          [dir='rtl'] .mega-menu-footer-links {
            align-items: flex-end;
            text-align: right;
          }

          .mega-menu-footer-link {
            font-size: 16px;
          }

          .mega-menu-footer-link--email {
            margin-top: 6px;
            font-size: 14px;
          }

          .footer-esaf-container {
            padding: 48px 22px 28px;
          }

          .footer-esaf-top {
            grid-template-columns: 1fr;
            gap: 34px;
          }

          .footer-esaf-title {
            font-size: 36px;
          }

          .footer-esaf-description {
            margin-top: 20px;
            font-size: 16px;
            line-height: 1.9;
          }

          .footer-esaf-heading {
            font-size: 22px;
            margin-bottom: 14px;
          }

          .footer-esaf-link,
          .footer-esaf-email {
            font-size: 17px;
          }

          .footer-esaf-bottom {
            padding-top: 56px;
            gap: 26px;
          }

          .footer-esaf-socials {
            gap: 34px;
            flex-wrap: wrap;
          }

          .footer-esaf-social svg {
            width: 24px;
            height: 24px;
          }

          .footer-esaf-copyright {
            font-size: 14px;
          }
        }


        @media (prefers-color-scheme: dark) {
          .menu-trigger-lines span {
            background: #f8fafc;
          }

          .property-meta-gender {
            color: #94a3b8;
          }

          .group:hover .property-meta-gender {
            color: #cbd5e1;
          }

          .mobile-bottom-nav {
            border-color: rgba(255, 255, 255, 0.16);
            background:
              linear-gradient(
                135deg,
                rgba(15, 23, 42, 0.78),
                rgba(15, 23, 42, 0.52)
              );
            box-shadow:
              0 18px 45px rgba(0, 0, 0, 0.36),
              0 6px 18px rgba(0, 0, 0, 0.24),
              inset 0 1px 0 rgba(255, 255, 255, 0.14),
              inset 0 -1px 0 rgba(255, 255, 255, 0.08);
          }

          .mobile-bottom-nav__item {
            color: #94a3b8;
          }

          .mobile-bottom-nav__item:hover {
            color: #f8fafc;
          }

          .mobile-bottom-nav__item--active {
            color: #60a5fa;
          }

          .mobile-bottom-nav__icon--image {
            filter: brightness(0) invert(1);
            opacity: 0.72;
          }

          .mobile-bottom-nav__item:hover .mobile-bottom-nav__icon--image,
          .mobile-bottom-nav__item--active .mobile-bottom-nav__icon--image {
            filter: brightness(0) invert(1);
            opacity: 1;
          }

          .popular-desktop-grid > a,
          .hide-scrollbar > a {
            color: #f8fafc;
          }
        }
      `}</style>

      <PropertiesHeader
        homeHref={buildPageLink()}
        searchBarProps={searchBarProps}
        t={{ startSearch: t.startSearch }}
      />

      <div className="mega-menu-overlay">
        <div className="mega-menu-wrap">
          <div className="mega-menu-top">
            <label
              htmlFor="nav-menu-toggle"
              className="mega-menu-close"
              aria-label="Close menu"
            >
              <span className="mega-menu-close-line" />
              <span>{t.close}</span>
            </label>

            <div className="mega-menu-logo">
              <Link href={buildPageLink()} aria-label="Navienty home">
                <img
                  src="https://i.ibb.co/5gYVYQSR/Navienty-1.jpg"
                  alt="Navienty"
                />
              </Link>
            </div>
          </div>

          <div className="mega-menu-body">
            <div className="mega-menu-left">
              <div className="mega-menu-left-spacer" />

              <div className="mega-menu-left-bottom">
                {socialMenuLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mega-menu-small-link"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="mega-menu-right">
              <div className="mega-menu-main-links">
                {primaryMenuLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="mega-menu-main-link"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mega-menu-footer-links">
              {menuFooterLinks.map((item) =>
                item.isEmail ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="mega-menu-footer-link mega-menu-footer-link--email"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="mega-menu-footer-link"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
        {showcaseSections.length > 0 && (
          <section className="mb-10 space-y-10 md:mb-14 md:space-y-12">
            {showcaseSections.map((section) => (
              <div key={`${section.type}-${section.id}`}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[19px] font-semibold tracking-tight text-gray-900 dark:text-slate-100 md:text-2xl">
                    <Link
                      href={buildSearchLink({
                        areaId:
                          section.type === 'area' ? section.id : undefined,
                        universityId:
                          section.type === 'university'
                            ? section.id
                            : undefined,
                      })}
                    >
                      {section.title}
                    </Link>
                  </h2>

                  <Link
                    href={buildSearchLink({
                      areaId:
                        section.type === 'area' ? section.id : undefined,
                      universityId:
                        section.type === 'university'
                          ? section.id
                          : undefined,
                    })}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 md:hidden"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-4 w-4 rtl:rotate-180"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </Link>
                </div>

                <div className="hide-scrollbar flex snap-x snap-mandatory gap-3.5 overflow-x-auto pb-4 md:gap-4 lg:hidden">
                  {section.items.map((property) => renderPropertyCard(property))}
                  {renderSeeAllCard(section.id, section.type, section.items)}
                </div>

                <div className="popular-desktop-grid hidden gap-4 pb-4 lg:grid lg:grid-cols-6">
                  {section.items.slice(0, 5).map((property) =>
                    renderPropertyCard(property)
                  )}
                  {renderSeeAllCard(section.id, section.type, section.items)}
                </div>
              </div>
            ))}
          </section>
        )}

      </div>

      <footer className="footer-esaf hidden md:block">
        <div className="footer-esaf-container">
          <div className="footer-esaf-top">
            <div className="footer-esaf-top-left">
              <h2 className={`${squadaOne.className} footer-esaf-title`}>
                {t.footerTitle}
              </h2>
            </div>

            <div>
              <h3 className="footer-esaf-heading">{t.quickLinks}</h3>
              <div className="footer-esaf-links">
                {footerQuickLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="footer-esaf-link"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="footer-esaf-heading">{t.contactUs}</h3>
              <a href={`mailto:${t.footerEmail}`} className="footer-esaf-email">
                {t.footerEmail}
              </a>
            </div>
          </div>

          <div className="footer-esaf-bottom">
            <p className="footer-esaf-copyright">{t.copyright}</p>
          </div>
        </div>
      </footer>

      <Script
        id="navienty-language-switcher-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              try {
                var storageKey = 'navienty-preferred-language';
                var switchers = document.querySelectorAll('[data-language-switcher="true"]');

                switchers.forEach(function (switcher) {
                  switcher.addEventListener('click', function () {
                    var nextLanguage = switcher.getAttribute('data-next-language');
                    if (nextLanguage === 'ar' || nextLanguage === 'en') {
                      localStorage.setItem(storageKey, nextLanguage);
                      document.documentElement.lang = nextLanguage;
                      document.documentElement.dir = nextLanguage === 'ar' ? 'rtl' : 'ltr';
                    }
                  });
                });
              } catch (error) {}
            })();
          `,
        }}
      />

      <Script
        id="mobile-bottom-nav-scroll-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              var NAV_ID = 'mobile-bottom-nav';
              var HIDDEN_CLASS = 'mobile-bottom-nav--hidden';
              var nav = null;
              var attached = false;
              var lastY = 0;
              var ticking = false;
              var touchStartY = null;
              var lastTouchY = null;
              var lastKnownDirection = 'up';
              var MIN_DELTA = 6;
              var HIDE_AFTER = 40;
              var TOP_REVEAL = 12;

              function isMobileViewport() {
                return window.matchMedia('(max-width: 768px)').matches;
              }

              function getWindowScrollY() {
                return Math.max(
                  0,
                  window.scrollY ||
                    window.pageYOffset ||
                    document.documentElement.scrollTop ||
                    document.body.scrollTop ||
                    0
                );
              }

              function getElementScrollTop(element) {
                if (!element || element === window || element === document) {
                  return getWindowScrollY();
                }

                if (element === document.body || element === document.documentElement) {
                  return getWindowScrollY();
                }

                return typeof element.scrollTop === 'number'
                  ? Math.max(0, element.scrollTop)
                  : getWindowScrollY();
              }

              function showNav() {
                if (!nav) return;
                nav.classList.remove(HIDDEN_CLASS);
                nav.style.transform = 'translate3d(0, 0, 0)';
                nav.style.opacity = '1';
                nav.style.pointerEvents = 'auto';
              }

              function hideNav() {
                if (!nav) return;
                nav.classList.add(HIDDEN_CLASS);
                nav.style.transform = 'translate3d(0, calc(100% + 64px), 0)';
                nav.style.opacity = '0';
                nav.style.pointerEvents = 'none';
              }

              function applyByDirection(direction, currentY) {
                if (!nav) return;

                if (!isMobileViewport()) {
                  showNav();
                  return;
                }

                if (currentY <= TOP_REVEAL) {
                  showNav();
                  return;
                }

                if (direction === 'down' && currentY > HIDE_AFTER) {
                  hideNav();
                  return;
                }

                if (direction === 'up') {
                  showNav();
                }
              }

              function handleScrollTarget(target) {
                var currentY = Math.max(getWindowScrollY(), getElementScrollTop(target));
                var delta = currentY - lastY;

                if (Math.abs(delta) < MIN_DELTA) {
                  ticking = false;
                  return;
                }

                lastKnownDirection = delta > 0 ? 'down' : 'up';
                applyByDirection(lastKnownDirection, currentY);
                lastY = currentY;
                ticking = false;
              }

              function requestScrollUpdate(event) {
                if (!isMobileViewport()) {
                  showNav();
                  return;
                }

                if (ticking) return;
                ticking = true;

                var target = event && event.target ? event.target : null;
                window.requestAnimationFrame(function () {
                  handleScrollTarget(target);
                });
              }

              function onWheel(event) {
                if (!isMobileViewport()) {
                  showNav();
                  return;
                }

                var deltaY = event && typeof event.deltaY === 'number' ? event.deltaY : 0;
                if (Math.abs(deltaY) < MIN_DELTA) return;

                lastKnownDirection = deltaY > 0 ? 'down' : 'up';
                applyByDirection(lastKnownDirection, Math.max(getWindowScrollY(), HIDE_AFTER + 1));
              }

              function onTouchStart(event) {
                if (!isMobileViewport() || !event.touches || event.touches.length === 0) return;

                touchStartY = event.touches[0].clientY;
                lastTouchY = touchStartY;
              }

              function onTouchMove(event) {
                if (
                  !isMobileViewport() ||
                  lastTouchY === null ||
                  !event.touches ||
                  event.touches.length === 0
                ) {
                  return;
                }

                var currentTouchY = event.touches[0].clientY;
                var deltaY = currentTouchY - lastTouchY;

                if (Math.abs(deltaY) < MIN_DELTA) return;

                lastKnownDirection = deltaY < 0 ? 'down' : 'up';

                // Important: we do not depend only on window.scrollY here because
                // some mobile layouts scroll inside an inner container, not the window.
                applyByDirection(
                  lastKnownDirection,
                  Math.max(getWindowScrollY(), HIDE_AFTER + 1)
                );

                lastTouchY = currentTouchY;
              }

              function onTouchEnd() {
                touchStartY = null;
                lastTouchY = null;
              }

              function onResize() {
                if (!isMobileViewport()) {
                  showNav();
                }
                lastY = getWindowScrollY();
              }

              function attach() {
                nav = document.getElementById(NAV_ID);
                if (!nav) return false;

                if (attached || nav.getAttribute('data-scroll-hide-ready') === 'true') {
                  return true;
                }

                attached = true;
                nav.setAttribute('data-scroll-hide-ready', 'true');
                nav.style.transition =
                  'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease, box-shadow 0.28s ease';
                nav.style.willChange = 'transform, opacity';

                lastY = getWindowScrollY();
                showNav();

                window.addEventListener('scroll', requestScrollUpdate, { passive: true });
                document.addEventListener('scroll', requestScrollUpdate, {
                  passive: true,
                  capture: true,
                });
                document.body &&
                  document.body.addEventListener('scroll', requestScrollUpdate, {
                    passive: true,
                    capture: true,
                  });

                window.addEventListener('wheel', onWheel, { passive: true });
                document.addEventListener('wheel', onWheel, { passive: true, capture: true });

                window.addEventListener('touchstart', onTouchStart, { passive: true });
                window.addEventListener('touchmove', onTouchMove, { passive: true });
                window.addEventListener('touchend', onTouchEnd, { passive: true });
                document.addEventListener('touchstart', onTouchStart, {
                  passive: true,
                  capture: true,
                });
                document.addEventListener('touchmove', onTouchMove, {
                  passive: true,
                  capture: true,
                });
                document.addEventListener('touchend', onTouchEnd, {
                  passive: true,
                  capture: true,
                });

                window.addEventListener('resize', onResize, { passive: true });
                window.addEventListener('orientationchange', onResize, { passive: true });
                window.addEventListener('pageshow', showNav);

                return true;
              }

              function boot() {
                if (attach()) return;

                var attempts = 0;
                var timer = window.setInterval(function () {
                  attempts += 1;
                  if (attach() || attempts > 80) {
                    window.clearInterval(timer);
                  }
                }, 100);

                if ('MutationObserver' in window) {
                  var observer = new MutationObserver(function () {
                    if (attach()) {
                      observer.disconnect();
                    }
                  });
                  observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                  });
                }
              }

              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', boot, { once: true });
              } else {
                boot();
              }
            })();
          `,
        }}
      />

      <nav
        id="mobile-bottom-nav"
        className="mobile-bottom-nav"
        aria-label="Mobile bottom navigation"
      >
        <div className="mobile-bottom-nav__inner">
          <Link
            href={buildPageLink()}
            className="mobile-bottom-nav__item mobile-bottom-nav__item--active"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.9}
              stroke="currentColor"
              className="mobile-bottom-nav__icon"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 16l4 4"
              />
            </svg>
            <span className="mobile-bottom-nav__label">{t.explore}</span>
          </Link>

          <Link
            href={buildSimpleNavLink('/community')}
            className="mobile-bottom-nav__item"
          >
            <img
              src="https://i.ibb.co/fzNcyyxw/community-3010762.png"
              alt={t.community}
              className="mobile-bottom-nav__icon mobile-bottom-nav__icon--image"
            />
            <span className="mobile-bottom-nav__label">{t.community}</span>
          </Link>

          <Link
            href={mobileLanguageHref}
            className="mobile-bottom-nav__item"
            aria-label={mobileLanguageAriaLabel}
            data-language-switcher="true"
            data-next-language={nextMobileLanguage}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.9}
              stroke="currentColor"
              className="mobile-bottom-nav__icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 9h16.5M3.75 15h16.5M12 3c2.25 2.45 3.35 5.35 3.35 9S14.25 18.55 12 21M12 3C9.75 5.45 8.65 8.35 8.65 12S9.75 18.55 12 21"
              />
            </svg>
            <span className="mobile-bottom-nav__label">
              {mobileLanguageLabel}
            </span>
          </Link>
        </div>
      </nav>
    </main>
  )
}
