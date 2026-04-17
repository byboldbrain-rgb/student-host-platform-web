import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase/server'
import {
  requireFoodOrdersAccess,
  isSuperAdmin,
} from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

type OrderItem = {
  id: number
  order_id: number
  menu_item_id?: number | null
  item_name_en?: string | null
  item_name_ar?: string | null
  variant_name_en?: string | null
  variant_name_ar?: string | null
  quantity: number
  unit_price: number
  total_price: number
}

type RestaurantOrder = {
  id: number
  restaurant_id: number
  customer_name: string
  customer_phone: string
  customer_address: string
  area_id?: number | null
  area_name?: string | null
  delivery_fee: number
  subtotal: number
  total_amount: number
  notes?: string | null
  status?: string | null
  created_at?: string | null
  service_providers?: {
    id?: number
    name_en?: string | null
    name_ar?: string | null
    phone?: string | null
    whatsapp_number?: string | null
    address_line?: string | null
    slug?: string | null
  } | null
  restaurant_order_items?: OrderItem[] | null
}

function getAdminDisplayName(admin: any) {
  const possibleName =
    admin?.full_name ||
    admin?.name ||
    admin?.display_name ||
    admin?.email

  if (!possibleName || typeof possibleName !== 'string') {
    return 'Admin'
  }

  if (possibleName.includes('@')) {
    return possibleName.split('@')[0]
  }

  return possibleName
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

function EmptyState() {
  return (
    <div className="rounded-[28px] border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
      <h3 className="text-lg font-semibold text-gray-900">No pending orders</h3>
      <p className="mt-2 text-sm text-gray-500">
        There are no restaurant orders waiting for confirmation right now.
      </p>
    </div>
  )
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

function formatPrice(value?: number | null) {
  return `${Number(value || 0).toLocaleString()} EGP`
}

export default async function FoodGroceryOrdersPage() {
  const adminContext = await requireFoodOrdersAccess()
  const admin = adminContext.admin
  const adminName = getAdminDisplayName(admin)

  async function confirmOrder(formData: FormData) {
    'use server'

    await requireFoodOrdersAccess()

    const orderId = Number(formData.get('orderId'))

    if (!orderId || Number.isNaN(orderId)) {
      throw new Error('Invalid order id')
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('restaurant_orders')
      .update({
        status: 'confirmed',
      })
      .eq('id', orderId)
      .eq('status', 'pending')

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/admin/services/food-grocery/orders-receiver')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('restaurant_orders')
    .select(`
      id,
      restaurant_id,
      customer_name,
      customer_phone,
      customer_address,
      area_id,
      area_name,
      delivery_fee,
      subtotal,
      total_amount,
      notes,
      status,
      created_at,
      service_providers:restaurant_id (
        id,
        name_en,
        name_ar,
        phone,
        whatsapp_number,
        address_line,
        slug
      ),
      restaurant_order_items (
        id,
        order_id,
        menu_item_id,
        item_name_en,
        item_name_ar,
        variant_name_en,
        variant_name_ar,
        quantity,
        unit_price,
        total_price
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const orders = (data || []) as RestaurantOrder[]

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-gray-700">
      <header className="z-30 border-b border-gray-300 bg-[#f5f7f9]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/services/food-grocery" className="flex items-center">
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
            {isSuperAdmin(admin) && (
              <Link
                href="/admin/services/food-grocery"
                className="hidden rounded-full border border-gray-400 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:border-gray-900 hover:text-gray-900 md:inline-flex"
              >
                Food Dashboard
              </Link>
            )}

            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-4 pb-8 pt-6 md:px-6 md:pt-8">
        {orders.length === 0 ? (
          <div className="mt-6">
            <EmptyState />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {orders.map((order) => {
              const restaurantName =
                order.service_providers?.name_en ||
                order.service_providers?.name_ar ||
                'Unknown Restaurant'

              return (
                <article
                  key={order.id}
                  className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
                        Order #{order.id}
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-gray-900">
                        {order.customer_name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </p>
                    </div>

                    <span className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                      Pending
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-[#fcfcfc] p-4">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Customer Details
                      </h3>
                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <p><span className="font-medium">Phone:</span> {order.customer_phone}</p>
                        <p><span className="font-medium">Address:</span> {order.customer_address}</p>
                        <p><span className="font-medium">Area:</span> {order.area_name || '—'}</p>
                        <p><span className="font-medium">Notes:</span> {order.notes || '—'}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-[#fcfcfc] p-4">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Restaurant Details
                      </h3>
                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <p><span className="font-medium">Name:</span> {restaurantName}</p>
                        <p><span className="font-medium">Phone:</span> {order.service_providers?.phone || '—'}</p>
                        <p><span className="font-medium">WhatsApp:</span> {order.service_providers?.whatsapp_number || '—'}</p>
                        <p><span className="font-medium">Address:</span> {order.service_providers?.address_line || '—'}</p>
                        <p><span className="font-medium">Slug:</span> {order.service_providers?.slug || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-gray-900">Order Items</h3>

                    <div className="mt-3 space-y-3">
                      {(order.restaurant_order_items || []).map((item) => {
                        const itemName = item.item_name_en || item.item_name_ar || 'Item'
                        const variantName =
                          item.variant_name_en || item.variant_name_ar || null

                        return (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-gray-100 bg-[#fafafa] p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-gray-900">{itemName}</p>
                                {variantName ? (
                                  <p className="mt-1 text-sm text-[#5583fb]">
                                    Variant: {variantName}
                                  </p>
                                ) : null}
                                <p className="mt-1 text-sm text-gray-500">
                                  Qty: {item.quantity}
                                </p>
                              </div>

                              <div className="text-right text-sm">
                                <p className="font-medium text-gray-900">
                                  {formatPrice(item.total_price)}
                                </p>
                                <p className="mt-1 text-gray-500">
                                  {formatPrice(item.unit_price)} / item
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{formatPrice(order.subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Delivery</span>
                        <span>{formatPrice(order.delivery_fee)}</span>
                      </div>
                      <div className="flex items-center justify-between text-base font-semibold text-gray-900">
                        <span>Total</span>
                        <span>{formatPrice(order.total_amount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <form action={confirmOrder}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-[#5583fb] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3f6ef0]"
                      >
                        Confirm
                      </button>
                    </form>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}