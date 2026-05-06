'use client'

import { useEffect, useMemo, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const APP_LOGO_URL = 'https://i.ibb.co/sn0xS95/Navienty-2.jpg'

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false

  const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone =
    'standalone' in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true

  return standaloneMedia || iosStandalone
}

function isIosDevice() {
  if (typeof window === 'undefined') return false

  const userAgent = window.navigator.userAgent.toLowerCase()
  const platform = window.navigator.platform?.toLowerCase() || ''

  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform === 'macintel' && window.navigator.maxTouchPoints > 1)
  )
}

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)

  const [isVisible, setIsVisible] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)

  const isIos = useMemo(() => isIosDevice(), [])

  useEffect(() => {
    if (isStandaloneDisplay()) {
      setIsVisible(false)
      return
    }

    const dismissed = localStorage.getItem('pwa-install-banner-dismissed')
    if (dismissed === 'true') return

    if (isIos) {
      setIsVisible(true)
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setIsVisible(true)
    }

    const handleAppInstalled = () => {
      setIsVisible(false)
      localStorage.setItem('pwa-install-banner-dismissed', 'true')
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isIos])

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosHelp((current) => !current)
      return
    }

    if (!deferredPrompt) return

    await deferredPrompt.prompt()

    const choice = await deferredPrompt.userChoice

    if (choice.outcome === 'accepted') {
      setIsVisible(false)
      localStorage.setItem('pwa-install-banner-dismissed', 'true')
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('pwa-install-banner-dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <div className="pwa-install-banner md:hidden">
      <button
        type="button"
        className="pwa-install-banner__close"
        aria-label="Close app install banner"
        onClick={handleDismiss}
      >
        ×
      </button>

      <img
        src={APP_LOGO_URL}
        alt="Navienty"
        className="pwa-install-banner__logo"
        draggable={false}
      />

      <div className="pwa-install-banner__content">
        <p className="pwa-install-banner__title">Continue in the app!</p>
      </div>

      <button
        type="button"
        className="pwa-install-banner__button"
        onClick={handleInstallClick}
      >
        Get App
      </button>

      {showIosHelp && (
        <div className="pwa-install-banner__ios-help">
          On iPhone: tap Share, then choose Add to Home Screen.
        </div>
      )}
    </div>
  )
}