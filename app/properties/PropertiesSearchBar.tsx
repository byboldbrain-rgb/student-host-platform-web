'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

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

type PropertyArea = {
  id: string | number
  city_id: string | number
  name_en: string
  name_ar?: string
  is_active?: boolean
}

type UniversityArea = {
  id?: string | number
  university_id: string | number
  area_id: string | number
}

type Language = 'en' | 'ar'

type Labels = {
  city: string
  university: string
  area: string
  duration: string

  searchCities: string
  searchAreas: string

  chooseUniversity: string
  chooseArea: string
  chooseDuration: string

  selectCity: string
  selectUniversity: string
  selectArea: string
  selectDuration: string

  anyCity: string
  anyUniversity: string
  anyArea: string
  anyDuration: string

  daily: string
  monthly: string

  search?: string
  clearAll?: string
}

type Props = {
  cities?: City[]
  universities?: University[]
  areas?: PropertyArea[]
  universityAreas?: UniversityArea[]

  initialCityId?: string
  initialUniversityId?: string
  initialAreaId?: string
  initialRentalDuration?: string
  initialPriceRange?: string

  language?: Language
  currency?: string
  labels: Labels
  compact?: boolean
  onOpenMenuChange?: (isOpen: boolean) => void
  mobileMode?: boolean
  mobileOpen?: boolean
  onRequestClose?: () => void

  /**
   * Search page only customizations
   * خليهم optional علشان باقي الصفحات ما تتأثرش
   */
  mobileHeaderStartSlot?: ReactNode
  mobileHeaderEndSlot?: ReactNode
  mobileSearchBarClassName?: string
}

