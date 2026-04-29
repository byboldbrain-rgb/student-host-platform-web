'use server'

import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  requireOwnerSettlementsAccess,
  isSuperAdmin,
  isAPAdmin,
} from '@/src/lib/admin-auth'

type PushSubscriptionJSON = {
  endpoint?: string
  keys?: {
    p256dh?: string
    auth?: string
  }
}

function canUseOwnerSettlementNotifications(admin: {
  role?: string | null
}) {
  return isSuperAdmin(admin as any) || isAPAdmin(admin as any)
}

export async function saveAdminPushSubscriptionAction(
  subscription: PushSubscriptionJSON,
  userAgent?: string
) {
  const adminContext = await requireOwnerSettlementsAccess()
  const supabase = createAdminClient()

  if (!canUseOwnerSettlementNotifications(adminContext.admin)) {
    throw new Error('Only AP admins can enable owner settlement notifications')
  }

  const endpoint = subscription.endpoint?.trim()
  const p256dh = subscription.keys?.p256dh?.trim()
  const auth = subscription.keys?.auth?.trim()

  if (!endpoint || !p256dh || !auth) {
    throw new Error('Invalid push subscription')
  }

  const { error } = await supabase.from('admin_push_subscriptions').upsert(
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
  const adminContext = await requireOwnerSettlementsAccess()
  const supabase = createAdminClient()

  if (!canUseOwnerSettlementNotifications(adminContext.admin)) {
    throw new Error('Only AP admins can disable owner settlement notifications')
  }

  const parsedEndpoint = String(endpoint || '').trim()

  if (!parsedEndpoint) {
    return {
      ok: true,
    }
  }

  const { error } = await supabase
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