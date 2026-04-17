'use client'

import { useEffect, useState } from 'react'

export default function AdminPropertyGallery({
  images,
  title,
}: {
  images: string[]
  title: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const openModal = (index: number) => {
    setActiveIndex(index)
    setIsOpen(true)
  }

  const closeModal = () => setIsOpen(false)

  const goPrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    )
  }

  const goNext = () => {
    setActiveIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    )
  }

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <>
      {/* GRID */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => openModal(index)}
            className={index === 0 ? 'md:col-span-2 lg:col-span-2' : ''}
          >
            <img
              src={image}
              className={`w-full rounded-[22px] object-cover ${
                index === 0 ? 'h-[440px]' : 'h-[210px]'
              }`}
            />
          </button>
        ))}
      </div>

      {/* MODAL */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80"
          onClick={closeModal}
        >
          <div
            className="flex h-full items-center justify-center px-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* LEFT */}
            <button
              onClick={goPrev}
              className="absolute left-6 text-white text-3xl"
            >
              ‹
            </button>

            {/* IMAGE */}
            <img
              src={images[activeIndex]}
              className="max-h-[80vh] rounded-2xl"
            />

            {/* RIGHT */}
            <button
              onClick={goNext}
              className="absolute right-6 text-white text-3xl"
            >
              ›
            </button>

            {/* CLOSE */}
            <button
              onClick={closeModal}
              className="absolute top-6 left-6 bg-white px-4 py-2 rounded-full"
            >
              Close
            </button>

            {/* COUNTER */}
            <div className="absolute top-6 right-6 bg-white px-4 py-2 rounded-full">
              {activeIndex + 1} / {images.length}
            </div>

            {/* THUMBNAILS */}
            <div className="absolute bottom-6 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  onClick={() => setActiveIndex(i)}
                  className={`h-16 w-20 object-cover rounded cursor-pointer ${
                    i === activeIndex ? 'border-2 border-white' : 'opacity-70'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}