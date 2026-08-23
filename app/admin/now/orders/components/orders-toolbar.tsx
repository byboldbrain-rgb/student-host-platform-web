import Link from 'next/link';
import { Search, SlidersHorizontal, X } from 'lucide-react';

import { ORDER_STATUS_META, ORDER_STATUS_VALUES, PAYMENT_STATUS_META, PAYMENT_STATUS_VALUES } from '../order-domain';
import { type OrdersQuery, updateOrdersQuery } from '../order-helpers';

function FilterChip({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
    >
      <span className="min-w-0 truncate">{label}</span>
      <X aria-hidden="true" className="shrink-0" size={13} />
      <span className="sr-only">إزالة الفلتر</span>
    </Link>
  );
}

export default function OrdersToolbar({ query }: { query: OrdersQuery }) {
  const hasFilters = Boolean(query.search || query.status || query.paymentStatus);

  return (
    <section aria-labelledby="orders-filters-title" className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="orders-filters-title" className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <SlidersHorizontal aria-hidden="true" size={16} className="text-blue-700" />
          البحث والتصفية
        </h2>
        {hasFilters ? (
          <Link href="/admin/now/orders" className="inline-flex min-h-11 items-center text-xs font-semibold text-slate-600 underline-offset-4 hover:text-blue-800 hover:underline">
            مسح الكل
          </Link>
        ) : null}
      </div>

      <form method="get" className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_190px_auto] lg:items-end">
        <label className="block text-xs font-semibold text-slate-700">
          البحث في الطلبات
          <span className="relative mt-1.5 block">
            <Search aria-hidden="true" size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              data-orders-search
              aria-keyshortcuts="/"
              name="search"
              defaultValue={query.search}
              placeholder="الكود، العميل، الهاتف أو المتجر"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pr-10 pl-3 text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <kbd className="pointer-events-none absolute left-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 sm:block">/</kbd>
          </span>
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          حالة الطلب
          <select name="status" defaultValue={query.status ?? ''} className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
            <option value="">كل الحالات</option>
            {ORDER_STATUS_VALUES.map((status) => (
              <option key={status} value={status}>{ORDER_STATUS_META[status].label}</option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          حالة الدفع
          <select name="payment_status" defaultValue={query.paymentStatus ?? ''} className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
            <option value="">كل حالات الدفع</option>
            {PAYMENT_STATUS_VALUES.map((status) => (
              <option key={status} value={status}>{PAYMENT_STATUS_META[status].label}</option>
            ))}
          </select>
        </label>

        <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
          تطبيق
        </button>
      </form>

      {hasFilters ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3" aria-label="الفلاتر النشطة">
          <span className="text-xs font-semibold text-slate-500">النشط:</span>
          {query.search ? (
            <FilterChip label={`بحث: ${query.search}`} href={updateOrdersQuery(query, { search: '', page: 1 })} />
          ) : null}
          {query.status ? (
            <FilterChip label={`الحالة: ${ORDER_STATUS_META[query.status].label}`} href={updateOrdersQuery(query, { status: null, page: 1 })} />
          ) : null}
          {query.paymentStatus ? (
            <FilterChip label={`الدفع: ${PAYMENT_STATUS_META[query.paymentStatus].label}`} href={updateOrdersQuery(query, { paymentStatus: null, page: 1 })} />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
