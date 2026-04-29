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

  if (!cleanWaitingListRequestId) {
    throw new Error('رقم طلب قائمة الانتظار غير موجود')
  }

  const admin = createAdminClient()

  const { data: waitingListRequest, error: requestError } = await admin
    .from('property_waiting_list_requests')
    .select('id')
    .eq('id', cleanWaitingListRequestId)
    .maybeSingle()

  if (requestError) {
    throw new Error(requestError.message)
  }

  if (!waitingListRequest) {
    throw new Error('طلب قائمة الانتظار غير موجود')
  }

  const { error: upsertError } = await admin
    .from('property_waiting_list_push_subscriptions')
    .upsert(
      {
        waiting_list_request_id: cleanWaitingListRequestId,
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

  if (upsertError) {
    throw new Error(upsertError.message)
  }

  const { error: updateRequestError } = await admin
    .from('property_waiting_list_requests')
    .update({
      notify_by_push: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cleanWaitingListRequestId)

  if (updateRequestError) {
    throw new Error(updateRequestError.message)
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

  const { data: subscription, error: subscriptionError } = await admin
    .from('property_waiting_list_push_subscriptions')
    .select('waiting_list_request_id')
    .eq('endpoint', parsedEndpoint)
    .maybeSingle()

  if (subscriptionError) {
    throw new Error(subscriptionError.message)
  }

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

  const waitingListRequestId = String(
    subscription?.waiting_list_request_id || ''
  ).trim()

  if (waitingListRequestId) {
    const { error: updateRequestError } = await admin
      .from('property_waiting_list_requests')
      .update({
        notify_by_push: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', waitingListRequestId)

    if (updateRequestError) {
      throw new Error(updateRequestError.message)
    }
  }

  return {
    ok: true,
  }
}