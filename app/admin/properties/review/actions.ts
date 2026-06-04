'use server'

import webpush from 'web-push'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { requirePropertyReviewerAccess } from '@/src/lib/admin-auth'
import { sendPropertyAlertNotificationToUser } from '@/src/lib/push-notifications'

type PropertyReviewStatus =
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'archived'

type HousingType = 'single' | 'double' | 'triple' | 'full_apartment'

type PropertyAlertRequest = {
  id: string
  user_id: string | null
  anonymous_alert_token: string | null
  city_id: string | null
  university_id: string | null
  area_id: string | null
  housing_type: HousingType
  max_budget: number | string | null
}

type PropertyForAlert = {
  id: string
  property_id: string
  title_ar: string | null
  title_en: string | null
  city_id: string | null
  university_id: string | null
  area_id: string | null
  price_egp: number | string | null
  admin_status: string
  is_active: boolean
  availability_status: string | null
  property_sellable_options?:
    | Array<{
        code?: string | null
        option_code?: string | null
        sell_mode?: string | null
        price_egp?: number | string | null
        is_active?: boolean | null
        deleted_at?: string | null
      }>
    | null
  property_rooms?:
    | Array<{
        room_type?: string | null
        status?: string | null
        is_active?: boolean | null
        deleted_at?: string | null
        property_room_sellable_options?:
          | Array<{
              code?: string | null
              price_egp?: number | string | null
              is_active?: boolean | null
              deleted_at?: string | null
            }>
          | null
      }>
    | null
}

type PushSubscriptionRow = {
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
    console.warn('Missing VAPID keys. Guest push notification was skipped.')
    return false
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

function normalizeOptionCode(value?: string | null) {
  return value
    ?.toLowerCase()
    .trim()
    .replace(/[-\s]+/g, '_')
}

function normalizeHousingTypeFromOptionCode(value?: string | null) {
  const code = normalizeOptionCode(value)

  if (!code) return null

  if (code === 'single' || code === 'single_room') return 'single'
  if (code === 'double' || code === 'double_room') return 'double'
  if (code === 'triple' || code === 'triple_room') return 'triple'
  if (code === 'full_apartment' || code === 'entire_property') {
    return 'full_apartment'
  }

  return null
}

function isUsablePrice(value: unknown) {
  const price = Number(value)

  return Number.isFinite(price) && price >= 0
}

function isExpiredPushSubscriptionError(error: unknown) {
  const statusCode = (error as { statusCode?: number } | null)?.statusCode
  return statusCode === 404 || statusCode === 410
}

function getPropertyAlertPrices(property: PropertyForAlert) {
  const pricesByHousingType = new Map<HousingType, number>()

  const addPrice = (housingType: string | null, priceValue: unknown) => {
    if (!housingType || !isUsablePrice(priceValue)) return

    if (
      housingType !== 'single' &&
      housingType !== 'double' &&
      housingType !== 'triple' &&
      housingType !== 'full_apartment'
    ) {
      return
    }

    const price = Number(priceValue)
    const existingPrice = pricesByHousingType.get(housingType)

    if (existingPrice === undefined || price < existingPrice) {
      pricesByHousingType.set(housingType, price)
    }
  }

  for (const option of property.property_sellable_options ?? []) {
    if (option.is_active === false || option.deleted_at) continue

    const housingType =
      option.sell_mode === 'entire_property'
        ? 'full_apartment'
        : normalizeHousingTypeFromOptionCode(option.option_code || option.code)

    addPrice(housingType, option.price_egp)
  }

  for (const room of property.property_rooms ?? []) {
    if (room.is_active === false || room.deleted_at) continue
    if (room.status === 'inactive' || room.status === 'fully_reserved') continue

    for (const option of room.property_room_sellable_options ?? []) {
      if (option.is_active === false || option.deleted_at) continue

      const housingType =
        normalizeHousingTypeFromOptionCode(option.code) ||
        normalizeHousingTypeFromOptionCode(room.room_type)

      addPrice(housingType, option.price_egp)
    }
  }

  if (isUsablePrice(property.price_egp)) {
    const fallbackPrice = Number(property.price_egp)

    for (const housingType of [
      'single',
      'double',
      'triple',
      'full_apartment',
    ] as HousingType[]) {
      if (!pricesByHousingType.has(housingType)) {
        pricesByHousingType.set(housingType, fallbackPrice)
      }
    }
  }

  return pricesByHousingType
}

function doesAlertMatchProperty({
  alert,
  property,
  pricesByHousingType,
}: {
  alert: PropertyAlertRequest
  property: PropertyForAlert
  pricesByHousingType: Map<HousingType, number>
}) {
  if (!alert.user_id && !alert.anonymous_alert_token) return false

  if (alert.city_id && property.city_id && alert.city_id !== property.city_id) {
    return false
  }

  if (
    alert.university_id &&
    property.university_id &&
    alert.university_id !== property.university_id
  ) {
    return false
  }

  if (alert.area_id && property.area_id && alert.area_id !== property.area_id) {
    return false
  }

  const maxBudget = Number(alert.max_budget)

  if (!Number.isFinite(maxBudget) || maxBudget < 0) {
    return false
  }

  const matchedPrice = pricesByHousingType.get(alert.housing_type)

  return typeof matchedPrice === 'number' && matchedPrice <= maxBudget
}

async function sendPropertyAlertNotificationToAnonymousToken({
  anonymousAlertToken,
  propertyId,
  propertyPublicId,
  alertRequestId,
  notificationId,
  title,
  body,
  url,
}: {
  anonymousAlertToken: string
  propertyId: string
  propertyPublicId: string
  alertRequestId: string
  notificationId: string
  title: string
  body: string
  url: string
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
    .eq('anonymous_alert_token', anonymousAlertToken)
    .eq('is_active', true)

  if (subscriptionsError) {
    await admin
      .from('property_alert_notifications')
      .update({
        status: 'failed',
        error_message: subscriptionsError.message,
      })
      .eq('id', notificationId)

    return {
      ok: false,
      sentCount: 0,
      failedCount: 0,
      message: subscriptionsError.message,
    }
  }

  if (!subscriptions?.length) {
    await admin
      .from('property_alert_notifications')
      .update({
        status: 'failed',
        error_message: 'No active push subscriptions for this guest token.',
      })
      .eq('id', notificationId)

    return {
      ok: false,
      sentCount: 0,
      failedCount: 0,
      message: 'No active push subscriptions for this guest token.',
    }
  }

  let sentCount = 0
  let failedCount = 0
  let lastErrorMessage: string | null = null

  await Promise.allSettled(
    (subscriptions as PushSubscriptionRow[]).map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({
            title,
            body,
            url: url || `/properties/${propertyPublicId || propertyId}`,
            tag: `property-alert-${propertyId}`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            badgeCount: 1,
            renotify: true,
            requireInteraction: true,
            propertyId,
            alertRequestId,
            notificationId,
          })
        )

        sentCount += 1
      } catch (error) {
        failedCount += 1
        lastErrorMessage =
          error instanceof Error ? error.message : 'Failed to send push.'

        if (isExpiredPushSubscriptionError(error)) {
          await admin
            .from('push_subscriptions')
            .update({
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id)
        }
      }
    })
  )

  await admin
    .from('property_alert_notifications')
    .update({
      status: sentCount > 0 ? 'sent' : 'failed',
      sent_at: sentCount > 0 ? new Date().toISOString() : null,
      error_message: sentCount > 0 ? null : lastErrorMessage,
    })
    .eq('id', notificationId)

  return {
    ok: sentCount > 0,
    sentCount,
    failedCount,
    message:
      sentCount > 0
        ? 'Guest property alert push notification sent.'
        : lastErrorMessage || 'Failed to send guest property alert push notification.',
  }
}

