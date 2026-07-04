import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

type PushSubscriptionRow = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

type SendAdminWhatsAppPushNotificationInput = {
  conversationId: string
  contactName?: string | null
  contactPhone?: string | null
  messageBody?: string | null
  messageType?: string | null
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject =
    process.env.VAPID_SUBJECT || 'mailto:g27rbkznrs@privaterelay.appleid.com'

  if (!publicKey || !privateKey) {
    console.error('ADMIN_WHATSAPP_PUSH_MISSING_VAPID_KEYS')
    return false
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

function buildNotificationBody({
  contactPhone,
  messageBody,
  messageType,
}: {
  contactPhone?: string | null
  messageBody?: string | null
  messageType?: string | null
}) {
  const cleanBody = messageBody?.trim()

  if (cleanBody) {
    return cleanBody.length > 120 ? `${cleanBody.slice(0, 120)}...` : cleanBody
  }

  if (messageType && messageType !== 'text') {
    return `New ${messageType} message${contactPhone ? ` from ${contactPhone}` : ''}`
  }

  return contactPhone ? `New message from ${contactPhone}` : 'New WhatsApp message'
}

export async function sendAdminWhatsAppPushNotification({
  conversationId,
  contactName,
  contactPhone,
  messageBody,
  messageType,
}: SendAdminWhatsAppPushNotificationInput) {
  if (!configureWebPush()) {
    return
  }

  const supabase = getSupabaseAdminClient()

  const { data: subscriptions, error } = await supabase
    .from('admin_push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('is_active', true)

  if (error) {
    console.error('ADMIN_WHATSAPP_PUSH_SUBSCRIPTIONS_FETCH_ERROR:', error)
    return
  }

  const rows = (subscriptions ?? []) as PushSubscriptionRow[]

  if (rows.length === 0) {
    console.log('ADMIN_WHATSAPP_PUSH_NO_ACTIVE_SUBSCRIPTIONS')
    return
  }

  const title = `رسالة واتساب جديدة من ${contactName || contactPhone || 'عميل'}`
  const body = buildNotificationBody({
    contactPhone,
    messageBody,
    messageType,
  })

  const payload = JSON.stringify({
    title,
    body,
    url: `/admin/whatsapp/${conversationId}`,
    tag: `whatsapp-conversation-${conversationId}`,
    renotify: true,
    requireInteraction: true,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    badgeCount: 1,
    conversationId,
    notificationType: 'whatsapp_message',
  })

  await Promise.allSettled(
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
          payload
        )
      } catch (sendError: any) {
        const statusCode = sendError?.statusCode

        console.error('ADMIN_WHATSAPP_PUSH_SEND_ERROR:', {
          subscriptionId: row.id,
          statusCode,
          message: sendError?.message,
        })

        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from('admin_push_subscriptions')
            .update({
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', row.id)
        }
      }
    })
  )
}