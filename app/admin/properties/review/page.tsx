import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import { requirePropertyReviewerAccess } from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'
import { approvePropertyAction, rejectPropertyAction } from './actions'

const primaryButtonClass =
  'inline-flex min-h-[52px] items-center justify-center rounded-full border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_12px_26px_rgba(37,99,235,0.28)]'

const secondaryButtonClass =
  'inline-flex min-h-[52px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-slate-50'

const inputClass =
  'w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

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
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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



function getPropertyImage(property: ReviewProperty) {
  const images = Array.isArray(property.property_images)
    ? [...property.property_images].sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
      )
    : []

  return (
    images.find((image) => image.is_cover)?.image_url ||
    images[0]?.image_url ||
    null
  )
}

function BrandLogo() {
  return (
    <Link href="/admin" className="navienty-logo" aria-label="Navienty admin home">
      <img
        src="https://i.ibb.co/p6CBgjz0/Navienty-13.png"
        alt="Navienty icon"
        className="navienty-logo-icon"
      />
      <span className="navienty-logo-text-wrap">
        <img
          src="https://i.ibb.co/kVC7z9x7/Navienty-15.png"
          alt="Navienty"
          className="navienty-logo-text"
        />
      </span>
    </Link>
  )
}

function MobileBottomNavItem({
  href,
  label,
  isPrimary = false,
}: {
  href: string
  label: string
  isPrimary?: boolean
}) {
  return (
    <Link
      href={href}
      className={[
        'flex min-h-[52px] items-center justify-center rounded-2xl px-3 text-center text-[11px] font-semibold leading-tight transition-all duration-200',
        isPrimary
          ? 'border border-blue-600 bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]'
          : 'border border-gray-200 bg-white text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.05)]',
      ].join(' ')}
    >
      {label}
    </Link>
  )
}

function GridIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function PropertyImagePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
      <div className="flex flex-col items-center justify-center text-slate-500">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 shadow-sm">
          <GridIcon />
        </div>
        <p className="text-sm font-medium">No image available</p>
      </div>
    </div>
  )
}

