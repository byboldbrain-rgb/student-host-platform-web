'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type SupportedSort =
  | 'newly_listed'
  | 'lowest_price'
  | 'highest_price'
  | 'boys'
  | 'girls'

type SortOption = {
  value: SupportedSort
  label: string
  href: string
}

type AmenityOption = {
  id: string
  name_en: string
  name_ar: string
  icon_url?: string | null
  sort_order?: number | null
  is_active?: boolean | null
}

type SortDropdownProps = {
  isArabic: boolean
  selectedSort: SupportedSort
  sortByLabel: string
  genderLabel?: string
  amenitiesLabel?: string
  showResultsLabel?: string
  clearAllLabel?: string
  closeLabel?: string
  options: SortOption[]
  amenities?: AmenityOption[]
}

type GenderValue = 'boys' | 'girls'
type SortValue = 'newly_listed' | 'lowest_price' | 'highest_price'

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-[15px] w-[15px] md:h-[18px] md:w-[18px]"
      aria-hidden="true"
    >
      <path
        d="M4 7h8"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M4 12h16"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M4 17h10"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <circle cx="15.5" cy="7" r="1.55" fill="currentColor" />
      <circle cx="17.5" cy="17" r="1.55" fill="currentColor" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function buildSectionedOptions(options: SortOption[]) {
  const genderOrder: GenderValue[] = ['girls', 'boys']
  const sortOrder: SortValue[] = [
    'newly_listed',
    'highest_price',
    'lowest_price',
  ]

  const byValue = new Map(options.map((option) => [option.value, option]))

  return {
    gender: genderOrder
      .map((value) => byValue.get(value))
      .filter(Boolean) as SortOption[],
    sortBy: sortOrder
      .map((value) => byValue.get(value))
      .filter(Boolean) as SortOption[],
  }
}

