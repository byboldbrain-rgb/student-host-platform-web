import Link from 'next/link'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '../../../src/lib/supabase/server'
import LanguageDropdown from '../../properties/LanguageDropdown'
import {
  CareerAnimatedIcon,
  HomesAnimatedIcon,
  ServicesAnimatedIcon,
} from '../../properties/AnimatedTopNavIcons'

type PageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    lang?: string
  }>
}

type SupportedLanguage = 'en' | 'ar'

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
    language: 'Language',
    backToLost: 'Back to lost items',
    category: 'Category',
    faculty: 'Faculty',
    foundLocation: 'Found location',
    foundDate: 'Found date',
    status: 'Status',
    contactPerson: 'Contact person',
    phone: 'Phone',
    email: 'Email',
    details: 'Details',
    available: 'Available',
    claimed: 'Claimed',
    delivered: 'Delivered',
    noDescription: 'No additional details available.',
    footerText: '© 2026 Baytgo, Inc.',
    postedIn: 'Posted in',
  },
  ar: {
    homes: 'المنازل',
    services: 'الخدمات',
    career: 'الوظائف',
    lost: 'المفقودات',
    language: 'اللغة',
    backToLost: 'الرجوع إلى المفقودات',
    category: 'التصنيف',
    faculty: 'الكلية',
    foundLocation: 'مكان العثور',
    foundDate: 'تاريخ العثور',
    status: 'الحالة',
    contactPerson: 'الشخص المسؤول',
    phone: 'رقم الهاتف',
    email: 'البريد الإلكتروني',
    details: 'التفاصيل',
    available: 'متاح',
    claimed: 'تم الاستلام',
    delivered: 'تم التسليم',
    noDescription: 'لا توجد تفاصيل إضافية حاليًا.',
    footerText: '© 2026 Baytgo, Inc.',
    postedIn: 'تم النشر في',
  },
} as const

function normalizeLanguage(value?: string): SupportedLanguage {
  return value === 'ar' ? 'ar' : 'en'
}

function translateStatus(value: LostItem['status'], language: SupportedLanguage) {
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

function LostNavIcon({
  className = '',
}: {
  className?: string
}) {
  return (
    <span
      className={`flex items-center justify-center text-[28px] md:text-[42px] leading-none ${className}`}
      aria-hidden="true"
    >
      🔎
    </span>
  )
}

export default async function LostItemDetailsPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params
  const { lang } = await searchParams

  const selectedLanguage = normalizeLanguage(lang)
  const t = TRANSLATIONS[selectedLanguage]
  const isArabic = selectedLanguage === 'ar'

  const supabase = await createClient()

  const { data: item } = await supabase
    .from('lost_items')
    .select('*')
    .eq('id', id)
    .single<LostItem>()

  if (!item) {
    notFound()
  }

  const buildSimpleNavLink = (path: string) => {
    const params = new URLSearchParams()
    params.set('lang', selectedLanguage)
    return `${path}?${params.toString()}`
  }

  const buildLostBackLink = () => {
    const params = new URLSearchParams()
    params.set('lang', selectedLanguage)
    return `/lost?${params.toString()}`
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
        <div className="absolute -bottom-[2px] left-0 right-0 h-[3px] rounded-full bg-[#222222]" />
      )}

      {isMobile && isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] w-full bg-black" />
      )}
    </Link>
  )

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-white pb-20 text-gray-700 md:pb-0"
    >
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm md:static md:bg-[#f7f7f7] md:shadow-none">
        <div className="w-full bg-white pb-1 pt-1 md:hidden">
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
              href: buildLostBackLink(),
              label: t.lost,
              icon: <LostNavIcon className="h-20 w-20" />,
              isActive: true,
              isMobile: true,
            })}
          </div>
        </div>

        <div className="mx-auto hidden max-w-[1920px] px-6 md:block">
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
                href: buildLostBackLink(),
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
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
        <div className="mb-6">
          <Link
            href={buildLostBackLink()}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:border-black"
          >
            <span className="rtl:rotate-180">←</span>
            {t.backToLost}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300" />
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-7">
            <div className="mb-5">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                {item.title}
              </h1>

              <p className="mt-2 text-sm text-gray-500 md:text-base">
                {t.postedIn} {item.governorate} • {item.university}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t.status}
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {translateStatus(item.status, selectedLanguage)}
                </p>
              </div>

              {item.category && (
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t.category}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {item.category}
                  </p>
                </div>
              )}

              {item.faculty && (
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t.faculty}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {item.faculty}
                  </p>
                </div>
              )}

              {item.found_location && (
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t.foundLocation}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {item.found_location}
                  </p>
                </div>
              )}

              {item.found_date && (
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t.foundDate}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(item.found_date, selectedLanguage)}
                  </p>
                </div>
              )}
            </div>

            <div className="mb-6 rounded-2xl border border-gray-200 p-4 md:p-5">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                {t.details}
              </h2>
              <p className="text-sm leading-7 text-gray-600 md:text-[15px]">
                {item.description || t.noDescription}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-4 md:p-5">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                {t.contactPerson}
              </h2>

              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <span className="font-semibold text-gray-900">
                    {t.contactPerson}:
                  </span>{' '}
                  {item.holder_name}
                </div>

                {item.holder_phone && (
                  <div>
                    <span className="font-semibold text-gray-900">
                      {t.phone}:
                    </span>{' '}
                    <a
                      href={`tel:${item.holder_phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {item.holder_phone}
                    </a>
                  </div>
                )}

                {item.holder_email && (
                  <div>
                    <span className="font-semibold text-gray-900">
                      {t.email}:
                    </span>{' '}
                    <a
                      href={`mailto:${item.holder_email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {item.holder_email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-8 bg-gray-100 py-6">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4">
          <p className="text-sm text-gray-600">{t.footerText}</p>

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