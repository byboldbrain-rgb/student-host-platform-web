import { redirect } from 'next/navigation';
import { Eye, ShoppingBag } from 'lucide-react';

import { EmptyState } from '../components/ui-kit';
import { getAdminOrdersWithClient, requireNowAdmin } from '../lib/admin-data';
import OrdersClientEnhancements, { RefreshOrdersButton } from './components/orders-client-enhancements';
import OrdersList from './components/orders-list';
import OrdersPagination from './components/orders-pagination';
import OrdersStatusRail from './components/orders-status-rail';
import OrdersToolbar from './components/orders-toolbar';
import {
  buildOrdersUrl,
  formatCount,
  formatOrderDateTime,
  getActiveOrdersCount,
  parseOrdersQuery,
  type OrdersSearchParams,
  updateOrdersQuery,
} from './order-helpers';

const PAGE_SIZE = 20;

export default async function NavientyNowOrdersPage({
  searchParams,
}: {
  searchParams: Promise<OrdersSearchParams>;
}) {
  const [params, { supabase, access }] = await Promise.all([
    searchParams,
    requireNowAdmin(),
  ]);

  if (!access.permissions.view_orders) {
    redirect('/admin/unauthorized');
  }

  const query = parseOrdersQuery(params);
  const data = await getAdminOrdersWithClient(supabase, {
    search: query.search,
    status: query.status,
    paymentStatus: query.paymentStatus,
    limit: PAGE_SIZE,
    offset: (query.page - 1) * PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(data.pagination.total_filtered / PAGE_SIZE));

  if (data.pagination.total_filtered > 0 && query.page > totalPages) {
    redirect(updateOrdersQuery(query, { page: totalPages }));
  }

  const currentOrdersUrl = buildOrdersUrl(query);
  const activeOrders = getActiveOrdersCount(data.summary);
  const loadedAt = new Date().toISOString();
  const hasFilters = Boolean(query.search || query.status || query.paymentStatus);

  return (
    <div className="orders-operations space-y-4 text-slate-950">
      <OrdersClientEnhancements />

      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_6px_16px_rgba(37,99,235,0.18)]">
            <ShoppingBag aria-hidden="true" size={19} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">عمليات الطلبات</h1>
              {!access.permissions.manage_orders ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700">
                  <Eye aria-hidden="true" size={12} /> عرض فقط
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
              {formatCount(activeOrders)} نشط من {formatCount(data.summary.total)} إجماليًا · آخر تحميل {formatOrderDateTime(loadedAt)} بتوقيت القاهرة
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <RefreshOrdersButton />
        </div>
      </header>

      <OrdersStatusRail summary={data.summary} query={query} />
      <OrdersToolbar query={query} />

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-semibold text-slate-950">
          {hasFilters ? 'النتائج المطابقة' : 'أحدث الطلبات'}
        </h2>
        <p className="text-xs font-medium text-slate-600">
          {formatCount(data.pagination.total_filtered)} طلب · التحديث يدوي
        </p>
      </div>

      {data.items.length ? (
        <OrdersList
          orders={data.items}
          canManageOrders={access.permissions.manage_orders}
          returnTo={currentOrdersUrl}
        />
      ) : (
        <EmptyState
          title="لا توجد طلبات مطابقة"
          description={hasFilters
            ? 'أزل فلترًا أو جرّب بحثًا مختلفًا.'
            : 'لا توجد طلبات في آخر تحميل. استخدم «تحديث يدوي» للتحقق مرة أخرى.'}
          icon={<ShoppingBag aria-hidden="true" size={22} />}
        />
      )}

      <OrdersPagination pagination={data.pagination} query={query} />
    </div>
  );
}
