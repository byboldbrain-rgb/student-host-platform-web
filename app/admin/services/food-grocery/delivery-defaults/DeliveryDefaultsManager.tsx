'use client'

import { useMemo, useState } from 'react'

type City = {
  id: string
  name_en: string | null
  name_ar?: string | null
}

type CityDeliveryArea = {
  id: number
  city_id: string
  code: string
  name_en: string
  name_ar: string
  sort_order?: number | null
  is_active?: boolean | null
  default_delivery_fee: number
  default_estimated_delivery_minutes?: number | null
  default_minimum_order_amount?: number | null
}

type AreaDraft = {
  tempId: string
  code: string
  name_en: string
  name_ar: string
  default_delivery_fee: string
  default_estimated_delivery_minutes: string
  default_minimum_order_amount: string
  is_active: boolean
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-11 w-full rounded-[16px] border border-gray-300 bg-white px-4 text-sm text-[#222222] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50',
        props.className
      )}
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'h-11 w-full rounded-[16px] border border-gray-300 bg-white px-4 text-sm text-[#222222] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50',
        props.className
      )}
    />
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-sm font-medium text-[#344054]">
      {children}
    </label>
  )
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] md:p-6">
      <div className="mb-5">
        <h2 className="text-[22px] font-semibold tracking-tight text-[#222222]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      {children}
    </section>
  )
}

