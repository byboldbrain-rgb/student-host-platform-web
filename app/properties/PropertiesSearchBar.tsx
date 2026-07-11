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
  is_active?: boolean | null
}

type UniversityArea = {
  id?: string | number
  university_id: string | number
  area_id: string | number
}

type Language = 'en' | 'ar'
type LocationMode = 'city-university-area' | 'city-area'

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
   * city-area removes the university step completely and filters areas
   * directly by property_areas.city_id.
   */
  locationMode?: LocationMode

  mobileHeaderStartSlot?: ReactNode
  mobileHeaderEndSlot?: ReactNode
  mobileSearchBarClassName?: string
}

type OpenMenu = 'city' | 'university' | 'area' | null

function SearchIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className={className}
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
  locationMode = 'city-university-area',
  mobileHeaderStartSlot,
  mobileHeaderEndSlot,
  mobileSearchBarClassName = '',
}: Props) {
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const cityInputRef = useRef<HTMLInputElement | null>(null)
  const universityInputRef = useRef<HTMLInputElement | null>(null)
  const areaInputRef = useRef<HTMLInputElement | null>(null)

  const isCityAreaMode = locationMode === 'city-area'
  const normalizedInitialUniversityId = isCityAreaMode
    ? ''
    : initialUniversityId

  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const [draftCityId, setDraftCityId] = useState(initialCityId)
  const [draftUniversityId, setDraftUniversityId] = useState(
    normalizedInitialUniversityId
  )
  const [draftAreaId, setDraftAreaId] = useState(initialAreaId)

  const [cityQuery, setCityQuery] = useState('')
  const [universityQuery, setUniversityQuery] = useState('')
  const [areaQuery, setAreaQuery] = useState('')

  const isArabic = language === 'ar'
  const isExpandedSearch = openMenu !== null
  const isCompact = compact && !isExpandedSearch

  const searchLabel = labels.search ?? (isArabic ? 'بحث' : 'Search')
  const clearAllLabel = labels.clearAll ?? (isArabic ? 'مسح الكل' : 'Clear all')
  const noResultsLabel = isArabic ? 'لا توجد نتائج' : 'No results found'

  const canOpenUniversity = !!draftCityId
  const canOpenArea =
    !!draftCityId && (isCityAreaMode || !!draftUniversityId)

  const getCityName = (city: City) =>
    isArabic ? city.name_ar || city.name_en : city.name_en

  const getUniversityName = (university: University) =>
    isArabic ? university.name_ar || university.name_en : university.name_en

  const getAreaName = (area: PropertyArea) =>
    isArabic ? area.name_ar || area.name_en : area.name_en

  const openUniversityMenu = () => {
    if (isCityAreaMode) {
      openAreaMenu()
      return
    }

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

    if (!isCityAreaMode && !draftUniversityId) {
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
    setDraftUniversityId(isCityAreaMode ? '' : initialUniversityId)
  }, [initialUniversityId, isCityAreaMode])

  useEffect(() => {
    setDraftAreaId(initialAreaId)
  }, [initialAreaId])

  useEffect(() => {
    if (mobileMode) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mobileMode])

  useEffect(() => {
    if (!mobileMode || !mobileOpen) return

    setOpenMenu('city')
    setCityQuery('')
    setUniversityQuery('')
    setAreaQuery('')
  }, [mobileMode, mobileOpen])

  useEffect(() => {
    if (openMenu === 'city') {
      window.setTimeout(() => cityInputRef.current?.focus(), 0)
    }

    if (openMenu === 'university') {
      window.setTimeout(() => universityInputRef.current?.focus(), 0)
    }

    if (openMenu === 'area') {
      window.setTimeout(() => areaInputRef.current?.focus(), 0)
    }
  }, [openMenu])

  const selectedCityLabel = useMemo(() => {
    const selectedCity = cities.find(
      (city) => String(city.id) === String(draftCityId)
    )

    if (selectedCity) return getCityName(selectedCity)
    return isCompact ? labels.city : labels.selectCity
  }, [cities, draftCityId, isCompact, labels.city, labels.selectCity, isArabic])

  const selectedUniversityLabel = useMemo(() => {
    const selectedUniversity = universities.find(
      (university) => String(university.id) === String(draftUniversityId)
    )

    if (selectedUniversity) return getUniversityName(selectedUniversity)
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
    const selectedArea = areas.find(
      (area) => String(area.id) === String(draftAreaId)
    )

    if (selectedArea) return getAreaName(selectedArea)
    return isCompact ? labels.area : labels.selectArea
  }, [areas, draftAreaId, labels.area, labels.selectArea, isCompact, isArabic])

  const cityUniversities = useMemo(() => {
    if (!draftCityId || isCityAreaMode) return []

    return universities.filter(
      (university) => String(university.city_id) === String(draftCityId)
    )
  }, [draftCityId, universities, isCityAreaMode])

  const universityAreaIds = useMemo(() => {
    if (!draftUniversityId || isCityAreaMode) return new Set<string>()

    return new Set(
      universityAreas
        .filter(
          (item) => String(item.university_id) === String(draftUniversityId)
        )
        .map((item) => String(item.area_id))
    )
  }, [draftUniversityId, universityAreas, isCityAreaMode])

  const cityAreas = useMemo(() => {
    if (!draftCityId) return []

    let nextAreas = areas.filter(
      (area) =>
        area.is_active !== false &&
        String(area.city_id) === String(draftCityId)
    )

    if (!isCityAreaMode) {
      if (!draftUniversityId) return []

      if (universityAreaIds.size > 0) {
        nextAreas = nextAreas.filter((area) =>
          universityAreaIds.has(String(area.id))
        )
      }
    }

    return nextAreas
  }, [
    areas,
    draftCityId,
    draftUniversityId,
    universityAreaIds,
    isCityAreaMode,
  ])

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

  const applySearch = (
    nextValues?: Partial<{
      cityId: string
      universityId: string
      areaId: string
    }>
  ) => {
    const cityId = nextValues?.cityId ?? draftCityId
    const universityId = isCityAreaMode
      ? ''
      : nextValues?.universityId ?? draftUniversityId
    const areaId = nextValues?.areaId ?? draftAreaId

    const params = new URLSearchParams()
    params.set('rental_duration', initialRentalDuration || 'monthly')

    if (cityId) params.set('city_id', cityId)
    if (universityId) params.set('university_id', universityId)
    if (areaId) params.set('area_id', areaId)
    if (initialPriceRange) params.set('price_range', initialPriceRange)
    if (language) params.set('lang', language)
    if (currency) params.set('currency', currency)

    onRequestClose?.()
    router.push(`/properties/search?${params.toString()}`)
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

  const handleCitySelection = (cityId: string) => {
    setDraftCityId(cityId)
    setDraftUniversityId('')
    setDraftAreaId('')
    setCityQuery('')
    setUniversityQuery('')
    setAreaQuery('')
    setOpenMenu(isCityAreaMode ? 'area' : 'university')
  }

  const handleUniversitySelection = (universityId: string) => {
    setDraftUniversityId(universityId)
    setDraftAreaId('')
    setUniversityQuery('')
    setAreaQuery('')
    setOpenMenu('area')
  }

  const handleAreaSelection = (areaId: string) => {
    setDraftAreaId(areaId)
    setAreaQuery('')
    setOpenMenu(null)
  }

  const disabledValueTextClass = 'text-[#a1a1a1] dark:text-slate-600'

  const panelClass = isArabic
    ? 'absolute right-0 top-[calc(100%+8px)] z-[80] max-h-72 w-full min-w-[220px] overflow-auto rounded-2xl border border-[#dddddd] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)]'
    : 'absolute left-0 top-[calc(100%+8px)] z-[80] max-h-72 w-full min-w-[220px] overflow-auto rounded-2xl border border-[#dddddd] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)]'

  const itemClass =
    'block w-full rounded-xl px-3 py-2.5 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-white/10'

  const inlineInputClass = `mt-1 w-full bg-transparent p-0 text-[16px] font-normal text-[#222222] outline-none placeholder:text-[#6a6a6a] dark:text-slate-100 dark:placeholder:text-slate-500 ${
    isArabic ? 'text-right' : 'text-left'
  }`

  const valueTextClass = isCompact
    ? 'truncate text-[14px] font-semibold leading-none text-[#222222] dark:text-slate-100'
    : 'mt-1 truncate text-[16px] font-normal text-[#6a6a6a] dark:text-slate-400'

  const titleTextClass = isCompact
    ? 'sr-only'
    : 'text-[14px] font-semibold leading-none text-[#222222] dark:text-slate-100'

  const sectionPaddingClass = isCompact ? 'px-4 py-2.5' : 'px-5 py-3'

  const mobileCollapsedCardClass =
    'flex w-full items-center justify-between rounded-[18px] border border-[#e4e4e4] bg-white px-5 py-4 text-left shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition hover:bg-[#fafafa] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_10px_24px_rgba(0,0,0,0.22)] dark:hover:bg-[#111827]'

  const renderEmptyState = () => (
    <p className="px-3 py-6 text-center text-sm text-[#8a8a8a] dark:text-slate-500">
      {noResultsLabel}
    </p>
  )

  if (mobileMode) {
    return (
      <div dir={isArabic ? 'rtl' : 'ltr'} className="w-full">
        <style>{`
          @media (prefers-color-scheme: dark) {
            input { color-scheme: dark; }
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
          {mobileHeaderStartSlot}

          {openMenu === 'city' ? (
            <div
              className={cn(
                'rounded-[24px] border border-[#e4e4e4] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_12px_30px_rgba(0,0,0,0.32)]',
                mobileSearchBarClassName
              )}
            >
              <h2 className="mb-4 text-[18px] font-semibold tracking-[-0.01em] text-[#222222] dark:text-slate-100">
                {labels.selectCity}
              </h2>

              <div className="mb-3 flex items-center gap-3 rounded-[12px] border border-[#cfcfcf] px-4 py-3.5 text-[#222222] dark:border-white/10 dark:bg-[#111827] dark:text-slate-100">
                <SearchIcon />
                <input
                  ref={cityInputRef}
                  type="text"
                  value={cityQuery}
                  onChange={(event) => setCityQuery(event.target.value)}
                  placeholder={labels.searchCities}
                  className={`w-full bg-transparent text-[14px] text-[#222222] outline-none placeholder:text-[#8a8a8a] dark:text-slate-100 dark:placeholder:text-slate-500 ${
                    isArabic ? 'text-right' : 'text-left'
                  }`}
                />
              </div>

              <div className="max-h-[50vh] space-y-1 overflow-y-auto pr-1">
                {filteredCities.length > 0
                  ? filteredCities.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleCitySelection(String(city.id))}
                        className={`flex w-full items-center rounded-2xl px-2 py-3 transition hover:bg-[#f7f7f7] dark:hover:bg-white/10 ${
                          isArabic ? 'text-right' : 'text-left'
                        }`}
                      >
                        <p className="truncate text-[15px] font-semibold leading-[1.2] text-[#2a2a2a] dark:text-slate-100">
                          {getCityName(city)}
                        </p>
                      </button>
                    ))
                  : renderEmptyState()}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCityQuery('')
                setOpenMenu('city')
              }}
              className={mobileCollapsedCardClass}
            >
              <span className="text-[13px] font-medium text-[#9a9a9a] dark:text-slate-500">
                {labels.city}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-[14px] font-medium text-[#222222] dark:text-slate-100">
                  {draftCityId ? selectedCityLabel : labels.selectCity}
                </span>
                <ChevronDownIcon />
              </span>
            </button>
          )}

          {!isCityAreaMode &&
            (openMenu === 'university' ? (
              <div className="rounded-[24px] border border-[#e4e4e4] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_12px_30px_rgba(0,0,0,0.32)]">
                <h2 className="mb-4 text-[18px] font-semibold tracking-[-0.01em] text-[#222222] dark:text-slate-100">
                  {labels.selectUniversity}
                </h2>

                <div className="mb-3 flex items-center gap-3 rounded-[12px] border border-[#cfcfcf] px-4 py-3.5 text-[#222222] dark:border-white/10 dark:bg-[#111827] dark:text-slate-100">
                  <SearchIcon />
                  <input
                    ref={universityInputRef}
                    type="text"
                    value={universityQuery}
                    onChange={(event) => setUniversityQuery(event.target.value)}
                    placeholder={labels.chooseUniversity}
                    disabled={!canOpenUniversity}
                    className={`w-full bg-transparent text-[14px] text-[#222222] outline-none placeholder:text-[#8a8a8a] disabled:cursor-not-allowed disabled:text-[#a1a1a1] dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:text-slate-600 ${
                      isArabic ? 'text-right' : 'text-left'
                    }`}
                  />
                </div>

                <div className="max-h-[44vh] space-y-1 overflow-y-auto pr-1">
                  {filteredUniversities.length > 0
                    ? filteredUniversities.map((university) => (
                        <button
                          key={university.id}
                          type="button"
                          onClick={() =>
                            handleUniversitySelection(String(university.id))
                          }
                          className={`flex w-full items-center rounded-2xl px-2 py-3 transition hover:bg-[#f7f7f7] dark:hover:bg-white/10 ${
                            isArabic ? 'text-right' : 'text-left'
                          }`}
                        >
                          <p className="truncate text-[15px] font-semibold leading-[1.2] text-[#2a2a2a] dark:text-slate-100">
                            {getUniversityName(university)}
                          </p>
                        </button>
                      ))
                    : renderEmptyState()}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={openUniversityMenu}
                className={mobileCollapsedCardClass}
              >
                <span className="text-[13px] font-medium text-[#9a9a9a] dark:text-slate-500">
                  {labels.university}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      'truncate text-[14px] font-medium',
                      draftCityId
                        ? 'text-[#222222] dark:text-slate-100'
                        : disabledValueTextClass
                    )}
                  >
                    {draftUniversityId
                      ? selectedUniversityLabel
                      : draftCityId
                        ? labels.selectUniversity
                        : labels.selectCity}
                  </span>
                  <ChevronDownIcon />
                </span>
              </button>
            ))}

          {openMenu === 'area' ? (
            <div className="rounded-[24px] border border-[#e4e4e4] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_12px_30px_rgba(0,0,0,0.32)]">
              <h2 className="mb-4 text-[18px] font-semibold tracking-[-0.01em] text-[#222222] dark:text-slate-100">
                {labels.selectArea}
              </h2>

              <div className="mb-3 flex items-center gap-3 rounded-[12px] border border-[#cfcfcf] px-4 py-3.5 text-[#222222] dark:border-white/10 dark:bg-[#111827] dark:text-slate-100">
                <SearchIcon />
                <input
                  ref={areaInputRef}
                  type="text"
                  value={areaQuery}
                  onChange={(event) => setAreaQuery(event.target.value)}
                  placeholder={canOpenArea ? labels.searchAreas : labels.selectCity}
                  disabled={!canOpenArea}
                  className={`w-full bg-transparent text-[14px] text-[#222222] outline-none placeholder:text-[#8a8a8a] disabled:cursor-not-allowed disabled:text-[#a1a1a1] dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:text-slate-600 ${
                    isArabic ? 'text-right' : 'text-left'
                  }`}
                />
              </div>

              <div className="max-h-[44vh] space-y-1 overflow-y-auto pr-1">
                {filteredAreas.length > 0
                  ? filteredAreas.map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => handleAreaSelection(String(area.id))}
                        className={`flex w-full items-center rounded-2xl px-2 py-3 transition hover:bg-[#f7f7f7] dark:hover:bg-white/10 ${
                          isArabic ? 'text-right' : 'text-left'
                        }`}
                      >
                        <p className="truncate text-[15px] font-semibold leading-[1.2] text-[#2a2a2a] dark:text-slate-100">
                          {getAreaName(area)}
                        </p>
                      </button>
                    ))
                  : renderEmptyState()}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openAreaMenu}
              className={mobileCollapsedCardClass}
            >
              <span className="text-[13px] font-medium text-[#9a9a9a] dark:text-slate-500">
                {labels.area}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    'truncate text-[14px] font-medium',
                    canOpenArea
                      ? 'text-[#222222] dark:text-slate-100'
                      : disabledValueTextClass
                  )}
                >
                  {draftAreaId
                    ? selectedAreaLabel
                    : canOpenArea
                      ? labels.selectArea
                      : labels.selectCity}
                </span>
                <ChevronDownIcon />
              </span>
            </button>
          )}

          <div className="flex items-center justify-between gap-3 px-2 pt-1">
            <button
              type="button"
              onClick={resetAll}
              className="text-[14px] font-medium text-[#444444] underline-offset-4 transition hover:underline dark:text-slate-300"
            >
              {clearAllLabel}
            </button>

            <button
              type="button"
              onClick={() => applySearch()}
              className="flex h-[44px] items-center justify-center gap-2 rounded-full bg-[#0a52ff] px-5 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(10,82,255,0.24)] transition hover:bg-[#0849e6] active:scale-[0.98]"
            >
              <SearchIcon className="h-[18px] w-[18px]" />
              <span>{searchLabel}</span>
            </button>
          </div>

          {mobileHeaderEndSlot}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={wrapperRef}
      dir={isArabic ? 'rtl' : 'ltr'}
      className={cn(
        'relative mx-auto w-full transition-all duration-300',
        isCompact ? 'max-w-[650px]' : 'max-w-[920px]'
      )}
    >
      <div
        className={cn(
          'flex items-stretch rounded-full border border-[#dddddd] bg-white shadow-[0_5px_18px_rgba(0,0,0,0.10)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_12px_32px_rgba(0,0,0,0.32)]',
          isCompact ? 'min-h-[52px]' : 'min-h-[66px]'
        )}
      >
        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={() => {
              setOpenMenu(openMenu === 'city' ? null : 'city')
              setCityQuery('')
            }}
            className={cn(
              'flex h-full w-full min-w-0 flex-col justify-center rounded-full transition hover:bg-[#f7f7f7] dark:hover:bg-white/10',
              sectionPaddingClass,
              openMenu === 'city' && 'bg-[#f7f7f7] dark:bg-white/10'
            )}
          >
            <span className={titleTextClass}>{labels.city}</span>
            <span className={valueTextClass}>{selectedCityLabel}</span>
          </button>

          {openMenu === 'city' && (
            <div className={panelClass}>
              <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 rounded-xl border border-[#dddddd] bg-white px-3 py-2.5 text-[#222222] dark:border-white/10 dark:bg-[#111827] dark:text-slate-100">
                <SearchIcon className="h-4 w-4 shrink-0" />
                <input
                  ref={cityInputRef}
                  type="text"
                  value={cityQuery}
                  onChange={(event) => setCityQuery(event.target.value)}
                  placeholder={labels.searchCities}
                  className={inlineInputClass}
                />
              </div>

              {filteredCities.length > 0
                ? filteredCities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleCitySelection(String(city.id))}
                      className={cn(itemClass, isArabic ? 'text-right' : 'text-left')}
                    >
                      {getCityName(city)}
                    </button>
                  ))
                : renderEmptyState()}
            </div>
          )}
        </div>

        <div className="my-3 w-px shrink-0 bg-[#e5e5e5] dark:bg-white/10" />

        {!isCityAreaMode && (
          <>
            <div className="relative min-w-0 flex-1">
              <button
                type="button"
                onClick={openUniversityMenu}
                className={cn(
                  'flex h-full w-full min-w-0 flex-col justify-center rounded-full transition hover:bg-[#f7f7f7] dark:hover:bg-white/10',
                  sectionPaddingClass,
                  openMenu === 'university' &&
                    'bg-[#f7f7f7] dark:bg-white/10'
                )}
              >
                <span className={titleTextClass}>{labels.university}</span>
                <span
                  className={cn(
                    valueTextClass,
                    !draftCityId && disabledValueTextClass
                  )}
                >
                  {draftCityId ? selectedUniversityLabel : labels.selectCity}
                </span>
              </button>

              {openMenu === 'university' && (
                <div className={panelClass}>
                  <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 rounded-xl border border-[#dddddd] bg-white px-3 py-2.5 text-[#222222] dark:border-white/10 dark:bg-[#111827] dark:text-slate-100">
                    <SearchIcon className="h-4 w-4 shrink-0" />
                    <input
                      ref={universityInputRef}
                      type="text"
                      value={universityQuery}
                      onChange={(event) =>
                        setUniversityQuery(event.target.value)
                      }
                      placeholder={labels.chooseUniversity}
                      className={inlineInputClass}
                    />
                  </div>

                  {filteredUniversities.length > 0
                    ? filteredUniversities.map((university) => (
                        <button
                          key={university.id}
                          type="button"
                          onClick={() =>
                            handleUniversitySelection(String(university.id))
                          }
                          className={cn(
                            itemClass,
                            isArabic ? 'text-right' : 'text-left'
                          )}
                        >
                          {getUniversityName(university)}
                        </button>
                      ))
                    : renderEmptyState()}
                </div>
              )}
            </div>

            <div className="my-3 w-px shrink-0 bg-[#e5e5e5] dark:bg-white/10" />
          </>
        )}

        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={openAreaMenu}
            className={cn(
              'flex h-full w-full min-w-0 flex-col justify-center rounded-full transition hover:bg-[#f7f7f7] dark:hover:bg-white/10',
              sectionPaddingClass,
              openMenu === 'area' && 'bg-[#f7f7f7] dark:bg-white/10'
            )}
          >
            <span className={titleTextClass}>{labels.area}</span>
            <span
              className={cn(
                valueTextClass,
                !canOpenArea && disabledValueTextClass
              )}
            >
              {canOpenArea ? selectedAreaLabel : labels.selectCity}
            </span>
          </button>

          {openMenu === 'area' && (
            <div className={panelClass}>
              <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 rounded-xl border border-[#dddddd] bg-white px-3 py-2.5 text-[#222222] dark:border-white/10 dark:bg-[#111827] dark:text-slate-100">
                <SearchIcon className="h-4 w-4 shrink-0" />
                <input
                  ref={areaInputRef}
                  type="text"
                  value={areaQuery}
                  onChange={(event) => setAreaQuery(event.target.value)}
                  placeholder={labels.searchAreas}
                  className={inlineInputClass}
                />
              </div>

              {filteredAreas.length > 0
                ? filteredAreas.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => handleAreaSelection(String(area.id))}
                      className={cn(itemClass, isArabic ? 'text-right' : 'text-left')}
                    >
                      {getAreaName(area)}
                    </button>
                  ))
                : renderEmptyState()}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center p-2">
          <button
            type="button"
            onClick={() => applySearch()}
            aria-label={searchLabel}
            className={cn(
              'flex items-center justify-center gap-2 rounded-full bg-[#0a52ff] font-semibold text-white shadow-[0_8px_20px_rgba(10,82,255,0.24)] transition hover:bg-[#0849e6] active:scale-[0.98]',
              isCompact ? 'h-10 w-10' : 'h-12 px-5'
            )}
          >
            <SearchIcon className="h-[18px] w-[18px]" />
            {!isCompact && <span className="text-sm">{searchLabel}</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
