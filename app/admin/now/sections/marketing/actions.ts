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

type AdminClient = ReturnType<typeof createAdminClient>;
type UploadedImage = { url: string; storagePath: string };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function optionalText(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === 'on' || formData.get(key) === 'true';
}

function requiredNumber(formData: FormData, key: string, label: string, min = 0) {
  const raw = text(formData, key);
  const value = Number(raw);
  if (!raw || !Number.isFinite(value) || value < min) {
    throw new Error(`${label} يجب أن يكون رقمًا صالحًا${min > 0 ? ` أكبر من أو يساوي ${min}` : ''}.`);
  }
  return value;
}

function optionalNumber(formData: FormData, key: string, label: string, min = 0) {
  const raw = text(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min) {
    throw new Error(`${label} يجب أن يكون رقمًا صالحًا${min > 0 ? ` أكبر من أو يساوي ${min}` : ''}.`);
  }
  return value;
}

function optionalInteger(formData: FormData, key: string, label: string, min = 1) {
  const raw = text(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min) {
    throw new Error(`${label} يجب أن يكون رقمًا صحيحًا أكبر من أو يساوي ${min}.`);
  }
  return value;
}

function cairoLocalToIso(raw: string | null) {
  if (!raw) return null;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) throw new Error('صيغة التاريخ أو الوقت غير صحيحة.');
  const [, y, mo, d, h, mi] = match;
  const targetAsUtc = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const offsetFor = (utcMs: number) => {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(utcMs)).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
    );
    const localAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    );
    return localAsUtc - utcMs;
  };

  let utcMs = targetAsUtc - offsetFor(targetAsUtc);
  utcMs = targetAsUtc - offsetFor(utcMs);
  return new Date(utcMs).toISOString();
}

function scheduleFromForm(formData: FormData) {
  const startsAt = cairoLocalToIso(optionalText(formData, 'starts_at'));
  const endsAt = cairoLocalToIso(optionalText(formData, 'ends_at'));
  if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    throw new Error('وقت انتهاء الحملة يجب أن يكون بعد وقت البداية.');
  }
  return { startsAt, endsAt };
}

function mutationError(error: { message?: string; details?: string; hint?: string } | null) {
  return [error?.message, error?.details, error?.hint].filter(Boolean).join(' — ') || 'تعذر حفظ التعديل.';
}

function marketingPath(tab: 'overview' | 'offers' | 'coupons' | 'usage' = 'overview') {
  return `/admin/now/sections/marketing?tab=${tab}`;
}

function redirectMessage(tab: 'overview' | 'offers' | 'coupons' | 'usage', kind: 'success' | 'error', message: string): never {
  redirect(`${marketingPath(tab)}&${kind}=${encodeURIComponent(message)}`);
}

function revalidateMarketing() {
  revalidatePath('/admin/now');
  revalidatePath('/admin/now/sections/marketing');
  revalidatePath('/admin/now/data/home_banners');
  revalidatePath('/admin/now/data/vouchers');
  revalidatePath('/admin/now/data/voucher_redemptions');
}

