'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { ReactNode } from 'react'

type SupportedLanguage = 'en' | 'ar'
type SupportedCurrency =
  | 'EGP'
  | 'USD'
  | 'EUR'
  | 'BHD'
  | 'DZD'
  | 'IQD'
  | 'JOD'
  | 'KWD'
  | 'LBP'
  | 'LYD'
  | 'MAD'
  | 'OMR'
  | 'QAR'
  | 'SAR'
  | 'TND'

type ServiceAsset = {
  file_url?: string | null
  asset_type?: string | null
  sort_order?: number | null
}

type ProviderBusinessHour = {
  day_of_week: number
  is_open: boolean
  open_time?: string | null
  close_time?: string | null
}

type Restaurant = {
  id: string | number
  category_id: string | number
  city_id?: string | null
  primary_university_id?: string | null
  name_en: string
  name_ar?: string | null
  slug?: string | null
  short_description_en?: string | null
  short_description_ar?: string | null
  logo_url?: string | null
  cover_image_url?: string | null
  is_featured?: boolean | null
  is_active?: boolean | null
  discount_percentage?: number | null
  discount_title_en?: string | null
  discount_title_ar?: string | null
  is_manually_closed?: boolean | null
  manual_closed_note?: string | null
  provider_business_hours?: ProviderBusinessHour[] | null
  service_provider_assets?: ServiceAsset[] | null
}

type MenuCategory = {
  id: string | number
  restaurant_id: string | number
  name_en: string
  name_ar: string
  sort_order?: number | null
}

type MenuItemVariant = {
  id: string | number
  menu_item_id: string | number
  name_en: string
  name_ar?: string | null
  price?: number | null
  compare_at_price?: number | null
  sku?: string | null
  is_default?: boolean | null
  is_available?: boolean | null
  sort_order?: number | null
}

type MenuItem = {
  id: string | number
  restaurant_id: string | number
  menu_category_id: string | number
  name_en: string
  name_ar?: string | null
  description_en?: string | null
  description_ar?: string | null
  price?: number | null
  image_url?: string | null
  is_available?: boolean | null
  sort_order?: number | null
  restaurant_menu_item_variants?: MenuItemVariant[] | null
}

type DeliveryZone = {
  id: string | number
  restaurant_id: string | number
  area_name: string
  area_name_ar?: string | null
  delivery_fee: number
}

type CartItem = {
  cartKey: string
  item: MenuItem
  variant: MenuItemVariant | null
  quantity: number
}

const ITEMS_PER_PAGE = 20

function getRestaurantImage(restaurant: Restaurant) {
  if (restaurant.cover_image_url) return restaurant.cover_image_url
  if (restaurant.logo_url) return restaurant.logo_url

  const assets = [...(restaurant.service_provider_assets ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

  const preferred =
    assets.find((asset) => asset.asset_type === 'cover') ||
    assets.find((asset) => asset.asset_type === 'gallery') ||
    assets[0]

  return preferred?.file_url || null
}

function getCairoNowDate() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(new Date())
  const get = (type: string) => parts.find((part) => part.type === type)?.value || ''

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  return {
    dayOfWeek: weekdayMap[get('weekday')] ?? 0,
    hour: Number(get('hour') || '0'),
    minute: Number(get('minute') || '0'),
  }
}

function timeToMinutes(time?: string | null) {
  if (!time || !time.includes(':')) return null

  const [hours, minutes] = time.split(':')
  const h = Number(hours)
  const m = Number(minutes)

  if (Number.isNaN(h) || Number.isNaN(m)) return null

  return h * 60 + m
}

function isRestaurantClosedNow(restaurant: Restaurant) {
  if (restaurant.is_manually_closed) {
    return true
  }

  const businessHours = Array.isArray(restaurant.provider_business_hours)
    ? restaurant.provider_business_hours
    : []

  if (businessHours.length === 0) {
    return false
  }

  const now = getCairoNowDate()
  const currentMinutes = now.hour * 60 + now.minute
  const todayRow = businessHours.find(
    (row) => Number(row.day_of_week) === Number(now.dayOfWeek)
  )

  if (!todayRow) {
    return true
  }

  if (!todayRow.is_open) {
    return true
  }

  const openMinutes = timeToMinutes(todayRow.open_time)
  const closeMinutes = timeToMinutes(todayRow.close_time)

  if (openMinutes == null || closeMinutes == null) {
    return true
  }

  if (openMinutes === closeMinutes) {
    return false
  }

  if (closeMinutes > openMinutes) {
    return !(currentMinutes >= openMinutes && currentMinutes < closeMinutes)
  }

  return !(currentMinutes >= openMinutes || currentMinutes < closeMinutes)
}

function getDiscountPercent(
  itemPrice?: number | null,
  restaurantDiscount?: number | null
) {
  if (restaurantDiscount && restaurantDiscount > 0) return restaurantDiscount
  if (!itemPrice) return null
  return null
}

function buildQueryString(params: Record<string, string | undefined | null>) {
  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') search.set(key, value)
  })

  return search.toString()
}

