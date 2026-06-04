import webpush from 'web-push'
import { createAdminClient } from '@/src/lib/supabase/admin'

type PushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
  badge?: string
  badgeCount?: number
  renotify?: boolean
  requireInteraction?: boolean
  propertyId?: string | null
  alertRequestId?: string | null
  notificationId?: string | null
}

type PushSubscriptionInput = {
  endpoint: string
  p256dh: string
  auth: string
}

type PushSubscriptionRow = PushSubscriptionInput & {
  id: string
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@navienty.com'

  if (!publicKey || !privateKey) {
    console.warn('Missing VAPID keys. Push notification was skipped.')
    return false
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

function buildPushPayload(payload: PushPayload) {
  return JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/properties',
    tag: payload.tag || 'navienty-notification',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    badgeCount: payload.badgeCount ?? 1,
    renotify: payload.renotify ?? true,
    requireInteraction: payload.requireInteraction ?? true,
    propertyId: payload.propertyId || null,
    alertRequestId: payload.alertRequestId || null,
    notificationId: payload.notificationId || null,
  })
}

async function sendPushNotification(
  subscription: PushSubscriptionInput,
  payload: PushPayload
) {
  return webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    buildPushPayload(payload)
  )
}

function isExpiredPushSubscriptionError(error: unknown) {
  const statusCode = (error as { statusCode?: number } | null)?.statusCode
  return statusCode === 404 || statusCode === 410
}

async function deactivateSubscription({
  tableName,
  subscriptionId,
}: {
  tableName: 'admin_push_subscriptions' | 'push_subscriptions'
  subscriptionId: string
}) {
  const admin = createAdminClient()

  await admin
    .from(tableName)
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId)
}

export async function sendNewDepositRequestNotificationToARAdmins({
  depositRequestId,
  amount,
  paymentMethod,
  senderName,
}: {
  depositRequestId: string
  amount: number
  paymentMethod: string
  senderName?: string | null
}) {
  if (!configureWebPush()) {
    return
  }

  const admin = createAdminClient()

  const { data: arAdmins, error: arAdminsError } = await admin
    .from('admin_users')
    .select('id')
    .eq('role', 'AR')
    .eq('is_active', true)

  if (arAdminsError || !arAdmins?.length) {
    return
  }

  const arAdminIds = arAdmins.map((item) => item.id)

  const { data: subscriptions, error: subscriptionsError } = await admin
    .from('admin_push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('admin_user_id', arAdminIds)
    .eq('is_active', true)

  if (subscriptionsError || !subscriptions?.length) {
    return
  }

  const formattedAmount = new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  const body = senderName
    ? `${senderName} submitted a new deposit request for ${formattedAmount} via ${paymentMethod}.`
    : `New deposit request for ${formattedAmount} via ${paymentMethod}.`

  await Promise.allSettled(
    (subscriptions as PushSubscriptionRow[]).map(async (subscription) => {
      try {
        await sendPushNotification(subscription, {
          title: 'New deposit request',
          body,
          url: '/admin/finance/deposit-requests',
          tag: `deposit-request-${depositRequestId}`,
          badgeCount: 1,
          requireInteraction: true,
        })
      } catch (error) {
        if (isExpiredPushSubscriptionError(error)) {
          await deactivateSubscription({
            tableName: 'admin_push_subscriptions',
            subscriptionId: subscription.id,
          })
        }
      }
    })
  )
}

export async function sendPropertyAlertNotificationToUser({
  userId,
  propertyId,
  propertyPublicId,
  alertRequestId,
  notificationId,
  title,
  body,
  url,
}: {
  userId: string
  propertyId: string
  propertyPublicId?: string | null
  alertRequestId: string
  notificationId?: string | null
  title?: string
  body?: string
  url?: string
}) {
  if (!configureWebPush()) {
    return {
      ok: false,
      sentCount: 0,
      failedCount: 0,
      message: 'Missing VAPID keys.',
    }
  }

  const admin = createAdminClient()

  const { data: subscriptions, error: subscriptionsError } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (subscriptionsError) {
    if (notificationId) {
      await admin
        .from('property_alert_notifications')
        .update({
          status: 'failed',
          error_message: subscriptionsError.message,
        })
        .eq('id', notificationId)
    }

    return {
      ok: false,
      sentCount: 0,
      failedCount: 0,
      message: subscriptionsError.message,
    }
  }

  if (!subscriptions?.length) {
    if (notificationId) {
      await admin
        .from('property_alert_notifications')
        .update({
          status: 'failed',
          error_message: 'No active push subscriptions for this user.',
        })
        .eq('id', notificationId)
    }

    return {
      ok: false,
      sentCount: 0,
      failedCount: 0,
      message: 'No active push subscriptions for this user.',
    }
  }

  const notificationTitle = title || 'سكن جديد مناسب ليك 🎯'
  const notificationBody =
    body || 'نزل سكن قريب من جامعتك وبنفس المواصفات اللي طلبتها.'
  const notificationUrl =
    url || `/properties/${propertyPublicId || propertyId}`

  let sentCount = 0
  let failedCount = 0
  let lastErrorMessage: string | null = null

  await Promise.allSettled(
    (subscriptions as PushSubscriptionRow[]).map(async (subscription) => {
      try {
        await sendPushNotification(subscription, {
          title: notificationTitle,
          body: notificationBody,
          url: notificationUrl,
          tag: `property-alert-${propertyId}`,
          badgeCount: 1,
          requireInteraction: true,
          propertyId,
          alertRequestId,
          notificationId: notificationId || null,
        })

        sentCount += 1
      } catch (error) {
        failedCount += 1
        lastErrorMessage =
          error instanceof Error ? error.message : 'Failed to send push.'

        if (isExpiredPushSubscriptionError(error)) {
          await deactivateSubscription({
            tableName: 'push_subscriptions',
            subscriptionId: subscription.id,
          })
        }
      }
    })
  )

  if (notificationId) {
    await admin
      .from('property_alert_notifications')
      .update({
        status: sentCount > 0 ? 'sent' : 'failed',
        sent_at: sentCount > 0 ? new Date().toISOString() : null,
        error_message: sentCount > 0 ? null : lastErrorMessage,
      })
      .eq('id', notificationId)
  }

  return {
    ok: sentCount > 0,
    sentCount,
    failedCount,
    message:
      sentCount > 0
        ? 'Property alert push notification sent.'
        : lastErrorMessage || 'Failed to send property alert push notification.',
  }
}

export async function sendTestPushNotificationToUser({
  userId,
}: {
  userId: string
}) {
  return sendPropertyAlertNotificationToUser({
    userId,
    propertyId: 'test',
    propertyPublicId: null,
    alertRequestId: 'test',
    title: 'تم تفعيل إشعارات Navienty ✅',
    body: 'هنبلغك أول ما ينزل سكن مناسب للمواصفات اللي اخترتها.',
    url: '/properties',
  })
}