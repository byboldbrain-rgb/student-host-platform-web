'use client'

import { useMemo } from 'react'

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

type SupportedLanguage = 'en' | 'ar'
type SupportedCurrency =
  | 'EGP'
  | 'USD'
  | 'EUR'
  | 'BHD'
  | 'DZD'
  | 'IQD'
  | 'JOD'
  | 'KWD'
  | 'LBP'
  | 'LYD'
  | 'MAD'
  | 'OMR'
  | 'QAR'
  | 'SAR'
  | 'TND'

type RestaurantsSearchBarProps = {
  cities: City[]
  universities: University[]
  initialCityId: string
  initialUniversityId: string
  initialQuery: string
  language: SupportedLanguage
  currency: SupportedCurrency
  labels: {
    city: string
    university: string
    keyword: string
    searchCities: string
    chooseUniversity: string
    selectCity: string
    selectUniversity: string
    anyCity: string
    anyUniversity: string
    searchPlaceholder: string
  }
}

export function RestaurantsSearchBar({
  cities,
  universities,
  initialCityId,
  initialUniversityId,
  initialQuery,
  language,
  currency,
  labels,
}: RestaurantsSearchBarProps) {
  const filteredUniversities = useMemo(() => {
    if (!initialCityId) return universities

    return universities.filter(
      (university) => String(university.city_id) === String(initialCityId)
    )
  }, [universities, initialCityId])

  const isArabic = language === 'ar'

  return (
    <form
      action="/services/restaurants"
      method="GET"
      className="w-full max-w-6xl rounded-[28px] border border-gray-200 bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
    >
      <input type="hidden" name="lang" value={language} />
      <input type="hidden" name="currency" value={currency} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto]">
        <div className="rounded-2xl border border-gray-200 px-4 py-3">
          <label className="mb-1 block text-[12px] font-semibold text-gray-500">
            {labels.keyword}
          </label>
          <input
            type="text"
            name="q"
            defaultValue={initialQuery}
            placeholder={labels.searchPlaceholder}
            className="w-full border-0 bg-transparent p-0 text-[15px] text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>

        <div className="rounded-2xl border border-gray-200 px-4 py-3">
          <label className="mb-1 block text-[12px] font-semibold text-gray-500">
            {labels.city}
          </label>
          <select
            name="city_id"
            defaultValue={initialCityId}
            className="w-full border-0 bg-transparent p-0 text-[15px] text-gray-900 outline-none"
          >
            <option value="">{labels.anyCity}</option>
            {cities.map((city) => (
              <option key={String(city.id)} value={String(city.id)}>
                {isArabic ? city.name_ar : city.name_en}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-gray-200 px-4 py-3">
          <label className="mb-1 block text-[12px] font-semibold text-gray-500">
            {labels.university}
          </label>
          <select
            name="university_id"
            defaultValue={initialUniversityId}
            className="w-full border-0 bg-transparent p-0 text-[15px] text-gray-900 outline-none"
          >
            <option value="">{labels.anyUniversity}</option>
            {filteredUniversities.map((university) => (
              <option key={String(university.id)} value={String(university.id)}>
                {isArabic ? university.name_ar : university.name_en}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="inline-flex h-full min-h-[58px] items-center justify-center rounded-2xl bg-black px-6 text-sm font-semibold text-white transition hover:bg-gray-900"
        >
          {isArabic ? 'بحث' : 'Search'}
        </button>
      </div>
    </form>
  )
}

export default RestaurantsSearchBar