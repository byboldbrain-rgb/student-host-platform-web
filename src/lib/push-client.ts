type EnablePushNotificationsResult =
  | {
      ok: true
      status: 'enabled'
      message: string
      anonymousAlertToken: string
    }
  | {
      ok: false
      status:
        | 'unsupported'
        | 'missing_vapid_key'
        | 'permission_denied'
        | 'service_worker_not_ready'
        | 'subscription_failed'
        | 'api_failed'
      message: string
      anonymousAlertToken?: string
    }

const ANONYMOUS_ALERT_TOKEN_STORAGE_KEY = 'navienty_anonymous_alert_token'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = `${base64String}${padding}`
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export function getAnonymousAlertToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  try {
    const existingToken = window.localStorage.getItem(
      ANONYMOUS_ALERT_TOKEN_STORAGE_KEY
    )

    if (existingToken) {
      return existingToken
    }

    const nextToken =
      typeof window.crypto?.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random()
            .toString(36)
            .slice(2)}`

    window.localStorage.setItem(ANONYMOUS_ALERT_TOKEN_STORAGE_KEY, nextToken)

    return nextToken
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random()
      .toString(36)
      .slice(2)}`
  }
}

function subscriptionToJson(subscription: PushSubscription) {
  const json = subscription.toJSON()

  return {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    },
  }
}

export async function enablePushNotifications(): Promise<EnablePushNotificationsResult> {
  if (typeof window === 'undefined') {
    return {
      ok: false,
      status: 'unsupported',
      message: 'Push notifications are not available on the server.',
    }
  }

  const anonymousAlertToken = getAnonymousAlertToken()

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return {
      ok: false,
      status: 'unsupported',
      message: 'المتصفح ده لا يدعم الإشعارات.',
      anonymousAlertToken,
    }
  }

  if (!('Notification' in window)) {
    return {
      ok: false,
      status: 'unsupported',
      message: 'المتصفح ده لا يدعم الإشعارات.',
      anonymousAlertToken,
    }
  }

  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  if (!publicVapidKey) {
    return {
      ok: false,
      status: 'missing_vapid_key',
      message: 'VAPID public key is missing.',
      anonymousAlertToken,
    }
  }

  const permission = await Notification.requestPermission()

  if (permission !== 'granted') {
    return {
      ok: false,
      status: 'permission_denied',
      message: 'لازم تسمح بالإشعارات علشان نقدر نبلغك.',
      anonymousAlertToken,
    }
  }

  let registration: ServiceWorkerRegistration

  try {
    registration = await navigator.serviceWorker.ready
  } catch {
    return {
      ok: false,
      status: 'service_worker_not_ready',
      message: 'الإشعارات لسه مش جاهزة. جرّب تفتح الصفحة تاني.',
      anonymousAlertToken,
    }
  }

  try {
    const existingSubscription =
      await registration.pushManager.getSubscription()

    const subscription =
      existingSubscription ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      }))

    const subscriptionPayload = subscriptionToJson(subscription)

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...subscriptionPayload,
        anonymous_alert_token: anonymousAlertToken,
      }),
    })

    if (!response.ok) {
      return {
        ok: false,
        status: 'api_failed',
        message: 'حصلت مشكلة أثناء حفظ بيانات الإشعارات.',
        anonymousAlertToken,
      }
    }

    return {
      ok: true,
      status: 'enabled',
      message: 'تم تفعيل الإشعارات بنجاح ✅',
      anonymousAlertToken,
    }
  } catch (error) {
    console.error('Failed to enable push notifications:', error)

    return {
      ok: false,
      status: 'subscription_failed',
      message: 'حصلت مشكلة أثناء تفعيل الإشعارات.',
      anonymousAlertToken,
    }
  }
}