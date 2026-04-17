
import Link from 'next/link'
import type { ReactNode } from 'react'
import { createClient } from '../../src/lib/supabase/server'
import CareerSearchBar from './CareerSearchBar'
import LanguageDropdown from './LanguageDropdown'

import {
  CareerAnimatedIcon,
  HomesAnimatedIcon,
  ServicesAnimatedIcon,
} from './AnimatedTopNavIcons'

type SearchParams = {
  lang?: string
  currency?: string
  city_id?: string
  university_id?: string
  college_id?: string
}

type City = {
  id: string | number
  name_en: string
  name_ar?: string | null
}

type University = {
  id: string | number
  name_en: string
  name_ar?: string | null
  city_id: string | number
}

type College = {
  id: string | number
  university_id: string | number
  name_en: string
  name_ar?: string | null
}

type CareerCategory = {
  id: string | number
  slug: string
  name_en: string
  name_ar: string
  icon?: string | null
  sort_order?: number | null
  is_active?: boolean | null
}

type CareerAsset = {
  file_url?: string | null
  asset_type?: string | null
  sort_order?: number | null
}

type CareerOpportunity = {
  id: string | number
  category_id: string | number
  city_id?: string | null
  university_id?: string | null
  college_id?: string | null
  title_en: string
  title_ar?: string | null
  slug?: string | null
  company_name_en?: string | null
  company_name_ar?: string | null
  short_description_en?: string | null
  short_description_ar?: string | null
  provider_logo_url?: string | null
  cover_image_url?: string | null
  application_url: string
  source_name?: string | null
  location_text?: string | null
  duration_text?: string | null
  salary_text?: string | null
  is_featured?: boolean | null
  is_active?: boolean | null
  career_opportunity_assets?: CareerAsset[] | null
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
    language: 'Language',
    english: 'English',
    arabic: 'العربية',
    currency: 'Currency',
    careerTitle: 'Career opportunities',
    careerDesc:
      'Find jobs, internships, and online courses that match your city, university, and college.',
    applyNow: 'Apply now',
    viewDetails: 'View details',
    noOpportunities: 'No opportunities available yet.',
    trustedOpportunity: 'Top opportunity',
    city: 'City',
    university: 'University',
    college: 'College',
    searchCities: 'Search cities',
    chooseUniversity: 'Choose university',
    chooseCollege: 'Choose college',
    selectCity: 'Select city',
    selectUniversity: 'Select university',
    selectCollege: 'Select college',
    anyCity: 'Any city',
    anyUniversity: 'Any university',
    anyCollege: 'Any college',
    availableNow: 'Available now',
    startSearch: 'Start your search',
    seeAll: 'See All',
  },
  ar: {
    homes: 'المنازل',
    services: 'الخدمات',
    career: 'الوظائف',
    language: 'اللغة',
    english: 'English',
    arabic: 'العربية',
    currency: 'العملة',
    careerTitle: 'فرص مهنية',
    careerDesc:
      'اكتشف الوظائف والتدريبات والكورسات الأونلاين المناسبة لمدينتك وجامعتك وكليتك.',
    applyNow: 'قدّم الآن',
    viewDetails: 'عرض التفاصيل',
    noOpportunities: 'لا توجد فرص متاحة حاليًا.',
    trustedOpportunity: 'فرصة مميزة',
    city: 'المدينة',
    university: 'الجامعة',
    college: 'الكلية',
    searchCities: 'ابحث عن مدينة',
    chooseUniversity: 'اختر الجامعة',
    chooseCollege: 'اختر الكلية',
    selectCity: 'اختر المدينة',
    selectUniversity: 'اختر الجامعة',
    selectCollege: 'اختر الكلية',
    anyCity: 'أي مدينة',
    anyUniversity: 'أي جامعة',
    anyCollege: 'أي كلية',
    availableNow: 'متاح الآن',
    startSearch: 'ابدأ بحثك',
    seeAll: 'عرض الكل',
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

export default async function CareerPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { lang, currency, city_id, university_id, college_id } =
    await searchParams

  const selectedLanguage = normalizeLanguage(lang)
  const selectedCurrency = normalizeCurrency(currency)
  const t = TRANSLATIONS[selectedLanguage]
  const isArabic = selectedLanguage === 'ar'

  const supabase = await createClient()

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name_en, name_ar')
    .order('name_en', { ascending: true })

  const { data: universities } = await supabase
    .from('universities')
    .select('id, name_en, name_ar, city_id')
    .order('name_en', { ascending: true })

  const { data: colleges } = await supabase
    .from('colleges')
    .select('id, university_id, name_en, name_ar')
    .eq('is_active', true)
    .order('name_en', { ascending: true })

  const { data: categories } = await supabase
    .from('career_categories')
    .select('id, slug, name_en, name_ar, icon, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const { data: opportunities } = await supabase
    .from('career_opportunities')
    .select(
      `
      id,
      category_id,
      city_id,
      university_id,
      college_id,
      title_en,
      title_ar,
      slug,
      company_name_en,
      company_name_ar,
      short_description_en,
      short_description_ar,
      provider_logo_url,
      cover_image_url,
      application_url,
      source_name,
      location_text,
      duration_text,
      salary_text,
      is_featured,
      is_active,
      career_opportunity_assets(file_url, asset_type, sort_order)
      `
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(200)

  const buildPageLink = (updates: Partial<SearchParams> = {}) => {
    const params = new URLSearchParams()

    const nextCityId = updates.city_id !== undefined ? updates.city_id : city_id
    const nextUniversityId =
      updates.university_id !== undefined
        ? updates.university_id
        : university_id
    const nextCollegeId =
      updates.college_id !== undefined ? updates.college_id : college_id
    const nextLang =
      updates.lang !== undefined ? updates.lang : selectedLanguage
    const nextCurrency =
      updates.currency !== undefined ? updates.currency : selectedCurrency

    if (nextCityId) params.set('city_id', nextCityId)
    if (nextUniversityId) params.set('university_id', nextUniversityId)
    if (nextCollegeId) params.set('college_id', nextCollegeId)
    if (nextLang) params.set('lang', nextLang)
    if (nextCurrency) params.set('currency', nextCurrency)

    const queryString = params.toString()
    return queryString ? `/career?${queryString}` : '/career'
  }

  const buildSimpleNavLink = (path: string) => {
    const params = new URLSearchParams()
    params.set('lang', selectedLanguage)
    params.set('currency', selectedCurrency)
    return `${path}?${params.toString()}`
  }

  const buildCareerCategoryLink = (categorySlug: string) => {
    const params = new URLSearchParams()
    if (city_id) params.set('city_id', city_id)
    if (university_id) params.set('university_id', university_id)
    if (college_id) params.set('college_id', college_id)
    params.set('lang', selectedLanguage)
    params.set('currency', selectedCurrency)
    params.set('category', categorySlug)
    return `/career/search?${params.toString()}`
  }

  const buildOpportunityDetailsLink = (opportunity: CareerOpportunity) => {
    const params = new URLSearchParams()
    params.set('lang', selectedLanguage)
    params.set('currency', selectedCurrency)
    if (city_id) params.set('city_id', city_id)
    if (university_id) params.set('university_id', university_id)
    if (college_id) params.set('college_id', college_id)

    const identifier = opportunity.slug || String(opportunity.id)
    return `/career/${identifier}?${params.toString()}`
  }

  const careerCategories = (categories as CareerCategory[]) ?? []
  const rawOpportunities = ((opportunities as CareerOpportunity[]) ?? []).filter(
    (opportunity) => opportunity.is_active !== false
  )

  const filteredOpportunities = rawOpportunities.filter((opportunity) => {
    const matchesCity = city_id
      ? String(opportunity.city_id) === String(city_id)
      : true

    const matchesUniversity = university_id
      ? String(opportunity.university_id) === String(university_id)
      : true

    const matchesCollege = college_id
      ? String(opportunity.college_id) === String(college_id)
      : true

    return matchesCity && matchesUniversity && matchesCollege
  })

  const opportunitiesByCategory = new Map<string, CareerOpportunity[]>()

  for (const opportunity of filteredOpportunities) {
    const key = String(opportunity.category_id)
    const existing = opportunitiesByCategory.get(key) ?? []

    if (existing.length < 5) {
      existing.push(opportunity)
      opportunitiesByCategory.set(key, existing)
    }
  }

  const showcaseSections = careerCategories
    .map((category) => {
      const items = opportunitiesByCategory.get(String(category.id)) ?? []

      return {
        id: String(category.id),
        slug: category.slug,
        title: selectedLanguage === 'ar' ? category.name_ar : category.name_en,
        items,
      }
    })
    .filter((section) => section.items.length > 0)
    .slice(0, 8)

  const getOpportunityImage = (opportunity: CareerOpportunity) => {
    if (opportunity.cover_image_url) return opportunity.cover_image_url
    if (opportunity.provider_logo_url) return opportunity.provider_logo_url

    const assets = [...(opportunity.career_opportunity_assets ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    )

    const preferred =
      assets.find((asset) => asset.asset_type === 'cover') ||
      assets.find((asset) => asset.asset_type === 'gallery') ||
      assets.find((asset) => asset.asset_type === 'logo') ||
      assets[0]

    return preferred?.file_url || null
  }

  const renderOpportunityImage = (
    opportunity: CareerOpportunity,
    badgeText: string
  ) => {
    const firstImage = getOpportunityImage(opportunity)

    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] md:rounded-3xl bg-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] md:shadow-none">
        {firstImage ? (
          <img
            src={firstImage}
            alt={
              selectedLanguage === 'ar'
                ? opportunity.title_ar || opportunity.title_en
                : opportunity.title_en
            }
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 transition duration-500 group-hover:scale-[1.03] group-hover:bg-black/5 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300" />
        )}

        <div className="absolute left-2 top-2 md:left-3 md:top-3 rounded-full bg-white/95 px-2 py-1 md:px-2.5 md:py-1 text-[10px] md:text-[11px] font-semibold text-gray-800 shadow-sm border border-black/5">
          {badgeText}
        </div>

        <button className="absolute right-2 top-2 md:right-3 md:top-3 hover:scale-110 transition-transform drop-shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="rgba(0,0,0,0.3)"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="white"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>
      </div>
    )
  }

  const renderOpportunityCard = (opportunity: CareerOpportunity) => {
    const title =
      selectedLanguage === 'ar'
        ? opportunity.title_ar || opportunity.title_en
        : opportunity.title_en || opportunity.title_ar || ''

    const description =
      selectedLanguage === 'ar'
        ? opportunity.short_description_ar ||
          opportunity.short_description_en ||
          ''
        : opportunity.short_description_en ||
          opportunity.short_description_ar ||
          ''

    const companyName =
      selectedLanguage === 'ar'
        ? opportunity.company_name_ar || opportunity.company_name_en || ''
        : opportunity.company_name_en || opportunity.company_name_ar || ''

    return (
      <div
        key={opportunity.id}
        className="group block min-w-[280px] max-w-[280px] md:min-w-[240px] md:max-w-[240px] shrink-0 snap-start"
      >
        <Link href={buildOpportunityDetailsLink(opportunity)} className="block">
          {renderOpportunityImage(opportunity, t.trustedOpportunity)}
        </Link>

        <div className="mt-2.5 md:mt-3 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-[14px] md:text-[17px] font-semibold text-gray-900 leading-snug">
              {title}
            </h3>
            <span className="shrink-0 text-[13px] md:text-[14px] font-medium text-gray-900 pt-[1px] md:pt-[2px]">
              ★ 4.9
            </span>
          </div>

          <p className="line-clamp-1 text-[12px] md:text-[13px] text-gray-500">
            {companyName || t.availableNow}
          </p>

          <p className="line-clamp-2 text-[12px] md:text-[13px] text-gray-500">
            {description || t.availableNow}
          </p>

          <div className="flex items-center gap-2 pt-1.5">
            <a
              href={opportunity.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center rounded-full bg-[#222222] px-4 py-2 text-[12px] md:text-[13px] font-semibold text-white transition hover:bg-black"
            >
              {t.applyNow}
            </a>

            <Link
              href={buildOpportunityDetailsLink(opportunity)}
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-[12px] md:text-[13px] font-medium text-gray-800 transition hover:border-black"
            >
              {t.viewDetails}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const renderSeeAllCard = (categorySlug: string, items: CareerOpportunity[]) => {
    const images = items
      .map(getOpportunityImage)
      .filter(Boolean)
      .slice(0, 3) as string[]

    return (
      <Link
        key={`see-all-${categorySlug}`}
        href={buildCareerCategoryLink(categorySlug)}
        className="group block min-w-[150px] max-w-[150px] md:min-w-[160px] md:max-w-[160px] shrink-0 snap-start"
      >
        <div className="relative flex aspect-[4/3] w-full items-center justify-center rounded-xl md:rounded-3xl transition duration-300">
          <div className="relative flex h-full w-full items-center justify-center">
            {images[1] && (
              <img
                src={images[1]}
                className="absolute h-[65%] w-[65%] rounded-lg md:rounded-xl border-[2px] md:border-[3px] border-white object-cover shadow-sm -translate-x-3 -translate-y-2 -rotate-12 transition-transform duration-300 group-hover:-rotate-[16deg]"
                alt=""
              />
            )}
            {images[2] && (
              <img
                src={images[2]}
                className="absolute h-[65%] w-[65%] rounded-lg md:rounded-xl border-[2px] md:border-[3px] border-white object-cover shadow-sm translate-x-3 -translate-y-2 rotate-12 transition-transform duration-300 group-hover:rotate-[16deg]"
                alt=""
              />
            )}
            {images[0] ? (
              <img
                src={images[0]}
                className="absolute z-10 h-[70%] w-[70%] rounded-lg md:rounded-xl border-[2px] md:border-[3px] border-white object-cover shadow-md transition-transform duration-300 group-hover:scale-105"
                alt=""
              />
            ) : (
              <div className="absolute z-10 flex h-[70%] w-[70%] items-center justify-center rounded-lg md:rounded-xl border-[2px] md:border-[3px] border-white bg-gray-100 shadow-md transition-transform duration-300 group-hover:scale-105">
                <span className="text-xl md:text-2xl text-gray-400">→</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 md:mt-3 flex items-start justify-center pt-2">
          <span className="text-[14px] md:text-[15px] font-semibold text-gray-900 group-hover:text-black">
            {t.seeAll}
          </span>
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
        isMobile ? 'flex-col pb-3 px-1' : 'flex-row gap-2 px-3 pt-2 pb-1'
      } ${isActive ? 'text-[#222222]' : 'text-[#6A6A6A] hover:text-[#222222]'}`}
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

  const searchBarProps = {
    cities: (cities as City[]) ?? [],
    universities: (universities as University[]) ?? [],
    colleges: (colleges as College[]) ?? [],
    initialCityId: city_id ?? '',
    initialUniversityId: university_id ?? '',
    initialCollegeId: college_id ?? '',
    language: selectedLanguage,
    currency: selectedCurrency,
    labels: {
      city: t.city,
      university: t.university,
      college: t.college,
      searchCities: t.searchCities,
      chooseUniversity: t.chooseUniversity,
      chooseCollege: t.chooseCollege,
      selectCity: t.selectCity,
      selectUniversity: t.selectUniversity,
      selectCollege: t.selectCollege,
      anyCity: t.anyCity,
      anyUniversity: t.anyUniversity,
      anyCollege: t.anyCollege,
    },
  }

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-white text-gray-700 relative pb-20 md:pb-0"
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
              <CareerSearchBar {...searchBarProps} />
            </div>
          </details>

          <div className="flex items-center justify-center gap-8 overflow-x-auto px-4 hide-scrollbar">
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
              isMobile: true,
            })}
            {renderTopNavItem({
              href: buildPageLink(),
              label: t.career,
              icon: <CareerAnimatedIcon size={28} className="h-20 w-20" />,
              isActive: true,
              isMobile: true,
            })}
          </div>
        </div>

        <div className="hidden md:block mx-auto max-w-[1920px] px-6">
          <div className="flex items-center justify-between pt-0">
            <div className="flex items-center">
              <Link href={buildSimpleNavLink('/properties')} className="flex items-center gap-2">
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
                icon: <HomesAnimatedIcon size={70} className="h-[70px] w-[70px]" />,
              })}

              {renderTopNavItem({
                href: buildSimpleNavLink('/services'),
                label: t.services,
                icon: (
                  <ServicesAnimatedIcon size={70} className="h-[70px] w-[70px]" />
                ),
              })}

              {renderTopNavItem({
                href: buildPageLink(),
                label: t.career,
                icon: <CareerAnimatedIcon size={70} className="h-[70px] w-[70px]" />,
                isActive: true,
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
            <CareerSearchBar {...searchBarProps} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {showcaseSections.length > 0 ? (
          <section className="mb-10 md:mb-14 space-y-10 md:space-y-12">
            {showcaseSections.map((section) => (
              <div key={section.slug}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[19px] md:text-2xl font-semibold tracking-tight text-gray-900">
                      <Link href={buildCareerCategoryLink(section.slug)}>
                        {section.title}
                      </Link>
                    </h2>
                  </div>

                  <Link
                    href={buildCareerCategoryLink(section.slug)}
                    className="flex h-7 w-7 md:hidden items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4 rtl:rotate-180"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </Link>
                </div>

                <div className="flex gap-3.5 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
                  {section.items.map((opportunity) =>
                    renderOpportunityCard(opportunity)
                  )}
                  {renderSeeAllCard(section.slug, section.items)}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section className="py-16 md:py-20">
            <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-[22px] md:text-2xl font-semibold text-gray-900">
                {t.noOpportunities}
              </h2>
            </div>
          </section>
        )}
      </div>

      <footer className="mt-8 bg-gray-100 py-6">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4">
          <p className="text-sm text-gray-600">© 2026 Baytgo, Inc.</p>

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
