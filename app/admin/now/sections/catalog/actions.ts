'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createAdminClient } from '@/src/lib/supabase/admin';

import { requireNowTableAccess } from '../../lib/table-data';

const IMAGE_BUCKET = 'now-media';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function parseMoney(formData: FormData, key: string, label: string, required = true) {
  const raw = text(formData, key);
  if (!raw && !required) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} يجب أن يكون رقمًا صحيحًا أكبر من أو يساوي صفر.`);
  return value;
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

function mutationError(error: { message?: string; details?: string; hint?: string } | null) {
  return [error?.message, error?.details, error?.hint].filter(Boolean).join(' — ') || 'تعذر حفظ التعديل.';
}

function catalogPath(storeId?: string, suffix = '') {
  if (!storeId) return '/admin/now/sections/catalog';
  return `/admin/now/sections/catalog/${storeId}${suffix}`;
}

function redirectMessage(path: string, kind: 'success' | 'error', message: string): never {
  const separator = path.includes('?') ? '&' : '?';
  redirect(`${path}${separator}${kind}=${encodeURIComponent(message)}`);
}

function revalidateCatalog(storeId?: string, productId?: string) {
  revalidatePath('/admin/now');
  revalidatePath('/admin/now/sections/catalog');
  if (storeId) revalidatePath(catalogPath(storeId));
  if (storeId && productId) revalidatePath(catalogPath(storeId, `/products/${productId}`));
  revalidatePath('/admin/now/data/stores');
  revalidatePath('/admin/now/data/products');
  revalidatePath('/admin/now/data/catalog_categories');
  revalidatePath('/admin/now/data/store_business_hours');
  revalidatePath('/admin/now/data/product_images');
}

async function uploadImage(
  admin: ReturnType<typeof createAdminClient>,
  entry: FormDataEntryValue | null,
  prefix: string,
) {
  if (!(entry instanceof File) || entry.size === 0) return null;
  const extension = IMAGE_EXTENSIONS[entry.type];
  if (!extension) throw new Error('صيغة الصورة يجب أن تكون JPG أو PNG أو WEBP.');
  if (entry.size > MAX_IMAGE_BYTES) throw new Error('حجم الصورة يجب ألا يتجاوز 10MB.');

  const storagePath = `${prefix}/${randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await entry.arrayBuffer());
  const { error } = await admin.storage.from(IMAGE_BUCKET).upload(storagePath, bytes, {
    contentType: entry.type,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(`تعذر رفع الصورة: ${error.message}`);

  const { data } = admin.storage.from(IMAGE_BUCKET).getPublicUrl(storagePath);
  return { url: data.publicUrl, storagePath };
}

async function removeStoragePaths(admin: ReturnType<typeof createAdminClient>, paths: Array<string | null | undefined>) {
  const clean = paths.filter((path): path is string => Boolean(path));
  if (clean.length === 0) return;
  await admin.storage.from(IMAGE_BUCKET).remove(clean);
}

async function assertStoreExists(admin: ReturnType<typeof createAdminClient>, storeId: string) {
  const { data, error } = await admin.schema('now').from('stores').select('id,category_id').eq('id', storeId).maybeSingle();
  if (error) throw new Error(mutationError(error));
  if (!data) throw new Error('المتجر غير موجود.');
  return data as { id: string; category_id: string };
}

async function assertCategoryBelongsToStore(
  admin: ReturnType<typeof createAdminClient>,
  storeId: string,
  categoryId: string,
) {
  const { data, error } = await admin
    .schema('now')
    .from('catalog_categories')
    .select('id')
    .eq('id', categoryId)
    .eq('store_id', storeId)
    .maybeSingle();
  if (error) throw new Error(mutationError(error));
  if (!data) throw new Error('الفئة المختارة لا تتبع هذا المتجر.');
}

async function inferProductType(admin: ReturnType<typeof createAdminClient>, categoryId: string) {
  const { data, error } = await admin.schema('now').from('store_categories').select('slug').eq('id', categoryId).maybeSingle();
  if (error) throw new Error(mutationError(error));
  const slug = (data as { slug?: string } | null)?.slug ?? '';
  if (slug === 'restaurants') return 'food';
  if (slug === 'pharmacy') return 'pharmacy';
  return 'grocery';
}

export async function createCatalogStore(formData: FormData) {
  try {
    await requireNowTableAccess('stores', true);
    const admin = createAdminClient();
    const id = randomUUID();
    const nameAr = text(formData, 'name_ar');
    const nameEn = text(formData, 'name_en');
    const categoryId = text(formData, 'category_id');
    const cityId = text(formData, 'city_id');
    if (!nameAr || !categoryId || !cityId) throw new Error('اسم المتجر والفئة والمدينة حقول مطلوبة.');

    const [categoryResult, cityResult] = await Promise.all([
      admin.schema('now').from('store_categories').select('id').eq('id', categoryId).maybeSingle(),
      admin.schema('now').from('cities').select('id').eq('id', cityId).maybeSingle(),
    ]);
    if (categoryResult.error) throw new Error(mutationError(categoryResult.error));
    if (cityResult.error) throw new Error(mutationError(cityResult.error));
    if (!categoryResult.data || !cityResult.data) throw new Error('الفئة أو المدينة المختارة غير صحيحة.');

    const uploaded: Array<{ url: string; storagePath: string } | null> = [];
    try {
      const logo = await uploadImage(admin, formData.get('logo'), `stores/${id}`);
      uploaded.push(logo);
      const cover = await uploadImage(admin, formData.get('cover'), `stores/${id}`);
      uploaded.push(cover);

      const { error } = await admin.schema('now').from('stores').insert({
        id,
        category_id: categoryId,
        city_id: cityId,
        slug: slugify(nameEn || nameAr, 'store'),
        name_ar: nameAr,
        name_en: nameEn || null,
        short_description_ar: optionalText(formData, 'short_description_ar'),
        phone: optionalText(formData, 'phone'),
        whatsapp_number: optionalText(formData, 'whatsapp_number'),
        logo_url: logo?.url ?? null,
        cover_image_url: cover?.url ?? null,
        is_active: true,
      });
      if (error) throw new Error(mutationError(error));

      const hours = Array.from({ length: 7 }, (_, day) => ({
        store_id: id,
        day_of_week: day,
        is_open: false,
        open_time: null,
        close_time: null,
      }));
      const hoursResult = await admin.schema('now').from('store_business_hours').insert(hours);
      if (hoursResult.error) {
        await admin.schema('now').from('stores').delete().eq('id', id);
        throw new Error(mutationError(hoursResult.error));
      }
    } catch (error) {
      await removeStoragePaths(admin, uploaded.map((item) => item?.storagePath));
      throw error;
    }

    revalidateCatalog(id);
    redirectMessage(catalogPath(id), 'success', 'تم إنشاء المتجر. أضف المنتجات واضبط مواعيد العمل.');
  } catch (error) {
    redirectMessage(catalogPath(), 'error', error instanceof Error ? error.message : 'تعذر إنشاء المتجر.');
  }
}

export async function createCatalogCategory(formData: FormData) {
  const storeId = text(formData, 'store_id');
  try {
    await requireNowTableAccess('catalog_categories', true);
    const admin = createAdminClient();
    await assertStoreExists(admin, storeId);
    const id = randomUUID();
    const nameAr = text(formData, 'name_ar');
    const nameEn = text(formData, 'name_en');
    if (!nameAr) throw new Error('اكتب اسم الفئة.');

    const image = await uploadImage(admin, formData.get('image'), `stores/${storeId}/categories/${id}`);
    const { error } = await admin.schema('now').from('catalog_categories').insert({
      id,
      store_id: storeId,
      slug: slugify(nameEn || nameAr, 'category'),
      name_ar: nameAr,
      name_en: nameEn || null,
      image_url: image?.url ?? null,
      is_active: true,
    });
    if (error) {
      await removeStoragePaths(admin, [image?.storagePath]);
      throw new Error(mutationError(error));
    }

    revalidateCatalog(storeId);
    redirectMessage(catalogPath(storeId, '?tab=products'), 'success', 'تمت إضافة الفئة.');
  } catch (error) {
    redirectMessage(catalogPath(storeId, '?tab=products'), 'error', error instanceof Error ? error.message : 'تعذر إضافة الفئة.');
  }
}

export async function createCatalogProduct(formData: FormData) {
  const storeId = text(formData, 'store_id');
  try {
    await requireNowTableAccess('products', true);
    const admin = createAdminClient();
    const store = await assertStoreExists(admin, storeId);
    const categoryId = text(formData, 'catalog_category_id');
    const nameAr = text(formData, 'name_ar');
    const nameEn = text(formData, 'name_en');
    const basePrice = parseMoney(formData, 'base_price', 'السعر');
    const compareAtPrice = parseMoney(formData, 'compare_at_price', 'السعر قبل الخصم', false);
    if (!nameAr || !categoryId) throw new Error('اسم المنتج والفئة حقول مطلوبة.');
    if (compareAtPrice !== null && compareAtPrice < basePrice) throw new Error('السعر قبل الخصم يجب أن يكون أكبر من أو يساوي السعر الحالي.');
    await assertCategoryBelongsToStore(admin, storeId, categoryId);

    const id = randomUUID();
    const image = await uploadImage(admin, formData.get('image'), `stores/${storeId}/products/${id}`);
    const productType = await inferProductType(admin, store.category_id);
    const { error } = await admin.schema('now').from('products').insert({
      id,
      store_id: storeId,
      catalog_category_id: categoryId,
      product_type: productType,
      slug: slugify(nameEn || nameAr, 'product'),
      name_ar: nameAr,
      name_en: nameEn || null,
      description_ar: optionalText(formData, 'description_ar'),
      base_price: basePrice,
      compare_at_price: compareAtPrice,
      image_url: image?.url ?? null,
      is_available: true,
      is_active: true,
    });
    if (error) {
      await removeStoragePaths(admin, [image?.storagePath]);
      throw new Error(mutationError(error));
    }

    if (image) {
      const imageResult = await admin.schema('now').from('product_images').insert({
        product_id: id,
        image_url: image.url,
        storage_path: image.storagePath,
        is_cover: true,
        is_active: true,
        sort_order: 0,
      });
      if (imageResult.error) {
        await admin.schema('now').from('products').delete().eq('id', id);
        await removeStoragePaths(admin, [image.storagePath]);
        throw new Error(mutationError(imageResult.error));
      }
    }

    revalidateCatalog(storeId, id);
    redirectMessage(catalogPath(storeId, '?tab=products'), 'success', 'تمت إضافة المنتج.');
  } catch (error) {
    redirectMessage(catalogPath(storeId, '?tab=products'), 'error', error instanceof Error ? error.message : 'تعذر إضافة المنتج.');
  }
}

export async function updateCatalogProduct(formData: FormData) {
  const storeId = text(formData, 'store_id');
  const productId = text(formData, 'product_id');
  const path = catalogPath(storeId, `/products/${productId}`);
  try {
    await requireNowTableAccess('products', true);
    const admin = createAdminClient();
    await assertStoreExists(admin, storeId);

    const productResult = await admin
      .schema('now')
      .from('products')
      .select('id,image_url')
      .eq('id', productId)
      .eq('store_id', storeId)
      .maybeSingle();
    if (productResult.error) throw new Error(mutationError(productResult.error));
    if (!productResult.data) throw new Error('المنتج غير موجود.');

    const categoryId = text(formData, 'catalog_category_id');
    const nameAr = text(formData, 'name_ar');
    const basePrice = parseMoney(formData, 'base_price', 'السعر');
    const compareAtPrice = parseMoney(formData, 'compare_at_price', 'السعر قبل الخصم', false);
    if (!nameAr || !categoryId) throw new Error('اسم المنتج والفئة حقول مطلوبة.');
    if (compareAtPrice !== null && compareAtPrice < basePrice) throw new Error('السعر قبل الخصم يجب أن يكون أكبر من أو يساوي السعر الحالي.');
    await assertCategoryBelongsToStore(admin, storeId, categoryId);

    const image = await uploadImage(admin, formData.get('image'), `stores/${storeId}/products/${productId}`);
    const payload: Record<string, unknown> = {
      catalog_category_id: categoryId,
      name_ar: nameAr,
      name_en: optionalText(formData, 'name_en'),
      description_ar: optionalText(formData, 'description_ar'),
      base_price: basePrice,
      compare_at_price: compareAtPrice,
      is_available: formData.get('is_available') === 'on',
      is_active: formData.get('is_active') === 'on',
    };
    if (image) payload.image_url = image.url;

    const { error } = await admin.schema('now').from('products').update(payload).eq('id', productId).eq('store_id', storeId);
    if (error) {
      await removeStoragePaths(admin, [image?.storagePath]);
      throw new Error(mutationError(error));
    }

    if (image) {
      const coverResult = await admin
        .schema('now')
        .from('product_images')
        .select('id,storage_path')
        .eq('product_id', productId)
        .eq('is_cover', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (coverResult.error) throw new Error(mutationError(coverResult.error));

      const previousPath = (coverResult.data as { storage_path?: string | null } | null)?.storage_path ?? null;
      if (coverResult.data) {
        const imageUpdate = await admin
          .schema('now')
          .from('product_images')
          .update({ image_url: image.url, storage_path: image.storagePath, is_active: true })
          .eq('id', (coverResult.data as { id: string }).id);
        if (imageUpdate.error) throw new Error(mutationError(imageUpdate.error));
      } else {
        const imageInsert = await admin.schema('now').from('product_images').insert({
          product_id: productId,
          image_url: image.url,
          storage_path: image.storagePath,
          is_cover: true,
          is_active: true,
          sort_order: 0,
        });
        if (imageInsert.error) throw new Error(mutationError(imageInsert.error));
      }
      if (previousPath && previousPath !== image.storagePath) await removeStoragePaths(admin, [previousPath]);
    }

    revalidateCatalog(storeId, productId);
    redirectMessage(path, 'success', 'تم حفظ تعديلات المنتج.');
  } catch (error) {
    redirectMessage(path, 'error', error instanceof Error ? error.message : 'تعذر تعديل المنتج.');
  }
}

export async function deleteCatalogProduct(formData: FormData) {
  const storeId = text(formData, 'store_id');
  const productId = text(formData, 'product_id');
  try {
    await requireNowTableAccess('products', true);
    if (formData.get('confirm_delete') !== 'yes') throw new Error('أكد الحذف النهائي أولًا.');
    const admin = createAdminClient();

    const productResult = await admin
      .schema('now')
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('store_id', storeId)
      .maybeSingle();
    if (productResult.error) throw new Error(mutationError(productResult.error));
    if (!productResult.data) throw new Error('المنتج غير موجود.');

    const imagesResult = await admin.schema('now').from('product_images').select('storage_path').eq('product_id', productId);
    if (imagesResult.error) throw new Error(mutationError(imagesResult.error));
    const storagePaths = ((imagesResult.data ?? []) as Array<{ storage_path?: string | null }>).map((image) => image.storage_path);

    const { error } = await admin.schema('now').from('products').delete().eq('id', productId).eq('store_id', storeId);
    if (error) throw new Error(mutationError(error));
    await removeStoragePaths(admin, storagePaths);

    revalidateCatalog(storeId, productId);
    redirectMessage(catalogPath(storeId, '?tab=products'), 'success', 'تم حذف المنتج نهائيًا.');
  } catch (error) {
    redirectMessage(catalogPath(storeId, `/products/${productId}`), 'error', error instanceof Error ? error.message : 'تعذر حذف المنتج.');
  }
}

export async function updateCatalogStoreHours(formData: FormData) {
  const storeId = text(formData, 'store_id');
  try {
    await requireNowTableAccess('store_business_hours', true);
    const admin = createAdminClient();
    await assertStoreExists(admin, storeId);

    const rows = Array.from({ length: 7 }, (_, day) => {
      const isOpen = formData.get(`is_open_${day}`) === 'on';
      const openTime = text(formData, `open_time_${day}`);
      const closeTime = text(formData, `close_time_${day}`);
      if (isOpen && (!openTime || !closeTime)) throw new Error('حدد وقت الفتح والإغلاق لكل يوم مفتوح.');
      return {
        store_id: storeId,
        day_of_week: day,
        is_open: isOpen,
        open_time: isOpen ? openTime : null,
        close_time: isOpen ? closeTime : null,
      };
    });

    const { error } = await admin
      .schema('now')
      .from('store_business_hours')
      .upsert(rows, { onConflict: 'store_id,day_of_week' });
    if (error) throw new Error(mutationError(error));

    revalidateCatalog(storeId);
    redirectMessage(catalogPath(storeId, '?tab=hours'), 'success', 'تم حفظ مواعيد المتجر.');
  } catch (error) {
    redirectMessage(catalogPath(storeId, '?tab=hours'), 'error', error instanceof Error ? error.message : 'تعذر حفظ المواعيد.');
  }
}
