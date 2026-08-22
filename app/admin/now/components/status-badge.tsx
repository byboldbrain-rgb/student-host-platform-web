import type { OrderStatus, PaymentStatus } from '../lib/types';

const orderStatusLabels: Record<OrderStatus, string> = {
  awaiting_whatsapp_send: 'في انتظار واتساب',
  waiting_confirmation: 'في انتظار التأكيد',
  confirmed: 'تم التأكيد',
  preparing: 'جاري التجهيز',
  out_for_delivery: 'خرج للتوصيل',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
};

const orderStatusClasses: Record<OrderStatus, string> = {
  awaiting_whatsapp_send: 'border-amber-200 bg-amber-50 text-amber-800',
  waiting_confirmation: 'border-violet-200 bg-violet-50 text-violet-800',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  preparing: 'border-orange-200 bg-orange-50 text-orange-800',
  out_for_delivery: 'border-sky-200 bg-sky-50 text-sky-800',
  delivered: 'border-green-200 bg-green-50 text-green-800',
  cancelled: 'border-red-200 bg-red-50 text-red-800',
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'معلّق',
  awaiting_payment: 'في انتظار الدفع',
  paid: 'مدفوع',
  failed: 'فشل الدفع',
  refunded: 'مسترد',
  partially_refunded: 'مسترد جزئيًا',
};

const paymentStatusClasses: Record<PaymentStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  awaiting_payment: 'border-orange-200 bg-orange-50 text-orange-800',
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  failed: 'border-red-200 bg-red-50 text-red-800',
  refunded: 'border-slate-200 bg-slate-100 text-slate-700',
  partially_refunded: 'border-blue-200 bg-blue-50 text-blue-800',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${orderStatusClasses[status]}`}>{orderStatusLabels[status]}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${paymentStatusClasses[status]}`}>{paymentStatusLabels[status]}</span>;
}

export function getOrderStatusLabel(status: OrderStatus) {
  return orderStatusLabels[status];
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  return paymentStatusLabels[status];
}
