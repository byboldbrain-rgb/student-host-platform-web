import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock3,
  Copy,
  MapPin,
  MessageCircle,
  Phone,
  ReceiptText,
  ShieldAlert,
  UserRound,
} from 'lucide-react';

import { OrderStatusBadge, PaymentStatusBadge } from '../../components/status-badge';
import {
  AdminOrderNotFoundError,
  getAdminOrderWithClient,
  requireNowAdmin,
} from '../../lib/admin-data';
import type { AdminOrderDetail } from '../../lib/types';
import {
  OrderItems,
  SectionHeading,
  StatusTimeline,
} from '../components/order-detail-sections';
import OrdersClientEnhancements, { RefreshOrdersButton } from '../components/orders-client-enhancements';
import { getNextOrderAction } from '../order-domain';
import {
  formatMoney,
  formatOrderAge,
  formatOrderDateTime,
  phoneDigits,
  safeOrdersReturnPath,
  type OrdersSearchParams,
} from '../order-helpers';
import QuickOrderActions from '../quick-order-actions';

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NavientyNowOrderDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<OrdersSearchParams>;
}) {
  const [{ id }, query, { supabase, access }] = await Promise.all([
    params,
    searchParams,
    requireNowAdmin(),
  ]);

  if (!access.permissions.view_orders) {
    redirect('/admin/unauthorized');
  }

  let order: AdminOrderDetail;
  try {
    order = await getAdminOrderWithClient(supabase, id);
  } catch (error) {
    if (error instanceof AdminOrderNotFoundError) notFound();
    throw error;
  }

  const returnTo = safeOrdersReturnPath(first(query.return_to));
  const operation = getNextOrderAction(order.status);
  const requiresPrescription = order.items.some((item) => item.requires_prescription);
  const hasAgeRestriction = order.items.some((item) => item.is_age_restricted);
  const whatsappNumber = phoneDigits(order.customer.phone);

  return (
    <div className="orders-operations space-y-4 text-slate-950">
      <OrdersClientEnhancements />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={returnTo} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
          <ArrowRight aria-hidden="true" size={15} />
          العودة لنفس قائمة الطلبات
        </Link>
        <RefreshOrdersButton />
      </div>

      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-blue-800">تفاصيل الطلب</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                الطلب <bdi dir="ltr">{order.order_code}</bdi>
              </h1>
              <button
                type="button"
                data-copy-value={order.order_code}
                aria-label={`نسخ كود الطلب ${order.order_code}`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              >
                <Copy aria-hidden="true" size={15} />
              </button>
            </div>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
              {order.store.name_ar} · <time dateTime={order.timestamps.created_at}>{formatOrderDateTime(order.timestamps.created_at)} بتوقيت القاهرة</time> · <span data-order-created-at={order.timestamps.created_at}>{formatOrderAge(order.timestamps.created_at)}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </div>
        </div>
      </header>

      {!access.permissions.manage_orders ? (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-950" role="note">
          <UserRound aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
          <div><p className="text-sm font-semibold">صلاحية عرض فقط</p><p className="mt-1 text-xs font-medium leading-5">يمكنك مراجعة الطلب والاتصال بالعميل، لكن أدوات تغيير الحالة والإلغاء مخفية.</p></div>
        </div>
      ) : null}

      {requiresPrescription || hasAgeRestriction ? (
        <section aria-labelledby="order-requirements-title" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <div className="flex items-start gap-3">
            <ShieldAlert aria-hidden="true" className="mt-0.5 shrink-0" size={19} />
            <div>
              <h2 id="order-requirements-title" className="text-sm font-semibold">متطلبات تحتاج مراجعة قبل متابعة التنفيذ</h2>
              <ul className="mt-2 space-y-1 text-xs font-medium leading-5">
                {requiresPrescription ? <li>• يتضمن الطلب منتجًا واحدًا على الأقل يتطلب روشتة.</li> : null}
                {hasAgeRestriction ? <li>• يتضمن الطلب منتجًا واحدًا على الأقل مقيدًا بالعمر.</li> : null}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 space-y-4">
          <OrderItems order={order} />

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <SectionHeading icon={Clock3}>سجل الحالات</SectionHeading>
            <StatusTimeline order={order} />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <SectionHeading icon={MessageCircle}>تسليم الطلب عبر واتساب</SectionHeading>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-[10px] font-semibold text-slate-500">تم فتح واتساب</dt><dd className="mt-1 text-xs font-semibold text-slate-900">{formatOrderDateTime(order.whatsapp.opened_at)}</dd></div>
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-[10px] font-semibold text-slate-500">تم تأكيد الإرسال</dt><dd className="mt-1 text-xs font-semibold text-slate-900">{formatOrderDateTime(order.whatsapp.sent_confirmed_at)}</dd></div>
            </dl>
            {order.whatsapp.message ? (
              <details className="mt-3 rounded-xl border border-slate-200 bg-white">
                <summary className="min-h-11 cursor-pointer px-3 py-3 text-xs font-semibold text-slate-800">عرض نص رسالة واتساب</summary>
                <p className="whitespace-pre-wrap border-t border-slate-100 px-3 py-3 text-xs font-medium leading-6 text-slate-700">{order.whatsapp.message}</p>
              </details>
            ) : null}
          </section>
        </main>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold text-blue-800">الإجراء التشغيلي</p>
            {operation ? (
              <div className="mt-2">
                <h2 className="text-lg font-semibold text-slate-950">{operation.label}</h2>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-600">{operation.description}</p>
              </div>
            ) : order.status === 'awaiting_whatsapp_send' ? (
              <div className="mt-2"><h2 className="text-base font-semibold text-slate-950">إكمال التواصل عبر واتساب</h2><p className="mt-1 text-xs font-medium leading-5 text-slate-600">لا يوجد انتقال يدوي مدعوم قبل تسليم الطلب إلى واتساب.</p></div>
            ) : (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-950">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
                لا توجد خطوة تشغيلية تالية متاحة لهذه الحالة.
              </div>
            )}
            {access.permissions.manage_orders ? (
              <div className="mt-4">
                <QuickOrderActions
                  orderId={order.id}
                  orderCode={order.order_code}
                  status={order.status}
                  customerPhone={order.customer.phone}
                  variant="detail"
                />
              </div>
            ) : null}
          </section>

          {order.cancellation_reason ? (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-950">
              <div className="flex items-center gap-2"><Ban aria-hidden="true" size={16} /><h2 className="text-sm font-semibold">سبب الإلغاء</h2></div>
              <p className="mt-2 text-xs font-medium leading-5">{order.cancellation_reason}</p>
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeading icon={UserRound}>العميل</SectionHeading>
            <p className="mt-3 text-sm font-semibold text-slate-950">{order.customer.name}</p>
            <p dir="ltr" className="mt-1 text-right text-xs font-medium text-slate-600">{order.customer.phone}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href={`tel:${order.customer.phone}`} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"><Phone aria-hidden="true" size={14} /> اتصال</a>
              {whatsappNumber ? <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"><MessageCircle aria-hidden="true" size={14} /> واتساب</a> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeading icon={MapPin}>التوصيل</SectionHeading>
            <p className="mt-3 text-sm font-semibold text-slate-950">{order.delivery.area_name_ar}</p>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-700">{order.delivery.address}</p>
            {order.delivery.landmark ? <p className="mt-2 text-xs font-medium text-slate-600"><strong className="font-semibold">علامة مميزة:</strong> {order.delivery.landmark}</p> : null}
            {order.delivery.notes ? <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium leading-5 text-amber-950"><strong className="font-semibold">ملاحظة العميل:</strong> {order.delivery.notes}</div> : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeading icon={ReceiptText}>الدفع</SectionHeading>
            <div className="mt-3"><p className="text-sm font-semibold text-slate-950">{order.payment.payment_method_name}</p><p className="mt-1 text-xs font-medium text-slate-600">{formatMoney(order.summary.total_amount, order.summary.currency_symbol, order.summary.currency_code)}</p><div className="mt-2"><PaymentStatusBadge status={order.payment_status} /></div></div>
          </section>

          <details className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <summary className="min-h-11 cursor-pointer px-4 py-3 text-xs font-semibold text-slate-700">بيانات مرجعية</summary>
            <dl className="space-y-3 border-t border-slate-100 px-4 py-3 text-xs">
              <div><dt className="font-medium text-slate-500">المصدر</dt><dd className="mt-1 break-words font-semibold text-slate-900">{order.source}</dd></div>
              <div><dt className="font-medium text-slate-500">معرّف طلب العميل</dt><dd dir="ltr" className="mt-1 break-all text-right font-mono text-[10px] text-slate-800">{order.client_request_id}</dd></div>
              <div><dt className="font-medium text-slate-500">آخر تحديث</dt><dd className="mt-1 font-semibold text-slate-900">{formatOrderDateTime(order.timestamps.updated_at)}</dd></div>
            </dl>
          </details>
        </aside>
      </div>
    </div>
  );
}
