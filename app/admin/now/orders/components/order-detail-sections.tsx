import type { ReactNode } from 'react';
import { PackageCheck, type LucideIcon } from 'lucide-react';

import type { AdminOrderDetail } from '../../lib/types';
import { getOrderStatusLabel } from '../order-domain';
import {
  formatCount,
  formatMoney,
  formatOrderDateTime,
} from '../order-helpers';

function actorLabel(value: string) {
  const labels: Record<string, string> = {
    admin: 'الإدارة',
    employee: 'فريق التشغيل',
    system: 'النظام',
    customer: 'العميل',
    store: 'المتجر',
    courier: 'التوصيل',
  };
  return labels[value] ?? value.replaceAll('_', ' ');
}

export function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
        <Icon aria-hidden="true" size={17} />
      </span>
      <h2 className="text-sm font-semibold text-slate-950">{children}</h2>
    </div>
  );
}

export function StatusTimeline({ order }: { order: AdminOrderDetail }) {
  if (!order.status_history.length) {
    return <p className="rounded-xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-600">لا توجد إدخالات في سجل الحالات.</p>;
  }

  return (
    <ol className="mt-4 space-y-3">
      {order.status_history.map((item, index) => (
        <li key={item.id} className="relative flex gap-3">
          {index < order.status_history.length - 1 ? (
            <span aria-hidden="true" className="absolute right-[7px] top-5 h-[calc(100%+8px)] w-px bg-slate-200" />
          ) : null}
          <span aria-hidden="true" className="relative z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full border-4 border-white bg-blue-600 ring-1 ring-blue-200" />
          <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start">
              <p className="text-xs font-semibold text-slate-900">
                {item.old_status
                  ? `من «${getOrderStatusLabel(item.old_status)}» إلى «${getOrderStatusLabel(item.new_status)}»`
                  : getOrderStatusLabel(item.new_status)}
              </p>
              <time dateTime={item.created_at} className="shrink-0 text-[10px] font-medium text-slate-500">
                {formatOrderDateTime(item.created_at)}
              </time>
            </div>
            {item.note ? <p className="mt-2 text-xs font-medium leading-5 text-slate-600">{item.note}</p> : null}
            <p className="mt-2 text-[10px] font-medium text-slate-500">بواسطة: {actorLabel(item.changed_by_type)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function OrderItems({ order }: { order: AdminOrderDetail }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <SectionHeading icon={PackageCheck}>محتويات الطلب</SectionHeading>
        <span className="text-xs font-semibold text-slate-600">
          {formatCount(order.items.reduce((sum, item) => sum + item.quantity, 0))} قطعة
        </span>
      </div>
      <ul className="divide-y divide-slate-100">
        {order.items.map((item) => (
          <li key={item.id} className="flex flex-col justify-between gap-3 px-4 py-4 sm:flex-row sm:items-start sm:px-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-6 text-slate-950">
                {item.name_ar}{item.variant_name_ar ? ` — ${item.variant_name_ar}` : ''}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-600">
                الكمية: {formatCount(item.quantity)}{item.sku ? <span> · <bdi dir="ltr">{item.sku}</bdi></span> : null}
              </p>
              {item.requires_prescription || item.is_age_restricted ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.requires_prescription ? <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-950">يتطلب روشتة</span> : null}
                  {item.is_age_restricted ? <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-950">مقيد بالعمر</span> : null}
                </div>
              ) : null}
            </div>
            <div className="shrink-0 sm:text-left">
              <p className="text-sm font-semibold tabular-nums text-slate-950">
                {formatMoney(item.line_total, order.summary.currency_symbol, order.summary.currency_code)}
              </p>
              <p className="mt-1 text-[10px] font-medium text-slate-500">
                {formatMoney(item.unit_price, order.summary.currency_symbol, order.summary.currency_code)} للوحدة
              </p>
            </div>
          </li>
        ))}
      </ul>
      <dl className="space-y-2 border-t border-slate-200 bg-slate-50 px-4 py-4 text-sm sm:px-5">
        <div className="flex justify-between gap-4"><dt className="font-medium text-slate-600">المنتجات</dt><dd className="font-semibold tabular-nums text-slate-900">{formatMoney(order.summary.subtotal, order.summary.currency_symbol, order.summary.currency_code)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="font-medium text-slate-600">التوصيل</dt><dd className="font-semibold tabular-nums text-slate-900">{formatMoney(order.summary.delivery_fee, order.summary.currency_symbol, order.summary.currency_code)}</dd></div>
        <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-base"><dt className="font-semibold text-slate-950">الإجمالي</dt><dd className="font-semibold tabular-nums text-blue-800">{formatMoney(order.summary.total_amount, order.summary.currency_symbol, order.summary.currency_code)}</dd></div>
      </dl>
    </section>
  );
}
