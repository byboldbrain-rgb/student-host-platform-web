'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

type ServiceCategory = {
  id: string | number
  slug: string
  name_en: string
  name_ar: string
  icon?: string | null
}

type Language = 'en' | 'ar'

type Labels = {
  city: string
  university: string
  category: string
  searchCities: string
  chooseUniversity: string
  chooseCategory: string
  selectCity: string
  selectUniversity: string
  selectCategory: string
  selectCityFirst: string
  anyCity: string
  anyUniversity: string
  anyCategory: string
}

type Props = {
  cities: City[]
  universities: University[]
  categories: ServiceCategory[]
  initialCityId?: string
  initialUniversityId?: string
  initialCategoryId?: string
  language?: Language
  currency?: string
  labels: Labels
  hideCategory?: boolean
}

type OpenMenu = 'city' | 'university' | 'category' | null

export default function ServicesSearchBar({
  cities = [],
  universities = [],
  categories = [],
  initialCityId = '',
  initialUniversityId = '',
  initialCategoryId = '',
  language = 'en',
  currency = 'EGP',
  labels,
  hideCategory = false,
}: Props) {
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const [draftCityId, setDraftCityId] = useState(initialCityId)
  const [draftUniversityId, setDraftUniversityId] = useState(initialUniversityId)
  const [draftCategoryId, setDraftCategoryId] = useState(initialCategoryId)
  const [categoryError, setCategoryError] = useState(false)

  const isArabic = language === 'ar'

  useEffect(() => {
    setDraftCityId(initialCityId)
  }, [initialCityId])

  useEffect(() => {
    setDraftUniversityId(initialUniversityId)
  }, [initialUniversityId])

  useEffect(() => {
    setDraftCategoryId(initialCategoryId)
  }, [initialCategoryId])

  useEffect(() => {
    if (hideCategory) {
      setCategoryError(false)
      return
    }

    if (draftCategoryId) {
      setCategoryError(false)
    }
  }, [draftCategoryId, hideCategory])

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

  const filteredUniversities = useMemo(() => {
    if (!draftCityId) return []

    return universities.filter(
      (university) => String(university.city_id) === String(draftCityId)
    )
  }, [draftCityId, universities])

  useEffect(() => {
    if (!draftUniversityId) return

    const selectedUniversityStillValid = filteredUniversities.some(
      (university) => String(university.id) === String(draftUniversityId)
    )

    if (!selectedUniversityStillValid) {
      setDraftUniversityId('')
    }
  }, [draftCityId, draftUniversityId, filteredUniversities])

  const selectedCityLabel = useMemo(() => {
    const city = cities.find((item) => String(item.id) === String(draftCityId))
    if (!city) return labels.searchCities
    return isArabic ? city.name_ar || city.name_en : city.name_en
  }, [cities, draftCityId, labels.searchCities, isArabic])

  const selectedUniversityLabel = useMemo(() => {
    if (!draftCityId) return labels.selectCityFirst

    const university = filteredUniversities.find(
      (item) => String(item.id) === String(draftUniversityId)
    )

    if (!university) return labels.chooseUniversity
    return isArabic ? university.name_ar || university.name_en : university.name_en
  }, [
    draftCityId,
    draftUniversityId,
    filteredUniversities,
    labels.chooseUniversity,
    labels.selectCityFirst,
    isArabic,
  ])

  const selectedCategoryLabel = useMemo(() => {
    const safeCategories = categories ?? []
    const category = safeCategories.find(
      (item) => String(item.id) === String(draftCategoryId)
    )

    if (!category) return labels.chooseCategory
    return isArabic ? category.name_ar : category.name_en
  }, [categories, draftCategoryId, labels.chooseCategory, isArabic])

  const isFoodGroceryCategory = (category?: ServiceCategory | null) => {
    if (!category) return false

    const slug = category.slug?.toLowerCase().trim()
    const nameEn = category.name_en?.toLowerCase().trim()
    const nameAr = category.name_ar?.trim()

    return (
      slug === 'food-grocery' ||
      slug === 'food_and_grocery' ||
      slug === 'food-grocery-services' ||
      nameEn === 'food & grocery' ||
      nameAr === 'طعام وبقالة'
    )
  }

  const applySearch = () => {
    if (!hideCategory && !draftCategoryId) {
      setCategoryError(true)
      setOpenMenu('category')
      return
    }

    const params = new URLSearchParams()

    if (draftCityId) {
      params.set('city_id', draftCityId)
    }

    if (draftUniversityId) {
      params.set('university_id', draftUniversityId)
    }

    if (!hideCategory && draftCategoryId) {
      params.set('category_id', draftCategoryId)
    }

    if (language) {
      params.set('lang', language)
    }

    if (currency) {
      params.set('currency', currency)
    }

    const selectedCategory = categories.find(
      (category) => String(category.id) === String(draftCategoryId)
    )

    const targetPath = hideCategory
      ? '/services/food-grocery'
      : isFoodGroceryCategory(selectedCategory)
      ? '/services/food-grocery'
      : '/services'

    const queryString = params.toString()
    router.push(queryString ? `${targetPath}?${queryString}` : targetPath)
  }

  const panelClass = isArabic
    ? 'absolute right-0 top-[calc(100%+8px)] z-30 max-h-64 w-full min-w-[220px] overflow-auto rounded-2xl border border-[#dddddd] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)]'
    : 'absolute left-0 top-[calc(100%+8px)] z-30 max-h-64 w-full min-w-[220px] overflow-auto rounded-2xl border border-[#dddddd] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)]'

  const itemClass =
    'block w-full rounded-xl px-2 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100'

  const categoryErrorMessage = isArabic
    ? 'لازم تختار Category قبل البحث'
    : 'Please select a category before searching'

  const isSearchDisabled = hideCategory ? false : !draftCategoryId
  const isUniversityDisabled = !draftCityId

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
          className={`relative min-w-0 flex-1 transition ${
            isUniversityDisabled
              ? 'cursor-not-allowed bg-gray-50 opacity-70'
              : 'hover:bg-[#f7f7f7]'
          } ${hideCategory ? (isArabic ? 'rounded-l-full' : 'rounded-r-full') : ''}`}
        >
          <button
            type="button"
            onClick={() => {
              if (isUniversityDisabled) return
              setOpenMenu(openMenu === 'university' ? null : 'university')
            }}
            disabled={isUniversityDisabled}
            className={`w-full px-6 py-3 ${
              isArabic
                ? hideCategory
                  ? 'rounded-l-full text-right'
                  : 'text-right'
                : hideCategory
                ? 'rounded-r-full text-left'
                : 'text-left'
            }`}
          >
            <p className="text-[14px] font-semibold leading-none text-[#222222]">
              {labels.university}
            </p>
            <p className="mt-1 truncate text-[16px] font-normal text-[#6a6a6a]">
              {selectedUniversityLabel}
            </p>
          </button>

          {openMenu === 'university' && !isUniversityDisabled && (
            <div className={panelClass}>
              <div className="mb-2 px-3 text-sm font-semibold text-gray-900">
                {labels.selectUniversity}
              </div>

              <button
                type="button"
                onClick={() => {
                  setDraftUniversityId('')
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
                  {isArabic
                    ? university.name_ar || university.name_en
                    : university.name_en}
                </button>
              ))}

              {filteredUniversities.length === 0 && (
                <div
                  className={`px-3 py-2 text-sm text-gray-500 ${
                    isArabic ? 'text-right' : 'text-left'
                  }`}
                >
                  {isArabic
                    ? 'لا توجد جامعات مرتبطة بهذه المدينة'
                    : 'No universities linked to this city'}
                </div>
              )}
            </div>
          )}
        </div>

        {!hideCategory && (
          <>
            <div className="h-8 w-px bg-[#dddddd]" />

            <div
              className={`relative min-w-0 flex-1 transition hover:bg-[#f7f7f7] ${
                categoryError ? 'bg-red-50' : ''
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  setOpenMenu(openMenu === 'category' ? null : 'category')
                }
                className={`w-full px-6 py-3 ${isArabic ? 'text-right' : 'text-left'}`}
              >
                <p
                  className={`text-[14px] font-semibold leading-none ${
                    categoryError ? 'text-red-600' : 'text-[#222222]'
                  }`}
                >
                  {labels.category}
                </p>
                <p
                  className={`mt-1 truncate text-[16px] font-normal ${
                    categoryError ? 'text-red-500' : 'text-[#6a6a6a]'
                  }`}
                >
                  {selectedCategoryLabel}
                </p>
              </button>

              {openMenu === 'category' && (
                <div className={panelClass}>
                  <div className="mb-2 px-3 text-sm font-semibold text-gray-900">
                    {labels.selectCategory}
                  </div>

                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setDraftCategoryId(String(category.id))
                        setCategoryError(false)
                        setOpenMenu(null)
                      }}
                      className={`${itemClass} ${
                        isArabic ? 'text-right' : 'text-left'
                      } ${
                        String(draftCategoryId) === String(category.id)
                          ? 'bg-gray-100 font-semibold text-gray-900'
                          : ''
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        {category.icon ? <span>{category.icon}</span> : null}
                        <span>{isArabic ? category.name_ar : category.name_en}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="px-4">
          <button
            type="button"
            onClick={applySearch}
            disabled={isSearchDisabled}
            className={`flex h-[44px] w-[44px] items-center justify-center rounded-full text-[20px] text-white shadow-sm transition ${
              isSearchDisabled
                ? 'cursor-not-allowed bg-[#9db7ff] opacity-70'
                : 'bg-[#0047ff] hover:scale-[1.02]'
            }`}
          >
            ⌕
          </button>
        </div>
      </div>

      {!hideCategory && categoryError && (
        <p
          dir={isArabic ? 'rtl' : 'ltr'}
          className={`mt-2 text-sm font-medium text-red-600 ${
            isArabic ? 'text-right' : 'text-left'
          }`}
        >
          {categoryErrorMessage}
        </p>
      )}
    </div>
  )
}