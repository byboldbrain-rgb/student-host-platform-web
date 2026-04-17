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
  'inline-flex items-center justify-center rounded-[18px] border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_14px_30px_rgba(37,99,235,0.35)]'

const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[18px] border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-[#222222] shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-400 hover:bg-[#fafafa] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]'

const tableButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[14px] border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-400 hover:bg-[#fafafa] hover:shadow-[0_10px_22px_rgba(15,23,42,0.08)] disabled:cursor-not-allowed disabled:opacity-50'

function getRoleBadgeClass(role: string) {
  if (role === 'super_admin') {
    return 'border border-black/10 bg-black text-white'
  }

  if (role === 'property_adder') {
    return 'border border-violet-200/80 bg-violet-50 text-violet-700'
  }

  if (role === 'property_editor') {
    return 'border border-emerald-200/80 bg-emerald-50 text-emerald-700'
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
    return 'border border-emerald-200/80 bg-emerald-50 text-emerald-700'
  }

  return 'border border-rose-200/80 bg-rose-50 text-rose-700'
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getBrokerLabel(brokerId: string | null, brokersMap: Map<string, Broker>) {
  if (!brokerId) return '—'
  const broker = brokersMap.get(brokerId)
  if (!broker) return 'Assigned Broker'
  return broker.company_name?.trim() || broker.full_name
}

export default async function PropertyAdminsPage() {
  const adminContext = await requirePropertyAdminsManagementAccess()
  const supabase = createAdminClient()

  const [{ data, error }, { data: brokersData, error: brokersError }] =
    await Promise.all([
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
  const brokers = (brokersData || []) as Broker[]
  const brokersMap = new Map(brokers.map((broker) => [broker.id, broker]))

  return (
    <main className="min-h-screen bg-[#fbfbfb] text-gray-700">
      <header className="sticky top-0 z-40 h-[130px] border-b border-gray-200/80 bg-[#F5F7F9]">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 bg-[#F5F7F9] px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/properties" className="shrink-0">
              <img
                src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
                alt="Navienty"
                className="block h-auto w-[180px] md:w-[130px]"
              />
            </Link>

            <div className="hidden md:block"></div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
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
        <section
          id="create-admin"
          className="overflow-hidden rounded-[32px] border border-black/[0.06] bg-white shadow-[0_10px_36px_rgba(15,23,42,0.05)]"
        >
          <div className="border-b border-gray-200/80 px-5 py-5 md:px-6 lg:px-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="mt-1 text-[24px] font-semibold tracking-tight text-[#222222]">
                  Create Property Admin
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Add a new property adder or property editor to the admin team.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6 lg:p-8">
            <form action={createPropertyAdminAction} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                  Full Name
                </label>
                <input
                  name="full_name"
                  placeholder="Enter full name"
                  className="w-full rounded-[18px] border border-gray-300 bg-white px-4 py-3 text-sm text-[#222222] outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  className="w-full rounded-[18px] border border-gray-300 bg-white px-4 py-3 text-sm text-[#222222] outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  className="w-full rounded-[18px] border border-gray-300 bg-white px-4 py-3 text-sm text-[#222222] outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                  Role
                </label>
                <select
                  name="role"
                  defaultValue="property_adder"
                  className="w-full rounded-[18px] border border-gray-300 bg-white px-4 py-3 text-sm text-[#222222] outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                >
                  <option value="property_adder">Property Adder</option>
                  <option value="property_editor">Property Editor</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                  Assigned Broker
                </label>
                <select
                  name="broker_id"
                  defaultValue=""
                  className="w-full rounded-[18px] border border-gray-300 bg-white px-4 py-3 text-sm text-[#222222] outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">No broker assigned</option>
                  {brokers.map((broker) => (
                    <option key={broker.id} value={broker.id}>
                      {broker.company_name?.trim()
                        ? `${broker.company_name} — ${broker.full_name}`
                        : broker.full_name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  Optional for Property Adder. Required only for Property Editor.
                </p>
              </div>

              <div className="md:col-span-2 pt-2">
                <button type="submit" className={primaryButtonClass}>
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </section>

        <section
          id="admins-table"
          className="mt-6 overflow-hidden rounded-[32px] border border-black/[0.06] bg-white shadow-[0_10px_36px_rgba(15,23,42,0.05)]"
        >
          <div className="border-b border-gray-200/80 px-5 py-5 md:px-6 lg:px-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="mt-1 text-[24px] font-semibold tracking-tight text-[#222222]">
                  Property Admin Records
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Review admin roles, broker assignment, activity status, and account
                  actions.
                </p>
              </div>
            </div>
          </div>

          {admins.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[1400px] text-left">
                  <thead className="bg-[#fafafa]">
                    <tr>
                      <th className="px-8 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Admin
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Role
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Department
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Assigned Broker
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Created At
                      </th>
                      <th className="px-8 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
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
                          className="border-t border-gray-100 transition hover:bg-[#fcfcfc]"
                        >
                          <td className="px-8 py-6 align-top">
                            <div className="flex items-start gap-4">
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-lg">
                                👤
                              </div>

                              <div className="min-w-0">
                                <div className="truncate text-[16px] font-semibold text-[#222222]">
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
                            </div>
                          </td>

                          <td className="px-6 py-6 align-top">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeClass(
                                admin.role
                              )}`}
                            >
                              {getRoleLabel(admin.role)}
                            </span>
                          </td>

                          <td className="px-6 py-6 align-top text-sm text-gray-600">
                            {admin.department || '—'}
                          </td>

                          <td className="px-6 py-6 align-top text-sm text-gray-600">
                            {getBrokerLabel(admin.broker_id, brokersMap)}
                          </td>

                          <td className="px-6 py-6 align-top">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                                admin.is_active
                              )}`}
                            >
                              {admin.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          <td className="px-6 py-6 align-top text-sm text-gray-600">
                            {formatDate(admin.created_at)}
                          </td>

                          <td className="px-8 py-6 align-top">
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
                                  className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-rose-50 hover:shadow-[0_10px_22px_rgba(15,23,42,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
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

              <div className="grid gap-4 p-4 md:p-6 xl:hidden">
                {admins.map((admin) => {
                  const isSelf = admin.id === adminContext.admin.id
                  const isSuperAdmin = admin.role === 'super_admin'

                  return (
                    <div
                      key={admin.id}
                      className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_6px_22px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-lg">
                          👤
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="truncate text-[17px] font-semibold text-[#222222]">
                                {admin.full_name}
                              </h4>
                              <p className="mt-1 break-all text-sm text-gray-500">
                                {admin.email}
                              </p>
                            </div>
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
                            Assigned Broker
                          </div>
                          <div className="mt-2 text-[15px] font-semibold text-[#222222]">
                            {getBrokerLabel(admin.broker_id, brokersMap)}
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
                            className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-600 shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-rose-50 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="p-8 text-center md:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-100 text-2xl">
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
    </main>
  )
}