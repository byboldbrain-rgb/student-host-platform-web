'use client'

import { useEffect, useMemo, useState } from 'react'

type AmenityItem = {
  id: string
  name_en?: string | null
  name_ar?: string | null
  icon_key?: string | null
  icon_url?: string | null
  category_en?: string | null
  category_ar?: string | null
  sort_order?: number | null
  is_available?: boolean
}

type Props = {
  isArabic: boolean
  title: string
  showAllLabel: string
  items: AmenityItem[]
  showAllButtonClassName?: string
  sectionClassName?: string
  titleClassName?: string
  gridClassName?: string
  hideBottomBorder?: boolean
  variant?: 'default' | 'sidebar'
}

function normalizeText(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function getDisplayLabel(item: AmenityItem, isArabic: boolean) {
  return isArabic
    ? item.name_ar || item.name_en || ''
    : item.name_en || item.name_ar || ''
}

function getCanonicalLabel(item: AmenityItem) {
  return normalizeText(item.name_en || item.name_ar || '')
}

function resolveIconKey(item: AmenityItem) {
  const rawIcon = normalizeText(item.icon_key)
  const en = normalizeText(item.name_en)
  const ar = normalizeText(item.name_ar)
  const all = `${rawIcon} ${en} ${ar}`

  const has = (...terms: string[]) => terms.some((term) => all.includes(term))

  if (has('hot water', 'water heater', 'heater')) return 'hot_water'
  if (has('hair dryer', 'dryer')) return 'hair_dryer'
  if (has('washing machine', 'washer', 'laundry')) return 'washer'
  if (has('tv', 'television', 'smart tv')) return 'tv'
  if (has('air conditioning', 'air condition', 'ac')) return 'air_conditioning'
  if (has('ceiling fan', 'fan')) return 'ceiling_fan'
  if (has('central heating', 'heating')) return 'central_heating'
  if (has('wifi', 'wi fi', 'internet')) return 'wifi'
  if (has('refrigerator', 'fridge')) return 'refrigerator'
  if (has('microwave')) return 'microwave'
  if (has('cooking basics', 'cookware', 'kitchenware')) return 'cooking_basics'
  if (has('dishes', 'silverware', 'cutlery', 'plates', 'spoons')) return 'dishes_and_silverware'
  if (has('freezer')) return 'freezer'
  if (has('dishwasher')) return 'dishwasher'
  if (has('electric stove', 'stove', 'cooker')) return 'electric_stove'
  if (has('oven')) return 'oven'
  if (has('coffee maker', 'coffee machine')) return 'coffee_maker'
  if (has('dining table', 'table')) return 'dining_table'
  if (has('building', 'facility', 'facilities')) return 'building'
  if (has('receipt', 'bill', 'bills', 'utilities')) return 'receipt'
  if (has('kitchen')) return 'kitchen'
  if (has('private bathroom', 'bathroom')) return 'private_bathroom'
  if (has('kettle')) return 'kettle'
  if (has('iron')) return 'iron'
  if (has('smoke alarm')) return 'smoke_alarm'
  if (has('parking')) return 'parking'
  if (has('elevator', 'lift')) return 'elevator'
  if (has('security')) return 'security'
  if (has('balcony')) return 'balcony'
  if (has('gym')) return 'gym'
  if (has('pool', 'swimming')) return 'pool'
  if (has('garden')) return 'garden'
  if (has('workspace', 'desk', 'study desk')) return 'workspace'
  if (has('bed', 'beds')) return 'bed'

  return 'default'
}

function AmenityIcon({
  iconKey,
  iconUrl,
  className = 'h-6 w-6',
}: {
  iconKey?: string | null
  iconUrl?: string | null
  className?: string
}) {
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        className={className}
        draggable={false}
      />
    )
  }

  const commonProps = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (iconKey) {
    case 'hot_water':
      return (
        <svg {...commonProps}>
          <path d="M7 20h10a3 3 0 0 0 3-3V9H4v8a3 3 0 0 0 3 3Z" />
          <path d="M8 9V6a4 4 0 1 1 8 0v3" />
          <path d="M8 3c.5.6.8 1.2.8 1.9S8.5 6.2 8 7" />
          <path d="M12 2c.5.6.8 1.2.8 1.9S12.5 5.2 12 6" />
          <path d="M16 3c.5.6.8 1.2.8 1.9S16.5 6.2 16 7" />
        </svg>
      )

    case 'hair_dryer':
      return (
        <svg {...commonProps}>
          <path d="M4 10a4 4 0 0 1 4-4h5a4 4 0 1 1 0 8H9" />
          <path d="M9 10v4" />
          <path d="M9 14H7a2 2 0 0 0 0 4h1" />
          <path d="M17 8l3-1" />
          <path d="M17 11h3" />
          <path d="M17 14l3 1" />
        </svg>
      )

    case 'washer':
      return (
        <svg {...commonProps}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <circle cx="12" cy="13" r="4" />
          <path d="M8 7h.01" />
          <path d="M11 7h5" />
        </svg>
      )

    case 'tv':
      return (
        <svg {...commonProps}>
          <rect x="4" y="5" width="16" height="12" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      )

    case 'air_conditioning':
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="6" rx="2" />
          <path d="M7 15c0 1-.6 1.5-1 2s-1 1-.9 2" />
          <path d="M12 15c0 1-.6 1.5-1 2s-1 1-.9 2" />
          <path d="M17 15c0 1-.6 1.5-1 2s-1 1-.9 2" />
        </svg>
      )

    case 'ceiling_fan':
      return (
        <svg {...commonProps}>
          <path d="M12 4v4" />
          <circle cx="12" cy="10" r="1.5" />
          <path d="M13.5 9c2.5-2.4 5.4-2.9 6.4-1.9s.4 3.9-2 6.3" />
          <path d="M10.5 9C8 6.6 5.1 6.1 4.1 7.1s-.4 3.9 2 6.3" />
          <path d="M12 11.5c.2 3.4-1 6-2.5 6.1-1.4.1-2.8-2.2-3-5.5" />
        </svg>
      )

    case 'central_heating':
      return (
        <svg {...commonProps}>
          <rect x="4" y="6" width="16" height="10" rx="2" />
          <path d="M7 6v10" />
          <path d="M10 6v10" />
          <path d="M14 6v10" />
          <path d="M17 6v10" />
          <path d="M8 20c.6-.5 1-1.2 1-2" />
          <path d="M12 20c.6-.5 1-1.2 1-2" />
          <path d="M16 20c.6-.5 1-1.2 1-2" />
        </svg>
      )

    case 'wifi':
      return (
        <svg {...commonProps}>
          <path d="M2 8a16 16 0 0 1 20 0" />
          <path d="M5 12a11 11 0 0 1 14 0" />
          <path d="M8.5 15.5a6 6 0 0 1 7 0" />
          <path d="M12 19h.01" />
        </svg>
      )

    case 'refrigerator':
      return (
        <svg {...commonProps}>
          <rect x="7" y="3" width="10" height="18" rx="2" />
          <path d="M7 11h10" />
          <path d="M9 8h.01" />
          <path d="M9 15h.01" />
        </svg>
      )

    case 'microwave':
      return (
        <svg {...commonProps}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <rect x="6" y="9" width="8" height="6" rx="1" />
          <path d="M17 10h.01" />
          <path d="M17 13h.01" />
        </svg>
      )

    case 'cooking_basics':
      return (
        <svg {...commonProps}>
          <path d="M4 10h12a3 3 0 0 1 3 3v3H7a3 3 0 0 1-3-3v-3Z" />
          <path d="M16 10V8a2 2 0 0 0-2-2H8" />
          <path d="M19 13h1" />
        </svg>
      )

    case 'dishes_and_silverware':
      return (
        <svg {...commonProps}>
          <path d="M4 3v8" />
          <path d="M6 3v8" />
          <path d="M5 11v10" />
          <path d="M11 3v6a2 2 0 0 0 4 0V3" />
          <path d="M13 11v10" />
          <path d="M19 3v18" />
        </svg>
      )

    case 'freezer':
      return (
        <svg {...commonProps}>
          <rect x="7" y="3" width="10" height="18" rx="2" />
          <path d="M7 11h10" />
          <path d="M12 6v3" />
          <path d="M10.5 7.5h3" />
        </svg>
      )

    case 'dishwasher':
      return (
        <svg {...commonProps}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M8 7h8" />
          <circle cx="12" cy="14" r="3.5" />
        </svg>
      )

    case 'electric_stove':
      return (
        <svg {...commonProps}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <circle cx="15" cy="10" r="1.5" />
          <circle cx="9" cy="15" r="1.5" />
          <circle cx="15" cy="15" r="1.5" />
        </svg>
      )

    case 'oven':
      return (
        <svg {...commonProps}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M4 8h16" />
          <path d="M8 6h.01" />
          <path d="M11 6h.01" />
          <path d="M14 6h.01" />
          <rect x="8" y="11" width="8" height="6" rx="1" />
        </svg>
      )

    case 'coffee_maker':
      return (
        <svg {...commonProps}>
          <path d="M7 7h8v5a4 4 0 0 1-4 4 4 4 0 0 1-4-4V7Z" />
          <path d="M15 9h2a2 2 0 0 1 0 4h-2" />
          <path d="M6 20h10" />
          <path d="M8 3c.5.5.8 1 .8 1.6S8.5 5.7 8 6.2" />
          <path d="M12 3c.5.5.8 1 .8 1.6S12.5 5.7 12 6.2" />
        </svg>
      )

    case 'dining_table':
      return (
        <svg {...commonProps}>
          <path d="M5 10h14" />
          <path d="M7 10V6h10v4" />
          <path d="M8 10v10" />
          <path d="M16 10v10" />
        </svg>
      )

    case 'building':
      return (
        <svg {...commonProps}>
          <path d="M3 21h18" />
          <path d="M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14" />
          <path d="M9 9h.01" />
          <path d="M15 9h.01" />
          <path d="M9 13h.01" />
          <path d="M15 13h.01" />
          <path d="M11 21v-4h2v4" />
        </svg>
      )

    case 'receipt':
      return (
        <svg {...commonProps}>
          <path d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5L5 21V5a2 2 0 0 1 2-2Z" />
          <path d="M9 8h6" />
          <path d="M9 12h6" />
          <path d="M9 16h4" />
        </svg>
      )

    case 'kitchen':
      return (
        <svg {...commonProps}>
          <path d="M4 20h16" />
          <path d="M6 20V8a2 2 0 0 1 2-2h3v14" />
          <path d="M13 20V6h3a2 2 0 0 1 2 2v12" />
          <path d="M8 10h1" />
          <path d="M15 10h1" />
        </svg>
      )

    case 'private_bathroom':
      return (
        <svg {...commonProps}>
          <path d="M7 13V6a2 2 0 1 1 4 0v7" />
          <path d="M5 13h12" />
          <path d="M6 13v2a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4v-2" />
        </svg>
      )

    case 'kettle':
      return (
        <svg {...commonProps}>
          <path d="M7 10h8v3a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-3Z" />
          <path d="M15 11h1a2 2 0 0 1 0 4h-1" />
          <path d="M9 7a2 2 0 0 1 4 0" />
        </svg>
      )

    case 'iron':
      return (
        <svg {...commonProps}>
          <path d="M6 14h11l-1.5-5H9a3 3 0 0 0-3 3v2Z" />
          <path d="M6 14a3 3 0 0 0 3 3h6" />
          <path d="M14 9V7h2" />
        </svg>
      )

    case 'smoke_alarm':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M8.5 12a3.5 3.5 0 0 1 7 0" />
          <path d="M10 15h4" />
        </svg>
      )

    case 'parking':
      return (
        <svg {...commonProps}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M10 17V7h3a3 3 0 0 1 0 6h-3" />
        </svg>
      )

    case 'elevator':
      return (
        <svg {...commonProps}>
          <rect x="6" y="3" width="12" height="18" rx="2" />
          <path d="M10 8l2-2 2 2" />
          <path d="M10 16l2 2 2-2" />
        </svg>
      )

    case 'security':
      return (
        <svg {...commonProps}>
          <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3Z" />
        </svg>
      )

    case 'balcony':
      return (
        <svg {...commonProps}>
          <path d="M4 20h16" />
          <path d="M7 20v-8" />
          <path d="M12 20v-8" />
          <path d="M17 20v-8" />
          <path d="M5 12h14" />
        </svg>
      )

    case 'gym':
      return (
        <svg {...commonProps}>
          <path d="M3 10v4" />
          <path d="M7 8v8" />
          <path d="M17 8v8" />
          <path d="M21 10v4" />
          <path d="M7 12h10" />
          <path d="M3 10h4" />
          <path d="M17 12h4" />
        </svg>
      )

    case 'pool':
      return (
        <svg {...commonProps}>
          <path d="M3 18c1.5-1 2.5-1 4 0s2.5 1 4 0 2.5-1 4 0 2.5 1 4 0" />
          <path d="M6 14V8a2 2 0 0 1 4 0v6" />
          <path d="M10 10h3" />
        </svg>
      )

    case 'garden':
      return (
        <svg {...commonProps}>
          <path d="M12 21v-8" />
          <path d="M12 13c0-3-2-5-5-5 0 3 2 5 5 5Z" />
          <path d="M12 13c0-3 2-5 5-5 0 3-2 5-5 5Z" />
          <path d="M12 9c2 0 4-2 4-5-3 0-4 2-4 5Z" />
        </svg>
      )

    case 'workspace':
      return (
        <svg {...commonProps}>
          <path d="M3 18h18" />
          <path d="M6 18v-7h12v7" />
          <path d="M9 11V8h6v3" />
        </svg>
      )

    case 'bed':
      return (
        <svg {...commonProps}>
          <path d="M4 12h16v5H4z" />
          <path d="M4 17v3" />
          <path d="M20 17v3" />
          <path d="M7 12V9h4a2 2 0 0 1 2 2v1" />
        </svg>
      )

    default:
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
        </svg>
      )
  }
}

