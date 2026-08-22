import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ShoppingBag,
} from 'lucide-react';

import { EmptyState, MetricCard, Notice, PageHeader } from '../components/ui-kit';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/status-badge';
import { getAdminOrders, requireNowAdmin } from '../lib/admin-data';
import type { OrderStatus, PaymentStatus } from '../lib/types';
import QuickOrderActions from './quick-order-actions';

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
  const quickSuccess = first(params.quick_success);
  const quickError = first(params.quick_error);
  const page = parsePage(first(params.page));
  const limit = 20;
  const [data, { access }] = await Promise.all([
    getAdminOrders({ search, status: parseStatus(statusValue), paymentStatus: parsePaymentStatus(paymentStatusValue), limit, offset: (page - 1) * limit }),
    requireNowAdmin(),
  ]);
  const totalPages = Math.max(1, Math.ceil(data.pagination.total_filtered / limit));
  const hasFilters = Boolean(search || statusValue || paymentStatusValue);
  const canManageOrders = access.permissions.manage_orders;
  const currentOrdersUrl = buildOrdersUrl({ search, status: statusValue, paymentStatus: paymentStatusValue, page });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="التشغيل اليومي"
        title="الطلبات"
        description="حدّث المرحلة التالية أو ألغِ الطلب مباشرة من القائمة، وافتح التفاصيل فقط لما تحتاج مراجعة أعمق."
        icon={<ShoppingBag size={16} />}
        actions={<Link href={currentOrdersUrl} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw size={15} /> تحديث</Link>}
      />

      {quickSuccess ? <Notice tone="success" title={quickSuccess} /> : null}
      {quickError ? <Notice tone="warning" title="تعذر تنفيذ الإجراء">{quickError}</Notice> : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="كل الطلبات" value={data.summary.total} href="/admin/now/orders" />
        <MetricCard label="في انتظار واتساب" value={data.summary.awaiting_whatsapp_send} href="/admin/now/orders?status=awaiting_whatsapp_send" tone="amber" />
        <MetricCard label="في انتظار التأكيد" value={data.summary.waiting_confirmation} href="/admin/now/orders?status=waiting_confirmation" tone="violet" />
        <MetricCard label="جاري التجهيز" value={data.summary.preparing} href="/admin/now/orders?status=preparing" tone="sky" />
        <MetricCard label="خرج للتوصيل" value={data.summary.out_for_delivery} href="/admin/now/orders?status=out_for_delivery" tone="emerald" />
        <MetricCard label="تم التوصيل" value={data.summary.delivered} href="/admin/now/orders?status=delivered" />
      </section>

      <section className="rounded-[28px] border border-black/[0.06] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <form method="get" className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_220px_auto]">
          <label className="relative">
            <Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="search" defaultValue={search} placeholder="رقم الطلب، اسم العميل، الهاتف أو المتجر" className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-10 pl-3 text-sm font-medium outline-none focus:border-blue-400 focus:bg-white" />
          </label>
          <select name="status" defaultValue={statusValue} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-400">
            {orderStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select name="payment_status" defaultValue={paymentStatusValue} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-400">
            <option value="">كل حالات الدفع</option>
            <option value="pending">معلّق</option><option value="awaiting_payment">في انتظار الدفع</option><option value="paid">مدفوع</option><option value="failed">فشل الدفع</option><option value="refunded">مسترد</option><option value="partially_refunded">مسترد جزئيًا</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" className="h-11 flex-1 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] hover:bg-blue-700">بحث</button>
            {hasFilters ? <Link href="/admin/now/orders" className="inline-flex h-11 items-center rounded-full border border-slate-200 px-3 text-xs font-semibold text-slate-500">مسح</Link> : null}
          </div>
        </form>
      </section>

      {data.items.length === 0 ? (
        <EmptyState title="لا توجد طلبات مطابقة" description={hasFilters ? 'جرّب مسح الفلاتر أو البحث بكلمة مختلفة.' : 'عند وصول أول طلب سيظهر هنا تلقائيًا.'} icon={<ShoppingBag size={22} />} />
      ) : (
        <>
          <section className="space-y-3 lg:hidden">
            {data.items.map((order) => (
              <article key={order.id} className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <Link href={`/admin/now/orders/${order.id}`} className="block p-4 active:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div><p dir="ltr" className="text-right text-sm font-semibold text-blue-700">{order.order_code}</p><p className="mt-1 text-xs font-medium text-slate-500">{order.store.icon ?? '🏪'} {order.store.name_ar}</p></div>
                    <p className="text-sm font-semibold text-slate-900">{money(order.summary.total_amount, order.summary.currency_symbol)}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2"><OrderStatusBadge status={order.status} /><PaymentStatusBadge status={order.payment_status} /></div>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs"><div><p className="font-medium text-slate-400">العميل</p><p className="mt-1 font-semibold text-slate-700">{order.customer.name}</p></div><div><p className="font-medium text-slate-400">الوقت</p><p className="mt-1 font-semibold text-slate-700">{formatDate(order.created_at)}</p></div></div>
                </Link>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                  {canManageOrders ? <QuickOrderActions orderId={order.id} orderCode={order.order_code} status={order.status} returnTo={currentOrdersUrl} /> : <span />}
                  <Link href={`/admin/now/orders/${order.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">التفاصيل <ArrowLeft size={14} /></Link>
                </div>
              </article>
            ))}
          </section>

          <section className="hidden overflow-hidden rounded-[30px] border border-black/[0.06] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.05)] lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-right">
                <thead className="bg-[#f5f7f9] text-[11px] text-slate-500"><tr><th className="px-5 py-4 font-semibold">الطلب</th><th className="px-5 py-4 font-semibold">المتجر</th><th className="px-5 py-4 font-semibold">العميل</th><th className="px-5 py-4 font-semibold">الإجمالي</th><th className="px-5 py-4 font-semibold">الحالة</th><th className="px-5 py-4 font-semibold">الدفع</th><th className="px-5 py-4 font-semibold">الوقت</th><th className="px-5 py-4 font-semibold">إجراءات سريعة</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((order) => (
                    <tr key={order.id} className="transition hover:bg-blue-50/25">
                      <td className="px-5 py-4"><Link href={`/admin/now/orders/${order.id}`} className="block"><p dir="ltr" className="text-right font-semibold text-blue-700">{order.order_code}</p><p className="mt-1 text-[11px] font-medium text-slate-400">{order.summary.item_count} منتج</p></Link></td>
                      <td className="px-5 py-4"><p className="font-semibold text-slate-800">{order.store.icon ?? '🏪'} {order.store.name_ar}</p></td>
                      <td className="px-5 py-4"><p className="font-semibold text-slate-800">{order.customer.name}</p><p dir="ltr" className="mt-1 text-right text-[11px] text-slate-400">{order.customer.phone}</p></td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{money(order.summary.total_amount, order.summary.currency_symbol)}</td>
                      <td className="px-5 py-4"><OrderStatusBadge status={order.status} /></td>
                      <td className="px-5 py-4"><PaymentStatusBadge status={order.payment_status} /></td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-500">{formatDate(order.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex min-w-[220px] flex-wrap items-center gap-2">
                          {canManageOrders ? <QuickOrderActions orderId={order.id} orderCode={order.order_code} status={order.status} returnTo={currentOrdersUrl} /> : null}
                          <Link href={`/admin/now/orders/${order.id}`} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-blue-700">فتح <ChevronLeft size={13} /></Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <section className="flex flex-col items-center justify-between gap-3 rounded-[24px] border border-black/[0.06] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:flex-row">
        <p className="text-xs font-medium text-slate-500">عرض {data.pagination.returned.toLocaleString('ar-EG')} من {data.pagination.total_filtered.toLocaleString('ar-EG')} طلب مطابق</p>
        <div className="flex items-center gap-2">
          <Link aria-disabled={page <= 1} href={page <= 1 ? '#' : buildOrdersUrl({ search, status: statusValue, paymentStatus: paymentStatusValue, page: page - 1 })} className={`inline-flex h-9 items-center gap-1 rounded-full border px-3 text-xs font-semibold ${page <= 1 ? 'pointer-events-none border-slate-100 text-slate-300' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}><ChevronRight size={14} /> السابق</Link>
          <span className="px-2 text-xs font-semibold text-slate-500">{page.toLocaleString('ar-EG')} / {totalPages.toLocaleString('ar-EG')}</span>
          <Link aria-disabled={page >= totalPages} href={page >= totalPages ? '#' : buildOrdersUrl({ search, status: statusValue, paymentStatus: paymentStatusValue, page: page + 1 })} className={`inline-flex h-9 items-center gap-1 rounded-full border px-3 text-xs font-semibold ${page >= totalPages ? 'pointer-events-none border-slate-100 text-slate-300' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>التالي <ChevronLeft size={14} /></Link>
        </div>
      </section>
    </div>
  );
}
