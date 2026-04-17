import Link from 'next/link'
import type { ReactNode } from 'react'

import { createClient } from '../../../src/lib/supabase/server'
import LanguageDropdown from '../LanguageDropdown'
import ServicesSearchBar from '../ServicesSearchBar'

type SearchParams = {
  city_id?: string
  university_id?: string
  category_id?: string
  subcategory_id?: string
  lang?: string
  currency?: string
  page?: string
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

type ServiceProvider = {
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
  whatsapp_number?: string | null
  whatsapp_message_template?: string | null
  is_featured?: boolean | null
  is_active?: boolean | null
  discount_percentage?: number | null
  discount_title_en?: string | null
  discount_title_ar?: string | null
  service_provider_assets?: ServiceAsset[] | null
  service_provider_universities?: ServiceProviderUniversity[] | null
  service_provider_subcategories?: ServiceProviderSubcategoryRelation[] | null
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
    city: 'City',
    university: 'University',
    category: 'Category',
    subcategory: 'Subcategory',
    searchCities: 'Search cities',
    chooseUniversity: 'Choose university',
    chooseCategory: 'Choose category',
    selectCity: 'Select city',
    selectUniversity: 'Select university',
    selectCategory: 'Select category',
    selectCityFirst: 'Choose city first',
    anyCity: 'Any city',
    anyUniversity: 'Any university',
    anyCategory: 'Any category',
    startSearch: 'Start your search',
    searchResults: 'Search Results',
    noResults: 'No services found matching your search.',
    trustedService: 'Trusted service',
    studentDiscount: 'Student discount',
    contactOnWhatsApp: 'Contact on WhatsApp',
    viewDetails: 'View details',
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
    city: 'المدينة',
    university: 'الجامعة',
    category: 'الفئة',
    subcategory: 'التصنيف الفرعي',
    searchCities: 'ابحث عن مدينة',
    chooseUniversity: 'اختر الجامعة',
    chooseCategory: 'اختر الفئة',
    selectCity: 'اختر المدينة',
    selectUniversity: 'اختر الجامعة',
    selectCategory: 'اختر الفئة',
    selectCityFirst: 'اختر المدينة أولًا',
    anyCity: 'أي مدينة',
    anyUniversity: 'أي جامعة',
    anyCategory: 'أي فئة',
    startSearch: 'ابدأ بحثك',
    searchResults: 'نتائج البحث',
    noResults: 'لم يتم العثور على خدمات تطابق بحثك.',
    trustedService: 'خدمة موثوقة',
    studentDiscount: 'خصم للطلاب',
    contactOnWhatsApp: 'تواصل على واتساب',
    viewDetails: 'عرض التفاصيل',
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

function HomeNavIcon({
  className = '',
}: {
  className?: string
}) {
  return (
    <img
      src="https://i.ibb.co/vCgqsdFp/home.png"
      alt="Home"
      className={`object-contain ${className}`}
    />
  )
}

function ServicesNavIcon({
  className = '',
}: {
  className?: string
}) {
  return (
    <img
      src="https://i.ibb.co/vvg4L37Z/settings.png"
      alt="Services"
      className={`object-contain ${className}`}
    />
  )
}

function CareerNavIcon({
  className = '',
}: {
  className?: string
}) {
  return (
    <img
      src="https://i.ibb.co/kV4SdYVK/business.png"
      alt="Career"
      className={`object-contain ${className}`}
    />
  )
}

function MarketPlaceNavIcon({
  className = '',
}: {
  className?: string
}) {
  return (
    <img
      src="https://i.ibb.co/4ZG5y0SG/store.png"
      alt="MarketPlace"
      className={`object-contain ${className}`}
    />
  )
}

function LostNavIcon({
  className = '',
}: {
  className?: string
}) {
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
        service_provider_universities:
          provider.service_provider_universities ?? [],
        service_provider_subcategories:
          provider.service_provider_subcategories ?? [],
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

    const uniqueAssets = Array.from(
      new Map(
        mergedAssets.map((asset, index) => [
          `${asset.file_url ?? ''}-${asset.asset_type ?? ''}-${asset.sort_order ?? index}`,
          asset,
        ])
      ).values()
    )

    const uniqueUniversities = Array.from(
      new Map(
        mergedUniversities.map((item) => [String(item.university_id), item])
      ).values()
    )

    const uniqueSubcategories = Array.from(
      new Map(
        mergedSubcategories.map((item) => [String(item.subcategory_id), item])
      ).values()
    )

    map.set(key, {
      ...existing,
      ...provider,
      service_provider_assets: uniqueAssets,
      service_provider_universities: uniqueUniversities,
      service_provider_subcategories: uniqueSubcategories,
    })
  }

  return Array.from(map.values())
}

function getUniqueProviderUniversityIds(provider: ServiceProvider): string[] {
  return Array.from(
    new Set(
      [
        provider.primary_university_id
          ? String(provider.primary_university_id)
          : null,
        ...((provider.service_provider_universities ?? []).map((item) =>
          String(item.university_id)
        )),
      ].filter(Boolean) as string[]
    )
  )
}

function getUniqueProviderSubcategoryIds(provider: ServiceProvider): string[] {
  return Array.from(
    new Set(
      (provider.service_provider_subcategories ?? []).map((item) =>
        String(item.subcategory_id)
      )
    )
  )
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

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (currentPage < totalPages - 2) pages.push('dots')

  pages.push(totalPages)

  return pages
}

export default async function ServicesSearchResultsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const selectedLanguage = normalizeLanguage(params.lang)
  const selectedCurrency = normalizeCurrency(params.currency)
  const t = TRANSLATIONS[selectedLanguage]
  const isArabic = selectedLanguage === 'ar'

  const PAGE_SIZE = 12
  const currentPage = Math.max(1, Number.parseInt(params.page || '1', 10) || 1)

  const supabase = await createClient()

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name_en, name_ar')
    .order('name_en', { ascending: true })

  const { data: universities } = await supabase
    .from('universities')
    .select('id, name_en, name_ar, city_id')
    .order('name_en', { ascending: true })

  const { data: categories } = await supabase
    .from('service_categories')
    .select('id, slug, name_en, name_ar, icon, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const { data: subcategories } = await supabase
    .from('service_subcategories')
    .select(
      'id, category_id, slug, name_en, name_ar, icon, sort_order, is_active'
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const { data: providers } = await supabase
    .from('service_providers')
    .select(
      `
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
        whatsapp_number,
        whatsapp_message_template,
        is_featured,
        is_active,
        discount_percentage,
        discount_title_en,
        discount_title_ar,
        service_provider_assets(file_url, asset_type, sort_order),
        service_provider_universities(university_id),
        service_provider_subcategories(subcategory_id)
      `
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1000)

  const serviceCategories = (categories as ServiceCategory[]) ?? []
  const serviceSubcategories = (subcategories as ServiceSubcategory[]) ?? []
  const allProviders = dedupeProvidersById(
    ((providers as ServiceProvider[]) ?? []).filter(
      (provider) => provider.is_active !== false
    )
  )

  const categoryMap = new Map<string, ServiceCategory>()
  for (const category of serviceCategories) {
    categoryMap.set(String(category.id), category)
  }

  const subcategoryMap = new Map<string, ServiceSubcategory>()
  for (const subcategory of serviceSubcategories) {
    subcategoryMap.set(String(subcategory.id), subcategory)
  }

  let filteredProviders = allProviders

  if (params.city_id) {
    filteredProviders = filteredProviders.filter(
      (provider) => String(provider.city_id) === String(params.city_id)
    )
  }

  if (params.university_id) {
    filteredProviders = filteredProviders.filter((provider) => {
      const linkedUniversityIds = getUniqueProviderUniversityIds(provider)
      return linkedUniversityIds.includes(String(params.university_id))
    })
  }

  if (params.category_id) {
    filteredProviders = filteredProviders.filter(
      (provider) => String(provider.category_id) === String(params.category_id)
    )
  }

  if (params.subcategory_id) {
    filteredProviders = filteredProviders.filter((provider) =>
      getUniqueProviderSubcategoryIds(provider).includes(
        String(params.subcategory_id)
      )
    )
  }

  const totalFilteredCount = filteredProviders.length
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / PAGE_SIZE))
  const visiblePages = buildVisiblePages(currentPage, totalPages)

  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE
  const paginatedProviders = filteredProviders.slice(from, to)

  const buildSimpleNavLink = (path: string) => {
    const p = new URLSearchParams()
    p.set('lang', selectedLanguage)
    p.set('currency', selectedCurrency)
    return `${path}?${p.toString()}`
  }

  const buildServicesHomeLink = () => {
    const p = new URLSearchParams()
    p.set('lang', selectedLanguage)
    p.set('currency', selectedCurrency)
    return `/services?${p.toString()}`
  }

  const buildServiceHref = (provider: ServiceProvider) => {
    const p = new URLSearchParams()
    p.set('lang', selectedLanguage)
    p.set('currency', selectedCurrency)

    if (params.city_id) p.set('city_id', params.city_id)
    if (params.university_id) p.set('university_id', params.university_id)
    if (params.category_id) p.set('category_id', params.category_id)
    if (params.subcategory_id) p.set('subcategory_id', params.subcategory_id)

    const identifier = provider.slug || String(provider.id)
    const providerCategory = categoryMap.get(String(provider.category_id))

    if (providerCategory?.slug === 'restaurants') {
      return `/services/restaurants/${identifier}?${p.toString()}`
    }

    return `/services/${identifier}?${p.toString()}`
  }

  const buildPageLink = (pageNumber: number) => {
    const p = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value && key !== 'page') p.set(key, value)
    })

    p.set('lang', selectedLanguage)
    p.set('currency', selectedCurrency)
    p.set('page', pageNumber.toString())

    return `/services/search?${p.toString()}`
  }

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

    return preferred?.file_url || ''
  }

  const getCategoryName = (categoryId: string | number) => {
    const category = serviceCategories.find(
      (item) => String(item.id) === String(categoryId)
    )

    if (!category) return ''

    return isArabic ? category.name_ar : category.name_en
  }

  const getSubcategoryName = (subcategoryId?: string) => {
    if (!subcategoryId) return ''

    const subcategory = subcategoryMap.get(String(subcategoryId))
    if (!subcategory) return ''

    return isArabic ? subcategory.name_ar : subcategory.name_en
  }

  const getResultsTitle = () => {
    const subcategoryName = getSubcategoryName(params.subcategory_id)
    if (subcategoryName) {
      return isArabic ? `${t.searchResults} - ${subcategoryName}` : `${t.searchResults} - ${subcategoryName}`
    }

    const categoryName = params.category_id
      ? getCategoryName(params.category_id)
      : ''

    if (categoryName) {
      return isArabic ? `${t.searchResults} - ${categoryName}` : `${t.searchResults} - ${categoryName}`
    }

    return t.searchResults
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

  const searchBarProps = {
    cities: (cities as City[]) ?? [],
    universities: (universities as University[]) ?? [],
    categories: serviceCategories,
    initialCityId: params.city_id ?? '',
    initialUniversityId: params.university_id ?? '',
    initialCategoryId: params.category_id ?? '',
    language: selectedLanguage,
    currency: selectedCurrency,
    labels: {
      city: t.city,
      university: t.university,
      category: t.category,
      searchCities: t.searchCities,
      chooseUniversity: t.chooseUniversity,
      chooseCategory: t.chooseCategory,
      selectCity: t.selectCity,
      selectUniversity: t.selectUniversity,
      selectCategory: t.selectCategory,
      selectCityFirst: t.selectCityFirst,
      anyCity: t.anyCity,
      anyUniversity: t.anyUniversity,
      anyCategory: t.anyCategory,
    },
  }

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="relative min-h-screen bg-white pb-20 text-gray-700 md:pb-0"
    >
      <header className="border-b border-gray-200 bg-white md:bg-[#f7f7f7] sticky top-0 md:static z-40 shadow-sm md:shadow-none">
        <div className="md:hidden w-full bg-white pb-1 pt-1">
          <details className="group [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-3.5 shadow-[0_3px_10px_rgba(0,0,0,0.08)] mx-4 mt-2 mb-4 transition-shadow hover:shadow-md list-none">
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
              <span className="text-[14px] font-semibold text-gray-900 leading-none translate-y-[1px] text-center">
                {t.startSearch}
              </span>
            </summary>

            <div className="px-4 pb-4">
              <ServicesSearchBar {...searchBarProps} />
            </div>
          </details>

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

          <div className="flex justify-center pb-10 pt-3">
            <ServicesSearchBar {...searchBarProps} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {getResultsTitle()}
          </h1>
        </div>

        {paginatedProviders.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedProviders.map((provider) => {
                const providerName = isArabic
                  ? provider.name_ar || provider.name_en
                  : provider.name_en || provider.name_ar || ''

                const imageUrl = getProviderImage(provider)

                return (
                  <Link
                    key={provider.id}
                    href={buildServiceHref(provider)}
                    className="group block"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl md:rounded-3xl bg-gray-100 shadow-sm">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                          alt={providerName}
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300" />
                      )}

                      <div className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm border bg-white/95 text-gray-800 border-black/5">
                        {getCategoryName(provider.category_id)}
                      </div>
                    </div>

                    <div className="mt-3 space-y-1">
                      <h3 className="text-[16px] font-semibold text-gray-900 line-clamp-1">
                        {providerName}
                      </h3>

                      {provider.discount_percentage ? (
                        <p className="text-sm font-semibold text-green-700">
                          {t.studentDiscount}: {provider.discount_percentage}%
                        </p>
                      ) : null}
                    </div>
                  </Link>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div
                className="mt-14 md:mt-16 flex items-center justify-center gap-2 py-8 md:py-10"
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
                    className="w-5 h-5"
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
                    className="w-5 h-5"
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
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">{t.noResults}</p>
          </div>
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
    </main>
  )
}