import Link from 'next/link'
import { createClient } from '../../../src/lib/supabase/server'
import PropertiesHeader from '../PropertiesHeader'
import SortDropdown from './SortDropdown'
import { Squada_One } from 'next/font/google'

const squadaOne = Squada_One({
  subsets: ['latin'],
  weight: '400',
})

type SearchParams = {
  rental_duration?: string
  city_id?: string
  university_id?: string
  price_range?: string
  lang?: string
  currency?: string
  page?: string
  sort?: string
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

type PropertyImage = {
  image_url?: string | null
}

type Property = {
  id: string | number
  property_id: string
  title_en: string
  title_ar: string
  price_egp: number
  rental_duration: string
  availability_status: string
  city_id?: string | number | null
  university_id?: string | number | null
  property_images?: PropertyImage[] | null
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
type SupportedSort =
  | 'newly_listed'
  | 'lowest_price'
  | 'highest_price'
  | 'boys'
  | 'girls'

type NormalizedAvailabilityStatus =
  | 'available'
  | 'reserved'
  | 'unavailable'
  | 'unknown'

const TRANSLATIONS = {
  en: {
    stay: 'stay',
    night: 'night',
    month: 'month',
    city: 'City',
    university: 'University',
    duration: 'Duration',
    searchCities: 'Search cities',
    chooseUniversity: 'Choose university',
    chooseDuration: 'Choose duration',
    selectCity: 'Select city',
    selectUniversity: 'Select university',
    selectDuration: 'Select duration',
    anyCity: 'Any city',
    anyUniversity: 'Any university',
    anyDuration: 'Any duration',
    daily: 'Daily',
    monthly: 'Monthly',
    available: 'Available',
    unavailable: 'Unavailable',
    reserved: 'Reserved',
    startSearch: 'Start your search',
    searchResults: 'Search Results',
    noResults: 'No properties found matching your search.',
    sortBy: 'Sort By',
    newlyListed: 'Newly listed',
    lowestPrice: 'Lowest price',
    highestPrice: 'Highest price',
    boys: 'Stays for Boys',
    girls: 'Stays for Girls',
    close: 'Close',
    login: 'Log in or sign up',
    join: 'Join our community',
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
    community: 'Community',
    account: 'Account',
    mobileLogin: 'Log in',
    copyright: `© ${new Date().getFullYear()} Navienty | All rights reserved.`,
  },
  ar: {
    stay: 'إقامة',
    night: 'ليلة',
    month: 'شهر',
    city: 'المدينة',
    university: 'الجامعة',
    duration: 'المدة',
    searchCities: 'ابحث عن مدينة',
    chooseUniversity: 'اختر الجامعة',
    chooseDuration: 'اختر المدة',
    selectCity: 'اختر المدينة',
    selectUniversity: 'اختر الجامعة',
    selectDuration: 'اختر المدة',
    anyCity: 'أي مدينة',
    anyUniversity: 'أي جامعة',
    anyDuration: 'أي مدة',
    daily: 'يومي',
    monthly: 'شهري',
    available: 'متاح',
    unavailable: 'غير متاح',
    reserved: 'محجوز',
    startSearch: 'ابدأ بحثك',
    searchResults: 'نتائج البحث',
    noResults: 'لم يتم العثور على عقارات تطابق بحثك.',
    sortBy: 'ترتيب حسب',
    newlyListed: 'الأحدث',
    lowestPrice: 'الأقل سعرًا',
    highestPrice: 'الأعلى سعرًا',
    boys: 'منازل للأولاد',
    girls: 'منازل للبنات',
    close: 'إغلاق',
    login: 'سجّل الدخول أو أنشئ حسابًا',
    join: 'انضم إلى مجتمعنا',
    facebook: 'فيسبوك',
    instagram: 'إنستجرام',
    linkedIn: 'لينكدإن',
    footerTitle: 'نظرة إلى المستقبل.',
    quickLinks: 'روابط سريعة',
    aboutUs: 'من نحن',
    board: 'الإدارة',
    contact: 'تواصل معنا',
    contactUs: 'تواصل معنا',
    footerEmail: 'info@navienty.com',
    explore: 'استكشاف',
    community: 'المجتمع',
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

function normalizeSort(value?: string): SupportedSort {
  if (value === 'lowest_price') return 'lowest_price'
  if (value === 'highest_price') return 'highest_price'
  if (value === 'boys') return 'boys'
  if (value === 'girls') return 'girls'
  return 'newly_listed'
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

  if (normalized === 'unavailable' || normalized === 'inactive') {
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

async function getCurrencyRate(currency: SupportedCurrency) {
  if (currency === 'EGP') return 1

  const accessKey = process.env.EXCHANGERATE_API_KEY
  if (!accessKey) return 1

  try {
    const cacheBust = Date.now().toString()

    const response = await fetch(
      `https://api.exchangerate.host/live?access_key=${accessKey}&currencies=EGP,${currency}&v=${cacheBust}`,
      { cache: 'no-store' }
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

function buildVisiblePages(currentPage: number, totalPages: number) {
  const pages: (number | 'dots')[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
    return pages
  }

  pages.push(1)

  if (currentPage > 3) pages.push('dots')

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (currentPage < totalPages - 2) pages.push('dots')

  pages.push(totalPages)

  return pages
}

export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const selectedLanguage = normalizeLanguage(params.lang)
  const selectedCurrency = normalizeCurrency(params.currency)
  const selectedSort = normalizeSort(params.sort)
  const t = TRANSLATIONS[selectedLanguage]
  const isArabic = selectedLanguage === 'ar'
  const currencyRate = await getCurrencyRate(selectedCurrency)

  const PAGE_SIZE = 12
  const currentPage = Math.max(1, Number.parseInt(params.page || '1', 10) || 1)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoggedIn = !!user

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name_en, name_ar')
    .order('name_en', { ascending: true })

  const { data: universities } = await supabase
    .from('universities')
    .select('id, name_en, name_ar, city_id')
    .order('name_en', { ascending: true })

  let query = supabase
    .from('properties')
    .select(
      'id, property_id, title_en, title_ar, price_egp, rental_duration, availability_status, city_id, university_id, property_images(image_url)',
      { count: 'exact' }
    )
    .eq('admin_status', 'published')
    .eq('is_active', true)
    .neq('availability_status', 'unavailable')

  if (params.city_id) query = query.eq('city_id', params.city_id)
  if (params.university_id)
    query = query.eq('university_id', params.university_id)
  if (params.rental_duration)
    query = query.eq('rental_duration', params.rental_duration)

  if (selectedSort === 'boys' || selectedSort === 'girls') {
    query = query.eq('gender', selectedSort)
  }

  if (selectedSort === 'lowest_price') {
    query = query.order('price_egp', { ascending: true }).order('created_at', {
      ascending: false,
    })
  } else if (selectedSort === 'highest_price') {
    query = query.order('price_egp', { ascending: false }).order('created_at', {
      ascending: false,
    })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: properties, count } = await query.range(from, to)

  const sortedProperties = (((properties as Property[]) ?? []).sort((a, b) => {
    const availabilityDiff =
      getAvailabilityRank(a.availability_status) -
      getAvailabilityRank(b.availability_status)

    if (availabilityDiff !== 0) return availabilityDiff

    if (selectedSort === 'lowest_price') return a.price_egp - b.price_egp
    if (selectedSort === 'highest_price') return b.price_egp - a.price_egp

    return 0
  }))

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 0
  const visiblePages = buildVisiblePages(currentPage, totalPages)

  const buildPropertiesPageLink = () => {
    const p = new URLSearchParams()
    p.set('lang', selectedLanguage)
    p.set('currency', selectedCurrency)
    return `/properties?${p.toString()}`
  }

  const buildSimpleNavLink = (path: string) => {
    const p = new URLSearchParams()
    p.set('lang', selectedLanguage)
    p.set('currency', selectedCurrency)
    return `${path}?${p.toString()}`
  }

  const buildPropertyHref = (propertyId: string) => {
    const p = new URLSearchParams()
    p.set('lang', selectedLanguage)
    p.set('currency', selectedCurrency)
    return `/properties/${propertyId}?${p.toString()}`
  }

  const buildPageLink = (pageNumber: number) => {
    const p = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value && key !== 'page') p.set(key, value)
    })

    p.set('lang', selectedLanguage)
    p.set('currency', selectedCurrency)
    p.set('sort', selectedSort)
    p.set('page', pageNumber.toString())

    return `/properties/search?${p.toString()}`
  }

  const buildSortLink = (sortValue: SupportedSort) => {
    const p = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value && key !== 'page' && key !== 'sort') p.set(key, value)
    })

    p.set('lang', selectedLanguage)
    p.set('currency', selectedCurrency)
    p.set('sort', sortValue)

    return `/properties/search?${p.toString()}`
  }

  const sortOptions = [
    {
      value: 'newly_listed' as SupportedSort,
      label: t.newlyListed,
      href: buildSortLink('newly_listed'),
    },
    {
      value: 'lowest_price' as SupportedSort,
      label: t.lowestPrice,
      href: buildSortLink('lowest_price'),
    },
    {
      value: 'highest_price' as SupportedSort,
      label: t.highestPrice,
      href: buildSortLink('highest_price'),
    },
    {
      value: 'boys' as SupportedSort,
      label: t.boys,
      href: buildSortLink('boys'),
    },
    {
      value: 'girls' as SupportedSort,
      label: t.girls,
      href: buildSortLink('girls'),
    },
  ]

  const primaryMenuLinks = [
    { label: t.login, href: buildSimpleNavLink('/login') },
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

  const searchBarProps = {
    cities: (cities as City[]) ?? [],
    universities: (universities as University[]) ?? [],
    initialCityId: params.city_id ?? '',
    initialUniversityId: params.university_id ?? '',
    initialRentalDuration: params.rental_duration ?? '',
    initialPriceRange: params.price_range ?? '',
    language: selectedLanguage,
    currency: selectedCurrency,
    labels: {
      city: t.city,
      university: t.university,
      duration: t.duration,
      searchCities: t.searchCities,
      chooseUniversity: t.chooseUniversity,
      chooseDuration: t.chooseDuration,
      selectCity: t.selectCity,
      selectUniversity: t.selectUniversity,
      selectDuration: t.selectDuration,
      anyCity: t.anyCity,
      anyUniversity: t.anyUniversity,
      anyDuration: t.anyDuration,
      daily: t.daily,
      monthly: t.monthly,
    },
  }

  const getFirstImage = (property: Property) => {
    if (!property.property_images || property.property_images.length === 0) {
      return null
    }

    return property.property_images[0]?.image_url || null
  }

  const renderPropertyImage = (property: Property, badgeText: string) => {
    const firstImage = getFirstImage(property)
    const normalizedStatus = normalizeAvailabilityStatusForUi(
      property.availability_status
    )

    const isReserved = normalizedStatus === 'reserved'
    const isAvailable = normalizedStatus === 'available'

    return (
      <div className="property-media-card group/image relative aspect-[4/3] overflow-hidden rounded-[18px] bg-gray-100 shadow-[0_10px_30px_rgba(15,23,42,0.10)] md:rounded-[28px]">
        {firstImage ? (
          <img
            src={firstImage}
            alt={property.title_en}
            className="h-full w-full object-cover transition duration-700 group-hover/image:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 transition duration-700 group-hover/image:scale-[1.03]" />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 via-black/5 to-transparent" />

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

  const renderPropertyCard = (property: Property) => (
    <Link
      key={property.id}
      href={buildPropertyHref(property.property_id)}
      className="group block"
    >
      {renderPropertyImage(
        property,
        translateAvailabilityStatus(
          property.availability_status,
          selectedLanguage
        )
      )}

      <div className="mt-3 space-y-1 md:mt-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug tracking-[-0.02em] text-slate-900 md:text-[17px]">
            {isArabic ? property.title_ar : property.title_en}
          </h3>
        </div>

        <p className="truncate text-[12px] capitalize text-slate-500 md:text-[13px]">
          {translateRentalDuration(property.rental_duration, selectedLanguage)}{' '}
          {t.stay}
        </p>

        <p className="truncate pt-0.5 text-[13px] md:pt-1 md:text-[14px]">
          <span className="font-semibold text-slate-950">
            {formatPrice(
              property.price_egp,
              selectedCurrency,
              selectedLanguage,
              currencyRate
            )}
          </span>{' '}
          <span className="text-[11px] text-slate-500 md:text-[12px]">
            / {property.rental_duration === 'daily' ? t.night : t.month}
          </span>
        </p>
      </div>
    </Link>
  )

  const mobileAccountHref = isLoggedIn
    ? buildSimpleNavLink('/account')
    : buildSimpleNavLink('/login')

  const mobileAccountLabel = isLoggedIn ? t.account : t.mobileLogin

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="relative min-h-screen bg-white pb-24 text-gray-700 md:pb-0"
    >
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

        .property-media-card {
          isolation: isolate;
        }

        .status-ribbon {
          position: absolute;
          top: -10px;
          left: -10px;
          width: 150px;
          height: 150px;
          overflow: hidden;
          z-index: 30;
          pointer-events: none;
        }

        .status-ribbon__inner {
          position: absolute;
          top: 34px;
          left: -42px;
          width: 210px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(-45deg);
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          box-shadow:
            0 10px 22px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.22);
          transition:
            transform 0.35s ease,
            filter 0.35s ease,
            box-shadow 0.35s ease;
        }

        .status-ribbon::after {
          content: '';
          position: absolute;
          width: 12px;
          height: 12px;
          left: 0;
          bottom: 0;
          z-index: -1;
        }

        .status-ribbon--available .status-ribbon__inner {
          background-image: linear-gradient(
            135deg,
            #0b8f63 0%,
            #18b57d 45%,
            #34d399 100%
          );
        }

        .status-ribbon--available::after {
          box-shadow: 138px -138px #06664a;
          background: linear-gradient(135deg, #0a7a56 0%, #0f5e45 100%);
        }

        .status-ribbon--reserved .status-ribbon__inner {
          background-image: linear-gradient(
            135deg,
            #c81e4b 0%,
            #e63b68 45%,
            #fb7185 100%
          );
        }

        .status-ribbon--reserved::after {
          box-shadow: 138px -138px #8f1239;
          background: linear-gradient(135deg, #9f1239 0%, #7f1d1d 100%);
        }

        .group:hover .status-ribbon__inner {
          transform: rotate(-45deg) scale(1.03);
          filter: saturate(1.06) brightness(1.02);
          box-shadow:
            0 14px 26px rgba(0, 0, 0, 0.32),
            inset 0 1px 0 rgba(255, 255, 255, 0.26);
        }

        .mobile-bottom-nav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 120;
          display: none;
          background: rgba(255, 255, 255, 0.96);
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 8px);
          box-shadow: 0 -8px 30px rgba(15, 23, 42, 0.08);
        }

        .mobile-bottom-nav__inner {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: center;
          height: 64px;
          padding: 0 8px;
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

        .mobile-bottom-nav__icon {
          width: 22px;
          height: 22px;
          display: block;
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

          .mega-menu-body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: auto;
            padding-top: 160px;
            padding-left: 0;
            padding-right: 0;
            padding-bottom: 140px;
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

          .status-ribbon {
            width: 132px;
            height: 132px;
            top: -8px;
            left: -8px;
          }

          .status-ribbon__inner {
            top: 31px;
            left: -40px;
            width: 190px;
            height: 38px;
            font-size: 10px;
            letter-spacing: 0.16em;
          }

          .status-ribbon--available::after,
          .status-ribbon--reserved::after {
            box-shadow: 120px -120px currentColor;
          }

          .status-ribbon--available::after {
            color: #06664a;
          }

          .status-ribbon--reserved::after {
            color: #8f1239;
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

          .footer-esaf-copyright {
            font-size: 14px;
          }
        }
      `}</style>

      <PropertiesHeader
        homeHref={buildPropertiesPageLink()}
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
              <Link href={buildPropertiesPageLink()} aria-label="Navienty home">
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
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1
            className={`${squadaOne.className} text-[28px] tracking-tight text-slate-900 md:text-[34px]`}
          >
            {t.searchResults}
          </h1>

          <SortDropdown
            isArabic={isArabic}
            selectedSort={selectedSort}
            sortByLabel={t.sortBy}
            options={sortOptions}
          />
        </div>

        {sortedProperties.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {sortedProperties.map((property) => renderPropertyCard(property))}
            </div>

            {totalPages > 1 && (
              <div
                className="mt-14 flex items-center justify-center gap-2 py-4 md:mt-16"
                dir="ltr"
              >
                <Link
                  href={buildPageLink(currentPage - 1)}
                  aria-disabled={currentPage === 1}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                    currentPage === 1
                      ? 'pointer-events-none text-gray-300'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.2}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5 8.25 12l7.5-7.5"
                    />
                  </svg>
                </Link>

                <div className="flex items-center gap-2 md:gap-3">
                  {visiblePages.map((item, index) =>
                    item === 'dots' ? (
                      <span
                        key={`dots-${index}`}
                        className="flex h-10 min-w-[24px] items-center justify-center text-[18px] font-semibold text-gray-500"
                      >
                        ...
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={buildPageLink(item)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-[16px] font-semibold transition ${
                          currentPage === item
                            ? 'bg-[#222222] text-white'
                            : 'text-[#222222] hover:bg-gray-100'
                        }`}
                      >
                        {item}
                      </Link>
                    )
                  )}
                </div>

                <Link
                  href={buildPageLink(currentPage + 1)}
                  aria-disabled={currentPage === totalPages}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                    currentPage === totalPages
                      ? 'pointer-events-none text-gray-300'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.2}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 py-20 text-center">
            <p className="text-lg text-slate-500">{t.noResults}</p>
          </div>
        )}
      </section>

      <footer className="footer-esaf">
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

      <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
        <div className="mobile-bottom-nav__inner">
          <Link
            href={buildPropertiesPageLink()}
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
                d="M12 20.25s-6.75-4.35-9-8.25C1.2 8.7 3.3 4.5 7.5 4.5c2.1 0 3.45 1.2 4.5 2.55 1.05-1.35 2.4-2.55 4.5-2.55 4.2 0 6.3 4.2 4.5 7.5-2.25 3.9-9 8.25-9 8.25Z"
              />
            </svg>
            <span className="mobile-bottom-nav__label">{t.community}</span>
          </Link>

          <Link href={mobileAccountHref} className="mobile-bottom-nav__item">
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
                d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 19.125a7.5 7.5 0 0 1 15 0"
              />
            </svg>
            <span className="mobile-bottom-nav__label">
              {mobileAccountLabel}
            </span>
          </Link>
        </div>
      </nav>
    </main>
  )
}