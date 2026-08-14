import { redirect } from 'next/navigation';

import { createClient } from '@/src/lib/supabase/server';

import type {
  AdminAccessContext,
  AdminOrderDetail,
  AdminOrdersResponse,
  OrderStatus,
  PaymentStatus,
} from './types';

function getRpcErrorMessage(
  error: { message?: string; details?: string } | null,
): string {
  if (!error) {
    return 'حدث خطأ غير متوقع.';
  }

  return [error.message, error.details]
    .filter(Boolean)
    .join(' — ');
}

export async function requireNowAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const { data, error } = await supabase
    .schema('now')
    .rpc('get_admin_access_context');

  if (error || !data) {
    redirect('/admin/unauthorized');
  }

  return {
    supabase,
    access: data as AdminAccessContext,
  };
}

export async function getAdminOrders(input: {
  status?: OrderStatus | null;
  paymentStatus?: PaymentStatus | null;
  search?: string | null;
  limit?: number;
  offset?: number;
}): Promise<AdminOrdersResponse> {
  const { supabase } = await requireNowAdmin();

  const { data, error } = await supabase
    .schema('now')
    .rpc('list_admin_orders', {
      p_status: input.status ?? null,
      p_payment_status: input.paymentStatus ?? null,
      p_search: input.search?.trim() || null,
      p_limit: input.limit ?? 20,
      p_offset: input.offset ?? 0,
    });

  if (error || !data) {
    throw new Error(getRpcErrorMessage(error));
  }

  return data as AdminOrdersResponse;
}

export async function getAdminOrder(
  orderId: string,
): Promise<AdminOrderDetail> {
  const { supabase } = await requireNowAdmin();

  const { data, error } = await supabase
    .schema('now')
    .rpc('get_admin_order', {
      p_order_id: orderId,
    });

  if (error || !data) {
    throw new Error(getRpcErrorMessage(error));
  }

  return data as AdminOrderDetail;
}
