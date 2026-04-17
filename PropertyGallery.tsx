'use client'

import { useEffect, useMemo, useState } from 'react'

type PropertyGalleryProps = {
  images: string[]
  title: string
  morePhotosLabel: string
  isArabic: boolean
}

export default function PropertyGallery({
  images,
  title,
  morePhotosLabel,
  isArabic,
}: PropertyGalleryProps) {
  const safeImages = useMemo(
    () =>
      images?.length
        ? images
        : ['https://via.placeholder.com/1400x900?text=No+Image'],
    [images]
  )

  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const previewImages = safeImages.slice(0, 5)

  const openGallery = (index: number) => {
    setActiveIndex(index)
    setIsOpen(true)
  }

  const closeGallery = () => {
    setIsOpen(false)
  }

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % safeImages.length)
  }

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length)
  }

  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeGallery()
      if (event.key === 'ArrowRight') {
        if (isArabic) {
          goPrev()
        } else {
          goNext()
        }
      }
      if (event.key === 'ArrowLeft') {
        if (isArabic) {
          goNext()
        } else {
          goPrev()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isArabic, safeImages.length])

  return (
    <>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
        <button
          type="button"
          onClick={() => openGallery(0)}
          className="group overflow-hidden rounded-[8px] bg-slate-100 text-left"
        >
          <img
            src={previewImages[0]}
            alt={`${title} image 1`}
            className="h-[300px] w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:h-[420px] lg:h-[470px]"
          />
        </button>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <button
            type="button"
            onClick={() => openGallery(1)}
            className="group overflow-hidden rounded-[8px] bg-slate-100 text-left"
          >
            <img
              src={previewImages[1] || previewImages[0]}
              alt={`${title} image 2`}
              className="h-[228px] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          </button>

          <button
            type="button"
            onClick={() => openGallery(2)}
            className="group overflow-hidden rounded-[8px] bg-slate-100 text-left"
          >
            <img
              src={previewImages[2] || previewImages[0]}
              alt={`${title} image 3`}
              className="h-[228px] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          </button>
        </div>
      </div>

      {safeImages.length > 3 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => openGallery(3)}
            className="group overflow-hidden rounded-[8px] bg-slate-100 text-left"
          >
            <img
              src={previewImages[3]}
              alt={`${title} image 4`}
              className="h-[180px] w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:h-[220px]"
            />
          </button>

          <button
            type="button"
            onClick={() => openGallery(4)}
            className="group relative overflow-hidden rounded-[8px] bg-slate-100 text-left"
          >
            <img
              src={previewImages[4] || previewImages[0]}
              alt={`${title} image 5`}
              className="h-[180px] w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:h-[220px]"
            />

            {safeImages.length > 5 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <span className="text-xl font-bold text-white underline">
                  +{safeImages.length - 5} {morePhotosLabel}
                </span>
              </div>
            )}
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-[#f3f3f3]"
          onClick={closeGallery}
        >
          <div
            className="flex h-full flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-300 bg-[#f3f3f3] px-4 py-4 md:px-8">
              <button
                type="button"
                onClick={closeGallery}
                className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d={isArabic ? 'm9 5 7 7-7 7' : 'm15 5-7 7 7 7'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{isArabic ? 'المعرض' : 'Gallery'}</span>
              </button>

              <h2 className="hidden max-w-[50%] truncate text-center text-xl font-bold text-slate-900 md:block">
                {title}
              </h2>

              <div className="w-[120px]" />
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-6 md:px-10">
              {safeImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={isArabic ? goNext : goPrev}
                    className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-3 text-slate-900 shadow-md transition hover:bg-white md:left-8"
                    aria-label={isArabic ? 'الصورة التالية' : 'Previous image'}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-7 w-7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d={isArabic ? 'm8 5 8 7-8 7' : 'm15 5-7 7 7 7'}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={isArabic ? goPrev : goNext}
                    className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-3 text-slate-900 shadow-md transition hover:bg-white md:right-8"
                    aria-label={isArabic ? 'الصورة السابقة' : 'Next image'}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-7 w-7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d={isArabic ? 'm16 5-8 7 8 7' : 'm9 5 7 7-7 7'}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </>
              )}

              <div className="flex h-full w-full flex-col items-center justify-center">
                <div className="flex max-h-[calc(100vh-240px)] w-full items-center justify-center">
                  <img
                    src={safeImages[activeIndex]}
                    alt={`${title} image ${activeIndex + 1}`}
                    className="max-h-[calc(100vh-260px)] max-w-full rounded-[10px] object-contain shadow-sm"
                  />
                </div>

                <div className="mt-4 text-xl font-medium text-slate-800">
                  {activeIndex + 1} / {safeImages.length}
                </div>
              </div>
            </div>

            {safeImages.length > 1 && (
              <div className="border-t border-slate-300 bg-[#f3f3f3] px-4 py-4 md:px-8">
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {safeImages.map((image, index) => {
                    const isActive = index === activeIndex

                    return (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className={`shrink-0 overflow-hidden rounded-[8px] border-2 transition ${
                          isActive
                            ? 'border-blue-600 opacity-100'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${title} thumbnail ${index + 1}`}
                          className="h-20 w-24 object-cover sm:h-24 sm:w-32"
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
