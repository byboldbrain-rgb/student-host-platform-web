'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type SupportedSort =
  | 'newly_listed'
  | 'lowest_price'
  | 'highest_price'
  | 'boys'
  | 'girls'

type Props = {
  isArabic: boolean
  selectedSort: SupportedSort
  sortByLabel: string
  options: {
    value: SupportedSort
    label: string
    href: string
  }[]
}

function SortIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-[18px] w-[18px] shrink-0"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 4v16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 7 3-3 3 3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 20V4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m13 17 3 3 3-3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      className="h-[18px] w-[18px] shrink-0"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4.2 4.2L19 6.8" />
    </svg>
  )
}

export default function SortDropdown({
  isArabic,
  selectedSort,
  sortByLabel,
  options,
}: Props) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-[42px] items-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 text-[14px] font-semibold text-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition hover:border-gray-400 hover:shadow-[0_5px_16px_rgba(0,0,0,0.08)]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="text-gray-700">
          <SortIcon />
        </span>

        <span>{sortByLabel}</span>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 text-gray-500 transition duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.51a.75.75 0 0 1-1.08 0l-4.25-4.51a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute top-[calc(100%+10px)] z-30 min-w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 shadow-[0_14px_32px_rgba(0,0,0,0.12)] ${
            isArabic ? 'left-0 md:left-0' : 'left-0 md:right-0'
          }`}
          role="menu"
        >
          {options.map((option) => {
            const isActive = selectedSort === option.value

            return (
              <Link
                key={option.value}
                href={option.href}
                className={`flex items-center justify-between px-4 py-3 text-[15px] transition ${
                  isActive
                    ? 'bg-gray-50 font-semibold text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <span>{option.label}</span>

                <span
                  className={
                    isActive ? 'opacity-100 text-gray-900' : 'opacity-0'
                  }
                >
                  <CheckIcon />
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}