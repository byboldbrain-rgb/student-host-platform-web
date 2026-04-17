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
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = () => {
    const slider = sliderRef.current
    if (!slider) return

    const slideWidth = slider.clientWidth
    if (!slideWidth) return

    const nextIndex = Math.round(slider.scrollLeft / slideWidth)
    const safeIndex = Math.max(0, Math.min(nextIndex, images.length - 1))

    if (safeIndex !== activeIndex) {
      setActiveIndex(safeIndex)
    }
  }

  return (
    <div className="relative overflow-hidden bg-slate-100">
      <div
        ref={sliderRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth hide-scrollbar"
      >
        {images.map((imageUrl, index) => (
          <div
            key={`${imageUrl}-${index}`}
            className="w-full shrink-0 snap-center"
          >
            <img
              src={imageUrl}
              alt={`${title} ${index + 1}`}
              className="h-[420px] w-full object-cover"
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