'use client'

import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import animationData from './splashAnimation.json'

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [hide, setHide] = useState(false)

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem('properties-splash-shown')

    if (alreadyShown) return

    setVisible(true)
    sessionStorage.setItem('properties-splash-shown', 'true')
  }, [])

  const handleComplete = () => {
    setHide(true)

    setTimeout(() => {
      setVisible(false)
    }, 350)
  }

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-300 ${
        hide ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-[240px] sm:w-[300px] md:w-[360px]">
        <Lottie
          animationData={animationData}
          loop={false}
          autoplay
          onComplete={handleComplete}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}