function getAvailableVariants(item: MenuItem) {
  return (item.restaurant_menu_item_variants ?? []).filter(
    (variant) => variant.is_available !== false
  )
}

function getDefaultVariant(item: MenuItem) {
  const variants = getAvailableVariants(item)
  if (variants.length === 0) return null
  return (
    variants.find((variant) => variant.is_default) ||
    [...variants].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]
  )
}

function getItemDisplayPrice(item: MenuItem) {
  const variants = getAvailableVariants(item)
  if (variants.length > 0) {
    return Math.min(...variants.map((variant) => Number(variant.price) || 0))
  }
  return Number(item.price) || 0
}

function getItemSelectedPrice(item: MenuItem, variant: MenuItemVariant | null) {
  if (variant) return Number(variant.price) || 0
  return Number(item.price) || 0
}

function getCompareAtPrice(
  item: MenuItem,
  variant: MenuItemVariant | null,
  restaurantDiscount?: number | null
) {
  const selectedPrice = getItemSelectedPrice(item, variant)

  const oldPriceFromVariant =
    variant?.compare_at_price != null ? Number(variant.compare_at_price) : null

  if (oldPriceFromVariant && oldPriceFromVariant > selectedPrice) {
    return oldPriceFromVariant
  }

  const discountPercent = getDiscountPercent(selectedPrice, restaurantDiscount)

  if (discountPercent && selectedPrice > 0) {
    const calculatedOldPrice = selectedPrice / (1 - Number(discountPercent) / 100)
    if (calculatedOldPrice > selectedPrice) return calculatedOldPrice
  }

  return null
}

function getCartKey(itemId: string | number, variantId?: string | number | null) {
  return `${itemId}__${variantId ?? 'base'}`
}

