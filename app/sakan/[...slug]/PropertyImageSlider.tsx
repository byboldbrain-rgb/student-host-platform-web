'use client'

import {
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react'

type PropertyImageSliderProps = {
  images: string[]
  title: string
  propertyId: string | number
}

type DragAxis = 'horizontal' | 'vertical' | null

const MIN_DRAG_PX = 6
const HORIZONTAL_LOCK_RATIO = 1.05
const SWIPE_THRESHOLD_RATIO = 0.2
const SWIPE_THRESHOLD_MAX_PX = 86
const CLICK_SUPPRESS_MS = 180

export default function PropertyImageSlider({
  images,
  title,
  propertyId,
}: PropertyImageSliderProps) {
  const sliderRef = useRef<HTMLDivElement | null>(null)

  const isGestureActiveRef = useRef(false)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const dragOffsetRef = useRef(0)
  const dragAxisRef = useRef<DragAxis>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const activeTouchIdRef = useRef<number | null>(null)
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

  const resetGesture = () => {
    isGestureActiveRef.current = false
    isDraggingRef.current = false
    activePointerIdRef.current = null
    activeTouchIdRef.current = null
    dragAxisRef.current = null
    dragOffsetRef.current = 0

    setIsDragging(false)
    setDragOffset(0)
  }

  const startGesture = (clientX: number, clientY: number) => {
    if (images.length <= 1) return

    isGestureActiveRef.current = true
    isDraggingRef.current = false
    dragAxisRef.current = null
    suppressClickRef.current = false

    startXRef.current = clientX
    startYRef.current = clientY
    dragOffsetRef.current = 0

    setIsDragging(false)
    setDragOffset(0)
  }

  const updateGesture = (clientX: number, clientY: number) => {
    if (!isGestureActiveRef.current || images.length <= 1) {
      return false
    }

    const diffX = clientX - startXRef.current
    const diffY = clientY - startYRef.current
    const absX = Math.abs(diffX)
    const absY = Math.abs(diffY)

    if (!dragAxisRef.current) {
      if (Math.max(absX, absY) < MIN_DRAG_PX) {
        return false
      }

      dragAxisRef.current =
        absX > absY * HORIZONTAL_LOCK_RATIO ? 'horizontal' : 'vertical'
    }

    // لو المستخدم بيعمل Scroll لفوق/تحت، سيبه يكمل Scroll عادي
    if (dragAxisRef.current === 'vertical') {
      if (Math.max(absX, absY) > 10) {
        suppressClickRef.current = true
      }

      return false
    }

    isDraggingRef.current = true
    suppressClickRef.current = true
    dragOffsetRef.current = diffX

    setIsDragging(true)
    setDragOffset(diffX)

    return true
  }

  const finishGesture = () => {
    if (!isGestureActiveRef.current) return

    const wasHorizontalDrag =
      dragAxisRef.current === 'horizontal' && isDraggingRef.current

    const finalDragOffset = dragOffsetRef.current

    isGestureActiveRef.current = false
    isDraggingRef.current = false
    activePointerIdRef.current = null
    activeTouchIdRef.current = null
    dragAxisRef.current = null

    setIsDragging(false)

    if (!wasHorizontalDrag) {
      dragOffsetRef.current = 0
      setDragOffset(0)

      window.setTimeout(() => {
        suppressClickRef.current = false
      }, CLICK_SUPPRESS_MS)

      return
    }

    const sliderWidth = sliderRef.current?.clientWidth || 1
    const threshold = Math.min(
      SWIPE_THRESHOLD_MAX_PX,
      sliderWidth * SWIPE_THRESHOLD_RATIO
    )

    if (finalDragOffset <= -threshold) {
      goToSlide(getNextIndex())
    } else if (finalDragOffset >= threshold) {
      goToSlide(getPreviousIndex())
    } else {
      goToSlide(activeIndex)
    }

    window.setTimeout(() => {
      suppressClickRef.current = false
    }, CLICK_SUPPRESS_MS)
  }

  const getActiveTouch = (
  touches:
    | ReactTouchEvent<HTMLDivElement>['touches']
    | ReactTouchEvent<HTMLDivElement>['changedTouches']
) => {
  const activeTouchId = activeTouchIdRef.current

  if (activeTouchId === null) {
    return touches[0] ?? null
  }

  for (let index = 0; index < touches.length; index += 1) {
    const touch = touches[index]

    if (touch?.identifier === activeTouchId) {
      return touch
    }
  }

  return null
}

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    // على الموبايل هنستخدم Touch Events لأنها أثبت داخل Link في iOS/Android
    if (event.pointerType === 'touch') return

    if (images.length <= 1) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    activePointerIdRef.current = event.pointerId
    startGesture(event.clientX, event.clientY)

    event.stopPropagation()

    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Ignore pointer capture errors.
    }
  }

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (
      activePointerIdRef.current !== null &&
      event.pointerId !== activePointerIdRef.current
    ) {
      return
    }

    const isHorizontalDrag = updateGesture(event.clientX, event.clientY)

    if (!isHorizontalDrag) return

    event.preventDefault()
    event.stopPropagation()
  }

  const handlePointerEnd = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (
      activePointerIdRef.current !== null &&
      event.pointerId !== activePointerIdRef.current
    ) {
      return
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Ignore release errors.
    }

    if (dragAxisRef.current === 'horizontal') {
      event.preventDefault()
      event.stopPropagation()
    }

    finishGesture()
  }

  const handleTouchStart = (
    event: ReactTouchEvent<HTMLDivElement>
  ) => {
    if (images.length <= 1) return

    const touch = event.changedTouches[0] ?? event.touches[0]
    if (!touch) return

    activeTouchIdRef.current = touch.identifier
    startGesture(touch.clientX, touch.clientY)

    event.stopPropagation()
  }

  const handleTouchMove = (
    event: ReactTouchEvent<HTMLDivElement>
  ) => {
    const touch = getActiveTouch(event.touches)
    if (!touch) return

    const isHorizontalDrag = updateGesture(touch.clientX, touch.clientY)

    if (!isHorizontalDrag) return

    if (event.nativeEvent.cancelable) {
      event.preventDefault()
    }

    event.stopPropagation()
  }

  const handleTouchEnd = (
    event: ReactTouchEvent<HTMLDivElement>
  ) => {
    const touch = getActiveTouch(event.changedTouches)

    if (touch && dragAxisRef.current === 'horizontal') {
      if (event.nativeEvent.cancelable) {
        event.preventDefault()
      }

      event.stopPropagation()
    }

    finishGesture()
  }

  const handleTouchCancel = () => {
    resetGesture()

    window.setTimeout(() => {
      suppressClickRef.current = false
    }, CLICK_SUPPRESS_MS)
  }

  const handleClickCapture = (
    event: ReactMouseEvent<HTMLDivElement>
  ) => {
    if (!suppressClickRef.current && !isDraggingRef.current) return

    event.preventDefault()
    event.stopPropagation()

    window.setTimeout(() => {
      suppressClickRef.current = false
    }, CLICK_SUPPRESS_MS)
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        style={{
          overflow: 'hidden',
          touchAction: images.length > 1 ? 'pan-y' : 'auto',
          cursor:
            images.length > 1
              ? isDragging
                ? 'grabbing'
                : 'grab'
              : 'default',
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
            transform: `translate3d(calc(${
              -activeIndex * (100 / images.length)
            }% + ${dragOffset}px), 0, 0)`,
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
                activeIndex === index
                  ? 'property-media-slider__dot--active'
                  : ''
              }`}
            />
          ))}
        </div>
      )}
    </>
  )
}