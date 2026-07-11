'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type PropertyVideoButtonProps = {
  videoUrl: string
  title: string
  buttonLabel: string
  closeLabel: string
  className?: string
}

function getYouTubeEmbedUrl(value: string) {
  try {
    const url = new URL(value)
    const hostname = url.hostname.replace(/^www\./, '').toLowerCase()

    if (hostname === 'youtu.be') {
      const videoId = url.pathname.split('/').filter(Boolean)[0]
      return videoId
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
        : null
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        const videoId = url.searchParams.get('v')
        return videoId
          ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
          : null
      }

      const parts = url.pathname.split('/').filter(Boolean)
      const typeIndex = parts.findIndex((part) =>
        ['embed', 'shorts', 'live'].includes(part),
      )
      const videoId = typeIndex >= 0 ? parts[typeIndex + 1] : null

      return videoId
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
        : null
    }
  } catch {
    return null
  }

  return null
}

function getVimeoEmbedUrl(value: string) {
  try {
    const url = new URL(value)
    const hostname = url.hostname.replace(/^www\./, '').toLowerCase()

    if (hostname !== 'vimeo.com' && hostname !== 'player.vimeo.com') {
      return null
    }

    const videoId = url.pathname
      .split('/')
      .filter(Boolean)
      .reverse()
      .find((part) => /^\d+$/.test(part))

    return videoId
      ? `https://player.vimeo.com/video/${videoId}?autoplay=1`
      : null
  } catch {
    return null
  }
}

export default function PropertyVideoButton({
  videoUrl,
  title,
  buttonLabel,
  closeLabel,
  className = '',
}: PropertyVideoButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  const embedUrl = useMemo(
    () => getYouTubeEmbedUrl(videoUrl) || getVimeoEmbedUrl(videoUrl),
    [videoUrl],
  )

  const closeModal = () => {
    if (videoRef.current) {
      videoRef.current.pause()
    }

    setIsOpen(false)
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 0)

    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  const modal =
    isMounted && isOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-0 backdrop-blur-sm sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeModal()
              }
            }}
          >
            <div className="relative flex h-full w-full flex-col overflow-hidden bg-black sm:h-auto sm:max-h-[92vh] sm:max-w-5xl sm:rounded-[28px] sm:border sm:border-white/15 sm:shadow-2xl">
              <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 bg-gradient-to-b from-black/75 to-transparent px-4 pb-12 pt-[max(16px,env(safe-area-inset-top))] sm:px-5 sm:pt-5">
                <h2 className="min-w-0 truncate text-[15px] font-semibold text-white sm:text-[17px]">
                  {title}
                </h2>

                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeModal}
                  aria-label={closeLabel}
                  title={closeLabel}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition hover:scale-105 hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/35"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 6l12 12M18 6 6 18"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex min-h-0 flex-1 items-center justify-center bg-black">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={title}
                    className="aspect-video w-full border-0"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    title={title}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    controlsList="nodownload"
                    className="h-full max-h-screen w-full bg-black object-contain sm:max-h-[92vh]"
                  >
                    Your browser does not support video playback.
                  </video>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[14px] font-bold text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_12px_28px_rgba(15,23,42,0.20)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#054aff]/20 dark:border-white/10 dark:bg-[#0b1220] dark:text-white dark:hover:bg-[#111827] ${className}`}
        aria-haspopup="dialog"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef3ff] text-[#054aff] dark:bg-[#163167] dark:text-[#8fb0ff]">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M8.25 6.72v10.56c0 .93 1.02 1.5 1.81 1.01l8.36-5.28a1.19 1.19 0 0 0 0-2.02L10.06 5.7c-.79-.49-1.81.08-1.81 1.01Z" />
          </svg>
        </span>

        <span>{buttonLabel}</span>
      </button>

      {modal}
    </>
  )
}