export default function RestaurantDetailsClient({
  restaurant,
  menuCategories,
  menuItems,
  deliveryZones,
  selectedLanguage,
  selectedCurrency,
  searchState,
  translations,
}: {
  restaurant: Restaurant
  menuCategories: MenuCategory[]
  menuItems: MenuItem[]
  deliveryZones: DeliveryZone[]
  selectedLanguage: SupportedLanguage
  selectedCurrency: SupportedCurrency
  searchState: {
    city_id?: string
    university_id?: string
    category_id?: string
    page?: string
  }
  translations: any
}) {
  const t = translations[selectedLanguage]
  const isArabic = selectedLanguage === 'ar'
  const currentPage = Math.max(1, Number(searchState.page || '1') || 1)
  const isClosedNow = isRestaurantClosedNow(restaurant)

  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    deliveryZones[0] ? String(deliveryZones[0].id) : ''
  )
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {}
    for (const item of menuItems) {
      const defaultVariant = getDefaultVariant(item)
      initial[String(item.id)] = defaultVariant ? String(defaultVariant.id) : null
    }
    return initial
  })

  const restaurantName =
    selectedLanguage === 'ar'
      ? restaurant.name_ar || restaurant.name_en
      : restaurant.name_en || restaurant.name_ar || ''

  const restaurantDescription =
    selectedLanguage === 'ar'
      ? restaurant.short_description_ar || restaurant.short_description_en || ''
      : restaurant.short_description_en || restaurant.short_description_ar || ''

  const formatPrice = (value?: number | null) => {
    const currencyLabel = selectedCurrency === 'EGP' ? t.currency : selectedCurrency
    if (value == null) return `${currencyLabel} 0.00`
    return `${currencyLabel} ${Number(value).toFixed(2)}`
  }

  const groupedCategories = menuCategories
    .map((category) => ({
      ...category,
      items: menuItems.filter(
        (item) => String(item.menu_category_id) === String(category.id)
      ),
    }))
    .filter((category) => category.items.length > 0)

  const allItems = groupedCategories.flatMap((category) => category.items)

  const selectedCategory =
    searchState.category_id != null
      ? groupedCategories.find(
          (category) => String(category.id) === String(searchState.category_id)
        ) || null
      : null

  const filteredItems = selectedCategory ? selectedCategory.items : allItems
  const visibleItems = filteredItems.slice(0, currentPage * ITEMS_PER_PAGE)
  const hasMoreItems = visibleItems.length < filteredItems.length

  const pageTitle = selectedCategory
    ? selectedLanguage === 'ar'
      ? selectedCategory.name_ar
      : selectedCategory.name_en
    : t.all

  const selectedZone = deliveryZones.find(
    (zone) => String(zone.id) === selectedZoneId
  )

  const subtotal = cart.reduce((sum, cartItem) => {
    return sum + getItemSelectedPrice(cartItem.item, cartItem.variant) * cartItem.quantity
  }, 0)

  const subtotalBeforeDiscount = cart.reduce((sum, cartItem) => {
    const oldPrice = getCompareAtPrice(
      cartItem.item,
      cartItem.variant,
      restaurant.discount_percentage
    )

    const unitPrice = oldPrice ?? getItemSelectedPrice(cartItem.item, cartItem.variant)
    return sum + unitPrice * cartItem.quantity
  }, 0)

  const totalDiscount = Math.max(0, subtotalBeforeDiscount - subtotal)

  const deliveryFee = selectedZone ? Number(selectedZone.delivery_fee || 0) : 0
  const total = subtotal + deliveryFee
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const baseFilterParams = {
    lang: selectedLanguage,
    currency: selectedCurrency,
    city_id: searchState.city_id,
    university_id: searchState.university_id,
  }

  const showMoreHref = `?${buildQueryString({
    ...baseFilterParams,
    category_id: selectedCategory ? String(selectedCategory.id) : undefined,
    page: String(currentPage + 1),
  })}`

  const setVariantForItem = (
    itemId: string | number,
    variantId: string | number | null
  ) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [String(itemId)]: variantId == null ? null : String(variantId),
    }))
  }

  const getSelectedVariantForItem = (item: MenuItem) => {
    const selectedVariantId = selectedVariants[String(item.id)]
    const variants = getAvailableVariants(item)

    if (!selectedVariantId) return null

    return (
      variants.find(
        (variant) => String(variant.id) === String(selectedVariantId)
      ) || null
    )
  }

  const addToCart = (item: MenuItem) => {
    if (isClosedNow) {
      setSubmitMessage(
        restaurant.is_manually_closed
          ? t.temporarilyClosed || t.closedNow
          : t.closedNow
      )
      return
    }

    const selectedVariant = getSelectedVariantForItem(item)
    const cartKey = getCartKey(item.id, selectedVariant?.id)

    setCart((prev) => {
      const existing = prev.find((p) => p.cartKey === cartKey)
      if (existing) {
        return prev.map((p) =>
          p.cartKey === cartKey ? { ...p, quantity: p.quantity + 1 } : p
        )
      }

      return [
        ...prev,
        {
          cartKey,
          item,
          variant: selectedVariant,
          quantity: 1,
        },
      ]
    })
  }

  const increaseQty = (cartKey: string) => {
    if (isClosedNow) {
      setSubmitMessage(
        restaurant.is_manually_closed
          ? t.temporarilyClosed || t.closedNow
          : t.closedNow
      )
      return
    }

    setCart((prev) =>
      prev.map((p) =>
        p.cartKey === cartKey ? { ...p, quantity: p.quantity + 1 } : p
      )
    )
  }

  const decreaseQty = (cartKey: string) => {
    setCart((prev) =>
      prev
        .map((p) =>
          p.cartKey === cartKey ? { ...p, quantity: p.quantity - 1 } : p
        )
        .filter((p) => p.quantity > 0)
    )
  }

  const getItemQty = (item: MenuItem) => {
    const selectedVariant = getSelectedVariantForItem(item)
    const cartKey = getCartKey(item.id, selectedVariant?.id)
    return cart.find((p) => p.cartKey === cartKey)?.quantity || 0
  }

  const submitOrder = async () => {
    setSubmitMessage('')

    if (isClosedNow) {
      setSubmitMessage(
        restaurant.is_manually_closed
          ? t.temporarilyClosed || t.closedNow
          : t.closedNow
      )
      return
    }

    if (
      !customerName ||
      !customerPhone ||
      !customerAddress ||
      !selectedZoneId ||
      cart.length === 0
    ) {
      setSubmitMessage(t.requiredFields)
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch('/api/restaurants/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          area_id: selectedZoneId,
          area_name:
            selectedLanguage === 'ar'
              ? selectedZone?.area_name_ar || selectedZone?.area_name || ''
              : selectedZone?.area_name || '',
          delivery_fee: deliveryFee,
          subtotal,
          total_amount: total,
          notes,
          items: cart.map((cartItem) => ({
            menu_item_id: cartItem.item.id,
            menu_item_variant_id: cartItem.variant?.id ?? null,
            item_name_en: cartItem.item.name_en,
            item_name_ar: cartItem.item.name_ar,
            variant_name_en: cartItem.variant?.name_en ?? null,
            variant_name_ar: cartItem.variant?.name_ar ?? null,
            quantity: cartItem.quantity,
            unit_price: getItemSelectedPrice(cartItem.item, cartItem.variant),
            total_price:
              getItemSelectedPrice(cartItem.item, cartItem.variant) *
              cartItem.quantity,
          })),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to submit order')
      }

      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setCustomerAddress('')
      setNotes('')
      setSubmitMessage(t.orderPlaced)
    } catch (error: any) {
      setSubmitMessage(error?.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderTopNavItem = ({
    href,
    label,
    icon,
    isActive = false,
    isMobile = false,
  }: {
    href: string
    label: string
    icon: ReactNode
    isActive?: boolean
    isMobile?: boolean
  }) => (
    <Link
      href={href}
      className={`group relative flex items-center transition shrink-0 ${
        isMobile ? 'flex-col pb-3 px-1' : 'flex-row gap-2 px-3 pt-2 pb-1'
      } ${isActive ? 'text-[#222222]' : 'text-[#6A6A6A] hover:text-[#222222]'}`}
    >
      <span className="flex shrink-0 items-center justify-center">{icon}</span>

      <span
        className={`font-sans font-semibold tracking-tight leading-none ${
          isActive ? 'text-[#222222]' : 'text-inherit'
        } ${isMobile ? 'text-[14px]' : 'text-[18px]'}`}
      >
        {label}
      </span>

      {!isMobile && isActive && (
        <div className="absolute -bottom-[2px] left-0 right-0 h-[3px] bg-[#222222] rounded-full" />
      )}

      {isMobile && isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black w-full" />
      )}
    </Link>
  )

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="relative min-h-screen bg-[#f3f5f9] pb-28 text-[#222] md:pb-0"
    >
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm md:static md:bg-[#f7f7f7] md:shadow-none">
        <div className="hidden md:block mx-auto max-w-[1920px] px-6"></div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#5583fb] via-[#4e79ea] to-[#3d63d8]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.10),transparent_24%)]" />
        <div className="relative mx-auto max-w-[1240px] px-4 pb-10 pt-6 md:px-6 md:pb-12">
          <div className="mt-2 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="flex items-center gap-5">
              <div className="relative flex h-[132px] w-[132px] shrink-0 items-center justify-center overflow-hidden rounded-[28px] border border-white/20 bg-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm">
  {restaurant.logo_url ? (
    <img
      src={restaurant.logo_url}
      alt={restaurantName}
      className={`h-full w-full object-cover ${
        isClosedNow ? 'brightness-[0.72]' : ''
      }`}
    />
  ) : (
    <div className="px-4 text-center text-[26px] font-extrabold leading-none text-white">
      {restaurantName}
    </div>
  )}

  {isClosedNow ? (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="inline-flex items-center rounded-full bg-white px-6 py-3 text-[14px] font-bold text-[#1f2937] shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
        {restaurant.is_manually_closed
          ? t.temporarilyClosed || t.closedNow
          : t.closedNow}
      </span>
    </div>
  ) : null}
</div>
              <div className="flex min-h-[132px] items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-[28px] font-extrabold tracking-tight text-white md:text-[34px]">
                      {restaurantName}
                    </h1>
                  </div>

                  {restaurantDescription ? (
                    <p className="mt-2 max-w-[620px] text-[15px] leading-7 text-white/90">
                      {restaurantDescription}
                    </p>
                  ) : null}

                  {isClosedNow && restaurant.manual_closed_note ? (
                    <p className="mt-3 max-w-[620px] text-[14px] leading-7 text-white/90">
                      {restaurant.manual_closed_note}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-[16px] text-white shadow-sm backdrop-blur-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                  width="22"
                  height="22"
                  fill="currentColor"
                >
                  <path d="M280 80C266.7 80 256 90.7 256 104C256 117.3 266.7 128 280 128L336.6 128L359.1 176.7L264 248C230.6 222.9 189 208 144 208L88 208C74.7 208 64 218.7 64 232C64 245.3 74.7 256 88 256L144 256C222.5 256 287.2 315.6 295.2 392L269.8 392C258.6 332.8 206.5 288 144 288C73.3 288 16 345.3 16 416C16 486.7 73.3 544 144 544C206.5 544 258.5 499.2 269.8 440L320 440C333.3 440 344 429.3 344 416L344 393.5C344 348.4 369.7 308.1 409.5 285.8L421.6 311.9C389.2 335.1 368.1 373.1 368.1 416C368.1 486.7 425.4 544 496.1 544C566.8 544 624.1 486.7 624.1 416C624.1 345.3 566.8 288 496.1 288C485.4 288 475.1 289.3 465.2 291.8L433.8 224L488 224C501.3 224 512 213.3 512 200L512 152C512 138.7 501.3 128 488 128L434.7 128C427.8 128 421 130.2 415.5 134.4L398.4 147.2L373.8 93.9C369.9 85.4 361.4 80 352 80L280 80z" />
                </svg>
                <span>{formatPrice(deliveryFee)}</span>
              </div>

              <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-[16px] text-white shadow-sm backdrop-blur-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                  width="22"
                  height="22"
                  fill="currentColor"
                >
                  <path d="M24 48C10.7 48 0 58.7 0 72C0 85.3 10.7 96 24 96L69.3 96C73.2 96 76.5 98.8 77.2 102.6L129.3 388.9C135.5 423.1 165.3 448 200.1 448L456 448C469.3 448 480 437.3 480 424C480 410.7 469.3 400 456 400L200.1 400C188.5 400 178.6 391.7 176.5 380.3L171.4 352L475 352C505.8 352 532.2 330.1 537.9 299.8L568.9 133.9C572.6 114.2 557.5 96 537.4 96L124.7 96L124.3 94C119.5 67.4 96.3 48 69.2 48L24 48zM208 576C234.5 576 256 554.5 256 528C256 501.5 234.5 480 208 480C181.5 480 160 501.5 160 528C160 554.5 181.5 576 208 576zM432 576C458.5 576 480 554.5 480 528C480 501.5 458.5 480 432 480C405.5 480 384 501.5 384 528C384 554.5 405.5 576 432 576z" />
                </svg>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1380px] px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_minmax(0,1fr)_360px]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <h2 className="text-[28px] font-medium tracking-tight text-[#111827]">
              {t.categories}
            </h2>

            <div className="mt-8 overflow-hidden rounded-3xl border border-white bg-white/90 shadow-[0_14px_35px_rgba(15,23,42,0.06)] backdrop-blur-sm">
              <Link
                href={`?${buildQueryString({
                  ...baseFilterParams,
                  page: '1',
                })}`}
                className={`block border-b border-[#eef1f5] px-5 py-4 text-[18px] font-medium transition ${
                  !selectedCategory
                    ? 'bg-[#f5f8ff] text-[#5583fb]'
                    : 'text-[#222] hover:bg-[#f8fafc] hover:text-[#5583fb]'
                }`}
              >
                {t.all}
              </Link>

              {groupedCategories.map((category) => {
                const categoryName =
                  selectedLanguage === 'ar' ? category.name_ar : category.name_en

                const isActive =
                  selectedCategory &&
                  String(selectedCategory.id) === String(category.id)

                return (
                  <Link
                    key={String(category.id)}
                    href={`?${buildQueryString({
                      ...baseFilterParams,
                      category_id: String(category.id),
                      page: '1',
                    })}`}
                    className={`block border-b border-[#eef1f5] px-5 py-4 text-[18px] font-medium transition last:border-b-0 ${
                      isActive
                        ? 'bg-[#f5f8ff] text-[#5583fb]'
                        : 'text-[#222] hover:bg-[#f8fafc] hover:text-[#5583fb]'
                    }`}
                  >
                    {categoryName}
                  </Link>
                )
              })}
            </div>
          </aside>

          <div>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-[32px] font-medium tracking-tight text-[#111827]">
                {pageTitle}
              </h2>
            </div>

            {visibleItems.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleItems.map((item) => {
                    const itemName =
                      selectedLanguage === 'ar'
                        ? item.name_ar || item.name_en
                        : item.name_en || item.name_ar || ''

                    const itemDescription =
                      selectedLanguage === 'ar'
                        ? item.description_ar || item.description_en || ''
                        : item.description_en || item.description_ar || ''

                    const isAvailable = !isClosedNow && item.is_available !== false
                    const availableVariants = getAvailableVariants(item)
                    const selectedVariant = getSelectedVariantForItem(item)
                    const displayPrice = getItemSelectedPrice(item, selectedVariant)
                    const basePrice = getItemDisplayPrice(item)
                    const discountPercent = getDiscountPercent(
                      displayPrice,
                      restaurant.discount_percentage
                    )

                    const oldPriceFromVariant =
                      selectedVariant?.compare_at_price != null
                        ? Number(selectedVariant.compare_at_price)
                        : null

                    const oldPriceCalculated =
                      discountPercent && displayPrice
                        ? displayPrice / (1 - Number(discountPercent) / 100)
                        : null

                    const oldPrice = oldPriceFromVariant || oldPriceCalculated
                    const qty = getItemQty(item)

                    return (
                      <article
                        key={String(item.id)}
                        className="group h-full"
                      >
                        <div className="flex h-full flex-col">
                          <div className="relative">
                            <div className="relative overflow-visible rounded-[18px] bg-transparent">
                              {discountPercent ? (
                                <div className="absolute left-3 top-3 z-20 rounded-full bg-[#d9ea70] px-3 py-1.5 text-[12px] font-medium text-[#26320e]">
                                  {t.save} {discountPercent}%
                                </div>
                              ) : null}

                              <div className="relative aspect-[1/1] w-full">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={itemName}
                                    className={`h-full w-full object-contain transition duration-300 group-hover:scale-[1.03] ${
                                      isClosedNow ? 'opacity-60' : ''
                                    }`}
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <div className="text-sm text-[#94a3b8]">
                                      {itemName}
                                    </div>
                                  </div>
                                )}

                              </div>

                              {isAvailable ? (
                                qty === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => addToCart(item)}
                                    className="absolute bottom-3 right-3 z-20 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white text-[42px] font-light leading-none text-[#054aff] shadow-[0_4px_14px_rgba(0,0,0,0.14)] transition hover:scale-105"
                                    aria-label={t.add}
                                  >
                                    +
                                  </button>
                                ) : (
                                  <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 rounded-full bg-white px-2 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.14)]">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        decreaseQty(
                                          getCartKey(item.id, selectedVariant?.id)
                                        )
                                      }
                                      className="flex h-9 w-9 items-center justify-center rounded-full text-[24px] leading-none text-[#054aff]"
                                    >
                                      -
                                    </button>

                                    <span className="min-w-[18px] text-center text-[15px] font-semibold text-[#222]">
                                      {qty}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        increaseQty(
                                          getCartKey(item.id, selectedVariant?.id)
                                        )
                                      }
                                      className="flex h-9 w-9 items-center justify-center rounded-full text-[24px] leading-none text-[#054aff]"
                                    >
                                      +
                                    </button>
                                  </div>
                                )
                              ) : !isClosedNow ? (
                                <div className="absolute bottom-3 right-3 z-20 rounded-full bg-white px-4 py-2 text-[12px] font-medium text-[#054aff] shadow-[0_4px_14px_rgba(0,0,0,0.14)]">
                                  {t.unavailable}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="pt-4">
                            <h3 className="line-clamp-2 text-[17px] font-medium leading-8 text-[#111827]">
                              {itemName}
                            </h3>

                            {availableVariants.length > 0 ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {availableVariants.map((variant) => {
                                  const variantName =
                                    selectedLanguage === 'ar'
                                      ? variant.name_ar || variant.name_en
                                      : variant.name_en || variant.name_ar || ''

                                  const isVariantSelected =
                                    String(selectedVariant?.id) ===
                                    String(variant.id)

                                  return (
                                    <button
                                      key={String(variant.id)}
                                      type="button"
                                      disabled={isClosedNow}
                                      onClick={() =>
                                        setVariantForItem(item.id, variant.id)
                                      }
                                      className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                                        isVariantSelected
                                          ? 'border-[#054aff] bg-[#00000] text-[#054aff]'
                                          : 'border-[#e5e7eb] bg-white text-[#475569] hover:border-[#054aff] hover:text-[#054aff]'
                                      } ${isClosedNow ? 'cursor-not-allowed opacity-60' : ''}`}
                                    >
                                      {variantName}
                                    </button>
                                  )
                                })}
                              </div>
                            ) : null}
                                                        <div className="mt-3">
                              <div className="text-[15px] font-medium text-[#111827]">
                                {formatPrice(displayPrice)}
                              </div>

                              {oldPrice ? (
                                <div className="mt-1 text-[14px] text-[#8c8c8c] line-through">
                                  {formatPrice(oldPrice)}
                                </div>
                              ) : availableVariants.length > 0 &&
                                selectedVariant == null ? (
                                <div className="mt-1 text-[12px] text-[#64748b]">
                                  {t.basePrice} {formatPrice(basePrice)}
                                </div>
                              ) : null}
                            </div>

                            {itemDescription ? (
                              <p className="mt-2 line-clamp-2 text-[12px] leading-6 text-[#8a8f98]">
                                {itemDescription}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>

                {hasMoreItems ? (
                  <div className="mt-12 flex justify-center">
                    <Link
                      href={showMoreHref}
                      className="inline-flex items-center justify-center rounded-full border border-[#dbe3ef] bg-white px-9 py-4 text-[16px] font-medium text-[#222] shadow-sm transition hover:bg-[#fafcff]"
                    >
                      {t.showMore}
                    </Link>
                  </div>
                ) : null}
              </>
            ) : (
              <section className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900">{t.noMenu}</h2>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="space-y-6 rounded-3xl border border-[#edf1f7] bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t.customerInfo}</h3>
                <div className="mt-4 space-y-3">
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t.fullName}
                    disabled={isClosedNow}
                    className={`w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#5583fb] ${
                      isClosedNow ? 'cursor-not-allowed bg-gray-100 text-gray-400' : ''
                    }`}
                  />
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder={t.phone}
                    disabled={isClosedNow}
                    className={`w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#5583fb] ${
                      isClosedNow ? 'cursor-not-allowed bg-gray-100 text-gray-400' : ''
                    }`}
                  />
                  <textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder={t.address}
                    rows={3}
                    disabled={isClosedNow}
                    className={`w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#5583fb] ${
                      isClosedNow ? 'cursor-not-allowed bg-gray-100 text-gray-400' : ''
                    }`}
                  />
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    disabled={isClosedNow}
                    className={`w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#5583fb] ${
                      isClosedNow ? 'cursor-not-allowed bg-gray-100 text-gray-400' : ''
                    }`}
                  >
                    <option value="">{t.chooseArea}</option>
                    {deliveryZones.map((zone) => (
                      <option key={String(zone.id)} value={String(zone.id)}>
                        {selectedLanguage === 'ar'
                          ? zone.area_name_ar || zone.area_name
                          : zone.area_name}{' '}
                        - {formatPrice(zone.delivery_fee)}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t.additionalNotes}
                    rows={3}
                    disabled={isClosedNow}
                    className={`w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#5583fb] ${
                      isClosedNow ? 'cursor-not-allowed bg-gray-100 text-gray-400' : ''
                    }`}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900">{t.cartSummary}</h3>

                <div className="mt-4 space-y-3">
                  {cart.length === 0 ? (
                    <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">
                      {t.emptyCart}
                    </div>
                  ) : (
                    cart.map((cartItem) => {
                      const itemName =
                        selectedLanguage === 'ar'
                          ? cartItem.item.name_ar || cartItem.item.name_en
                          : cartItem.item.name_en || cartItem.item.name_ar || ''

                      const variantName = cartItem.variant
                        ? selectedLanguage === 'ar'
                          ? cartItem.variant.name_ar || cartItem.variant.name_en
                          : cartItem.variant.name_en ||
                            cartItem.variant.name_ar ||
                            ''
                        : ''

                      const currentPrice = getItemSelectedPrice(
                        cartItem.item,
                        cartItem.variant
                      )

                      const oldPrice = getCompareAtPrice(
                        cartItem.item,
                        cartItem.variant,
                        restaurant.discount_percentage
                      )

                      return (
                        <div
                          key={cartItem.cartKey}
                          className="rounded-2xl border border-gray-100 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900">
                                {itemName}
                              </div>

                              {cartItem.variant ? (
                                <div className="mt-1 text-sm text-[#5583fb]">
                                  {t.selectedSize}: {variantName}
                                </div>
                              ) : null}

                              <div className="mt-1">
                                <div className="text-sm font-semibold text-gray-900">
                                  {formatPrice(currentPrice)}
                                </div>

                                {oldPrice ? (
                                  <div className="text-xs text-gray-400 line-through">
                                    {formatPrice(oldPrice)}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-full border border-gray-200 px-3 py-1">
                              <button
                                type="button"
                                onClick={() => decreaseQty(cartItem.cartKey)}
                                className="text-lg font-bold text-[#5583fb]"
                              >
                                -
                              </button>
                              <span className="min-w-5 text-center font-semibold">
                                {cartItem.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => increaseQty(cartItem.cartKey)}
                                disabled={isClosedNow}
                                className={`text-lg font-bold text-[#5583fb] ${
                                  isClosedNow ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
                  {subtotalBeforeDiscount > subtotal ? (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Subtotal before discount</span>
                      <span className="line-through">
                        {formatPrice(subtotalBeforeDiscount)}
                      </span>
                    </div>
                  ) : null}

                  {totalDiscount > 0 ? (
                    <div className="flex items-center justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>- {formatPrice(totalDiscount)}</span>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{t.subtotal}</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{t.deliveryFee}</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>

                  <div className="flex items-center justify-between text-base font-bold text-gray-900">
                    <span>{t.total}</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {submitMessage ? (
                  <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    {submitMessage}
                  </div>
                ) : null}

                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3 rounded-full bg-gradient-to-r from-[#5b8cff] to-[#4f7df3] px-4 py-3 text-white shadow-[0_12px_30px_rgba(85,131,251,0.28)]">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white/80">
                        {cartItemsCount} {t.items}
                      </div>
                      <div className="text-base font-bold">{formatPrice(total)}</div>
                    </div>

                    <button
                      type="button"
                      onClick={submitOrder}
                      disabled={isSubmitting || cart.length === 0 || isClosedNow}
                      className="inline-flex shrink-0 items-center justify-center rounded-full bg-white/12 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isClosedNow
                        ? t.closedNow
                        : isSubmitting
                        ? t.loading
                        : t.placeOrder}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}