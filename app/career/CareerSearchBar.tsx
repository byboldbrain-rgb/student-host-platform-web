'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type City = {
  id: string | number
  name_en: string
}

type University = {
  id: string | number
  name_en: string
  city_id: string | number
}

type College = {
  id: string | number
  university_id: string | number
  name_en: string
  name_ar?: string | null
}

type Language = 'en' | 'ar'

type Labels = {
  city: string
  university: string
  college: string
  searchCities: string
  chooseUniversity: string
  chooseCollege: string
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
  colleges: College[]
  initialCityId?: string
  initialUniversityId?: string
  initialCollegeId?: string
  language?: Language
  currency?: string
  labels: Labels
}

type OpenMenu = 'city' | 'university' | 'college' | null

export default function CareerSearchBar({
  cities,
  universities,
  colleges,
  initialCityId = '',
  initialUniversityId = '',
  initialCollegeId = '',
  language = 'en',
  currency = 'EGP',
  labels,
}: Props) {
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const [draftCityId, setDraftCityId] = useState(initialCityId)
  const [draftUniversityId, setDraftUniversityId] = useState(initialUniversityId)
  const [draftCollegeId, setDraftCollegeId] = useState(initialCollegeId)

  const isArabic = language === 'ar'

  useEffect(() => {
    setDraftCityId(initialCityId)
  }, [initialCityId])

  useEffect(() => {
    setDraftUniversityId(initialUniversityId)
  }, [initialUniversityId])

  useEffect(() => {
    setDraftCollegeId(initialCollegeId)
  }, [initialCollegeId])

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
    return (
      cities.find((city) => String(city.id) === String(draftCityId))?.name_en ||
      labels.searchCities
    )
  }, [cities, draftCityId, labels.searchCities])

  const selectedUniversityLabel = useMemo(() => {
    return (
      universities.find(
        (university) => String(university.id) === String(draftUniversityId)
      )?.name_en || labels.chooseUniversity
    )
  }, [universities, draftUniversityId, labels.chooseUniversity])

  const selectedCollegeLabel = useMemo(() => {
    const selectedCollege = colleges.find(
      (college) => String(college.id) === String(draftCollegeId)
    )

    if (!selectedCollege) return labels.chooseCollege

    return isArabic
      ? selectedCollege.name_ar || selectedCollege.name_en
      : selectedCollege.name_en
  }, [colleges, draftCollegeId, labels.chooseCollege, isArabic])

  const filteredUniversities = useMemo(() => {
    if (!draftCityId) return universities

    return universities.filter(
      (university) => String(university.city_id) === String(draftCityId)
    )
  }, [draftCityId, universities])

  const filteredColleges = useMemo(() => {
    if (!draftUniversityId) return colleges

    return colleges.filter(
      (college) => String(college.university_id) === String(draftUniversityId)
    )
  }, [draftUniversityId, colleges])

  const applySearch = () => {
    const params = new URLSearchParams()

    if (draftCityId) {
      params.set('city_id', draftCityId)
    }

    if (draftUniversityId) {
      params.set('university_id', draftUniversityId)
    }

    if (draftCollegeId) {
      params.set('college_id', draftCollegeId)
    }

    if (language) {
      params.set('lang', language)
    }

    if (currency) {
      params.set('currency', currency)
    }

    const queryString = params.toString()
    router.push(queryString ? `/career?${queryString}` : '/career')
  }

  const panelClass = isArabic
    ? 'absolute right-0 top-[calc(100%+8px)] z-30 max-h-64 w-full min-w-[220px] overflow-auto rounded-2xl border border-[#dddddd] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)]'
    : 'absolute left-0 top-[calc(100%+8px)] z-30 max-h-64 w-full min-w-[220px] overflow-auto rounded-2xl border border-[#dddddd] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)]'

  const itemClass =
    'block w-full rounded-xl px-2 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100'

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
            <div className="mb-2 px-3 text-sm font-semibold text-gray-900">
              {labels.selectCity}
            </div>

            <button
              type="button"
              onClick={() => {
                setDraftCityId('')
                setDraftUniversityId('')
                setDraftCollegeId('')
                setOpenMenu(null)
              }}
              className={`${itemClass} ${isArabic ? 'text-right' : 'text-left'}`}
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
                  setDraftCollegeId('')
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
                {city.name_en}
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
            <div className="mb-2 px-3 text-sm font-semibold text-gray-900">
              {labels.selectUniversity}
            </div>

            <button
              type="button"
              onClick={() => {
                setDraftUniversityId('')
                setDraftCollegeId('')
                setOpenMenu(null)
              }}
              className={`${itemClass} ${isArabic ? 'text-right' : 'text-left'}`}
            >
              {labels.anyUniversity}
            </button>

            {filteredUniversities.map((university) => (
              <button
                key={university.id}
                type="button"
                onClick={() => {
                  setDraftUniversityId(String(university.id))
                  setDraftCollegeId('')
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
                {university.name_en}
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
            <div className="mb-2 px-3 text-sm font-semibold text-gray-900">
              {labels.selectCollege}
            </div>

            <button
              type="button"
              onClick={() => {
                setDraftCollegeId('')
                setOpenMenu(null)
              }}
              className={`${itemClass} ${isArabic ? 'text-right' : 'text-left'}`}
            >
              {labels.anyCollege}
            </button>

            {filteredColleges.map((college) => (
              <button
                key={college.id}
                type="button"
                onClick={() => {
                  setDraftCollegeId(String(college.id))
                  setOpenMenu(null)
                }}
                className={`${itemClass} ${
                  isArabic ? 'text-right' : 'text-left'
                } ${
                  String(draftCollegeId) === String(college.id)
                    ? 'bg-gray-100 font-semibold text-gray-900'
                    : ''
                }`}
              >
                {isArabic ? college.name_ar || college.name_en : college.name_en}
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
        >
          ⌕
        </button>
      </div>
    </div>
  )
}