'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  disableAdminPushSubscriptionAction,
  saveAdminPushSubscriptionAction,
} from './push-actions'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/')
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

export default function AdminDepositNotifications({
  enabled,
  initialPendingCount,
}: {
  enabled: boolean
  initialPendingCount: number
}) {
  const [isPending, startTransition] = useTransition()
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    'default'
  )
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

  const buttonLabel = useMemo(() => {
    if (!enabled) return 'Notifications unavailable'
    if (permission === 'unsupported') return 'Push not supported'
    if (permission === 'denied') return 'Notifications blocked'
    if (isSubscribed) return 'Notifications on'
    return 'Enable notifications'
  }, [enabled, isSubscribed, permission])

  useEffect(() => {
    if (!enabled) return

    if (!isPushSupported()) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission)

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        setIsSubscribed(Boolean(subscription))
      })
      .catch(() => {
        setMessage('Could not prepare notifications on this device.')
      })
  }, [enabled])

  const handleEnable = () => {
    if (!enabled || isPending) return

    setMessage(null)

    startTransition(async () => {
      try {
        if (!isPushSupported()) {
          setPermission('unsupported')
          setMessage('Push notifications are not supported on this browser.')
          return
        }

        if (!vapidPublicKey) {
          setMessage('Missing VAPID public key.')
          return
        }

        const result = await Notification.requestPermission()
        setPermission(result)

        if (result !== 'granted') {
          setMessage('Notifications permission was not granted.')
          return
        }

        const registration = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        let subscription = await registration.pushManager.getSubscription()

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          })
        }

        await saveAdminPushSubscriptionAction(
          subscription.toJSON(),
          navigator.userAgent
        )

        setIsSubscribed(true)
        setMessage('Deposit notifications are enabled.')
      } catch (error: any) {
        setMessage(error?.message || 'Could not enable notifications.')
      }
    })
  }

  const handleDisable = () => {
    if (!enabled || isPending) return

    setMessage(null)

    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
          await disableAdminPushSubscriptionAction(subscription.endpoint)
          await subscription.unsubscribe()
        }

        setIsSubscribed(false)
        setMessage('Deposit notifications are disabled on this device.')
      } catch (error: any) {
        setMessage(error?.message || 'Could not disable notifications.')
      }
    })
  }

  if (!enabled) {
    return null
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={isSubscribed ? handleDisable : handleEnable}
        disabled={
          isPending || permission === 'unsupported' || permission === 'denied'
        }
        className={[
          'inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold shadow-sm transition',
          isSubscribed
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100',
          'disabled:cursor-not-allowed disabled:opacity-60',
        ].join(' ')}
      >
        <span className="relative flex h-2.5 w-2.5">
          {initialPendingCount > 0 ? (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          ) : null}
          <span
            className={[
              'relative inline-flex h-2.5 w-2.5 rounded-full',
              isSubscribed ? 'bg-emerald-500' : 'bg-blue-600',
            ].join(' ')}
          />
        </span>
        {isPending ? 'Please wait...' : buttonLabel}
      </button>

      {message ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-semibold leading-5 text-slate-600 shadow-xl">
          {message}
        </div>
      ) : null}
    </div>
  )
}