async function notifyMatchingPropertyAlerts(propertyId: string) {
  const admin = createAdminClient()

  const { data: property, error: propertyError } = await admin
    .from('properties')
    .select(`
      id,
      property_id,
      title_ar,
      title_en,
      city_id,
      university_id,
      area_id,
      price_egp,
      admin_status,
      is_active,
      availability_status,
      property_sellable_options(
        code,
        option_code,
        sell_mode,
        price_egp,
        is_active,
        deleted_at
      ),
      property_rooms(
        room_type,
        status,
        is_active,
        deleted_at,
        property_room_sellable_options(
          code,
          price_egp,
          is_active,
          deleted_at
        )
      )
    `)
    .eq('id', propertyId)
    .maybeSingle()

  if (propertyError || !property) {
    console.error('Failed to load property for alerts:', propertyError)
    return
  }

  const typedProperty = property as PropertyForAlert

  if (
    typedProperty.admin_status !== 'published' ||
    typedProperty.is_active !== true ||
    typedProperty.availability_status === 'inactive'
  ) {
    return
  }

  const pricesByHousingType = getPropertyAlertPrices(typedProperty)

  if (pricesByHousingType.size === 0) {
    return
  }

  const minAvailablePrice = Math.min(...Array.from(pricesByHousingType.values()))

  const { data: alerts, error: alertsError } = await admin
    .from('property_alert_requests')
    .select(`
      id,
      user_id,
      anonymous_alert_token,
      city_id,
      university_id,
      area_id,
      housing_type,
      max_budget
    `)
    .eq('status', 'active')
    .eq('city_id', typedProperty.city_id)
    .eq('university_id', typedProperty.university_id)
    .gte('max_budget', minAvailablePrice)

  if (alertsError || !alerts?.length) {
    if (alertsError) {
      console.error('Failed to load matching alert requests:', alertsError)
    }

    return
  }

  const matchedAlerts = (alerts as PropertyAlertRequest[]).filter((alert) =>
    doesAlertMatchProperty({
      alert,
      property: typedProperty,
      pricesByHousingType,
    })
  )

  if (matchedAlerts.length === 0) {
    return
  }

  const propertyTitle =
    typedProperty.title_ar || typedProperty.title_en || 'سكن جديد'

  await Promise.allSettled(
    matchedAlerts.map(async (alert) => {
      const notificationTitle = 'سكن جديد مناسب ليك 🎯'
      const notificationBody = `نزل ${propertyTitle} مطابق للمواصفات والميزانية اللي اخترتها.`
      const notificationUrl = `/properties/${typedProperty.property_id}`

      const { data: notification, error: notificationError } = await admin
        .from('property_alert_notifications')
        .upsert(
          {
            alert_request_id: alert.id,
            property_id: typedProperty.id,
            user_id: alert.user_id ?? null,
            anonymous_alert_token: alert.anonymous_alert_token ?? null,
            notification_title: notificationTitle,
            notification_body: notificationBody,
            notification_url: notificationUrl,
            status: 'pending',
            error_message: null,
          },
          {
            onConflict: 'alert_request_id,property_id',
            ignoreDuplicates: true,
          }
        )
        .select('id')
        .maybeSingle()

      if (notificationError) {
        console.error('Failed to create property alert notification:', {
          alertRequestId: alert.id,
          propertyId: typedProperty.id,
          error: notificationError,
        })

        return
      }

      if (!notification?.id) {
        return
      }

      if (alert.user_id) {
        await sendPropertyAlertNotificationToUser({
          userId: alert.user_id,
          propertyId: typedProperty.id,
          propertyPublicId: typedProperty.property_id,
          alertRequestId: alert.id,
          notificationId: notification.id,
          title: notificationTitle,
          body: notificationBody,
          url: notificationUrl,
        })

        return
      }

      if (alert.anonymous_alert_token) {
        await sendPropertyAlertNotificationToAnonymousToken({
          anonymousAlertToken: alert.anonymous_alert_token,
          propertyId: typedProperty.id,
          propertyPublicId: typedProperty.property_id,
          alertRequestId: alert.id,
          notificationId: notification.id,
          title: notificationTitle,
          body: notificationBody,
          url: notificationUrl,
        })
      }
    })
  )
}

