'use client'

import { useState, ReactNode } from 'react'

export default function SwipeableSheetWrapper({ children }: { children: ReactNode }) {
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollableArea = (e.target as HTMLElement).closest('.overflow-y-auto')

    // لو المستخدم بيعمل سكرول جوه الغرف وموصلش لأول القائمة فوق، متسحبش الشاشة كلها
    if (scrollableArea && scrollableArea.scrollTop > 0) {
      return
    }

    setStartY(e.touches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const y = e.touches[0].clientY
    const deltaY = y - startY

    // السماح بالسحب للأسفل فقط
    if (deltaY > 0) {
      setCurrentY(deltaY)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    // لو سحب الشريط لتحت مسافة أكتر من 100 بيكسل، اقفل القائمة (عن طريق إلغاء الشيك بوكس)
    if (currentY > 100) {
      const checkbox = document.getElementById('mobile-rooms-toggle') as HTMLInputElement
      if (checkbox) checkbox.checked = false
    }

    // رجّع القائمة لمكانها الطبيعي بنعومة لو السحبة مكنتش كافية
    setCurrentY(0)
  }

  return (
    <div
      className="mobile-rooms-sheet__panel"
      style={{
        transform: isDragging ? `translateY(${currentY}px)` : '',
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  )
}