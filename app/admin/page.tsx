import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import { requireSuperAdminAccess } from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

type SearchParams = {
  admin_status?: string
  availability_status?: string
}

type PropertyRow = {
  id: string
  property_id: string
  title_en: string | null
  title_ar: string | null
  price_egp: number | null
  admin_status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'
  availability_status: 'available' | 'reserved' | null
  is_active: boolean
  created_at: string
  created_by_admin_id: string | null
  updated_by_admin_id: string | null
}

function DashboardStatCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string | number
  helper: string
}) {
  return (
    <div className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.06)] md:p-6">
      <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
        {label}
      </div>
      <div className="mt-3 text-[28px] font-semibold tracking-tight text-[#222222] md:text-[34px]">
        {value}
      </div>
      <div className="mt-2 text-sm text-gray-500">{helper}</div>
    </div>
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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireSuperAdminAccess()

  const { admin_status, availability_status } = await searchParams
  const supabase = await createClient()

  let propertiesQuery = supabase
    .from('properties')
    .select(`
      id,
      property_id,
      title_en,
      title_ar,
      price_egp,
      admin_status,
      availability_status,
      is_active,
      created_at,
      created_by_admin_id,
      updated_by_admin_id
    `)
    .order('created_at', { ascending: false })

  if (admin_status) {
    propertiesQuery = propertiesQuery.eq('admin_status', admin_status)
  }

  if (availability_status) {
    propertiesQuery = propertiesQuery.eq('availability_status', availability_status)
  }

  const { data, error } = await propertiesQuery

  if (error) {
    throw new Error(error.message)
  }

  const properties = (data || []) as PropertyRow[]

  const reservedCount = properties.filter(
    (property) => property.availability_status === 'reserved'
  ).length

  const publishedCount = properties.filter(
    (property) => property.admin_status === 'published'
  ).length

  const pendingCount = properties.filter(
    (property) => property.admin_status === 'pending_review'
  ).length

  const availableCount = properties.filter(
    (property) => property.availability_status === 'available'
  ).length

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

      <main className="min-h-screen bg-[#fbfbfb] pb-28 text-gray-700 md:pb-0">
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
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
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

        <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <section className="overflow-hidden rounded-[32px] border border-black/[0.05] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
            <div className="relative">
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#f7f8fa] to-white" />
              <div className="absolute right-[-80px] top-[-80px] h-[220px] w-[220px] rounded-full bg-blue-50/60 blur-3xl" />

              <div className="relative px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-9">
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_420px] xl:items-center">
                  <div className="max-w-7xl">
                    <img
                      src="https://i.ibb.co/x87wxX1Z/Navigate-Your-Future-1.png"
                      alt="Navigate Your Future"
                      className="w-full max-w-[3000px] object-contain"
                    />
                  </div>

                  <div className="rounded-[28px] border border-gray-200 bg-[#fcfcfd] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] md:p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="mt-1 text-sm text-gray-600">
                          Quick numbers for your current inventory
                        </div>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
                        <img
                          src="https://i.ibb.co/jZVKpdq7/dashboard.png"
                          alt="Dashboard"
                          className="h-5 w-5 object-contain"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <DashboardStatCard
                        label="Reserved Rooms"
                        value={reservedCount}
                        helper="Currently reserved listings"
                      />
                      <DashboardStatCard
                        label="Published"
                        value={publishedCount}
                        helper="Live on platform"
                      />
                      <DashboardStatCard
                        label="Pending"
                        value={pendingCount}
                        helper="Waiting for review"
                      />
                      <DashboardStatCard
                        label="Available"
                        value={availableCount}
                        helper="Open for booking"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {properties.length === 0 && (
            <section className="mt-6 rounded-[32px] border border-dashed border-gray-300 bg-white px-6 py-24 text-center shadow-sm">
              <div className="mx-auto max-w-xl">
                <h2 className="text-2xl font-semibold text-[#111827]">
                  No properties found
                </h2>
                <p className="mt-3 text-sm leading-6 text-gray-500">
                  There are currently no property records to display.
                </p>
              </div>
            </section>
          )}
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-[640px] grid-cols-3 gap-2">
            <MobileBottomNavItem
              href="/admin/properties/new"
              label="Add Property"
              isPrimary
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