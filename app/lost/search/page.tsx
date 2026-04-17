import Link from 'next/link'
import type { ReactNode } from 'react'
import { createClient } from '../../../src/lib/supabase/server'
import LostSearchBar from '../LostSearchBar'
import LanguageDropdown from '../../properties/LanguageDropdown'
import {
  CareerAnimatedIcon,
  HomesAnimatedIcon,
  ServicesAnimatedIcon,
} from '../../properties/AnimatedTopNavIcons'

type SearchParams = {
  governorate?: string
  university?: string
  faculty?: string
  status?: string
  lang?: string
}

type SupportedLanguage = 'en' | 'ar'

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

type LostItem = {
  id: string
  governorate: string
  university: string
  faculty: string | null
  title: string
  description: string | null
  category: string | null
  image_url: string | null
  found_location: string | null
  found_date: string | null
  holder_name: string
  holder_phone: string | null
  holder_email: string | null
  status: 'available' | 'claimed' | 'delivered'
  created_at: string
}

const TRANSLATIONS = {
  en: {
    homes: 'Homes',
    services: 'Services',
    career: 'Career',
    lost: 'Lost',
    startSearch: 'Start your search',
    city: 'City',
    university: 'University',
    college: 'College',
    selectCity: 'Select city',
    selectUniversity: 'Select university',
    selectCollege: 'Select college',
    anyCity: 'Any city',
    anyUniversity: 'Any university',
    anyCollege: 'Any college',
    searchResults: 'Search Results',
    noResults: 'No lost items found matching your search.',
    available: 'Available',
    claimed: 'Claimed',
    delivered: 'Delivered',
    category: 'Category',
    faculty: 'Faculty',
    foundLocation: 'Found location',
    foundDate: 'Found date',
    language: 'Language',
    footerText: '© 2026 Baytgo, Inc.',
  },
  ar: {
    homes: 'المنازل',
    services: 'الخدمات',
    career: 'الوظائف',
    lost: 'المفقودات',
    startSearch: 'ابدأ البحث',
    city: 'المحافظة',
    university: 'الجامعة',
    college: 'الكلية',
    selectCity: 'اختر المحافظة',
    selectUniversity: 'اختر الجامعة',
    selectCollege: 'اختر الكلية',
    anyCity: 'أي محافظة',
    anyUniversity: 'أي جامعة',
    anyCollege: 'أي كلية',
    searchResults: 'نتائج البحث',
    noResults: 'لا توجد مفقودات مطابقة لبحثك حاليًا.',
    available: 'متاح',
    claimed: 'تم الاستلام',
    delivered: 'تم التسليم',
    category: 'التصنيف',
    faculty: 'الكلية',
    foundLocation: 'مكان العثور',
    foundDate: 'تاريخ العثور',
    language: 'اللغة',
    footerText: '© 2026 Baytgo, Inc.',
  },
} as const

function normalizeLanguage(value?: string): SupportedLanguage {
  return value === 'ar' ? 'ar' : 'en'
}

function LostNavIcon({
  className = '',
}: {
  className?: string
}) {
  return (
    <span
      className={`flex items-center justify-center text-[28px] leading-none md:text-[42px] ${className}`}
      aria-hidden="true"
    >
      🔎
    </span>
  )
}

function translateStatus(
  value: LostItem['status'],
  language: SupportedLanguage
) {
  if (value === 'available') return TRANSLATIONS[language].available
  if (value === 'claimed') return TRANSLATIONS[language].claimed
  if (value === 'delivered') return TRANSLATIONS[language].delivered
  return value
}

