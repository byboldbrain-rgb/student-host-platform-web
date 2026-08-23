'use server';

import { revalidatePath } from 'next/cache';

import {
  AdminOrderNotFoundError,
  getAdminOrderWithClient,
  requireNowAdmin,
} from '../lib/admin-data';
import type { AdminOrderDetail, OrderStatus } from '../lib/types';
import {
  canCancelOrder,
  getNextOrderAction,
  getOrderStatusLabel,
  type OrderActionState,
} from './order-domain';

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

function errorState(message: string): OrderActionState {
  return { outcome: 'error', message };
}

function rpcErrorMessage(error: { message?: string; details?: string }) {
  return [error.message, error.details].filter(Boolean).join(' — ')
    || 'تعذر تحديث حالة الطلب. حاول مرة أخرى.';
}

export async function transitionOrderAction(
  _previousState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const orderId = value(formData, 'order_id');
  const mode = value(formData, 'mode');
  const presentedStatus = value(formData, 'current_status') as OrderStatus;
  const cancellationReason = value(formData, 'cancellation_reason');

  if (!orderId) {
    return errorState('تعذر تحديد الطلب المطلوب. حدّث الصفحة وحاول مرة أخرى.');
  }

  const { supabase, access } = await requireNowAdmin();

  if (!access.permissions.manage_orders) {
    return errorState('ليس لديك صلاحية لتغيير حالة الطلبات.');
  }

  let currentOrder: AdminOrderDetail;
  try {
    currentOrder = await getAdminOrderWithClient(supabase, orderId);
  } catch (error) {
    return errorState(
      error instanceof AdminOrderNotFoundError
        ? 'لم يعد هذا الطلب متاحًا.'
        : 'تعذر قراءة أحدث حالة للطلب. حاول مرة أخرى.',
    );
  }

  if (presentedStatus !== currentOrder.status) {
    revalidatePath('/admin/now/orders');
    revalidatePath(`/admin/now/orders/${orderId}`);
    return errorState(
      `تغيّرت حالة الطلب إلى «${getOrderStatusLabel(currentOrder.status)}». راجع الحالة الحالية قبل تنفيذ خطوة جديدة.`,
    );
  }

  let newStatus: OrderStatus;
  let note: string;
  let reason: string | null = null;

  if (mode === 'cancel') {
    if (!canCancelOrder(currentOrder.status)) {
      return errorState('لا يمكن إلغاء طلب تم توصيله أو إلغاؤه بالفعل.');
    }

    if (cancellationReason.length < 3) {
      return errorState('اكتب سببًا واضحًا لإلغاء الطلب (٣ أحرف على الأقل).');
    }

    newStatus = 'cancelled';
    note = 'تم إلغاء الطلب بواسطة فريق تشغيل Navienty Now.';
    reason = cancellationReason;
  } else if (mode === 'next') {
    const nextAction = getNextOrderAction(currentOrder.status);

    if (!nextAction) {
      return errorState('لا توجد خطوة تشغيلية تالية متاحة لهذا الطلب.');
    }

    newStatus = nextAction.toStatus;
    note = nextAction.auditNote;
  } else {
    return errorState('الإجراء المطلوب غير صحيح.');
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
    return errorState(rpcErrorMessage(error));
  }

  revalidatePath('/admin/now');
  revalidatePath('/admin/now/orders');
  revalidatePath(`/admin/now/orders/${orderId}`);

  return {
    outcome: 'success',
    message: mode === 'cancel'
      ? `تم إلغاء الطلب ${currentOrder.order_code} وتسجيل السبب.`
      : `تم تحديث الطلب ${currentOrder.order_code} إلى «${getOrderStatusLabel(newStatus)}».`,
  };
}
