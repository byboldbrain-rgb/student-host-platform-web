'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { enablePushNotifications } from '@/src/lib/push-client'

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
type OpenMenu = 'city' | 'university' | 'area' | null
type HousingType = 'single' | 'double' | 'triple' | 'full_apartment'

type Props = {
  action: (formData: FormData) => void
  cities: City[]
  universities: University[]
  areas: PropertyArea[]
  universityAreas: UniversityArea[]
  initialCityId?: string
  initialUniversityId?: string
  initialAreaId?: string
  language?: Language
  currency?: string
  currentPath: string
  resultCount: number
  alertStatus?: string
}

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

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.85 23.85 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022 23.85 23.85 0 0 0 5.455 1.31m5.714 0a3 3 0 0 1-5.714 0m5.714 0a24.255 24.255 0 0 1-5.714 0"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2.1"
      stroke="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function PropertyAlertRequestCard({
  action,
  cities,
  universities,
  areas,
  universityAreas,
  initialCityId = '',
  initialUniversityId = '',
  initialAreaId = '',
  language = 'ar',
  currency = 'EGP',
  currentPath,
  resultCount,
  alertStatus,
}: Props) {
  const isArabic = language === 'ar'
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const cityInputRef = useRef<HTMLInputElement | null>(null)
  const universityInputRef = useRef<HTMLInputElement | null>(null)
  const areaInputRef = useRef<HTMLInputElement | null>(null)

  const [isOpen, setIsOpen] = useState(resultCount === 0)
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const [draftCityId, setDraftCityId] = useState('')
  const [draftUniversityId, setDraftUniversityId] = useState('')
  const [draftAreaId, setDraftAreaId] = useState('')
  const [selectedHousingTypes, setSelectedHousingTypes] = useState<HousingType[]>([])
  const [maxBudget, setMaxBudget] = useState('')

  const [cityQuery, setCityQuery] = useState('')
  const [universityQuery, setUniversityQuery] = useState('')
  const [areaQuery, setAreaQuery] = useState('')

  const [isEnablingPush, setIsEnablingPush] = useState(false)
  const [pushMessage, setPushMessage] = useState<string | null>(null)
  const [pushMessageType, setPushMessageType] = useState<'success' | 'error' | null>(
    null
  )

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

  useEffect(() => {
    if (openMenu === 'city') setTimeout(() => cityInputRef.current?.focus(), 0)
    if (openMenu === 'university') {
      setTimeout(() => universityInputRef.current?.focus(), 0)
    }
    if (openMenu === 'area') setTimeout(() => areaInputRef.current?.focus(), 0)
  }, [openMenu])

  useEffect(() => {
    if (alertStatus !== 'success') return

    let isMounted = true

    async function enablePushAfterAlertSaved() {
      setIsEnablingPush(true)
      setPushMessage(null)
      setPushMessageType(null)

      const result = await enablePushNotifications()

      if (!isMounted) return

      setIsEnablingPush(false)
      setPushMessage(result.message)
      setPushMessageType(result.ok ? 'success' : 'error')
    }

    enablePushAfterAlertSaved()

    return () => {
      isMounted = false
    }
  }, [alertStatus])

  const getCityName = (city: City) =>
    isArabic ? city.name_ar || city.name_en : city.name_en

  const getUniversityName = (university: University) =>
    isArabic ? university.name_ar || university.name_en : university.name_en

  const getAreaName = (area: PropertyArea) =>
    isArabic ? area.name_ar || area.name_en : area.name_en

  const selectedCityLabel = useMemo(() => {
    const city = cities.find((item) => String(item.id) === String(draftCityId))
    return city ? getCityName(city) : isArabic ? 'اختار المدينة' : 'Select city'
  }, [cities, draftCityId, isArabic])

  const selectedUniversityLabel = useMemo(() => {
    const university = universities.find(
      (item) => String(item.id) === String(draftUniversityId)
    )
    return university
      ? getUniversityName(university)
      : isArabic
        ? 'اختار الجامعة'
        : 'Select university'
  }, [universities, draftUniversityId, isArabic])

  const selectedAreaLabel = useMemo(() => {
    const area = areas.find((item) => String(item.id) === String(draftAreaId))
    return area ? getAreaName(area) : isArabic ? 'اختار المنطقة' : 'Select area'
  }, [areas, draftAreaId, isArabic])

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
        .filter((item) => String(item.university_id) === String(draftUniversityId))
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
      nextAreas = nextAreas.filter((area) => universityAreaIds.has(String(area.id)))
    }

    return nextAreas
  }, [areas, draftCityId, draftUniversityId, universityAreaIds])

  const filteredCities = useMemo(() => {
    const query = cityQuery.trim().toLowerCase()
    if (!query) return cities

    return cities.filter((city) => getCityName(city).toLowerCase().includes(query))
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

    return cityAreas.filter((area) => getAreaName(area).toLowerCase().includes(query))
  }, [cityAreas, areaQuery, isArabic])

  const canOpenUniversity = !!draftCityId
  const canOpenArea = !!draftCityId && !!draftUniversityId
  const canSubmit =
    !!draftCityId &&
    !!draftUniversityId &&
    !!draftAreaId &&
    selectedHousingTypes.length > 0 &&
    !!maxBudget &&
    Number(maxBudget) >= 0

  const housingOptions: Array<{ value: HousingType; label: string }> = [
    { value: 'single', label: isArabic ? 'فردي' : 'Single' },
    { value: 'double', label: isArabic ? 'مزدوج' : 'Double' },
    { value: 'triple', label: isArabic ? 'ثلاثي' : 'Triple' },
    { value: 'full_apartment', label: isArabic ? 'شقة كاملة' : 'Full apartment' },
  ]

  const toggleHousingType = (value: HousingType) => {
    setSelectedHousingTypes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    )
  }

  const alertMessages = {
    success: isArabic
      ? 'تم تسجيل طلبك بنجاح. هنفعّل الإشعارات الآن علشان نبلغك أول ما ينزل سكن مناسب.'
      : 'Your request has been saved. We are enabling notifications now.',
    invalid: isArabic
      ? 'راجع البيانات المختارة وحاول مرة أخرى.'
      : 'Please review your selections and try again.',
    error: isArabic
      ? 'حصل خطأ أثناء حفظ الطلب. حاول مرة أخرى.'
      : 'Something went wrong while saving your request.',
    login_required: isArabic
      ? 'سجّل الدخول الأول علشان نقدر نفعّل التنبيه ونبعتلك إشعارات.'
      : 'Please log in first so we can enable notifications.',
  }

  const panelClass = isArabic
    ? 'absolute right-0 top-[calc(100%+10px)] z-[95] max-h-72 w-full min-w-[230px] overflow-auto rounded-[22px] border border-[#e5e7eb] bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_18px_45px_rgba(0,0,0,0.38)]'
    : 'absolute left-0 top-[calc(100%+10px)] z-[95] max-h-72 w-full min-w-[230px] overflow-auto rounded-[22px] border border-[#e5e7eb] bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_18px_45px_rgba(0,0,0,0.38)]'

  const itemClass =
    'block w-full rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'

  const inputClass = `mt-1 w-full bg-transparent p-0 text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500 ${
    isArabic ? 'text-right' : 'text-left'
  }`

  const sectionButtonClass =
    'relative z-[91] w-full px-5 py-3 text-start transition'

  const renderDesktopSelector = () => (
    <div
      ref={wrapperRef}
      dir={isArabic ? 'rtl' : 'ltr'}
      className="relative z-[90] rounded-[28px] border border-slate-200 bg-white p-1.5 shadow-[0_14px_45px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-[#0b1220]"
    >
      <div className="grid gap-1 lg:grid-cols-[1.05fr_1.25fr_1.05fr]">
        <div
          className={cn(
            'relative min-w-0 rounded-[23px] transition hover:bg-slate-50 dark:hover:bg-white/10',
            isArabic ? 'lg:rounded-r-[23px]' : 'lg:rounded-l-[23px]'
          )}
        >
          <button
            type="button"
            onClick={() => {
              setOpenMenu(openMenu === 'city' ? null : 'city')
              setCityQuery('')
            }}
            className={sectionButtonClass}
          >
            <p className="text-[12px] font-black text-slate-900 dark:text-white">
              {isArabic ? 'المدينة' : 'City'}
            </p>

            {openMenu === 'city' ? (
              <input
                ref={cityInputRef}
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={isArabic ? 'ابحث عن مدينة' : 'Search cities'}
                className={inputClass}
              />
            ) : (
              <p className="mt-1 truncate text-[15px] font-medium text-slate-500 dark:text-slate-400">
                {selectedCityLabel}
              </p>
            )}
          </button>

          {openMenu === 'city' && (
            <div className={panelClass}>
              {filteredCities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    setDraftCityId(String(city.id))
                    setDraftUniversityId('')
                    setDraftAreaId('')
                    setCityQuery('')
                    setUniversityQuery('')
                    setAreaQuery('')
                    setOpenMenu('university')
                  }}
                  className={cn(
                    itemClass,
                    isArabic ? 'text-right' : 'text-left',
                    String(draftCityId) === String(city.id) &&
                      'bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white'
                  )}
                >
                  {getCityName(city)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className={cn(
            'relative min-w-0 rounded-[23px] transition',
            canOpenUniversity
              ? 'hover:bg-slate-50 dark:hover:bg-white/10'
              : 'cursor-not-allowed opacity-50'
          )}
        >
          <button
            type="button"
            onClick={() => {
              if (!canOpenUniversity) {
                setOpenMenu('city')
                return
              }

              setOpenMenu(openMenu === 'university' ? null : 'university')
              setUniversityQuery('')
            }}
            className={cn(
              sectionButtonClass,
              canOpenUniversity ? 'cursor-pointer' : 'cursor-not-allowed'
            )}
          >
            <p className="text-[12px] font-black text-slate-900 dark:text-white">
              {isArabic ? 'الجامعة' : 'University'}
            </p>

            {openMenu === 'university' ? (
              <input
                ref={universityInputRef}
                value={universityQuery}
                onChange={(e) => setUniversityQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={
                  draftCityId
                    ? isArabic
                      ? 'اختار الجامعة'
                      : 'Choose university'
                    : isArabic
                      ? 'اختار المدينة الأول'
                      : 'Select city first'
                }
                disabled={!canOpenUniversity}
                className={inputClass}
              />
            ) : (
              <p className="mt-1 truncate text-[15px] font-medium text-slate-500 dark:text-slate-400">
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
                  className={cn(
                    itemClass,
                    isArabic ? 'text-right' : 'text-left',
                    String(draftUniversityId) === String(university.id) &&
                      'bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white'
                  )}
                >
                  {getUniversityName(university)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className={cn(
            'relative min-w-0 rounded-[23px] transition',
            canOpenArea
              ? 'hover:bg-slate-50 dark:hover:bg-white/10'
              : 'cursor-not-allowed opacity-50',
            isArabic ? 'lg:rounded-l-[23px]' : 'lg:rounded-r-[23px]'
          )}
        >
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

              setOpenMenu(openMenu === 'area' ? null : 'area')
              setAreaQuery('')
            }}
            className={cn(
              sectionButtonClass,
              canOpenArea ? 'cursor-pointer' : 'cursor-not-allowed'
            )}
          >
            <p className="text-[12px] font-black text-slate-900 dark:text-white">
              {isArabic ? 'المنطقة' : 'Area'}
            </p>

            {openMenu === 'area' ? (
              <input
                ref={areaInputRef}
                value={areaQuery}
                onChange={(e) => setAreaQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={
                  draftCityId && draftUniversityId
                    ? isArabic
                      ? 'اختار المنطقة'
                      : 'Choose area'
                    : isArabic
                      ? 'اختار المدينة والجامعة الأول'
                      : 'Select city and university first'
                }
                disabled={!canOpenArea}
                className={inputClass}
              />
            ) : (
              <p className="mt-1 truncate text-[15px] font-medium text-slate-500 dark:text-slate-400">
                {selectedAreaLabel}
              </p>
            )}
          </button>

          {openMenu === 'area' && canOpenArea && (
            <div className={panelClass}>
              {filteredAreas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => {
                    setDraftAreaId(String(area.id))
                    setAreaQuery('')
                    setOpenMenu(null)
                  }}
                  className={cn(
                    itemClass,
                    isArabic ? 'text-right' : 'text-left',
                    String(draftAreaId) === String(area.id) &&
                      'bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white'
                  )}
                >
                  {getAreaName(area)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className="mb-8">
      {alertStatus && alertStatus in alertMessages && (
        <div
          className={cn(
            'mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold',
            alertStatus === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'
              : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200'
          )}
        >
          {alertMessages[alertStatus as keyof typeof alertMessages]}
        </div>
      )}

      {isEnablingPush && (
        <div className="mb-4 rounded-2xl border border-[#054aff]/20 bg-[#054aff]/5 px-4 py-3 text-sm font-semibold text-[#054aff] dark:border-[#60a5fa]/20 dark:bg-[#60a5fa]/10 dark:text-[#bfdbfe]">
          {isArabic
            ? 'جاري تفعيل إشعارات ناڤينتي...'
            : 'Enabling Navienty notifications...'}
        </div>
      )}

      {pushMessage && pushMessageType && (
        <div
          className={cn(
            'mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold',
            pushMessageType === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'
              : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200'
          )}
        >
          {pushMessage}
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex w-full items-center justify-between gap-4 overflow-hidden rounded-[28px] border border-[#054aff]/12 bg-white p-4 text-start shadow-[0_16px_45px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:border-[#054aff]/28 hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-[#0b1220] dark:hover:border-[#60a5fa]/25 sm:p-5"
        >
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#054aff] text-white shadow-[0_12px_28px_rgba(5,74,255,0.25)]">
              <BellIcon />
            </span>

            <span className="min-w-0">
              <span className="block text-[15px] font-black text-slate-950 dark:text-white sm:text-[17px]">
                {isArabic ? 'مش لاقي السكن المناسب؟' : 'Can’t find the right stay?'}
              </span>
              <span className="mt-1 block text-[13px] leading-6 text-slate-500 dark:text-slate-400">
                {isArabic
                  ? 'حدد مواصفات السكن ، وأول ما ينزل سكن مطابق هنبلغك.'
                  : 'Choose your city, university, and area. We will notify you when a matching stay is available.'}
              </span>
            </span>
          </div>

          <span className="hidden shrink-0 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition group-hover:bg-[#054aff] dark:bg-white dark:text-slate-950 sm:inline-flex">
            {isArabic ? 'اعمل تنبيه' : 'Create alert'}
          </span>
        </button>
      )}

      {isOpen && (
        <form
          action={action}
          className="rounded-[32px] border border-[#054aff]/12 bg-white p-4 shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0b1220] sm:p-5 lg:p-6"
        >
          <input type="hidden" name="current_path" value={currentPath} />
          <input type="hidden" name="lang" value={language} />
          <input type="hidden" name="currency" value={currency} />
          <input type="hidden" name="city_id" value={draftCityId} />
          <input type="hidden" name="university_id" value={draftUniversityId} />
          <input type="hidden" name="area_id" value={draftAreaId} />
          <input type="hidden" name="housing_types" value={selectedHousingTypes.join(',')} />
          <input type="hidden" name="housing_type" value={selectedHousingTypes[0] ?? ''} />

          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              
              <h2 className="mt-1 text-[22px] font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-[26px]">
                {isArabic ? 'حدد السكن اللي بتدور عليه' : 'Tell us what you need'}
              </h2>
             
            </div>

            {resultCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setOpenMenu(null)
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label={isArabic ? 'إغلاق' : 'Close'}
              >
                <CloseIcon />
              </button>
            )}
          </div>

          {renderDesktopSelector()}

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_0.85fr_auto] lg:items-end">
            <div>
              <p className="mb-2 text-[12px] font-black text-slate-900 dark:text-white">
                {isArabic ? 'نوع السكن' : 'Housing type'}
              </p>

              <div className="flex flex-wrap gap-2">
                {housingOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleHousingType(option.value)}
                    className={cn(
                      'rounded-full border px-4 py-2.5 text-[13px] font-black transition',
                      selectedHousingTypes.includes(option.value)
                        ? 'border-[#054aff] bg-[#054aff] text-white shadow-[0_10px_24px_rgba(5,74,255,0.20)]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#054aff]/40 hover:text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#60a5fa]/40 dark:hover:text-white'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-[12px] font-black text-slate-900 dark:text-white">
                {isArabic ? 'أقصى ميزانية' : 'Max budget'}
              </span>
              <input
                name="max_budget"
                type="number"
                min="0"
                inputMode="numeric"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder={isArabic ? 'مثال: 8000' : 'Example: 8000'}
                required
                className="h-12 w-full rounded-full border border-slate-200 bg-white px-5 text-[14px] font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
              />
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#054aff] px-7 text-[14px] font-black text-white shadow-[0_14px_32px_rgba(5,74,255,0.24)] transition hover:-translate-y-0.5 hover:bg-[#003ee6] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              <BellIcon />
              <span>{isArabic ? 'بلغني عند توفر سكن' : 'Notify me'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}