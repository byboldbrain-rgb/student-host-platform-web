'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import mapboxgl from 'mapbox-gl'

export type PropertyMapItem = {
  id: string
  propertyId: string
  title: string
  href: string
  priceLabel: string
  latitude: number
  longitude: number
  imageUrl?: string | null
  imageUrls?: string[] | null
}

type PropertiesMapProps = {
  properties: PropertyMapItem[]
  className?: string
}

type MarkerEntry = {
  marker: mapboxgl.Marker
  element: HTMLButtonElement
  propertyKey: string
}

type DragAxis = 'horizontal' | 'vertical' | null

const DEFAULT_CENTER: [number, number] = [31.1837, 27.1809] // Assiut [longitude, latitude]
const SWIPE_THRESHOLD_RATIO = 0.18
const SWIPE_THRESHOLD_MAX_PX = 92

const AIRBNB_MARKER_FONT =
  "'Airbnb Cereal VF', 'Airbnb Cereal', 'Circular', 'Circular Std', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function toEnglishDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
}

function formatMapPriceLabel(priceLabel: string) {
  const normalized = toEnglishDigits(priceLabel)
    .replace(/[٬،]/g, ',')
    .replace(/\s+/g, ' ')
    .trim()

  const numericMatch = normalized.match(/[0-9][0-9,.\s]*/)

  if (!numericMatch) return normalized || priceLabel

  const rawNumber = numericMatch[0].replace(/\s+/g, '')
  const [rawIntegerPart, rawDecimalPart] = rawNumber.split('.')

  const integerDigits = rawIntegerPart.replace(/[^\d]/g, '')

  if (!integerDigits) return normalized || priceLabel

  const formattedInteger = integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const decimalDigits = rawDecimalPart?.replace(/[^\d]/g, '')

  const formattedNumber = decimalDigits
    ? `${formattedInteger}.${decimalDigits}`
    : formattedInteger

  return `${formattedNumber} ج.م`
}

function isMobileViewport() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 767px)').matches
}

function shouldShowNavigationControls() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(min-width: 768px)').matches
}

function emitMobilePreviewState(isOpen: boolean) {
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent('navienty:mobile-map-preview-change', {
      detail: { isOpen },
    })
  )
}

function emitMobileMarkerSelected(property: PropertyMapItem) {
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent('navienty:mobile-map-marker-selected', {
      detail: {
        propertyId: property.propertyId,
        id: property.id,
      },
    })
  )
}

function getPropertyKey(property: PropertyMapItem) {
  return property.id || property.propertyId
}

function getMapItemImages(property: PropertyMapItem) {
  const imagesFromList =
    property.imageUrls
      ?.map((imageUrl) => imageUrl?.trim())
      .filter((imageUrl): imageUrl is string => Boolean(imageUrl)) ?? []

  if (imagesFromList.length > 0) return imagesFromList

  const fallbackImage = property.imageUrl?.trim()
  return fallbackImage ? [fallbackImage] : []
}

function applyMarkerStyle(element: HTMLButtonElement, isActive: boolean) {
  element.dataset.active = isActive ? 'true' : 'false'

  element.style.background = isActive ? '#222222' : '#ffffff'
  element.style.color = isActive ? '#ffffff' : '#222222'
  element.style.border = isActive
    ? '1px solid rgba(34, 34, 34, 0.96)'
    : '1px solid rgba(0, 0, 0, 0.12)'
  element.style.boxShadow = isActive
    ? '0 6px 16px rgba(0, 0, 0, 0.34)'
    : '0 3px 10px rgba(0, 0, 0, 0.24)'

  // مهم: لا نستخدم translateY أو scale هنا حتى لا يتحرك السعر عند الضغط عليه.
  element.style.transform = 'translateZ(0)'
  element.style.zIndex = isActive ? '10' : '1'
}

