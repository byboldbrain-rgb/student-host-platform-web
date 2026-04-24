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

type SortDropdownProps = {
  isArabic: boolean
  selectedSort: SupportedSort
  sortByLabel: string
  options: SortOption[]
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

function GenderIcon({ value, label }: { value: SupportedSort; label: string }) {
  const iconSrc =
    value === 'boys'
      ? 'https://i.ibb.co/DHvFXzLP/young-man-15375361.png'
      : 'https://i.ibb.co/MkG4qbfM/painter-10645956.png'

  return (
    <img
      src={iconSrc}
      alt={label}
      className="h-[52px] w-[52px] object-contain"
      loading="lazy"
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
    <button type="button" onClick={onSelect} className="group block text-start">
      <div
        className={`rounded-[18px] border bg-white px-3 py-4 transition ${
          isActive
            ? 'border-[#222222]'
            : 'border-[#d9d9d9] hover:border-[#bdbdbd]'
        }`}
      >
        <div className="flex h-[96px] items-center justify-center rounded-[14px] bg-white">
          <GenderIcon value={option.value} label={option.label} />
        </div>
      </div>

      <div className="pt-3 text-center text-[14px] font-medium leading-snug text-[#222222]">
        {option.label}
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
  options,
}: SortDropdownProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isOpen, setIsOpen] = useState(false)
  const groupedOptions = useMemo(() => buildSectionedOptions(options), [options])

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

  const [tempSelectedGender, setTempSelectedGender] =
    useState<GenderValue | null>(
      (currentGenderOption?.value as GenderValue | null) ?? null
    )

  const [tempSelectedSortOption, setTempSelectedSortOption] =
    useState<SortValue | null>(
      (currentSortOption?.value as SortValue | null) ?? null
    )

  useEffect(() => {
    if (!isOpen) return

    setTempSelectedGender(
      (currentGenderOption?.value as GenderValue | null) ?? null
    )
    setTempSelectedSortOption(
      (currentSortOption?.value as SortValue | null) ?? null
    )

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
  }, [isOpen, currentGenderOption, currentSortOption])

  const genderTitle = isArabic ? 'Gender' : 'Gender'
  const sortSectionTitle = isArabic ? 'Sort by' : 'Sort by'
  const clearAllLabel = isArabic ? 'Clear all' : 'Clear all'
  const showResultsLabel = isArabic ? 'Show results' : 'Show results'

  const selectedGenderOption =
    groupedOptions.gender.find((option) => option.value === tempSelectedGender) ??
    null

  const selectedSortOption =
    groupedOptions.sortBy.find(
      (option) => option.value === tempSelectedSortOption
    ) ?? null

  const handleClearAll = () => {
    setTempSelectedGender(null)
    setTempSelectedSortOption(null)
  }

  const handleShowResults = () => {
    const nextParams = new URLSearchParams(searchParams.toString())

    applyOptionParams(nextParams, selectedGenderOption, genderParamKeys)
    applyOptionParams(nextParams, selectedSortOption, sortParamKeys)

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
        className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border border-[#dddddd] bg-white p-0 text-[#222222] transition hover:shadow-sm md:h-[48px] md:w-auto md:gap-2 md:px-5"
        aria-label={sortByLabel}
      >
        <FilterIcon />
        <span className="hidden md:inline">{sortByLabel}</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[300] bg-black/35"
          onClick={() => setIsOpen(false)}
        >
          <div
            dir={isArabic ? 'rtl' : 'ltr'}
            onClick={(e) => e.stopPropagation()}
            className="
              absolute left-0 right-0 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] top-auto flex max-h-[calc(100dvh-96px)] flex-col overflow-hidden
              rounded-t-[28px] bg-white shadow-[0_-12px_50px_rgba(0,0,0,0.20)]
              sm:left-1/2 sm:right-auto sm:top-8 sm:bottom-auto sm:h-[min(760px,calc(100vh-64px))] sm:max-h-none sm:w-[min(92vw,620px)] sm:-translate-x-1/2 sm:rounded-[28px]
            "
          >
            <div className="relative flex h-[72px] shrink-0 items-center justify-center border-b border-[#ebebeb] px-5 sm:h-[76px] sm:px-6">
              <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-[#222222]">
                {sortByLabel}
              </h3>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[#222222] transition hover:bg-[#f7f7f7] ${
                  isArabic ? 'left-5 sm:left-6' : 'right-5 sm:right-6'
                }`}
                aria-label={isArabic ? 'إغلاق' : 'Close'}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-6 sm:flex-1 sm:px-7 sm:py-7">
              <section className="border-b border-[#ebebeb] pb-7">
                <h4 className="mb-5 text-[18px] font-semibold tracking-[-0.02em] text-[#222222]">
                  {genderTitle}
                </h4>

                <div className="grid grid-cols-2 gap-4 sm:max-w-[360px]">
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

              <section className="pt-7">
                <h4 className="mb-5 text-[18px] font-semibold tracking-[-0.02em] text-[#222222]">
                  {sortSectionTitle}
                </h4>

                <div className="rounded-[22px] border border-[#dddddd] bg-white p-[6px]">
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
                              ? 'border-[#222222] bg-white text-[#222222]'
                              : 'border-transparent bg-white text-[#222222] hover:bg-[#f7f7f7]'
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

            <div className="shrink-0 border-t border-[#ececec] bg-[#fbfbfb] px-5 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] sm:mt-auto sm:px-7 sm:py-5">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[14px] font-semibold text-[#8d8d8d] transition hover:text-[#0A46FF] sm:text-[15px]"
                >
                  {clearAllLabel}
                </button>

                <button
                  type="button"
                  onClick={handleShowResults}
                  className="inline-flex h-[54px] min-w-[170px] items-center justify-center rounded-[16px] bg-[#0A46FF] px-5 text-[14px] font-semibold text-white transition hover:bg-[#0838cc] sm:h-[56px] sm:min-w-[210px] sm:px-6 sm:text-[15px]"
                >
                  {showResultsLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}