'use client'

import { useEffect, useRef, useState } from 'react'

type PropertyImageSliderProps = {
  images: string[]
  title: string
  propertyId: string | number
}

export default function PropertyImageSlider({
  images,
  title,
  propertyId,
}: PropertyImageSliderProps) {
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const slider = sliderRef.current
    if (!slider) return

    const handleScroll = () => {
      const nextIndex = Math.round(slider.scrollLeft / slider.clientWidth)
      setActiveIndex(nextIndex)
    }

    slider.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      slider.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const goToSlide = (index: number) => {
    const slider = sliderRef.current
    if (!slider) return

    slider.scrollTo({
      left: slider.clientWidth * index,
      behavior: 'smooth',
    })

    setActiveIndex(index)
  }

  if (images.length === 0) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 transition duration-700 group-hover/image:scale-[1.03]" />
    )
  }

  return (
    <>
      <div ref={sliderRef} className="property-media-slider">
        <div className="property-media-slider__track">
          {images.map((imageUrl, index) => (
            <div
              key={`${propertyId}-${index}`}
              className="property-media-slider__slide"
            >
              <img
                src={imageUrl}
                alt={`${title} ${index + 1}`}
                draggable={false}
                className="h-full w-full object-cover transition duration-700 group-hover/image:scale-[1.04]"
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <div className="property-media-slider__dots">
          {images.map((_, index) => (
            <button
              key={`${propertyId}-dot-${index}`}
              type="button"
              aria-label={`Go to image ${index + 1}`}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                goToSlide(index)
              }}
              className={`property-media-slider__dot ${
                activeIndex === index ? 'property-media-slider__dot--active' : ''
              }`}
            />
          ))}
        </div>
      )}
    </>
  )
}