export default function PropertiesMap({
  properties,
  className = '',
}: PropertiesMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<MarkerEntry[]>([])
  const activePopupRef = useRef<mapboxgl.Popup | null>(null)
  const navigationControlRef = useRef<mapboxgl.NavigationControl | null>(null)
  const mobileCarouselRef = useRef<HTMLDivElement | null>(null)
  const fittedCoordinatesSignatureRef = useRef<string | null>(null)

  const pointerDownRef = useRef(false)
  const activePointerIdRef = useRef<number | null>(null)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const dragAxisRef = useRef<DragAxis>(null)
  const dragOffsetRef = useRef(0)

  const [selectedProperty, setSelectedProperty] =
    useState<PropertyMapItem | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDraggingImage, setIsDraggingImage] = useState(false)

  const validProperties = useMemo(() => {
    return properties.filter((property) => {
      return (
        Number.isFinite(property.latitude) &&
        Number.isFinite(property.longitude)
      )
    })
  }, [properties])

  const validPropertiesSignature = useMemo(() => {
    return validProperties
      .map((property) =>
        [
          getPropertyKey(property),
          property.propertyId,
          property.latitude,
          property.longitude,
          property.priceLabel,
          property.title,
          property.href,
          property.imageUrl ?? '',
          property.imageUrls?.join(',') ?? '',
        ].join('::')
      )
      .join('||')
  }, [validProperties])

  const validPropertiesCoordinatesSignature = useMemo(() => {
    return validProperties
      .map((property) =>
        [
          getPropertyKey(property),
          property.latitude,
          property.longitude,
        ].join('::')
      )
      .join('||')
  }, [validProperties])

  const selectedImages = useMemo(() => {
    return selectedProperty ? getMapItemImages(selectedProperty) : []
  }, [selectedProperty])

  const selectedPriceLabel = useMemo(() => {
    return selectedProperty
      ? formatMapPriceLabel(selectedProperty.priceLabel)
      : ''
  }, [selectedProperty])

  const maxImageIndex = Math.max(selectedImages.length - 1, 0)

  const resetImageDrag = () => {
    pointerDownRef.current = false
    activePointerIdRef.current = null
    dragAxisRef.current = null
    dragOffsetRef.current = 0
    setDragOffset(0)
    setIsDraggingImage(false)
  }

  const closeSelectedProperty = () => {
    setSelectedProperty(null)
    setActiveImageIndex(0)
    resetImageDrag()
    emitMobilePreviewState(false)
  }

  const goToImage = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, maxImageIndex))
    setActiveImageIndex(safeIndex)
    dragOffsetRef.current = 0
    setDragOffset(0)
  }

  const goToPreviousImage = () => {
    if (selectedImages.length <= 1) return
    goToImage(activeImageIndex === 0 ? maxImageIndex : activeImageIndex - 1)
  }

  const goToNextImage = () => {
    if (selectedImages.length <= 1) return
    goToImage(activeImageIndex === maxImageIndex ? 0 : activeImageIndex + 1)
  }

  const handleCarouselPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (selectedImages.length <= 1) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    pointerDownRef.current = true
    activePointerIdRef.current = event.pointerId
    startXRef.current = event.clientX
    startYRef.current = event.clientY
    dragAxisRef.current = null
    dragOffsetRef.current = 0

    setIsDraggingImage(false)
    setDragOffset(0)

    event.stopPropagation()

    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Ignore pointer capture errors.
    }
  }

  const handleCarouselPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (!pointerDownRef.current || selectedImages.length <= 1) return

    if (
      activePointerIdRef.current !== null &&
      event.pointerId !== activePointerIdRef.current
    ) {
      return
    }

    const deltaX = event.clientX - startXRef.current
    const deltaY = event.clientY - startYRef.current
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (!dragAxisRef.current) {
      if (Math.max(absX, absY) < 6) return

      dragAxisRef.current = absX > absY * 1.08 ? 'horizontal' : 'vertical'
    }

    if (dragAxisRef.current === 'vertical') return

    event.preventDefault()
    event.stopPropagation()

    dragOffsetRef.current = deltaX
    setDragOffset(deltaX)
    setIsDraggingImage(true)
  }

  const handleCarouselPointerEnd = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (!pointerDownRef.current) return

    const wasHorizontalDrag = dragAxisRef.current === 'horizontal'
    const finalDragOffset = dragOffsetRef.current

    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Ignore release errors.
    }

    pointerDownRef.current = false
    activePointerIdRef.current = null
    dragAxisRef.current = null
    setIsDraggingImage(false)

    if (!wasHorizontalDrag || selectedImages.length <= 1) {
      dragOffsetRef.current = 0
      setDragOffset(0)
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const carouselWidth = mobileCarouselRef.current?.clientWidth || 1
    const threshold = Math.min(
      SWIPE_THRESHOLD_MAX_PX,
      carouselWidth * SWIPE_THRESHOLD_RATIO
    )

    if (finalDragOffset <= -threshold) {
      goToNextImage()
      return
    }

    if (finalDragOffset >= threshold) {
      goToPreviousImage()
      return
    }

    dragOffsetRef.current = 0
    setDragOffset(0)
  }

  const handleCarouselPointerCancel = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Ignore release errors.
    }

    resetImageDrag()
  }

  useEffect(() => {
    const activeKey = selectedProperty ? getPropertyKey(selectedProperty) : null

    markersRef.current.forEach(({ element, propertyKey }) => {
      applyMarkerStyle(element, activeKey === propertyKey)
    })
  }, [selectedProperty])

  useEffect(() => {
    setActiveImageIndex(0)
    resetImageDrag()
  }, [selectedProperty?.id])

  useEffect(() => {
    if (activeImageIndex > maxImageIndex) {
      setActiveImageIndex(maxImageIndex)
    }
  }, [activeImageIndex, maxImageIndex])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

    if (!token) {
      console.error('Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN')
      return
    }

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: DEFAULT_CENTER,
      zoom: 12,
      attributionControl: false,
    })

    mapRef.current = map

    const syncNavigationControls = () => {
      if (shouldShowNavigationControls()) {
        if (!navigationControlRef.current) {
          navigationControlRef.current = new mapboxgl.NavigationControl({
            visualizePitch: false,
          })

          map.addControl(navigationControlRef.current, 'bottom-right')
        }

        return
      }

      if (navigationControlRef.current) {
        map.removeControl(navigationControlRef.current)
        navigationControlRef.current = null
      }
    }

    const handleMapClick = () => {
      activePopupRef.current?.remove()
      activePopupRef.current = null
      closeSelectedProperty()
    }

    const resizeMap = () => {
      window.requestAnimationFrame(() => {
        map.resize()
      })
    }

    syncNavigationControls()

    map.addControl(
      new mapboxgl.AttributionControl({
        compact: true,
      })
    )

    map.on('click', handleMapClick)
    window.addEventListener('resize', syncNavigationControls)
    window.addEventListener('mobile-map-sheet-state-change', resizeMap)
    window.addEventListener('navienty:mobile-map-marker-selected', resizeMap)

    return () => {
      window.removeEventListener('resize', syncNavigationControls)
      window.removeEventListener('mobile-map-sheet-state-change', resizeMap)
      window.removeEventListener('navienty:mobile-map-marker-selected', resizeMap)
      map.off('click', handleMapClick)

      emitMobilePreviewState(false)

      activePopupRef.current?.remove()
      activePopupRef.current = null

      markersRef.current.forEach(({ marker }) => marker.remove())
      markersRef.current = []

      fittedCoordinatesSignatureRef.current = null

      map.remove()
      mapRef.current = null
      navigationControlRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    activePopupRef.current?.remove()
    activePopupRef.current = null
    setSelectedProperty(null)
    setActiveImageIndex(0)
    resetImageDrag()
    emitMobilePreviewState(false)

    markersRef.current.forEach(({ marker }) => marker.remove())
    markersRef.current = []

    if (validProperties.length === 0) {
      fittedCoordinatesSignatureRef.current = null
      return
    }

    const bounds = new mapboxgl.LngLatBounds()

    validProperties.forEach((property) => {
      const propertyKey = getPropertyKey(property)
      const markerPriceLabel = formatMapPriceLabel(property.priceLabel)

      const markerElement = document.createElement('button')
      markerElement.type = 'button'
      markerElement.textContent = markerPriceLabel
      markerElement.dir = 'ltr'
      markerElement.setAttribute('aria-label', property.title)
      markerElement.style.borderRadius = '999px'
      markerElement.style.fontFamily = AIRBNB_MARKER_FONT
      markerElement.style.fontSize = '14px'
      markerElement.style.fontWeight = '900'
      markerElement.style.lineHeight = '1'
      markerElement.style.padding = '10px 14px'
      markerElement.style.minWidth = '74px'
      markerElement.style.textAlign = 'center'
      markerElement.style.letterSpacing = '-0.02em'
      markerElement.style.cursor = 'pointer'
      markerElement.style.whiteSpace = 'nowrap'
      markerElement.style.transform = 'translateZ(0)'
      markerElement.style.transformOrigin = 'center center'
      markerElement.style.transition =
        'background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease'
      markerElement.style.WebkitTapHighlightColor = 'transparent'

      applyMarkerStyle(markerElement, false)

      const images = getMapItemImages(property)
      const imageHtml = images[0]
        ? `<img src="${escapeHtml(images[0])}" alt="" style="width:100%;height:118px;object-fit:cover;border-radius:16px;margin-bottom:12px;" />`
        : ''

      const popupHtml = `
        <a href="${escapeHtml(property.href)}" style="display:block;text-decoration:none;color:#111827;">
          ${imageHtml}
          <div style="font-weight:800;font-size:14px;line-height:1.4;margin-bottom:6px;">
            ${escapeHtml(property.title)}
          </div>
          <div dir="ltr" style="font-size:14px;color:#4b5563;font-weight:900;font-family:${AIRBNB_MARKER_FONT};">
            ${escapeHtml(markerPriceLabel)}
          </div>
          <div style="margin-top:10px;font-size:12px;font-weight:900;color:#0000FF;">
            عرض التفاصيل →
          </div>
        </a>
      `

      const popup = new mapboxgl.Popup({
        offset: 20,
        closeButton: false,
        maxWidth: '280px',
      }).setHTML(popupHtml)

      markerElement.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()

        activePopupRef.current?.remove()
        activePopupRef.current = null

        setSelectedProperty(property)
        setActiveImageIndex(0)
        resetImageDrag()

        if (isMobileViewport()) {
          emitMobileMarkerSelected(property)
          emitMobilePreviewState(true)

          // مهم: لا نستخدم flyTo هنا حتى لا تتحرك مربعات الأسعار من أماكنها.
          return
        }

        emitMobilePreviewState(false)

        // مهم: لا نستخدم flyTo هنا حتى لا تتحرك الخريطة عند الضغط على السعر.
        activePopupRef.current = popup
        popup.setLngLat([property.longitude, property.latitude]).addTo(map)
      })

      markerElement.addEventListener('mouseenter', () => {
        if (markerElement.dataset.active === 'true') {
          applyMarkerStyle(markerElement, true)
          return
        }

        markerElement.style.boxShadow = '0 5px 14px rgba(0, 0, 0, 0.28)'
        markerElement.style.zIndex = '4'
      })

      markerElement.addEventListener('mouseleave', () => {
        if (markerElement.dataset.active === 'true') {
          applyMarkerStyle(markerElement, true)
          return
        }

        applyMarkerStyle(markerElement, false)
      })

      const marker = new mapboxgl.Marker({
        element: markerElement,

        // السعر عبارة عن pill بدون دبوس، فالأصح إن مركزه يكون على الإحداثي نفسه.
        anchor: 'center',
      })
        .setLngLat([property.longitude, property.latitude])
        .addTo(map)

      markersRef.current.push({ marker, element: markerElement, propertyKey })
      bounds.extend([property.longitude, property.latitude])
    })

    // مهم: fitBounds يتحرك بالخريطة.
    // لذلك نخليه يحصل فقط أول مرة أو لما إحداثيات العقارات نفسها تتغير فعلاً.
    if (
      fittedCoordinatesSignatureRef.current !==
      validPropertiesCoordinatesSignature
    ) {
      map.fitBounds(bounds, {
        padding: isMobileViewport()
          ? {
              top: 90,
              right: 44,
              bottom: 260,
              left: 44,
            }
          : 80,
        maxZoom: 15,
        duration: 700,
      })

      fittedCoordinatesSignatureRef.current = validPropertiesCoordinatesSignature
    }
  }, [validPropertiesSignature, validPropertiesCoordinatesSignature])

  if (validProperties.length === 0) {
    return (
      <div
        className={`flex h-full min-h-[360px] items-center justify-center bg-[#f7f7f7] text-sm font-semibold text-[#6b7280] ${className}`}
      >
        لا توجد عقارات بإحداثيات على الخريطة
      </div>
    )
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full" />

      {selectedProperty && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[80] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] md:hidden"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <article className="pointer-events-auto relative mx-auto w-full max-w-[430px] overflow-hidden rounded-[26px] bg-white shadow-[0_22px_58px_rgba(15,23,42,0.28)] ring-1 ring-black/5">
            <button
              type="button"
              aria-label="Close property preview"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                closeSelectedProperty()
              }}
              className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#111827] shadow-[0_6px_18px_rgba(15,23,42,0.18)] backdrop-blur"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[17px] w-[17px]"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>

            <div
              ref={mobileCarouselRef}
              dir="ltr"
              className="relative aspect-[1.62/1] w-full overflow-hidden bg-slate-100"
              onPointerDown={handleCarouselPointerDown}
              onPointerMove={handleCarouselPointerMove}
              onPointerUp={handleCarouselPointerEnd}
              onPointerCancel={handleCarouselPointerCancel}
              onPointerLeave={handleCarouselPointerEnd}
              style={{
                touchAction: selectedImages.length > 1 ? 'pan-y' : 'auto',
                cursor:
                  selectedImages.length > 1
                    ? isDraggingImage
                      ? 'grabbing'
                      : 'grab'
                    : 'default',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
              }}
            >
              {selectedImages.length > 0 ? (
                <div
                  className="flex h-full"
                  style={{
                    width: `${selectedImages.length * 100}%`,
                    transform: `translateX(calc(${
                      -activeImageIndex * (100 / selectedImages.length)
                    }% + ${dragOffset}px))`,
                    transition: isDraggingImage ? 'none' : 'transform 260ms ease',
                    willChange: 'transform',
                  }}
                >
                  {selectedImages.map((imageUrl, index) => (
                    <div
                      key={`${selectedProperty.id}-map-image-${index}`}
                      className="h-full shrink-0 grow-0"
                      style={{
                        flexBasis: `${100 / selectedImages.length}%`,
                        width: `${100 / selectedImages.length}%`,
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        draggable={false}
                        style={{
                          pointerEvents: 'none',
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-300" />
              )}

              {selectedImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/28 px-2.5 py-1.5 backdrop-blur">
                  {selectedImages.map((_, index) => (
                    <button
                      key={`${selectedProperty.id}-map-dot-${index}`}
                      type="button"
                      aria-label={`Go to image ${index + 1}`}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        goToImage(index)
                      }}
                      className={`h-1.5 rounded-full bg-white transition-all ${
                        activeImageIndex === index
                          ? 'w-4 opacity-95'
                          : 'w-1.5 opacity-60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 pb-4 pt-3" dir="rtl">
              <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-2 flex-1 text-[16px] font-extrabold leading-snug tracking-[-0.02em] text-[#111827]">
                  {selectedProperty.title}
                </h3>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p
                  dir="ltr"
                  className="text-[15px] font-black text-[#111827]"
                  style={{ fontFamily: AIRBNB_MARKER_FONT }}
                >
                  {selectedPriceLabel}
                </p>

                <a
                  href={selectedProperty.href}
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-[#0000FF] px-4 text-[12px] font-extrabold !text-white no-underline"
                  style={{ color: '#ffffff' }}
                >
                  عرض التفاصيل
                </a>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  )
}