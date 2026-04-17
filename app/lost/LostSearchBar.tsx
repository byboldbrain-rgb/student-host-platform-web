'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

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

type Language = 'en' | 'ar'

type Labels = {
  city: string
  university: string
  college: string
  selectCity: string
  selectUniversity: string
  selectCollege: string
  anyCity: string
  anyUniversity: string
  anyCollege: string
}

type Props = {
  cities: City[]
  universities: University[]
  colleges: string[]
  initialGovernorate?: string
  initialUniversity?: string
  initialCollege?: string
  language?: Language
  labels: Labels
}

type OpenMenu = 'city' | 'university' | 'college' | null

export default function LostSearchBar({
  cities,
  universities,
  colleges,
  initialGovernorate = '',
  initialUniversity = '',
  initialCollege = '',
  language = 'en',
  labels,
}: Props) {
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)

  const initialCityIdFromGovernorate = useMemo(() => {
    const matchedCity = cities.find((city) =>
      language === 'ar'
        ? city.name_ar === initialGovernorate
        : city.name_en === initialGovernorate
    )

    return matchedCity ? String(matchedCity.id) : ''
  }, [cities, initialGovernorate, language])

  const initialUniversityIdFromUniversity = useMemo(() => {
    const matchedUniversity = universities.find((university) =>
      language === 'ar'
        ? university.name_ar === initialUniversity
        : university.name_en === initialUniversity
    )

    return matchedUniversity ? String(matchedUniversity.id) : ''
  }, [universities, initialUniversity, language])

  const [draftCityId, setDraftCityId] = useState(initialCityIdFromGovernorate)
  const [draftUniversityId, setDraftUniversityId] = useState(
    initialUniversityIdFromUniversity
  )
  const [draftCollege, setDraftCollege] = useState(initialCollege)

  const isArabic = language === 'ar'

  useEffect(() => {
    setDraftCityId(initialCityIdFromGovernorate)
  }, [initialCityIdFromGovernorate])

  useEffect(() => {
    setDraftUniversityId(initialUniversityIdFromUniversity)
  }, [initialUniversityIdFromUniversity])

  useEffect(() => {
    setDraftCollege(initialCollege)
  }, [initialCollege])

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

  const selectedCity = useMemo(() => {
    return cities.find((city) => String(city.id) === String(draftCityId)) || null
  }, [cities, draftCityId])

  const filteredUniversities = useMemo(() => {
    if (!draftCityId) return universities

    return universities.filter(
      (university) => String(university.city_id) === String(draftCityId)
    )
  }, [draftCityId, universities])

  const selectedUniversity = useMemo(() => {
    return (
      universities.find(
        (university) => String(university.id) === String(draftUniversityId)
      ) || null
    )
  }, [universities, draftUniversityId])

  const selectedCityLabel = selectedCity
    ? isArabic
      ? selectedCity.name_ar
      : selectedCity.name_en
    : labels.selectCity

  const selectedUniversityLabel = selectedUniversity
    ? isArabic
      ? selectedUniversity.name_ar
      : selectedUniversity.name_en
    : labels.selectUniversity

  const selectedCollegeLabel = draftCollege || labels.selectCollege

  const applySearch = () => {
    const params = new URLSearchParams()

    if (selectedCity) {
      params.set(
        'governorate',
        isArabic ? selectedCity.name_ar : selectedCity.name_en
      )
    }

    if (selectedUniversity) {
      params.set(
        'university',
        isArabic ? selectedUniversity.name_ar : selectedUniversity.name_en
      )
    }

    if (draftCollege) {
      params.set('faculty', draftCollege)
    }

    params.set('status', 'available')
    params.set('lang', language)

    const queryString = params.toString()
    router.push(queryString ? `/lost/search?${queryString}` : '/lost/search')
  }

  const panelClass = isArabic
    ? 'absolute right-0 top-[calc(100%+8px)] z-30 max-h-64 w-full min-w-[220px] overflow-auto rounded-2xl border border-[#dddddd] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)]'
    : 'absolute left-0 top-[calc(100%+8px)] z-30 max-h-64 w-full min-w-[220px] overflow-auto rounded-2xl border border-[#dddddd] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)]'

  const itemClass =
    'block w-full rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100'

  return (
    <div
      ref={wrapperRef}
      dir={isArabic ? 'rtl' : 'ltr'}
      className="flex w-full max-w-[1200px] items-center rounded-full border border-[#dddddd] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
    >
      <div
        className={`relative min-w-0 flex-1 transition hover:bg-[#f7f7f7] ${
          isArabic ? 'rounded-r-full' : 'rounded-l-full'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === 'city' ? null : 'city')}
          className={`w-full px-6 py-3 ${
            isArabic ? 'rounded-r-full text-right' : 'rounded-l-full text-left'
          }`}
        >
          <p className="text-[14px] font-semibold leading-none text-[#222222]">
            {labels.city}
          </p>
          <p className="mt-1 truncate text-[16px] font-normal text-[#6a6a6a]">
            {selectedCityLabel}
          </p>
        </button>

        {openMenu === 'city' && (
          <div className={panelClass}>
            <button
              type="button"
              onClick={() => {
                setDraftCityId('')
                setDraftUniversityId('')
                setDraftCollege('')
                setOpenMenu(null)
              }}
              className={`${itemClass} ${
                isArabic ? 'text-right' : 'text-left'
              } ${!draftCityId ? 'bg-gray-100 font-semibold text-gray-900' : ''}`}
            >
              {labels.anyCity}
            </button>

            {cities.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => {
                  setDraftCityId(String(city.id))
                  setDraftUniversityId('')
                  setDraftCollege('')
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
                {isArabic ? city.name_ar : city.name_en}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-8 w-px bg-[#dddddd]" />

      <div className="relative min-w-0 flex-1 transition hover:bg-[#f7f7f7]">
        <button
          type="button"
          onClick={() =>
            setOpenMenu(openMenu === 'university' ? null : 'university')
          }
          className={`w-full px-6 py-3 ${isArabic ? 'text-right' : 'text-left'}`}
        >
          <p className="text-[14px] font-semibold leading-none text-[#222222]">
            {labels.university}
          </p>
          <p className="mt-1 truncate text-[16px] font-normal text-[#6a6a6a]">
            {selectedUniversityLabel}
          </p>
        </button>

        {openMenu === 'university' && (
          <div className={panelClass}>
            <button
              type="button"
              onClick={() => {
                setDraftUniversityId('')
                setDraftCollege('')
                setOpenMenu(null)
              }}
              className={`${itemClass} ${
                isArabic ? 'text-right' : 'text-left'
              } ${
                !draftUniversityId ? 'bg-gray-100 font-semibold text-gray-900' : ''
              }`}
            >
              {labels.anyUniversity}
            </button>

            {filteredUniversities.map((university) => (
              <button
                key={university.id}
                type="button"
                onClick={() => {
                  setDraftUniversityId(String(university.id))
                  setDraftCollege('')
                  setOpenMenu(null)
                }}
                className={`${itemClass} ${
                  isArabic ? 'text-right' : 'text-left'
                } ${
                  String(draftUniversityId) === String(university.id)
                    ? 'bg-gray-100 font-semibold text-gray-900'
                    : ''
                }`}
              >
                {isArabic ? university.name_ar : university.name_en}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-8 w-px bg-[#dddddd]" />

      <div className="relative min-w-0 flex-1 transition hover:bg-[#f7f7f7]">
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === 'college' ? null : 'college')}
          className={`w-full px-6 py-3 ${isArabic ? 'text-right' : 'text-left'}`}
        >
          <p className="text-[14px] font-semibold leading-none text-[#222222]">
            {labels.college}
          </p>
          <p className="mt-1 truncate text-[16px] font-normal text-[#6a6a6a]">
            {selectedCollegeLabel}
          </p>
        </button>

        {openMenu === 'college' && (
          <div className={panelClass}>
            <button
              type="button"
              onClick={() => {
                setDraftCollege('')
                setOpenMenu(null)
              }}
              className={`${itemClass} ${
                isArabic ? 'text-right' : 'text-left'
              } ${!draftCollege ? 'bg-gray-100 font-semibold text-gray-900' : ''}`}
            >
              {labels.anyCollege}
            </button>

            {colleges.map((college) => (
              <button
                key={college}
                type="button"
                onClick={() => {
                  setDraftCollege(college)
                  setOpenMenu(null)
                }}
                className={`${itemClass} ${
                  isArabic ? 'text-right' : 'text-left'
                } ${
                  draftCollege === college
                    ? 'bg-gray-100 font-semibold text-gray-900'
                    : ''
                }`}
              >
                {college}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pr-4">
        <button
          type="button"
          onClick={applySearch}
          className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#0047ff] text-[20px] text-white shadow-sm transition hover:scale-[1.02]"
          aria-label="Search"
        >
          ⌕
        </button>
      </div>
    </div>
  )
}