import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
  ReceiptText,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react';

import {
  getOrderStatusLabel,
  OrderStatusBadge,
  PaymentStatusBadge,
} from '../../components/status-badge';
import SubmitButton from '../../components/submit-button';
import {
  getAdminOrder,
  requireNowAdmin,
} from '../../lib/admin-data';
import type {
  AdminOrderDetail,
  OrderStatus,
} from '../../lib/types';
import { transitionOrderStatus } from './actions';

function formatDate(value: string | null): string {
  if (!value) return 'غير متاح';

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

function nextTransition(status: OrderStatus): {
  status: OrderStatus;
  label: string;
  note: string;
  className: string;
} | null {
  switch (status) {
    case 'waiting_confirmation':
      return {
        status: 'confirmed',
        label: 'تأكيد الطلب',
        note: 'تم تأكيد توافر المنتجات والمبلغ.',
        className: 'bg-emerald-600 text-white hover:bg-emerald-700',
      };

    case 'confirmed':
      return {
        status: 'preparing',
        label: 'بدء التجهيز',
        note: 'بدأ المتجر تجهيز الطلب.',
        className: 'bg-orange-500 text-white hover:bg-orange-600',
      };

    case 'preparing':
      return {
        status: 'out_for_delivery',
        label: 'خرج للتوصيل',
        note: 'تم تسليم الطلب للمندوب.',
        className: 'bg-sky-600 text-white hover:bg-sky-700',
      };

    case 'out_for_delivery':
      return {
        status: 'delivered',
        label: 'تم التوصيل',
        note: 'تم توصيل الطلب بنجاح.',
        className: 'bg-green-600 text-white hover:bg-green-700',
      };

    default:
      return null;
  }
}

function canCancel(status: OrderStatus): boolean {
  return !['delivered', 'cancelled'].includes(status);
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="text-xs font-bold text-slate-500">
        {label}
      </span>

      <span className="max-w-[70%] text-left text-sm font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function Timeline({
  order,
}: {
  order: AdminOrderDetail;
}) {
  return (
    <div className="space-y-4">
      {order.status_history.length === 0 ? (
        <p className="text-sm text-slate-500">
          لا يوجد سجل حالات لهذا الطلب.
        </p>
      ) : (
        order.status_history.map((item, index) => (
          <div
            key={item.id}
            className="relative flex gap-3"
          >
            {index < order.status_history.length - 1 && (
              <div className="absolute right-[7px] top-5 h-[calc(100%+8px)] w-px bg-slate-200" />
            )}

            <div className="relative z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full border-4 border-white bg-violet-600 shadow" />

            <div className="min-w-0 flex-1 rounded-xl bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black">
                  {item.old_status
                    ? `${getOrderStatusLabel(
                        item.old_status,
                      )} ← ${getOrderStatusLabel(
                        item.new_status,
                      )}`
                    : getOrderStatusLabel(item.new_status)}
                </p>

                <p className="text-xs text-slate-400">
                  {formatDate(item.created_at)}
                </p>
              </div>

              {item.note && (
                <p className="mt-2 text-xs leading-6 text-slate-600">
                  {item.note}
                </p>
              )}

              <p className="mt-2 text-[11px] font-bold text-slate-400">
                المنفذ: {item.changed_by_type}
                {item.actor_reference
                  ? ` — ${item.actor_reference}`
                  : ''}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default async function NavientyNowOrderDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query, { access }] = await Promise.all([
    params,
    searchParams,
    requireNowAdmin(),
  ]);

  let order: AdminOrderDetail;

  try {
    order = await getAdminOrder(id);
  } catch {
    notFound();
  }

  const error = Array.isArray(query.error)
    ? query.error[0]
    : query.error;

  const success = Array.isArray(query.success)
    ? query.success[0]
    : query.success;

  const transition = nextTransition(order.status);
  const manageOrders = access.permissions.manage_orders;

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <Link
            href="/admin/now/orders"
            className="inline-flex items-center gap-1 text-sm font-black text-violet-700 hover:text-violet-900"
          >
            <ArrowRight size={17} />
            العودة إلى الطلبات
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h2
              dir="ltr"
              className="text-3xl font-black"
            >
              {order.order_code}
            </h2>

            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </div>

          <p className="mt-2 text-sm text-slate-500">
            تم الإنشاء {formatDate(order.timestamps.created_at)}
          </p>
        </div>

        {manageOrders && (
          <div className="flex flex-col gap-3 sm:min-w-[340px]">
            {transition && (
              <form action={transitionOrderStatus}>
                <input
                  type="hidden"
                  name="order_id"
                  value={order.id}
                />
                <input
                  type="hidden"
                  name="new_status"
                  value={transition.status}
                />
                <input
                  type="hidden"
                  name="note"
                  value={transition.note}
                />

                <SubmitButton
                  idleText={transition.label}
                  className={`w-full ${transition.className}`}
                />
              </form>
            )}

            {canCancel(order.status) && (
              <form
                action={transitionOrderStatus}
                className="rounded-2xl border border-red-200 bg-red-50 p-3"
              >
                <input
                  type="hidden"
                  name="order_id"
                  value={order.id}
                />
                <input
                  type="hidden"
                  name="new_status"
                  value="cancelled"
                />

                <label className="text-xs font-black text-red-800">
                  سبب إلغاء الطلب
                </label>

                <textarea
                  required
                  minLength={3}
                  name="cancellation_reason"
                  placeholder="مثال: المنتج غير متوفر"
                  className="mt-2 min-h-20 w-full resize-y rounded-xl border border-red-200 bg-white p-3 text-sm outline-none focus:border-red-400"
                />

                <input
                  type="hidden"
                  name="note"
                  value="إلغاء الطلب بواسطة فريق تشغيل Navienty Now."
                />

                <SubmitButton
                  idleText="إلغاء الطلب"
                  className="mt-2 w-full bg-red-600 text-white hover:bg-red-700"
                />
              </form>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
          {decodeURIComponent(error)}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          {decodeURIComponent(success)}
        </div>
      )}

      {!manageOrders && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          <ShieldCheck size={20} />
          حسابك يملك صلاحية عرض الطلب فقط.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <Store size={21} />
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500">
                    المتجر
                  </p>

                  <h3 className="font-black">
                    {order.store.icon ?? '🏪'}{' '}
                    {order.store.name_ar}
                  </h3>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <ReceiptText size={21} />
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500">
                    الإجمالي النهائي
                  </p>

                  <h3 className="text-xl font-black">
                    {numberValue(
                      order.summary.total_amount,
                    ).toLocaleString('ar-EG')}{' '}
                    {order.summary.currency_symbol}
                  </h3>
                </div>
              </div>
            </article>
          </div>

          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-black">
                منتجات الطلب
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-black">
                      {item.name_ar}
                      {item.variant_name_ar
                        ? ` — ${item.variant_name_ar}`
                        : ''}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      الكمية: {item.quantity}
                      {item.sku ? ` • SKU: ${item.sku}` : ''}
                    </p>

                    {(item.requires_prescription ||
                      item.is_age_restricted) && (
                      <p className="mt-2 text-xs font-bold text-amber-700">
                        {item.requires_prescription
                          ? 'يتطلب روشتة'
                          : ''}
                        {item.requires_prescription &&
                        item.is_age_restricted
                          ? ' • '
                          : ''}
                        {item.is_age_restricted
                          ? 'مقيد بالعمر'
                          : ''}
                      </p>
                    )}
                  </div>

                  <div className="text-left">
                    <p className="font-black">
                      {numberValue(
                        item.line_total,
                      ).toLocaleString('ar-EG')}{' '}
                      {order.summary.currency_symbol}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {numberValue(
                        item.unit_price,
                      ).toLocaleString('ar-EG')}{' '}
                      للوحدة
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-slate-200 bg-slate-50 p-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  إجمالي المنتجات
                </span>

                <span className="font-black">
                  {numberValue(
                    order.summary.subtotal,
                  ).toLocaleString('ar-EG')}{' '}
                  {order.summary.currency_symbol}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  رسوم التوصيل
                </span>

                <span className="font-black">
                  {numberValue(
                    order.summary.delivery_fee,
                  ).toLocaleString('ar-EG')}{' '}
                  {order.summary.currency_symbol}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-3 text-lg">
                <span className="font-black">الإجمالي</span>

                <span className="font-black text-violet-700">
                  {numberValue(
                    order.summary.total_amount,
                  ).toLocaleString('ar-EG')}{' '}
                  {order.summary.currency_symbol}
                </span>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black">
              سجل حالات الطلب
            </h3>

            <div className="mt-5">
              <Timeline order={order} />
            </div>
          </article>
        </div>

        <aside className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <UserRound size={19} className="text-violet-700" />
              <h3 className="font-black">بيانات العميل</h3>
            </div>

            <div className="mt-4">
              <InfoRow label="الاسم" value={order.customer.name} />
              <InfoRow label="الموبايل" value={order.customer.phone} />
            </div>

            <a
              href={`tel:${order.customer.phone}`}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-violet-700"
            >
              <Phone size={17} />
              الاتصال بالعميل
            </a>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin size={19} className="text-violet-700" />
              <h3 className="font-black">عنوان التوصيل</h3>
            </div>

            <div className="mt-4">
              <InfoRow
                label="المنطقة"
                value={order.delivery.area_name_ar}
              />
              <InfoRow
                label="العنوان"
                value={order.delivery.address}
              />
              <InfoRow
                label="علامة مميزة"
                value={order.delivery.landmark || 'لا يوجد'}
              />
              <InfoRow
                label="ملاحظات"
                value={order.delivery.notes || 'لا يوجد'}
              />
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <MessageCircle
                size={19}
                className="text-emerald-700"
              />
              <h3 className="font-black">واتساب والدفع</h3>
            </div>

            <div className="mt-4">
              <InfoRow
                label="طريقة الدفع"
                value={order.payment.payment_method_name}
              />
              <InfoRow
                label="فتح واتساب"
                value={formatDate(order.whatsapp.opened_at)}
              />
              <InfoRow
                label="تأكيد الإرسال"
                value={formatDate(
                  order.whatsapp.sent_confirmed_at,
                )}
              />
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock3 size={19} className="text-violet-700" />
              <h3 className="font-black">التوقيتات</h3>
            </div>

            <div className="mt-4">
              <InfoRow
                label="إنشاء الطلب"
                value={formatDate(order.timestamps.created_at)}
              />
              <InfoRow
                label="آخر تحديث"
                value={formatDate(order.timestamps.updated_at)}
              />
              <InfoRow
                label="التأكيد"
                value={formatDate(order.timestamps.confirmed_at)}
              />
              <InfoRow
                label="بدء التجهيز"
                value={formatDate(order.timestamps.preparing_at)}
              />
              <InfoRow
                label="خرج للتوصيل"
                value={formatDate(
                  order.timestamps.out_for_delivery_at,
                )}
              />
              <InfoRow
                label="تم التوصيل"
                value={formatDate(order.timestamps.delivered_at)}
              />
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}
