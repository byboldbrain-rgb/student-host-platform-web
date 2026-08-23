import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Store,
  UserRound,
} from 'lucide-react';

import type { AdminOrderListItem } from '../../lib/types';
import QuickOrderActions from '../quick-order-actions';
import {
  buildOrderDetailUrl,
  formatCount,
  formatMoney,
} from '../order-helpers';

function DesktopOrdersTable({
  orders,
  canManageOrders,
  returnTo,
}: {
  orders: AdminOrderListItem[];
  canManageOrders: boolean;
  returnTo: string;
}) {
  return (
    <section
      aria-label="جدول الطلبات"
      className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:block"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed text-right">
          <caption className="sr-only">
            الطلبات المطابقة للفلاتر الحالية
          </caption>

          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
            <tr>
              <th
                scope="col"
                className="w-[24%] px-4 py-3"
              >
                العميل
              </th>

              <th
                scope="col"
                className="w-[22%] px-4 py-3"
              >
                المتجر
              </th>

              <th
                scope="col"
                className="w-[18%] px-4 py-3"
              >
                الإجمالي
              </th>

              <th
                scope="col"
                className="w-[36%] px-4 py-3"
              >
                الإجراء
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => {
              const detailUrl = buildOrderDetailUrl(
                order.id,
                returnTo,
              );

              return (
                <tr
                  key={order.id}
                  className="align-top transition-colors hover:bg-blue-50/40 focus-within:bg-blue-50/40"
                >
                  <td className="px-4 py-3">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {order.customer.name}
                    </p>

                    <a
                      href={`tel:${order.customer.phone}`}
                      dir="ltr"
                      className="mt-1 inline-flex min-h-7 items-center text-xs font-medium text-slate-600 hover:text-blue-800 hover:underline"
                    >
                      {order.customer.phone}
                    </a>
                  </td>

                  <td className="px-4 py-3">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                      <span aria-hidden="true">
                        {order.store.icon ?? '🏪'}{' '}
                      </span>

                      {order.store.name_ar}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-slate-950">
                      {formatMoney(
                        order.summary.total_amount,
                        order.summary.currency_symbol,
                        order.summary.currency_code,
                      )}
                    </p>

                    <p className="mt-1 text-[10px] font-medium text-slate-500">
                      {formatCount(order.summary.item_count)} منتج
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      {canManageOrders ? (
                        <QuickOrderActions
                          orderId={order.id}
                          orderCode={order.order_code}
                          status={order.status}
                          customerPhone={order.customer.phone}
                        />
                      ) : null}

                      <Link
                        href={detailUrl}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                      >
                        فتح التفاصيل

                        <ArrowLeft
                          aria-hidden="true"
                          size={14}
                        />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MobileOrdersList({
  orders,
  canManageOrders,
  returnTo,
}: {
  orders: AdminOrderListItem[];
  canManageOrders: boolean;
  returnTo: string;
}) {
  return (
    <section
      aria-label="قائمة الطلبات"
      className="space-y-3 xl:hidden"
    >
      {orders.map((order) => {
        const detailUrl = buildOrderDetailUrl(
          order.id,
          returnTo,
        );

        return (
          <article
            key={order.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-slate-950">
                  {formatMoney(
                    order.summary.total_amount,
                    order.summary.currency_symbol,
                    order.summary.currency_code,
                  )}
                </p>

                <p className="text-[10px] font-medium text-slate-500">
                  {formatCount(order.summary.item_count)} منتج
                </p>
              </div>

              <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <dt className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                    <UserRound
                      aria-hidden="true"
                      size={13}
                    />

                    العميل
                  </dt>

                  <dd className="mt-1 truncate text-xs font-semibold text-slate-900">
                    {order.customer.name}
                  </dd>

                  <dd>
                    <a
                      href={`tel:${order.customer.phone}`}
                      dir="ltr"
                      className="inline-flex min-h-11 items-center gap-1 text-xs text-blue-800"
                    >
                      <Phone
                        aria-hidden="true"
                        size={12}
                      />

                      {order.customer.phone}
                    </a>
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                    <Store
                      aria-hidden="true"
                      size={13}
                    />

                    المتجر
                  </dt>

                  <dd className="mt-1 truncate text-xs font-semibold text-slate-900">
                    {order.store.icon ?? '🏪'}{' '}
                    {order.store.name_ar}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
              <div className="flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-start">
                {canManageOrders ? (
                  <QuickOrderActions
                    orderId={order.id}
                    orderCode={order.order_code}
                    status={order.status}
                    customerPhone={order.customer.phone}
                  />
                ) : (
                  <span className="text-xs font-medium text-slate-500">
                    عرض فقط
                  </span>
                )}

                <Link
                  href={detailUrl}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:border-blue-200 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                >
                  التفاصيل

                  <ArrowLeft
                    aria-hidden="true"
                    size={14}
                  />
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default function OrdersList(props: {
  orders: AdminOrderListItem[];
  canManageOrders: boolean;
  returnTo: string;
}) {
  return (
    <>
      <DesktopOrdersTable {...props} />
      <MobileOrdersList {...props} />
    </>
  );
}