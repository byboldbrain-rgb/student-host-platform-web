'use client'

import * as React from 'react'

type ProviderDeliveryArea = {
  area_id: number
  city_id: string
  code: string
  name_en: string
  name_ar: string
  sort_order?: number | null
  is_active?: boolean
  provider_area_fee_id?: number | null
  provider_is_available: boolean
  delivery_fee: number
  estimated_delivery_minutes?: number | null
  minimum_order_amount?: number | null
  default_delivery_fee: number
  default_estimated_delivery_minutes?: number | null
  default_minimum_order_amount?: number | null
  is_overridden?: boolean
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-medium text-[#344054]">{children}</label>
}

function Input({
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe] ${
        props.className || ''
      }`}
    />
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}) {
  return (
    <label className="inline-flex items-center gap-3">
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
          checked ? 'bg-[#175cd3]' : 'bg-[#d0d5dd]'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {label ? (
        <span className="text-sm font-medium text-[#344054]">{label}</span>
      ) : null}
    </label>
  )
}

function SummaryCard({
  title,
  value,
  tone = 'default',
}: {
  title: string
  value: string | number
  tone?: 'default' | 'success' | 'info'
}) {
  const toneClass =
    tone === 'success'
      ? 'bg-[#ecfdf3] text-[#027a48]'
      : tone === 'info'
      ? 'bg-[#eff8ff] text-[#175cd3]'
      : 'bg-[#f8fafc] text-[#344054]'

  return (
    <div className="rounded-2xl border border-[#eaecf0] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
        {title}
      </p>
      <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${toneClass}`}>
        {value}
      </div>
    </div>
  )
}

function formatMoney(value: number | null | undefined) {
  return `${Number(value ?? 0).toFixed(2)} EGP`
}

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function toBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }
  if (typeof value === 'number') return value === 1
  return fallback
}

function normalizeArea(raw: Partial<ProviderDeliveryArea> & Record<string, unknown>): ProviderDeliveryArea {
  const defaultDeliveryFee = toNumber(
    raw.default_delivery_fee ?? raw.delivery_fee ?? 0,
    0
  )

  const providerIsAvailable = toBoolean(
    raw.provider_is_available ?? raw.is_available ?? raw.is_enabled,
    true
  )

  const deliveryFee = providerIsAvailable
    ? toNumber(raw.delivery_fee ?? raw.default_delivery_fee ?? 0, 0)
    : 0

  return {
    area_id: toNumber(raw.area_id ?? raw.id, 0),
    city_id: String(raw.city_id ?? ''),
    code: String(raw.code ?? ''),
    name_en: String(raw.name_en ?? ''),
    name_ar: String(raw.name_ar ?? ''),
    sort_order:
      raw.sort_order === null || raw.sort_order === undefined
        ? null
        : toNumber(raw.sort_order, 0),
    is_active: raw.is_active === undefined ? true : toBoolean(raw.is_active, true),
    provider_area_fee_id:
      raw.provider_area_fee_id === null || raw.provider_area_fee_id === undefined
        ? null
        : toNumber(raw.provider_area_fee_id, 0),
    provider_is_available: providerIsAvailable,
    delivery_fee: deliveryFee,
    estimated_delivery_minutes: toNullableNumber(
      raw.estimated_delivery_minutes ?? raw.default_estimated_delivery_minutes
    ),
    minimum_order_amount: toNullableNumber(
      raw.minimum_order_amount ?? raw.default_minimum_order_amount
    ),
    default_delivery_fee: defaultDeliveryFee,
    default_estimated_delivery_minutes: toNullableNumber(raw.default_estimated_delivery_minutes),
    default_minimum_order_amount: toNullableNumber(raw.default_minimum_order_amount),
    is_overridden: toBoolean(raw.is_overridden, false),
  }
}

