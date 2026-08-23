import type { OrderStatus, PaymentStatus } from '../lib/types';

export const ORDER_STATUS_VALUES = [
  'awaiting_whatsapp_send',
  'waiting_confirmation',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const satisfies readonly OrderStatus[];

export const PAYMENT_STATUS_VALUES = [
  'pending',
  'awaiting_payment',
  'paid',
  'failed',
  'refunded',
  'partially_refunded',
] as const satisfies readonly PaymentStatus[];

export type StatusIconName =
  | 'message'
  | 'clock'
  | 'check'
  | 'package'
  | 'truck'
  | 'complete'
  | 'cancel';

export type PaymentIconName =
  | 'clock'
  | 'wallet'
  | 'check'
  | 'warning'
  | 'refund';

export type OrderStatusMeta = {
  label: string;
  description: string;
  icon: StatusIconName;
  badgeClass: string;
  railClass: string;
  isActive: boolean;
};

export type PaymentStatusMeta = {
  label: string;
  description: string;
  icon: PaymentIconName;
  badgeClass: string;
};

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  awaiting_whatsapp_send: {
    label: 'في انتظار واتساب',
    description: 'تسليم الطلب إلى واتساب ما زال معلقًا.',
    icon: 'message',
    badgeClass: 'border-amber-300 bg-amber-50 text-amber-950',
    railClass: 'border-amber-200 bg-amber-50/70 text-amber-950',
    isActive: true,
  },
  waiting_confirmation: {
    label: 'في انتظار التأكيد',
    description: 'التوافر والمبلغ يحتاجان إلى تأكيد.',
    icon: 'clock',
    badgeClass: 'border-violet-300 bg-violet-50 text-violet-950',
    railClass: 'border-violet-200 bg-violet-50/70 text-violet-950',
    isActive: true,
  },
  confirmed: {
    label: 'تم التأكيد',
    description: 'تم تأكيد الطلب وهو جاهز لبدء التجهيز.',
    icon: 'check',
    badgeClass: 'border-blue-300 bg-blue-50 text-blue-950',
    railClass: 'border-blue-200 bg-blue-50/70 text-blue-950',
    isActive: true,
  },
  preparing: {
    label: 'جاري التجهيز',
    description: 'المتجر يجهز الطلب الآن.',
    icon: 'package',
    badgeClass: 'border-orange-300 bg-orange-50 text-orange-950',
    railClass: 'border-orange-200 bg-orange-50/70 text-orange-950',
    isActive: true,
  },
  out_for_delivery: {
    label: 'خرج للتوصيل',
    description: 'الطلب مع التوصيل.',
    icon: 'truck',
    badgeClass: 'border-sky-300 bg-sky-50 text-sky-950',
    railClass: 'border-sky-200 bg-sky-50/70 text-sky-950',
    isActive: true,
  },
  delivered: {
    label: 'تم التوصيل',
    description: 'اكتمل الطلب وتم توصيله.',
    icon: 'complete',
    badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-950',
    railClass: 'border-emerald-200 bg-emerald-50/70 text-emerald-950',
    isActive: false,
  },
  cancelled: {
    label: 'ملغي',
    description: 'تم إنهاء الطلب بالإلغاء.',
    icon: 'cancel',
    badgeClass: 'border-rose-300 bg-rose-50 text-rose-950',
    railClass: 'border-rose-200 bg-rose-50/70 text-rose-950',
    isActive: false,
  },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, PaymentStatusMeta> = {
  pending: {
    label: 'معلّق',
    description: 'حالة الدفع لم تُحسم بعد.',
    icon: 'clock',
    badgeClass: 'border-amber-300 bg-white text-amber-950',
  },
  awaiting_payment: {
    label: 'في انتظار الدفع',
    description: 'من المتوقع استلام دفع العميل.',
    icon: 'wallet',
    badgeClass: 'border-orange-300 bg-white text-orange-950',
  },
  paid: {
    label: 'مدفوع',
    description: 'تم تأكيد الدفع.',
    icon: 'check',
    badgeClass: 'border-emerald-300 bg-white text-emerald-950',
  },
  failed: {
    label: 'فشل الدفع',
    description: 'لم تنجح عملية الدفع.',
    icon: 'warning',
    badgeClass: 'border-rose-300 bg-white text-rose-950',
  },
  refunded: {
    label: 'مسترد',
    description: 'تم رد المبلغ بالكامل.',
    icon: 'refund',
    badgeClass: 'border-slate-300 bg-white text-slate-800',
  },
  partially_refunded: {
    label: 'مسترد جزئيًا',
    description: 'تم رد جزء من المبلغ.',
    icon: 'refund',
    badgeClass: 'border-indigo-300 bg-white text-indigo-950',
  },
};

export type NextOrderAction = {
  toStatus: OrderStatus;
  label: string;
  pendingLabel: string;
  description: string;
  auditNote: string;
};

export const NEXT_ORDER_ACTIONS: Partial<Record<OrderStatus, NextOrderAction>> = {
  waiting_confirmation: {
    toStatus: 'confirmed',
    label: 'تأكيد الطلب',
    pendingLabel: 'جاري التأكيد…',
    description: 'بعد التأكد من توافر المنتجات وصحة المبلغ.',
    auditNote: 'تم تأكيد توافر المنتجات والمبلغ بواسطة فريق تشغيل Navienty Now.',
  },
  confirmed: {
    toStatus: 'preparing',
    label: 'بدء التجهيز',
    pendingLabel: 'جاري بدء التجهيز…',
    description: 'عندما يبدأ المتجر تجهيز محتويات الطلب.',
    auditNote: 'بدأ المتجر تجهيز الطلب بواسطة فريق تشغيل Navienty Now.',
  },
  preparing: {
    toStatus: 'out_for_delivery',
    label: 'خرج للتوصيل',
    pendingLabel: 'جاري التسليم للتوصيل…',
    description: 'بعد تسليم الطلب إلى مسؤول التوصيل.',
    auditNote: 'تم تسليم الطلب للتوصيل بواسطة فريق تشغيل Navienty Now.',
  },
  out_for_delivery: {
    toStatus: 'delivered',
    label: 'تم التوصيل',
    pendingLabel: 'جاري تأكيد التوصيل…',
    description: 'بعد التأكد أن العميل استلم الطلب.',
    auditNote: 'تم تأكيد توصيل الطلب بواسطة فريق تشغيل Navienty Now.',
  },
};

export type OrderActionState = {
  outcome: 'idle' | 'success' | 'error';
  message: string;
};

export function getNextOrderAction(status: OrderStatus) {
  return NEXT_ORDER_ACTIONS[status] ?? null;
}

export function canCancelOrder(status: OrderStatus) {
  return status !== 'delivered' && status !== 'cancelled';
}

export function getOrderStatusLabel(status: OrderStatus) {
  return ORDER_STATUS_META[status].label;
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  return PAYMENT_STATUS_META[status].label;
}
