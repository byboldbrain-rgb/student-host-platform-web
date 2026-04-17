import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import { requirePropertyReviewerAccess } from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'
import {
  approvePropertyAction,
  rejectPropertyAction,
  archivePropertyAction,
} from './actions'

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-[18px] border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_14px_30px_rgba(37,99,235,0.35)]'

const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[18px] border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-[#222222] shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-400 hover:bg-[#fafafa] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]'

type PropertyImage = {
  image_url?: string | null
  is_cover?: boolean | null
  sort_order?: number | null
}

type ReviewProperty = {
  id: string
  property_id: string
  title_en?: string | null
  title_ar?: string | null
  address_en?: string | null
  address_ar?: string | null
  price_egp?: number | null
  rental_duration?: string | null
  availability_status?: string | null
  admin_status?: string | null
  created_at?: string | null
  property_images?: PropertyImage[] | null
}

function formatDate(value?: string | null) {
  if (!value) return '—'

  try {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function formatPrice(value?: number | null) {
  if (typeof value !== 'number') return '—'

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${value} EGP`
  }
}

function getRentalDurationLabel(value?: string | null) {
  if (value === 'daily') return '/ day'
  if (value === 'monthly') return '/ month'
  return ''
}

function getAvailabilityBadgeClass(value?: string | null) {
  const normalized = (value || '').toLowerCase()

  if (normalized === 'reserved') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (normalized === 'available') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (normalized === 'unavailable') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function getStatusLabel(value?: string | null) {
  if (!value) return 'Unknown'
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getPropertyImage(property: ReviewProperty) {
  const images = Array.isArray(property.property_images)
    ? [...property.property_images].sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
      )
    : []

  return (
    images.find((image) => image.is_cover)?.image_url ||
    images[0]?.image_url ||
    'https://via.placeholder.com/1200x800?text=No+Image'
  )
}

export default async function ReviewPage() {
  await requirePropertyReviewerAccess()
  const supabase = await createClient()

  const { data: properties, error } = await supabase
    .from('properties')
    .select(`
      id,
      property_id,
      title_en,
      title_ar,
      address_en,
      address_ar,
      price_egp,
      rental_duration,
      availability_status,
      admin_status,
      created_at,
      property_images (
        image_url,
        is_cover,
        sort_order
      )
    `)
    .eq('admin_status', 'pending_review')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load review queue: ${error.message}`)
  }

  const typedProperties = (properties || []) as ReviewProperty[]

  return (
    <main className="min-h-screen bg-[#fbfbfb] text-gray-700">
      <header className="sticky top-0 z-40 h-[130px] border-b border-gray-200/80 bg-[#F5F7F9] backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/properties">
              <img
                src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
                alt="Navienty"
                className="w-[130px]"
              />
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/admin/properties/new" className={primaryButtonClass}>
              Add Property
            </Link>

            <Link href="/admin/properties/review" className={secondaryButtonClass}>
              Review Queue
            </Link>

            <Link href="/admin/properties/admins" className={secondaryButtonClass}>
              Property Admins
            </Link>

            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#111827]">
              Review Queue
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Review submitted properties and decide whether to publish, reject,
              or archive them.
            </p>
          </div>

          <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            Pending: {typedProperties.length}
          </div>
        </div>

        {typedProperties.length > 0 ? (
          <div className="grid gap-6">
            {typedProperties.map((property) => {
              const propertyTitle =
                property.title_en || property.title_ar || 'Untitled Property'

              const propertyAddress =
                property.address_en || property.address_ar || 'No address provided'

              const propertyImage = getPropertyImage(property)

              return (
                <section
                  key={property.id}
                  className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
                >
                  <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="relative min-h-[240px] bg-gray-100">
                      <img
                        src={propertyImage}
                        alt={propertyTitle}
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-white/95 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                          {getStatusLabel(property.admin_status)}
                        </span>

                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${getAvailabilityBadgeClass(
                            property.availability_status
                          )}`}
                        >
                          {getStatusLabel(property.availability_status)}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 md:p-6 lg:p-7">
                      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
                            {propertyTitle}
                          </h2>

                          <p className="mt-2 break-all text-sm text-gray-500">
                            Property ID: {property.property_id}
                          </p>

                          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
                            {propertyAddress}
                          </p>
                        </div>

                        <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:min-w-[340px]">
                          <div className="rounded-2xl border border-gray-200 bg-[#fafafa] px-4 py-3">
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Price
                            </div>
                            <div className="mt-1 text-base font-semibold text-[#111827]">
                              {formatPrice(property.price_egp)}
                              <span className="ml-1 text-sm font-medium text-gray-500">
                                {getRentalDurationLabel(property.rental_duration)}
                              </span>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-gray-200 bg-[#fafafa] px-4 py-3">
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Submitted At
                            </div>
                            <div className="mt-1 text-sm font-semibold text-[#111827]">
                              {formatDate(property.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-5">
                        <Link
                          href={`/admin/properties/review/${property.property_id}`}
                          className="inline-flex items-center justify-center rounded-[18px] border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 shadow-[0_8px_20px_rgba(79,70,229,0.12)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-indigo-100"
                        >
                          Preview Full Property
                        </Link>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-3">
                        <form
                          action={approvePropertyAction}
                          className="rounded-[24px] border border-emerald-200 bg-emerald-50/50 p-4"
                        >
                          <input type="hidden" name="property_id" value={property.id} />

                          <div className="mb-3">
                            <h3 className="text-sm font-semibold text-emerald-800">
                              Approve & Publish
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-emerald-700/80">
                              This will publish the property on the platform and make it visible to users.
                            </p>
                          </div>

                          <textarea
                            name="review_notes"
                            rows={5}
                            placeholder="Optional review notes..."
                            className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-emerald-400"
                          />

                          <button
                            type="submit"
                            className="mt-4 inline-flex w-full items-center justify-center rounded-[18px] bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700"
                          >
                            Approve & Publish
                          </button>
                        </form>

                        <form
                          action={rejectPropertyAction}
                          className="rounded-[24px] border border-rose-200 bg-rose-50/50 p-4"
                        >
                          <input type="hidden" name="property_id" value={property.id} />

                          <div className="mb-3">
                            <h3 className="text-sm font-semibold text-rose-800">
                              Reject
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-rose-700/80">
                              Reject this submission. It will not be visible on the platform.
                            </p>
                          </div>

                          <textarea
                            name="review_notes"
                            rows={5}
                            placeholder="Why was this property rejected?"
                            className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-rose-400"
                          />

                          <button
                            type="submit"
                            className="mt-4 inline-flex w-full items-center justify-center rounded-[18px] bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(225,29,72,0.20)] transition hover:bg-rose-700"
                          >
                            Reject Property
                          </button>
                        </form>

                        <form
                          action={archivePropertyAction}
                          className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                        >
                          <input type="hidden" name="property_id" value={property.id} />

                          <div className="mb-3">
                            <h3 className="text-sm font-semibold text-slate-800">
                              Archive
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-slate-600">
                              Move this property out of the active review flow without publishing it.
                            </p>
                          </div>

                          <textarea
                            name="review_notes"
                            rows={5}
                            placeholder="Optional archive notes..."
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-slate-400"
                          />

                          <button
                            type="submit"
                            className="mt-4 inline-flex w-full items-center justify-center rounded-[18px] bg-slate-800 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition hover:bg-slate-900"
                          >
                            Archive Property
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-gray-300 bg-white px-6 py-24 text-center shadow-sm">
            <div className="mx-auto max-w-xl">
              <h2 className="text-2xl font-semibold text-[#111827]">
                No properties pending review
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                Once brokers or users submit new properties, they will appear here
                for approval, rejection, or archiving.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}