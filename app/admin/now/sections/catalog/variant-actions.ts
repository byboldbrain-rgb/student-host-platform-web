'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createAdminClient } from '@/src/lib/supabase/admin';

import { requireNowTableAccess } from '../../lib/table-data';

type AdminClient = ReturnType<typeof createAdminClient>;

type VariantSnapshot = {
  id: string;
  product_id: string;
  price: number | string;
  compare_at_price: number | string | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function requiredMoney(formData: FormData, key: string, label: string): number {
  const raw = text(formData, key);
  const value = Number(raw);
  if (!raw || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} يجب أن يكون رقمًا صحيحًا أكبر من أو يساوي صفر.`);
  }
  return value;
}

function optionalMoney(formData: FormData, key: string, label: string): number | null {
  const raw = text(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} يجب أن يكون رقمًا صحيحًا أكبر من أو يساوي صفر.`);
  }
  return value;
}

function mutationError(error: { message?: string; details?: string; hint?: string } | null) {
  return [error?.message, error?.details, error?.hint].filter(Boolean).join(' — ') || 'تعذر حفظ التعديل.';
}

function productPath(storeId: string, productId: string) {
  return `/admin/now/sections/catalog/${storeId}/products/${productId}`;
}

function redirectMessage(path: string, kind: 'success' | 'error', message: string): never {
  const separator = path.includes('?') ? '&' : '?';
  redirect(`${path}${separator}${kind}=${encodeURIComponent(message)}`);
}

function slugify(value: string, prefix: string) {
  const base = value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `${base || prefix}-${randomUUID().slice(0, 8)}`;
}

function revalidateVariantPaths(storeId: string, productId: string) {
  revalidatePath('/admin/now');
  revalidatePath('/admin/now/sections/catalog');
  revalidatePath(`/admin/now/sections/catalog/${storeId}`);
  revalidatePath(productPath(storeId, productId));
  revalidatePath('/admin/now/data/products');
  revalidatePath('/admin/now/data/product_variants');
}

async function assertProductBelongsToStore(admin: AdminClient, storeId: string, productId: string) {
  const { data, error } = await admin
    .schema('now')
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('store_id', storeId)
    .maybeSingle();
  if (error) throw new Error(mutationError(error));
  if (!data) throw new Error('المنتج غير موجود داخل هذا المتجر.');
}

async function clearDefaultVariants(admin: AdminClient, productId: string, exceptId?: string) {
  let query = admin
    .schema('now')
    .from('product_variants')
    .update({ is_default: false })
    .eq('product_id', productId)
    .eq('is_default', true);
  if (exceptId) query = query.neq('id', exceptId);
  const { error } = await query;
  if (error) throw new Error(mutationError(error));
}

async function syncProductPriceFromVariant(
  admin: AdminClient,
  productId: string,
  variant: { price: number | string; compare_at_price: number | string | null },
) {
  const { error } = await admin
    .schema('now')
    .from('products')
    .update({
      base_price: variant.price,
      compare_at_price: variant.compare_at_price,
    })
    .eq('id', productId);
  if (error) throw new Error(mutationError(error));
}

async function ensureActiveDefaultVariant(admin: AdminClient, productId: string, preferredId?: string) {
  const { data, error } = await admin
    .schema('now')
    .from('product_variants')
    .select('id,product_id,price,compare_at_price,is_default,is_active,sort_order')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('sort_order', { ascending: true });
  if (error) throw new Error(mutationError(error));

  const variants = (data ?? []) as unknown as VariantSnapshot[];
  if (variants.length === 0) return null;

  let selected = variants.find((variant) => variant.is_default) ?? null;
  if (!selected && preferredId) selected = variants.find((variant) => variant.id === preferredId) ?? null;
  selected ??= variants[0];

  if (!selected.is_default) {
    await clearDefaultVariants(admin, productId, selected.id);
    const { error: defaultError } = await admin
      .schema('now')
      .from('product_variants')
      .update({ is_default: true })
      .eq('id', selected.id)
      .eq('product_id', productId);
    if (defaultError) throw new Error(mutationError(defaultError));
  }

  await syncProductPriceFromVariant(admin, productId, selected);
  return selected;
}

