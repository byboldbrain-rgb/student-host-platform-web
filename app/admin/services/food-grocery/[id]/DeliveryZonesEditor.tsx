'use client'

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

function formatMaybeNumber(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined) return 'Not set'
  return `${value}${suffix}`
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
  const safeAreas = Array.isArray(areas) ? areas : []

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
      prev.map((area) => {
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
      prev.map((area) => {
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
      prev.map((area) => {
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
            Each area has a city default. The provider can keep the default values or override them.
          </p>
        </div>

        <div className="text-sm text-[#667085]">
          {cityId ? 'Areas loaded from selected city' : 'Select a city first to manage delivery coverage'}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="City Areas" value={safeAreas.length} />
        <SummaryCard title="Enabled Areas" value={enabledAreas.length} tone="success" />
        <SummaryCard title="Average Fee" value={`${averageFee} EGP`} tone="info" />
        <SummaryCard title="Overrides" value={overriddenAreas.length} />
      </div>

      {!cityId ? (
        <div className="rounded-[24px] border border-dashed border-[#d0d5dd] bg-white px-6 py-14 text-center">
          <h3 className="text-lg font-semibold text-[#101828]">No city selected</h3>
          <p className="mt-2 text-sm text-[#667085]">
            Choose a city in Provider Details first, then the delivery areas for that city will appear here automatically.
          </p>
        </div>
      ) : safeAreas.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#d0d5dd] bg-white px-6 py-14 text-center">
          <h3 className="text-lg font-semibold text-[#101828]">No master areas found</h3>
          <p className="mt-2 text-sm text-[#667085]">
            This city does not have delivery areas configured yet in the master data.
          </p>
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
                      {area.name_en}
                    </h3>
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