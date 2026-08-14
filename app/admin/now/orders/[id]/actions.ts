'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/src/lib/supabase/server';

import type { OrderStatus } from '../../lib/types';

const allowedAdminStatuses: OrderStatus[] = [
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

function normalizeValue(
  value: FormDataEntryValue | null,
): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function transitionOrderStatus(
  formData: FormData,
) {
  const orderId = normalizeValue(formData.get('order_id'));
  const newStatus = normalizeValue(
    formData.get('new_status'),
  ) as OrderStatus;
  const note = normalizeValue(formData.get('note'));
  const cancellationReason = normalizeValue(
    formData.get('cancellation_reason'),
  );

  if (
    !orderId ||
    !allowedAdminStatuses.includes(newStatus)
  ) {
    redirect(
      `/admin/now/orders/${orderId}?error=${encodeURIComponent(
        'بيانات تغيير الحالة غير صحيحة.',
      )}`,
    );
  }

  if (
    newStatus === 'cancelled' &&
    cancellationReason.length < 3
  ) {
    redirect(
      `/admin/now/orders/${orderId}?error=${encodeURIComponent(
        'اكتب سببًا واضحًا لإلغاء الطلب.',
      )}`,
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .schema('now')
    .rpc('transition_order_status', {
      p_order_id: orderId,
      p_new_status: newStatus,
      p_note: note || null,
      p_cancellation_reason:
        cancellationReason || null,
    });

  if (error) {
    const message = [error.message, error.details]
      .filter(Boolean)
      .join(' — ');

    redirect(
      `/admin/now/orders/${orderId}?error=${encodeURIComponent(
        message || 'تعذر تغيير حالة الطلب.',
      )}`,
    );
  }

  revalidatePath('/admin/now/orders');
  revalidatePath(`/admin/now/orders/${orderId}`);

  redirect(
    `/admin/now/orders/${orderId}?success=${encodeURIComponent(
      'تم تحديث حالة الطلب وتسجيلها في سجل العمليات.',
    )}`,
  );
}
