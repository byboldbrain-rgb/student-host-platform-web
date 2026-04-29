'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { requirePropertyBookingRequestsAccess } from '@/src/lib/admin-auth'

type SubscribeAdminPushInput = {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  userAgent?: string | null
}

export async function getAdminPushPublicKeyAction() {
  await requirePropertyBookingRequestsAccess()

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  if (!publicKey) {
    return {
      success: false as const,
      error: 'Push notifications are not configured. Missing public VAPID key.',
    }
  }

  return {
    success: true as const,
    publicKey,
  }
}

export async function getAdminPropertyBookingPushStatusAction() {
  const adminContext = await requirePropertyBookingRequestsAccess()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('admin_push_subscriptions')
    .select('id, endpoint, is_active')
    .eq('admin_user_id', adminContext.admin.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (error) {
    return {
      success: false as const,
      isEnabled: false,
      error: error.message,
    }
  }

  return {
    success: true as const,
    isEnabled: Boolean(data),
  }
}

export async function subscribeAdminPropertyBookingPushAction(
  input: SubscribeAdminPushInput
) {
  const adminContext = await requirePropertyBookingRequestsAccess()
  const supabase = createAdminClient()

  if (!input.endpoint || !input.keys?.p256dh || !input.keys?.auth) {
    return {
      success: false as const,
      error: 'Invalid push subscription.',
    }
  }

  const { error } = await supabase.from('admin_push_subscriptions').upsert(
    {
      admin_user_id: adminContext.admin.id,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      user_agent: input.userAgent || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'endpoint',
    }
  )

  if (error) {
    return {
      success: false as const,
      error: error.message,
    }
  }

  revalidatePath('/admin/properties/booking-requests')

  return {
    success: true as const,
  }
}

export async function unsubscribeAdminPropertyBookingPushAction(endpoint: string) {
  const adminContext = await requirePropertyBookingRequestsAccess()
  const supabase = createAdminClient()

  if (!endpoint) {
    return {
      success: false as const,
      error: 'Subscription endpoint is required.',
    }
  }

  const { error } = await supabase
    .from('admin_push_subscriptions')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('admin_user_id', adminContext.admin.id)
    .eq('endpoint', endpoint)

  if (error) {
    return {
      success: false as const,
      error: error.message,
    }
  }

  revalidatePath('/admin/properties/booking-requests')

  return {
    success: true as const,
  }
}