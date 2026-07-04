'use client'

import { useEffect, useState, useTransition } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = `${base64String}${padding}`
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }

  return outputArray
}

function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

function BellIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8.75a6 6 0 0 0-12 0c0 7-3 7.75-3 7.75h18s-3-.75-3-7.75Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.1 20a2.25 2.25 0 0 1-4.2 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function EnableWhatsappNotificationsButton() {
  const [isSupported, setIsSupported] = useState(false)
  const [hasCheckedSupport, setHasCheckedSupport] = useState(false)
  const [permission, setPermission] =
    useState<NotificationPermission>('default')
  const [message, setMessage] = useState<string | null>(null)
  const [debugLines, setDebugLines] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  function addDebug(line: string) {
    setDebugLines((current) => [
      `${new Date().toLocaleTimeString()} - ${line}`,
      ...current,
    ].slice(0, 12))
  }

  useEffect(() => {
    const supported = isPushSupported()

    setIsSupported(supported)
    setHasCheckedSupport(true)

    addDebug(`support=${supported ? 'yes' : 'no'}`)

    if (typeof window !== 'undefined') {
      addDebug(`displayModeStandalone=${window.matchMedia('(display-mode: standalone)').matches ? 'yes' : 'no'}`)
      addDebug(`navigatorStandalone=${(navigator as any).standalone ? 'yes' : 'no'}`)
    }

    if (supported) {
      setPermission(Notification.permission)
      addDebug(`permission=${Notification.permission}`)
    }
  }, [])

  async function enableNotifications() {
    setMessage(null)
    addDebug('button clicked')

    if (!isPushSupported()) {
      setMessage(
        'المتصفح ده مش بيدعم Push Notifications. لازم تفتح من Home Screen على iPhone.'
      )
      addDebug('stopped: push not supported')
      return
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

    if (!vapidPublicKey) {
      setMessage('NEXT_PUBLIC_VAPID_PUBLIC_KEY مش موجود في Vercel env.')
      addDebug('stopped: missing public VAPID key')
      return
    }

    addDebug(`publicKeyLength=${vapidPublicKey.length}`)

    startTransition(async () => {
      try {
        addDebug('registering service worker')
        const registration = await navigator.serviceWorker.register('/sw.js')

        addDebug(`serviceWorkerScope=${registration.scope}`)

        const readyRegistration = await navigator.serviceWorker.ready
        addDebug(`serviceWorkerReady=${readyRegistration.scope}`)

        addDebug('requesting notification permission')
        const nextPermission = await Notification.requestPermission()

        setPermission(nextPermission)
        addDebug(`permissionResult=${nextPermission}`)

        if (nextPermission !== 'granted') {
          setMessage('الإشعارات مرفوضة أو لم يتم السماح بها من iPhone.')
          addDebug('stopped: permission not granted')
          return
        }

        let subscription = await readyRegistration.pushManager.getSubscription()

        addDebug(`existingSubscription=${subscription ? 'yes' : 'no'}`)

        if (!subscription) {
          addDebug('creating push subscription')

          subscription = await readyRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          })

          addDebug('subscription created')
        }

        const subscriptionJson = subscription.toJSON()

        addDebug(`endpointExists=${subscriptionJson.endpoint ? 'yes' : 'no'}`)
        addDebug(`p256dhExists=${subscriptionJson.keys?.p256dh ? 'yes' : 'no'}`)
        addDebug(`authExists=${subscriptionJson.keys?.auth ? 'yes' : 'no'}`)

        addDebug('posting subscription to server')

        const response = await fetch('/api/whatsapp/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscriptionJson),
        })

        const result = await response.json().catch(() => null)

        addDebug(`serverStatus=${response.status}`)
        addDebug(`serverOk=${result?.ok ? 'yes' : 'no'}`)

        if (!response.ok || !result?.ok) {
          setMessage(result?.error || 'فشل حفظ الجهاز للإشعارات.')
          addDebug(`serverError=${result?.error || 'unknown'}`)
          return
        }

        setMessage('تم تفعيل الإشعارات وحفظ الجهاز في الداتابيز ✅')
        addDebug('done: subscription saved')

        if (readyRegistration.active) {
          readyRegistration.active.postMessage({
            type: 'NAVIENTY_TEST_NOTIFICATION',
            title: 'Navienty WhatsApp',
            body: 'تم تفعيل إشعارات رسائل واتساب بنجاح ✅',
            url: '/admin/whatsapp',
            badgeCount: 1,
          })

          addDebug('test notification sent to service worker')
        }
      } catch (error: any) {
        console.error('ENABLE_WHATSAPP_NOTIFICATIONS_ERROR:', error)
        setMessage(error?.message || 'حصل خطأ أثناء تفعيل الإشعارات.')
        addDebug(`catchError=${error?.name || 'Error'}: ${error?.message || 'unknown'}`)
      }
    })
  }

  const isDisabled = isPending || (hasCheckedSupport && !isSupported)
  const label = isPending
    ? 'Activating...'
    : permission === 'granted'
      ? 'Notifications On'
      : hasCheckedSupport && !isSupported
        ? 'Notifications unavailable'
        : 'Enable Notifications'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={enableNotifications}
        disabled={isDisabled}
        className={[
          'inline-flex h-10 items-center gap-2 rounded-full px-3 text-xs font-black transition sm:px-4 sm:text-sm',
          permission === 'granted'
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100'
            : 'bg-blue-50 text-[#0B55FF] ring-1 ring-blue-100 hover:bg-blue-100',
          isDisabled ? 'cursor-not-allowed opacity-70' : '',
        ].join(' ')}
        title={label}
      >
        {isPending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
        ) : (
          <BellIcon />
        )}

        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">
          {permission === 'granted' ? 'On' : 'Notify'}
        </span>
      </button>

      {message || debugLines.length > 0 ? (
        <div className="absolute right-0 top-12 z-50 w-[340px] max-w-[calc(100vw-24px)] rounded-2xl border border-blue-100 bg-white p-3 text-xs font-bold leading-5 text-slate-700 shadow-2xl shadow-slate-950/15">
          {message ? <div className="mb-2 text-[#0B55FF]">{message}</div> : null}

          <div className="max-h-56 overflow-y-auto rounded-xl bg-slate-50 p-2 font-mono text-[11px] font-semibold text-slate-600">
            {debugLines.map((line, index) => (
              <div key={`${line}-${index}`}>{line}</div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}