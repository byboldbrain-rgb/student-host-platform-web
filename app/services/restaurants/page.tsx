
import Link from 'next/link'
import type { ReactNode } from 'react'
import { createClient } from '../../../src/lib/supabase/server'
import RestaurantsSearchBar from './RestaurantsSearchBar'
import LanguageDropdown from '../LanguageDropdown'

import {
  CareerAnimatedIcon,
  HomesAnimatedIcon,
  ServicesAnimatedIcon,
} from '../AnimatedTopNavIcons'

type SearchParams = {
  lang?: string
  currency?: string
  city_id?: string
  university_id?: string
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

type ServiceAsset = {
  file_url?: string | null
  asset_type?: string | null
  sort_order?: number | null
}

type ServiceProviderUniversity = {
  university_id: string | number
}

type RestaurantProvider = {
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
  service_provider_assets?: ServiceAsset[] | null
  service_provider_universities?: ServiceProviderUniversity[] | null
}

const TRANSLATIONS = {
  en: {
    homes: 'Homes',
    services: 'Services',
    career: 'Career',
    restaurants: 'Restaurants',
    startSearch: 'Start your search',
    allRestaurants: 'All restaurants',
    noRestaurants: 'No restaurants available yet.',
    city: 'City',
    university: 'University',
    keyword: 'Search',
    searchCities: 'Search cities',
    chooseUniversity: 'Choose university',
    selectCity: 'Select city',
    selectUniversity: 'Select university',
    anyCity: 'Any city',
    anyUniversity: 'Any university',
    searchPlaceholder: 'Search by restaurant name',
    openRestaurant: 'Open restaurant',
  },
  ar: {
    homes: 'المنازل',
    services: 'الخدمات',
    career: 'الوظائف',
    restaurants: 'المطاعم',
    startSearch: 'ابدأ بحثك',
    allRestaurants: 'كل المطاعم',
    noRestaurants: 'لا توجد مطاعم متاحة حالياً.',
    city: 'المدينة',
    university: 'الجامعة',
    keyword: 'بحث',
    searchCities: 'ابحث عن مدينة',
    chooseUniversity: 'اختر الجامعة',
    selectCity: 'اختر المدينة',
    selectUniversity: 'اختر الجامعة',
    anyCity: 'أي مدينة',
    anyUniversity: 'أي جامعة',
    searchPlaceholder: 'ابحث باسم المطعم',
    openRestaurant: 'فتح المطعم',
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

function dedupeProvidersById(
  providers: RestaurantProvider[]
): RestaurantProvider[] {
  const map = new Map<string, RestaurantProvider>()

  for (const provider of providers) {
    const key = String(provider.id)

    if (!map.has(key)) {
      map.set(key, {
        ...provider,
        service_provider_assets: provider.service_provider_assets ?? [],
        service_provider_universities:
          provider.service_provider_universities ?? [],
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

    map.set(key, {
      ...existing,
      ...provider,
      service_provider_assets: uniqueAssets,
      service_provider_universities: uniqueUniversities,
    })
  }

  return Array.from(map.values())
}

function getUniqueProviderUniversityIds(
  provider: RestaurantProvider
): string[] {
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

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { lang, currency, city_id, university_id, q } = await searchParams

  const selectedLanguage = normalizeLanguage(lang)
  const selectedCurrency = normalizeCurrency(currency)
  const isArabic = selectedLanguage === 'ar'
  const t = TRANSLATIONS[selectedLanguage]

  const supabase = await createClient()

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name_en, name_ar')
    .order('name_en', { ascending: true })

  const { data: universities } = await supabase
    .from('universities')
    .select('id, name_en, name_ar, city_id')
    .order('name_en', { ascending: true })

  const { data: restaurantCategory } = await supabase
    .from('service_categories')
    .select('id, slug, name_en, name_ar')
    .eq('slug', 'restaurants')
    .eq('is_active', true)
    .maybeSingle()

  const restaurantCategoryId = restaurantCategory?.id

  let providersQuery = supabase
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
      logo_url,
      cover_image_url,
      is_featured,
      is_active,
      discount_percentage,
      discount_title_en,
      discount_title_ar,
      service_provider_assets(file_url, asset_type, sort_order),
      service_provider_universities(university_id)
    `)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (restaurantCategoryId) {
    providersQuery = providersQuery.eq('category_id', restaurantCategoryId)
  }

  const { data: providers } = await providersQuery.limit(200)

  const rawRestaurants = dedupeProvidersById(
    ((providers as RestaurantProvider[]) ?? []).filter(
      (provider) => provider.is_active !== false
    )
  )

  const filteredRestaurants = rawRestaurants.filter((provider) => {
    const matchesCity = city_id
      ? String(provider.city_id) === String(city_id)
      : true

    const linkedUniversityIds = getUniqueProviderUniversityIds(provider)

    const matchesUniversity = university_id
      ? linkedUniversityIds.includes(String(university_id))
      : true

    const providerName = (
      selectedLanguage === 'ar'
        ? provider.name_ar || provider.name_en
        : provider.name_en || provider.name_ar || ''
    ).toLowerCase()

    const matchesQuery = q ? providerName.includes(q.toLowerCase()) : true

    return matchesCity && matchesUniversity && matchesQuery
  })

  const buildPageLink = (updates: Partial<SearchParams> = {}) => {
    const params = new URLSearchParams()

    const nextLang =
      updates.lang !== undefined ? updates.lang : selectedLanguage
    const nextCurrency =
      updates.currency !== undefined ? updates.currency : selectedCurrency
    const nextCityId =
      updates.city_id !== undefined ? updates.city_id : city_id
    const nextUniversityId =
      updates.university_id !== undefined
        ? updates.university_id
        : university_id
    const nextQ = updates.q !== undefined ? updates.q : q

    if (nextLang) params.set('lang', nextLang)
    if (nextCurrency) params.set('currency', nextCurrency)
    if (nextCityId) params.set('city_id', nextCityId)
    if (nextUniversityId) params.set('university_id', nextUniversityId)
    if (nextQ) params.set('q', nextQ)

    const queryString = params.toString()
    return queryString
      ? `/services/restaurants?${queryString}`
      : '/services/restaurants'
  }

  const buildSimpleNavLink = (path: string) => {
    const params = new URLSearchParams()
    params.set('lang', selectedLanguage)
    params.set('currency', selectedCurrency)
    return `${path}?${params.toString()}`
  }

  const buildRestaurantDetailsLink = (provider: RestaurantProvider) => {
    const params = new URLSearchParams()
    params.set('lang', selectedLanguage)
    params.set('currency', selectedCurrency)

    if (city_id) params.set('city_id', city_id)
    if (university_id) params.set('university_id', university_id)

    const identifier = provider.slug || String(provider.id)
    return `/services/restaurants/${identifier}?${params.toString()}`
  }

  const getProviderImage = (provider: RestaurantProvider) => {
    if (provider.cover_image_url) return provider.cover_image_url
    if (provider.logo_url) return provider.logo_url

    const assets = [...(provider.service_provider_assets ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    )

    const preferred =
      assets.find((asset) => asset.asset_type === 'cover') ||
      assets.find((asset) => asset.asset_type === 'gallery') ||
      assets[0]

    return preferred?.file_url || null
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
        isMobile ? 'flex-col pb-3 px-1' : 'flex-row gap-2 px-3 pt-2 pb-1'
      } ${
        isActive
          ? 'text-[#222222]'
          : 'text-[#6A6A6A] hover:text-[#222222]'
      }`}
    >
      <span className="flex shrink-0 items-center justify-center">{icon}</span>

      <span
        className={`font-sans font-semibold tracking-tight leading-none ${
          isActive ? 'text-[#222222]' : 'text-inherit'
        } ${isMobile ? 'text-[14px]' : 'text-[18px]'}`}
      >
        {label}
      </span>

      {!isMobile && isActive && (
        <div className="absolute -bottom-[2px] left-0 right-0 h-[3px] bg-[#222222] rounded-full" />
      )}

      {isMobile && isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black w-full" />
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

            <div className="px-4 pb-4">
              <RestaurantsSearchBar
                cities={(cities as City[]) ?? []}
                universities={(universities as University[]) ?? []}
                initialCityId={city_id ?? ''}
                initialUniversityId={university_id ?? ''}
                initialQuery={q ?? ''}
                language={selectedLanguage}
                currency={selectedCurrency}
                labels={{
                  city: t.city,
                  university: t.university,
                  keyword: t.keyword,
                  searchCities: t.searchCities,
                  chooseUniversity: t.chooseUniversity,
                  selectCity: t.selectCity,
                  selectUniversity: t.selectUniversity,
                  anyCity: t.anyCity,
                  anyUniversity: t.anyUniversity,
                  searchPlaceholder: t.searchPlaceholder,
                }}
              />
            </div>
          </details>

          <div className="hide-scrollbar flex items-center justify-center gap-8 overflow-x-auto px-4">
            {renderTopNavItem({
              href: buildSimpleNavLink('/properties'),
              label: t.homes,
              icon: <HomesAnimatedIcon size={28} className="h-20 w-20" />,
              isMobile: true,
            })}
            {renderTopNavItem({
              href: buildSimpleNavLink('/services'),
              label: t.services,
              icon: <ServicesAnimatedIcon size={28} className="h-20 w-20" />,
              isActive: true,
              isMobile: true,
            })}
            {renderTopNavItem({
              href: buildSimpleNavLink('/career'),
              label: t.career,
              icon: <CareerAnimatedIcon size={28} className="h-20 w-20" />,
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
                  src="https://i.ibb.co/5Xkcn6Fr/g.png"
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

            <div className="flex items-center justify-center gap-6 sm:gap-10">
              {renderTopNavItem({
                href: buildSimpleNavLink('/properties'),
                label: t.homes,
                icon: (
                  <HomesAnimatedIcon size={70} className="h-[70px] w-[70px]" />
                ),
              })}

              {renderTopNavItem({
                href: buildSimpleNavLink('/services'),
                label: t.services,
                icon: (
                  <ServicesAnimatedIcon
                    size={70}
                    className="h-[70px] w-[70px]"
                  />
                ),
                isActive: true,
              })}

              {renderTopNavItem({
                href: buildSimpleNavLink('/career'),
                label: t.career,
                icon: (
                  <CareerAnimatedIcon
                    size={70}
                    className="h-[70px] w-[70px]"
                  />
                ),
              })}
            </div>

            <div className="flex items-center gap-3">
              <LanguageDropdown
                selectedLanguage={selectedLanguage}
                menuButtonClass={menuButtonClass}
                menuPanelClass={menuPanelClass}
                menuLinkClass={menuLinkClass}
                translations={{
                  en: {
                    language: 'Language',
                    english: 'English',
                    arabic: 'العربية',
                  },
                  ar: {
                    language: 'اللغة',
                    english: 'English',
                    arabic: 'العربية',
                  },
                }}
              />
            </div>
          </div>

          <div className="flex justify-center pb-10 pt-3">
            <RestaurantsSearchBar
              cities={(cities as City[]) ?? []}
              universities={(universities as University[]) ?? []}
              initialCityId={city_id ?? ''}
              initialUniversityId={university_id ?? ''}
              initialQuery={q ?? ''}
              language={selectedLanguage}
              currency={selectedCurrency}
              labels={{
                city: t.city,
                university: t.university,
                keyword: t.keyword,
                searchCities: t.searchCities,
                chooseUniversity: t.chooseUniversity,
                selectCity: t.selectCity,
                selectUniversity: t.selectUniversity,
                anyCity: t.anyCity,
                anyUniversity: t.anyUniversity,
                searchPlaceholder: t.searchPlaceholder,
              }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 md:text-[32px]">
            {t.allRestaurants}
          </h1>

          {(city_id || university_id || q) && (
            <Link
              href={buildPageLink({
                city_id: '',
                university_id: '',
                q: '',
              })}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
            >
              {isArabic ? 'مسح الفلاتر' : 'Clear filters'}
            </Link>
          )}
        </div>

        {filteredRestaurants.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRestaurants.map((provider) => {
              const providerName =
                selectedLanguage === 'ar'
                  ? provider.name_ar || provider.name_en
                  : provider.name_en || provider.name_ar || ''

              const providerDescription =
                selectedLanguage === 'ar'
                  ? provider.short_description_ar ||
                    provider.short_description_en ||
                    ''
                  : provider.short_description_en ||
                    provider.short_description_ar ||
                    ''

              const image = getProviderImage(provider)

              return (
                <Link
                  key={String(provider.id)}
                  href={buildRestaurantDetailsLink(provider)}
                  className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {image ? (
                      <img
                        src={image}
                        alt={providerName}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300" />
                    )}
                  </div>

                  <div className="p-4">
                    <h2 className="line-clamp-1 text-[18px] font-semibold text-gray-900">
                      {providerName}
                    </h2>

                    {providerDescription ? (
                      <p className="mt-2 line-clamp-2 text-[14px] leading-6 text-gray-600">
                        {providerDescription}
                      </p>
                    ) : null}

                    <div className="mt-4">
                      <span className="inline-flex items-center rounded-full bg-black px-4 py-2 text-[13px] font-medium text-white">
                        {t.openRestaurant}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </section>
        ) : (
          <section className="py-20">
            <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-900">
                {t.noRestaurants}
              </h2>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
