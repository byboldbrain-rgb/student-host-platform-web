'use client'

import { useMemo, useRef, useState } from 'react'

function FieldLabel({
  children,
  optional,
}: {
  children: React.ReactNode
  optional?: boolean
}) {
  return (
    <label className="mb-2 block text-sm font-medium text-[#344054]">
      {children}
      {optional ? <span className="ml-1 text-[#98a2b3]">(optional)</span> : null}
    </label>
  )
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

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe] ${
        props.className || ''
      }`}
    >
      {children}
    </select>
  )
}

function Textarea({
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-[110px] w-full rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe] ${
        props.className || ''
      }`}
    />
  )
}

type BusinessHourRow = {
  day_of_week: number
  is_open: boolean
  open_time: string
  close_time: string
}

type ProviderFormState = {
  category_id: string
  provider_kind: 'restaurant' | 'supermarket' | ''
  subcategory_ids: string[]
  university_ids: string[]
  name_en: string
  name_ar: string
  slug: string
  short_description_en: string
  short_description_ar: string
  full_description_en: string
  full_description_ar: string
  phone: string
  email: string
  website_url: string
  address_line: string
  google_maps_url: string
  logo_url: string
  cover_image_url: string
  whatsapp_number: string
  whatsapp_message_template: string
  city_id: string
  primary_university_id: string
  is_featured: boolean
  is_active: boolean
  discount_percentage: string
  discount_title_en: string
  discount_title_ar: string
  is_manually_closed: boolean
  manual_closed_note: string
  business_hours: BusinessHourRow[]
}

type ServiceCategory = {
  id: number
  slug: string
  name_en: string
  name_ar?: string | null
}

type ServiceSubcategory = {
  id: number
  category_id: number
  slug: string
  name_en: string
  name_ar: string
  is_active?: boolean | null
}

type UniversityOption = {
  id: number | string
  university_id?: number | string
  value?: number | string
  name_en?: string
  name_ar?: string
  name?: string
  title?: string
  city_id?: number | string | null
  cityId?: number | string | null
  city?: {
    id?: number | string | null
  } | null
}

function getUniversityId(university: any) {
  return String(university?.id ?? university?.university_id ?? university?.value ?? '')
}

function getUniversityName(university: any) {
  return (
    university?.name_en ||
    university?.name ||
    university?.title ||
    university?.name_ar ||
    'Unnamed University'
  )
}

function getUniversityCityId(university: any) {
  const raw = university?.city_id ?? university?.cityId ?? university?.city?.id ?? null
  return raw === null || raw === undefined ? '' : String(raw)
}

function getDayName(day: number) {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]

  return days[day] || `Day ${day}`
}

