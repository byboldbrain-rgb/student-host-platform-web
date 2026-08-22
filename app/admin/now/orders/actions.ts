'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireNowAdmin } from '../lib/admin-data';
import type { OrderStatus } from '../lib/types';

const nextStatusByCurrent: Partial<Record<OrderStatus, OrderStatus>> = {
  waiting_confirmation: 'confirmed',
  confirmed: 'preparing',
  preparing: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

const nextNotes: Partial<Record<OrderStatus, string>> = {
  waiting_confirmation: 'تم تأكيد توافر المنتجات والمبلغ من قائمة الطلبات.',
  confirmed: 'بدأ المتجر تجهيز الطلب من قائمة الطلبات.',
  preparing: 'تم تسليم الطلب للمندوب من قائمة الطلبات.',
  out_for_delivery: 'تم تأكيد توصيل الطلب من قائمة الطلبات.',
};

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

function safeOrdersReturnPath(raw: string) {
  if (!raw.startsWith('/admin/now/orders') || raw.startsWith('//')) {
    return '/admin/now/orders';
  }

  try {
    const url = new URL(raw, 'https://navienty.local');
    if (!url.pathname.startsWith('/admin/now/orders')) {
      return '/admin/now/orders';
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return '/admin/now/orders';
  }
}

function redirectWithMessage(returnTo: string, type: 'quick_success' | 'quick_error', message: string): never {
  const url = new URL(safeOrdersReturnPath(returnTo), 'https://navienty.local');
  url.searchParams.delete('quick_success');
  url.searchParams.delete('quick_error');
  url.searchParams.set(type, message);
  redirect(`${url.pathname}${url.search}`);
}

export async function quickTransitionOrder(formData: FormData) {
  const orderId = value(formData, 'order_id');
  const mode = value(formData, 'mode');
  const currentStatus = value(formData, 'current_status') as OrderStatus;
  const cancellationReason = value(formData, 'cancellation_reason');
  const returnTo = safeOrdersReturnPath(value(formData, 'return_to'));

  if (!orderId) {
    redirectWithMessage(returnTo, 'quick_error', 'رقم الطلب غير صحيح.');
  }

  const { supabase, access } = await requireNowAdmin();

  if (!access.permissions.manage_orders) {
    redirectWithMessage(returnTo, 'quick_error', 'ليس لديك صلاحية لتغيير حالة الطلبات.');
  }

  let newStatus: OrderStatus;
  let note: string | null = null;
  let reason: string | null = null;

  if (mode === 'cancel') {
    if (['delivered', 'cancelled'].includes(currentStatus)) {
      redirectWithMessage(returnTo, 'quick_error', 'لا يمكن إلغاء طلب تم توصيله أو إلغاؤه بالفعل.');
    }

    if (cancellationReason.length < 3) {
      redirectWithMessage(returnTo, 'quick_error', 'اكتب سببًا واضحًا لإلغاء الطلب.');
    }

    newStatus = 'cancelled';
    note = 'تم إلغاء الطلب من قائمة الطلبات.';
    reason = cancellationReason;
  } else if (mode === 'next') {
    const nextStatus = nextStatusByCurrent[currentStatus];

    if (!nextStatus) {
      redirectWithMessage(returnTo, 'quick_error', 'لا توجد مرحلة تالية متاحة لهذا الطلب من القائمة.');
    }

    newStatus = nextStatus;
    note = nextNotes[currentStatus] ?? 'تم تحديث حالة الطلب من قائمة الطلبات.';
  } else {
    redirectWithMessage(returnTo, 'quick_error', 'الإجراء المطلوب غير صحيح.');
  }

  const { error } = await supabase
    .schema('now')
    .rpc('transition_order_status', {
      p_order_id: orderId,
      p_new_status: newStatus,
      p_note: note,
      p_cancellation_reason: reason,
    });

  if (error) {
    const message = [error.message, error.details].filter(Boolean).join(' — ');
    redirectWithMessage(returnTo, 'quick_error', message || 'تعذر تحديث حالة الطلب.');
  }

  revalidatePath('/admin/now');
  revalidatePath('/admin/now/orders');
  revalidatePath(`/admin/now/orders/${orderId}`);

  redirectWithMessage(
    returnTo,
    'quick_success',
    mode === 'cancel' ? 'تم إلغاء الطلب بنجاح.' : 'تم نقل الطلب للمرحلة التالية بنجاح.',
  );
}