type OpenMenu = 'city' | 'university' | 'area' | null

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
      />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  )
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function PropertiesSearchBar({
  cities = [],
  universities = [],
  areas = [],
  universityAreas = [],
  initialCityId = '',
  initialUniversityId = '',
  initialAreaId = '',
  initialRentalDuration = '',
  initialPriceRange = '',
  language = 'en',
  currency = 'EGP',
  labels,
  compact = false,
  onOpenMenuChange,
  mobileMode = false,
  mobileOpen = false,
  onRequestClose,

  mobileHeaderStartSlot,
  mobileHeaderEndSlot,
  mobileSearchBarClassName = '',
}: Props) {
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const cityInputRef = useRef<HTMLInputElement | null>(null)
  const universityInputRef = useRef<HTMLInputElement | null>(null)
  const areaInputRef = useRef<HTMLInputElement | null>(null)

  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const [draftCityId, setDraftCityId] = useState(initialCityId)
  const [draftUniversityId, setDraftUniversityId] =
    useState(initialUniversityId)
  const [draftAreaId, setDraftAreaId] = useState(initialAreaId)

  const [cityQuery, setCityQuery] = useState('')
  const [universityQuery, setUniversityQuery] = useState('')
  const [areaQuery, setAreaQuery] = useState('')

  const isArabic = language === 'ar'
  const isExpandedSearch = openMenu !== null
  const isCompact = compact && !isExpandedSearch

  const searchLabel = labels.search ?? (isArabic ? 'بحث' : 'Search')
  const clearAllLabel = labels.clearAll ?? (isArabic ? 'مسح الكل' : 'Clear all')

  const canOpenUniversity = !!draftCityId
  const canOpenArea = !!draftCityId && !!draftUniversityId

  const openUniversityMenu = () => {
    if (!canOpenUniversity) {
      setOpenMenu('city')
      setCityQuery('')
      return
    }

    setOpenMenu(openMenu === 'university' ? null : 'university')
    setUniversityQuery('')
  }

  const openAreaMenu = () => {
    if (!draftCityId) {
      setOpenMenu('city')
      setCityQuery('')
      return
    }

    if (!draftUniversityId) {
      setOpenMenu('university')
      setUniversityQuery('')
      return
    }

    setOpenMenu(openMenu === 'area' ? null : 'area')
    setAreaQuery('')
  }

  useEffect(() => {
    onOpenMenuChange?.(openMenu !== null)
  }, [openMenu, onOpenMenuChange])

  useEffect(() => {
    setDraftCityId(initialCityId)
  }, [initialCityId])

  useEffect(() => {
    setDraftUniversityId(initialUniversityId)
  }, [initialUniversityId])

  useEffect(() => {
    setDraftAreaId(initialAreaId)
  }, [initialAreaId])

  useEffect(() => {
    if (!mobileMode) {
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
    }
  }, [mobileMode])

  useEffect(() => {
    if (mobileMode && mobileOpen) {
      setOpenMenu('city')
      setCityQuery('')
      setUniversityQuery('')
      setAreaQuery('')
    }
  }, [mobileMode, mobileOpen])

  useEffect(() => {
    if (openMenu === 'city') {
      setTimeout(() => cityInputRef.current?.focus(), 0)
    }

    if (openMenu === 'university') {
      setTimeout(() => universityInputRef.current?.focus(), 0)
    }

    if (openMenu === 'area') {
      setTimeout(() => areaInputRef.current?.focus(), 0)
    }
  }, [openMenu])

  const getCityName = (city: City) =>
    isArabic ? city.name_ar || city.name_en : city.name_en

  const getUniversityName = (university: University) =>
    isArabic ? university.name_ar || university.name_en : university.name_en

  const getAreaName = (area: PropertyArea) =>
    isArabic ? area.name_ar || area.name_en : area.name_en

  const selectedCityLabel = useMemo(() => {
    const cityName = cities.find(
      (city) => String(city.id) === String(draftCityId)
    )
    if (cityName) return getCityName(cityName)
    return isCompact ? labels.city : labels.selectCity
  }, [cities, draftCityId, isCompact, labels.city, labels.selectCity, isArabic])

  const selectedUniversityLabel = useMemo(() => {
    const uni = universities.find(
      (university) => String(university.id) === String(draftUniversityId)
    )
    if (uni) return getUniversityName(uni)
    return isCompact ? labels.university : labels.selectUniversity
  }, [
    universities,
    draftUniversityId,
    labels.selectUniversity,
    labels.university,
    isCompact,
    isArabic,
  ])

  const selectedAreaLabel = useMemo(() => {
    const area = areas.find((item) => String(item.id) === String(draftAreaId))
    if (area) return getAreaName(area)
    return isCompact ? labels.area : labels.selectArea
  }, [areas, draftAreaId, labels.area, labels.selectArea, isCompact, isArabic])

  const applySearch = (
    nextValues?: Partial<{
      cityId: string
      universityId: string
      areaId: string
    }>
  ) => {
    const cityId = nextValues?.cityId ?? draftCityId
    const universityId = nextValues?.universityId ?? draftUniversityId
    const areaId = nextValues?.areaId ?? draftAreaId

    const params = new URLSearchParams()

    params.set('rental_duration', 'monthly')

    if (cityId) params.set('city_id', cityId)
    if (universityId) params.set('university_id', universityId)
    if (areaId) params.set('area_id', areaId)
    if (initialPriceRange) params.set('price_range', initialPriceRange)
    if (language) params.set('lang', language)
    if (currency) params.set('currency', currency)

    const queryString = params.toString()

    onRequestClose?.()

    router.push(
      queryString ? `/properties/search?${queryString}` : '/properties/search'
    )
  }

  const resetAll = () => {
    setDraftCityId('')
    setDraftUniversityId('')
    setDraftAreaId('')
    setCityQuery('')
    setUniversityQuery('')
    setAreaQuery('')
    setOpenMenu('city')
  }

  const cityUniversities = useMemo(() => {
    if (!draftCityId) return []

    return universities.filter(
      (university) => String(university.city_id) === String(draftCityId)
    )
  }, [draftCityId, universities])

  const universityAreaIds = useMemo(() => {
    if (!draftUniversityId) return new Set<string>()

    return new Set(
      universityAreas
        .filter(
          (item) => String(item.university_id) === String(draftUniversityId)
        )
        .map((item) => String(item.area_id))
    )
  }, [draftUniversityId, universityAreas])

  const cityAreas = useMemo(() => {
    if (!draftCityId || !draftUniversityId) return []

    let nextAreas = areas.filter(
      (area) =>
        area.is_active !== false && String(area.city_id) === String(draftCityId)
    )

    if (universityAreaIds.size > 0) {
      nextAreas = nextAreas.filter((area) =>
        universityAreaIds.has(String(area.id))
      )
    }

    return nextAreas
  }, [areas, draftCityId, draftUniversityId, universityAreaIds])

  const filteredCities = useMemo(() => {
    const query = cityQuery.trim().toLowerCase()
    if (!query) return cities

    return cities.filter((city) =>
      getCityName(city).toLowerCase().includes(query)
    )
  }, [cities, cityQuery, isArabic])

  const filteredUniversities = useMemo(() => {
    const query = universityQuery.trim().toLowerCase()
    if (!query) return cityUniversities

    return cityUniversities.filter((university) =>
      getUniversityName(university).toLowerCase().includes(query)
    )
  }, [cityUniversities, universityQuery, isArabic])

  const filteredAreas = useMemo(() => {
    const query = areaQuery.trim().toLowerCase()
    if (!query) return cityAreas

    return cityAreas.filter((area) =>
      getAreaName(area).toLowerCase().includes(query)
    )
  }, [cityAreas, areaQuery, isArabic])

  const universityPlaceholder = draftCityId
    ? labels.chooseUniversity
    : labels.selectCity

  const areaPlaceholder =
    draftCityId && draftUniversityId
      ? labels.chooseArea
      : `${labels.selectCity} / ${labels.selectUniversity}`

  const disabledValueTextClass = 'text-[#a1a1a1] dark:text-slate-600'

  const panelClass = isArabic
    ? 'absolute right-0 top-[calc(100%+8px)] z-[80] max-h-72 w-full min-w-[220px] overflow-auto rounded-2xl border border-[#dddddd] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)]'
    : 'absolute left-0 top-[calc(100%+8px)] z-[80] max-h-72 w-full min-w-[220px] overflow-auto rounded-2xl border border-[#dddddd] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)]'

  const itemClass =
    'block w-full rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-white/10'

  const inlineInputClass = `mt-1 w-full bg-transparent p-0 text-[16px] font-normal text-[#222222] outline-none placeholder:text-[#6a6a6a] dark:text-slate-100 dark:placeholder:text-slate-500 ${
    isArabic ? 'text-right' : 'text-left'
  }`

  const valueTextClass = isCompact
    ? 'truncate text-[14px] font-semibold leading-none text-[#222222] dark:text-slate-100'
    : 'mt-1 truncate text-[16px] font-normal text-[#6a6a6a] dark:text-slate-400'

  const titleTextClass = isCompact
    ? 'sr-only'
    : 'text-[14px] font-semibold leading-none text-[#222222] dark:text-slate-100'

  const sectionPaddingClass = isCompact ? 'px-3 py-2' : 'px-5 py-3'

  if (mobileMode) {
    const showCityCard =
      openMenu !== 'city' && openMenu !== 'university' && openMenu !== 'area'

    const showUniversityCard = openMenu !== 'university' && openMenu !== 'area'

    const showAreaCard = openMenu !== 'area'

    return (
      <div dir={isArabic ? 'rtl' : 'ltr'} className="w-full">

      <style>{`
        @media (prefers-color-scheme: dark) {
          input {
            color-scheme: dark;
          }

          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus {
            -webkit-text-fill-color: #f8fafc;
            box-shadow: 0 0 0 1000px #111827 inset;
            transition: background-color 9999s ease-in-out 0s;
          }
        }
      `}</style>


        <div className="space-y-3">
          <div
            className={cn(
              'rounded-[24px] border border-[#e4e4e4] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_12px_30px_rgba(0,0,0,0.32)]',
              mobileSearchBarClassName
            )}
          >
            <div className="mb-4">
              <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-[#222222] dark:text-slate-100">
                {openMenu === 'city'
                  ? labels.selectCity
                  : openMenu === 'university'
                    ? labels.selectUniversity
                    : labels.selectArea}
              </h2>
            </div>

            {openMenu === 'city' && (
              <>
                <div className="mb-3 flex items-center gap-3 rounded-[12px] border border-[#cfcfcf] px-4 py-3.5 text-[#222222] dark:border-white/10 dark:bg-[#111827] dark:text-slate-100">
                  <SearchIcon />
                  <input
                    ref={cityInputRef}
                    type="text"
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                    placeholder={labels.searchCities}
                    className={`w-full bg-transparent text-[14px] text-[#222222] outline-none placeholder:text-[#8a8a8a] dark:text-slate-100 dark:placeholder:text-slate-500 ${
                      isArabic ? 'text-right' : 'text-left'
                    }`}
                  />
                </div>

                <div className="max-h-[50vh] space-y-1 overflow-y-auto pr-1">
                  {filteredCities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => {
                        const nextCityId = String(city.id)
                        setDraftCityId(nextCityId)
                        setDraftUniversityId('')
                        setDraftAreaId('')
                        setCityQuery('')
                        setUniversityQuery('')
                        setAreaQuery('')
                        setOpenMenu('university')
                      }}
                      className={`flex w-full items-center rounded-2xl px-2 py-3 text-left transition hover:bg-[#f7f7f7] dark:hover:bg-white/10 ${
                        isArabic ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold leading-[1.2] text-[#2a2a2a] dark:text-slate-100">
                          {getCityName(city)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {openMenu === 'university' && (
              <>
                <div className="mb-3 rounded-[18px] border border-[#dddddd] bg-white px-5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
                  <button
                    type="button"
                    onClick={() => {
                      setUniversityQuery('')
                      setOpenMenu('city')
                    }}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <p className="text-[13px] font-medium text-[#6f6f6f] dark:text-slate-400">
                      {labels.selectCity}
                    </p>

                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-[14px] font-medium text-[#222222] dark:text-slate-100">
                        {draftCityId ? selectedCityLabel : labels.selectCity}
                      </span>
                      <ChevronDownIcon />
                    </div>
                  </button>
                </div>

                <div className="mb-3 flex items-center gap-3 rounded-[12px] border border-[#cfcfcf] px-4 py-3.5 text-[#222222] dark:border-white/10 dark:bg-[#111827] dark:text-slate-100">
                  <SearchIcon />
                  <input
                    ref={universityInputRef}
                    type="text"
                    value={universityQuery}
                    onChange={(e) => setUniversityQuery(e.target.value)}
                    placeholder={universityPlaceholder}
                    disabled={!canOpenUniversity}
                    className={`w-full bg-transparent text-[14px] text-[#222222] outline-none placeholder:text-[#8a8a8a] disabled:cursor-not-allowed disabled:text-[#a1a1a1] dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:text-slate-600 ${
                      isArabic ? 'text-right' : 'text-left'
                    }`}
                  />
                </div>

                <div className="max-h-[40vh] space-y-1 overflow-y-auto pr-1">
                  {filteredUniversities.map((university) => (
                    <button
                      key={university.id}
                      type="button"
                      onClick={() => {
                        setDraftUniversityId(String(university.id))
                        setDraftAreaId('')
                        setUniversityQuery('')
                        setAreaQuery('')
                        setOpenMenu('area')
                      }}
                      className={`flex w-full items-center rounded-2xl px-2 py-3 text-left transition hover:bg-[#f7f7f7] dark:hover:bg-white/10 ${
                        isArabic ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold leading-[1.2] text-[#2a2a2a] dark:text-slate-100">
                          {getUniversityName(university)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {openMenu === 'area' && (
              <>
                <div className="mb-3 rounded-[18px] border border-[#dddddd] bg-white px-5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
                  <button
                    type="button"
                    onClick={() => setOpenMenu('city')}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <p className="text-[13px] font-medium text-[#6f6f6f] dark:text-slate-400">
                      {labels.selectCity}
                    </p>

                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-[14px] font-medium text-[#222222] dark:text-slate-100">
                        {draftCityId ? selectedCityLabel : labels.selectCity}
                      </span>
                      <ChevronDownIcon />
                    </div>
                  </button>
                </div>

                <div className="mb-3 rounded-[18px] border border-[#dddddd] bg-white px-5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
                  <button
                    type="button"
                    onClick={() => {
                      if (!draftCityId) {
                        setOpenMenu('city')
                        return
                      }

                      setOpenMenu('university')
                    }}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <p className="text-[13px] font-medium text-[#6f6f6f] dark:text-slate-400">
                      {labels.selectUniversity}
                    </p>

                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-[14px] font-medium text-[#222222] dark:text-slate-100">
                        {draftUniversityId
                          ? selectedUniversityLabel
                          : labels.selectUniversity}
                      </span>
                      <ChevronDownIcon />
                    </div>
                  </button>
                </div>

                <div className="mb-3 flex items-center gap-3 rounded-[12px] border border-[#cfcfcf] px-4 py-3.5 text-[#222222] dark:border-white/10 dark:bg-[#111827] dark:text-slate-100">
                  <SearchIcon />
                  <input
                    ref={areaInputRef}
                    type="text"
                    value={areaQuery}
                    onChange={(e) => setAreaQuery(e.target.value)}
                    placeholder={areaPlaceholder}
                    disabled={!canOpenArea}
                    className={`w-full bg-transparent text-[14px] text-[#222222] outline-none placeholder:text-[#8a8a8a] disabled:cursor-not-allowed disabled:text-[#a1a1a1] dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:text-slate-600 ${
                      isArabic ? 'text-right' : 'text-left'
                    }`}
                  />
                </div>

                <div className="max-h-[40vh] space-y-1 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftAreaId('')
                      setAreaQuery('')
                      setOpenMenu(null)
                    }}
                    className={`flex w-full items-center rounded-2xl px-2 py-3 text-left transition hover:bg-[#f7f7f7] dark:hover:bg-white/10 ${
                      isArabic ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold leading-[1.2] text-[#2a2a2a] dark:text-slate-100">
                        {labels.anyArea}
                      </p>
                    </div>
                  </button>

                  {filteredAreas.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => {
                        setDraftAreaId(String(area.id))
                        setAreaQuery('')
                        setOpenMenu(null)
                      }}
                      className={`flex w-full items-center rounded-2xl px-2 py-3 text-left transition hover:bg-[#f7f7f7] dark:hover:bg-white/10 ${
                        isArabic ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold leading-[1.2] text-[#2a2a2a] dark:text-slate-100">
                          {getAreaName(area)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {showCityCard && (
            <button
              type="button"
              onClick={() => {
                setCityQuery('')
                setOpenMenu('city')
              }}
              className="flex w-full items-center justify-between rounded-[18px] border border-[#dddddd] bg-white px-5 py-4 text-left shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_10px_24px_rgba(0,0,0,0.24)]"
            >
              <div>
                <p className="text-[13px] font-medium text-[#6f6f6f] dark:text-slate-400">
                  {labels.city}
                </p>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-[14px] font-medium text-[#222222] dark:text-slate-100">
                  {draftCityId ? selectedCityLabel : labels.selectCity}
                </span>
                <ChevronDownIcon />
              </div>
            </button>
          )}

          {showUniversityCard && (
            <button
              type="button"
              onClick={openUniversityMenu}
              className={`flex w-full items-center justify-between rounded-[18px] border border-[#dddddd] bg-white px-5 py-4 text-left shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_10px_24px_rgba(0,0,0,0.24)] ${
                canOpenUniversity ? '' : 'cursor-not-allowed opacity-55'
              }`}
            >
              <div>
                <p className="text-[13px] font-medium text-[#6f6f6f] dark:text-slate-400">
                  {labels.university}
                </p>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-[14px] font-medium text-[#222222] dark:text-slate-100">
                  {draftUniversityId
                    ? selectedUniversityLabel
                    : labels.selectUniversity}
                </span>
                <ChevronDownIcon />
              </div>
            </button>
          )}

          {showAreaCard && (
            <button
              type="button"
              onClick={openAreaMenu}
              className={`flex w-full items-center justify-between rounded-[18px] border border-[#dddddd] bg-white px-5 py-4 text-left shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_10px_24px_rgba(0,0,0,0.24)] ${
                canOpenArea ? '' : 'cursor-not-allowed opacity-55'
              }`}
            >
              <div>
                <p className="text-[13px] font-medium text-[#6f6f6f] dark:text-slate-400">
                  {labels.area}
                </p>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-[14px] font-medium text-[#222222] dark:text-slate-100">
                  {draftAreaId ? selectedAreaLabel : labels.selectArea}
                </span>
                <ChevronDownIcon />
              </div>
            </button>
          )}

          <div className="flex items-center justify-between px-3 pt-2">
            <button
              type="button"
              onClick={resetAll}
              className="text-[15px] font-medium text-[#222222] dark:text-slate-100"
            >
              {clearAllLabel}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!draftCityId) {
                  setOpenMenu('city')
                  return
                }

                if (!draftUniversityId) {
                  setOpenMenu('university')
                  return
                }

                if (!draftAreaId) {
                  setOpenMenu('area')
                  return
                }

                applySearch()
              }}
              className="flex h-[46px] items-center justify-center gap-2 rounded-full bg-[#0047ff] px-6 text-[16px] font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] dark:bg-[#2563eb] dark:hover:bg-[#1d4ed8]"
            >
              <SearchIcon />
              <span>{searchLabel}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pointer-events-auto w-full">

      <style>{`
        @media (prefers-color-scheme: dark) {
          input {
            color-scheme: dark;
          }

          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus {
            -webkit-text-fill-color: #f8fafc;
            box-shadow: 0 0 0 1000px #111827 inset;
            transition: background-color 9999s ease-in-out 0s;
          }
        }
      `}</style>


      <div
        ref={wrapperRef}
        dir={isArabic ? 'rtl' : 'ltr'}
        className={`pointer-events-auto relative z-[70] mx-auto flex items-center rounded-full border border-[#dddddd] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-300 dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_12px_30px_rgba(0,0,0,0.30)] ${
          isCompact ? 'w-fit max-w-full px-1 py-1' : 'w-full max-w-[900px]'
        }`}
      >
        <div
          className={`relative z-[71] min-w-0 transition hover:bg-[#f7f7f7] dark:hover:bg-white/10 ${
            isArabic ? 'rounded-r-full' : 'rounded-l-full'
          } ${isCompact ? 'w-auto flex-none' : 'flex-1'}`}
        >
          <button
            type="button"
            onClick={() => {
              setOpenMenu(openMenu === 'city' ? null : 'city')
              setCityQuery('')
            }}
            className={`relative z-[72] w-full cursor-pointer ${sectionPaddingClass} ${
              isArabic ? 'rounded-r-full text-right' : 'rounded-l-full text-left'
            } ${isCompact ? 'min-w-[100px]' : ''}`}
          >
            <p className={titleTextClass}>{labels.city}</p>

            {openMenu === 'city' ? (
              <input
                ref={cityInputRef}
                type="text"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={labels.searchCities}
                className={inlineInputClass}
              />
            ) : (
              <p className={valueTextClass}>{selectedCityLabel}</p>
            )}
          </button>

          {openMenu === 'city' && (
            <div className={panelClass}>
              {filteredCities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    const nextCityId = String(city.id)
                    setDraftCityId(nextCityId)
                    setDraftUniversityId('')
                    setDraftAreaId('')
                    setCityQuery('')
                    setUniversityQuery('')
                    setAreaQuery('')
                    setOpenMenu('university')
                  }}
                  className={`${itemClass} ${isArabic ? 'text-right' : 'text-left'} ${
                    String(draftCityId) === String(city.id)
                      ? 'bg-gray-100 font-semibold text-gray-900 dark:bg-white/10 dark:text-slate-100'
                      : ''
                  }`}
                >
                  {getCityName(city)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className={`${isCompact ? 'mx-0 h-4' : 'mx-0 h-8'} w-px shrink-0 bg-[#dddddd] dark:bg-white/10`}
        />

        <div
          className={`relative z-[71] min-w-0 transition ${
            canOpenUniversity ? 'hover:bg-[#f7f7f7] dark:hover:bg-white/10' : 'opacity-55'
          } ${isCompact ? 'w-auto flex-none' : 'flex-1'}`}
        >
          <button
            type="button"
            onClick={openUniversityMenu}
            className={`relative z-[72] w-full ${sectionPaddingClass} ${
              canOpenUniversity ? 'cursor-pointer' : 'cursor-not-allowed'
            } ${isArabic ? 'text-right' : 'text-left'} ${
              isCompact ? 'min-w-[120px]' : ''
            }`}
          >
            <p className={titleTextClass}>{labels.university}</p>

            {openMenu === 'university' ? (
              <input
                ref={universityInputRef}
                type="text"
                value={universityQuery}
                onChange={(e) => setUniversityQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={universityPlaceholder}
                disabled={!canOpenUniversity}
                className={inlineInputClass}
              />
            ) : (
              <p
                className={`${valueTextClass} ${
                  canOpenUniversity ? '' : disabledValueTextClass
                }`}
              >
                {selectedUniversityLabel}
              </p>
            )}
          </button>

          {openMenu === 'university' && canOpenUniversity && (
            <div className={panelClass}>
              {filteredUniversities.map((university) => (
                <button
                  key={university.id}
                  type="button"
                  onClick={() => {
                    setDraftUniversityId(String(university.id))
                    setDraftAreaId('')
                    setUniversityQuery('')
                    setAreaQuery('')
                    setOpenMenu('area')
                  }}
                  className={`${itemClass} ${isArabic ? 'text-right' : 'text-left'} ${
                    String(draftUniversityId) === String(university.id)
                      ? 'bg-gray-100 font-semibold text-gray-900 dark:bg-white/10 dark:text-slate-100'
                      : ''
                  }`}
                >
                  {getUniversityName(university)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className={`${isCompact ? 'mx-0 h-4' : 'mx-0 h-8'} w-px shrink-0 bg-[#dddddd] dark:bg-white/10`}
        />

        <div
          className={`relative z-[71] min-w-0 transition ${
            canOpenArea ? 'hover:bg-[#f7f7f7] dark:hover:bg-white/10' : 'opacity-55'
          } ${isCompact ? 'w-auto flex-none' : 'flex-1'}`}
        >
          <button
            type="button"
            onClick={openAreaMenu}
            className={`relative z-[72] w-full ${sectionPaddingClass} ${
              canOpenArea ? 'cursor-pointer' : 'cursor-not-allowed'
            } ${isArabic ? 'text-right' : 'text-left'} ${
              isCompact ? 'min-w-[105px]' : ''
            }`}
          >
            <p className={titleTextClass}>{labels.area}</p>

            {openMenu === 'area' ? (
              <input
                ref={areaInputRef}
                type="text"
                value={areaQuery}
                onChange={(e) => setAreaQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={areaPlaceholder}
                disabled={!canOpenArea}
                className={inlineInputClass}
              />
            ) : (
              <p
                className={`${valueTextClass} ${
                  canOpenArea ? '' : disabledValueTextClass
                }`}
              >
                {selectedAreaLabel}
              </p>
            )}
          </button>

          {openMenu === 'area' && canOpenArea && (
            <div className={panelClass}>
              <button
                type="button"
                onClick={() => {
                  setDraftAreaId('')
                  setAreaQuery('')
                  setOpenMenu(null)
                }}
                className={`${itemClass} ${isArabic ? 'text-right' : 'text-left'} ${
                  !draftAreaId ? 'bg-gray-100 font-semibold text-gray-900 dark:bg-white/10 dark:text-slate-100' : ''
                }`}
              >
                {labels.anyArea}
              </button>

              {filteredAreas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => {
                    setDraftAreaId(String(area.id))
                    setAreaQuery('')
                    setOpenMenu(null)
                  }}
                  className={`${itemClass} ${isArabic ? 'text-right' : 'text-left'} ${
                    String(draftAreaId) === String(area.id)
                      ? 'bg-gray-100 font-semibold text-gray-900 dark:bg-white/10 dark:text-slate-100'
                      : ''
                  }`}
                >
                  {getAreaName(area)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`${isCompact ? 'pl-1 pr-1' : 'pr-4'} shrink-0`}>
          <button
            type="button"
            onClick={() => {
              if (!draftCityId) {
                setOpenMenu('city')
                return
              }

              if (!draftUniversityId) {
                setOpenMenu('university')
                return
              }

              if (!draftAreaId) {
                setOpenMenu('area')
                return
              }

              applySearch()
            }}
            className={`flex items-center justify-center rounded-full bg-[#0047ff] text-white shadow-sm transition-all duration-200 hover:scale-[1.05] dark:bg-[#2563eb] dark:hover:bg-[#1d4ed8] ${
              isExpandedSearch
                ? 'h-[44px] gap-2 px-4'
                : isCompact
                  ? 'h-[40px] w-[40px]'
                  : 'h-[48px] w-[48px]'
            }`}
          >
            <SearchIcon />
            {isExpandedSearch && (
              <span className="text-[15px] font-semibold leading-none">
                {searchLabel}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}