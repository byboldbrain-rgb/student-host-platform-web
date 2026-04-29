'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  getAdminPropertyBookingPushStatusAction,
  getAdminPushPublicKeyAction,
  subscribeAdminPropertyBookingPushAction,
  unsubscribeAdminPropertyBookingPushAction,
} from './push-actions'

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

type AdminPropertyBookingNotificationsProps = {
  openRequestsCount?: number
}

function BellIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function CheckIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function AlertIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
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

function normalizeBadgeCount(value?: number) {
  const count = Number(value || 0)

  if (!Number.isFinite(count) || count <= 0) {
    return 0
  }

  return Math.floor(count)
}

async function getExistingSubscription() {
  if (!('serviceWorker' in navigator)) {
    return null
  }

  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

async function syncAppBadge(count: number) {
  try {
    if (!('setAppBadge' in navigator) || !('clearAppBadge' in navigator)) {
      return
    }

    if (count > 0) {
      await navigator.setAppBadge(count)
    } else {
      await navigator.clearAppBadge()
    }
  } catch (error) {
    console.warn('Failed to sync app badge:', error)
  }
}

export default function AdminPropertyBookingNotifications({
  openRequestsCount = 0,
}: AdminPropertyBookingNotificationsProps) {
  const [permissionState, setPermissionState] =
    useState<PermissionState>('default')
  const [isEnabled, setIsEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const normalizedOpenRequestsCount = normalizeBadgeCount(openRequestsCount)

  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false

    return (
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    )
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadStatus() {
      if (!isSupported) {
        if (mounted) {
          setPermissionState('unsupported')
        }
        return
      }

      setPermissionState(Notification.permission as PermissionState)

      try {
        const statusResult = await getAdminPropertyBookingPushStatusAction()

        if (mounted && statusResult.success) {
          setIsEnabled(statusResult.isEnabled)
        }
      } catch {
        // Silent because the user can retry by pressing the button.
      }
    }

    loadStatus()

    return () => {
      mounted = false
    }
  }, [isSupported])

  useEffect(() => {
    if (!isSupported) return
    if (permissionState !== 'granted') return

    syncAppBadge(normalizedOpenRequestsCount)
  }, [isSupported, permissionState, normalizedOpenRequestsCount])

  const handleEnableNotifications = () => {
    setMessage('')
    setErrorMessage('')

    startTransition(async () => {
      try {
        if (!isSupported) {
          setPermissionState('unsupported')
          setErrorMessage('This browser does not support push notifications.')
          return
        }

        const publicKeyResult = await getAdminPushPublicKeyAction()

        if (!publicKeyResult.success) {
          setErrorMessage(publicKeyResult.error)
          return
        }

        const permission = await Notification.requestPermission()
        setPermissionState(permission as PermissionState)

        if (permission !== 'granted') {
          setErrorMessage(
            'Notifications permission was not granted. Please allow notifications from your browser settings.'
          )
          return
        }

        const registration = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        const existingSubscription =
          await registration.pushManager.getSubscription()

        if (existingSubscription) {
          const result = await subscribeAdminPropertyBookingPushAction({
            endpoint: existingSubscription.endpoint,
            keys: {
              p256dh: existingSubscription.toJSON().keys?.p256dh || '',
              auth: existingSubscription.toJSON().keys?.auth || '',
            },
            userAgent: navigator.userAgent,
          })

          if (!result.success) {
            setErrorMessage(result.error)
            return
          }

          await syncAppBadge(normalizedOpenRequestsCount)

          setIsEnabled(true)
          setMessage('Notifications are enabled for new reservation requests.')
          return
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKeyResult.publicKey),
        })

        const subscriptionJson = subscription.toJSON()

        const result = await subscribeAdminPropertyBookingPushAction({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscriptionJson.keys?.p256dh || '',
            auth: subscriptionJson.keys?.auth || '',
          },
          userAgent: navigator.userAgent,
        })

        if (!result.success) {
          setErrorMessage(result.error)
          return
        }

        await syncAppBadge(normalizedOpenRequestsCount)

        setIsEnabled(true)
        setMessage('Notifications are enabled for new reservation requests.')
      } catch (error: any) {
        setErrorMessage(error?.message || 'Failed to enable notifications.')
      }
    })
  }

  const handleDisableNotifications = () => {
    setMessage('')
    setErrorMessage('')

    startTransition(async () => {
      try {
        const subscription = await getExistingSubscription()

        if (!subscription) {
          await syncAppBadge(0)

          setIsEnabled(false)
          setMessage('Notifications are already disabled on this browser.')
          return
        }

        const endpoint = subscription.endpoint

        await subscription.unsubscribe()

        const result = await unsubscribeAdminPropertyBookingPushAction(endpoint)

        if (!result.success) {
          setErrorMessage(result.error)
          return
        }

        await syncAppBadge(0)

        setIsEnabled(false)
        setMessage('Notifications disabled for this browser.')
      } catch (error: any) {
        setErrorMessage(error?.message || 'Failed to disable notifications.')
      }
    })
  }

  if (permissionState === 'unsupported') {
    return (
      <section className="mb-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <AlertIcon />
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-950">
              Notifications are not supported
            </h3>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              This browser does not support push notifications. Try Chrome,
              Edge, or another supported browser.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-6 overflow-hidden rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/[0.03] backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={[
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
              isEnabled
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-[#f3f6ff] text-[#054aff]',
            ].join(' ')}
          >
            {isEnabled ? <CheckIcon /> : <BellIcon />}
          </div>

          <div>
            <h3 className="text-base font-black tracking-tight text-slate-950">
              New Reservation Notifications
            </h3>

            <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Enable browser notifications to get alerted when a student submits
              a new property reservation request.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={[
                  'inline-flex rounded-full border px-3 py-1 text-xs font-black',
                  isEnabled
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600',
                ].join(' ')}
              >
                {isEnabled ? 'Enabled' : 'Not enabled'}
              </span>

              <span
                className={[
                  'inline-flex rounded-full border px-3 py-1 text-xs font-black capitalize',
                  permissionState === 'granted'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : permissionState === 'denied'
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700',
                ].join(' ')}
              >
                Browser permission: {permissionState}
              </span>

              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                App badge: {normalizedOpenRequestsCount}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
          {!isEnabled ? (
            <button
              type="button"
              onClick={handleEnableNotifications}
              disabled={isPending || permissionState === 'denied'}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#054aff] px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#003ed6] hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {isPending ? 'Enabling...' : 'Enable Notifications'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDisableNotifications}
              disabled={isPending}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Disabling...' : 'Disable'}
            </button>
          )}
        </div>
      </div>

      {permissionState === 'denied' ? (
        <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-700">
          Notifications are blocked in your browser. Enable them from site
          settings, then reload this page.
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-700">
          {message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-700">
          {errorMessage}
        </div>
      ) : null}
    </section>
  )
}