export async function createCatalogProductVariant(formData: FormData) {
  await requireNowTableAccess('product_variants', true);
  const storeId = text(formData, 'store_id');
  const productId = text(formData, 'product_id');
  const path = productPath(storeId, productId);

  try {
    const admin = createAdminClient();
    await assertProductBelongsToStore(admin, storeId, productId);

    const nameAr = text(formData, 'name_ar');
    const nameEn = text(formData, 'name_en');
    const price = requiredMoney(formData, 'price', 'سعر الحجم');
    const compareAtPrice = optionalMoney(formData, 'compare_at_price', 'السعر قبل الخصم');
    if (!nameAr) throw new Error('اكتب اسم الحجم أو الاختيار.');
    if (compareAtPrice !== null && compareAtPrice < price) {
      throw new Error('السعر قبل الخصم يجب أن يكون أكبر من أو يساوي سعر الحجم.');
    }

    const existingResult = await admin
      .schema('now')
      .from('product_variants')
      .select('id,is_default,is_active,sort_order')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });
    if (existingResult.error) throw new Error(mutationError(existingResult.error));

    const existing = (existingResult.data ?? []) as Array<{
      id: string;
      is_default: boolean;
      is_active: boolean;
      sort_order: number;
    }>;
    const isActive = formData.get('is_active') === 'on';
    const requestedDefault = formData.get('is_default') === 'on';
    const hasActiveDefault = existing.some((variant) => variant.is_active && variant.is_default);
    const isDefault = isActive && (requestedDefault || !hasActiveDefault);
    const nextSortOrder = existing.reduce((max, variant) => Math.max(max, variant.sort_order ?? 0), 0) + 1;

    if (isDefault) await clearDefaultVariants(admin, productId);

    const id = randomUUID();
    const { error } = await admin.schema('now').from('product_variants').insert({
      id,
      product_id: productId,
      slug: slugify(nameEn || nameAr, 'variant'),
      name_ar: nameAr,
      name_en: nameEn || null,
      price,
      compare_at_price: compareAtPrice,
      sku: optionalText(formData, 'sku'),
      barcode: optionalText(formData, 'barcode'),
      is_default: isDefault,
      is_available: formData.get('is_available') === 'on',
      is_active: isActive,
      sort_order: nextSortOrder,
    });
    if (error) throw new Error(mutationError(error));

    if (isDefault) {
      await syncProductPriceFromVariant(admin, productId, { price, compare_at_price: compareAtPrice });
    } else {
      await ensureActiveDefaultVariant(admin, productId);
    }
  } catch (error) {
    redirectMessage(path, 'error', error instanceof Error ? error.message : 'تعذر إضافة الحجم.');
  }

  revalidateVariantPaths(storeId, productId);
  redirectMessage(path, 'success', 'تمت إضافة الحجم والسعر.');
}

export async function updateCatalogProductVariant(formData: FormData) {
  await requireNowTableAccess('product_variants', true);
  const storeId = text(formData, 'store_id');
  const productId = text(formData, 'product_id');
  const variantId = text(formData, 'variant_id');
  const path = productPath(storeId, productId);

  try {
    const admin = createAdminClient();
    await assertProductBelongsToStore(admin, storeId, productId);

    const existingResult = await admin
      .schema('now')
      .from('product_variants')
      .select('id,product_id,price,compare_at_price,is_default,is_active,sort_order')
      .eq('id', variantId)
      .eq('product_id', productId)
      .maybeSingle();
    if (existingResult.error) throw new Error(mutationError(existingResult.error));
    if (!existingResult.data) throw new Error('الحجم غير موجود لهذا المنتج.');
    const existing = existingResult.data as unknown as VariantSnapshot;

    const nameAr = text(formData, 'name_ar');
    const nameEn = text(formData, 'name_en');
    const price = requiredMoney(formData, 'price', 'سعر الحجم');
    const compareAtPrice = optionalMoney(formData, 'compare_at_price', 'السعر قبل الخصم');
    if (!nameAr) throw new Error('اكتب اسم الحجم أو الاختيار.');
    if (compareAtPrice !== null && compareAtPrice < price) {
      throw new Error('السعر قبل الخصم يجب أن يكون أكبر من أو يساوي سعر الحجم.');
    }

    const isActive = formData.get('is_active') === 'on';
    const requestedDefault = formData.get('is_default') === 'on';
    const willBeDefault = isActive && requestedDefault;

    if (willBeDefault) await clearDefaultVariants(admin, productId, variantId);

    const { error } = await admin
      .schema('now')
      .from('product_variants')
      .update({
        name_ar: nameAr,
        name_en: nameEn || null,
        price,
        compare_at_price: compareAtPrice,
        sku: optionalText(formData, 'sku'),
        barcode: optionalText(formData, 'barcode'),
        is_default: willBeDefault,
        is_available: formData.get('is_available') === 'on',
        is_active: isActive,
      })
      .eq('id', variantId)
      .eq('product_id', productId);
    if (error) throw new Error(mutationError(error));

    if (willBeDefault) {
      await syncProductPriceFromVariant(admin, productId, { price, compare_at_price: compareAtPrice });
    } else {
      const preferredId = isActive && existing.is_default ? variantId : undefined;
      await ensureActiveDefaultVariant(admin, productId, preferredId);
    }
  } catch (error) {
    redirectMessage(path, 'error', error instanceof Error ? error.message : 'تعذر تعديل الحجم.');
  }

  revalidateVariantPaths(storeId, productId);
  redirectMessage(path, 'success', 'تم حفظ تعديلات الحجم.');
}

export async function deleteCatalogProductVariant(formData: FormData) {
  await requireNowTableAccess('product_variants', true);
  const storeId = text(formData, 'store_id');
  const productId = text(formData, 'product_id');
  const variantId = text(formData, 'variant_id');
  const path = productPath(storeId, productId);

  try {
    const admin = createAdminClient();
    await assertProductBelongsToStore(admin, storeId, productId);

    const variantResult = await admin
      .schema('now')
      .from('product_variants')
      .select('id,is_default')
      .eq('id', variantId)
      .eq('product_id', productId)
      .maybeSingle();
    if (variantResult.error) throw new Error(mutationError(variantResult.error));
    if (!variantResult.data) throw new Error('الحجم غير موجود لهذا المنتج.');

    const wasDefault = Boolean((variantResult.data as { is_default?: boolean }).is_default);
    const { error } = await admin
      .schema('now')
      .from('product_variants')
      .delete()
      .eq('id', variantId)
      .eq('product_id', productId);
    if (error) throw new Error(mutationError(error));

    if (wasDefault) await ensureActiveDefaultVariant(admin, productId);
  } catch (error) {
    redirectMessage(path, 'error', error instanceof Error ? error.message : 'تعذر حذف الحجم.');
  }

  revalidateVariantPaths(storeId, productId);
  redirectMessage(path, 'success', 'تم حذف الحجم.');
}
