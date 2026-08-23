import { redirect } from 'next/navigation';
import {
  ChevronDown,
  ShoppingBag,
  SlidersHorizontal,
} from 'lucide-react';

import { EmptyState } from '../components/ui-kit';
import {
  getAdminOrdersWithClient,
  requireNowAdmin,
} from '../lib/admin-data';
import OrdersClientEnhancements from './components/orders-client-enhancements';
import OrdersList from './components/orders-list';
import OrdersPagination from './components/orders-pagination';
import OrdersStatusRail from './components/orders-status-rail';
import OrdersToolbar from './components/orders-toolbar';
import {
  buildOrdersUrl,
  formatCount,
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

  const totalPages = Math.max(
    1,
    Math.ceil(data.pagination.total_filtered / PAGE_SIZE),
  );

  if (
    data.pagination.total_filtered > 0 &&
    query.page > totalPages
  ) {
    redirect(
      updateOrdersQuery(query, {
        page: totalPages,
      }),
    );
  }

  const currentOrdersUrl = buildOrdersUrl(query);

  const hasFilters = Boolean(
    query.search ||
    query.status ||
    query.paymentStatus,
  );

  const activeFiltersCount = [
    query.search,
    query.status,
    query.paymentStatus,
  ].filter(Boolean).length;

  return (
    <div className="orders-operations space-y-4 text-slate-950">
      <OrdersClientEnhancements />

      <OrdersStatusRail
        summary={data.summary}
        query={query}
      />

      <details className="group">
        <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-blue-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <SlidersHorizontal
              aria-hidden="true"
              size={17}
              className="text-blue-600"
            />

            <span>البحث والتصفية</span>

            {activeFiltersCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {activeFiltersCount}
              </span>
            ) : null}
          </span>

          <ChevronDown
            aria-hidden="true"
            size={17}
            className="shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-180"
          />
        </summary>

        <div className="mt-3">
          <OrdersToolbar query={query} />
        </div>
      </details>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-semibold text-slate-950">
          {hasFilters
            ? 'النتائج المطابقة'
            : 'أحدث الطلبات'}
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
          description={
            hasFilters
              ? 'أزل فلترًا أو جرّب بحثًا مختلفًا.'
              : 'لا توجد طلبات في آخر تحميل.'
          }
          icon={
            <ShoppingBag
              aria-hidden="true"
              size={22}
            />
          }
        />
      )}

      <OrdersPagination
        pagination={data.pagination}
        query={query}
      />
    </div>
  );
}