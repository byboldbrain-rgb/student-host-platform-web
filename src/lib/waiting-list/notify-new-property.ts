import webpush from 'web-push'
import { createAdminClient } from '@/src/lib/supabase/admin'

type WaitingListRequestRelation = {
  id: string
  university_id: string
  status: string
  notify_by_push: boolean
  min_budget_egp: number | null
  max_budget_egp: number | null
}

type WaitingListSubscriptionRow = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
  waiting_list_request_id: string | null
  request: WaitingListRequestRelation | WaitingListRequestRelation[] | null
}

type PropertyRow = {
  id: string
  property_id: string
  title_en: string | null
  title_ar: string | null
  university_id: string
  price_egp: number | null
  is_active: boolean
  admin_status: string
  availability_status: string
}

type PropertySellableOptionRow = {
  price_egp: number | null
  is_active: boolean
}

function getSingleRelation<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null
  }

  if (Array.isArray(value)) {
    return value[0] || null
  }

  return value
}

function isPropertyInsideBudget(
  propertyPrice: number | null,
  minBudget: number | null,
  maxBudget: number | null
) {
  if (propertyPrice === null) {
    return true
  }

  if (minBudget !== null && propertyPrice < minBudget) {
    return false
  }

  if (maxBudget !== null && propertyPrice > maxBudget) {
    return false
  }

  return true
}

function getLowestAvailablePrice(
  propertyPrice: number | null,
  sellableOptions: PropertySellableOptionRow[]
) {
  const optionPrices = sellableOptions
    .filter((option) => option.is_active !== false)
    .map((option) => {
      if (option.price_egp === null || option.price_egp === undefined) {
        return null
      }

      const parsedPrice = Number(option.price_egp)

      return Number.isFinite(parsedPrice) && parsedPrice >= 0
        ? parsedPrice
        : null
    })
    .filter((price): price is number => price !== null)

  if (optionPrices.length > 0) {
    return Math.min(...optionPrices)
  }

  if (propertyPrice === null || propertyPrice === undefined) {
    return null
  }

  const parsedPropertyPrice = Number(propertyPrice)

  return Number.isFinite(parsedPropertyPrice) && parsedPropertyPrice >= 0
    ? parsedPropertyPrice
    : null
}

