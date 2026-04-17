'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import PropertiesSearchBar from './PropertiesSearchBar'

type City = {
  id: string | number
  name_en: string
  name_ar?: string
}

type University = {
  id: string | number
  name_en: string
  name_ar?: string
  city_id: string | number
}

type SupportedLanguage = 'en' | 'ar'

type Labels = {
  city: string
  university: string
  duration: string
  searchCities: string
  chooseUniversity: string
  chooseDuration: string
  selectCity: string
  selectUniversity: string
  selectDuration: string
  anyCity: string
  anyUniversity: string
  anyDuration: string
  daily: string
  monthly: string
}

type SearchBarProps = {
  cities: City[]
  universities: University[]
  initialCityId?: string
  initialUniversityId?: string
  initialRentalDuration?: string
  initialPriceRange?: string
  language?: SupportedLanguage
  currency?: string
  labels: Labels
}

type HeaderTexts = {
  startSearch: string
}

type Props = {
  homeHref: string
  searchBarProps: SearchBarProps
  t: HeaderTexts
}

export default function PropertiesHeader({
  homeHref,
  searchBarProps,
  t,
}: Props) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [forceExpanded, setForceExpanded] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  useEffect(() => {
    let ticking = false

    const updateScrollState = () => {
      const y = window.scrollY

      if (!forceExpanded) {
        setIsScrolled((prev) => {
          if (!prev && y > 140) return true
          if (prev && y < 90) return false
          return prev
        })
      }

      ticking = false
    }

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollState)
        ticking = true
      }
    }

    updateScrollState()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [forceExpanded])

  useEffect(() => {
    if (!isMobileSearchOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isMobileSearchOpen])

  const showCompact = isScrolled && !forceExpanded

  return (
    <header className="sticky top-0 z-[130] border-b border-gray-200 bg-white shadow-sm md:bg-[#f7f7f7] md:shadow-none">
      <div className="w-full bg-white pb-1 pt-1 md:hidden">
        <div className="flex items-center justify-between px-4 pt-2">
          <Link
            href={homeHref}
            className="navienty-logo-mobile"
            aria-label="Navienty home"
          >
            <img
              src="https://i.ibb.co/p6CBgjz0/Navienty-13.png"
              alt="Navienty icon"
            />
          </Link>

          <label
            htmlFor="nav-menu-toggle"
            className="menu-trigger"
            aria-label="Open menu"
          >
            <span className="menu-trigger-lines" aria-hidden="true">
              <span />
              <span />
            </span>
          </label>
        </div>

        <div className="px-4 pb-4 pt-2">
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(true)}
            className="mx-auto flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-3.5 shadow-[0_3px_10px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-md"
          >
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
          </button>
        </div>

        {isMobileSearchOpen && (
          <div className="fixed inset-0 z-[220] bg-[#f2f2f2]">
            <div className="flex items-center justify-end px-4 pt-4 pb-2">
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                aria-label="Close search"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d8d8d8] bg-[#f7f7f7] text-[#222222] shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6l12 12M18 6L6 18"
                  />
                </svg>
              </button>
            </div>

            <div className="px-3 pb-6">
              <PropertiesSearchBar
                {...searchBarProps}
                mobileMode
                mobileOpen
                onRequestClose={() => setIsMobileSearchOpen(false)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <div className="mx-auto max-w-[1920px] px-6">
          <div
            className={`relative transition-all duration-300 ${
              showCompact ? 'h-[94px]' : 'h-[168px]'
            }`}
          >
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between">
              <div className="pointer-events-auto flex items-center">
                <Link
                  href={homeHref}
                  className="navienty-logo"
                  aria-label="Navienty home"
                >
                  <img
                    src="https://i.ibb.co/p6CBgjz0/Navienty-13.png"
                    alt="Navienty icon"
                    className="navienty-logo-icon"
                  />
                  <span className="navienty-logo-text-wrap">
                    <img
                      src="https://i.ibb.co/vxPhSfkG/Navienty-15.png"
                      alt="Navienty"
                      className="navienty-logo-text"
                    />
                  </span>
                </Link>
              </div>

              <div className="pointer-events-auto flex items-center">
                <label
                  htmlFor="nav-menu-toggle"
                  className="menu-trigger"
                  aria-label="Open menu"
                >
                  <span className="menu-trigger-lines" aria-hidden="true">
                    <span />
                    <span />
                  </span>
                </label>
              </div>
            </div>

            <div
              className={`absolute left-1/2 z-30 flex -translate-x-1/2 justify-center origin-center transition-all duration-300 ${
                showCompact
                  ? 'top-1/2 -translate-y-1/2 scale-[0.85] w-max'
                  : 'top-[72px] scale-[0.92] w-full max-w-[1000px]'
              }`}
            >
              <PropertiesSearchBar
                {...searchBarProps}
                compact={showCompact}
                onOpenMenuChange={(isOpen) => {
                  setForceExpanded(isOpen)
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}