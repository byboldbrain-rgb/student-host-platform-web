import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  requirePropertiesSectionAccess,
  isSuperAdmin,
  canReceivePropertyBookingRequests,
} from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

type SearchParams = Promise<{
  search?: string
  owner_number?: string
}>

type Property = {
  id: string
  property_id: string
  title_en?: string | null
  title_ar?: string | null
  price_egp?: number | null
  availability_status?:
    | 'available'
    | 'partially_reserved'
    | 'fully_reserved'
    | 'inactive'
    | null
  admin_status:
    | 'draft'
    | 'pending_review'
    | 'published'
    | 'rejected'
    | 'archived'
  is_active: boolean
  created_at?: string
  broker_id: string | null
  bedrooms_count?: number | null
  bathrooms_count?: number | null
  beds_count?: number | null
  guests_count?: number | null
  owner_id: string | null
  owner_name: string | null
  owner_phone: string | null
  owner_whatsapp: string | null
  owner_email: string | null
  owner_national_id: string | null
}

type PropertyImage = {
  id: string
  property_id_ref: string
  image_url: string
  is_cover: boolean
  sort_order: number
  created_at?: string
}

type BookingRequestNotification = {
  id: string
}

function getAdminDisplayName(admin: any) {
  const possibleName =
    admin?.full_name ||
    admin?.name ||
    admin?.broker_name ||
    admin?.display_name ||
    admin?.email

  if (!possibleName || typeof possibleName !== 'string') {
    return 'Broker'
  }

  if (possibleName.includes('@')) {
    return possibleName.split('@')[0]
  }

  return possibleName
}

function BrandLogo() {
  return (
    <Link
      href="/admin/properties"
      className="navienty-logo"
      aria-label="Navienty admin home"
    >
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

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 10h.01" />
      <path d="M15 10h.01" />
      <path d="M9 14h.01" />
      <path d="M15 14h.01" />
    </svg>
  )
}

function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null

  return (
    <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-[5px] text-[10px] font-bold leading-none text-white shadow-md">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function EmptyState({
  searchTerm,
}: {
  searchTerm?: string | null
}) {
  return (
    <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <GridIcon />
      </div>

      <h3 className="text-lg font-semibold text-slate-900">No properties found</h3>
      <p className="mt-2 text-sm text-slate-500">
        {searchTerm
          ? `No properties found for: ${searchTerm}.`
          : 'There are no properties available for this account right now.'}
      </p>
    </div>
  )
}

function PropertyImagePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
      <div className="flex flex-col items-center justify-center text-slate-500">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 shadow-sm">
          <BuildingIcon />
        </div>
        <p className="text-sm font-medium">No image available</p>
      </div>
    </div>
  )
}

function PropertySearchForm({
  searchTerm,
}: {
  searchTerm: string
}) {
  return (
    <section className="mb-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.05)] md:p-5">
      <form
        action="/admin/properties"
        method="GET"
        className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]"
      >
        <label className="relative block">
          <span className="mb-2 block text-sm font-semibold text-slate-900">
            Search Properties
          </span>

          <span className="pointer-events-none absolute bottom-[13px] left-4 text-slate-400">
            <SearchIcon />
          </span>

          <input
            type="text"
            name="search"
            defaultValue={searchTerm}
            placeholder="Search by property name, Property ID, owner phone, WhatsApp, national ID, email, or owner ID"
            className="h-[52px] w-full rounded-full border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#155dfc] focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#155dfc] px-6 text-sm font-semibold text-white transition hover:bg-[#0f4fe0] md:w-auto"
          >
            <SearchIcon />
            Search
          </button>
        </div>

        {searchTerm ? (
          <div className="flex items-end">
            <Link
              href="/admin/properties"
              className="inline-flex h-[52px] w-full items-center justify-center rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:border-slate-900 hover:bg-slate-50 md:w-auto"
            >
              Reset
            </Link>
          </div>
        ) : null}
      </form>
    </section>
  )
}

function getCoverImage(
  propertyId: string,
  imagesMap: Record<string, PropertyImage[]>
) {
  const propertyImages = imagesMap[propertyId] || []

  if (propertyImages.length === 0) {
    return null
  }

  const sortedImages = [...propertyImages].sort((a, b) => {
    if (a.is_cover !== b.is_cover) {
      return Number(b.is_cover) - Number(a.is_cover)
    }

    if ((a.sort_order ?? 0) !== (b.sort_order ?? 0)) {
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    }

    return 0
  })

  return sortedImages[0]?.image_url || null
}