export async function notifyWaitingListStudentsForNewProperty(
  propertyId: string
) {
  const cleanPropertyId = String(propertyId || '').trim()

  if (!cleanPropertyId) {
    return {
      success: false,
      sentCount: 0,
      reason: 'missing_property_id',
    }
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:info@navienty.com'

  if (!vapidPublicKey || !vapidPrivateKey) {
    return {
      success: false,
      sentCount: 0,
      reason: 'missing_vapid_keys',
    }
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  const supabase = createAdminClient()

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select(
      `
      id,
      property_id,
      title_en,
      title_ar,
      university_id,
      price_egp,
      is_active,
      admin_status,
      availability_status
    `
    )
    .eq('id', cleanPropertyId)
    .maybeSingle()

  if (propertyError) {
    throw new Error(propertyError.message)
  }

  if (!property) {
    return {
      success: false,
      sentCount: 0,
      reason: 'property_not_found',
    }
  }

  const typedProperty = property as PropertyRow

  if (!typedProperty.is_active || typedProperty.admin_status !== 'published') {
    return {
      success: true,
      sentCount: 0,
      reason: 'property_not_published',
    }
  }

  if (
    typedProperty.availability_status !== 'available' &&
    typedProperty.availability_status !== 'partially_reserved'
  ) {
    return {
      success: true,
      sentCount: 0,
      reason: 'property_not_available',
    }
  }

  const { data: sellableOptions, error: sellableOptionsError } = await supabase
    .from('property_sellable_options')
    .select('price_egp, is_active')
    .eq('property_id', typedProperty.id)
    .eq('is_active', true)

  if (sellableOptionsError) {
    throw new Error(sellableOptionsError.message)
  }

  const lowestAvailablePrice = getLowestAvailablePrice(
    typedProperty.price_egp === null ? null : Number(typedProperty.price_egp),
    (sellableOptions || []) as PropertySellableOptionRow[]
  )

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from('property_waiting_list_push_subscriptions')
    .select(
      `
      id,
      endpoint,
      p256dh,
      auth,
      waiting_list_request_id,
      request:property_waiting_list_requests!property_waiting_list_push_subscriptions_request_fkey (
        id,
        university_id,
        status,
        notify_by_push,
        min_budget_egp,
        max_budget_egp
      )
    `
    )
    .eq('is_active', true)
    .eq('request.university_id', typedProperty.university_id)
    .eq('request.status', 'active')
    .eq('request.notify_by_push', true)

  if (subscriptionsError) {
    throw new Error(subscriptionsError.message)
  }

  const rows = (subscriptions || []) as WaitingListSubscriptionRow[]

  if (rows.length === 0) {
    return {
      success: true,
      sentCount: 0,
      reason: 'no_matching_subscriptions',
    }
  }

  const requestIds = Array.from(
    new Set(
      rows
        .map((row) => getSingleRelation(row.request)?.id)
        .filter(Boolean) as string[]
    )
  )

  if (requestIds.length === 0) {
    return {
      success: true,
      sentCount: 0,
      reason: 'no_matching_requests',
    }
  }

  const { data: existingLogs, error: logsError } = await supabase
    .from('property_waiting_list_notification_logs')
    .select('waiting_list_request_id')
    .eq('property_id', typedProperty.id)
    .in('waiting_list_request_id', requestIds)

  if (logsError) {
    throw new Error(logsError.message)
  }

  const alreadyNotifiedRequestIds = new Set(
    (existingLogs || []).map((log) => log.waiting_list_request_id)
  )

  let sentCount = 0
  const notifiedRequestIds = new Set<string>()

  const propertyTitle =
    typedProperty.title_ar || typedProperty.title_en || 'سكن جديد'

  const propertyUrl = `/properties/${typedProperty.property_id}`

  const titleAr = 'سكن جديد مناسب لجامعتك 🎉'
  const bodyAr = `تم إضافة سكن جديد في نفس الجامعة: ${propertyTitle}`

  const payload = JSON.stringify({
    title: titleAr,
    body: bodyAr,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: propertyUrl,
    data: {
      type: 'waiting_list_new_property',
      propertyId: typedProperty.id,
      propertyCode: typedProperty.property_id,
      universityId: typedProperty.university_id,
      url: propertyUrl,
    },
  })

  for (const subscription of rows) {
    const request = getSingleRelation(subscription.request)

    if (!request) {
      continue
    }

    if (alreadyNotifiedRequestIds.has(request.id)) {
      continue
    }

    if (
      !isPropertyInsideBudget(
        lowestAvailablePrice,
        request.min_budget_egp === null ? null : Number(request.min_budget_egp),
        request.max_budget_egp === null ? null : Number(request.max_budget_egp)
      )
    ) {
      continue
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload
      )

      sentCount += 1
      notifiedRequestIds.add(request.id)
    } catch (error: any) {
      const statusCode = error?.statusCode

      if (statusCode === 404 || statusCode === 410) {
        await supabase
          .from('property_waiting_list_push_subscriptions')
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id)
      }
    }
  }

  if (notifiedRequestIds.size > 0) {
    const logsToInsert = Array.from(notifiedRequestIds).map((requestId) => ({
      waiting_list_request_id: requestId,
      property_id: typedProperty.id,
      status: 'sent',
      created_at: new Date().toISOString(),
    }))

    const { error: insertLogsError } = await supabase
      .from('property_waiting_list_notification_logs')
      .upsert(logsToInsert, {
        onConflict: 'waiting_list_request_id,property_id',
      })

    if (insertLogsError) {
      throw new Error(insertLogsError.message)
    }
  }

  return {
    success: true,
    sentCount,
    reason: 'done',
  }
}