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
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
    >
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
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supported = isPushSupported()

    setIsSupported(supported)
    setHasCheckedSupport(true)

    if (supported) {
      setPermission(Notification.permission)
    }
  }, [])

  async function enableNotifications() {
    setMessage(null)

    if (!isPushSupported()) {
      setMessage(
        'المتصفح ده مش بيدعم Push Notifications. على iPhone افتح Navienty من Home Screen بعد Add to Home Screen.'
      )
      return
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

    if (!vapidPublicKey) {
      setMessage('VAPID public key مش موجود في env.')
      return
    }

    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        const nextPermission = await Notification.requestPermission()

        setPermission(nextPermission)

        if (nextPermission !== 'granted') {
          setMessage('لازم تعمل Allow للإشعارات علشان توصلك على التليفون.')
          return
        }

        let subscription = await registration.pushManager.getSubscription()

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          })
        }

        const response = await fetch('/api/whatsapp/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription),
        })

        const result = await response.json().catch(() => null)

        if (!response.ok || !result?.ok) {
          setMessage(result?.error || 'فشل حفظ الجهاز للإشعارات.')
          return
        }

        setMessage('تم تفعيل إشعارات رسائل واتساب على الجهاز ده ✅')

        if (registration.active) {
          registration.active.postMessage({
            type: 'NAVIENTY_TEST_NOTIFICATION',
            title: 'Navienty WhatsApp',
            body: 'تم تفعيل إشعارات رسائل واتساب بنجاح ✅',
            url: '/admin/whatsapp',
            badgeCount: 1,
          })
        }
      } catch (error) {
        console.error('ENABLE_WHATSAPP_NOTIFICATIONS_ERROR:', error)
        setMessage('حصل خطأ أثناء تفعيل الإشعارات.')
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

      {message ? (
        <div className="absolute right-0 top-12 z-50 w-[280px] rounded-2xl border border-blue-100 bg-white p-3 text-xs font-bold leading-5 text-slate-700 shadow-2xl shadow-slate-950/15">
          {message}
        </div>
      ) : null}
    </div>
  )
}
