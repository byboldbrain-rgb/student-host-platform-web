import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ShoppingBag,
} from 'lucide-react';

import { EmptyState, MetricCard, PageHeader } from '../components/ui-kit';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/status-badge';
import { getAdminOrders } from '../lib/admin-data';
import type { OrderStatus, PaymentStatus } from '../lib/types';

const validOrderStatuses: OrderStatus[] = ['awaiting_whatsapp_send', 'waiting_confirmation', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
const validPaymentStatuses: PaymentStatus[] = ['pending', 'awaiting_payment', 'paid', 'failed', 'refunded', 'partially_refunded'];

const orderStatusOptions: Array<{ value: '' | OrderStatus; label: string }> = [
  { value: '', label: 'كل حالات الطلب' },
  { value: 'awaiting_whatsapp_send', label: 'في انتظار واتساب' },
  { value: 'waiting_confirmation', label: 'في انتظار التأكيد' },
  { value: 'confirmed', label: 'تم التأكيد' },
  { value: 'preparing', label: 'جاري التجهيز' },
  { value: 'out_for_delivery', label: 'خرج للتوصيل' },
  { value: 'delivered', label: 'تم التوصيل' },
  { value: 'cancelled', label: 'ملغي' },
];

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] ?? '' : value ?? ''; }
function parseStatus(value: string) { return validOrderStatuses.includes(value as OrderStatus) ? value as OrderStatus : null; }
function parsePaymentStatus(value: string) { return validPaymentStatuses.includes(value as PaymentStatus) ? value as PaymentStatus : null; }
function parsePage(value: string) { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : 1; }
function money(value: number | string, symbol: string) { const number = Number(value); return `${(Number.isFinite(number) ? number : 0).toLocaleString('ar-EG')} ${symbol}`; }
function formatDate(value: string) { return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Cairo' }).format(new Date(value)); }

function buildOrdersUrl(input: { search: string; status: string; paymentStatus: string; page: number }) {
  const params = new URLSearchParams();
  if (input.search) params.set('search', input.search);
  if (input.status) params.set('status', input.status);
  if (input.paymentStatus) params.set('payment_status', input.paymentStatus);
  if (input.page > 1) params.set('page', String(input.page));
  const query = params.toString();
  return query ? `/admin/now/orders?${query}` : '/admin/now/orders';
}

export default async function NavientyNowOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const search = first(params.search).trim();
  const statusValue = first(params.status);
  const paymentStatusValue = first(params.payment_status);
  const page = parsePage(first(params.page));
  const limit = 20;
  const data = await getAdminOrders({ search, status: parseStatus(statusValue), paymentStatus: parsePaymentStatus(paymentStatusValue), limit, offset: (page - 1) * limit });
  const totalPages = Math.max(1, Math.ceil(data.pagination.total_filtered / limit));
  const hasFilters = Boolean(search || statusValue || paymentStatusValue);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="التشغيل اليومي"
        title="الطلبات"
        description="ابدأ بالطلبات المنتظرة، وافتح أي طلب لمعرفة الخطوة التالية وتحديث حالته."
        icon={<ShoppingBag size={16} />}
        actions={<Link href={buildOrdersUrl({ search, status: statusValue, paymentStatus: paymentStatusValue, page })} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50"><RefreshCw size={15} /> تحديث</Link>}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="كل الطلبات" value={data.summary.total} href="/admin/now/orders" />
        <MetricCard label="في انتظار واتساب" value={data.summary.awaiting_whatsapp_send} href="/admin/now/orders?status=awaiting_whatsapp_send" tone="amber" />
        <MetricCard label="في انتظار التأكيد" value={data.summary.waiting_confirmation} href="/admin/now/orders?status=waiting_confirmation" tone="violet" />
        <MetricCard label="جاري التجهيز" value={data.summary.preparing} href="/admin/now/orders?status=preparing" tone="sky" />
        <MetricCard label="خرج للتوصيل" value={data.summary.out_for_delivery} href="/admin/now/orders?status=out_for_delivery" tone="emerald" />
        <MetricCard label="تم التوصيل" value={data.summary.delivered} href="/admin/now/orders?status=delivered" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form method="get" className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_220px_auto]">
          <label className="relative">
            <Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="search" defaultValue={search} placeholder="رقم الطلب، اسم العميل، الهاتف أو المتجر" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-3 text-sm font-semibold outline-none focus:border-violet-400 focus:bg-white" />
          </label>
          <select name="status" defaultValue={statusValue} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-violet-400">
            {orderStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select name="payment_status" defaultValue={paymentStatusValue} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-violet-400">
            <option value="">كل حالات الدفع</option>
            <option value="pending">معلّق</option><option value="awaiting_payment">في انتظار الدفع</option><option value="paid">مدفوع</option><option value="failed">فشل الدفع</option><option value="refunded">مسترد</option><option value="partially_refunded">مسترد جزئيًا</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" className="h-11 flex-1 rounded-xl bg-violet-600 px-5 text-sm font-black text-white hover:bg-violet-700">بحث</button>
            {hasFilters ? <Link href="/admin/now/orders" className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-500">مسح</Link> : null}
          </div>
        </form>
      </section>

      {data.items.length === 0 ? (
        <EmptyState title="لا توجد طلبات مطابقة" description={hasFilters ? 'جرّب مسح الفلاتر أو البحث بكلمة مختلفة.' : 'عند وصول أول طلب سيظهر هنا تلقائيًا.'} icon={<ShoppingBag size={22} />} />
      ) : (
        <>
          <section className="space-y-3 lg:hidden">
            {data.items.map((order) => (
              <Link key={order.id} href={`/admin/now/orders/${order.id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div><p dir="ltr" className="text-right text-sm font-black text-violet-700">{order.order_code}</p><p className="mt-1 text-xs font-bold text-slate-500">{order.store.icon ?? '🏪'} {order.store.name_ar}</p></div>
                  <p className="text-sm font-black text-slate-900">{money(order.summary.total_amount, order.summary.currency_symbol)}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2"><OrderStatusBadge status={order.status} /><PaymentStatusBadge status={order.payment_status} /></div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs"><div><p className="font-bold text-slate-400">العميل</p><p className="mt-1 font-black text-slate-700">{order.customer.name}</p></div><div><p className="font-bold text-slate-400">الوقت</p><p className="mt-1 font-black text-slate-700">{formatDate(order.created_at)}</p></div></div>
                <div className="mt-3 flex items-center gap-1 text-xs font-black text-violet-700">فتح الطلب <ArrowLeft size={14} /></div>
              </Link>
            ))}
          </section>

          <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-right">
                <thead className="bg-slate-50 text-[11px] text-slate-500"><tr><th className="px-5 py-4 font-black">الطلب</th><th className="px-5 py-4 font-black">المتجر</th><th className="px-5 py-4 font-black">العميل</th><th className="px-5 py-4 font-black">الإجمالي</th><th className="px-5 py-4 font-black">الحالة</th><th className="px-5 py-4 font-black">الدفع</th><th className="px-5 py-4 font-black">الوقت</th><th className="px-5 py-4" /></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((order) => (
                    <tr key={order.id} className="transition hover:bg-violet-50/30">
                      <td className="px-5 py-4"><p dir="ltr" className="text-right font-black text-violet-700">{order.order_code}</p><p className="mt-1 text-[11px] font-bold text-slate-400">{order.summary.item_count} منتج</p></td>
                      <td className="px-5 py-4"><p className="font-black text-slate-800">{order.store.icon ?? '🏪'} {order.store.name_ar}</p></td>
                      <td className="px-5 py-4"><p className="font-bold text-slate-800">{order.customer.name}</p><p dir="ltr" className="mt-1 text-right text-[11px] text-slate-400">{order.customer.phone}</p></td>
                      <td className="px-5 py-4 font-black text-slate-900">{money(order.summary.total_amount, order.summary.currency_symbol)}</td>
                      <td className="px-5 py-4"><OrderStatusBadge status={order.status} /></td>
                      <td className="px-5 py-4"><PaymentStatusBadge status={order.payment_status} /></td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-500">{formatDate(order.created_at)}</td>
                      <td className="px-5 py-4"><Link href={`/admin/now/orders/${order.id}`} className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-violet-700">فتح <ChevronLeft size={14} /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <section className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row">
        <p className="text-xs font-semibold text-slate-500">عرض {data.pagination.returned.toLocaleString('ar-EG')} من {data.pagination.total_filtered.toLocaleString('ar-EG')} طلب مطابق</p>
        <div className="flex items-center gap-2">
          <Link aria-disabled={page <= 1} href={page <= 1 ? '#' : buildOrdersUrl({ search, status: statusValue, paymentStatus: paymentStatusValue, page: page - 1 })} className={`inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-xs font-black ${page <= 1 ? 'pointer-events-none border-slate-100 text-slate-300' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}><ChevronRight size={14} /> السابق</Link>
          <span className="px-2 text-xs font-black text-slate-500">{page.toLocaleString('ar-EG')} / {totalPages.toLocaleString('ar-EG')}</span>
          <Link aria-disabled={page >= totalPages} href={page >= totalPages ? '#' : buildOrdersUrl({ search, status: statusValue, paymentStatus: paymentStatusValue, page: page + 1 })} className={`inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-xs font-black ${page >= totalPages ? 'pointer-events-none border-slate-100 text-slate-300' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>التالي <ChevronLeft size={14} /></Link>
        </div>
      </section>
    </div>
  );
}
