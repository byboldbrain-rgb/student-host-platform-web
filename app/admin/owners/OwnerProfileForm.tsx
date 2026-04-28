'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateOwnerSelfProfileAction } from './actions'

type OwnerServiceAreaRow = {
  id: string
  city_id: string | null
  university_id: string | null
  is_active: boolean
}

type OwnerRow = {
  id: string
  full_name: string
  phone_number: string | null
  whatsapp_number: string | null
  email: string | null
  company_name: string | null
  image_url: string | null
  tax_id: string | null
  national_id: string | null
  is_active: boolean
  city_id?: string | null
  university_id?: string | null
  service_areas?: OwnerServiceAreaRow[]
  university_ids?: string[]
}

type CityRow = {
  id: string
  name_en: string
  name_ar: string
}

type UniversityRow = {
  id: string
  city_id?: string | null
  name_en: string
  name_ar: string
}

type Props = {
  owner: OwnerRow
  cities: CityRow[]
  universities: UniversityRow[]
}

export default function OwnerProfileForm({ owner, cities, universities }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const initialUniversityIds = Array.from(
    new Set(
      [
        ...(owner.university_ids ?? []),
        ...(owner.service_areas ?? []).map((area) => area.university_id),
        owner.university_id,
      ]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  )

  const [fullName, setFullName] = useState(owner.full_name || '')
  const [companyName, setCompanyName] = useState(owner.company_name || '')
  const [cityId, setCityId] = useState(owner.city_id || '')
  const [selectedUniversityIds, setSelectedUniversityIds] =
    useState<string[]>(initialUniversityIds)
  const [phoneNumber, setPhoneNumber] = useState(owner.phone_number || '')
  const [whatsappNumber, setWhatsappNumber] = useState(owner.whatsapp_number || '')
  const [email, setEmail] = useState(owner.email || '')
  const [nationalId, setNationalId] = useState(owner.national_id || '')
  const [taxId, setTaxId] = useState(owner.tax_id || '')

  const universityById = useMemo(() => {
    return new Map(universities.map((university) => [university.id, university]))
  }, [universities])

  const filteredUniversities = useMemo(() => {
    if (!cityId) return universities
    return universities.filter((university) => university.city_id === cityId)
  }, [cityId, universities])

  const selectedUniversities = useMemo(() => {
    return selectedUniversityIds
      .map((universityId) => universityById.get(universityId))
      .filter(Boolean) as UniversityRow[]
  }, [selectedUniversityIds, universityById])

  const selectedUniversityIdSet = useMemo(() => {
    return new Set(selectedUniversityIds)
  }, [selectedUniversityIds])

  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

  const selectClass =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

  const labelClass =
    'mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400'

  const handleCityChange = (value: string) => {
    setCityId(value)
  }

  const handleUniversityToggle = (universityId: string) => {
    setSelectedUniversityIds((currentIds) => {
      if (currentIds.includes(universityId)) {
        return currentIds.filter((id) => id !== universityId)
      }

      return [...currentIds, universityId]
    })
  }

  const handleRemoveUniversity = (universityId: string) => {
    setSelectedUniversityIds((currentIds) =>
      currentIds.filter((id) => id !== universityId)
    )
  }

  const handleClearUniversities = () => {
    setSelectedUniversityIds([])
  }

  const handleSubmit = () => {
    setErrorMessage('')
    setSuccessMessage('')

    if (!fullName.trim()) {
      setErrorMessage('Owner full name is required')
      return
    }

    const firstSelectedUniversity = selectedUniversityIds[0]
      ? universityById.get(selectedUniversityIds[0])
      : null

    const primaryCityId =
      cityId ||
      firstSelectedUniversity?.city_id ||
      selectedUniversities[0]?.city_id ||
      ''

    const formData = new FormData()
    formData.set('full_name', fullName)
    formData.set('company_name', companyName)
    formData.set('city_id', primaryCityId || '')
    formData.set('university_id', selectedUniversityIds[0] || '')
    formData.set('phone_number', phoneNumber)
    formData.set('whatsapp_number', whatsappNumber)
    formData.set('email', email)
    formData.set('national_id', nationalId)
    formData.set('tax_id', taxId)

    selectedUniversityIds.forEach((universityId) => {
      formData.append('university_ids', universityId)
    })

    startTransition(async () => {
      try {
        await updateOwnerSelfProfileAction(formData)
        setSuccessMessage('Profile updated successfully')
        router.refresh()
      } catch (error: any) {
        setErrorMessage(error.message || 'Something went wrong')
      }
    })
  }

  return (
    <div>
      {(errorMessage || successMessage) && (
        <div className="mb-5 space-y-3">
          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {successMessage}
            </div>
          ) : null}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className={labelClass}>Owner Full Name</label>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Owner full name"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Company Name</label>
          <input
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Company name"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>City Filter</label>
          <select
            value={cityId}
            onChange={(event) => handleCityChange(event.target.value)}
            className={selectClass}
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name_en}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs font-medium text-slate-500">
            Use this to filter the universities list. The owner can still have
            universities from different cities.
          </p>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">
              Universities
            </label>

            {selectedUniversityIds.length > 0 ? (
              <button
                type="button"
                onClick={handleClearUniversities}
                className="text-xs font-bold text-red-600 transition hover:text-red-700"
              >
                Clear all
              </button>
            ) : null}
          </div>

          {selectedUniversities.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedUniversities.map((university) => (
                <button
                  key={university.id}
                  type="button"
                  onClick={() => handleRemoveUniversity(university.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                  title="Remove university"
                >
                  <span>{university.name_en}</span>
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
              No universities selected
            </div>
          )}

          <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
            {filteredUniversities.length === 0 ? (
              <div className="px-4 py-4 text-sm font-semibold text-slate-500">
                No universities found for this city.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredUniversities.map((university) => {
                  const isSelected = selectedUniversityIdSet.has(university.id)
                  const city = university.city_id
                    ? cities.find((item) => item.id === university.city_id)
                    : null

                  return (
                    <label
                      key={university.id}
                      className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleUniversityToggle(university.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />

                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-slate-900">
                          {university.name_en}
                        </span>
                        <span className="mt-0.5 block text-xs font-medium text-slate-500">
                          {city?.name_en || 'No city'}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <p className="mt-2 text-xs font-medium text-slate-500">
            Selected universities: {selectedUniversityIds.length}
          </p>
        </div>

        <div>
          <label className={labelClass}>Phone</label>
          <input
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="Phone number"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>WhatsApp</label>
          <input
            value={whatsappNumber}
            onChange={(event) => setWhatsappNumber(event.target.value)}
            placeholder="WhatsApp number"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>National ID</label>
          <input
            value={nationalId}
            onChange={(event) => setNationalId(event.target.value)}
            placeholder="National ID"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Tax ID</label>
          <input
            value={taxId}
            onChange={(event) => setTaxId(event.target.value)}
            placeholder="Tax ID"
            className={inputClass}
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}