'use client'

import { useMemo, useState } from 'react'

type CityRow = {
  id: string
  name_en: string
  name_ar: string
}

type UniversityRow = {
  id: string
  city_id: string
  name_en: string
  name_ar: string
}

type Props = {
  cities: CityRow[]
  universities: UniversityRow[]
}

const inputClass =
  'h-12 w-full rounded-[18px] border border-gray-200 bg-white px-4 text-sm text-[#222222] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

export default function BrokerUniversitySelector({
  cities,
  universities,
}: Props) {
  const [selectedCityId, setSelectedCityId] = useState('')

  const filteredUniversities = useMemo(() => {
    if (!selectedCityId) return []
    return universities.filter((university) => university.city_id === selectedCityId)
  }, [selectedCityId, universities])

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-[#222222]">
          City *
        </label>

        <select
          name="city_id"
          className={inputClass}
          value={selectedCityId}
          onChange={(e) => setSelectedCityId(e.target.value)}
          required
        >
          <option value="" disabled>
            Select city
          </option>

          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name_en} — {city.name_ar}
            </option>
          ))}
        </select>

        <p className="mt-2 text-xs text-gray-500">
          City is used to filter the universities list.
        </p>
      </div>

      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-[#222222]">
          Universities *
        </label>

        <div className="rounded-[20px] border border-gray-200 bg-white p-4">
          {!selectedCityId ? (
            <p className="text-sm text-gray-500">
              Please select a city first.
            </p>
          ) : filteredUniversities.length === 0 ? (
            <p className="text-sm text-amber-700">
              No universities found for this city.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredUniversities.map((university) => (
                <label
                  key={university.id}
                  className="flex items-start gap-3 rounded-[18px] border border-gray-200 bg-[#fafafa] p-4 transition hover:border-blue-300 hover:bg-white"
                >
                  <input
                    type="checkbox"
                    name="university_ids"
                    value={university.id}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />

                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#222222]">
                      {university.name_en}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {university.name_ar}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Choose one or more universities to link this broker.
        </p>
      </div>
    </div>
  )
}