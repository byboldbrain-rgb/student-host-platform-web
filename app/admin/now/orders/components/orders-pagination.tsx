import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { AdminOrdersResponse } from '../../lib/types';
import { formatCount, type OrdersQuery, updateOrdersQuery } from '../order-helpers';

function PageControl({
  direction,
  disabled,
  href,
}: {
  direction: 'previous' | 'next';
  disabled: boolean;
  href: string;
}) {
  const previous = direction === 'previous';
  const label = previous ? 'السابق' : 'التالي';
  const Icon = previous ? ChevronRight : ChevronLeft;
  const classes = [
    'inline-flex min-h-11 items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold',
    disabled
      ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400'
      : 'border-slate-200 bg-white text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100',
  ].join(' ');

  if (disabled) {
    return <span aria-disabled="true" className={classes}><Icon aria-hidden="true" size={14} />{label}</span>;
  }

  return <Link href={href} className={classes}><Icon aria-hidden="true" size={14} />{label}</Link>;
}

export default function OrdersPagination({
  pagination,
  query,
}: {
  pagination: AdminOrdersResponse['pagination'];
  query: OrdersQuery;
}) {
  const totalPages = Math.max(1, Math.ceil(pagination.total_filtered / pagination.limit));
  const start = pagination.returned ? pagination.offset + 1 : 0;
  const end = pagination.offset + pagination.returned;

  return (
    <nav aria-label="صفحات الطلبات" className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row">
      <p className="text-xs font-medium text-slate-600">
        عرض <strong className="font-semibold text-slate-900">{formatCount(start)}–{formatCount(end)}</strong> من {formatCount(pagination.total_filtered)} طلب مطابق
      </p>
      <div className="flex items-center gap-2">
        <PageControl
          direction="previous"
          disabled={query.page <= 1}
          href={updateOrdersQuery(query, { page: query.page - 1 })}
        />
        <span className="min-w-20 text-center text-xs font-semibold text-slate-700" aria-current="page">
          {formatCount(query.page)} / {formatCount(totalPages)}
        </span>
        <PageControl
          direction="next"
          disabled={query.page >= totalPages}
          href={updateOrdersQuery(query, { page: query.page + 1 })}
        />
      </div>
    </nav>
  );
}
