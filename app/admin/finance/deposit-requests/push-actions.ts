'use server'

import { createAdminClient } from '@/src/lib/supabase/admin'
import { requireDepositRequestsAccess } from '@/src/lib/admin-auth'

type BrowserPushSubscription = {
  endpoint?: string
  keys?: {
    p256dh?: string
    auth?: string
  }
}

export async function saveAdminPushSubscriptionAction(
  subscription: BrowserPushSubscription,
  userAgent?: string
) {
  const adminContext = await requireDepositRequestsAccess()

  if (adminContext.admin.role !== 'AR') {
    throw new Error('Only AR admins can enable deposit notifications')
  }

  const endpoint = String(subscription?.endpoint || '').trim()
  const p256dh = String(subscription?.keys?.p256dh || '').trim()
  const auth = String(subscription?.keys?.auth || '').trim()

  if (!endpoint || !p256dh || !auth) {
    throw new Error('Invalid push subscription')
  }

  const admin = createAdminClient()

  const { error } = await admin.from('admin_push_subscriptions').upsert(
    {
      admin_user_id: adminContext.admin.id,
      endpoint,
      p256dh,
      auth,
      user_agent: userAgent || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'endpoint',
    }
  )

  if (error) {
    throw new Error(error.message)
  }

  return {
    ok: true,
  }
}

export async function disableAdminPushSubscriptionAction(endpoint: string) {
  const adminContext = await requireDepositRequestsAccess()
  const parsedEndpoint = String(endpoint || '').trim()

  if (!parsedEndpoint) {
    return {
      ok: true,
    }
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('admin_push_subscriptions')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('admin_user_id', adminContext.admin.id)
    .eq('endpoint', parsedEndpoint)

  if (error) {
    throw new Error(error.message)
  }

  return {
    ok: true,
  }
}