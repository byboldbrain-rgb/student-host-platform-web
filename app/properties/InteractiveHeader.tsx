'use client'

import { useState, useEffect, ReactNode } from 'react'

type InteractiveHeaderProps = {
  logo: ReactNode
  homesButton: ReactNode
  langSwitcher: ReactNode
  largeSearchBar: ReactNode
  compactText: {
    anywhere: string
    anytime: string
    addGuests: string
  }
}

export default function InteractiveHeader({
  logo,
  homesButton,
  langSwitcher,
  largeSearchBar,
  compactText,
}: InteractiveHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // تغيير الحالة عندما ينزل المستخدم للأسفل قليلاً
      setIsScrolled(window.scrollY > 40)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 transition-all duration-300">
      <div className="mx-auto max-w-[1920px] px-6 lg:px-6">
        {/* الصف العلوي (الشعار - منتصف الشاشة - تبديل اللغة) */}
        <div className="relative flex items-center justify-between h-[90px]">
          {/* الشعار (يسار / يمين حسب اللغة) */}
          <div className="flex-1 flex items-center">
            {logo}
          </div>

          {/* منتصف الشاشة (يتغير حسب السكرول) */}
          <div className="flex-1 flex justify-center items-center">
            {/* زر Homes - يظهر في الأعلى فقط */}
            <div
              className={`absolute transition-all duration-300 ease-in-out ${
                isScrolled
                  ? 'opacity-0 scale-90 pointer-events-none translate-y-[-10px]'
                  : 'opacity-100 scale-100 translate-y-0'
              }`}
            >
              {homesButton}
            </div>

            {/* شريط البحث المصغر - يظهر عند السكرول فقط */}
            <div
              className={`absolute transition-all duration-300 ease-in-out ${
                isScrolled
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 pointer-events-none translate-y-[10px]'
              }`}
            >
              <button
                onClick={scrollToTop}
                className="flex items-center h-[48px] rounded-full border border-gray-200 bg-white shadow-sm transition hover:shadow-md cursor-pointer whitespace-nowrap"
              >
                <span className="px-5 text-sm font-medium text-gray-900">{compactText.anywhere}</span>
                <span className="h-[24px] w-[1px] bg-gray-200"></span>
                <span className="px-5 text-sm font-medium text-gray-900">{compactText.anytime}</span>
                <span className="h-[24px] w-[1px] bg-gray-200"></span>
                <div className="flex items-center gap-3 px-5">
                  <span className="text-sm text-gray-500">{compactText.addGuests}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff385c] text-white shrink-0 -mx-2">
                    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', fill: 'none', height: '12px', width: '12px', stroke: 'currentColor', strokeWidth: 5.33333, overflow: 'visible' }}>
                      <g fill="none">
                        <path d="m13 24c6.0751322 0 11-4.9248678 11-11 0-6.07513225-4.9248678-11-11-11-6.07513225 0-11 4.92486775-11 11 0 6.0751322 4.92486775 11 11 11zm8-3 9 9"></path>
                      </g>
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* تبديل اللغة (يمين / يسار حسب اللغة) */}
          <div className="flex-1 flex justify-end">
            {langSwitcher}
          </div>
        </div>

        {/* الصف السفلي (شريط البحث الكبير) - يختفي عند السكرول */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isScrolled ? 'h-0 opacity-0' : 'h-[100px] opacity-100'
          }`}
        >
          <div className="flex justify-center pb-8 pt-1">
            {largeSearchBar}
          </div>
        </div>
      </div>
    </header>
  )
}