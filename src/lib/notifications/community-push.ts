import webpush from 'web-push'
import { createAdminClient } from '@/src/lib/supabase/admin'

type NotifyCommunitySubscribersInput = {
  payload: {
    title: string
    body: string
    url?: string
    tag?: string
    icon?: string
    badge?: string
    badgeCount?: number
  }
}

type CommunityPushSubscriptionRow = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
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

function normalizeBadgeCount(value?: number) {
  const count = Number(value || 0)

  if (!Number.isFinite(count) || count < 0) {
    return 0
  }

  return Math.floor(count)
}

export async function notifyCommunitySubscribers(
  input: NotifyCommunitySubscribersInput
) {
  const isConfigured = configureWebPush()

  if (!isConfigured) {
    console.warn(
      'Community push notifications are not configured. Missing VAPID keys.'
    )
    return
  }

  const supabase = createAdminClient()

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from('community_push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('is_active', true)

  if (subscriptionsError) {
    console.error(
      'Failed to load community push subscriptions:',
      subscriptionsError.message
    )
    return
  }

  const rows = (subscriptions || []) as CommunityPushSubscriptionRow[]

  if (rows.length === 0) return

  const notificationPayload = JSON.stringify({
    title: input.payload.title,
    body: input.payload.body,
    url: input.payload.url || '/community',
    tag: input.payload.tag || 'community-post',
    icon: input.payload.icon || '/icon-192.png',
    badge: input.payload.badge || '/icon-192.png',
    badgeCount: normalizeBadgeCount(input.payload.badgeCount),
  })

  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: {
              p256dh: row.p256dh,
              auth: row.auth,
            },
          },
          notificationPayload
        )
      } catch (error: any) {
        const statusCode = error?.statusCode

        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from('community_push_subscriptions')
            .delete()
            .eq('id', row.id)
        } else {
          console.error('Failed to send community push notification:', error)
        }
      }
    })
  )
}