function AmenityRow({
  label,
  iconKey,
  iconUrl,
  isAvailable = true,
  isSidebar = false,
}: {
  label: string
  iconKey?: string | null
  iconUrl?: string | null
  isAvailable?: boolean
  isSidebar?: boolean
}) {
  return (
    <div
      className={`${
        isSidebar ? 'flex items-center gap-3' : 'flex items-center gap-4'
      } ${isAvailable ? 'text-slate-900' : 'text-slate-500'}`}
    >
      <div className="relative flex shrink-0 items-center justify-center">
        <AmenityIcon
          iconKey={iconKey}
          iconUrl={iconUrl}
          className={isSidebar ? 'h-5 w-5 object-contain' : 'h-6 w-6 object-contain'}
        />
        {!isAvailable && (
          <span className="pointer-events-none absolute left-[-3px] top-1/2 h-[2px] w-[calc(100%+6px)] -translate-y-1/2 rotate-[-18deg] bg-black" />
        )}
      </div>

      <div className="relative inline-block">
        <span className={isSidebar ? 'text-[15px] leading-6' : 'text-[18px] leading-7'}>
          {label}
        </span>
        {!isAvailable && (
          <span className="pointer-events-none absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-black" />
        )}
      </div>
    </div>
  )
}

export default function PropertyAmenitiesSection({
  isArabic,
  title,
  showAllLabel,
  items,
  showAllButtonClassName,
  sectionClassName,
  titleClassName,
  gridClassName,
  hideBottomBorder = false,
  variant = 'default',
}: Props) {
  const [open, setOpen] = useState(false)

  const cleanedItems = useMemo(() => {
    const map = new Map<string, AmenityItem>()

    for (const item of items) {
      const canonicalLabel = getCanonicalLabel(item)
      if (!canonicalLabel) continue

      const existing = map.get(canonicalLabel)
      const currentPrepared: AmenityItem = {
        ...item,
        icon_key: item.icon_url ? item.icon_key : resolveIconKey(item),
      }

      if (!existing) {
        map.set(canonicalLabel, currentPrepared)
        continue
      }

      const existingAvailable = existing.is_available !== false
      const currentAvailable = currentPrepared.is_available !== false

      if (currentAvailable && !existingAvailable) {
        map.set(canonicalLabel, currentPrepared)
        continue
      }

      if (currentAvailable === existingAvailable) {
        const existingOrder = existing.sort_order ?? 999999
        const currentOrder = currentPrepared.sort_order ?? 999999
        if (currentOrder < existingOrder) {
          map.set(canonicalLabel, currentPrepared)
        }
      }
    }

    return Array.from(map.values())
  }, [items])

  const orderedItems = useMemo(() => {
    return [...cleanedItems].sort((a, b) => {
      const categoryA = isArabic ? a.category_ar || 'أخرى' : a.category_en || 'Other'
      const categoryB = isArabic ? b.category_ar || 'أخرى' : b.category_en || 'Other'

      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB)
      }

      const aAvailable = a.is_available !== false ? 0 : 1
      const bAvailable = b.is_available !== false ? 0 : 1

      if (aAvailable !== bAvailable) {
        return aAvailable - bAvailable
      }

      const aOrder = a.sort_order ?? 0
      const bOrder = b.sort_order ?? 0
      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }

      const labelA = getDisplayLabel(a, isArabic)
      const labelB = getDisplayLabel(b, isArabic)
      return labelA.localeCompare(labelB)
    })
  }, [cleanedItems, isArabic])

  const availableItems = useMemo(() => {
    return orderedItems.filter((item) => item.is_available !== false)
  }, [orderedItems])

  const visibleItems = useMemo(() => {
    return variant === 'sidebar' ? availableItems.slice(0, 8) : availableItems.slice(0, 10)
  }, [availableItems, variant])

  const groupedItems = useMemo(() => {
    const grouped = new Map<string, AmenityItem[]>()

    orderedItems.forEach((item) => {
      const category = isArabic
        ? item.category_ar || 'أخرى'
        : item.category_en || 'Other'

      const existing = grouped.get(category) || []
      existing.push(item)
      grouped.set(category, existing)
    })

    return Array.from(grouped.entries())
  }, [orderedItems, isArabic])

  useEffect(() => {
    if (!open) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  if (!orderedItems.length) return null

  const isSidebar = variant === 'sidebar'

  const resolvedSectionClassName = sectionClassName
    ? sectionClassName
    : isSidebar
      ? 'overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)]'
      : `mt-8 ${hideBottomBorder ? '' : 'border-b border-slate-200 pb-8'}`

  const resolvedInnerWrapperClassName = isSidebar ? 'p-5 sm:p-6' : ''

  const resolvedTitleClassName = titleClassName
    ? titleClassName
    : isSidebar
      ? 'text-[22px] font-bold tracking-tight text-slate-950'
      : 'text-[24px] font-bold tracking-tight text-slate-950'

  const resolvedGridClassName = gridClassName
    ? gridClassName
    : isSidebar
      ? 'mt-5 grid grid-cols-1 gap-y-4'
      : 'mt-6 grid grid-cols-2 gap-x-8 gap-y-5'

  return (
    <>
      <section className={resolvedSectionClassName}>
        <div className={resolvedInnerWrapperClassName}>
          <h2 className={resolvedTitleClassName}>{title}</h2>

          <div className={resolvedGridClassName}>
            {visibleItems.map((item) => {
              const label = getDisplayLabel(item, isArabic)

              return (
                <AmenityRow
                  key={item.id}
                  label={label}
                  iconKey={item.icon_key}
                  iconUrl={item.icon_url}
                  isAvailable
                  isSidebar={isSidebar}
                />
              )
            })}
          </div>

          {orderedItems.length > visibleItems.length && (
            <div className={isSidebar ? 'mt-6' : 'mt-10'}>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className={
                  showAllButtonClassName ||
                  'inline-flex h-11 items-center justify-center rounded-[18px] bg-[#054aff] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(5,74,255,0.22)] transition hover:-translate-y-[1px] hover:bg-[#043be0]'
                }
              >
                {showAllLabel}
              </button>
            </div>
          )}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4 py-6">
          <div
            className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl"
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`absolute top-6 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 ${
                isArabic ? 'right-6' : 'left-6'
              }`}
              aria-label="Close"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <div className="max-h-[90vh] overflow-y-auto px-8 pb-10 pt-24 sm:px-10">
              <h2 className="text-[28px] font-bold tracking-tight text-slate-950">
                {title}
              </h2>

              <div className="mt-10 space-y-10">
                {groupedItems.map(([category, categoryItems]) => (
                  <div key={category}>
                    <h3 className="text-[20px] font-semibold text-slate-950">
                      {category}
                    </h3>

                    <div className="mt-6 divide-y divide-slate-200">
                      {categoryItems.map((item) => {
                        const label = getDisplayLabel(item, isArabic)

                        return (
                          <div key={item.id} className="py-6">
                            <AmenityRow
                              label={label}
                              iconKey={item.icon_key}
                              iconUrl={item.icon_url}
                              isAvailable={item.is_available !== false}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}