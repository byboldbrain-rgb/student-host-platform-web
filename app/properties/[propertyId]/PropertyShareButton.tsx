'use client'

import { useEffect, useState } from 'react'

type PropertyShareButtonProps = {
  url: string
  title: string
  text: string
  isArabic: boolean
  compact?: boolean
  labels: {
    share: string
    shareProperty: string
    copied: string
  }
}

export default function PropertyShareButton({
  url,
  title,
  text,
  isArabic,
  compact = false,
  labels,
}: PropertyShareButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return

    const timeoutId = window.setTimeout(() => {
      setCopied(false)
    }, 1800)

    return () => window.clearTimeout(timeoutId)
  }, [copied])

  const handleShare = async () => {
    const shareData = {
      title,
      text,
      url,
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData)
        return
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        return
      }

      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
        '_blank',
        'noopener,noreferrer'
      )
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return

      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
      } catch {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
          '_blank',
          'noopener,noreferrer'
        )
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={labels.shareProperty}
      title={labels.shareProperty}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/95 font-semibold text-slate-900 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white active:scale-[0.98] dark:border-white/10 dark:bg-[#0b1220]/95 dark:text-slate-100 dark:hover:border-white/20 ${
        compact
          ? 'h-11 min-w-11 px-3 text-[13px]'
          : 'h-11 px-4 text-[14px]'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          d="M8.59 13.51 15.42 17.49M15.41 6.51 8.59 10.49"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {!compact && <span>{copied ? labels.copied : labels.share}</span>}
      {compact && copied && (
        <span className="sr-only" dir={isArabic ? 'rtl' : 'ltr'}>
          {labels.copied}
        </span>
      )}
    </button>
  )
}