function ReviewCardCover({
  property,
  propertyTitle,
}: {
  property: ReviewProperty
  propertyTitle: string
}) {
  const propertyImage = getPropertyImage(property)

  return (
    <div className="relative h-56 overflow-hidden bg-slate-100">
      {propertyImage ? (
        <img
          src={propertyImage}
          alt={propertyTitle}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <PropertyImagePlaceholder />
      )}

      <div className="absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-4"></div>
    </div>
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
    <>
      <style>{`
        .navienty-logo {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          overflow: visible;
          transform: none;
          margin-top: -10px;
        }

        .navienty-logo-icon {
          width: 56px;
          height: 56px;
          object-fit: contain;
          flex-shrink: 0;
          display: block;
        }

        .navienty-logo-text-wrap {
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateX(-6px);
          transition:
            max-width 0.35s ease,
            opacity 0.25s ease,
            transform 0.35s ease;
          display: flex;
          align-items: center;
        }

        .navienty-logo:hover .navienty-logo-text-wrap,
        .navienty-logo:focus-visible .navienty-logo-text-wrap {
          max-width: 120px;
          opacity: 1;
          transform: translateX(0);
        }

        .navienty-logo-text {
          width: 112px;
          min-width: 112px;
          height: auto;
          object-fit: contain;
          display: block;
          transform: translateY(-2px);
        }

        .desktop-header-nav-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #20212a;
          text-decoration: none;
          font-size: 15px;
          line-height: 1;
          border: none;
          background: none;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          padding: 8px 0;
          transition: color 0.3s ease;
        }

        .desktop-header-nav-button::before {
          margin-left: auto;
        }

        .desktop-header-nav-button::after,
        .desktop-header-nav-button::before {
          content: '';
          width: 0%;
          height: 2px;
          background: #000000;
          display: block;
          transition: 0.5s;
          position: absolute;
          left: 0;
        }

        .desktop-header-nav-button::before {
          top: 0;
        }

        .desktop-header-nav-button::after {
          bottom: 0;
        }

        .desktop-header-nav-button:hover::after,
        .desktop-header-nav-button:hover::before,
        .desktop-header-nav-button:focus-visible::after,
        .desktop-header-nav-button:focus-visible::before {
          width: 100%;
        }

        .desktop-header-nav-button-active {
          color: #054aff;
        }

        .desktop-header-nav-button-inactive {
          color: #20212a;
        }

        .desktop-header-nav-button-inactive:hover,
        .desktop-header-nav-button-inactive:focus-visible {
          color: #054aff;
        }

        .property-preview-button {
          display: inline-flex;
          width: 100%;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 9999px;
          background-color: #155dfc;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #ffffff !important;
          text-decoration: none;
          transition:
            background-color 0.2s ease,
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .property-preview-button:hover,
        .property-preview-button:focus-visible {
          background-color: #0f4fe0;
          color: #ffffff !important;
        }

        .property-preview-button svg {
          color: #ffffff !important;
        }

        @media (max-width: 768px) {
          .navienty-logo {
            transform: none;
            margin-top: 0;
          }

          .navienty-logo-icon {
            width: 42px;
            height: 42px;
          }

          .navienty-logo-text-wrap {
            display: none;
          }

          .mobile-header-inner {
            justify-content: center !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef4ff,_#f8fafc_45%,_#f8fafc_100%)] pb-28 text-slate-700 md:pb-0">
        <header className="sticky top-0 z-[110] bg-[#f5f7f9]">
          <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
            <BrandLogo />

            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/admin/properties/new"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Add Property
              </Link>

              <Link
                href="/admin/cities/new"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Add City
              </Link>

              <Link
                href="/admin/universities/new"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Add University
              </Link>

              <Link
                href="/admin/brokers/new"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Add Broker
              </Link>

              <Link
                href="/admin/properties/review"
                className="desktop-header-nav-button desktop-header-nav-button-active"
              >
                Review Queue
              </Link>

              <Link
                href="/admin/properties/admins"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Property Admins
              </Link>

              <AdminLogoutButton />
            </div>

            <div className="md:hidden">
              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1600px] px-4 pb-8 pt-6 md:px-6 md:pt-8 lg:px-8">
          {typedProperties.length > 0 ? (
            <section className="rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
                  {typedProperties.map((property) => {
                    const propertyTitle =
                      property.title_en || property.title_ar || 'Untitled Property'

                    const propertyAddress =
                      property.address_en || property.address_ar || 'No address provided'

                    return (
                      <div
                        key={property.id}
                        className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.10)]"
                      >
                        <ReviewCardCover
                          property={property}
                          propertyTitle={propertyTitle}
                        />

                        <div className="p-5">
                          <h2 className="line-clamp-2 text-lg font-semibold text-slate-900">
                            {propertyTitle}
                          </h2>

                          <div className="mt-5">
                            <Link
                              href={`/admin/properties/review/${property.property_id}`}
                              className="property-preview-button"
                            >
                              <EyeIcon />
                              <span className="text-white">Preview Full Property</span>
                            </Link>
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-3">
                            <form action={approvePropertyAction} className="w-full">
                              <input type="hidden" name="property_id" value={property.id} />

                              <button
                                type="submit"
                                className="inline-flex w-full items-center justify-center rounded-full border border-emerald-600 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:border-emerald-700 hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                            </form>

                            <form action={rejectPropertyAction} className="w-full">
                              <input type="hidden" name="property_id" value={property.id} />

                              <button
                                type="submit"
                                className="inline-flex w-full items-center justify-center rounded-full border border-red-600 bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:border-red-700 hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <GridIcon />
              </div>

              <h2 className="text-lg font-semibold text-slate-900">
                No properties pending review
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Once brokers or users submit new properties, they will appear here
                for approval or rejection.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href="/admin/properties/new" className={primaryButtonClass}>
                  Add Property
                </Link>

                <Link href="/admin/properties" className={secondaryButtonClass}>
                  Back to Properties
                </Link>
              </div>
            </section>
          )}
        </section>

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-[640px] grid-cols-3 gap-2">
            <MobileBottomNavItem
              href="/admin/properties/new"
              label="Add Property"
            />
            <MobileBottomNavItem href="/admin/cities/new" label="Add City" />
            <MobileBottomNavItem
              href="/admin/universities/new"
              label="Add University"
            />
            <MobileBottomNavItem href="/admin/brokers/new" label="Add Broker" />
            <MobileBottomNavItem
              href="/admin/properties/review"
              label="Review Queue"
              isPrimary
            />
            <MobileBottomNavItem
              href="/admin/properties/admins"
              label="Property Admins"
            />
          </div>
        </nav>
      </main>
    </>
  )
}