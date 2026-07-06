'use client'

import { useRef, useState } from 'react'

type PropertyImageSliderProps = {
  images: string[]
  title: string
  propertyId: string | number
}

type DragAxis = 'horizontal' | 'vertical' | null

export default function PropertyImageSlider({
  images,
  title,
  propertyId,
}: PropertyImageSliderProps) {
  const sliderRef = useRef<HTMLDivElement | null>(null)

  const isPointerDownRef = useRef(false)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const dragOffsetRef = useRef(0)
  const dragAxisRef = useRef<DragAxis>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const suppressClickRef = useRef(false)

  const [activeIndex, setActiveIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const maxIndex = Math.max(images.length - 1, 0)

  const getPreviousIndex = () => {
    if (images.length <= 1) return 0
    return activeIndex === 0 ? maxIndex : activeIndex - 1
  }

  const getNextIndex = () => {
    if (images.length <= 1) return 0
    return activeIndex === maxIndex ? 0 : activeIndex + 1
  }

  const goToSlide = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, maxIndex))

    setActiveIndex(safeIndex)
    setDragOffset(0)
    dragOffsetRef.current = 0
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (images.length <= 1) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    isPointerDownRef.current = true
    isDraggingRef.current = false
    dragAxisRef.current = null
    activePointerIdRef.current = event.pointerId
    suppressClickRef.current = false

    startXRef.current = event.clientX
    startYRef.current = event.clientY
    dragOffsetRef.current = 0

    setIsDragging(false)
    setDragOffset(0)

    event.stopPropagation()

    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Ignore pointer capture errors.
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || images.length <= 1) return

    if (
      activePointerIdRef.current !== null &&
      event.pointerId !== activePointerIdRef.current
    ) {
      return
    }

    const diffX = event.clientX - startXRef.current
    const diffY = event.clientY - startYRef.current
    const absX = Math.abs(diffX)
    const absY = Math.abs(diffY)

    if (!dragAxisRef.current) {
      if (Math.max(absX, absY) < 6) return
      dragAxisRef.current = absX > absY ? 'horizontal' : 'vertical'
    }

    if (dragAxisRef.current === 'vertical') {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    isDraggingRef.current = true
    suppressClickRef.current = true
    setIsDragging(true)

    dragOffsetRef.current = diffX
    setDragOffset(diffX)
  }

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return

    const wasHorizontalDrag = dragAxisRef.current === 'horizontal'
    const wasDragging = isDraggingRef.current

    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Ignore release errors.
    }

    isPointerDownRef.current = false
    activePointerIdRef.current = null

    if (!wasHorizontalDrag || !wasDragging) {
      isDraggingRef.current = false
      dragAxisRef.current = null
      dragOffsetRef.current = 0
      setIsDragging(false)
      setDragOffset(0)
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const sliderWidth = sliderRef.current?.clientWidth || 1
    const dragDistance = dragOffsetRef.current
    const threshold = Math.min(90, sliderWidth * 0.22)

    if (dragDistance <= -threshold) {
      goToSlide(getNextIndex())
    } else if (dragDistance >= threshold) {
      goToSlide(getPreviousIndex())
    } else {
      goToSlide(activeIndex)
    }

    window.setTimeout(() => {
      isDraggingRef.current = false
      dragAxisRef.current = null
      setIsDragging(false)
    }, 140)
  }

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current && !isDraggingRef.current) return

    event.preventDefault()
    event.stopPropagation()

    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 140)
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
        data-property-image-slider="true"
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
          cursor:
            images.length > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          overscrollBehaviorX: 'contain',
        }}
      >
        <div
          className="property-media-slider__track"
          style={{
            display: 'flex',
            width: `${images.length * 100}%`,
            height: '100%',
            transform: `translateX(calc(${
              -activeIndex * (100 / images.length)
            }% + ${dragOffset}px))`,
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
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  pointerEvents: 'none',
                }}
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
