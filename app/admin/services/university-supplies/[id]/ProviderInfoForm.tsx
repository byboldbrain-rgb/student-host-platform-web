'use client'

import { useMemo } from 'react'

type ServiceCategory = {
  id: string | number
  slug: string
  name_en: string
  name_ar?: string | null
}

type ServiceSubcategory = {
  id: string | number
  category_id: string | number
  slug: string
  name_en: string
  name_ar: string
  is_active?: boolean | null
}

type City = {
  id: string
  name_en: string
  name_ar?: string
}

type University = {
  id: string
  name_en: string
  name_ar?: string
  city_id?: string
}

type ProviderBusinessHour = {
  day_of_week: number
  is_open: boolean
  open_time: string
  close_time: string
}

type ProviderFormState = {
  category_id: string
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
  business_hours: ProviderBusinessHour[]
}

function normalizeId(value: string | number | null | undefined) {
  return String(value ?? '').trim()
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-sm font-medium text-[#344054]">{children}</label>
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#175cd3] ${
        props.className || ''
      }`}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#175cd3] ${
        props.className || ''
      }`}
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#175cd3] ${
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
  onChange: (value: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-[#eaecf0] px-4 py-3">
      <span className="text-sm font-medium text-[#344054]">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? 'bg-[#175cd3]' : 'bg-[#d0d5dd]'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  )
}

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function ProviderInfoForm({
  form,
  setForm,
  cities,
  universities,
  serviceCategories,
  serviceSubcategories,
}: {
  form: ProviderFormState
  setForm: React.Dispatch<React.SetStateAction<ProviderFormState>>
  cities: City[]
  universities: University[]
  serviceCategories: ServiceCategory[]
  serviceSubcategories: ServiceSubcategory[]
}) {
  const normalizedCategoryId = useMemo(() => normalizeId(form.category_id), [form.category_id])

  const filteredSubcategories = useMemo(() => {
    if (!normalizedCategoryId) return []

    return serviceSubcategories
      .filter((sub) => {
        const sameCategory = normalizeId(sub.category_id) === normalizedCategoryId
        const isActive = sub.is_active !== false
        return sameCategory && isActive
      })
      .sort((a, b) => a.name_en.localeCompare(b.name_en))
  }, [serviceSubcategories, normalizedCategoryId])

  const filteredUniversities = useMemo(() => {
    if (!form.city_id) return universities
    return universities.filter((u) => u.city_id === form.city_id)
  }, [universities, form.city_id])

  const toggleSubcategory = (id: string) => {
    setForm((prev) => {
      const exists = prev.subcategory_ids.includes(id)
      return {
        ...prev,
        subcategory_ids: exists
          ? prev.subcategory_ids.filter((x) => x !== id)
          : [...prev.subcategory_ids, id],
      }
    })
  }

  const toggleUniversity = (id: string) => {
    setForm((prev) => {
      const exists = prev.university_ids.includes(id)
      return {
        ...prev,
        university_ids: exists
          ? prev.university_ids.filter((x) => x !== id)
          : [...prev.university_ids, id],
      }
    })
  }

  const handleCategoryChange = (value: string) => {
    const nextCategoryId = normalizeId(value)

    setForm((prev) => {
      const validSubcategoryIds = serviceSubcategories
        .filter(
          (sub) =>
            normalizeId(sub.category_id) === nextCategoryId && sub.is_active !== false
        )
        .map((sub) => normalizeId(sub.id))

      return {
        ...prev,
        category_id: value,
        subcategory_ids: prev.subcategory_ids.filter((id) =>
          validSubcategoryIds.includes(normalizeId(id))
        ),
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* BASIC */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>Category</FieldLabel>
          <Select
            value={form.category_id}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="">Select category</option>
            {serviceCategories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name_en}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <FieldLabel>City</FieldLabel>
          <Select
            value={form.city_id}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, city_id: e.target.value }))
            }
          >
            <option value="">Select city</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name_en}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* SUBCATEGORIES */}
      <div>
        <FieldLabel>Subcategories</FieldLabel>

        {!normalizedCategoryId ? (
          <div className="rounded-xl border border-dashed border-[#d0d5dd] bg-[#f8fafc] px-4 py-3 text-sm text-[#667085]">
            Please select a category first to load its subcategories.
          </div>
        ) : filteredSubcategories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#fda29b] bg-[#fffbfa] px-4 py-3 text-sm text-[#b42318]">
            No subcategories found for the selected category.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredSubcategories.map((sub) => {
              const active = form.subcategory_ids.includes(String(sub.id))
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => toggleSubcategory(String(sub.id))}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    active
                      ? 'bg-[#175cd3] text-white'
                      : 'bg-[#f2f4f7] text-[#344054]'
                  }`}
                >
                  {sub.name_en}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* UNIVERSITIES */}
      <div>
        <FieldLabel>Universities</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {filteredUniversities.map((u) => {
            const active = form.university_ids.includes(String(u.id))
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleUniversity(String(u.id))}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  active
                    ? 'bg-[#175cd3] text-white'
                    : 'bg-[#f2f4f7] text-[#344054]'
                }`}
              >
                {u.name_en}
              </button>
            )
          })}
        </div>
      </div>

      {/* NAMES */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>Name (EN)</FieldLabel>
          <Input
            value={form.name_en}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name_en: e.target.value }))
            }
          />
        </div>

        <div>
          <FieldLabel>Name (AR)</FieldLabel>
          <Input
            value={form.name_ar}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name_ar: e.target.value }))
            }
          />
        </div>
      </div>

      {/* CONTACT */}
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, phone: e.target.value }))
          }
        />
        <Input
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, email: e.target.value }))
          }
        />
      </div>

      {/* BUSINESS HOURS */}
      <div>
        <FieldLabel>Business Hours</FieldLabel>
        <div className="space-y-2">
          {form.business_hours.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-24 text-sm">{days[row.day_of_week]}</span>

              <Toggle
                checked={row.is_open}
                onChange={(val) =>
                  setForm((prev) => {
                    const updated = [...prev.business_hours]
                    updated[index].is_open = val
                    return { ...prev, business_hours: updated }
                  })
                }
                label=""
              />

              {row.is_open && (
                <>
                  <Input
                    type="time"
                    value={row.open_time}
                    onChange={(e) => {
                      const val = e.target.value
                      setForm((prev) => {
                        const updated = [...prev.business_hours]
                        updated[index].open_time = val
                        return { ...prev, business_hours: updated }
                      })
                    }}
                  />
                  <Input
                    type="time"
                    value={row.close_time}
                    onChange={(e) => {
                      const val = e.target.value
                      setForm((prev) => {
                        const updated = [...prev.business_hours]
                        updated[index].close_time = val
                        return { ...prev, business_hours: updated }
                      })
                    }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FLAGS */}
      <div className="grid gap-3 md:grid-cols-3">
        <Toggle
          checked={form.is_active}
          onChange={(v) => setForm((prev) => ({ ...prev, is_active: v }))}
          label="Active"
        />
        <Toggle
          checked={form.is_featured}
          onChange={(v) => setForm((prev) => ({ ...prev, is_featured: v }))}
          label="Featured"
        />
        <Toggle
          checked={form.is_manually_closed}
          onChange={(v) =>
            setForm((prev) => ({ ...prev, is_manually_closed: v }))
          }
          label="Closed"
        />
      </div>

      {form.is_manually_closed && (
        <Textarea
          placeholder="Reason for closing"
          value={form.manual_closed_note}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, manual_closed_note: e.target.value }))
          }
        />
      )}
    </div>
  )
}