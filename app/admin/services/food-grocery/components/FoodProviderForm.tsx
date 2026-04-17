'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function FoodProviderForm() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    name_en: '',
    name_ar: '',
    slug: '',
    phone: '',
    whatsapp_number: '',
    description_en: '',
    description_ar: '',
    category: 'restaurants',
  })

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (message) setMessage('')
  }

  const handleAutoSlug = () => {
    const source = form.name_en || form.name_ar
    if (!source.trim()) return
    handleChange('slug', slugify(source))
  }

  const completedFields = useMemo(() => {
    const fields = [
      form.name_en,
      form.name_ar,
      form.slug,
      form.phone,
      form.whatsapp_number,
      form.description_en,
      form.description_ar,
      form.category,
    ]

    return fields.filter((value) => String(value).trim()).length
  }, [form])

  const progress = Math.round((completedFields / 8) * 100)

  const handleSubmit = async () => {
    if (!form.name_en.trim() || !form.phone.trim()) {
      setMessage('Name EN and Phone are required.')
      return
    }

    try {
      setLoading(true)
      setMessage('')

      const res = await fetch('/api/admin/food-grocery/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to create provider')

      router.push(`/admin/services/food-grocery/${data.id}`)
    } catch (err: any) {
      setMessage(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 rounded-[28px] border border-[#e6ebf2] bg-white px-6 py-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:px-8">
          <div className="mb-5 flex items-center justify-end">
            <AdminLogoutButton />
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[#667085]">
                <span>Food & Grocery</span>
                <span>•</span>
                <span>Create Provider</span>
              </div>

              <h1 className="truncate text-[28px] font-semibold tracking-[-0.03em] text-[#101828] md:text-[36px]">
                {form.name_en || form.name_ar || 'New Provider'}
              </h1>
            </div>

            <div className="w-full max-w-[320px] rounded-2xl border border-[#e6ebf2] bg-[#f8fafc] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-[#344054]">Completion</span>
                <span className="text-sm font-semibold text-[#101828]">{progress}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[#e4e7ec]">
                <div
                  className="h-full rounded-full bg-[#175cd3] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[28px] border border-[#e6ebf2] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] lg:sticky lg:top-6">
            <div className="mb-4 px-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
                Setup Flow
              </p>
            </div>

            <div className="space-y-2">
              {[
                {
                  id: 1,
                  title: 'Basic Info',
                  description: 'Provider name, slug, and type.',
                  active: true,
                  done: Boolean(form.name_en || form.name_ar),
                },
                {
                  id: 2,
                  title: 'Contact',
                  description: 'Phone and WhatsApp details.',
                  active: false,
                  done: Boolean(form.phone || form.whatsapp_number),
                },
                {
                  id: 3,
                  title: 'Descriptions',
                  description: 'English and Arabic summary.',
                  active: false,
                  done: Boolean(form.description_en || form.description_ar),
                },
                {
                  id: 4,
                  title: 'Next Step',
                  description: 'After create, continue in editor.',
                  active: false,
                  done: false,
                },
              ].map((step) => {
                const status = step.active ? 'active' : step.done ? 'done' : 'upcoming'

                return (
                  <div
                    key={step.id}
                    className={cn(
                      'w-full rounded-2xl border px-4 py-4 text-left transition-all',
                      status === 'active' &&
                        'border-[#bfd6ff] bg-[#f5f9ff] shadow-[inset_0_0_0_1px_rgba(23,92,211,0.04)]',
                      status === 'done' &&
                        'border-[#e4e7ec] bg-white hover:border-[#d0d5dd] hover:bg-[#f9fafb]',
                      status === 'upcoming' &&
                        'border-transparent bg-white hover:border-[#eaecf0] hover:bg-[#f9fafb]'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                          status === 'active' && 'bg-[#175cd3] text-white',
                          status === 'done' && 'bg-[#ecfdf3] text-[#027a48]',
                          status === 'upcoming' && 'bg-[#f2f4f7] text-[#667085]'
                        )}
                      >
                        {status === 'done' ? '✓' : step.id}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-[#101828]">
                            {step.title}
                          </p>
                          {status === 'active' ? (
                            <span className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#175cd3]">
                              Current
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-[#667085]">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-5">
              <p className="text-sm font-medium text-[#175cd3]">Provider Setup</p>
              <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.03em] text-[#101828]">
                Basic Information
              </h2>
            </div>

            <section className="rounded-[28px] border border-[#e6ebf2] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-6">
              <div className="space-y-8">
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-[#101828]">Basic Info</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Name EN"
                      required
                      placeholder="Enter English name"
                      value={form.name_en}
                      onChange={(value) => handleChange('name_en', value)}
                    />

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#344054]">
                        Slug
                      </label>

                      <div className="flex gap-2">
                        <input
                          value={form.slug}
                          onChange={(e) => handleChange('slug', e.target.value)}
                          placeholder="provider-slug"
                          className="h-12 w-full rounded-xl border border-[#d0d5dd] bg-white px-4 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#84adff] focus:ring-4 focus:ring-[#dbeafe]"
                        />

                        <button
                          type="button"
                          onClick={handleAutoSlug}
                          className="inline-flex h-12 items-center justify-center rounded-xl border border-[#d0d5dd] bg-white px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#f9fafb]"
                        >
                          Generate
                        </button>
                      </div>
                    </div>

                    <Field
                      label="Name AR"
                      placeholder="ادخل الاسم بالعربي"
                      value={form.name_ar}
                      onChange={(value) => handleChange('name_ar', value)}
                    />

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#344054]">
                        Category
                      </label>

                      <select
                        value={form.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="h-12 w-full rounded-xl border border-[#d0d5dd] bg-white px-4 text-sm text-[#101828] outline-none transition focus:border-[#84adff] focus:ring-4 focus:ring-[#dbeafe]"
                      >
                        <option value="restaurants">Restaurant</option>
                        <option value="groceries">Grocery</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-[#eaecf0]" />

                <div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Phone"
                      required
                      placeholder="e.g. 01012345678"
                      value={form.phone}
                      onChange={(value) => handleChange('phone', value)}
                    />

                    <Field
                      label="WhatsApp"
                      placeholder="e.g. 01012345678"
                      value={form.whatsapp_number}
                      onChange={(value) => handleChange('whatsapp_number', value)}
                    />
                  </div>
                </div>

                <div className="h-px bg-[#eaecf0]" />

                <div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextAreaField
                      label="Description EN"
                      value={form.description_en}
                      onChange={(value) => handleChange('description_en', value)}
                      placeholder="Write a short English description..."
                    />

                    <TextAreaField
                      label="Description AR"
                      value={form.description_ar}
                      onChange={(value) => handleChange('description_ar', value)}
                      placeholder="اكتب وصفًا عربيًا مختصرًا..."
                    />
                  </div>
                </div>
              </div>
            </section>

            {message ? (
              <div
                className={cn(
                  'mt-5 rounded-2xl border px-4 py-3 text-sm',
                  message.toLowerCase().includes('success') ||
                    message.toLowerCase().includes('created')
                    ? 'border-[#abefc6] bg-[#ecfdf3] text-[#067647]'
                    : 'border-[#fedf89] bg-[#fffaeb] text-[#b54708]'
                )}
              >
                {message}
              </div>
            ) : null}

            <div className="mt-6 rounded-[24px] border border-[#e6ebf2] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-xl bg-[#175cd3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1849a9] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Provider'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#344054]">
        {label}
        {required ? <span className="ml-1 text-[#d92d20]">*</span> : null}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-[#d0d5dd] bg-white px-4 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#84adff] focus:ring-4 focus:ring-[#dbeafe]"
      />
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#344054]">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="min-h-[140px] w-full rounded-xl border border-[#d0d5dd] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#84adff] focus:ring-4 focus:ring-[#dbeafe]"
      />
    </div>
  )
}