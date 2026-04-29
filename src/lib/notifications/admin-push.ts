import webpush from 'web-push'
import { createAdminClient } from '@/src/lib/supabase/admin'

type NotifyAdminsByRoleInput = {
  roles: string[]
  payload: {
    title: string
    body: string
    url?: string
    tag?: string
    icon?: string
    badge?: string
    badgeCount?: number
  }
  excludeAdminUserId?: string | null
}

type PushSubscriptionRow = {
  id: string
  admin_user_id: string
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

export async function notifyAdminsByRole(input: NotifyAdminsByRoleInput) {
  const isConfigured = configureWebPush()

  if (!isConfigured) {
    console.warn('Push notifications are not configured. Missing VAPID keys.')
    return
  }

  const roles = Array.from(new Set(input.roles.filter(Boolean)))

  if (roles.length === 0) return

  const supabase = createAdminClient()

  let adminsQuery = supabase
    .from('admin_users')
    .select('id')
    .in('role', roles)
    .eq('is_active', true)

  if (input.excludeAdminUserId) {
    adminsQuery = adminsQuery.neq('id', input.excludeAdminUserId)
  }

  const { data: admins, error: adminsError } = await adminsQuery

  if (adminsError) {
    console.error(
      'Failed to load admins for push notification:',
      adminsError.message
    )
    return
  }

  const adminIds = Array.from(new Set((admins || []).map((admin) => admin.id)))

  if (adminIds.length === 0) return

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from('admin_push_subscriptions')
    .select('id, admin_user_id, endpoint, p256dh, auth')
    .in('admin_user_id', adminIds)
    .eq('is_active', true)

  if (subscriptionsError) {
    console.error(
      'Failed to load admin push subscriptions:',
      subscriptionsError.message
    )
    return
  }

  const rows = (subscriptions || []) as PushSubscriptionRow[]

  if (rows.length === 0) return

  const notificationPayload = JSON.stringify({
    title: input.payload.title,
    body: input.payload.body,
    url: input.payload.url || '/admin',
    tag: input.payload.tag || 'navienty-notification',
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
            .from('admin_push_subscriptions')
            .delete()
            .eq('id', row.id)
        } else {
          console.error('Failed to send push notification:', error)
        }
      }
    })
  )
}