function MultiSelectSubcategories({
  options,
  selectedIds,
  onToggle,
  placeholder = 'Select subcategories',
}: {
  options: ServiceSubcategory[]
  selectedIds: string[]
  onToggle: (id: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : []

  const selectedOptions = useMemo(
    () => options.filter((item) => safeSelectedIds.includes(String(item.id))),
    [options, safeSelectedIds]
  )

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-[54px] w-full items-center justify-between rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-left text-sm text-[#101828] transition hover:border-[#bfc7d4] focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe]"
      >
        <div className="flex flex-1 flex-wrap gap-2 pr-3">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center rounded-full border border-[#dbeafe] bg-[#f5f9ff] px-3 py-1 text-xs font-medium text-[#175cd3]"
              >
                {item.name_en}
              </span>
            ))
          ) : (
            <span className="text-[#98a2b3]">{placeholder}</span>
          )}
        </div>

        <span className="shrink-0 text-xs text-[#667085]">{open ? '▲' : '▼'}</span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close subcategory menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-[#eaecf0] bg-white p-2 shadow-[0_12px_24px_rgba(16,24,40,0.08)]">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-[#667085]">
                No subcategories available.
              </div>
            ) : (
              <div className="space-y-1">
                {options.map((subcategory) => {
                  const checked = safeSelectedIds.includes(String(subcategory.id))

                  return (
                    <label
                      key={subcategory.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                        checked
                          ? 'bg-[#f5f9ff] text-[#101828]'
                          : 'text-[#344054] hover:bg-[#f9fafb]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[#d0d5dd]"
                        checked={checked}
                        onChange={() => onToggle(String(subcategory.id))}
                      />
                      <span>{subcategory.name_en}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

function MultiSelectUniversities({
  options,
  selectedIds,
  onToggle,
  placeholder = 'Select universities',
}: {
  options: UniversityOption[]
  selectedIds: string[]
  onToggle: (id: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : []

  const normalizedOptions = useMemo(
    () =>
      options.filter((item) => {
        const id = getUniversityId(item)
        const name = getUniversityName(item)
        return id && name
      }),
    [options]
  )

  const selectedOptions = useMemo(
    () => normalizedOptions.filter((item) => safeSelectedIds.includes(getUniversityId(item))),
    [normalizedOptions, safeSelectedIds]
  )

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-[54px] w-full items-center justify-between rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-left text-sm text-[#101828] transition hover:border-[#bfc7d4] focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe]"
      >
        <div className="flex flex-1 flex-wrap gap-2 pr-3">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((item) => (
              <span
                key={getUniversityId(item)}
                className="inline-flex items-center rounded-full border border-[#e4e7ec] bg-[#f8fafc] px-3 py-1 text-xs font-medium text-[#344054]"
              >
                {getUniversityName(item)}
              </span>
            ))
          ) : (
            <span className="text-[#98a2b3]">{placeholder}</span>
          )}
        </div>

        <span className="shrink-0 text-xs text-[#667085]">{open ? '▲' : '▼'}</span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close university menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-[#eaecf0] bg-white p-2 shadow-[0_12px_24px_rgba(16,24,40,0.08)]">
            {normalizedOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-[#667085]">
                No universities available.
              </div>
            ) : (
              <div className="space-y-1">
                {normalizedOptions.map((university) => {
                  const universityId = getUniversityId(university)
                  const checked = safeSelectedIds.includes(universityId)

                  return (
                    <label
                      key={universityId}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                        checked
                          ? 'bg-[#f5f9ff] text-[#101828]'
                          : 'text-[#344054] hover:bg-[#f9fafb]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[#d0d5dd]"
                        checked={checked}
                        onChange={() => onToggle(universityId)}
                      />
                      <span>{getUniversityName(university)}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

function SectionBlock({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[24px] border border-[#eaecf0] bg-[#fcfcfd] p-5 md:p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-[#101828]">{title}</h3>
        <p className="mt-1 text-sm text-[#667085]">{description}</p>
      </div>
      {children}
    </div>
  )
}

function ToggleCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[#eaecf0] bg-white px-4 py-4">
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-[#101828]">{title}</h4>
        <p className="mt-1 text-sm leading-6 text-[#667085]">{description}</p>
      </div>

      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
          checked ? 'bg-[#175cd3]' : 'bg-[#d0d5dd]'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

function BusinessHoursEditor({
  value,
  onChange,
}: {
  value: BusinessHourRow[]
  onChange: (rows: BusinessHourRow[]) => void
}) {
  const safeValue = Array.isArray(value) ? value : []

  const normalizedRows = useMemo(() => {
    const rowsMap = new Map<number, BusinessHourRow>()

    safeValue.forEach((row) => {
      rowsMap.set(Number(row.day_of_week), {
        day_of_week: Number(row.day_of_week),
        is_open: row.is_open !== false,
        open_time: row.open_time || '10:00',
        close_time: row.close_time || '22:00',
      })
    })

    return Array.from({ length: 7 }, (_, day) => {
      return (
        rowsMap.get(day) || {
          day_of_week: day,
          is_open: true,
          open_time: '10:00',
          close_time: '22:00',
        }
      )
    })
  }, [safeValue])

  const updateRow = (
    day: number,
    patch: Partial<BusinessHourRow>
  ) => {
    const nextRows = normalizedRows.map((row) =>
      row.day_of_week === day ? { ...row, ...patch } : row
    )

    onChange(nextRows)
  }

  return (
    <div className="space-y-3">
      {normalizedRows.map((row) => (
        <div
          key={row.day_of_week}
          className="rounded-2xl border border-[#eaecf0] bg-white p-4"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-[140px]">
              <p className="text-sm font-semibold text-[#101828]">
                {getDayName(row.day_of_week)}
              </p>
            </div>

            <div className="grid flex-1 gap-4 md:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="flex items-center">
                <label className="inline-flex items-center gap-3 text-sm font-medium text-[#344054]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#d0d5dd]"
                    checked={row.is_open}
                    onChange={(e) => {
                      const checked = e.target.checked
                      updateRow(row.day_of_week, {
                        is_open: checked,
                        open_time: checked ? row.open_time || '10:00' : '',
                        close_time: checked ? row.close_time || '22:00' : '',
                      })
                    }}
                  />
                  <span>Open this day</span>
                </label>
              </div>

              <div>
                <FieldLabel optional>Open Time</FieldLabel>
                <Input
                  type="time"
                  value={row.is_open ? row.open_time || '' : ''}
                  disabled={!row.is_open}
                  onChange={(e) =>
                    updateRow(row.day_of_week, { open_time: e.target.value })
                  }
                  className={!row.is_open ? 'cursor-not-allowed bg-[#f9fafb] text-[#98a2b3]' : ''}
                />
              </div>

              <div>
                <FieldLabel optional>Close Time</FieldLabel>
                <Input
                  type="time"
                  value={row.is_open ? row.close_time || '' : ''}
                  disabled={!row.is_open}
                  onChange={(e) =>
                    updateRow(row.day_of_week, { close_time: e.target.value })
                  }
                  className={!row.is_open ? 'cursor-not-allowed bg-[#f9fafb] text-[#98a2b3]' : ''}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProviderInfoForm({
  form,
  setForm,
  cities,
  universities,
  serviceCategories = [],
  serviceSubcategories = [],
}: {
  form: ProviderFormState
  setForm: React.Dispatch<React.SetStateAction<ProviderFormState>>
  cities: any[]
  universities: any[]
  serviceCategories?: ServiceCategory[]
  serviceSubcategories?: ServiceSubcategory[]
}) {
  const safeServiceCategories = Array.isArray(serviceCategories) ? serviceCategories : []
  const safeServiceSubcategories = Array.isArray(serviceSubcategories)
    ? serviceSubcategories
    : []
  const safeUniversities: UniversityOption[] = Array.isArray(universities) ? universities : []

  const foodGroceryCategory =
    safeServiceCategories.find(
      (category) =>
        category.slug === 'food-grocery' ||
        category.slug === 'food_grocery' ||
        category.name_en?.toLowerCase() === 'food & grocery'
    ) || null

  const activeSubcategoryOptions = safeServiceSubcategories.filter(
    (subcategory) => subcategory.is_active !== false
  )

  const filteredSubcategoryOptions = activeSubcategoryOptions.filter((subcategory) => {
    if (!foodGroceryCategory) return true
    return Number(subcategory.category_id) === Number(foodGroceryCategory.id)
  })

  const subcategoryOptions =
    filteredSubcategoryOptions.length > 0
      ? filteredSubcategoryOptions
      : activeSubcategoryOptions

  const hasUniversityCityMapping = safeUniversities.some(
    (uni) => getUniversityCityId(uni) !== ''
  )

  const filteredUniversityOptions = safeUniversities.filter((uni) => {
    if (!form.city_id) return true
    if (!hasUniversityCityMapping) return true
    return getUniversityCityId(uni) === String(form.city_id)
  })

  const handleChange = (
    key: keyof ProviderFormState,
    value: string | boolean | string[] | BusinessHourRow[]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const toggleSubcategory = (subcategoryId: string) => {
    const exists = form.subcategory_ids.includes(subcategoryId)

    if (exists) {
      handleChange(
        'subcategory_ids',
        form.subcategory_ids.filter((id) => id !== subcategoryId)
      )
      return
    }

    handleChange('subcategory_ids', [...form.subcategory_ids, subcategoryId])
  }

  const toggleUniversity = (universityId: string) => {
    const exists = form.university_ids.includes(universityId)

    const updatedUniversityIds = exists
      ? form.university_ids.filter((id) => id !== universityId)
      : [...form.university_ids, universityId]

    setForm((prev) => ({
      ...prev,
      university_ids: updatedUniversityIds,
      primary_university_id: updatedUniversityIds[0] || '',
    }))
  }

  const handleCityChange = (cityId: string) => {
    if (!hasUniversityCityMapping) {
      setForm((prev) => ({
        ...prev,
        city_id: cityId,
      }))
      return
    }

    const validUniversityIds = safeUniversities
      .filter((uni) => getUniversityCityId(uni) === String(cityId))
      .map((uni) => getUniversityId(uni))
      .filter(Boolean)

    const updatedUniversityIds = form.university_ids.filter((id) =>
      validUniversityIds.includes(id)
    )

    setForm((prev) => ({
      ...prev,
      city_id: cityId,
      university_ids: updatedUniversityIds,
      primary_university_id: updatedUniversityIds[0] || '',
    }))
  }

  return (
    <div className="space-y-6">
      <SectionBlock
        title="Business identity"
        description=""
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <FieldLabel>Category</FieldLabel>
            <Input
              value={foodGroceryCategory?.name_en || 'Food & Grocery'}
              readOnly
              className="cursor-not-allowed bg-[#f9fafb] text-[#667085]"
            />
          </div>

          <div>
            <FieldLabel>Name EN</FieldLabel>
            <Input
              placeholder="Enter English name"
              value={form.name_en}
              onChange={(e) => handleChange('name_en', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <FieldLabel>Business Subcategories</FieldLabel>
            <MultiSelectSubcategories
              options={subcategoryOptions}
              selectedIds={form.subcategory_ids}
              onToggle={toggleSubcategory}
              placeholder="Select subcategories"
            />
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Availability & closing settings"
        description="Control whether the provider is manually closed and set weekly operating hours."
      >
        <div className="space-y-5">
          <ToggleCard
            title="Manually close provider"
            description="When enabled, the restaurant will still appear to users but it will show as Closed until this option is turned off."
            checked={Boolean(form.is_manually_closed)}
            onChange={(checked) => handleChange('is_manually_closed', checked)}
          />

          <div>
            <FieldLabel optional>Closed note</FieldLabel>
            <Textarea
              placeholder="Example: Temporarily closed today / Closed for maintenance"
              value={form.manual_closed_note}
              onChange={(e) => handleChange('manual_closed_note', e.target.value)}
            />
          </div>

          <div>
            <FieldLabel>Weekly business hours</FieldLabel>
            <BusinessHoursEditor
              value={form.business_hours}
              onChange={(rows) => handleChange('business_hours', rows)}
            />
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Contact & location"
        description=""
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <FieldLabel>Phone Number</FieldLabel>
            <Input
              placeholder="Enter phone number"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          <div>
            <FieldLabel>WhatsApp Number</FieldLabel>
            <Input
              placeholder="Enter WhatsApp number"
              value={form.whatsapp_number}
              onChange={(e) => handleChange('whatsapp_number', e.target.value)}
            />
          </div>

          <div>
            <FieldLabel>City</FieldLabel>
            <Select
              value={form.city_id}
              onChange={(e) => handleCityChange(e.target.value)}
            >
              <option value="">Select city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name_en}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <FieldLabel>Universities</FieldLabel>
            <MultiSelectUniversities
              options={filteredUniversityOptions}
              selectedIds={form.university_ids}
              onToggle={toggleUniversity}
              placeholder={
                filteredUniversityOptions.length > 0
                  ? 'Select universities'
                  : 'No universities available'
              }
            />
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Commercial settings"
        description="Configure promotional fields and discount display."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <FieldLabel>Discount Percentage</FieldLabel>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={form.discount_percentage}
              onChange={(e) => handleChange('discount_percentage', e.target.value)}
            />
          </div>
        </div>
      </SectionBlock>
    </div>
  )
}