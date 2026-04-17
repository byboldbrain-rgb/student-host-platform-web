'use client'
import React, { useRef, useState, useEffect } from 'react'

interface PropertyCarouselProps {
  children: React.ReactNode
  title: string
  href: string
}

export default function PropertyCarousel({ children, title, href }: PropertyCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const checkArrows = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setShowLeftArrow(scrollLeft > 10)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkArrows()
    window.addEventListener('resize', checkArrows)
    return () => window.removeEventListener('resize', checkArrows)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="group/section relative">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
          <a href={href}>{title}</a>
        </h2>

        {/* Navigation Arrows */}
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm transition-all hover:border-black hover:shadow-md ${
              !showLeftArrow ? 'invisible opacity-0' : 'visible opacity-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" className="h-3 w-3 fill-none stroke-current stroke-[4]">
              <path d="M20 28 8.7 16.7a1 1 0 0 1 0-1.4L20 4"></path>
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm transition-all hover:border-black hover:shadow-md ${
              !showRightArrow ? 'invisible opacity-0' : 'visible opacity-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" className="h-3 w-3 fill-none stroke-current stroke-[4]">
              <path d="m12 4 11.3 11.3a1 1 0 0 1 0 1.4L12 28"></path>
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={checkArrows}
        className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  )
}