'use server';

import { redirect } from 'next/navigation';

import { createAdminClient } from '@/src/lib/supabase/admin';
import { requireNowAdmin } from '../../lib/admin-data';

const ALLOWED_CATEGORIES = new Set(['general', 'offers']);
const ALLOWED_PLATFORMS = new Set(['all', 'ios', 'android']);
const ALLOWED_URLS = new Set([
  '/',
  '/category/restaurants',
  '/category/supermarket',
  '/category/bookstore',
  '/category/personal-care',
  '/category/laundry',
  '/category/request-anything',
  '/orders',
  '/account',
]);

function formText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function failureRedirect(code: string): never {
  redirect(`/admin/now/sections/notifications?error=${encodeURIComponent(code)}`);
}

export async function sendCustomerPushCampaignAction(formData: FormData) {
  const { access } = await requireNowAdmin();

  if (!access.permissions.manage_settings && access.platform_role !== 'super_admin') {
    failureRedirect('permission_denied');
  }

  const title = formText(formData, 'title');
  const body = formText(formData, 'body');
  const category = formText(formData, 'category') || 'general';
  const audience = formText(formData, 'audience') || 'all';
  const url = formText(formData, 'url') || '/';

  if (!title || title.length > 100) {
    failureRedirect('invalid_title');
  }

  if (!body || body.length > 220) {
    failureRedirect('invalid_body');
  }

  if (!ALLOWED_CATEGORIES.has(category)) {
    failureRedirect('invalid_category');
  }

  if (!ALLOWED_PLATFORMS.has(audience)) {
    failureRedirect('invalid_audience');
  }

  if (!ALLOWED_URLS.has(url)) {
    failureRedirect('invalid_destination');
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .schema('now')
    .rpc('enqueue_admin_customer_campaign', {
      p_title: title,
      p_body: body,
      p_url: url,
      p_category: category,
      p_platform: audience === 'all' ? null : audience,
    });

  if (error || !data) {
    console.error('Failed to enqueue customer push campaign:', error);
    failureRedirect('enqueue_failed');
  }

  const result = data as {
    campaign_id?: string;
    queued_count?: number;
  };

  const queuedCount = Number(result.queued_count ?? 0);
  const campaignId = typeof result.campaign_id === 'string' ? result.campaign_id : '';

  if (!Number.isFinite(queuedCount) || queuedCount <= 0) {
    redirect('/admin/now/sections/notifications?notice=no_reachable_devices');
  }

  redirect(
    `/admin/now/sections/notifications?sent=${Math.floor(queuedCount)}&campaign=${encodeURIComponent(campaignId)}`,
  );
}
