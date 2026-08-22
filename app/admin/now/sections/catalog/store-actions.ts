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
  const value = text(formData, key);
  return value || null;
}

function mutationError(error: { message?: string; details?: string; hint?: string } | null) {
  return [error?.message, error?.details, error?.hint].filter(Boolean).join(' — ') || 'تعذر حفظ بيانات المتجر.';
}

function storePath(storeId: string) {
  return `/admin/now/sections/catalog/${storeId}?tab=store`;
}

function redirectMessage(storeId: string, kind: 'success' | 'error', message: string): never {
  redirect(`${storePath(storeId)}&${kind}=${encodeURIComponent(message)}`);
}

async function uploadImage(
  admin: AdminClient,
  entry: FormDataEntryValue | null,
  prefix: string,
): Promise<UploadedImage | null> {
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
  const clean = paths.filter((path): path is string => Boolean(path));
  if (clean.length === 0) return;
  await admin.storage.from(IMAGE_BUCKET).remove(clean);
}

function ownedStoreStoragePath(url: string | null | undefined, storeId: string) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex < 0) return null;
    const storagePath = decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
    return storagePath.startsWith(`stores/${storeId}/`) ? storagePath : null;
  } catch {
    return null;
  }
}

export async function updateCatalogStore(formData: FormData) {
  await requireNowTableAccess('stores', true);
  const storeId = text(formData, 'store_id');

  if (!storeId) redirect('/admin/now/sections/catalog?error=' + encodeURIComponent('معرّف المتجر غير موجود.'));

  try {
    const admin = createAdminClient();
    const nameAr = text(formData, 'name_ar');
    if (!nameAr) throw new Error('اسم المتجر بالعربية مطلوب.');

    const storeResult = await admin
      .schema('now')
      .from('stores')
      .select('id,logo_url,cover_image_url')
      .eq('id', storeId)
      .maybeSingle();

    if (storeResult.error) throw new Error(mutationError(storeResult.error));
    if (!storeResult.data) throw new Error('المتجر غير موجود.');

    const current = storeResult.data as {
      id: string;
      logo_url: string | null;
      cover_image_url: string | null;
    };

    const uploaded: UploadedImage[] = [];
    let logo: UploadedImage | null = null;
    let cover: UploadedImage | null = null;

    try {
      logo = await uploadImage(admin, formData.get('logo'), `stores/${storeId}/branding/logo`);
      if (logo) uploaded.push(logo);
      cover = await uploadImage(admin, formData.get('cover'), `stores/${storeId}/branding/cover`);
      if (cover) uploaded.push(cover);

      const removeLogo = formData.get('remove_logo') === 'on';
      const removeCover = formData.get('remove_cover') === 'on';

      const payload: Record<string, unknown> = {
        name_ar: nameAr,
        name_en: optionalText(formData, 'name_en'),
        short_description_ar: optionalText(formData, 'short_description_ar'),
      };

      if (logo) payload.logo_url = logo.url;
      else if (removeLogo) payload.logo_url = null;

      if (cover) payload.cover_image_url = cover.url;
      else if (removeCover) payload.cover_image_url = null;

      const updateResult = await admin.schema('now').from('stores').update(payload).eq('id', storeId);
      if (updateResult.error) throw new Error(mutationError(updateResult.error));

      const oldPaths: Array<string | null> = [];
      if ((logo || removeLogo) && current.logo_url) oldPaths.push(ownedStoreStoragePath(current.logo_url, storeId));
      if ((cover || removeCover) && current.cover_image_url) oldPaths.push(ownedStoreStoragePath(current.cover_image_url, storeId));
      await removeStoragePaths(admin, oldPaths);
    } catch (error) {
      await removeStoragePaths(admin, uploaded.map((item) => item.storagePath));
      throw error;
    }
  } catch (error) {
    redirectMessage(storeId, 'error', error instanceof Error ? error.message : 'تعذر حفظ بيانات المتجر.');
  }

  revalidatePath('/admin/now');
  revalidatePath('/admin/now/sections/catalog');
  revalidatePath(`/admin/now/sections/catalog/${storeId}`);
  revalidatePath('/admin/now/data/stores');
  redirectMessage(storeId, 'success', 'تم حفظ بيانات المتجر وتحديث الصور.');
}