function normalizeSelectedAmenityIds(value: string | null) {
  if (!value) return []

  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

function GenderImage({
  value,
  label,
}: {
  value: SupportedSort
  label: string
}) {
  const iconSrc =
    value === 'boys'
      ? 'https://i.ibb.co/Pzg14kFJ/Navienty-22.png'
      : 'https://i.ibb.co/whT5VJDn/Navienty-21.png'

  return (
    <img
      src={iconSrc}
      alt={label}
      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
      loading="lazy"
      draggable={false}
    />
  )
}

function GenderCard({
  option,
  isActive,
  onSelect,
}: {
  option: SortOption
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={option.label}
      aria-pressed={isActive}
      className="group block min-w-0 overflow-hidden rounded-[24px] outline-none transition duration-300 hover:-translate-y-0.5"
    >
      <div
        className={`aspect-[1.45/1] overflow-hidden rounded-[24px] border bg-white transition duration-300 dark:bg-[#0b1220] ${
          isActive
            ? 'border-[#0A46FF] shadow-[0_16px_38px_rgba(10,70,255,0.16)] ring-4 ring-[#0A46FF]/10 dark:border-[#60a5fa] dark:shadow-[0_18px_42px_rgba(96,165,250,0.14)] dark:ring-[#60a5fa]/10'
            : 'border-[#e5e7eb] shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:border-[#cbd5e1] hover:shadow-[0_16px_38px_rgba(15,23,42,0.12)] dark:border-white/10 dark:shadow-[0_12px_30px_rgba(0,0,0,0.28)] dark:hover:border-white/20'
        }`}
      >
        <GenderImage value={option.value} label={option.label} />
      </div>
    </button>
  )
}

function AmenityCard({
  amenity,
  label,
  isActive,
  onToggle,
}: {
  amenity: AmenityOption
  label: string
  isActive: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={isActive}
      className="group block min-w-0 rounded-[18px] outline-none"
      title={label}
    >
      <div
        className={`flex h-[106px] items-center justify-center overflow-hidden rounded-[16px] border bg-white px-4 py-3 transition duration-300 dark:bg-[#0b1220] sm:h-[112px] ${
          isActive
            ? 'border-[#0A46FF] shadow-[0_10px_24px_rgba(10,70,255,0.14)] ring-4 ring-[#0A46FF]/10 dark:border-[#60a5fa] dark:shadow-[0_14px_30px_rgba(96,165,250,0.14)] dark:ring-[#60a5fa]/10'
            : 'border-[#dddddd] shadow-none hover:border-[#bdbdbd] dark:border-white/10 dark:hover:border-white/20'
        }`}
      >
        {amenity.icon_url ? (
          <img
            src={amenity.icon_url}
            alt={label}
            className="h-[62px] w-[62px] object-contain transition duration-300 group-hover:scale-[1.04] sm:h-[68px] sm:w-[68px]"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[#f8fafc] px-2 text-center text-[10px] font-semibold text-[#64748b] dark:bg-[#111827] dark:text-slate-300 sm:h-[68px] sm:w-[68px]">
            {label}
          </div>
        )}
      </div>

      <div className="mt-3 text-center text-[14px] font-medium leading-snug tracking-[-0.01em] text-[#222222] dark:text-slate-100 sm:text-[15px]">
        {label}
      </div>
    </button>
  )
}

function getSearchParamsFromHref(href: string) {
  const url = new URL(href, 'https://dummy.local')
  return url.searchParams
}

function matchesCurrentParams(href: string, currentParams: URLSearchParams) {
  const optionParams = getSearchParamsFromHref(href)

  if ([...optionParams.keys()].length === 0) {
    return false
  }

  for (const [key, value] of optionParams.entries()) {
    if (currentParams.get(key) !== value) {
      return false
    }
  }

  return true
}

function getOptionByCurrentParams(
  options: SortOption[],
  currentParams: URLSearchParams
) {
  return (
    options.find((option) => matchesCurrentParams(option.href, currentParams)) ??
    null
  )
}

function getParamKeys(options: SortOption[]) {
  const keys = new Set<string>()

  options.forEach((option) => {
    const params = getSearchParamsFromHref(option.href)
    params.forEach((_, key) => {
      keys.add(key)
    })
  })

  return [...keys]
}

function applyOptionParams(
  params: URLSearchParams,
  option: SortOption | null,
  keysToReset: string[]
) {
  keysToReset.forEach((key) => params.delete(key))

  if (!option) return

  const optionParams = getSearchParamsFromHref(option.href)
  optionParams.forEach((value, key) => {
    params.set(key, value)
  })
}

export default function SortDropdown({
  isArabic,
  selectedSort,
  sortByLabel,
  genderLabel,
  amenitiesLabel,
  showResultsLabel,
  clearAllLabel,
  closeLabel,
  options,
  amenities = [],
}: SortDropdownProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isOpen, setIsOpen] = useState(false)
  const groupedOptions = useMemo(() => buildSectionedOptions(options), [options])

  const visibleAmenities = useMemo(
    () =>
      amenities
        .filter((amenity) => amenity.is_active !== false)
        .sort((a, b) => {
          const sortA = a.sort_order ?? Number.POSITIVE_INFINITY
          const sortB = b.sort_order ?? Number.POSITIVE_INFINITY

          if (sortA !== sortB) return sortA - sortB

          return a.name_en.localeCompare(b.name_en)
        }),
    [amenities]
  )

  const labels = {
    gender: genderLabel ?? (isArabic ? 'النوع' : 'Gender'),
    amenities: amenitiesLabel ?? (isArabic ? 'المميزات' : 'Amenities'),
    sortBy: sortByLabel ?? (isArabic ? 'ترتيب حسب' : 'Sort by'),
    clearAll: clearAllLabel ?? (isArabic ? 'مسح الكل' : 'Clear all'),
    showResults: showResultsLabel ?? (isArabic ? 'عرض النتائج' : 'Show results'),
    close: closeLabel ?? (isArabic ? 'إغلاق' : 'Close'),
  }

  const genderParamKeys = useMemo(
    () => getParamKeys(groupedOptions.gender),
    [groupedOptions.gender]
  )

  const sortParamKeys = useMemo(
    () => getParamKeys(groupedOptions.sortBy),
    [groupedOptions.sortBy]
  )

  const currentGenderOption = useMemo(() => {
    const fromParams = getOptionByCurrentParams(
      groupedOptions.gender,
      new URLSearchParams(searchParams.toString())
    )

    if (fromParams) return fromParams

    return selectedSort === 'boys' || selectedSort === 'girls'
      ? groupedOptions.gender.find((option) => option.value === selectedSort) ??
          null
      : null
  }, [groupedOptions.gender, searchParams, selectedSort])

  const currentSortOption = useMemo(() => {
    const fromParams = getOptionByCurrentParams(
      groupedOptions.sortBy,
      new URLSearchParams(searchParams.toString())
    )

    if (fromParams) return fromParams

    return selectedSort !== 'boys' && selectedSort !== 'girls'
      ? groupedOptions.sortBy.find((option) => option.value === selectedSort) ??
          null
      : null
  }, [groupedOptions.sortBy, searchParams, selectedSort])

  const currentAmenityIds = useMemo(
    () => normalizeSelectedAmenityIds(searchParams.get('amenity_ids')),
    [searchParams]
  )

  const [tempSelectedGender, setTempSelectedGender] =
    useState<GenderValue | null>(
      (currentGenderOption?.value as GenderValue | null) ?? null
    )

  const [tempSelectedSortOption, setTempSelectedSortOption] =
    useState<SortValue | null>(
      (currentSortOption?.value as SortValue | null) ?? null
    )

  const [tempSelectedAmenityIds, setTempSelectedAmenityIds] =
    useState<string[]>(currentAmenityIds)

  useEffect(() => {
    if (!isOpen) return

    setTempSelectedGender(
      (currentGenderOption?.value as GenderValue | null) ?? null
    )
    setTempSelectedSortOption(
      (currentSortOption?.value as SortValue | null) ?? null
    )
    setTempSelectedAmenityIds(currentAmenityIds)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', onEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onEscape)
    }
  }, [isOpen, currentGenderOption, currentSortOption, currentAmenityIds])

  const selectedGenderOption =
    groupedOptions.gender.find((option) => option.value === tempSelectedGender) ??
    null

  const selectedSortOption =
    groupedOptions.sortBy.find(
      (option) => option.value === tempSelectedSortOption
    ) ?? null

  const handleToggleAmenity = (amenityId: string) => {
    setTempSelectedAmenityIds((currentIds) => {
      if (currentIds.includes(amenityId)) {
        return currentIds.filter((id) => id !== amenityId)
      }

      return [...currentIds, amenityId]
    })
  }

  const handleClearAll = () => {
    setTempSelectedGender(null)
    setTempSelectedSortOption(null)
    setTempSelectedAmenityIds([])
  }

  const handleShowResults = () => {
    const nextParams = new URLSearchParams(searchParams.toString())

    applyOptionParams(nextParams, selectedGenderOption, genderParamKeys)
    applyOptionParams(nextParams, selectedSortOption, sortParamKeys)

    if (tempSelectedAmenityIds.length > 0) {
      nextParams.set('amenity_ids', tempSelectedAmenityIds.join(','))
    } else {
      nextParams.delete('amenity_ids')
    }

    nextParams.delete('page')

    const nextQuery = nextParams.toString()
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname

    setIsOpen(false)
    router.push(nextUrl)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        dir={isArabic ? 'rtl' : 'ltr'}
        className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border border-[#dddddd] bg-white p-0 text-[#222222] transition hover:shadow-sm dark:border-white/10 dark:bg-[#0b1220] dark:text-slate-100 dark:hover:bg-[#111827] md:h-[48px] md:w-auto md:gap-2 md:px-5"
        aria-label={labels.sortBy}
      >
        <FilterIcon />
        <span className="hidden md:inline">{labels.sortBy}</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[300] bg-black/35 dark:bg-black/60"
          onClick={() => setIsOpen(false)}
        >
          <div
            dir={isArabic ? 'rtl' : 'ltr'}
            onClick={(e) => e.stopPropagation()}
            className="
              absolute left-0 right-0 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] top-auto flex max-h-[calc(100dvh-96px)] flex-col overflow-hidden
              rounded-t-[28px] bg-white shadow-[0_-12px_50px_rgba(0,0,0,0.20)] dark:border dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_-16px_60px_rgba(0,0,0,0.48)]
              sm:left-1/2 sm:right-auto sm:top-8 sm:bottom-auto sm:h-[min(760px,calc(100vh-64px))] sm:max-h-none sm:w-[min(92vw,620px)] sm:-translate-x-1/2 sm:rounded-[28px]
            "
          >
            <div className="relative flex h-[72px] shrink-0 items-center justify-center border-b border-[#ebebeb] px-5 dark:border-white/10 sm:h-[76px] sm:px-6">
              <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-[#222222] dark:text-slate-100">
                {labels.sortBy}
              </h3>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[#222222] transition hover:bg-[#f7f7f7] dark:text-slate-100 dark:hover:bg-white/10 ${
                  isArabic ? 'left-5 sm:left-6' : 'right-5 sm:right-6'
                }`}
                aria-label={labels.close}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-6 sm:flex-1 sm:px-7 sm:py-7">
              <section className="border-b border-[#ebebeb] pb-7 dark:border-white/10">
                <h4 className="mb-5 text-[18px] font-semibold tracking-[-0.02em] text-[#222222] dark:text-slate-100">
                  {labels.gender}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {groupedOptions.gender.map((option) => (
                    <GenderCard
                      key={option.value}
                      option={option}
                      isActive={option.value === tempSelectedGender}
                      onSelect={() =>
                        setTempSelectedGender(option.value as GenderValue)
                      }
                    />
                  ))}
                </div>
              </section>

              {visibleAmenities.length > 0 && (
                <section className="border-b border-[#ebebeb] py-7 dark:border-white/10">
                  <h4 className="mb-5 text-[18px] font-semibold tracking-[-0.02em] text-[#222222] dark:text-slate-100">
                    {labels.amenities}
                  </h4>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-6">
                    {visibleAmenities.map((amenity) => {
                      const label = isArabic
                        ? amenity.name_ar || amenity.name_en
                        : amenity.name_en

                      return (
                        <AmenityCard
                          key={amenity.id}
                          amenity={amenity}
                          label={label}
                          isActive={tempSelectedAmenityIds.includes(amenity.id)}
                          onToggle={() => handleToggleAmenity(amenity.id)}
                        />
                      )
                    })}
                  </div>
                </section>
              )}

              <section className="pt-7">
                <h4 className="mb-5 text-[18px] font-semibold tracking-[-0.02em] text-[#222222] dark:text-slate-100">
                  {labels.sortBy}
                </h4>

                <div className="rounded-[22px] border border-[#dddddd] bg-white p-[6px] dark:border-white/10 dark:bg-[#111827]">
                  <div className="grid grid-cols-3 gap-[6px]">
                    {groupedOptions.sortBy.map((option) => {
                      const isActive = option.value === tempSelectedSortOption

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setTempSelectedSortOption(option.value as SortValue)
                          }
                          className={`flex min-h-[54px] items-center justify-center rounded-[18px] border-2 px-2 text-center text-[13px] font-medium leading-snug transition sm:h-[54px] sm:px-3 sm:text-[14px] ${
                            isActive
                              ? 'border-[#0A46FF] bg-white text-[#222222] dark:border-[#60a5fa] dark:bg-[#0b1220] dark:text-slate-100'
                              : 'border-transparent bg-white text-[#222222] hover:bg-[#f7f7f7] dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/10'
                          }`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </section>
            </div>

            <div className="shrink-0 border-t border-[#ececec] bg-[#fbfbfb] px-5 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#0f172a] dark:shadow-[0_-10px_28px_rgba(0,0,0,0.28)] sm:mt-auto sm:px-7 sm:py-5">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[14px] font-semibold text-[#8d8d8d] transition hover:text-[#0A46FF] dark:text-slate-400 dark:hover:text-[#60a5fa] sm:text-[15px]"
                >
                  {labels.clearAll}
                </button>

                <button
                  type="button"
                  onClick={handleShowResults}
                  className="inline-flex h-[54px] min-w-[170px] items-center justify-center rounded-[16px] bg-[#0A46FF] px-5 text-[14px] font-semibold text-white transition hover:bg-[#0838cc] dark:bg-[#2563eb] dark:hover:bg-[#1d4ed8] sm:h-[56px] sm:min-w-[210px] sm:px-6 sm:text-[15px]"
                >
                  {labels.showResults}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
