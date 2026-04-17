'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LanguageDropdown({ 
  selectedLanguage, 
  menuButtonClass, 
  menuPanelClass, 
  menuLinkClass, 
  translations 
}: any) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // وظيفة لتغيير اللغة مع الحفاظ على باقي الفلاتر (مثل المدينة أو العملة)
  const handleLanguageChange = (newLang: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('lang', newLang)
    router.push(`/properties?${params.toString()}`)
    setIsOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={menuButtonClass}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-4 h-4 text-gray-800" fill="currentColor">
          <path d="M8 .25a7.77 7.77 0 0 1 7.75 7.78 7.75 7.75 0 0 1-7.52 7.72h-.25A7.75 7.75 0 0 1 .25 8.24v-.25A7.75 7.75 0 0 1 8 .25zm1.95 8.5h-3.9c.15 2.9 1.17 5.34 1.88 5.5H8c.68 0 1.72-2.37 1.93-5.23zm4.26 0h-2.76c-.09 1.96-.53 3.78-1.18 5.08A6.26 6.26 0 0 0 14.17 9zm-9.67 0H1.8a6.26 6.26 0 0 0 3.94 5.08 12.59 12.59 0 0 1-1.16-4.7l-.03-.38zm1.2-6.58-.12.05a6.26 6.26 0 0 0-3.83 5.03h2.75c.09-1.83.48-3.54 1.06-4.81zm2.25-.42c-.7 0-1.78 2.51-1.94 5.5h3.9c-.15-2.9-1.18-5.34-1.89-5.5h-.07zm2.28.43.03.05a12.95 12.95 0 0 1 1.15 5.02h2.75a6.28 6.28 0 0 0-3.93-5.07z"></path>
        </svg>
      </button>

      {isOpen && (
        <div className={menuPanelClass}>
          <div className="border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {translations[selectedLanguage].language}
          </div>

          <button
            onClick={() => handleLanguageChange('en')}
            className={`w-full text-left rtl:text-right ${menuLinkClass} ${selectedLanguage === 'en' ? 'bg-gray-50 font-semibold' : ''}`}
          >
            {translations.en.english}
          </button>

          <button
            onClick={() => handleLanguageChange('ar')}
            className={`w-full text-left rtl:text-right ${menuLinkClass} ${selectedLanguage === 'ar' ? 'bg-gray-50 font-semibold' : ''}`}
          >
            {translations.ar.arabic}
          </button>
        </div>
      )}
    </div>
  )
}