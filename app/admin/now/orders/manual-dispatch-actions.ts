'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { requireNowAdmin } from '../lib/admin-data';

export type DispatchLogState = { outcome: 'idle' | 'success' | 'error'; message: string };
const reasons = new Set(['same_area','same_store','available','customer_group','fast_prep','next_trip','other']);
const slots = new Set(['current','next']);
const stages = new Set(['before_pickup','collecting','to_hub','returning','unknown']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function field(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function saveManualDispatchDecision(
  _previous: DispatchLogState, data: FormData,
): Promise<DispatchLogState> {
  const { supabase, access } = await requireNowAdmin();
  if (!access.permissions.manage_orders) return { outcome: 'error', message: 'لا تملك صلاحية إدارة الطلبات.' };

  const orderId = field(data,'order_id');
  const rider = field(data,'rider_name');
  const reason = field(data,'reason');
  const tripSlot = field(data,'trip_slot');
  const tripStage = field(data,'trip_stage');
  const note = field(data,'note');

  if (!uuid.test(orderId) || rider.length < 2 || rider.length > 100 ||
      !reasons.has(reason) || !slots.has(tripSlot) || !stages.has(tripStage) || note.length > 500) {
    return { outcome: 'error', message: 'راجع اسم المندوب وسبب الإسناد وبيانات الرحلة.' };
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { outcome: 'error', message: 'انتهت الجلسة. سجّل دخولك مجددًا.' };

  // Verify that the order exists using the scoped app schema; no status changes occur.
  const { data: order, error: orderError } = await supabase.schema('now').from('orders')
    .select('id').eq('id',orderId).maybeSingle();
  if (orderError || !order) return { outcome: 'error', message: 'الطلب غير متاح أو تعذر التحقق منه.' };

  const admin = createAdminClient();
  const { error } = await admin.schema('now').from('manual_dispatch_decisions').insert({
    order_id: orderId, rider_name: rider, reason, trip_slot: tripSlot,
    trip_stage: tripStage, note: note || null, created_by: auth.user.id,
  });
  if (error) return { outcome: 'error', message: 'تعذر حفظ قرار الإسناد. تحقق من تشغيل Migration أولًا.' };
  revalidatePath('/admin/now/orders/' + orderId);
  return { outcome: 'success', message: 'اتسجل القرار في السجل فقط. لم يتم إرسال أي مهمة للمندوب.' };
}