function normalizeSearchValue(value?: string | null) {
  return (value || '').trim().toLowerCase()
}

function normalizeDigits(value?: string | null) {
  return (value || '').replace(/\D/g, '')
}

function propertyMatchesSearch(property: Property, searchTerm: string) {
  const term = normalizeSearchValue(searchTerm)

  if (!term) return true

  const digitTerm = normalizeDigits(term)

  const searchableValues = [
    property.property_id,
    property.title_en,
    property.title_ar,
    property.owner_id,
    property.owner_name,
    property.owner_phone,
    property.owner_whatsapp,
    property.owner_email,
    property.owner_national_id,
  ]

  return searchableValues.some((value) => {
    const normalizedValue = normalizeSearchValue(value)
    const normalizedDigits = normalizeDigits(value)

    if (normalizedValue.includes(term)) {
      return true
    }

    if (digitTerm && normalizedDigits.includes(digitTerm)) {
      return true
    }

    return false
  })
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const resolvedSearchParams = await searchParams
  const searchTerm =
    resolvedSearchParams?.search?.trim() ||
    resolvedSearchParams?.owner_number?.trim() ||
    ''

  const adminContext = await requirePropertiesSectionAccess()
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  const admin = adminContext.admin

  getAdminDisplayName(admin)

  if (admin.role === 'property_adder') {
    redirect('/admin/properties/new')
  }

  if (admin.role === 'property_receiver') {
    redirect('/admin/properties/booking-requests')
  }

  let query = adminSupabase
    .from('properties')
    .select(`
      id,
      property_id,
      title_en,
      title_ar,
      price_egp,
      availability_status,
      admin_status,
      is_active,
      created_at,
      broker_id,
      bedrooms_count,
      bathrooms_count,
      beds_count,
      guests_count,
      owner_id,
      property_owners (
        id,
        full_name,
        phone_number,
        whatsapp_number,
        email,
        national_id
      )
    `)
    .order('created_at', { ascending: false })

  if (!isSuperAdmin(admin)) {
    if (!admin.broker_id) {
      throw new Error('Editor account is missing broker assignment')
    }

    query = query.eq('broker_id', admin.broker_id)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  const allProperties: Property[] = (data || []).map((property: any) => {
    const owner = Array.isArray(property.property_owners)
      ? property.property_owners[0]
      : property.property_owners

    return {
      id: property.id,
      property_id: property.property_id,
      title_en: property.title_en,
      title_ar: property.title_ar,
      price_egp: property.price_egp,
      availability_status: property.availability_status,
      admin_status: property.admin_status,
      is_active: property.is_active,
      created_at: property.created_at,
      broker_id: property.broker_id,
      bedrooms_count: property.bedrooms_count,
      bathrooms_count: property.bathrooms_count,
      beds_count: property.beds_count,
      guests_count: property.guests_count,
      owner_id: property.owner_id ?? owner?.id ?? null,
      owner_name: owner?.full_name ?? null,
      owner_phone: owner?.phone_number ?? null,
      owner_whatsapp: owner?.whatsapp_number ?? null,
      owner_email: owner?.email ?? null,
      owner_national_id: owner?.national_id ?? null,
    }
  })

  const properties = allProperties.filter((property) =>
    propertyMatchesSearch(property, searchTerm)
  )

  let propertyImagesMap: Record<string, PropertyImage[]> = {}

  if (properties.length > 0) {
    const propertyIds = properties.map((property) => property.id)

    const { data: imagesData, error: imagesError } = await supabase
      .from('property_images')
      .select(`
        id,
        property_id_ref,
        image_url,
        is_cover,
        sort_order,
        created_at
      `)
      .in('property_id_ref', propertyIds)
      .order('is_cover', { ascending: false })
      .order('sort_order', { ascending: true })

    if (imagesError) {
      throw new Error(imagesError.message)
    }

    const images = (imagesData || []) as PropertyImage[]

    propertyImagesMap = images.reduce<Record<string, PropertyImage[]>>((acc, image) => {
      if (!acc[image.property_id_ref]) {
        acc[image.property_id_ref] = []
      }

      acc[image.property_id_ref].push(image)
      return acc
    }, {})
  }

  let newReservationsCount = 0

  if (canReceivePropertyBookingRequests(admin)) {
    let bookingRequestsQuery = adminSupabase
      .from('property_booking_requests')
      .select(`
        id
      `)
      .in('status', ['new', 'contacted', 'in_progress'])
      .order('created_at', { ascending: false })

    if (!isSuperAdmin(admin)) {
      if (!admin.broker_id) {
        throw new Error('Editor account is missing broker assignment')
      }

      bookingRequestsQuery = bookingRequestsQuery.eq('broker_id', admin.broker_id)
    }

    const { data: bookingRequestsData, error: bookingRequestsError } =
      await bookingRequestsQuery

    if (bookingRequestsError) {
      throw new Error(bookingRequestsError.message)
    }

    const bookingRequests = (bookingRequestsData || []) as BookingRequestNotification[]
    newReservationsCount = bookingRequests.length
  }

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

        .edit-property-button {
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

        .edit-property-button:hover,
        .edit-property-button:focus-visible {
          background-color: #0f4fe0;
          color: #ffffff !important;
        }

        .edit-property-button svg {
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

      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef4ff,_#f8fafc_45%,_#f8fafc_100%)] pb-8 text-slate-700">
        <header className="sticky top-0 z-[110] bg-[#f5f7f9]">
          <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
            <BrandLogo />

            <div className="hidden items-center gap-6 md:flex">
              {canReceivePropertyBookingRequests(admin) && (
                <Link
                  href="/admin/properties/booking-requests"
                  className="desktop-header-nav-button desktop-header-nav-button-inactive"
                >
                  <span className="inline-flex items-center gap-2">
                    <span>New Reservations</span>
                    <NotificationBadge count={newReservationsCount} />
                  </span>
                </Link>
              )}

              <Link
                href="/admin/properties"
                className="desktop-header-nav-button desktop-header-nav-button-active"
              >
                Properties
              </Link>

              {canReceivePropertyBookingRequests(admin) && (
                <Link
                  href="/admin/properties/reservations"
                  className="desktop-header-nav-button desktop-header-nav-button-inactive"
                >
                  Manage Reservations
                </Link>
              )}

              {isSuperAdmin(admin) && (
                <Link
                  href="/admin/properties/review"
                  className="desktop-header-nav-button desktop-header-nav-button-inactive"
                >
                  Review Queue
                </Link>
              )}

              <Link
                href="/admin/change-password"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Change Password
              </Link>

              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1600px] px-4 pb-8 pt-6 md:px-6 md:pt-8">
          <PropertySearchForm searchTerm={searchTerm} />

          {properties.length === 0 ? (
            <div className="mt-6">
              <EmptyState searchTerm={searchTerm} />
            </div>
          ) : (
            <section className="mt-8 rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-200 px-5 py-5 md:px-7">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">
                    {searchTerm ? 'Search Results' : 'Property Listings'}
                  </h3>

                  {searchTerm ? (
                    <p className="text-sm text-slate-500">
                      Showing properties matching:{' '}
                      <span className="font-semibold text-slate-900">
                        {searchTerm}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {properties.map((property) => {
                    const title =
                      property.title_en || property.title_ar || 'Untitled Property'

                    const coverImage = getCoverImage(property.id, propertyImagesMap)

                    return (
                      <div
                        key={property.id}
                        className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.10)]"
                      >
                        <div className="relative h-56 overflow-hidden bg-slate-100">
                          {coverImage ? (
                            <img
                              src={coverImage}
                              alt={title}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <PropertyImagePlaceholder />
                          )}
                        </div>

                        <div className="p-5">
                          <h4 className="text-lg font-semibold text-slate-900">
                            {title}
                          </h4>

                          <div className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#155dfc]">
                            Property ID: {property.property_id || '—'}
                          </div>

                          <div className="mt-3 rounded-[18px] border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                            <p>
                              <span className="font-semibold text-slate-900">
                                Owner:
                              </span>{' '}
                              {property.owner_name || '—'}
                            </p>

                            <p className="mt-1">
                              <span className="font-semibold text-slate-900">
                                Phone:
                              </span>{' '}
                              {property.owner_phone || '—'}
                            </p>

                            {property.owner_whatsapp ? (
                              <p className="mt-1">
                                <span className="font-semibold text-slate-900">
                                  WhatsApp:
                                </span>{' '}
                                {property.owner_whatsapp}
                              </p>
                            ) : null}

                            {property.owner_national_id ? (
                              <p className="mt-1">
                                <span className="font-semibold text-slate-900">
                                  National ID:
                                </span>{' '}
                                {property.owner_national_id}
                              </p>
                            ) : null}
                          </div>

                          <div className="mt-5">
                            <Link
                              href={`/admin/properties/${property.id}`}
                              className="edit-property-button"
                            >
                              <EyeIcon />
                              <span className="text-white">Edit Property</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          )}
        </section>
      </main>
    </>
  )
}
