'use server'

import { createAdminClient } from '@/src/lib/supabase/admin'
import { createClient } from '@/src/lib/supabase/server'

type BrowserPushSubscription = {
  endpoint?: string
  keys?: {
    p256dh?: string
    auth?: string
  }
}

export async function saveCommunityPushSubscriptionAction(
  subscription: BrowserPushSubscription,
  userAgent?: string
) {
  const endpoint = String(subscription?.endpoint || '').trim()
  const p256dh = String(subscription?.keys?.p256dh || '').trim()
  const auth = String(subscription?.keys?.auth || '').trim()

  if (!endpoint || !p256dh || !auth) {
    throw new Error('Invalid push subscription')
  }

  const serverClient = await createClient()

  const {
    data: { user },
  } = await serverClient.auth.getUser()

  const admin = createAdminClient()

  const { error } = await admin.from('community_push_subscriptions').upsert(
    {
      user_id: user?.id || null,
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

export async function disableCommunityPushSubscriptionAction(endpoint: string) {
  const parsedEndpoint = String(endpoint || '').trim()

  if (!parsedEndpoint) {
    return {
      ok: true,
    }
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('community_push_subscriptions')
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