function formatDate(value: string | null, language: SupportedLanguage) {
  if (!value) return null

  try {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default async function LostSearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const selectedLanguage = normalizeLanguage(params.lang)
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

  const { data: collegesSource } = await supabase
    .from('lost_items')
    .select('faculty')
    .not('faculty', 'is', null)

  const colleges = Array.from(
    new Set(
      ((collegesSource as { faculty: string | null }[]) ?? [])
        .map((item) => item.faculty?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((a, b) => a.localeCompare(b))

  let query = supabase
    .from('lost_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (params.governorate) {
    query = query.eq('governorate', params.governorate)
  }

  if (params.university) {
    query = query.eq('university', params.university)
  }

  if (params.faculty) {
    query = query.eq('faculty', params.faculty)
  }

  query = query.eq('status', params.status || 'available')

  const { data: items } = await query

  const buildSimpleNavLink = (path: string) => {
    const p = new URLSearchParams()
    p.set('lang', selectedLanguage)
    return `${path}?${p.toString()}`
  }

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
        <div className="absolute -bottom-[2px] left-0 right-0 h-[3px] rounded-full bg-[#222222]" />
      )}

      {isMobile && isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] w-full bg-black" />
      )}
    </Link>
  )

  const searchBarProps = {
    cities: (cities as City[]) ?? [],
    universities: (universities as University[]) ?? [],
    colleges,
    initialGovernorate: params.governorate ?? '',
    initialUniversity: params.university ?? '',
    initialCollege: params.faculty ?? '',
    language: selectedLanguage,
    labels: {
      city: t.city,
      university: t.university,
      college: t.college,
      selectCity: t.selectCity,
      selectUniversity: t.selectUniversity,
      selectCollege: t.selectCollege,
      anyCity: t.anyCity,
      anyUniversity: t.anyUniversity,
      anyCollege: t.anyCollege,
    },
  }

  const menuButtonClass =
    'flex h-12 min-w-12 items-center justify-center rounded-full border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 shadow-sm transition hover:border-black'

  const menuPanelClass = isArabic
    ? 'absolute left-0 top-[calc(100%+10px)] z-40 min-w-[240px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]'
    : 'absolute right-0 top-[calc(100%+10px)] z-40 min-w-[240px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]'

  const menuLinkClass =
    'block px-4 py-3 text-sm text-gray-800 transition hover:bg-gray-50'

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-white pb-20 text-gray-700 md:pb-0"
    >
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm md:static md:bg-[#f7f7f7] md:shadow-none">
        <div className="w-full bg-white pb-1 pt-1 md:hidden">
          <details className="group [&_summary::-webkit-details-marker]:hidden">
            <summary className="mx-4 mb-4 mt-2 flex cursor-pointer list-none items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-3.5 shadow-[0_3px_10px_rgba(0,0,0,0.08)]">
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
              <span className="text-[14px] font-semibold text-gray-900">
                {t.startSearch}
              </span>
            </summary>

            <div className="px-4 pb-4">
              <LostSearchBar {...searchBarProps} />
            </div>
          </details>

          <div className="flex items-center justify-start gap-6 overflow-x-auto px-4 hide-scrollbar">
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
              href: buildSimpleNavLink('/career'),
              label: t.career,
              icon: <CareerAnimatedIcon size={28} className="h-20 w-20" />,
              isMobile: true,
            })}

            {renderTopNavItem({
              href: buildSimpleNavLink('/lost'),
              label: t.lost,
              icon: <LostNavIcon className="h-20 w-20" />,
              isActive: true,
              isMobile: true,
            })}
          </div>
        </div>

        <div className="hidden md:block mx-auto max-w-[1920px] px-6">
          <div className="flex items-center justify-between pt-0">
            <Link
              href={buildSimpleNavLink('/properties')}
              className="flex items-center"
            >
              <img
                src="https://i.ibb.co/5Xkcn6Fr/g.png"
                alt="Logo"
                style={{ width: '140px', height: 'auto', marginTop: '-15px' }}
              />
            </Link>

            <div className="flex items-center justify-center gap-5 xl:gap-8">
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
                href: buildSimpleNavLink('/career'),
                label: t.career,
                icon: (
                  <CareerAnimatedIcon size={70} className="h-[70px] w-[70px]" />
                ),
              })}

              {renderTopNavItem({
                href: buildSimpleNavLink('/lost'),
                label: t.lost,
                icon: <LostNavIcon className="h-[70px] w-[70px]" />,
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
            <LostSearchBar {...searchBarProps} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t.searchResults}</h1>
        </div>

        {items && items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {(items as LostItem[]).map((item) => (
              <Link
                key={item.id}
                href={`/lost/${item.id}`}
                className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300" />
                  )}

                  <div className="absolute right-3 top-3 rounded-full border border-black/5 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-800 shadow-sm">
                    {translateStatus(item.status, selectedLanguage)}
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  <div>
                    <h2 className="line-clamp-1 text-lg font-semibold text-gray-900">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {item.governorate} • {item.university}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-600">
                    {item.faculty && (
                      <p>
                        <span className="font-medium text-gray-800">
                          {t.faculty}:
                        </span>{' '}
                        {item.faculty}
                      </p>
                    )}

                    {item.category && (
                      <p>
                        <span className="font-medium text-gray-800">
                          {t.category}:
                        </span>{' '}
                        {item.category}
                      </p>
                    )}

                    {item.found_location && (
                      <p>
                        <span className="font-medium text-gray-800">
                          {t.foundLocation}:
                        </span>{' '}
                        {item.found_location}
                      </p>
                    )}

                    {item.found_date && (
                      <p>
                        <span className="font-medium text-gray-800">
                          {t.foundDate}:
                        </span>{' '}
                        {formatDate(item.found_date, selectedLanguage)}
                      </p>
                    )}
                  </div>

                  {item.description && (
                    <p className="line-clamp-2 text-sm leading-6 text-gray-500">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-lg text-gray-500">{t.noResults}</p>
          </div>
        )}
      </div>

      <footer className="mt-8 bg-gray-100 py-6">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4">
          <p className="text-sm text-gray-600">{t.footerText}</p>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <a href="https://www.facebook.com/yourPage" target="_blank" rel="noopener noreferrer">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-6 w-6 text-blue-600">
                <path d="M576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 440 146.7 540.8 258.2 568.5L258.2 398.2L205.4 398.2L205.4 320L258.2 320L258.2 286.3C258.2 199.2 297.6 158.8 383.2 158.8C399.4 158.8 427.4 162 438.9 165.2L438.9 236C432.9 235.4 422.4 235 409.3 235C367.3 235 351.1 250.9 351.1 292.2L351.1 320L434.7 320L420.3 398.2L351 398.2L351 574.1C477.8 558.8 576 450.9 576 320z" />
              </svg>
            </a>

            <a href="https://www.instagram.com/yourPage" target="_blank" rel="noopener noreferrer">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-6 w-6 text-purple-600">
                <path d="M320.3 205C256.8 204.8 205.2 256.2 205 319.7C204.8 383.2 256.2 434.8 319.7 435C383.2 435.2 434.8 383.8 435 320.3C435.2 256.8 383.8 205.2 320.3 205zM319.7 245.4C360.9 245.2 394.4 278.5 394.6 319.7C394.8 360.9 361.5 394.4 320.3 394.6C279.1 394.8 245.6 361.5 245.4 320.3C245.2 279.1 278.5 245.6 319.7 245.4zM413.1 200.3C413.1 185.5 425.1 173.5 439.9 173.5C454.7 173.5 466.7 185.5 466.7 200.3C466.7 215.1 454.7 227.1 439.9 227.1C425.1 227.1 413.1 215.1 413.1 200.3zM542.8 227.5C541.1 191.6 532.9 159.8 506.6 133.6C480.4 107.4 448.6 99.2 412.7 97.4C375.7 95.3 264.8 95.3 227.8 97.4C192 99.1 160.2 107.3 133.9 133.5C107.6 159.7 99.5 191.5 97.7 227.4C95.6 264.4 95.6 375.3 97.7 412.3C99.4 448.2 107.6 480 133.9 506.2C160.2 532.4 191.9 540.6 227.8 542.4C264.8 544.5 375.7 544.5 412.7 542.4C448.6 540.7 480.4 532.5 506.6 506.2C532.8 480 541 448.2 542.8 412.3C544.9 375.3 544.9 264.5 542.8 227.5zM495 452C487.2 471.6 472.1 486.7 452.4 494.6C422.9 506.3 352.9 503.6 320.3 503.6C287.7 503.6 217.6 506.2 188.2 494.6C168.6 486.8 153.5 471.7 145.6 452C133.9 422.5 136.6 352.5 136.6 319.9C136.6 287.3 134 217.2 145.6 187.8C153.4 168.2 168.5 153.1 188.2 145.2C217.7 133.5 287.7 136.2 320.3 136.2C352.9 136.2 423 133.6 452.4 145.2C472 153 487.1 168.1 495 187.8C506.7 217.3 504 287.3 504 319.9C504 352.5 506.7 422.6 495 452z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}