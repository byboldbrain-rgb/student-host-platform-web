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
    <Link href="/admin/properties" className="navienty-logo" aria-label="Navienty admin home">
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

function ClipboardListIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-[20px] w-[20px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
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

function MobileNavIcon({
  src,
  alt,
}: {
  src: string
  alt: string
}) {
  return <img src={src} alt={alt} className="h-[20px] w-[20px] object-contain" />
}

function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null

  return (
    <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-[5px] text-[10px] font-bold leading-none text-white shadow-md">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <GridIcon />
      </div>

      <h3 className="text-lg font-semibold text-slate-900">No properties found</h3>
      <p className="mt-2 text-sm text-slate-500">
        There are no properties available for this account right now.
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

function MobileBottomNav({ newReservationsCount }: { newReservationsCount: number }) {
  const items = [
    {
      href: '/admin/properties/booking-requests',
      label: 'New Reservations',
      icon: (
        <MobileNavIcon
          src="https://i.ibb.co/hxXpLKv3/add-event-6756388.png"
          alt="New Reservations"
        />
      ),
      active: false,
      badgeCount: newReservationsCount,
    },
    {
      href: '/admin/properties',
      label: 'Properties',
      icon: (
        <MobileNavIcon
          src="https://i.ibb.co/Dfs0dvX3/property-11608478.png"
          alt="Properties"
        />
      ),
      active: true,
      badgeCount: 0,
    },
    {
      href: '/admin/properties/reservations',
      label: 'Manage Reservations',
      icon: (
        <MobileNavIcon
          src="https://i.ibb.co/zTk4mxj1/delete-event-5577905.png"
          alt="Manage Reservations"
        />
      ),
      active: false,
      badgeCount: 0,
    },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e8e8ee] bg-white md:hidden">
      <div className="mx-auto flex h-[74px] max-w-md items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const activeClass = item.active ? 'text-[#155dfc]' : 'text-[#6b7280]'

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-[88px] flex-col items-center justify-center gap-1 px-2 py-2 text-center transition"
            >
              <span className={`relative flex items-center justify-center ${activeClass}`}>
                {item.icon}

                {item.badgeCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-[5px] text-[10px] font-bold text-white shadow-md">
                    {item.badgeCount > 99 ? '99+' : item.badgeCount}
                  </span>
                )}
              </span>

              <span
                className={`text-[11px] leading-[1.1] ${activeClass} ${
                  item.active ? 'font-semibold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default async function AdminPropertiesPage() {
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

  let query = supabase
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
      guests_count
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

  const properties = (data || []) as Property[]

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

      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef4ff,_#f8fafc_45%,_#f8fafc_100%)] pb-24 text-slate-700 md:pb-8">
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

              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1600px] px-4 pb-8 pt-6 md:px-6 md:pt-8">
          {properties.length === 0 ? (
            <div className="mt-6">
              <EmptyState />
            </div>
          ) : (
            <section className="mt-8 rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-200 px-5 py-5 md:px-7">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">
                  Property Listings
                </h3>
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
                          <h4 className="text-lg font-semibold text-slate-900">{title}</h4>

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

        {canReceivePropertyBookingRequests(admin) && (
          <MobileBottomNav newReservationsCount={newReservationsCount} />
        )}

        {!canReceivePropertyBookingRequests(admin) && (
          <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e8e8ee] bg-white md:hidden">
            <div className="mx-auto flex h-[74px] max-w-md items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
              <Link
                href="/admin/properties"
                className="flex min-w-[88px] flex-col items-center justify-center gap-1 px-2 py-2 text-center transition"
              >
                <span className="relative flex items-center justify-center text-[#155dfc]">
                  <GridIcon />
                </span>
                <span className="text-[11px] font-semibold leading-[1.1] text-[#155dfc]">
                  Properties
                </span>
              </Link>

              {isSuperAdmin(admin) && (
                <Link
                  href="/admin/properties/review"
                  className="flex min-w-[88px] flex-col items-center justify-center gap-1 px-2 py-2 text-center transition"
                >
                  <span className="relative flex items-center justify-center text-[#6b7280]">
                    <ClipboardListIcon />
                  </span>
                  <span className="text-[11px] font-medium leading-[1.1] text-[#6b7280]">
                    Review
                  </span>
                </Link>
              )}
            </div>
          </nav>
        )}
      </main>
    </>
  )
}