export default function DeliveryZonesEditor({
  cityId,
  areas,
  setAreas,
}: {
  cityId: string
  areas: ProviderDeliveryArea[]
  setAreas: React.Dispatch<React.SetStateAction<ProviderDeliveryArea[]>>
}) {
  const normalizedCityId = String(cityId ?? '').trim()

  const safeAreas = React.useMemo(() => {
    if (!Array.isArray(areas)) return []

    return areas
      .map((area) => normalizeArea((area ?? {}) as Partial<ProviderDeliveryArea> & Record<string, unknown>))
      .filter((area) => area.area_id > 0)
      .sort((a, b) => {
        const aOrder = a.sort_order ?? 0
        const bOrder = b.sort_order ?? 0
        return aOrder - bOrder || a.name_en.localeCompare(b.name_en)
      })
  }, [areas])

  const enabledAreas = safeAreas.filter((area) => area.provider_is_available)
  const overriddenAreas = safeAreas.filter((area) => area.is_overridden)

  const averageFee =
    enabledAreas.length > 0
      ? (
          enabledAreas.reduce((sum, area) => sum + Number(area.delivery_fee || 0), 0) /
          enabledAreas.length
        ).toFixed(2)
      : '0.00'

  const updateArea = (
    areaId: number,
    key: keyof ProviderDeliveryArea,
    value: string | number | boolean | null
  ) => {
    setAreas((prev) =>
      (Array.isArray(prev) ? prev : []).map((item) => {
        const area = normalizeArea((item ?? {}) as Partial<ProviderDeliveryArea> & Record<string, unknown>)
        if (area.area_id !== areaId) return area

        return {
          ...area,
          [key]: value,
          is_overridden: true,
        }
      })
    )
  }

  const handleAvailabilityChange = (areaId: number, checked: boolean) => {
    setAreas((prev) =>
      (Array.isArray(prev) ? prev : []).map((item) => {
        const area = normalizeArea((item ?? {}) as Partial<ProviderDeliveryArea> & Record<string, unknown>)
        if (area.area_id !== areaId) return area

        return {
          ...area,
          provider_is_available: checked,
          delivery_fee: checked ? Number(area.delivery_fee ?? area.default_delivery_fee ?? 0) : 0,
          estimated_delivery_minutes: checked
            ? area.estimated_delivery_minutes ?? area.default_estimated_delivery_minutes ?? null
            : null,
          minimum_order_amount: checked
            ? area.minimum_order_amount ?? area.default_minimum_order_amount ?? null
            : null,
          is_overridden: true,
        }
      })
    )
  }

  const resetToDefault = (areaId: number) => {
    setAreas((prev) =>
      (Array.isArray(prev) ? prev : []).map((item) => {
        const area = normalizeArea((item ?? {}) as Partial<ProviderDeliveryArea> & Record<string, unknown>)
        if (area.area_id !== areaId) return area

        return {
          ...area,
          provider_is_available: true,
          delivery_fee: Number(area.default_delivery_fee ?? 0),
          estimated_delivery_minutes: area.default_estimated_delivery_minutes ?? null,
          minimum_order_amount: area.default_minimum_order_amount ?? null,
          is_overridden: false,
        }
      })
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#101828]">Delivery coverage</h2>
          <p className="mt-1 text-sm text-[#667085]">
            Each area has a city default. The supplier can keep the default values or override them.
          </p>
        </div>

        <div className="text-sm text-[#667085]">
          {normalizedCityId
            ? 'Areas loaded from selected city'
            : 'Select a city first to manage delivery coverage'}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="City Areas" value={safeAreas.length} />
        <SummaryCard title="Enabled Areas" value={enabledAreas.length} tone="success" />
        <SummaryCard title="Average Fee" value={`${averageFee} EGP`} tone="info" />
        <SummaryCard title="Overrides" value={overriddenAreas.length} />
      </div>

      {!normalizedCityId ? (
        <div className="rounded-[24px] border border-dashed border-[#d0d5dd] bg-white px-6 py-14 text-center">
          <h3 className="text-lg font-semibold text-[#101828]">No city selected</h3>
          <p className="mt-2 text-sm text-[#667085]">
            Choose a city in Supplier Details first, then the delivery areas for that city will appear here automatically.
          </p>
        </div>
      ) : safeAreas.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#d0d5dd] bg-white px-6 py-14 text-center">
          <h3 className="text-lg font-semibold text-[#101828]">No master areas found</h3>
          <p className="mt-2 text-sm text-[#667085]">
            The selected city is set, but this editor received zero delivery areas.
          </p>
          <p className="mt-2 text-sm text-[#667085]">
            Check that the parent page is loading areas from <span className="font-semibold text-[#344054]">city_delivery_areas</span>
            {' '}using the selected <span className="font-semibold text-[#344054]">city_id</span>, then merge provider overrides if needed.
          </p>
          <div className="mt-5 inline-flex rounded-2xl bg-[#f8fafc] px-4 py-3 text-left text-xs text-[#667085]">
            Expected flow: service_providers.city_id → city_delivery_areas.city_id → optional provider_delivery_area_overrides by provider_id + area_id
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {safeAreas.map((area) => (
            <div
              key={area.area_id}
              className={`rounded-[24px] border p-5 transition md:p-6 ${
                area.provider_is_available
                  ? 'border-[#bfd6ff] bg-[#f5f9ff]'
                  : 'border-[#eaecf0] bg-[#fcfcfd]'
              }`}
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-[#101828]">
                      {area.name_en || area.name_ar || `Area #${area.area_id}`}
                    </h3>

                    {area.name_ar ? (
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-[#475467]">
                        {area.name_ar}
                      </span>
                    ) : null}

                    {area.is_overridden ? (
                      <span className="rounded-full bg-[#eff8ff] px-3 py-1 text-xs font-semibold text-[#175cd3]">
                        Overridden
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#ecfdf3] px-3 py-1 text-xs font-semibold text-[#027a48]">
                        Default
                      </span>
                    )}

                    {area.code ? (
                      <span className="rounded-full bg-[#f2f4f7] px-3 py-1 text-xs font-semibold text-[#475467]">
                        {area.code}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:max-w-[720px]">
                    <div className="rounded-2xl border border-[#eaecf0] bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
                        Default Fee
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#101828]">
                        {formatMoney(area.default_delivery_fee)}
                      </p>
                    </div>

                    <div>
                      <FieldLabel>Delivery Fee</FieldLabel>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        disabled={!area.provider_is_available}
                        value={area.provider_is_available ? area.delivery_fee ?? 0 : ''}
                        onChange={(e) =>
                          updateArea(
                            area.area_id,
                            'delivery_fee',
                            Number(e.target.value || 0)
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-3 xl:items-end">
                  <Toggle
                    checked={area.provider_is_available}
                    onChange={(checked) =>
                      handleAvailabilityChange(area.area_id, checked)
                    }
                    label={area.provider_is_available ? 'Enabled' : 'Disabled'}
                  />

                  <button
                    type="button"
                    onClick={() => resetToDefault(area.area_id)}
                    className="inline-flex items-center justify-center rounded-xl border border-[#d0d5dd] bg-white px-4 py-2 text-sm font-semibold text-[#344054] transition hover:bg-[#f9fafb]"
                  >
                    Reset to default
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}