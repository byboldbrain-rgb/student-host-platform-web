'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { HealthSpecialty } from '@/src/lib/services/health/types'

type City = {
  id: string | number
  name_en: string
  name_ar?: string
}

type Language = 'en' | 'ar'

type Props = {
  cities: City[]
  specialties: HealthSpecialty[]
  initialCityId?: string
  initialSpecialty?: string
  language?: Language
  currency?: string
  action?: string
}

type OpenMenu = 'city' | 'specialty' | null

export default function HealthSearchBar({
  cities = [],
  specialties = [],
  initialCityId = '',
  initialSpecialty = '',
  language = 'en',
  currency = 'EGP',
  action = '/services/health/search',
}: Props) {
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const [draftCityId, setDraftCityId] = useState(initialCityId)
  const [draftSpecialty, setDraftSpecialty] = useState(initialSpecialty)

  const isArabic = language === 'ar'

  useEffect(() => {
    setDraftCityId(initialCityId)
  }, [initialCityId])

  useEffect(() => {
    setDraftSpecialty(initialSpecialty)
  }, [initialSpecialty])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const selectedCityLabel = useMemo(() => {
    const city = cities.find((item) => String(item.id) === String(draftCityId))
    if (!city) return isArabic ? 'Search cities' : 'Search cities'
    return isArabic ? city.name_ar || city.name_en : city.name_en
  }, [cities, draftCityId, isArabic])

  const selectedSpecialtyLabel = useMemo(() => {
    const specialty = specialties.find(
      (item) => String(item.slug) === String(draftSpecialty)
    )
    if (!specialty) return isArabic ? 'Choose specialty' : 'Choose specialty'
    return isArabic
      ? specialty.name_ar || specialty.name_en
      : specialty.name_en || specialty.name_ar
  }, [specialties, draftSpecialty, isArabic])

  const applySearch = () => {
    const params = new URLSearchParams()

    if (draftCityId) {
      params.set('city_id', draftCityId)
    }

    if (draftSpecialty) {
      params.set('specialty', draftSpecialty)
    }

    if (language) {
      params.set('lang', language)
    }

    if (currency) {
      params.set('currency', currency)
    }

    const queryString = params.toString()

    if (action) {
      router.push(queryString ? `${action}?${queryString}` : action)
      return
    }

    router.push(queryString ? `/services/health/search?${queryString}` : '/services/health/search')
  }

  const panelClass = isArabic
    ? 'absolute right-0 top-[calc(100%+12px)] z-30 max-h-72 w-full min-w-[260px] overflow-auto rounded-[24px] border border-[#dddddd] bg-white p-3 shadow-[0_18px_40px_rgba(0,0,0,0.16)]'
    : 'absolute left-0 top-[calc(100%+12px)] z-30 max-h-72 w-full min-w-[260px] overflow-auto rounded-[24px] border border-[#dddddd] bg-white p-3 shadow-[0_18px_40px_rgba(0,0,0,0.16)]'

  const itemClass =
    'block w-full rounded-2xl px-4 py-3 text-left text-[16px] text-[#374151] transition hover:bg-[#f5f5f5]'

  return (
    <div className="w-full max-w-[1200px]">
      <div
        ref={wrapperRef}
        dir={isArabic ? 'rtl' : 'ltr'}
        className="flex w-full items-center overflow-visible rounded-full border border-[#dddddd] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
      >
        <div
          className={`relative min-w-0 flex-1 transition hover:bg-[#f7f7f7] ${
            isArabic ? 'rounded-r-full' : 'rounded-l-full'
          }`}
        >
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'city' ? null : 'city')}
            className={`w-full px-8 py-4 ${
              isArabic ? 'rounded-r-full text-right' : 'rounded-l-full text-left'
            }`}
          >
            <p className="text-[14px] font-semibold leading-none text-[#222222]">
              {isArabic ? 'City' : 'City'}
            </p>
            <p className="mt-1 truncate pr-6 text-[16px] font-normal text-[#6a6a6a]">
              {selectedCityLabel}
            </p>
          </button>

          {openMenu === 'city' && (
            <div className={panelClass}>
              <div className="mb-2 px-4 text-[15px] font-semibold text-gray-900">
                {isArabic ? 'Select city' : 'Select city'}
              </div>

              <button
                type="button"
                onClick={() => {
                  setDraftCityId('')
                  setOpenMenu(null)
                }}
                className={`${itemClass} ${isArabic ? 'text-right' : 'text-left'}`}
              >
                {isArabic ? 'Any city' : 'Any city'}
              </button>

              {cities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    setDraftCityId(String(city.id))
                    setOpenMenu(null)
                  }}
                  className={`${itemClass} ${
                    isArabic ? 'text-right' : 'text-left'
                  } ${
                    String(draftCityId) === String(city.id)
                      ? 'bg-gray-100 font-semibold text-gray-900'
                      : ''
                  }`}
                >
                  {isArabic ? city.name_ar || city.name_en : city.name_en}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-[#dddddd]" />

        <div
          className={`relative min-w-0 flex-1 transition hover:bg-[#f7f7f7]`}
        >
          <button
            type="button"
            onClick={() =>
              setOpenMenu(openMenu === 'specialty' ? null : 'specialty')
            }
            className={`w-full px-8 py-4 ${
              isArabic ? 'text-right' : 'text-left'
            }`}
          >
            <p className="text-[14px] font-semibold leading-none text-[#222222]">
              {isArabic ? 'Specialty' : 'Specialty'}
            </p>
            <p className="mt-1 truncate pr-6 text-[16px] font-normal text-[#6a6a6a]">
              {selectedSpecialtyLabel}
            </p>
          </button>

          {openMenu === 'specialty' && (
            <div className={panelClass}>
              <div className="mb-2 px-4 text-[15px] font-semibold text-gray-900">
                {isArabic ? 'Choose specialty' : 'Choose specialty'}
              </div>

              <button
                type="button"
                onClick={() => {
                  setDraftSpecialty('')
                  setOpenMenu(null)
                }}
                className={`${itemClass} ${isArabic ? 'text-right' : 'text-left'}`}
              >
                {isArabic ? 'Any specialty' : 'Any specialty'}
              </button>

              {specialties.map((specialty) => (
                <button
                  key={specialty.id}
                  type="button"
                  onClick={() => {
                    setDraftSpecialty(String(specialty.slug))
                    setOpenMenu(null)
                  }}
                  className={`${itemClass} ${
                    isArabic ? 'text-right' : 'text-left'
                  } ${
                    String(draftSpecialty) === String(specialty.slug)
                      ? 'bg-gray-100 font-semibold text-gray-900'
                      : ''
                  }`}
                >
                  {isArabic
                    ? specialty.name_ar || specialty.name_en
                    : specialty.name_en || specialty.name_ar}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4">
          <button
            type="button"
            onClick={applySearch}
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#0047ff] text-[20px] text-white shadow-sm transition hover:scale-[1.02]"
          >
            ⌕
          </button>
        </div>
      </div>
    </div>
  )
}