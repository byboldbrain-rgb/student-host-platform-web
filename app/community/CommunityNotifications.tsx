'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { Bell, Check, X } from 'lucide-react'
import {
  disableCommunityPushSubscriptionAction,
  saveCommunityPushSubscriptionAction,
} from './push-actions'

const COMMUNITY_PROMPT_DISMISSED_KEY = 'navienty-community-push-dismissed'
const COMMUNITY_PROMPT_ENABLED_KEY = 'navienty-community-push-enabled'

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

async function getExistingSubscription() {
  if (!isPushSupported()) return null

  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export default function CommunityNotifications() {
  const [isPending, startTransition] = useTransition()
  const [permission, setPermission] = useState<
    NotificationPermission | 'unsupported'
  >('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

  const shouldShowPrompt = useMemo(() => {
    if (permission === 'unsupported') return false
    if (permission === 'denied') return false
    if (isSubscribed) return false
    return isVisible
  }, [isSubscribed, isVisible, permission])

  useEffect(() => {
    let mounted = true

    async function prepareNotifications() {
      if (!isPushSupported()) {
        if (mounted) {
          setPermission('unsupported')
        }
        return
      }

      const currentPermission = Notification.permission
      setPermission(currentPermission)

      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        const subscription = await registration.pushManager.getSubscription()

        if (!mounted) return

        setIsSubscribed(Boolean(subscription))

        if (subscription) {
          localStorage.setItem(COMMUNITY_PROMPT_ENABLED_KEY, '1')
          return
        }

        const dismissed = localStorage.getItem(COMMUNITY_PROMPT_DISMISSED_KEY)
        const enabledBefore = localStorage.getItem(COMMUNITY_PROMPT_ENABLED_KEY)

        if (
          currentPermission === 'default' &&
          dismissed !== '1' &&
          enabledBefore !== '1'
        ) {
          window.setTimeout(() => {
            if (mounted) {
              setIsVisible(true)
            }
          }, 1800)
        }
      } catch {
        // Silent. The prompt should not break the page UI.
      }
    }

    prepareNotifications()

    return () => {
      mounted = false
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem(COMMUNITY_PROMPT_DISMISSED_KEY, '1')
    setIsVisible(false)
    setMessage(null)
  }

  const handleEnable = () => {
    if (isPending) return

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

        const permissionResult = await Notification.requestPermission()
        setPermission(permissionResult)

        if (permissionResult !== 'granted') {
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

        await saveCommunityPushSubscriptionAction(
          subscription.toJSON(),
          navigator.userAgent
        )

        localStorage.setItem(COMMUNITY_PROMPT_ENABLED_KEY, '1')
        localStorage.removeItem(COMMUNITY_PROMPT_DISMISSED_KEY)

        setIsSubscribed(true)
        setMessage('Community notifications are on.')

        window.setTimeout(() => {
          setIsVisible(false)
        }, 900)
      } catch (error: any) {
        setMessage(error?.message || 'Could not enable notifications.')
      }
    })
  }

  const handleDisable = () => {
    if (isPending) return

    setMessage(null)

    startTransition(async () => {
      try {
        const subscription = await getExistingSubscription()

        if (subscription) {
          await disableCommunityPushSubscriptionAction(subscription.endpoint)
          await subscription.unsubscribe()
        }

        localStorage.removeItem(COMMUNITY_PROMPT_ENABLED_KEY)
        setIsSubscribed(false)
        setMessage('Community notifications are disabled on this device.')
      } catch (error: any) {
        setMessage(error?.message || 'Could not disable notifications.')
      }
    })
  }

  if (!shouldShowPrompt) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-[84px] z-[140] px-4 md:bottom-6 md:px-0">
      <div className="mx-auto max-w-[430px] overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-[0_22px_70px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/[0.04] backdrop-blur-xl">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={[
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                isSubscribed
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-blue-50 text-blue-600',
              ].join(' ')}
            >
              {isSubscribed ? <Check className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black tracking-tight text-slate-950">
                    Stay updated with Community
                  </h3>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                    Get notified when new community posts go live.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                  aria-label="Close notifications prompt"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEnable}
                  disabled={
                    isPending ||
                    permission === 'unsupported' ||
                    permission === 'denied'
                  }
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-[#054aff] px-4 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#003ed6] hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {isPending ? 'Please wait...' : 'Turn on'}
                </button>

                {isSubscribed ? (
                  <button
                    type="button"
                    onClick={handleDisable}
                    disabled={isPending}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Off
                  </button>
                ) : null}
              </div>

              {message ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
                  {message}
                </div>
              ) : null}

              {permission === 'denied' ? (
                <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold leading-5 text-rose-700">
                  Notifications are blocked. Enable them from browser site settings.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}