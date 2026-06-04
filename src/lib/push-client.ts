type EnablePushNotificationsResult =
  | {
      ok: true
      status: 'enabled'
      message: string
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
    }

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

export async function enablePushNotifications(): Promise<EnablePushNotificationsResult> {
  if (typeof window === 'undefined') {
    return {
      ok: false,
      status: 'unsupported',
      message: 'Push notifications are not available on the server.',
    }
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return {
      ok: false,
      status: 'unsupported',
      message: 'المتصفح ده لا يدعم الإشعارات.',
    }
  }

  if (!('Notification' in window)) {
    return {
      ok: false,
      status: 'unsupported',
      message: 'المتصفح ده لا يدعم الإشعارات.',
    }
  }

  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  if (!publicVapidKey) {
    return {
      ok: false,
      status: 'missing_vapid_key',
      message: 'VAPID public key is missing.',
    }
  }

  const permission = await Notification.requestPermission()

  if (permission !== 'granted') {
    return {
      ok: false,
      status: 'permission_denied',
      message: 'لازم تسمح بالإشعارات علشان نقدر نبلغك.',
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

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    })

    if (!response.ok) {
      return {
        ok: false,
        status: 'api_failed',
        message: 'سجّل الدخول الأول علشان نقدر نفعّل الإشعارات.',
      }
    }

    return {
      ok: true,
      status: 'enabled',
      message: 'تم تفعيل الإشعارات بنجاح ✅',
    }
  } catch (error) {
    console.error('Failed to enable push notifications:', error)

    return {
      ok: false,
      status: 'subscription_failed',
      message: 'حصلت مشكلة أثناء تفعيل الإشعارات.',
    }
  }
}