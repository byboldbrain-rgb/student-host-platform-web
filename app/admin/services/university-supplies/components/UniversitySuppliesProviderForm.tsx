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

export default function UniversitySuppliesProviderForm() {
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
    category: 'university_supplies',
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

      const res = await fetch('/api/admin/university-supplies/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to create provider')

      router.push(`/admin/services/university-supplies/${data.id}`)
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
                <span>University Supplies</span>
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

              <p className="mt-3 text-sm text-[#667085]">
                Fill the basic provider details to create the University Supplies entry.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[28px] border border-[#e6ebf2] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#101828]">Basic Information</h2>
              <p className="mt-1 text-sm text-[#667085]">
                Create a new University Supplies provider with the minimum required fields.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#344054]">
                  Name EN
                </label>
                <input
                  className="w-full rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe]"
                  placeholder="Enter English name"
                  value={form.name_en}
                  onChange={(e) => handleChange('name_en', e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#344054]">
                  Name AR
                </label>
                <input
                  className="w-full rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe]"
                  placeholder="Enter Arabic name"
                  value={form.name_ar}
                  onChange={(e) => handleChange('name_ar', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-[#344054]">
                    Slug
                  </label>

                  <button
                    type="button"
                    onClick={handleAutoSlug}
                    className="inline-flex items-center rounded-xl border border-[#d0d5dd] bg-white px-3 py-2 text-xs font-semibold text-[#344054] transition hover:bg-[#f9fafb]"
                  >
                    Auto generate
                  </button>
                </div>

                <input
                  className="w-full rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe]"
                  placeholder="provider-slug"
                  value={form.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#344054]">
                  Phone
                </label>
                <input
                  className="w-full rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe]"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#344054]">
                  WhatsApp Number
                </label>
                <input
                  className="w-full rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe]"
                  placeholder="Enter WhatsApp number"
                  value={form.whatsapp_number}
                  onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#344054]">
                  Description EN
                </label>
                <textarea
                  className="min-h-[120px] w-full rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe]"
                  placeholder="Enter English description"
                  value={form.description_en}
                  onChange={(e) => handleChange('description_en', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#344054]">
                  Description AR
                </label>
                <textarea
                  className="min-h-[120px] w-full rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe]"
                  placeholder="Enter Arabic description"
                  value={form.description_ar}
                  onChange={(e) => handleChange('description_ar', e.target.value)}
                />
              </div>
            </div>

            {message ? (
              <div
                className={cn(
                  'mt-6 rounded-2xl border px-4 py-3 text-sm',
                  message.toLowerCase().includes('success')
                    ? 'border-[#abefc6] bg-[#ecfdf3] text-[#067647]'
                    : 'border-[#fedf89] bg-[#fffaeb] text-[#b54708]'
                )}
              >
                {message}
              </div>
            ) : null}
          </section>

          <aside className="h-fit rounded-[28px] border border-[#e6ebf2] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
                Summary
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[#eaecf0] bg-[#fcfcfd] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
                  Service
                </p>
                <p className="mt-2 text-sm font-semibold text-[#101828]">
                  University Supplies
                </p>
              </div>

              <div className="rounded-2xl border border-[#eaecf0] bg-[#fcfcfd] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
                  Provider Name
                </p>
                <p className="mt-2 text-sm font-semibold text-[#101828]">
                  {form.name_en || form.name_ar || 'Not set yet'}
                </p>
              </div>

              <div className="rounded-2xl border border-[#eaecf0] bg-[#fcfcfd] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
                  Slug
                </p>
                <p className="mt-2 break-all text-sm font-semibold text-[#101828]">
                  {form.slug || 'Not set yet'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#175cd3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1849a9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Provider'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}