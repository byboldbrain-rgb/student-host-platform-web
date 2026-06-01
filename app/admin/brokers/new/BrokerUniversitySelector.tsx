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

type BrokerRow = {
  id: string
  full_name: string
  phone_number: string
  whatsapp_number: string
  email: string | null
  company_name: string | null
}

type BrokerUniversityLinkRow = {
  broker_id: string
  university_id: string
}

type Props = {
  mode: 'create' | 'link-existing'
  cities: CityRow[]
  universities: UniversityRow[]
  brokers?: BrokerRow[]
  brokerUniversityLinks?: BrokerUniversityLinkRow[]
}

const inputClass =
  'h-12 w-full rounded-[18px] border border-gray-200 bg-white px-4 text-sm text-[#222222] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

export default function BrokerUniversitySelector({
  mode,
  cities,
  universities,
  brokers = [],
  brokerUniversityLinks = [],
}: Props) {
  const [selectedBrokerId, setSelectedBrokerId] = useState('')
  const [selectedCityId, setSelectedCityId] = useState('')
  const [selectedUniversityIds, setSelectedUniversityIds] = useState<string[]>([])

  const selectedBroker = useMemo(() => {
    if (!selectedBrokerId) return null
    return brokers.find((broker) => broker.id === selectedBrokerId) || null
  }, [brokers, selectedBrokerId])

  const linkedUniversityIds = useMemo(() => {
    if (mode !== 'link-existing' || !selectedBrokerId) {
      return new Set<string>()
    }

    return new Set(
      brokerUniversityLinks
        .filter((link) => link.broker_id === selectedBrokerId)
        .map((link) => link.university_id)
    )
  }, [brokerUniversityLinks, mode, selectedBrokerId])

  const filteredUniversities = useMemo(() => {
    if (!selectedCityId) return []
    return universities.filter((university) => university.city_id === selectedCityId)
  }, [selectedCityId, universities])

  function handleBrokerChange(brokerId: string) {
    setSelectedBrokerId(brokerId)
    setSelectedUniversityIds([])
  }

  function handleCityChange(cityId: string) {
    setSelectedCityId(cityId)
    setSelectedUniversityIds([])
  }

  function toggleUniversity(universityId: string) {
    if (linkedUniversityIds.has(universityId)) return

    setSelectedUniversityIds((current) => {
      if (current.includes(universityId)) {
        return current.filter((id) => id !== universityId)
      }

      return [...current, universityId]
    })
  }

  const totalLinkedUniversitiesForSelectedBroker = linkedUniversityIds.size

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {mode === 'link-existing' && (
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#222222]">
            Existing Broker *
          </label>

          <select
            name="broker_id"
            className={inputClass}
            value={selectedBrokerId}
            onChange={(e) => handleBrokerChange(e.target.value)}
            required
          >
            <option value="" disabled>
              Select broker
            </option>

            {brokers.map((broker) => (
              <option key={broker.id} value={broker.id}>
                {broker.full_name}
                {broker.company_name ? ` — ${broker.company_name}` : ''}
                {broker.phone_number ? ` — ${broker.phone_number}` : ''}
              </option>
            ))}
          </select>

          {selectedBroker && (
            <div className="mt-3 rounded-[18px] border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-1 text-sm">
                <p className="font-semibold text-[#222222]">
                  {selectedBroker.full_name}
                </p>

                {selectedBroker.company_name && (
                  <p className="text-gray-600">
                    Area: {selectedBroker.company_name}
                  </p>
                )}

                <p className="text-gray-600">
                  Phone: {selectedBroker.phone_number}
                </p>

                <p className="text-gray-600">
                  WhatsApp: {selectedBroker.whatsapp_number}
                </p>

                {selectedBroker.email && (
                  <p className="text-gray-600">
                    Email: {selectedBroker.email}
                  </p>
                )}

                <p className="mt-2 text-xs font-medium text-blue-700">
                  Already linked universities: {totalLinkedUniversitiesForSelectedBroker}
                </p>
              </div>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500">
            Choose the broker you want to connect with more universities.
          </p>
        </div>
      )}

      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-[#222222]">
          City *
        </label>

        <select
          name="city_id"
          className={inputClass}
          value={selectedCityId}
          onChange={(e) => handleCityChange(e.target.value)}
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

        {selectedUniversityIds.map((universityId) => (
          <input
            key={universityId}
            type="hidden"
            name="university_ids"
            value={universityId}
          />
        ))}

        <div className="rounded-[20px] border border-gray-200 bg-white p-4">
          {mode === 'link-existing' && !selectedBrokerId ? (
            <p className="text-sm text-gray-500">
              Please select a broker first.
            </p>
          ) : !selectedCityId ? (
            <p className="text-sm text-gray-500">
              Please select a city first.
            </p>
          ) : filteredUniversities.length === 0 ? (
            <p className="text-sm text-amber-700">
              No universities found for this city.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredUniversities.map((university) => {
                const isAlreadyLinked = linkedUniversityIds.has(university.id)
                const isChecked = selectedUniversityIds.includes(university.id)

                return (
                  <label
                    key={university.id}
                    className={[
                      'flex items-start gap-3 rounded-[18px] border p-4 transition',
                      isAlreadyLinked
                        ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-70'
                        : 'border-gray-200 bg-[#fafafa] hover:border-blue-300 hover:bg-white',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isAlreadyLinked}
                      onChange={() => toggleUniversity(university.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />

                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#222222]">
                        {university.name_en}

                        {isAlreadyLinked && (
                          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                            Already linked
                          </span>
                        )}
                      </span>

                      <span className="mt-1 block text-xs text-gray-500">
                        {university.name_ar}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <p className="mt-2 text-xs text-gray-500">
          {mode === 'link-existing'
            ? 'Choose one or more new universities to link this existing broker.'
            : 'Choose one or more universities to link this broker.'}
        </p>
      </div>
    </div>
  )
}