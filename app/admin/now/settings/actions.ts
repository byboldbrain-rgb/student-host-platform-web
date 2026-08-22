'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createAdminClient } from '@/src/lib/supabase/admin';

import { requireNowTableAccess } from '../lib/table-data';

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

function nullable(formData: FormData, key: string) {
  const raw = value(formData, key);
  return raw === '' ? null : raw;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === 'on';
}

function go(kind: 'success' | 'error', message: string): never {
  redirect(`/admin/now/settings?${kind}=${encodeURIComponent(message)}`);
}

export async function updateNowAppSettings(formData: FormData) {
  const { definition } = await requireNowTableAccess('app_settings', true);

  if (definition.mutationMode !== 'update-only') {
    go('error', 'إعدادات التطبيق ليست في وضع التعديل الآمن.');
  }

  const appName = value(formData, 'app_name');
  const appSlug = value(formData, 'app_slug');
  const locale = value(formData, 'default_locale');
  const timezone = value(formData, 'timezone');
  const currencyCode = value(formData, 'currency_code').toUpperCase();
  const currencySymbol = value(formData, 'currency_symbol');
  const deletionDays = Number(value(formData, 'account_deletion_processing_days'));

  if (!appName || !appSlug || !timezone || !currencyCode || !currencySymbol) {
    go('error', 'اسم التطبيق والـslug والمنطقة الزمنية والعملة حقول مطلوبة.');
  }

  if (!['ar', 'en'].includes(locale)) {
    go('error', 'اللغة الافتراضية يجب أن تكون ar أو en.');
  }

  if (!Number.isInteger(deletionDays) || deletionDays < 1 || deletionDays > 365) {
    go('error', 'مدة معالجة حذف الحساب يجب أن تكون من 1 إلى 365 يومًا.');
  }

  const payload = {
    app_name: appName,
    app_slug: appSlug,
    app_logo_url: nullable(formData, 'app_logo_url'),
    default_locale: locale,
    timezone,
    currency_code: currencyCode,
    currency_symbol: currencySymbol,
    default_city_id: nullable(formData, 'default_city_id'),
    default_service_area_id: nullable(formData, 'default_service_area_id'),
    whatsapp_number: nullable(formData, 'whatsapp_number'),
    support_phone: nullable(formData, 'support_phone'),
    support_whatsapp: nullable(formData, 'support_whatsapp'),
    support_email: nullable(formData, 'support_email'),
    catalog_enabled: checked(formData, 'catalog_enabled'),
    orders_enabled: checked(formData, 'orders_enabled'),
    maintenance_mode: checked(formData, 'maintenance_mode'),
    maintenance_message_ar: nullable(formData, 'maintenance_message_ar'),
    maintenance_message_en: nullable(formData, 'maintenance_message_en'),
    minimum_supported_app_version: nullable(formData, 'minimum_supported_app_version'),
    privacy_url: nullable(formData, 'privacy_url'),
    terms_url: nullable(formData, 'terms_url'),
    location_geofencing_enabled: checked(formData, 'location_geofencing_enabled'),
    account_deletion_processing_days: deletionDays,
    prescription_gate_enabled: checked(formData, 'prescription_gate_enabled'),
    age_verification_gate_enabled: checked(formData, 'age_verification_gate_enabled'),
    payment_proof_gate_enabled: checked(formData, 'payment_proof_gate_enabled'),
    service_booking_payment_proof_gate_enabled: checked(
      formData,
      'service_booking_payment_proof_gate_enabled',
    ),
  };

  const admin = createAdminClient();
  const { error } = await admin
    .schema('now')
    .from('app_settings')
    .update(payload)
    .eq('singleton', true);

  if (error) {
    go('error', [error.message, error.details, error.hint].filter(Boolean).join(' — '));
  }

  revalidatePath('/admin/now');
  revalidatePath('/admin/now/settings');
  revalidatePath('/admin/now/sections/system');
  revalidatePath('/admin/now/data/app_settings');
  go('success', 'تم حفظ إعدادات Navienty Now.');
}
