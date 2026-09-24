'use server';

import { createAdminClient } from '@/src/lib/supabase/admin';
import { requireNowAdmin } from '../lib/admin-data';

type BrowserPushSubscription = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

async function requireOrdersNotificationsAccess() {
  const { access } = await requireNowAdmin();

  if (!access.permissions.view_orders) {
    throw new Error('You do not have access to order notifications.');
  }

  return access;
}

export async function getNowOrderPushSubscriptionStatusAction(endpoint: string) {
  const access = await requireOrdersNotificationsAccess();
  const parsedEndpoint = String(endpoint || '').trim();

  if (!parsedEndpoint) {
    return { enabled: false };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('admin_push_subscriptions')
    .select('id')
    .eq('admin_user_id', access.user_id)
    .eq('endpoint', parsedEndpoint)
    .eq('is_active', true)
    .eq('now_orders_enabled', true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return { enabled: Boolean(data) };
}

export async function saveNowOrderPushSubscriptionAction(
  subscription: BrowserPushSubscription,
  userAgent?: string,
) {
  const access = await requireOrdersNotificationsAccess();
  const endpoint = String(subscription?.endpoint || '').trim();
  const p256dh = String(subscription?.keys?.p256dh || '').trim();
  const auth = String(subscription?.keys?.auth || '').trim();

  if (!endpoint || !p256dh || !auth) {
    throw new Error('Invalid push subscription.');
  }

  const admin = createAdminClient();
  const { error } = await admin.from('admin_push_subscriptions').upsert(
    {
      admin_user_id: access.user_id,
      endpoint,
      p256dh,
      auth,
      user_agent: userAgent || null,
      is_active: true,
      now_orders_enabled: true,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'endpoint',
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return { ok: true };
}

export async function disableNowOrderPushSubscriptionAction(endpoint: string) {
  const access = await requireOrdersNotificationsAccess();
  const parsedEndpoint = String(endpoint || '').trim();

  if (!parsedEndpoint) {
    return { ok: true };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('admin_push_subscriptions')
    .update({
      now_orders_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq('admin_user_id', access.user_id)
    .eq('endpoint', parsedEndpoint);

  if (error) {
    throw new Error(error.message);
  }

  return { ok: true };
}
