import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  ReceiptText,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react';

import { Notice, PageHeader } from '../../components/ui-kit';
import { getOrderStatusLabel, OrderStatusBadge, PaymentStatusBadge } from '../../components/status-badge';
import SubmitButton from '../../components/submit-button';
import { getAdminOrder, requireNowAdmin } from '../../lib/admin-data';
import type { AdminOrderDetail, OrderStatus } from '../../lib/types';
import { transitionOrderStatus } from './actions';

function formatDate(value: string | null) { if (!value) return '—'; return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Cairo' }).format(new Date(value)); }
function numberValue(value: number | string) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function money(value: number | string, symbol: string) { return `${numberValue(value).toLocaleString('ar-EG')} ${symbol}`; }
function phoneDigits(value: string) { return value.replace(/\D/g, ''); }

function nextTransition(status: OrderStatus): { status: OrderStatus; label: string; description: string; note: string } | null {
  switch (status) {
    case 'waiting_confirmation': return { status: 'confirmed', label: 'تأكيد الطلب', description: 'أكد بعد التأكد من توافر المنتجات والمبلغ.', note: 'تم تأكيد توافر المنتجات والمبلغ.' };
    case 'confirmed': return { status: 'preparing', label: 'بدء التجهيز', description: 'اضغط عندما يبدأ المتجر تجهيز الطلب.', note: 'بدأ المتجر تجهيز الطلب.' };
    case 'preparing': return { status: 'out_for_delivery', label: 'خرج للتوصيل', description: 'اضغط بعد تسليم الطلب للمندوب.', note: 'تم تسليم الطلب للمندوب.' };
    case 'out_for_delivery': return { status: 'delivered', label: 'تأكيد التوصيل', description: 'اضغط بعد التأكد أن العميل استلم الطلب.', note: 'تم توصيل الطلب بنجاح.' };
    default: return null;
  }
}
function canCancel(status: OrderStatus) { return !['delivered', 'cancelled'].includes(status); }

function Timeline({ order }: { order: AdminOrderDetail }) {
  if (order.status_history.length === 0) return <p className="text-sm font-semibold text-slate-500">لا يوجد سجل حالات بعد.</p>;
  return <div className="space-y-4">{order.status_history.map((item, index) => (
    <div key={item.id} className="relative flex gap-3">
      {index < order.status_history.length - 1 ? <div className="absolute right-[7px] top-5 h-[calc(100%+8px)] w-px bg-slate-200" /> : null}
      <div className="relative z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full border-4 border-white bg-violet-600 shadow" />
      <div className="min-w-0 flex-1 rounded-xl bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-black text-slate-800">{item.old_status ? `${getOrderStatusLabel(item.old_status)} ← ${getOrderStatusLabel(item.new_status)}` : getOrderStatusLabel(item.new_status)}</p><p className="text-[11px] font-semibold text-slate-400">{formatDate(item.created_at)}</p></div>
        {item.note ? <p className="mt-2 text-xs font-semibold leading-6 text-slate-500">{item.note}</p> : null}
      </div>
    </div>
  ))}</div>;
}

export default async function NavientyNowOrderDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ id }, query, { access }] = await Promise.all([params, searchParams, requireNowAdmin()]);
  let order: AdminOrderDetail;
  try { order = await getAdminOrder(id); } catch { notFound(); }
  const errorRaw = Array.isArray(query.error) ? query.error[0] : query.error;
  const successRaw = Array.isArray(query.success) ? query.success[0] : query.success;
  const transition = nextTransition(order.status);
  const manageOrders = access.permissions.manage_orders;
  const whatsappUrl = `https://wa.me/${phoneDigits(order.customer.phone)}`;

  return (
    <div className="space-y-6">
      <div><Link href="/admin/now/orders" className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-violet-700"><ArrowRight size={15} /> العودة للطلبات</Link></div>
      <PageHeader
        eyebrow="تفاصيل الطلب"
        title={`الطلب ${order.order_code}`}
        description={`تم إنشاؤه ${formatDate(order.timestamps.created_at)} · ${order.store.name_ar}`}
        actions={<div className="flex flex-wrap items-center gap-2"><OrderStatusBadge status={order.status} /><PaymentStatusBadge status={order.payment_status} /></div>}
      />

      {errorRaw ? <Notice tone="warning" title="تعذر تنفيذ الخطوة">{decodeURIComponent(errorRaw)}</Notice> : null}
      {successRaw ? <Notice tone="success" title={decodeURIComponent(successRaw)} /> : null}
      {!manageOrders ? <Notice tone="info" title="صلاحية مشاهدة فقط">يمكنك مراجعة كل تفاصيل الطلب لكن لا يمكنك تغيير حالته.</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Store size={18} /></span><div><p className="text-[10px] font-black text-slate-400">المتجر</p><p className="mt-1 font-black text-slate-800">{order.store.icon ?? '🏪'} {order.store.name_ar}</p></div></div></article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><ReceiptText size={18} /></span><div><p className="text-[10px] font-black text-slate-400">الإجمالي</p><p className="mt-1 text-lg font-black text-slate-900">{money(order.summary.total_amount, order.summary.currency_symbol)}</p></div></div></article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-1"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><PackageCheck size={18} /></span><div><p className="text-[10px] font-black text-slate-400">عدد المنتجات</p><p className="mt-1 text-lg font-black text-slate-900">{order.items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString('ar-EG')}</p></div></div></article>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-slate-950">محتويات الطلب</h2></div>
            <div className="divide-y divide-slate-100">{order.items.map((item) => (
              <div key={item.id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0"><p className="font-black text-slate-800">{item.name_ar}{item.variant_name_ar ? ` — ${item.variant_name_ar}` : ''}</p><p className="mt-1 text-xs font-semibold text-slate-400">الكمية: {item.quantity}{item.sku ? ` · ${item.sku}` : ''}</p>{item.requires_prescription || item.is_age_restricted ? <div className="mt-2 flex flex-wrap gap-2">{item.requires_prescription ? <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-800">يحتاج روشتة</span> : null}{item.is_age_restricted ? <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-800">تحقق من العمر</span> : null}</div> : null}</div>
                <div className="shrink-0 text-left"><p className="font-black text-slate-900">{money(item.line_total, order.summary.currency_symbol)}</p><p className="mt-1 text-[11px] font-semibold text-slate-400">{money(item.unit_price, order.summary.currency_symbol)} للوحدة</p></div>
              </div>
            ))}</div>
            <div className="space-y-2 bg-slate-50 p-5 text-sm"><div className="flex justify-between"><span className="font-semibold text-slate-500">المنتجات</span><span className="font-black">{money(order.summary.subtotal, order.summary.currency_symbol)}</span></div><div className="flex justify-between"><span className="font-semibold text-slate-500">التوصيل</span><span className="font-black">{money(order.summary.delivery_fee, order.summary.currency_symbol)}</span></div><div className="flex justify-between border-t border-slate-200 pt-3 text-base"><span className="font-black">الإجمالي</span><span className="font-black text-violet-700">{money(order.summary.total_amount, order.summary.currency_symbol)}</span></div></div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Clock3 size={17} className="text-violet-700" /><h2 className="font-black text-slate-950">سجل الطلب</h2></div><div className="mt-5"><Timeline order={order} /></div></section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          {manageOrders ? (
            <section className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black text-violet-600">الخطوة التالية</p>
              {transition ? <><h2 className="mt-2 text-xl font-black text-slate-950">{transition.label}</h2><p className="mt-2 text-xs font-semibold leading-6 text-slate-500">{transition.description}</p><form action={transitionOrderStatus} className="mt-4"><input type="hidden" name="order_id" value={order.id} /><input type="hidden" name="new_status" value={transition.status} /><input type="hidden" name="note" value={transition.note} /><SubmitButton idleText={transition.label} className="w-full bg-violet-600 text-white hover:bg-violet-700" /></form></> : order.status === 'awaiting_whatsapp_send' ? <><h2 className="mt-2 text-lg font-black">تواصل مع العميل على واتساب</h2><p className="mt-2 text-xs font-semibold leading-6 text-slate-500">الطلب لم ينتقل بعد لمرحلة التأكيد.</p><a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white"><MessageCircle size={16} /> فتح واتساب</a></> : <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-black text-emerald-800"><CheckCircle2 size={18} /> لا توجد خطوة تشغيلية مطلوبة</div>}
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2"><UserRound size={17} className="text-violet-700" /><h2 className="font-black">العميل</h2></div>
            <p className="mt-4 text-base font-black text-slate-900">{order.customer.name}</p><p dir="ltr" className="mt-1 text-right text-sm font-semibold text-slate-500">{order.customer.phone}</p>
            <div className="mt-4 grid grid-cols-2 gap-2"><a href={`tel:${order.customer.phone}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700"><Phone size={14} /> اتصال</a><a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800"><MessageCircle size={14} /> واتساب</a></div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><MapPin size={17} className="text-violet-700" /><h2 className="font-black">عنوان التوصيل</h2></div><p className="mt-4 text-sm font-black text-slate-800">{order.delivery.area_name_ar}</p><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{order.delivery.address}</p>{order.delivery.landmark ? <p className="mt-2 text-xs font-semibold text-slate-400">علامة مميزة: {order.delivery.landmark}</p> : null}{order.delivery.notes ? <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold leading-6 text-amber-900">ملاحظة العميل: {order.delivery.notes}</div> : null}</section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><ReceiptText size={17} className="text-violet-700" /><h2 className="font-black">الدفع</h2></div><div className="mt-4 flex items-center justify-between gap-3"><div><p className="text-sm font-black text-slate-800">{order.payment.payment_method_name}</p><p className="mt-1 text-xs font-semibold text-slate-400">{money(order.summary.total_amount, order.summary.currency_symbol)}</p></div><PaymentStatusBadge status={order.payment_status} /></div></section>

          {manageOrders && canCancel(order.status) ? <details className="rounded-2xl border border-rose-100 bg-white"><summary className="cursor-pointer list-none p-4 text-xs font-black text-rose-700">إلغاء الطلب</summary><form action={transitionOrderStatus} className="border-t border-rose-100 p-4"><input type="hidden" name="order_id" value={order.id} /><input type="hidden" name="new_status" value="cancelled" /><input type="hidden" name="note" value="إلغاء الطلب بواسطة فريق تشغيل Navienty Now." /><label className="text-xs font-black text-slate-700">سبب الإلغاء<textarea required minLength={3} name="cancellation_reason" placeholder="مثال: المنتج غير متوفر" className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-rose-300" /></label><SubmitButton idleText="تأكيد إلغاء الطلب" className="mt-3 w-full bg-rose-600 text-white hover:bg-rose-700" /></form></details> : null}
        </aside>
      </div>
    </div>
  );
}
