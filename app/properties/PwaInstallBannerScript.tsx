'use client'

import { useEffect } from 'react'

export default function PwaInstallBannerScript() {
  useEffect(() => {
    const banner = document.getElementById('pwa-install-banner')
    const closeButton = document.getElementById('pwa-install-banner-close')
    const installButton = document.getElementById('pwa-install-banner-button')
    const iosHelp = document.getElementById('pwa-install-banner-ios-help')

    let deferredPrompt: any = null

    if (!banner) return

    function isStandalone() {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      )
    }

    function isIos() {
      const ua = window.navigator.userAgent.toLowerCase()
      const platform = (window.navigator.platform || '').toLowerCase()

      return (
        /iphone|ipad|ipod/.test(ua) ||
        (platform === 'macintel' && window.navigator.maxTouchPoints > 1)
      )
    }

    function hideBanner() {
      if (banner) banner.style.display = 'none'
    }

    function showBanner() {
      if (banner) banner.style.display = 'grid'
    }

    if (isStandalone()) {
      hideBanner()
      return
    }

    if (localStorage.getItem('pwa-install-banner-dismissed') === 'true') {
      hideBanner()
      return
    }

    if (isIos()) {
      showBanner()
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      deferredPrompt = event
      showBanner()
    }

    const handleAppInstalled = () => {
      localStorage.setItem('pwa-install-banner-dismissed', 'true')
      hideBanner()
      deferredPrompt = null
    }

    const handleClose = () => {
      localStorage.setItem('pwa-install-banner-dismissed', 'true')
      hideBanner()
    }

    const handleInstall = () => {
      if (isIos()) {
        iosHelp?.classList.toggle('pwa-install-banner__ios-help--visible')
        return
      }

      if (!deferredPrompt) return

      deferredPrompt.prompt()
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult?.outcome === 'accepted') {
          localStorage.setItem('pwa-install-banner-dismissed', 'true')
          hideBanner()
        }

        deferredPrompt = null
      })
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    closeButton?.addEventListener('click', handleClose)
    installButton?.addEventListener('click', handleInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      closeButton?.removeEventListener('click', handleClose)
      installButton?.removeEventListener('click', handleInstall)
    }
  }, [])

  return null
}