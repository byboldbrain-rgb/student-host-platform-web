import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import {
  requireUniversitySuppliesPageAccess,
  isUniversitySuppliesReceiver,
  isUniversitySuppliesSuperAdmin,
} from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'
import OrdersReceiverActions from './OrdersReceiverActions'

type UniversitySuppliesOrder = {
  id: number
  provider_id: number
  category_id?: number | null
  customer_name?: string | null
  customer_phone?: string | null
  customer_whatsapp?: string | null
  request_details?: string | null
  order_source?: string | null
  status?: string | null
  provider_cost?: number | null
  customer_price?: number | null
  profit_amount?: number | null
  notes?: string | null
  created_at?: string | null
  updated_at?: string | null
  handled_by_admin_id?: string | null
  handled_at?: string | null
  service_providers?: {
    id: number
    name_en?: string | null
    name_ar?: string | null
  } | null
  service_categories?: {
    id: number
    name_en?: string | null
    name_ar?: string | null
    slug?: string | null
  } | null
}

function getAdminDisplayName(admin: any) {
  const possibleName =
    admin?.full_name ||
    admin?.name ||
    admin?.display_name ||
    admin?.email

  if (!possibleName || typeof possibleName !== 'string') return 'Admin'
  if (possibleName.includes('@')) return possibleName.split('@')[0]
  return possibleName
}

function formatDate(date?: string | null) {
  if (!date) return '—'

  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  } catch {
    return '—'
  }
}

function getStatusBadgeClass(status?: string | null) {
  switch (status) {
    case 'completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'accepted':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'sent_to_provider':
      return 'border-purple-200 bg-purple-50 text-purple-700'
    case 'cancelled':
      return 'border-rose-200 bg-rose-50 text-rose-700'
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700'
  }
}

function BrandLogo() {
  return (
    <img
      src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
      alt="Navienty"
      className="h-auto w-[120px] object-contain md:w-[145px]"
    />
  )
}

export default async function UniversitySuppliesOrdersPage() {
  const adminContext = await requireUniversitySuppliesPageAccess()
  const admin = adminContext.admin
  const adminName = getAdminDisplayName(admin)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('service_orders')
    .select(`
      id,
      provider_id,
      category_id,
      customer_name,
      customer_phone,
      customer_whatsapp,
      request_details,
      order_source,
      status,
      provider_cost,
      customer_price,
      profit_amount,
      notes,
      created_at,
      updated_at,
      handled_by_admin_id,
      handled_at,
      service_providers!service_orders_provider_id_fkey (
        id,
        name_en,
        name_ar
      ),
      service_categories!service_orders_category_id_fkey (
        id,
        name_en,
        name_ar,
        slug
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const orders = ((data || []) as UniversitySuppliesOrder[]).filter((order) => {
    const slug = order.service_categories?.slug
    return slug === 'university-supplies' || slug === 'university_supplies'
  })

  const totalOrders = orders.length
  const newOrders = orders.filter((item) => (item.status || 'new') === 'new').length
  const acceptedOrders = orders.filter((item) => item.status === 'accepted').length
  const completedOrders = orders.filter((item) => item.status === 'completed').length

  const canReceive =
    isUniversitySuppliesReceiver(admin) || isUniversitySuppliesSuperAdmin(admin)

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-gray-700">
      <header className="z-30 border-b border-gray-300 bg-[#f5f7f9]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/services/university-supplies" className="flex items-center">
              <BrandLogo />
            </Link>

            <div className="hidden md:block">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                Welcome back
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-gray-900">
                {adminName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/services/university-supplies"
              className="hidden rounded-full border border-gray-400 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:border-gray-900 hover:text-gray-900 md:inline-flex"
            >
              Back to Dashboard
            </Link>

            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-4 pb-8 pt-6 md:px-6 md:pt-8">
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] border border-[#e6ebf2] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
              Total Orders
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#101828]">{totalOrders}</p>
          </div>

          <div className="rounded-[28px] border border-[#e6ebf2] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
              New
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#101828]">{newOrders}</p>
          </div>

          <div className="rounded-[28px] border border-[#e6ebf2] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
              Accepted
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#101828]">{acceptedOrders}</p>
          </div>

          <div className="rounded-[28px] border border-[#e6ebf2] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
              Completed
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#101828]">{completedOrders}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">University Supplies Orders</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Total orders: {orders.length}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-[#fafafa]">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Provider
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Source
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Price
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Created
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-gray-100 align-top">
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {order.customer_name || 'Unknown customer'}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {order.customer_phone || order.customer_whatsapp || '—'}
                          </p>
                          {order.request_details ? (
                            <p className="mt-2 max-w-[320px] text-xs leading-5 text-gray-600">
                              {order.request_details}
                            </p>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {order.service_providers?.name_en ||
                          order.service_providers?.name_ar ||
                          `Provider #${order.provider_id}`}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {order.order_source || 'manual'}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                            order.status
                          )}`}
                        >
                          {order.status || 'new'}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {order.customer_price != null ? `${order.customer_price} EGP` : '—'}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))}

                  {orders.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm text-gray-500"
                      >
                        No orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside>
            {canReceive && orders[0] ? (
              <OrdersReceiverActions order={orders[0]} />
            ) : (
              <div className="rounded-[24px] border border-[#eaecf0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                <h3 className="text-lg font-semibold text-[#101828]">Receiver Actions</h3>
                <p className="mt-2 text-sm text-[#667085]">
                  {orders.length === 0
                    ? 'No orders available yet.'
                    : 'You do not have receiver permissions for this section.'}
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  )
}