import 'server-only';

import { redirect } from 'next/navigation';
import { cache } from 'react';

import { createAdminClient } from '@/src/lib/supabase/admin';
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

type CurrentProductRow = {
  id: string;
  name_ar: string;
  image_url: string | null;
};

type CurrentProductImageRow = {
  product_id: string;
  image_url: string;
  is_cover: boolean;
  sort_order: number;
};

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

  const order = data as AdminOrderDetail;
  const productIds = Array.from(
    new Set(
      order.items
        .map((item) => item.product_id)
        .filter((productId): productId is string => Boolean(productId)),
    ),
  );

  if (productIds.length === 0) {
    return order;
  }

  // The order RPC intentionally returns snapshots. For the admin details view,
  // enrich catalog items with the product's current name and artwork so the
  // operations team sees the same product presentation that exists now in DB.
  // Snapshot values remain the fallback for deleted products and non-catalog items.
  const admin = createAdminClient();
  const [productsResult, productImagesResult] = await Promise.all([
    admin
      .schema('now')
      .from('products')
      .select('id,name_ar,image_url')
      .in('id', productIds),
    admin
      .schema('now')
      .from('product_images')
      .select('product_id,image_url,is_cover,sort_order')
      .in('product_id', productIds)
      .eq('is_active', true)
      .order('is_cover', { ascending: false })
      .order('sort_order', { ascending: true }),
  ]);

  if (productsResult.error) {
    return order;
  }

  const products = (productsResult.data ?? []) as unknown as CurrentProductRow[];
  const productImages = productImagesResult.error
    ? []
    : ((productImagesResult.data ?? []) as unknown as CurrentProductImageRow[]);

  const fallbackImageByProductId = new Map<string, string>();
  for (const image of productImages) {
    if (!fallbackImageByProductId.has(image.product_id)) {
      fallbackImageByProductId.set(image.product_id, image.image_url);
    }
  }

  const currentProductById = new Map(products.map((product) => [product.id, product]));

  return {
    ...order,
    items: order.items.map((item) => {
      if (!item.product_id) return item;

      const product = currentProductById.get(item.product_id);
      if (!product) return item;

      return {
        ...item,
        name_ar: product.name_ar || item.name_ar,
        image_url:
          product.image_url ||
          fallbackImageByProductId.get(product.id) ||
          item.image_url,
      };
    }),
  };
}