async function uploadImage(admin: AdminClient, entry: FormDataEntryValue | null, prefix: string): Promise<UploadedImage | null> {
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

async function removeStoragePaths(admin: AdminClient, paths: Array<string | null | undefined>) {
  const clean = paths.filter((value): value is string => Boolean(value));
  if (clean.length > 0) await admin.storage.from(IMAGE_BUCKET).remove(clean);
}

function bannerFields(formData: FormData) {
  const adminLabel = text(formData, 'admin_label');
  if (!adminLabel) throw new Error('اكتب اسمًا داخليًا واضحًا للعرض.');

  const placement = text(formData, 'placement') || 'main';
  const allowedPlacements = ['main', 'exclusive_offers', 'supermarket', 'pharmacy'];
  if (!allowedPlacements.includes(placement)) throw new Error('مكان ظهور العرض غير صحيح.');

  const audience = text(formData, 'audience') || 'all';
  if (!['all', 'signed_out', 'signed_in'].includes(audience)) throw new Error('الجمهور المختار غير صحيح.');

  const presentationType = text(formData, 'presentation_type') || 'direct_link';
  if (!['direct_link', 'detail_screen'].includes(presentationType)) throw new Error('طريقة فتح العرض غير صحيحة.');

  const actionType = text(formData, 'action_type') || 'none';
  if (!['none', 'whatsapp', 'external_url', 'category', 'store', 'route', 'service_checkout'].includes(actionType)) {
    throw new Error('الإجراء بعد الضغط غير صحيح.');
  }

  const storeId = optionalText(formData, 'store_id');
  if (placement === 'supermarket' && !storeId) throw new Error('اختر المتجر لعرض السوبرماركت.');
  const sortOrder = optionalNumber(formData, 'sort_order', 'الترتيب') ?? 0;
  const { startsAt, endsAt } = scheduleFromForm(formData);

  return {
    adminLabel,
    placement,
    audience,
    presentationType,
    actionType,
    storeId,
    sortOrder,
    startsAt,
    endsAt,
    altTextAr: optionalText(formData, 'alt_text_ar'),
    isActive: checked(formData, 'is_active'),
  };
}

export async function createMarketingBanner(formData: FormData) {
  await requireNowTableAccess('home_banners', true);
  const id = randomUUID();
  const admin = createAdminClient();
  let image: UploadedImage | null = null;

  try {
    const fields = bannerFields(formData);
    image = await uploadImage(admin, formData.get('image'), `banners/${id}`);
    if (!image) throw new Error('اختار صورة العرض قبل الحفظ.');

    const { error } = await admin.schema('now').from('home_banners').insert({
      id,
      admin_label: fields.adminLabel,
      image_url: image.url,
      storage_path: image.storagePath,
      alt_text_ar: fields.altTextAr,
      audience: fields.audience,
      sort_order: fields.sortOrder,
      is_active: fields.isActive,
      starts_at: fields.startsAt,
      ends_at: fields.endsAt,
      placement: fields.placement,
      store_id: fields.storeId,
      presentation_type: fields.presentationType,
      action_type: fields.actionType,
      action_payload: {},
      template_key: 'premium_promo_v1',
      content: {},
      theme: {},
    });
    if (error) throw new Error(mutationError(error));
  } catch (error) {
    if (image) await removeStoragePaths(admin, [image.storagePath]);
    redirectMessage('offers', 'error', error instanceof Error ? error.message : 'تعذر إنشاء العرض.');
  }

  revalidateMarketing();
  redirectMessage('offers', 'success', 'تم إنشاء العرض بنجاح.');
}

export async function updateMarketingBanner(formData: FormData) {
  await requireNowTableAccess('home_banners', true);
  const id = text(formData, 'id');
  const admin = createAdminClient();
  let newImage: UploadedImage | null = null;

  try {
    if (!id) throw new Error('العرض غير محدد.');
    const { data: current, error: currentError } = await admin
      .schema('now')
      .from('home_banners')
      .select('id,image_url,storage_path')
      .eq('id', id)
      .maybeSingle();
    if (currentError) throw new Error(mutationError(currentError));
    if (!current) throw new Error('العرض غير موجود.');

    const fields = bannerFields(formData);
    newImage = await uploadImage(admin, formData.get('image'), `banners/${id}`);
    const payload: Record<string, unknown> = {
      admin_label: fields.adminLabel,
      alt_text_ar: fields.altTextAr,
      audience: fields.audience,
      sort_order: fields.sortOrder,
      is_active: fields.isActive,
      starts_at: fields.startsAt,
      ends_at: fields.endsAt,
      placement: fields.placement,
      store_id: fields.storeId,
      presentation_type: fields.presentationType,
      action_type: fields.actionType,
    };
    if (newImage) {
      payload.image_url = newImage.url;
      payload.storage_path = newImage.storagePath;
    }

    const { error } = await admin.schema('now').from('home_banners').update(payload).eq('id', id);
    if (error) throw new Error(mutationError(error));

    if (newImage && current.storage_path && current.storage_path !== newImage.storagePath && String(current.storage_path).startsWith(`banners/${id}/`)) {
      await removeStoragePaths(admin, [String(current.storage_path)]);
    }
  } catch (error) {
    if (newImage) await removeStoragePaths(admin, [newImage.storagePath]);
    redirectMessage('offers', 'error', error instanceof Error ? error.message : 'تعذر تعديل العرض.');
  }

  revalidateMarketing();
  redirectMessage('offers', 'success', 'تم تحديث العرض.');
}

export async function toggleMarketingBanner(formData: FormData) {
  await requireNowTableAccess('home_banners', true);
  const id = text(formData, 'id');
  const nextActive = text(formData, 'next_active') === 'true';

  try {
    if (!id) throw new Error('العرض غير محدد.');
    const admin = createAdminClient();
    const { error } = await admin.schema('now').from('home_banners').update({ is_active: nextActive }).eq('id', id);
    if (error) throw new Error(mutationError(error));
  } catch (error) {
    redirectMessage('offers', 'error', error instanceof Error ? error.message : 'تعذر تغيير حالة العرض.');
  }

  revalidateMarketing();
  redirectMessage('offers', 'success', nextActive ? 'تم تشغيل العرض.' : 'تم إيقاف العرض.');
}

function voucherFields(formData: FormData) {
  const code = text(formData, 'code').toUpperCase();
  if (!/^[A-Z0-9_-]{2,32}$/.test(code)) throw new Error('الكود يجب أن يكون 2–32 حرفًا إنجليزيًا أو رقمًا، ويمكن استخدام - أو _.');
  const titleAr = text(formData, 'title_ar');
  if (!titleAr) throw new Error('اكتب اسمًا واضحًا للكوبون.');

  const discountType = text(formData, 'discount_type');
  if (!['fixed', 'percentage'].includes(discountType)) throw new Error('نوع الخصم غير صحيح.');
  const discountValue = requiredNumber(formData, 'discount_value', 'قيمة الخصم', 0.01);
  if (discountType === 'percentage' && discountValue > 100) throw new Error('نسبة الخصم لا يمكن أن تتجاوز 100%.');

  const discountTarget = text(formData, 'discount_target') || 'order_subtotal';
  if (!['order_subtotal', 'delivery_fee'].includes(discountTarget)) throw new Error('مكان تطبيق الخصم غير صحيح.');

  const maxDiscountAmount = optionalNumber(formData, 'max_discount_amount', 'أقصى خصم', 0.01);
  const minimumSubtotal = optionalNumber(formData, 'minimum_subtotal', 'الحد الأدنى للطلب') ?? 0;
  const maxRedemptionsTotal = optionalInteger(formData, 'max_redemptions_total', 'إجمالي مرات الاستخدام');
  const maxRedemptionsPerUser = optionalInteger(formData, 'max_redemptions_per_user', 'مرات الاستخدام لكل عميل') ?? 1;
  const { startsAt, endsAt } = scheduleFromForm(formData);

  return {
    code,
    titleAr,
    descriptionAr: optionalText(formData, 'description_ar'),
    discountType,
    discountValue,
    discountTarget,
    maxDiscountAmount: discountType === 'percentage' ? maxDiscountAmount : null,
    minimumSubtotal,
    storeId: optionalText(formData, 'store_id'),
    categoryId: optionalText(formData, 'category_id'),
    startsAt,
    endsAt,
    maxRedemptionsTotal,
    maxRedemptionsPerUser,
    firstOrderOnly: checked(formData, 'first_order_only'),
    isActive: checked(formData, 'is_active'),
  };
}

export async function createMarketingVoucher(formData: FormData) {
  await requireNowTableAccess('vouchers', true);

  try {
    const fields = voucherFields(formData);
    const admin = createAdminClient();
    const { error } = await admin.schema('now').from('vouchers').insert({
      code: fields.code,
      title_ar: fields.titleAr,
      description_ar: fields.descriptionAr,
      discount_type: fields.discountType,
      discount_value: fields.discountValue,
      discount_target: fields.discountTarget,
      max_discount_amount: fields.maxDiscountAmount,
      minimum_subtotal: fields.minimumSubtotal,
      store_id: fields.storeId,
      category_id: fields.categoryId,
      starts_at: fields.startsAt,
      ends_at: fields.endsAt,
      max_redemptions_total: fields.maxRedemptionsTotal,
      max_redemptions_per_user: fields.maxRedemptionsPerUser,
      first_order_only: fields.firstOrderOnly,
      is_active: fields.isActive,
      metadata: {},
    });
    if (error) throw new Error(mutationError(error));
  } catch (error) {
    redirectMessage('coupons', 'error', error instanceof Error ? error.message : 'تعذر إنشاء الكوبون.');
  }

  revalidateMarketing();
  redirectMessage('coupons', 'success', 'تم إنشاء الكوبون بنجاح.');
}

export async function updateMarketingVoucher(formData: FormData) {
  await requireNowTableAccess('vouchers', true);
  const id = text(formData, 'id');

  try {
    if (!id) throw new Error('الكوبون غير محدد.');
    const fields = voucherFields(formData);
    const admin = createAdminClient();
    const { error } = await admin.schema('now').from('vouchers').update({
      code: fields.code,
      title_ar: fields.titleAr,
      description_ar: fields.descriptionAr,
      discount_type: fields.discountType,
      discount_value: fields.discountValue,
      discount_target: fields.discountTarget,
      max_discount_amount: fields.maxDiscountAmount,
      minimum_subtotal: fields.minimumSubtotal,
      store_id: fields.storeId,
      category_id: fields.categoryId,
      starts_at: fields.startsAt,
      ends_at: fields.endsAt,
      max_redemptions_total: fields.maxRedemptionsTotal,
      max_redemptions_per_user: fields.maxRedemptionsPerUser,
      first_order_only: fields.firstOrderOnly,
      is_active: fields.isActive,
    }).eq('id', id);
    if (error) throw new Error(mutationError(error));
  } catch (error) {
    redirectMessage('coupons', 'error', error instanceof Error ? error.message : 'تعذر تعديل الكوبون.');
  }

  revalidateMarketing();
  redirectMessage('coupons', 'success', 'تم تحديث الكوبون.');
}

export async function toggleMarketingVoucher(formData: FormData) {
  await requireNowTableAccess('vouchers', true);
  const id = text(formData, 'id');
  const nextActive = text(formData, 'next_active') === 'true';

  try {
    if (!id) throw new Error('الكوبون غير محدد.');
    const admin = createAdminClient();
    const { error } = await admin.schema('now').from('vouchers').update({ is_active: nextActive }).eq('id', id);
    if (error) throw new Error(mutationError(error));
  } catch (error) {
    redirectMessage('coupons', 'error', error instanceof Error ? error.message : 'تعذر تغيير حالة الكوبون.');
  }

  revalidateMarketing();
  redirectMessage('coupons', 'success', nextActive ? 'تم تشغيل الكوبون.' : 'تم إيقاف الكوبون.');
}
