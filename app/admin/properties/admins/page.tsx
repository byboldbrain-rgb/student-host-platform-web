import Link from 'next/link'
import {
  createPropertyAdminAction,
  deletePropertyAdminAction,
 togglePropertyAdminStatusAction,
} from './actions'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { requirePropertyAdminsManagementAccess } from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

type PropertyAdmin = {
  id: string
  email: string
  full_name: string
  role: string
  department: string | null
  is_active: boolean
  created_at: string
  broker_id: string | null
}

type Broker = {
  id: string
  full_name: string
  company_name: string | null
}

const primaryButtonClass =
  'inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_12px_26px_rgba(37,99,235,0.28)]'

const secondaryButtonClass =
  'inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-300 hover:bg-[#fafafa]'

const inputClass =
  'h-14 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-[#222222] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

const tableButtonClass =
  'inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-300 hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-50'

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

function getRoleBadgeClass(role: string) {
  if (role === 'super_admin') {
    return 'border border-black/10 bg-black text-white'
  }

  if (role === 'property_adder') {
    return 'border border-blue-200 bg-blue-50 text-blue-700'
  }

  if (role === 'property_editor') {
    return 'border border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  return 'border border-gray-200 bg-gray-100 text-gray-700'
}

function getRoleLabel(role: string) {
  if (role === 'super_admin') return 'Super Admin'
  if (role === 'property_adder') return 'Property Adder'
  if (role === 'property_editor') return 'Property Editor'
  return role
}

function getStatusBadgeClass(isActive: boolean) {
  if (isActive) {
    return 'border border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  return 'border border-rose-200 bg-rose-50 text-rose-700'
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function PropertyAdminsPage() {
  const adminContext = await requirePropertyAdminsManagementAccess()
  const supabase = createAdminClient()

  const [{ data, error }, { error: brokersError }] = await Promise.all([
    supabase
      .from('admin_users')
      .select(
        'id, email, full_name, role, department, is_active, created_at, broker_id'
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('brokers')
      .select('id, full_name, company_name')
      .order('full_name', { ascending: true }),
  ])

  if (error) {
    throw new Error(error.message)
  }

  if (brokersError) {
    throw new Error(brokersError.message)
  }

  const admins = (data || []) as PropertyAdmin[]

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
                className="desktop-header-nav-button desktop-header-nav-button-active"
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
          <section className="rounded-[32px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_36px_rgba(15,23,42,0.05)] md:p-8">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#222222]">
                  Create property admin
                </h2>
              </div>
            </div>

            <form action={createPropertyAdminAction} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#222222]">
                    Full Name *
                  </label>
                  <input
                    name="full_name"
                    placeholder="Enter full name"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#222222]">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#222222]">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#222222]">
                    Role *
                  </label>
                  <select
                    name="role"
                    defaultValue="property_adder"
                    className={inputClass}
                    required
                  >
                    <option value="property_adder">Property Adder</option>
                    <option value="property_editor">Property Editor</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-[#222222]">
                    Assigned Broker
                  </label>
                  <select
                    name="broker_id"
                    defaultValue=""
                    className={inputClass}
                  >
                    <option value="">No broker assigned</option>
                    {([] as Broker[]).map((broker) => (
                      <option key={broker.id} value={broker.id}>
                        {broker.company_name?.trim()
                          ? `${broker.company_name} — ${broker.full_name}`
                          : broker.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button type="submit" className={primaryButtonClass}>
                  Create Admin
                </button>

                <Link href="/admin/properties" className={secondaryButtonClass}>
                  Cancel
                </Link>
              </div>
            </form>
          </section>

          <section className="mt-6 rounded-[32px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_36px_rgba(15,23,42,0.05)] md:p-8">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#222222]">
                  Property admin records
                </h3>
              </div>
            </div>

            {admins.length > 0 ? (
              <>
                <div className="hidden overflow-x-auto xl:block">
                  <table className="w-full min-w-[1100px] text-left">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-4 text-sm font-semibold text-[#222222]">
                          Admin
                        </th>
                        <th className="px-4 py-4 text-sm font-semibold text-[#222222]">
                          Role
                        </th>
                        <th className="px-4 py-4 text-sm font-semibold text-[#222222]">
                          Department
                        </th>
                        <th className="px-4 py-4 text-sm font-semibold text-[#222222]">
                          Status
                        </th>
                        <th className="px-4 py-4 text-sm font-semibold text-[#222222]">
                          Created At
                        </th>
                        <th className="px-4 py-4 text-sm font-semibold text-[#222222]">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {admins.map((admin) => {
                        const isSelf = admin.id === adminContext.admin.id
                        const isSuperAdmin = admin.role === 'super_admin'

                        return (
                          <tr
                            key={admin.id}
                            className="border-b border-gray-100 transition hover:bg-[#fafafa]"
                          >
                            <td className="px-4 py-5 align-top">
                              <div className="min-w-0">
                                <div className="truncate text-[15px] font-semibold text-[#222222]">
                                  {admin.full_name}
                                </div>
                                <div className="mt-1 text-sm text-gray-500">
                                  {admin.email}
                                </div>

                                {isSelf && (
                                  <div className="mt-2">
                                    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                      Your account
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-5 align-top">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeClass(
                                  admin.role
                                )}`}
                              >
                                {getRoleLabel(admin.role)}
                              </span>
                            </td>

                            <td className="px-4 py-5 align-top text-sm text-gray-600">
                              {admin.department || '—'}
                            </td>

                            <td className="px-4 py-5 align-top">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                                  admin.is_active
                                )}`}
                              >
                                {admin.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>

                            <td className="px-4 py-5 align-top text-sm text-gray-600">
                              {formatDate(admin.created_at)}
                            </td>

                            <td className="px-4 py-5 align-top">
                              <div className="flex flex-wrap items-center gap-2">
                                <form action={togglePropertyAdminStatusAction}>
                                  <input type="hidden" name="admin_id" value={admin.id} />
                                  <input
                                    type="hidden"
                                    name="next_is_active"
                                    value={admin.is_active ? 'false' : 'true'}
                                  />
                                  <button
                                    type="submit"
                                    disabled={isSuperAdmin}
                                    className={tableButtonClass}
                                  >
                                    {admin.is_active ? 'Deactivate' : 'Activate'}
                                  </button>
                                </form>

                                <form action={deletePropertyAdminAction}>
                                  <input type="hidden" name="admin_id" value={admin.id} />
                                  <button
                                    type="submit"
                                    disabled={isSelf || isSuperAdmin}
                                    className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                </form>
                              </div>

                              {isSelf && (
                                <p className="mt-3 text-xs text-gray-400">
                                  You cannot delete your own account.
                                </p>
                              )}

                              {isSuperAdmin && (
                                <p className="mt-3 text-xs text-gray-400">
                                  Super admin account cannot be modified here.
                                </p>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-4 xl:hidden">
                  {admins.map((admin) => {
                    const isSelf = admin.id === adminContext.admin.id
                    const isSuperAdmin = admin.role === 'super_admin'

                    return (
                      <div
                        key={admin.id}
                        className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_6px_22px_rgba(15,23,42,0.05)]"
                      >
                        <div>
                          <div className="min-w-0">
                            <h4 className="truncate text-[17px] font-semibold text-[#222222]">
                              {admin.full_name}
                            </h4>
                            <p className="mt-1 break-all text-sm text-gray-500">
                              {admin.email}
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeClass(
                                admin.role
                              )}`}
                            >
                              {getRoleLabel(admin.role)}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                                admin.is_active
                              )}`}
                            >
                              {admin.is_active ? 'Active' : 'Inactive'}
                            </span>

                            {isSelf && (
                              <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                Your account
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-[#fafafa] p-4">
                            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                              Department
                            </div>
                            <div className="mt-2 text-[15px] font-semibold text-[#222222]">
                              {admin.department || '—'}
                            </div>
                          </div>

                          <div className="rounded-2xl bg-[#fafafa] p-4">
                            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                              Created At
                            </div>
                            <div className="mt-2 text-[15px] font-semibold text-[#222222]">
                              {formatDate(admin.created_at)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <form action={togglePropertyAdminStatusAction} className="flex-1">
                            <input type="hidden" name="admin_id" value={admin.id} />
                            <input
                              type="hidden"
                              name="next_is_active"
                              value={admin.is_active ? 'false' : 'true'}
                            />
                            <button
                              type="submit"
                              disabled={isSuperAdmin}
                              className={`${secondaryButtonClass} w-full disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {admin.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </form>

                          <form action={deletePropertyAdminAction} className="flex-1">
                            <input type="hidden" name="admin_id" value={admin.id} />
                            <button
                              type="submit"
                              disabled={isSelf || isSuperAdmin}
                              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-600 shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </form>
                        </div>

                        {isSelf && (
                          <p className="mt-3 text-xs text-gray-400">
                            You cannot delete your own account.
                          </p>
                        )}

                        {isSuperAdmin && (
                          <p className="mt-3 text-xs text-gray-400">
                            Super admin account cannot be modified here.
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="py-8 text-center md:py-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f5f7f9] text-2xl">
                  👥
                </div>
                <h3 className="mt-4 text-[22px] font-semibold tracking-tight text-[#222222]">
                  No property admins found
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Create your first property admin to start managing listings and
                  operations.
                </p>
              </div>
            )}
          </section>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-[640px] grid-cols-3 gap-2">
            <MobileBottomNavItem
              href="/admin/properties/new"
              label="Add Property"
            />
            <MobileBottomNavItem
              href="/admin/cities/new"
              label="Add City"
            />
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
              isPrimary
            />
          </div>
        </nav>
      </main>
    </>
  )
}