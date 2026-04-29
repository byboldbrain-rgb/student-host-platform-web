'use server'

import { createAdminClient } from '@/src/lib/supabase/admin'

type BrowserPushSubscription = {
  endpoint?: string
  keys?: {
    p256dh?: string
    auth?: string
  }
}

export async function saveWaitingListPushSubscriptionAction(
  subscription: BrowserPushSubscription,
  userAgent?: string,
  waitingListRequestId?: string
) {
  const endpoint = String(subscription?.endpoint || '').trim()
  const p256dh = String(subscription?.keys?.p256dh || '').trim()
  const auth = String(subscription?.keys?.auth || '').trim()
  const cleanWaitingListRequestId = String(waitingListRequestId || '').trim()

  if (!endpoint || !p256dh || !auth) {
    throw new Error('بيانات الإشعارات غير صحيحة')
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('property_waiting_list_push_subscriptions')
    .upsert(
      {
        waiting_list_request_id: cleanWaitingListRequestId || null,
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

export async function disableWaitingListPushSubscriptionAction(endpoint: string) {
  const parsedEndpoint = String(endpoint || '').trim()

  if (!parsedEndpoint) {
    return {
      ok: true,
    }
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('property_waiting_list_push_subscriptions')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('endpoint', parsedEndpoint)

  if (error) {
    throw new Error(error.message)
  }

  return {
    ok: true,
  }
}