export default function DeliveryDefaultsManager({
  initialCities,
  initialAreas,
}: {
  initialCities: City[]
  initialAreas: CityDeliveryArea[]
}) {
  const [cities] = useState<City[]>(Array.isArray(initialCities) ? initialCities : [])
  const [areas, setAreas] = useState<CityDeliveryArea[]>(
    Array.isArray(initialAreas) ? initialAreas : []
  )

  const [selectedCityId, setSelectedCityId] = useState<string>(
    initialCities?.[0]?.id || ''
  )

  const [newCityNameEn, setNewCityNameEn] = useState('')
  const [newCityNameAr, setNewCityNameAr] = useState('')

  const [draftAreas, setDraftAreas] = useState<AreaDraft[]>([
    {
      tempId: crypto.randomUUID(),
      code: '',
      name_en: '',
      name_ar: '',
      default_delivery_fee: '0',
      default_estimated_delivery_minutes: '',
      default_minimum_order_amount: '',
      is_active: true,
    },
  ])

  const [savingCity, setSavingCity] = useState(false)
  const [savingAreas, setSavingAreas] = useState(false)
  const [message, setMessage] = useState('')

  const selectedCityAreas = useMemo(() => {
    return areas
      .filter((area) => area.city_id === selectedCityId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }, [areas, selectedCityId])

  const handleAddDraftArea = () => {
    setDraftAreas((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        code: '',
        name_en: '',
        name_ar: '',
        default_delivery_fee: '0',
        default_estimated_delivery_minutes: '',
        default_minimum_order_amount: '',
        is_active: true,
      },
    ])
  }

  const handleDraftChange = (
    tempId: string,
    key: keyof AreaDraft,
    value: string | boolean
  ) => {
    setDraftAreas((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, [key]: value } : item
      )
    )
  }

  const handleRemoveDraftArea = (tempId: string) => {
    setDraftAreas((prev) => prev.filter((item) => item.tempId !== tempId))
  }

  const handleCreateCity = async () => {
    try {
      setSavingCity(true)
      setMessage('')

      if (!newCityNameEn.trim() && !newCityNameAr.trim()) {
        setMessage('City must have at least an English or Arabic name.')
        return
      }

      const res = await fetch('/api/admin/food-grocery/delivery-defaults/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_en: newCityNameEn.trim() || null,
          name_ar: newCityNameAr.trim() || null,
        }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Failed to create city')
      }

      window.location.reload()
    } catch (error: any) {
      setMessage(error?.message || 'Failed to create city')
    } finally {
      setSavingCity(false)
    }
  }

  const handleSaveAreas = async () => {
    try {
      setSavingAreas(true)
      setMessage('')

      if (!selectedCityId) {
        setMessage('Please select a city first.')
        return
      }

      const cleanedAreas = draftAreas
        .map((item, index) => ({
          code: item.code.trim(),
          name_en: item.name_en.trim(),
          name_ar: item.name_ar.trim(),
          sort_order: index,
          is_active: item.is_active,
          default_delivery_fee: Number(item.default_delivery_fee || 0),
          default_estimated_delivery_minutes: item.default_estimated_delivery_minutes
            ? Number(item.default_estimated_delivery_minutes)
            : null,
          default_minimum_order_amount: item.default_minimum_order_amount
            ? Number(item.default_minimum_order_amount)
            : null,
        }))
        .filter((item) => item.code || item.name_en || item.name_ar)

      if (cleanedAreas.length === 0) {
        setMessage('Add at least one valid area before saving.')
        return
      }

      const res = await fetch('/api/admin/food-grocery/delivery-defaults/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city_id: selectedCityId,
          areas: cleanedAreas,
        }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Failed to save areas')
      }

      window.location.reload()
    } catch (error: any) {
      setMessage(error?.message || 'Failed to save areas')
    } finally {
      setSavingAreas(false)
    }
  }

  const totalCities = cities.length
  const totalAreas = areas.length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
            Total Cities
          </p>
          <p className="mt-3 text-[30px] font-semibold text-[#222222]">{totalCities}</p>
        </div>

        <div className="rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
            Total Areas
          </p>
          <p className="mt-3 text-[30px] font-semibold text-[#222222]">{totalAreas}</p>
        </div>

        <div className="rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
            Selected City Areas
          </p>
          <p className="mt-3 text-[30px] font-semibold text-[#222222]">
            {selectedCityAreas.length}
          </p>
        </div>
      </div>

      <SectionCard
        title="Add New City"
        description=""
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>City Name (EN)</Label>
            <Input
              value={newCityNameEn}
              onChange={(e) => setNewCityNameEn(e.target.value)}
              placeholder="e.g. Cairo"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleCreateCity}
              disabled={savingCity}
              className="inline-flex h-11 w-full items-center justify-center rounded-[16px] border border-blue-600 bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {savingCity ? 'Creating...' : 'Create City'}
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Add Areas & Default Delivery Values"
        description=""
      >
        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <div>
            <Label>Select City</Label>
            <Select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
            >
              <option value="">Select a city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name_en || city.name_ar || 'Unnamed'}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {draftAreas.map((area, index) => (
            <div
              key={area.tempId}
              className="rounded-[24px] border border-gray-200 bg-[#fcfcfd] p-4 md:p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[18px] font-semibold text-[#222222]">
                  Area #{index + 1}
                </h3>

                {draftAreas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDraftArea(area.tempId)}
                    className="inline-flex items-center justify-center rounded-[14px] border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <Label>Area Name (EN)</Label>
                  <Input
                    value={area.name_en}
                    onChange={(e) =>
                      handleDraftChange(area.tempId, 'name_en', e.target.value)
                    }
                    placeholder="e.g. Nasr City"
                  />
                </div>

                <div>
                  <Label>Default Delivery Fee</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={area.default_delivery_fee}
                    onChange={(e) =>
                      handleDraftChange(area.tempId, 'default_delivery_fee', e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAddDraftArea}
            className="inline-flex items-center justify-center rounded-[16px] border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-[#222222] transition hover:bg-[#fafafa]"
          >
            Add Another Area
          </button>

          <button
            type="button"
            onClick={handleSaveAreas}
            disabled={savingAreas}
            className="inline-flex items-center justify-center rounded-[16px] border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {savingAreas ? 'Saving...' : 'Save Areas'}
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Existing Areas"
        description=""
      >
        {!selectedCityId ? (
          <div className="rounded-[20px] border border-dashed border-gray-300 bg-[#fcfcfd] px-6 py-10 text-center text-sm text-gray-500">
            Select a city to view its configured areas.
          </div>
        ) : selectedCityAreas.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-gray-300 bg-[#fcfcfd] px-6 py-10 text-center text-sm text-gray-500">
            No areas configured for this city yet.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedCityAreas.map((area) => (
              <div
                key={area.id}
                className="rounded-[20px] border border-gray-200 bg-[#fcfcfd] p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[17px] font-semibold text-[#222222]">
                        {area.name_en}
                      </h3>
                    </div>
                  </div>

                  <div className="ml-auto shrink-0">
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#222222] shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                      Fee: {Number(area.default_delivery_fee || 0).toFixed(2)} EGP
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {message ? (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
          {message}
        </div>
      ) : null}
    </div>
  )
}