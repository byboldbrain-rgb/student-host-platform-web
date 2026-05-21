'use client'

import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

import lightAnimation from './splashAnimationLight.json'
import darkAnimation from './splashAnimationDark.json'

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [hide, setHide] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const detectTheme = () => {
      const theme =
        window.matchMedia('(prefers-color-scheme: dark)').matches

      setIsDark(theme)
    }

    detectTheme()

    const alreadyShown = sessionStorage.getItem(
      'properties-splash-shown'
    )

    if (!alreadyShown) {
      setVisible(true)
      sessionStorage.setItem(
        'properties-splash-shown',
        'true'
      )
    }

    setMounted(true)

    const media = window.matchMedia(
      '(prefers-color-scheme: dark)'
    )

    media.addEventListener('change', detectTheme)

    return () => {
      media.removeEventListener('change', detectTheme)
    }
  }, [])

  const handleComplete = () => {
    setHide(true)

    setTimeout(() => {
      setVisible(false)
    }, 350)
  }

  if (!mounted || !visible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${
        hide
          ? 'opacity-0 pointer-events-none'
          : 'opacity-100'
      } ${
        isDark
          ? 'bg-[#020817]'
          : 'bg-white'
      }`}
    >
      <div className="w-[240px] sm:w-[300px] md:w-[360px] overflow-hidden rounded-2xl">
        <Lottie
          animationData={
            isDark
              ? darkAnimation
              : lightAnimation
          }
          loop={false}
          autoplay
          onComplete={handleComplete}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}