'use client'

import { useEffect } from 'react'

export default function PushNotificationInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported in this browser.')
      return
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Navienty service worker registered:', registration.scope)

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      })
      .catch((error) => {
        console.error('Navienty service worker registration failed:', error)
      })
  }, [])

  return null
}