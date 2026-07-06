'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import PropertiesMap, { type PropertyMapItem } from './PropertiesMap'

type MobileSearchMapSheetProps = {
  properties: PropertyMapItem[]
  feeLabel: string
  homesLabel: string
  children: ReactNode
}

type DragMode = 'sheet' | 'ignore' | null

type DragState = {
  startX: number
  startY: number
  startSheetY: number
  startScrollTop: number
  startedFromImageSlider: boolean
  startedFromCompactReturn: boolean
  mode: DragMode
  lastDeltaY: number
  hasCapturedPointer: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getNearestSnapPoint(value: number, snapPoints: number[]) {
  return snapPoints.reduce((nearest, point) => {
    return Math.abs(point - value) < Math.abs(nearest - value) ? point : nearest
  }, snapPoints[0])
}

export default function MobileSearchMapSheet({
  properties,
  children,
}: MobileSearchMapSheetProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  const [viewportHeight, setViewportHeight] = useState(760)
  const [sheetY, setSheetY] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hasMapPreview, setHasMapPreview] = useState(false)

  const latestSheetYRef = useRef(0)
  const suppressNextClickRef = useRef(false)
  const didDragRef = useRef(false)
  const dragStateRef = useRef<DragState | null>(null)
  const activeTouchIdRef = useRef<number | null>(null)

  const snapPoints = useMemo(() => {
    const compactSheetHeight = 78
    const listExpanded = 0
    const middle = Math.round(viewportHeight * 0.47)
    const mapExpanded = Math.max(middle + 96, viewportHeight - compactSheetHeight)

    return {
      listExpanded,
      middle,
      mapExpanded,
      compactSheetHeight,
      all: [listExpanded, middle, mapExpanded],
    }
  }, [viewportHeight])

  const currentSheetY = sheetY ?? snapPoints.middle
  latestSheetYRef.current = currentSheetY

  const isMapExpanded = currentSheetY >= snapPoints.mapExpanded - 12
  const isResultsExpanded = currentSheetY <= snapPoints.listExpanded + 8
  const shouldHideMobileBottomNav =
    isMapExpanded || currentSheetY > snapPoints.middle + 28

  useEffect(() => {
    document.body.classList.toggle(
      'mobile-map-sheet--map-expanded',
      shouldHideMobileBottomNav
    )

    window.dispatchEvent(
      new CustomEvent('mobile-map-sheet-state-change', {
        detail: {
          shouldHideMobileBottomNav,
          isMapExpanded,
          sheetY: currentSheetY,
        },
      })
    )

    return () => {
      document.body.classList.remove('mobile-map-sheet--map-expanded')
    }
  }, [shouldHideMobileBottomNav, isMapExpanded, currentSheetY])

  useEffect(() => {
    const updateViewportHeight = () => {
      const rootRect = rootRef.current?.getBoundingClientRect()
      const nextHeight = Math.max(
        420,
        Math.round(rootRect?.height || window.innerHeight || 760)
      )

      setViewportHeight(nextHeight)
      setSheetY((current) => {
        const maxY = Math.max(0, nextHeight - snapPoints.compactSheetHeight)

        if (current === null) return Math.round(nextHeight * 0.47)

        return clamp(current, 0, maxY)
      })
    }

    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', updateViewportHeight)

    return () => {
      window.removeEventListener('resize', updateViewportHeight)
      window.removeEventListener('orientationchange', updateViewportHeight)
    }
  }, [snapPoints.compactSheetHeight])

  const getContentScrollTop = () => {
    return Math.max(0, contentRef.current?.scrollTop ?? 0)
  }

  const setSheetPosition = (nextY: number) => {
    const safeY = clamp(nextY, snapPoints.listExpanded, snapPoints.mapExpanded)
    latestSheetYRef.current = safeY
    setSheetY(safeY)
  }

  const showMiddleState = () => {
    setSheetPosition(snapPoints.middle)
  }

  const expandResults = () => {
    setSheetPosition(snapPoints.listExpanded)
  }

  const openFullMap = () => {
    setSheetPosition(snapPoints.mapExpanded)
  }

  useEffect(() => {
    const handleMarkerSelected = () => {
      setSheetPosition(snapPoints.mapExpanded)
    }

    const handlePreviewChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ isOpen?: boolean }>
      setHasMapPreview(Boolean(customEvent.detail?.isOpen))
    }

    window.addEventListener(
      'navienty:mobile-map-marker-selected',
      handleMarkerSelected
    )
    window.addEventListener(
      'navienty:mobile-map-preview-change',
      handlePreviewChange
    )

    return () => {
      window.removeEventListener(
        'navienty:mobile-map-marker-selected',
        handleMarkerSelected
      )
      window.removeEventListener(
        'navienty:mobile-map-preview-change',
        handlePreviewChange
      )
    }
  }, [snapPoints.mapExpanded])

  const isImageSliderTarget = (target: HTMLElement | null) => {
    return Boolean(
      target?.closest(
        '[data-property-image-slider="true"], .property-media-slider, .property-media-slider__track, .property-media-slider__slide, .property-media-card'
      )
    )
  }

  const canStartFromTarget = (target: HTMLElement | null) => {
    if (!target) return false

    return Boolean(
      panelRef.current?.contains(target) ||
        target.closest('.mobile-search-map-sheet__compact-return')
    )
  }

  const beginPotentialDrag = ({
    clientX,
    clientY,
    target,
    startedFromCompactReturn = false,
  }: {
    clientX: number
    clientY: number
    target: HTMLElement | null
    startedFromCompactReturn?: boolean
  }) => {
    if (!canStartFromTarget(target)) return false

    suppressNextClickRef.current = false
    didDragRef.current = false

    dragStateRef.current = {
      startX: clientX,
      startY: clientY,
      startSheetY: latestSheetYRef.current,
      startScrollTop: getContentScrollTop(),
      startedFromImageSlider: isImageSliderTarget(target),
      startedFromCompactReturn:
        startedFromCompactReturn ||
        Boolean(target?.closest('.mobile-search-map-sheet__compact-return')),
      mode: null,
      lastDeltaY: 0,
      hasCapturedPointer: false,
    }

    return true
  }

  const decideDragMode = (dragState: DragState, deltaX: number, deltaY: number) => {
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (Math.max(absX, absY) < 7) return null

    // Horizontal gestures belong to the image slider. The sheet should never steal them.
    if (absX > absY * 1.12) {
      return 'ignore'
    }

    if (absY <= absX * 1.05) return null

    const draggingDown = deltaY > 0
    const draggingUp = deltaY < 0
    const startedAtListExpanded = dragState.startSheetY <= snapPoints.listExpanded + 10

    // Full map: only the compact return sheet should control the map state.
    if (dragState.startSheetY >= snapPoints.mapExpanded - 12) {
      return dragState.startedFromCompactReturn ? 'sheet' : 'ignore'
    }

    // When the list is fully expanded:
    // - Swiping up must scroll the list normally.
    // - Swiping down scrolls the list back to the top first.
    // - Only when the list is already at the top, swiping down moves the sheet to the middle state.
    if (startedAtListExpanded) {
      if (draggingUp) return 'ignore'

      if (draggingDown) {
        return dragState.startScrollTop <= 1 ? 'sheet' : 'ignore'
      }
    }

    // Middle state: any vertical movement from the white sheet controls the sheet.
    return 'sheet'
  }

  const getVisualSheetY = (dragState: DragState, deltaY: number) => {
    const startedAtListExpanded = dragState.startSheetY <= snapPoints.listExpanded + 10

    // From full list, one pull down should only return to the 50/50 state.
    // A second pull down from 50/50 opens the full map.
    if (startedAtListExpanded && deltaY > 0) {
      return clamp(
        dragState.startSheetY + deltaY,
        snapPoints.listExpanded,
        snapPoints.middle + 72
      )
    }

    return dragState.startSheetY + deltaY
  }

  const updateDrag = ({
    clientX,
    clientY,
    preventDefault,
    stopPropagation,
    capturePointer,
  }: {
    clientX: number
    clientY: number
    preventDefault: () => void
    stopPropagation: () => void
    capturePointer?: () => void
  }) => {
    const dragState = dragStateRef.current
    if (!dragState) return

    const deltaX = clientX - dragState.startX
    const deltaY = clientY - dragState.startY

    if (!dragState.mode) {
      const nextMode = decideDragMode(dragState, deltaX, deltaY)

      if (!nextMode) return

      if (nextMode === 'ignore') {
        dragStateRef.current = null
        setIsDragging(false)
        return
      }

      dragState.mode = 'sheet'
      capturePointer?.()
      dragState.hasCapturedPointer = true
      setIsDragging(true)
    }

    if (dragState.mode !== 'sheet') return

    preventDefault()
    stopPropagation()

    if (Math.abs(deltaY) > 6) {
      didDragRef.current = true
      suppressNextClickRef.current = true
    }

    dragState.lastDeltaY = deltaY
    setSheetPosition(getVisualSheetY(dragState, deltaY))
  }

  const getSnapAfterDrag = (dragState: DragState) => {
    const latestSheetY = latestSheetYRef.current
    const deltaY = latestSheetY - dragState.startSheetY
    const startedAtListExpanded = dragState.startSheetY <= snapPoints.listExpanded + 10
    const startedAtMiddle =
      dragState.startSheetY > snapPoints.listExpanded + 10 &&
      dragState.startSheetY < snapPoints.mapExpanded - 12
    const startedAtMapExpanded = dragState.startSheetY >= snapPoints.mapExpanded - 12

    if (startedAtListExpanded) {
      if (deltaY > 34) return snapPoints.middle
      return snapPoints.listExpanded
    }

    if (startedAtMiddle) {
      if (deltaY < -34) return snapPoints.listExpanded
      if (deltaY > 34) return snapPoints.mapExpanded
      return snapPoints.middle
    }

    if (startedAtMapExpanded) {
      if (deltaY < -viewportHeight * 0.26) return snapPoints.listExpanded
      if (deltaY < -34) return snapPoints.middle
      return snapPoints.mapExpanded
    }

    return getNearestSnapPoint(latestSheetY, snapPoints.all)
  }

  const endDrag = ({ releasePointer }: { releasePointer?: () => void } = {}) => {
    const dragState = dragStateRef.current
    if (!dragState) return

    releasePointer?.()

    const shouldSnap = dragState.mode === 'sheet'
    const nextSnap = shouldSnap ? getSnapAfterDrag(dragState) : latestSheetYRef.current

    dragStateRef.current = null
    setIsDragging(false)

    if (shouldSnap) {
      setSheetPosition(nextSnap)
    }

    if (didDragRef.current) {
      window.setTimeout(() => {
        suppressNextClickRef.current = false
        didDragRef.current = false
      }, 180)
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return
    if (event.button !== undefined && event.button !== 0) return

    const started = beginPotentialDrag({
      clientX: event.clientX,
      clientY: event.clientY,
      target: event.target as HTMLElement | null,
    })

    if (started) event.stopPropagation()
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return

    updateDrag({
      clientX: event.clientX,
      clientY: event.clientY,
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation(),
      capturePointer: () => {
        const dragState = dragStateRef.current
        if (!dragState || dragState.hasCapturedPointer) return

        try {
          event.currentTarget.setPointerCapture(event.pointerId)
          dragState.hasCapturedPointer = true
        } catch {
          // Ignore pointer capture errors.
        }
      },
    })
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return
    const dragState = dragStateRef.current

    endDrag({
      releasePointer: () => {
        if (!dragState?.hasCapturedPointer) return

        try {
          event.currentTarget.releasePointerCapture(event.pointerId)
        } catch {
          // Ignore release errors.
        }
      },
    })
  }

  const handlePointerCancel = () => {
    endDrag()
  }

  useEffect(() => {
    const panel = panelRef.current
    const compactReturn = rootRef.current?.querySelector(
      '.mobile-search-map-sheet__compact-return'
    )

    if (!panel) return

    const getTouchById = (event: TouchEvent) => {
      if (activeTouchIdRef.current === null) return event.touches[0] ?? null

      for (const touch of Array.from(event.touches)) {
        if (touch.identifier === activeTouchIdRef.current) return touch
      }

      return null
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return

      const touch = event.touches[0]
      const target = event.target as HTMLElement | null

      activeTouchIdRef.current = touch.identifier

      beginPotentialDrag({
        clientX: touch.clientX,
        clientY: touch.clientY,
        target,
        startedFromCompactReturn: Boolean(
          target?.closest('.mobile-search-map-sheet__compact-return')
        ),
      })
    }

    const handleTouchMove = (event: TouchEvent) => {
      const touch = getTouchById(event)
      if (!touch) return

      updateDrag({
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation(),
      })
    }

    const handleTouchEnd = () => {
      activeTouchIdRef.current = null
      endDrag()
    }

    panel.addEventListener('touchstart', handleTouchStart, {
      capture: true,
      passive: true,
    })
    panel.addEventListener('touchmove', handleTouchMove, {
      capture: true,
      passive: false,
    })
    panel.addEventListener('touchend', handleTouchEnd, {
      capture: true,
      passive: true,
    })
    panel.addEventListener('touchcancel', handleTouchEnd, {
      capture: true,
      passive: true,
    })

    compactReturn?.addEventListener('touchstart', handleTouchStart, {
      capture: true,
      passive: true,
    })
    compactReturn?.addEventListener('touchmove', handleTouchMove, {
      capture: true,
      passive: false,
    })
    compactReturn?.addEventListener('touchend', handleTouchEnd, {
      capture: true,
      passive: true,
    })
    compactReturn?.addEventListener('touchcancel', handleTouchEnd, {
      capture: true,
      passive: true,
    })

    return () => {
      panel.removeEventListener('touchstart', handleTouchStart, true)
      panel.removeEventListener('touchmove', handleTouchMove, true)
      panel.removeEventListener('touchend', handleTouchEnd, true)
      panel.removeEventListener('touchcancel', handleTouchEnd, true)

      compactReturn?.removeEventListener('touchstart', handleTouchStart, true)
      compactReturn?.removeEventListener('touchmove', handleTouchMove, true)
      compactReturn?.removeEventListener('touchend', handleTouchEnd, true)
      compactReturn?.removeEventListener('touchcancel', handleTouchEnd, true)
    }
  }, [currentSheetY, snapPoints, viewportHeight])

  const handlePanelClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressNextClickRef.current) return

    event.preventDefault()
    event.stopPropagation()
  }

  const handlePanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()

    if (isMapExpanded) {
      showMiddleState()
      return
    }

    if (isResultsExpanded) {
      showMiddleState()
      return
    }

    openFullMap()
  }

  return (
    <div
      ref={rootRef}
      className="mobile-search-map-sheet"
      aria-label="Map and search results"
    >
      <div
        className="mobile-search-map-sheet__map"
        aria-hidden={properties.length === 0}
      >
        <PropertiesMap properties={properties} />
      </div>

      <div
        ref={panelRef}
        className={`mobile-search-map-sheet__panel${
          isDragging ? ' mobile-search-map-sheet__panel--dragging' : ''
        }${isMapExpanded ? ' mobile-search-map-sheet__panel--map-expanded' : ''}${
          isResultsExpanded
            ? ' mobile-search-map-sheet__panel--results-expanded'
            : ''
        }`}
        style={{ transform: `translate3d(0, ${currentSheetY}px, 0)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handlePanelClickCapture}
      >
        <div
          className="mobile-search-map-sheet__handle-area"
          role="button"
          tabIndex={0}
          aria-label={isMapExpanded ? 'Show search results' : 'Drag results panel'}
          onKeyDown={handlePanelKeyDown}
          onDoubleClick={() => {
            if (isMapExpanded) {
              showMiddleState()
              return
            }

            if (isResultsExpanded) {
              showMiddleState()
              return
            }

            openFullMap()
          }}
        >
          <span className="mobile-search-map-sheet__grabber" aria-hidden="true" />
        </div>

        <div ref={contentRef} className="mobile-search-map-sheet__content">
          {children}
        </div>
      </div>

      <div
        className={`mobile-search-map-sheet__compact-return${
          isMapExpanded && !hasMapPreview
            ? ' mobile-search-map-sheet__compact-return--visible'
            : ''
        }${isDragging ? ' mobile-search-map-sheet__compact-return--dragging' : ''}`}
        role="button"
        tabIndex={isMapExpanded && !hasMapPreview ? 0 : -1}
        aria-hidden={!isMapExpanded || hasMapPreview}
        aria-label="Show search results"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handlePanelKeyDown}
        onClick={(event) => {
          if (dragStateRef.current) return
          event.preventDefault()
          showMiddleState()
        }}
        onDoubleClick={(event) => {
          event.preventDefault()
          expandResults()
        }}
      >
        <span className="mobile-search-map-sheet__compact-grabber" aria-hidden="true" />
      </div>

      <style>{`
        .mobile-search-map-sheet {
          display: none;
        }

        @media (max-width: 1023px) {
          .mobile-search-map-sheet {
            position: relative;
            display: block;
            height: calc(100dvh - 92px);
            min-height: 0;
            max-height: calc(100dvh - 92px);
            margin-left: calc(50% - 50vw);
            margin-right: calc(50% - 50vw);
            margin-top: -32px;
            overflow: hidden;
            background: #e5edf7;
            isolation: isolate;
          }

          @supports (height: 100svh) {
            .mobile-search-map-sheet {
              height: calc(100svh - 92px);
              max-height: calc(100svh - 92px);
            }
          }

          .mobile-search-map-sheet__map {
            position: absolute;
            inset: 0;
            z-index: 1;
            background: #e5edf7;
          }

          .mobile-search-map-sheet__map > div {
            min-height: 100%;
          }

          .mobile-search-map-sheet__panel {
            position: absolute;
            inset-inline: 0;
            bottom: 0;
            z-index: 3;
            display: flex;
            height: 100%;
            min-height: 0;
            flex-direction: column;
            border-radius: 30px 30px 0 0;
            background: #ffffff;
            box-shadow: 0 -18px 42px rgba(15, 23, 42, 0.16);
            transition:
              transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
              opacity 180ms ease,
              visibility 180ms ease;
            will-change: transform;
          }

          .mobile-search-map-sheet__panel--dragging {
            transition: none;
          }

          .mobile-search-map-sheet__panel--map-expanded {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
          }

          .mobile-search-map-sheet__handle-area {
            flex-shrink: 0;
            cursor: grab;
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
            padding: 9px 18px 12px;
            border-radius: 30px 30px 0 0;
            background: #ffffff;
          }

          .mobile-search-map-sheet__handle-area:active {
            cursor: grabbing;
          }

          .mobile-search-map-sheet__grabber {
            display: block;
            width: 46px;
            height: 4px;
            margin: 0 auto;
            border-radius: 999px;
            background: #d1d5db;
          }

          .mobile-search-map-sheet__content {
            flex: 1;
            min-height: 0;
            overflow-y: hidden;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-y;
            padding: 0 18px calc(env(safe-area-inset-bottom, 0px) + 132px);
          }

          .mobile-search-map-sheet__panel--results-expanded .mobile-search-map-sheet__content {
            overflow-y: auto;
            overscroll-behavior-y: contain;
            touch-action: pan-y;
          }

          .mobile-search-map-sheet__content .property-media-card,
          .mobile-search-map-sheet__content .property-media-slider,
          .mobile-search-map-sheet__content .property-media-slider__track,
          .mobile-search-map-sheet__content .property-media-slider__slide {
            overscroll-behavior-x: contain;
          }

          .mobile-search-map-sheet__content .property-media-slider {
            pointer-events: auto !important;
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            touch-action: pan-y !important;
          }

          .mobile-search-map-sheet__compact-return {
            position: fixed;
            left: max(14px, env(safe-area-inset-left, 0px));
            right: max(14px, env(safe-area-inset-right, 0px));
            bottom: 0;
            z-index: 190;
            min-height: 62px;
            padding: 14px 18px calc(env(safe-area-inset-bottom, 0px) + 14px);
            border-radius: 28px 28px 0 0;
            background: #ffffff;
            box-shadow: 0 -14px 32px rgba(15, 23, 42, 0.14);
            text-align: center;
            cursor: grab;
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transform: translateY(110%);
            transition:
              opacity 220ms ease,
              visibility 220ms ease,
              transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
          }

          .mobile-search-map-sheet__compact-return--visible {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transform: translateY(0);
          }

          .mobile-search-map-sheet__compact-return--dragging {
            transition: none;
          }

          .mobile-search-map-sheet__compact-return:active {
            cursor: grabbing;
          }

          .mobile-search-map-sheet__compact-grabber {
            display: block;
            width: 44px;
            height: 4px;
            margin: 0 auto;
            border-radius: 999px;
            background: #d1d5db;
          }
        }

        @media (prefers-color-scheme: dark) and (max-width: 1023px) {
          .mobile-search-map-sheet {
            background: #020617;
          }

          .mobile-search-map-sheet__panel,
          .mobile-search-map-sheet__handle-area,
          .mobile-search-map-sheet__compact-return {
            background: #050816;
          }

          .mobile-search-map-sheet__panel {
            box-shadow: 0 -18px 42px rgba(0, 0, 0, 0.42);
          }

          .mobile-search-map-sheet__compact-return {
            box-shadow: 0 -14px 32px rgba(0, 0, 0, 0.38);
          }

          .mobile-search-map-sheet__grabber,
          .mobile-search-map-sheet__compact-grabber {
            background: rgba(148, 163, 184, 0.45);
          }
        }
      `}</style>
    </div>
  )
}
