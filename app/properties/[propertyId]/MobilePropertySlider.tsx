'use client'

import { useRef, useState } from 'react'

type Props = {
  images: string[]
  title: string
  isArabic?: boolean
}

export default function MobilePropertySlider({
  images,
  title,
  isArabic = false,
}: Props) {
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const scrollFrameRef = useRef<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const updateActiveIndex = () => {
    const slider = sliderRef.current
    if (!slider) return

    const sliderRect = slider.getBoundingClientRect()
    const sliderCenter = sliderRect.left + sliderRect.width / 2

    const slides = Array.from(
      slider.querySelectorAll<HTMLDivElement>('[data-slider-slide]')
    )

    if (!slides.length) return

    let closestIndex = 0
    let closestDistance = Number.POSITIVE_INFINITY

    slides.forEach((slide, index) => {
      const slideRect = slide.getBoundingClientRect()
      const slideCenter = slideRect.left + slideRect.width / 2
      const distance = Math.abs(slideCenter - sliderCenter)

      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    setActiveIndex((currentIndex) => {
      if (currentIndex === closestIndex) return currentIndex
      return closestIndex
    })
  }

  const handleScroll = () => {
    if (scrollFrameRef.current !== null) {
      cancelAnimationFrame(scrollFrameRef.current)
    }

    scrollFrameRef.current = requestAnimationFrame(() => {
      updateActiveIndex()
      scrollFrameRef.current = null
    })
  }

  if (!images.length) {
    return (
      <div className="relative flex h-[420px] items-center justify-center overflow-hidden bg-slate-100">
        <span className="text-sm font-semibold text-slate-500">
          {isArabic ? 'لا توجد صور' : 'No images'}
        </span>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-slate-100">
      <div
        ref={sliderRef}
        onScroll={handleScroll}
        dir="ltr"
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth hide-scrollbar"
      >
        {images.map((imageUrl, index) => (
          <div
            key={`${imageUrl}-${index}`}
            data-slider-slide
            className="w-full shrink-0 snap-center"
          >
            <img
              src={imageUrl}
              alt={`${title} ${index + 1}`}
              className="h-[420px] w-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      <div
        className={`absolute bottom-10 z-20 rounded-full bg-black/70 px-3 py-1.5 text-[12px] font-semibold text-white shadow-md ${
          isArabic ? 'left-4' : 'right-4'
        }`}
      >
        {activeIndex + 1}/{images.length}
      </div>
    </div>
  )
}