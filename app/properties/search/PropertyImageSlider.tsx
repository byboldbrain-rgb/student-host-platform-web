'use client'

import { useRef, useState } from 'react'

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
  const isPointerDownRef = useRef(false)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const dragOffsetRef = useRef(0)

  const [activeIndex, setActiveIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const maxIndex = Math.max(images.length - 1, 0)

  const goToSlide = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, maxIndex))

    setActiveIndex(safeIndex)
    setDragOffset(0)
    dragOffsetRef.current = 0
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (images.length <= 1) return

    isPointerDownRef.current = true
    isDraggingRef.current = false
    startXRef.current = event.clientX
    dragOffsetRef.current = 0

    setIsDragging(false)
    setDragOffset(0)

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || images.length <= 1) return

    const diff = event.clientX - startXRef.current

    if (Math.abs(diff) > 5) {
      isDraggingRef.current = true
      setIsDragging(true)
      event.preventDefault()
      event.stopPropagation()
    }

    if (!isDraggingRef.current) return

    const isAtFirstSlide = activeIndex === 0 && diff > 0
    const isAtLastSlide = activeIndex === maxIndex && diff < 0
    const resistance = isAtFirstSlide || isAtLastSlide ? 0.28 : 1
    const nextOffset = diff * resistance

    dragOffsetRef.current = nextOffset
    setDragOffset(nextOffset)
  }

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return

    isPointerDownRef.current = false

    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Ignore release errors.
    }

    if (!isDraggingRef.current) {
      setIsDragging(false)
      setDragOffset(0)
      dragOffsetRef.current = 0
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const sliderWidth = sliderRef.current?.clientWidth || 1
    const dragDistance = dragOffsetRef.current
    const threshold = Math.min(90, sliderWidth * 0.22)

    let nextIndex = activeIndex

    if (dragDistance <= -threshold) {
      nextIndex = activeIndex + 1
    }

    if (dragDistance >= threshold) {
      nextIndex = activeIndex - 1
    }

    goToSlide(nextIndex)

    window.setTimeout(() => {
      isDraggingRef.current = false
      setIsDragging(false)
    }, 120)
  }

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return

    event.preventDefault()
    event.stopPropagation()
  }

  if (images.length === 0) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 transition duration-700 group-hover/image:scale-[1.03]" />
    )
  }

  return (
    <>
      <div
        ref={sliderRef}
        dir="ltr"
        className={`property-media-slider ${
          isDragging ? 'property-media-slider--dragging' : ''
        }`}
        onClickCapture={handleClickCapture}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        style={{
          overflow: 'hidden',
          touchAction: 'pan-y',
          cursor: images.length > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
      >
        <div
          className="property-media-slider__track"
          style={{
            display: 'flex',
            width: `${images.length * 100}%`,
            height: '100%',
            transform: `translateX(calc(${-activeIndex * (100 / images.length)}% + ${dragOffset}px))`,
            transition: isDragging ? 'none' : 'transform 260ms ease',
            willChange: 'transform',
          }}
        >
          {images.map((imageUrl, index) => (
            <div
              key={`${propertyId}-${index}`}
              className="property-media-slider__slide"
              style={{
                flex: `0 0 ${100 / images.length}%`,
                width: `${100 / images.length}%`,
              }}
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