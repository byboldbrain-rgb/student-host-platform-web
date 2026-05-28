import Link from 'next/link'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  requirePropertyBookingRequestsAccess,
  isSuperAdmin,
} from '@/src/lib/admin-auth'
import { createAdminInternalBookingRequestAction } from './actions'

export const dynamic = 'force-dynamic'

type SearchParams = {
  q?: string
}

type PropertyRow = {
  id: string
  property_id: string
  title_en: string | null
  title_ar: string | null
  description_en: string | null
  description_ar: string | null
  address_en: string | null
  address_ar: string | null
  broker_id: string | null
  availability_status: string | null
}

function normalizeSearchQuery(value?: string) {
  return String(value || '')
    .trim()
    .replace(/[,%]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 120)
}

function getPropertyDisplayTitle(property: PropertyRow) {
  return property.title_ar || property.title_en || property.property_id
}

function getPropertyMeta(property: PropertyRow) {
  const address = property.address_ar || property.address_en
  const description = property.description_ar || property.description_en

  return [property.property_id, property.availability_status, address, description]
    .filter(Boolean)
    .join(' — ')
}

export default async function NewAdminInternalBookingRequestPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const searchQuery = normalizeSearchQuery(resolvedSearchParams.q)

  const adminContext = await requirePropertyBookingRequestsAccess()
  const supabase = createAdminClient()
  const admin = adminContext.admin

  let query = supabase
    .from('properties')
    .select(`
      id,
      property_id,
      title_en,
      title_ar,
      description_en,
      description_ar,
      address_en,
      address_ar,
      broker_id,
      availability_status
    `)
    .eq('is_active', true)
    .eq('admin_status', 'published')
    .neq('availability_status', 'inactive')
    .order('created_at', { ascending: false })
    .limit(250)

  if (!isSuperAdmin(admin)) {
    if (!admin.broker_id) {
      throw new Error('Editor account is missing broker assignment')
    }

    query = query.eq('broker_id', admin.broker_id)
  }

  if (searchQuery) {
    const pattern = `%${searchQuery}%`

    query = query.or(
      [
        `property_id.ilike.${pattern}`,
        `title_en.ilike.${pattern}`,
        `title_ar.ilike.${pattern}`,
        `description_en.ilike.${pattern}`,
        `description_ar.ilike.${pattern}`,
        `address_en.ilike.${pattern}`,
        `address_ar.ilike.${pattern}`,
      ].join(',')
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  const properties = (data || []) as PropertyRow[]

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#054aff]">
              Navienty Admin
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Create internal booking request
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              This creates a normal booking request, but its source will be Admin.
              Another Admin must approve it.
            </p>
          </div>

          <Link
            href="/admin/properties/booking-requests"
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#054aff]/40 hover:text-[#054aff]"
          >
            Back to requests
          </Link>
        </div>

        <form
          action="/admin/properties/booking-requests/new"
          method="get"
          className="mb-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <label className="mb-2 block text-sm font-bold text-slate-800">
            Search property
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              name="q"
              defaultValue={searchQuery}
              placeholder="Search by apartment name, Property ID, address, or description..."
              className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10"
            />

            <button
              type="submit"
              className="h-12 rounded-full bg-[#054aff] px-6 text-sm font-black text-white shadow-[0_12px_26px_rgba(5,74,255,0.22)] transition hover:opacity-95"
            >
              Search
            </button>

            {searchQuery ? (
              <Link
                href="/admin/properties/booking-requests/new"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition hover:border-[#054aff]/40 hover:text-[#054aff]"
              >
                Clear
              </Link>
            ) : null}
          </div>

          <p className="mt-3 text-xs font-medium text-slate-500">
            {searchQuery
              ? `Showing ${properties.length} result(s) for "${searchQuery}".`
              : `Showing latest ${properties.length} available published properties.`}
          </p>
        </form>

        <form
          action={createAdminInternalBookingRequestAction}
          className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Property
              </label>

              <select
                name="property_id"
                required
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10"
              >
                <option value="">
                  {properties.length > 0
                    ? 'Select property'
                    : searchQuery
                      ? 'No properties found for this search'
                      : 'No available properties found'}
                </option>

                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {getPropertyDisplayTitle(property)} — {getPropertyMeta(property)}
                  </option>
                ))}
              </select>

              {properties.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                  No matching properties found. Try searching with another name,
                  Property ID, or address.
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Requested option
              </label>
              <select
                name="requested_option_code"
                required
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10"
              >
                <option value="">Select option</option>
                <option value="single_room">Single Room</option>
                <option value="double_room">Double Room</option>
                <option value="triple_room">Triple Room</option>
                <option value="full_apartment">Full Apartment</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Customer name
                </label>
                <input
                  name="customer_name"
                  required
                  placeholder="Student full name"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Phone
                </label>
                <input
                  name="customer_phone"
                  placeholder="01xxxxxxxxx"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  WhatsApp
                </label>
                <input
                  name="customer_whatsapp"
                  placeholder="01xxxxxxxxx"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Email
                </label>
                <input
                  name="customer_email"
                  type="email"
                  placeholder="student@email.com"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Preferred start date
                </label>
                <input
                  name="preferred_start_date"
                  type="date"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Preferred end date
                </label>
                <input
                  name="preferred_end_date"
                  type="date"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Internal notes
              </label>
              <textarea
                name="admin_internal_notes"
                rows={4}
                placeholder="Notes for the approving admin..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10"
              />
            </div>

            <button
              type="submit"
              disabled={properties.length === 0}
              className="min-h-[52px] rounded-full bg-[#054aff] px-6 text-sm font-black text-white shadow-[0_16px_34px_rgba(5,74,255,0.28)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              Create booking request
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}