import webpush from 'web-push'
import { createAdminClient } from '@/src/lib/supabase/admin'

type PushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
  badge?: string
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@navienty.com'

  if (!publicKey || !privateKey) {
    return false
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

async function sendPushNotification(
  subscription: {
    endpoint: string
    p256dh: string
    auth: string
  },
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
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/admin/finance/deposit-requests',
      tag: payload.tag || 'deposit-request',
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
    })
  )
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
    subscriptions.map(async (subscription) => {
      try {
        await sendPushNotification(subscription, {
          title: 'New deposit request',
          body,
          url: '/admin/finance/deposit-requests',
          tag: `deposit-request-${depositRequestId}`,
        })
      } catch (error: any) {
        const statusCode = error?.statusCode

        if (statusCode === 404 || statusCode === 410) {
          await admin
            .from('admin_push_subscriptions')
            .update({
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id)
        }
      }
    })
  )
}