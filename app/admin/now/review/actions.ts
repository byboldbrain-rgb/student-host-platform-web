'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createAdminClient } from '@/src/lib/supabase/admin';

import { requireNowAdmin } from '../lib/admin-data';
import {
  getAllowedServiceBookingTransitions,
  isServiceBookingStatus,
} from '../lib/workflows';

type Permission = 'manage_orders' | 'manage_settings';

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

function go(kind: 'success' | 'error', message: string): never {
  redirect(`/admin/now/review?${kind}=${encodeURIComponent(message)}`);
}

function rpcError(error: { message?: string; details?: string; hint?: string } | null) {
  return [error?.message, error?.details, error?.hint].filter(Boolean).join(' — ') || 'تعذر تنفيذ العملية.';
}

async function requirePermission(permission: Permission) {
  const context = await requireNowAdmin();

  if (!context.access.permissions[permission]) {
    redirect('/admin/unauthorized');
  }

  return context;
}

function refreshReviewCenter() {
  revalidatePath('/admin/now');
  revalidatePath('/admin/now/orders');
  revalidatePath('/admin/now/review');
  revalidatePath('/admin/now/data');
}

export async function reviewOrderPaymentProof(formData: FormData) {
  const { supabase } = await requirePermission('manage_orders');
  const orderId = value(formData, 'order_id');
  const decision = value(formData, 'decision');
  const note = value(formData, 'note');

  if (!orderId || !['approved', 'rejected'].includes(decision)) {
    go('error', 'بيانات مراجعة إثبات الدفع غير صحيحة.');
  }

  const { error } = await supabase.schema('now').rpc('review_order_payment_proof', {
    p_order_id: orderId,
    p_decision: decision,
    p_note: note || null,
  });

  if (error) {
    go('error', rpcError(error));
  }

  refreshReviewCenter();
  revalidatePath(`/admin/now/orders/${orderId}`);
  go('success', decision === 'approved' ? 'تم اعتماد إثبات دفع الطلب.' : 'تم رفض إثبات دفع الطلب.');
}

export async function reviewPrescription(formData: FormData) {
  const { supabase } = await requirePermission('manage_orders');
  const orderId = value(formData, 'order_id');
  const decision = value(formData, 'decision');
  const note = value(formData, 'note');

  if (!orderId || !['approved', 'rejected'].includes(decision)) {
    go('error', 'بيانات مراجعة الروشتة غير صحيحة.');
  }

  const { error } = await supabase.schema('now').rpc('review_order_prescription', {
    p_order_id: orderId,
    p_decision: decision,
    p_note: note || null,
  });

  if (error) {
    go('error', rpcError(error));
  }

  refreshReviewCenter();
  revalidatePath(`/admin/now/orders/${orderId}`);
  go('success', decision === 'approved' ? 'تم اعتماد الروشتة.' : 'تم رفض الروشتة.');
}

export async function verifyOrderAge(formData: FormData) {
  const { supabase } = await requirePermission('manage_orders');
  const orderId = value(formData, 'order_id');
  const note = value(formData, 'note');

  if (!orderId) {
    go('error', 'رقم الطلب مفقود.');
  }

  const { error } = await supabase.schema('now').rpc('verify_order_age', {
    p_order_id: orderId,
    p_note: note || null,
  });

  if (error) {
    go('error', rpcError(error));
  }

  refreshReviewCenter();
  revalidatePath(`/admin/now/orders/${orderId}`);
  go('success', 'تم تسجيل التحقق من العمر/الهوية للطلب.');
}

export async function reviewServicePaymentProof(formData: FormData) {
  const { supabase } = await requirePermission('manage_orders');
  const bookingId = value(formData, 'booking_id');
  const decision = value(formData, 'decision');
  const note = value(formData, 'note');

  if (!bookingId || !['approved', 'rejected'].includes(decision)) {
    go('error', 'بيانات مراجعة إثبات دفع الخدمة غير صحيحة.');
  }

  const { error } = await supabase.schema('now').rpc('review_service_booking_payment_proof', {
    p_booking_id: bookingId,
    p_decision: decision,
    p_note: note || null,
  });

  if (error) {
    go('error', rpcError(error));
  }

  refreshReviewCenter();
  go('success', decision === 'approved' ? 'تم اعتماد إثبات دفع الخدمة.' : 'تم رفض إثبات دفع الخدمة.');
}

export async function transitionServiceBooking(formData: FormData) {
  await requirePermission('manage_orders');
  const bookingId = value(formData, 'booking_id');
  const newStatus = value(formData, 'new_status');
  const cancellationReason = value(formData, 'cancellation_reason');

  if (!bookingId || !isServiceBookingStatus(newStatus)) {
    go('error', 'بيانات تغيير حالة حجز الخدمة غير صحيحة.');
  }

  if (newStatus === 'cancelled' && cancellationReason.length < 3) {
    go('error', 'اكتب سببًا واضحًا لإلغاء الحجز.');
  }

  const admin = createAdminClient();
  const current = await admin
    .schema('now')
    .from('service_bookings')
    .select('id, status')
    .eq('id', bookingId)
    .maybeSingle();

  if (current.error || !current.data) {
    go('error', current.error ? rpcError(current.error) : 'حجز الخدمة غير موجود.');
  }

  const currentStatus = String(current.data.status);
  const allowed = getAllowedServiceBookingTransitions(currentStatus);

  if (!allowed.includes(newStatus)) {
    go('error', `الانتقال من ${currentStatus} إلى ${newStatus} غير مسموح.`);
  }

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'cancelled') {
    updatePayload.cancellation_reason = cancellationReason;
    updatePayload.cancelled_at = new Date().toISOString();
  }

  const { error } = await admin
    .schema('now')
    .from('service_bookings')
    .update(updatePayload)
    .eq('id', bookingId);

  if (error) {
    go('error', rpcError(error));
  }

  refreshReviewCenter();
  go('success', `تم تغيير حالة حجز الخدمة إلى ${newStatus}.`);
}

export async function startAccountDeletion(formData: FormData) {
  const { supabase } = await requirePermission('manage_settings');
  const requestId = value(formData, 'request_id');

  if (!requestId) {
    go('error', 'طلب حذف الحساب غير محدد.');
  }

  const { error } = await supabase.schema('now').rpc('start_account_deletion_processing', {
    p_request_id: requestId,
  });

  if (error) {
    go('error', rpcError(error));
  }

  refreshReviewCenter();
  go('success', 'بدأت معالجة طلب حذف الحساب وتم تنفيذ الـpreflight.');
}

export async function completeAccountDeletion(formData: FormData) {
  const { supabase } = await requirePermission('manage_settings');
  const requestId = value(formData, 'request_id');
  const retentionNote = value(formData, 'retention_note');

  if (!requestId) {
    go('error', 'طلب حذف الحساب غير محدد.');
  }

  const { error } = await supabase.schema('now').rpc('complete_account_deletion_request', {
    p_request_id: requestId,
    p_retention_note: retentionNote || null,
  });

  if (error) {
    go('error', rpcError(error));
  }

  refreshReviewCenter();
  go('success', 'تم إكمال طلب حذف الحساب وتسجيل ملاحظة الاحتفاظ بالبيانات.');
}