async function updatePropertyReviewStatus(
  propertyId: string,
  nextStatus: PropertyReviewStatus,
  reviewNotes?: string
) {
  const adminContext = await requirePropertyReviewerAccess()
  const supabase = await createClient()

  const isPublished = nextStatus === 'published'
  const isPendingReview = nextStatus === 'pending_review'

  const { error } = await supabase
    .from('properties')
    .update({
      admin_status: nextStatus,
      is_active: isPublished,
      reviewed_by_admin_id: isPendingReview ? null : adminContext.admin.id,
      reviewed_at: isPendingReview ? null : new Date().toISOString(),
      review_notes: reviewNotes?.trim() || null,
      updated_by_admin_id: adminContext.admin.id,
    })
    .eq('id', propertyId)

  if (error) {
    throw new Error(error.message)
  }

  if (isPublished) {
    try {
      await notifyMatchingPropertyAlerts(propertyId)
    } catch (notificationError) {
      console.error(
        'Property was published, but matching push notifications failed:',
        notificationError
      )
    }
  }

  revalidatePath('/admin/properties/review')
  revalidatePath('/admin/properties')
  revalidatePath('/properties')
  revalidatePath('/properties/search')
}

export async function approvePropertyAction(formData: FormData) {
  const propertyId = String(formData.get('property_id') || '')
  const reviewNotes = String(formData.get('review_notes') || '')

  if (!propertyId) {
    throw new Error('Property ID is required')
  }

  await updatePropertyReviewStatus(propertyId, 'published', reviewNotes)
}

export async function rejectPropertyAction(formData: FormData) {
  const propertyId = String(formData.get('property_id') || '')
  const reviewNotes = String(formData.get('review_notes') || '')

  if (!propertyId) {
    throw new Error('Property ID is required')
  }

  await updatePropertyReviewStatus(propertyId, 'rejected', reviewNotes)
}

export async function archivePropertyAction(formData: FormData) {
  const propertyId = String(formData.get('property_id') || '')
  const reviewNotes = String(formData.get('review_notes') || '')

  if (!propertyId) {
    throw new Error('Property ID is required')
  }

  await updatePropertyReviewStatus(propertyId, 'archived', reviewNotes)
}

export async function returnPropertyToReviewAction(formData: FormData) {
  const propertyId = String(formData.get('property_id') || '')
  const reviewNotes =
    String(formData.get('review_notes') || '').trim() ||
    'Returned to review after being published.'

  if (!propertyId) {
    throw new Error('Property ID is required')
  }

  await updatePropertyReviewStatus(propertyId, 'pending_review', reviewNotes)
}