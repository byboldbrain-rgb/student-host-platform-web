import 'server-only';

import { redirect } from 'next/navigation';
import { cache } from 'react';

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

type NowServerClient = Awaited<ReturnType<typeof createClient>>;

export class AdminOrderNotFoundError extends Error {
  constructor() {
    super('Order not found');
    this.name = 'AdminOrderNotFoundError';
  }
}

export const requireNowAdmin = cache(async () => {
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
});

export async function getAdminOrdersWithClient(
  supabase: NowServerClient,
  input: {
    status?: OrderStatus | null;
    paymentStatus?: PaymentStatus | null;
    search?: string | null;
    limit?: number;
    offset?: number;
  },
): Promise<AdminOrdersResponse> {
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

export async function getAdminOrders(input: {
  status?: OrderStatus | null;
  paymentStatus?: PaymentStatus | null;
  search?: string | null;
  limit?: number;
  offset?: number;
}): Promise<AdminOrdersResponse> {
  const { supabase } = await requireNowAdmin();
  return getAdminOrdersWithClient(supabase, input);
}

export async function getAdminOrderWithClient(
  supabase: NowServerClient,
  orderId: string,
): Promise<AdminOrderDetail> {
  const { data, error } = await supabase
    .schema('now')
    .rpc('get_admin_order', {
      p_order_id: orderId,
    });

  if (error) {
    throw new Error(getRpcErrorMessage(error));
  }

  if (!data) {
    throw new AdminOrderNotFoundError();
  }

  return data as AdminOrderDetail;
}
