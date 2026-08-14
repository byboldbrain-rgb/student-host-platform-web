import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ShoppingBag,
} from 'lucide-react';

import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from '../components/status-badge';
import { getAdminOrders } from '../lib/admin-data';
import type {
  OrderStatus,
  PaymentStatus,
} from '../lib/types';

const validOrderStatuses: OrderStatus[] = [
  'awaiting_whatsapp_send',
  'waiting_confirmation',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const validPaymentStatuses: PaymentStatus[] = [
  'pending',
  'awaiting_payment',
  'paid',
  'failed',
  'refunded',
  'partially_refunded',
];

const orderStatusOptions: Array<{
  value: '' | OrderStatus;
  label: string;
}> = [
  { value: '', label: 'كل حالات الطلب' },
  {
    value: 'awaiting_whatsapp_send',
    label: 'في انتظار إرسال واتساب',
  },
  {
    value: 'waiting_confirmation',
    label: 'في انتظار التأكيد',
  },
  { value: 'confirmed', label: 'تم التأكيد' },
  { value: 'preparing', label: 'جاري التجهيز' },
  {
    value: 'out_for_delivery',
    label: 'خرج للتوصيل',
  },
  { value: 'delivered', label: 'تم التوصيل' },
  { value: 'cancelled', label: 'ملغي' },
];

function getStringParam(
  value: string | string[] | undefined,
): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function parseStatus(
  value: string,
): OrderStatus | null {
  return validOrderStatuses.includes(value as OrderStatus)
    ? (value as OrderStatus)
    : null;
}

function parsePaymentStatus(
  value: string,
): PaymentStatus | null {
  return validPaymentStatuses.includes(value as PaymentStatus)
    ? (value as PaymentStatus)
    : null;
}

function parsePage(value: string): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Cairo',
  }).format(new Date(value));
}

