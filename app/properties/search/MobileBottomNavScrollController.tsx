'use client'

import { useEffect } from 'react'

const HIDE_THRESHOLD_PX = 8
const SHOW_THRESHOLD_PX = 8
const TOP_REVEAL_PX = 16

function getScrollTop(target: EventTarget | Window | null) {
  if (target === window) {
    return window.scrollY || document.documentElement.scrollTop || 0
  }

  if (target instanceof HTMLElement) {
    return target.scrollTop
  }

  return 0
}

export default function MobileBottomNavScrollController() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.mobile-bottom-nav')
    if (!nav) return

    let lastScrollTop = 0
    let ticking = false
    let forcedHiddenByMap = document.body.classList.contains(
      'mobile-map-sheet--map-expanded'
    )

    const hideNav = () => {
      nav.classList.add('mobile-bottom-nav--hidden')
    }

    const showNav = () => {
      if (forcedHiddenByMap) {
        hideNav()
        return
      }

      nav.classList.remove('mobile-bottom-nav--hidden')
    }

    const handleMapSheetStateChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        shouldHideMobileBottomNav?: boolean
        isMapExpanded?: boolean
      }>

      forcedHiddenByMap = Boolean(
        customEvent.detail?.shouldHideMobileBottomNav ||
          customEvent.detail?.isMapExpanded
      )

      if (forcedHiddenByMap) {
        hideNav()
        return
      }

      showNav()
    }

    const handleScroll = (event: Event) => {
      if (forcedHiddenByMap) {
        hideNav()
        return
      }

      if (ticking) return
      ticking = true

      window.requestAnimationFrame(() => {
        const target = event.currentTarget || event.target
        const currentScrollTop = getScrollTop(target)
        const delta = currentScrollTop - lastScrollTop

        if (currentScrollTop <= TOP_REVEAL_PX) {
          showNav()
        } else if (delta > HIDE_THRESHOLD_PX) {
          hideNav()
        } else if (delta < -SHOW_THRESHOLD_PX) {
          showNav()
        }

        lastScrollTop = Math.max(0, currentScrollTop)
        ticking = false
      })
    }

    const scrollContainers = Array.from(
      document.querySelectorAll<HTMLElement>('.mobile-search-map-sheet__content')
    )

    window.addEventListener('mobile-map-sheet-state-change', handleMapSheetStateChange)
    window.addEventListener('scroll', handleScroll, { passive: true })

    scrollContainers.forEach((container) => {
      container.addEventListener('scroll', handleScroll, { passive: true })
    })

    if (forcedHiddenByMap) {
      hideNav()
    }

    return () => {
      window.removeEventListener('mobile-map-sheet-state-change', handleMapSheetStateChange)
      window.removeEventListener('scroll', handleScroll)

      scrollContainers.forEach((container) => {
        container.removeEventListener('scroll', handleScroll)
      })

      nav.classList.remove('mobile-bottom-nav--hidden')
    }
  }, [])

  return null
}
