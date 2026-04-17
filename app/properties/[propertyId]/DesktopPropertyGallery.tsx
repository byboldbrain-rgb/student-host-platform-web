'use client'

import { useEffect, useMemo, useState } from 'react'

type Props = {
  images: string[]
  title: string
  showAllPhotosLabel: string
  isArabic?: boolean
}

function GalleryGridIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="5" r="1.5" />
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="19" cy="5" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
      <circle cx="5" cy="19" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
      <circle cx="19" cy="19" r="1.5" />
    </svg>
  )
}

function ChevronLeftIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M15 18l-6-6 6-6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M9 6l6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M6 6l12 12M18 6L6 18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function DesktopPropertyGallery({
  images,
  title,
  showAllPhotosLabel,
  isArabic = false,
}: Props) {
  const normalizedImages = useMemo(() => {
    const fallback =
      images[0] || 'https://via.placeholder.com/1400x900?text=No+Image'
    const firstFive = images.slice(0, 5)

    while (firstFive.length < 5) {
      firstFive.push(fallback)
    }

    return {
      cover: fallback,
      firstFive,
      all: images.length > 0 ? images : [fallback],
    }
  }, [images])

  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const openModal = (index: number) => {
    setActiveIndex(index)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  const goPrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? normalizedImages.all.length - 1 : prev - 1
    )
  }

  const goNext = () => {
    setActiveIndex((prev) =>
      prev === normalizedImages.all.length - 1 ? 0 : prev + 1
    )
  }

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal()
      if (event.key === 'ArrowLeft') {
        if (isArabic) {
          goNext()
        } else {
          goPrev()
        }
      }
      if (event.key === 'ArrowRight') {
        if (isArabic) {
          goPrev()
        } else {
          goNext()
        }
      }
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isArabic, normalizedImages.all.length])

  return (
    <>
      <div className="overflow-hidden rounded-[22px]">
        <div className="grid h-[448px] grid-cols-12 gap-2">
          <button
            type="button"
            onClick={() => openModal(0)}
            className="col-span-6 h-full overflow-hidden rounded-l-[22px] text-left"
          >
            <img
              src={normalizedImages.firstFive[0]}
              alt={`${title} 1`}
              className="h-full w-full object-cover transition duration-300 hover:brightness-95"
            />
          </button>

          <div className="col-span-6 grid h-full grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openModal(1)}
              className="overflow-hidden rounded-tr-[22px] text-left"
            >
              <img
                src={normalizedImages.firstFive[1]}
                alt={`${title} 2`}
                className="h-full w-full object-cover transition duration-300 hover:brightness-95"
              />
            </button>

            <button
              type="button"
              onClick={() => openModal(2)}
              className="overflow-hidden text-left"
            >
              <img
                src={normalizedImages.firstFive[2]}
                alt={`${title} 3`}
                className="h-full w-full object-cover transition duration-300 hover:brightness-95"
              />
            </button>

            <button
              type="button"
              onClick={() => openModal(3)}
              className="overflow-hidden text-left"
            >
              <img
                src={normalizedImages.firstFive[3]}
                alt={`${title} 4`}
                className="h-full w-full object-cover transition duration-300 hover:brightness-95"
              />
            </button>

            <div className="relative overflow-hidden rounded-br-[22px]">
              <button
                type="button"
                onClick={() => openModal(4)}
                className="h-full w-full text-left"
              >
                <img
                  src={normalizedImages.firstFive[4]}
                  alt={`${title} 5`}
                  className="h-full w-full object-cover transition duration-300 hover:brightness-95"
                />
              </button>

              <button
                type="button"
                onClick={() => openModal(0)}
                className={`absolute bottom-4 z-10 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/95 px-4 py-3 text-[14px] font-semibold text-slate-900 shadow-sm transition hover:bg-white ${
                  isArabic ? 'left-4' : 'right-4'
                }`}
              >
                <GalleryGridIcon className="h-4 w-4" />
                <span>{showAllPhotosLabel}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-[2px]"
          onClick={closeModal}
        >
          <div
            className="relative mx-auto flex h-full max-w-[1600px] flex-col px-6 py-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
              >
                <CloseIcon className="h-4 w-4" />
                <span>{isArabic ? 'إغلاق' : 'Close'}</span>
              </button>

              <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm">
                {activeIndex + 1} / {normalizedImages.all.length}
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              <button
                type="button"
                onClick={isArabic ? goNext : goPrev}
                className={`absolute top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-3 text-slate-900 shadow-md transition hover:bg-slate-100 ${
                  isArabic ? 'right-4' : 'left-4'
                }`}
                aria-label={isArabic ? 'الصورة السابقة' : 'Previous image'}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>

              <div className="flex h-full w-full items-center justify-center">
                <img
                  src={normalizedImages.all[activeIndex]}
                  alt={`${title} ${activeIndex + 1}`}
                  className="max-h-[78vh] max-w-full rounded-2xl object-contain shadow-2xl"
                />
              </div>

              <button
                type="button"
                onClick={isArabic ? goPrev : goNext}
                className={`absolute top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-3 text-slate-900 shadow-md transition hover:bg-slate-100 ${
                  isArabic ? 'left-4' : 'right-4'
                }`}
                aria-label={isArabic ? 'الصورة التالية' : 'Next image'}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 overflow-x-auto hide-scrollbar">
              <div className="flex gap-3 pb-2">
                {normalizedImages.all.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative h-[88px] w-[120px] shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      index === activeIndex
                        ? 'border-white'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${title} thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}