function numberValue(value: number | string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildOrdersUrl(input: {
  search: string;
  status: string;
  paymentStatus: string;
  page: number;
}) {
  const params = new URLSearchParams();

  if (input.search) params.set('search', input.search);
  if (input.status) params.set('status', input.status);
  if (input.paymentStatus) {
    params.set('payment_status', input.paymentStatus);
  }
  if (input.page > 1) params.set('page', String(input.page));

  const query = params.toString();
  return query ? `/admin/now/orders?${query}` : '/admin/now/orders';
}

export default async function NavientyNowOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const search = getStringParam(params.search).trim();
  const statusValue = getStringParam(params.status);
  const paymentStatusValue = getStringParam(
    params.payment_status,
  );
  const page = parsePage(getStringParam(params.page));

  const limit = 20;
  const offset = (page - 1) * limit;

  const data = await getAdminOrders({
    search,
    status: parseStatus(statusValue),
    paymentStatus: parsePaymentStatus(paymentStatusValue),
    limit,
    offset,
  });

  const totalPages = Math.max(
    1,
    Math.ceil(data.pagination.total_filtered / limit),
  );

  const stats = [
    {
      label: 'كل الطلبات',
      value: data.summary.total,
      href: '/admin/now/orders',
    },
    {
      label: 'في انتظار واتساب',
      value: data.summary.awaiting_whatsapp_send,
      href: '/admin/now/orders?status=awaiting_whatsapp_send',
    },
    {
      label: 'في انتظار التأكيد',
      value: data.summary.waiting_confirmation,
      href: '/admin/now/orders?status=waiting_confirmation',
    },
    {
      label: 'جاري التجهيز',
      value: data.summary.preparing,
      href: '/admin/now/orders?status=preparing',
    },
    {
      label: 'خرج للتوصيل',
      value: data.summary.out_for_delivery,
      href: '/admin/now/orders?status=out_for_delivery',
    },
    {
      label: 'تم التوصيل',
      value: data.summary.delivered,
      href: '/admin/now/orders?status=delivered',
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-violet-600">
            Operations
          </p>

          <h2 className="mt-1 text-3xl font-black">
            طلبات Navienty Now
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            الأسعار والحالات والبيانات المعروضة قادمة من Supabase.
          </p>
        </div>

        <Link
          href={buildOrdersUrl({
            search,
            status: statusValue,
            paymentStatus: paymentStatusValue,
            page,
          })}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
        >
          <RefreshCw size={17} />
          تحديث
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
          >
            <p className="text-xs font-bold text-slate-500">
              {stat.label}
            </p>

            <p className="mt-2 text-3xl font-black text-slate-950">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px_220px_auto]"
      >
        <label className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            name="search"
            defaultValue={search}
            placeholder="ابحث برقم الطلب أو العميل أو الهاتف أو المتجر"
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-sm outline-none transition focus:border-violet-400 focus:bg-white"
          />
        </label>

        <select
          name="status"
          defaultValue={statusValue}
          className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-violet-400"
        >
          {orderStatusOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <select
          name="payment_status"
          defaultValue={paymentStatusValue}
          className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-violet-400"
        >
          <option value="">كل حالات الدفع</option>
          <option value="pending">معلّق</option>
          <option value="awaiting_payment">
            في انتظار الدفع
          </option>
          <option value="paid">مدفوع</option>
          <option value="failed">فشل الدفع</option>
          <option value="refunded">مسترد</option>
          <option value="partially_refunded">
            مسترد جزئيًا
          </option>
        </select>

        <button
          type="submit"
          className="h-12 rounded-xl bg-violet-600 px-6 text-sm font-black text-white hover:bg-violet-700"
        >
          تطبيق الفلاتر
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {data.items.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <ShoppingBag size={30} />
            </div>

            <h3 className="mt-4 text-xl font-black">
              لا توجد طلبات مطابقة
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              جرّب إزالة بعض الفلاتر أو إنشاء طلب جديد من التطبيق.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-right">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-black">الطلب</th>
                  <th className="px-5 py-4 font-black">المتجر</th>
                  <th className="px-5 py-4 font-black">العميل</th>
                  <th className="px-5 py-4 font-black">الإجمالي</th>
                  <th className="px-5 py-4 font-black">حالة الطلب</th>
                  <th className="px-5 py-4 font-black">الدفع</th>
                  <th className="px-5 py-4 font-black">وقت الإنشاء</th>
                  <th className="px-5 py-4 font-black"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {data.items.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-black text-violet-700">
                        {order.order_code}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {order.summary.item_count} منتجات
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-xl">
                          {order.store.icon ?? '🏪'}
                        </span>

                        <span className="font-bold">
                          {order.store.name_ar}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-bold">
                        {order.customer.name}
                      </p>

                      <p
                        dir="ltr"
                        className="mt-1 text-right text-xs text-slate-500"
                      >
                        {order.customer.phone}
                      </p>
                    </td>

                    <td className="px-5 py-4 font-black">
                      {numberValue(order.summary.total_amount).toLocaleString(
                        'ar-EG',
                      )}{' '}
                      {order.summary.currency_symbol}
                    </td>

                    <td className="px-5 py-4">
                      <OrderStatusBadge status={order.status} />
                    </td>

                    <td className="px-5 py-4">
                      <PaymentStatusBadge
                        status={order.payment_status}
                      />
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(order.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/now/orders/${order.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-violet-700"
                      >
                        التفاصيل
                        <ChevronLeft size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row">
          <p className="text-xs text-slate-500">
            عرض {data.pagination.returned} من{' '}
            {data.pagination.total_filtered} طلب مطابق
          </p>

          <div className="flex items-center gap-2">
            <Link
              aria-disabled={page <= 1}
              href={
                page <= 1
                  ? '#'
                  : buildOrdersUrl({
                      search,
                      status: statusValue,
                      paymentStatus: paymentStatusValue,
                      page: page - 1,
                    })
              }
              className={[
                'inline-flex h-10 items-center gap-1 rounded-xl border px-3 text-xs font-black',
                page <= 1
                  ? 'pointer-events-none border-slate-100 text-slate-300'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100',
              ].join(' ')}
            >
              <ChevronRight size={16} />
              السابق
            </Link>

            <span className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black">
              صفحة {page} من {totalPages}
            </span>

            <Link
              aria-disabled={page >= totalPages}
              href={
                page >= totalPages
                  ? '#'
                  : buildOrdersUrl({
                      search,
                      status: statusValue,
                      paymentStatus: paymentStatusValue,
                      page: page + 1,
                    })
              }
              className={[
                'inline-flex h-10 items-center gap-1 rounded-xl border px-3 text-xs font-black',
                page >= totalPages
                  ? 'pointer-events-none border-slate-100 text-slate-300'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100',
              ].join(' ')}
            >
              التالي
              <ChevronLeft size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
