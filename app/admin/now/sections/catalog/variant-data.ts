import 'server-only';

import { createAdminClient } from '@/src/lib/supabase/admin';

import { requireNowTableAccess } from '../../lib/table-data';

export type CatalogProductVariant = {
  id: string;
  product_id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
  price: number | string;
  compare_at_price: number | string | null;
  sku: string | null;
  barcode: string | null;
  is_default: boolean;
  is_available: boolean;
  is_active: boolean;
  sort_order: number;
};

function errorMessage(error: { message?: string; details?: string } | null) {
  return [error?.message, error?.details].filter(Boolean).join(' — ') || 'تعذر تحميل أحجام المنتج.';
}

export async function getCatalogProductVariants(productId: string): Promise<CatalogProductVariant[]> {
  await requireNowTableAccess('product_variants');
  const admin = createAdminClient();
  const { data, error } = await admin
    .schema('now')
    .from('product_variants')
    .select('id,product_id,slug,name_ar,name_en,price,compare_at_price,sku,barcode,is_default,is_available,is_active,sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .order('name_ar', { ascending: true });

  if (error) throw new Error(errorMessage(error));
  return (data ?? []) as unknown as CatalogProductVariant[];
}
