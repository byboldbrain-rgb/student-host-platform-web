import Link from 'next/link';

import type { AdminOrdersResponse, OrderStatus } from '../../lib/types';
import { ORDER_STATUS_META, ORDER_STATUS_VALUES } from '../order-domain';
import { formatCount, type OrdersQuery, updateOrdersQuery } from '../order-helpers';

export default function OrdersStatusRail({
  summary,
  query,
}: {
  summary: AdminOrdersResponse['summary'];
  query: OrdersQuery;
}) {
  const options: Array<{ status: OrderStatus | null; label: string; count: number }> = [
    { status: null, label: 'كل الطلبات', count: summary.total },
    ...ORDER_STATUS_VALUES.map((status) => ({
      status,
      label: ORDER_STATUS_META[status].label,
      count: summary[status],
    })),
  ];

  return (
    <nav aria-label="تصفية الطلبات حسب الحالة" className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex min-w-max gap-2">
        {options.map((option) => {
          const selected = query.status === option.status;
          const meta = option.status ? ORDER_STATUS_META[option.status] : null;

          return (
            <Link
              key={option.status ?? 'all'}
              href={updateOrdersQuery(query, { status: option.status, page: 1 })}
              aria-current={selected ? 'page' : undefined}
              className={[
                'group inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100',
                selected
                  ? 'border-blue-600 bg-blue-600 text-white shadow-[0_5px_14px_rgba(37,99,235,0.16)]'
                  : meta?.railClass ?? 'border-slate-200 bg-slate-50 text-slate-800 hover:border-blue-200',
              ].join(' ')}
            >
              <span>{option.label}</span>
              <span className={[
                'inline-flex min-w-6 items-center justify-center rounded-lg px-1.5 py-0.5 tabular-nums',
                selected ? 'bg-white/20 text-white' : 'bg-white/80 text-slate-700',
              ].join(' ')}>
                {formatCount(option.count)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
