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

export default function EnableWhatsappNotificationsButton() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] =
    useState<NotificationPermission>('default')
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!isPushSupported()) {
      setIsSupported(false)
      return
    }

    setIsSupported(true)
    setPermission(Notification.permission)
  }, [])

  async function enableNotifications() {
    setMessage(null)

    if (!isPushSupported()) {
      setMessage('المتصفح ده مش بيدعم Push Notifications.')
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

        const response = await fetch('/api/admin/whatsapp/push/subscribe', {
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

  if (!isSupported) {
    return null
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={enableNotifications}
        disabled={isPending}
        className={[
          'hidden h-10 items-center gap-2 rounded-full px-4 text-sm font-bold shadow-sm transition sm:inline-flex',
          permission === 'granted'
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100'
            : 'bg-[#0B55FF] text-white shadow-blue-500/20 hover:bg-[#0048DB]',
          isPending ? 'cursor-not-allowed opacity-60' : '',
        ].join(' ')}
      >
        {isPending ? 'Activating...' : permission === 'granted' ? 'Notifications On' : 'Enable Notifications'}
      </button>

      {message ? (
        <p className="hidden max-w-[280px] text-right text-[11px] font-semibold text-slate-500 sm:block">
          {message}
        </p>
      ) : null}
    </div>
  )
}