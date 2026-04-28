import Link from 'next/link'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { Squada_One } from 'next/font/google'
import { createClient } from '../../../src/lib/supabase/server'
import PropertiesHeader from '../PropertiesHeader'
import DesktopPropertyGallery from './DesktopPropertyGallery'
import MobilePropertySlider from './MobilePropertySlider'
import PropertyAmenitiesSection from './PropertyAmenitiesSection'
import PropertyEnquireButton from './PropertyEnquireButton'

const squadaOne = Squada_One({
  subsets: ['latin'],
  weight: '400',
})

const LOCATION_PIN_ICON_URL =
  'https://i.ibb.co/Q3Pg7tkH/3d-blue-location-pin-icon-design-element-digital-map-navigation-marker-symbol.png'

const BROKER_CARD_FRONT_IMAGE =
  'https://i.ibb.co/tWJsRpw/Avery-Davis-2.png'

const BROKER_CARD_BACK_IMAGE =
  'https://i.ibb.co/hJgSfrJC/Avery-Davis.png'

type SearchParams = {
  rental_duration?: string
  city_id?: string
  university_id?: string
  price_range?: string
  lang?: string
  currency?: string
}

type City = {
  id: string | number
  name_en: string
  name_ar: string
}

type University = {
  id: string | number
  name_en: string
  name_ar: string
  city_id: string | number
}

type PropertyImage = {
  image_url: string
  is_cover?: boolean
  sort_order: number
}

type Broker = {
  full_name?: string | null
  company_name?: string | null
  phone_number?: string | null
  whatsapp_number?: string | null
  email?: string | null
  image_url?: string | null
}

type RoomBed = {
  id: string
  status?:
    | 'available'
    | 'reserved'
    | 'occupied'
    | 'maintenance'
    | 'inactive'
    | null
}

type PropertyRoomSellableOption = {
  id: string
  code?: string | null
  name_en?: string | null
  name_ar?: string | null
  pricing_mode?: 'per_person' | 'per_room' | null
  price_egp?: number | string | null
  consumes_beds_count?: number | null
  occupancy_size?: number | null
  is_exclusive?: boolean | null
  is_active?: boolean | null
  sort_order?: number | null
}

type PropertySellableOption = {
  id: string
  code?: string | null
  option_code?: string | null
  name_en?: string | null
  name_ar?: string | null
  sell_mode?: 'entire_property' | 'entire_room' | 'bed' | null
  pricing_mode?: 'per_person' | 'per_room' | null
  price_egp?: number | string | null
  is_active?: boolean | null
  sort_order?: number | null
}

type PropertyRoom = {
  id: string
  room_name?: string | null
  room_name_ar?: string | null
  room_type?: 'single' | 'double' | 'triple' | 'quad' | 'custom' | null
  base_price_egp?: number | string | null
  status?:
    | 'available'
    | 'partially_reserved'
    | 'fully_reserved'
    | 'inactive'
    | null
  private_bathroom?: boolean | null
  sort_order?: number | null
  room_beds?: RoomBed[]
  room_sellable_options?: PropertyRoomSellableOption[]
}

type PropertyReservation = {
  id: string
  reservation_scope?: 'entire_property' | 'entire_room' | 'beds' | null
  status?:
    | 'pending'
    | 'reserved'
    | 'checked_in'
    | 'completed'
    | 'cancelled'
    | null
  room_sellable_option_id?: string | null
}

type Property = {
  id: string
  property_id: string
  title_en?: string | null
  title_ar?: string | null
  address_en?: string | null
  address_ar?: string | null
  broker_id?: string | null
  university_id?: string | null
  price_egp?: number | string | null
  rental_duration?: 'daily' | 'monthly' | null
  availability_status?:
    | 'available'
    | 'partially_reserved'
    | 'fully_reserved'
    | 'inactive'
    | null
  bedrooms_count?: number | null
  bathrooms_count?: number | null
  beds_count?: number | null
  guests_count?: number | null
  property_images?: PropertyImage[]
}

type SimilarProperty = {
  id: string
  property_id: string
  title_en?: string | null
  title_ar?: string | null
  address_en?: string | null
  address_ar?: string | null
  university_id?: string | null
  price_egp?: number | string | null
  rental_duration?: 'daily' | 'monthly' | null
  property_images?: PropertyImage[]
}

type PropertyOfferItem = {
  id: string
  name_en?: string | null
  name_ar?: string | null
  icon_key?: string | null
  icon_url?: string | null
  category_en?: string | null
  category_ar?: string | null
  sort_order?: number | null
  is_available: boolean
}

type OptionCode =
  | 'triple_room'
  | 'double_room'
  | 'single_room'
  | 'full_apartment'

type DisplayOption = {
  code: OptionCode
  label: string
  price: number | null
  isBooked: boolean
}

type RoomOccupancyState = {
  roomId: string
  lockedMode: 'single_room' | 'double_room' | 'triple_room' | null
  activeReservationsCount: number
  maxCapacity: number
  hasAvailability: boolean
  blocksEntireProperty: boolean
}

type MenuFooterLink = {
  label: string
  href: string
  isEmail?: boolean
}

const SUPPORTED_CURRENCIES = [
  'EGP',
  'USD',
  'EUR',
  'BHD',
  'DZD',
  'IQD',
  'JOD',
  'KWD',
  'LBP',
  'LYD',
  'MAD',
  'OMR',
  'QAR',
  'SAR',
  'TND',
] as const

type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]
type SupportedLanguage = 'en' | 'ar'

const TRANSLATIONS = {
  en: {
    homes: 'Homes',
    services: 'Services',
    career: 'Career',
    lost: 'Lost',
    marketplace: 'MarketPlace',
    language: 'Language',
    currency: 'Currency',
    english: 'English',
    arabic: 'العربية',
    noImages: 'No images found for this property.',
    showAllPhotos: 'Show all photos',
    brokerCardTitle: 'Contact your broker',
    callNow: 'Call now',
    whatsappNow: 'WhatsApp now',
    emailNow: 'Send email',
    phone: 'Phone',
    whatsapp: 'WhatsApp',
    notAvailable: 'Not available',
    similarProperties: 'Similar Properties',
    viewAll: 'View All',
    from: 'From',
    perMonth: '/month',
    perDay: '/day',
    rooms: 'Rooms',
    availableRooms: 'Available Rooms',
    enquire: 'Enquire',
    booked: 'Booked',
    noRooms: 'No rooms available for this property.',
    apartmentDetails: 'Apartment details',
    bedroomsCount: 'Bedrooms',
    bathroomsCount: 'Bathrooms',
    bedsCount: 'Beds',
    guestsCount: 'Guests',
    guest: 'guest',
    guests: 'guests',
    bedroom: 'bedroom',
    bedrooms: 'bedrooms',
    bed: 'bed',
    beds: 'beds',
    bath: 'bath',
    baths: 'baths',
    whatThisPlaceOffers: 'What this place offers',
    showAllAmenities: 'Show all amenities',
    roomStatusAvailable: 'Available',
    roomStatusPartial: 'Partially reserved',
    roomStatusFull: 'Fully reserved',
    roomStatusInactive: 'Inactive',
    reserved: 'Reserved',
    totalBeds: 'Total beds',
    availableBeds: 'Available beds',
    reservedBeds: 'Reserved beds',
    occupiedBeds: 'Occupied beds',
    privateBathroom: 'Private bathroom',
    sharedBathroom: 'Shared bathroom',
    availability: 'Availability',
    propertyId: 'Property ID',
    fullApartment: 'Full Apartment',
    tripleRoom: 'Triple Room',
    doubleRoom: 'Double Room',
    singleRoom: 'Single Room',
    stayOptions: 'Available Options',
    city: 'City',
    university: 'University',
    duration: 'Duration',
    searchCities: 'Search cities',
    chooseUniversity: 'Choose university',
    chooseDuration: 'Choose duration',
    selectCity: 'Select city',
    selectUniversity: 'Select university',
    selectDuration: 'Select duration',
    anyCity: 'Any city',
    anyUniversity: 'Any university',
    anyDuration: 'Any duration',
    daily: 'Daily',
    monthly: 'Monthly',
    startSearch: 'Start your search',
    pricesIncludeFees: 'Prices include all fees',
    help: 'Contact Us',
    signUp: 'Sign up',
    logIn: 'Log in',
    close: 'Close',
    login: 'Log in or sign up',
    join: 'Community',
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedIn: 'LinkedIn',
    footerTitle: 'Find your way to better student living',
    quickLinks: 'Quick Links',
    aboutUs: 'About us',
    board: 'Board',
    contact: 'Contact',
    contactUs: 'Contact Us',
    footerEmail: 'info@navienty.com',
    explore: 'Search',
    community: 'Community',
    account: 'Account',
    mobileLogin: 'Log in',
    copyright: `© ${new Date().getFullYear()} Navienty | All rights reserved.`,
  },
  ar: {
    homes: 'المنازل',
    services: 'الخدمات',
    career: 'الوظائف',
    lost: 'المفقودات',
    marketplace: 'المتجر',
    language: 'اللغة',
    currency: 'العملة',
    english: 'English',
    arabic: 'العربية',
    noImages: 'لا توجد صور متاحة لهذا العقار.',
    showAllPhotos: 'عرض كل الصور',
    brokerCardTitle: 'تواصل مع الوسيط',
    callNow: 'اتصل الآن',
    whatsappNow: 'واتساب الآن',
    emailNow: 'إرسال بريد',
    phone: 'رقم الهاتف',
    whatsapp: 'رقم الواتساب',
    notAvailable: 'غير متاح',
    similarProperties: 'عقارات مشابهة',
    viewAll: 'عرض الكل',
    from: 'ابتداءً من',
    perMonth: '/شهر',
    perDay: '/يوم',
    rooms: 'الغرف',
    availableRooms: 'الغرف المتاحة',
    enquire: 'استفسر',
    booked: 'محجوز',
    noRooms: 'لا توجد غرف متاحة لهذا العقار.',
    apartmentDetails: 'بيانات الشقة',
    bedroomsCount: 'عدد الغرف',
    bathroomsCount: 'عدد الحمامات',
    bedsCount: 'عدد السراير',
    guestsCount: 'عدد الأفراد',
    guest: 'ضيف',
    guests: 'ضيوف',
    bedroom: 'غرفة نوم',
    bedrooms: 'غرف نوم',
    bed: 'سرير',
    beds: 'أسرة',
    bath: 'حمام',
    baths: 'حمامات',
    whatThisPlaceOffers: 'ما الذي يقدمه هذا المكان',
    showAllAmenities: 'عرض كل المرافق',
    roomStatusAvailable: 'متاحة',
    roomStatusPartial: 'محجوزة جزئيًا',
    roomStatusFull: 'محجوزة بالكامل',
    roomStatusInactive: 'غير نشطة',
    reserved: 'محجوز',
    totalBeds: 'إجمالي السراير',
    availableBeds: 'السراير المتاحة',
    reservedBeds: 'السراير المحجوزة',
    occupiedBeds: 'السراير المشغولة',
    privateBathroom: 'حمام خاص',
    sharedBathroom: 'حمام مشترك',
    availability: 'الحالة',
    propertyId: 'رقم العقار',
    fullApartment: 'الشقة بالكامل',
    tripleRoom: 'غرفة ثلاثية',
    doubleRoom: 'غرفة مزدوجة',
    singleRoom: 'غرفة فردية',
    stayOptions: 'خيارات السكن',
    city: 'المدينة',
    university: 'الجامعة',
    duration: 'المدة',
    searchCities: 'ابحث عن مدينة',
    chooseUniversity: 'اختر الجامعة',
    chooseDuration: 'اختر المدة',
    selectCity: 'اختر المدينة',
    selectUniversity: 'اختر الجامعة',
    selectDuration: 'اختر المدة',
    anyCity: 'أي مدينة',
    anyUniversity: 'أي جامعة',
    anyDuration: 'أي مدة',
    daily: 'يومي',
    monthly: 'شهري',
    startSearch: 'ابدأ بحثك',
    pricesIncludeFees: 'الأسعار تشمل جميع الرسوم',
    help: 'مساعدة',
    signUp: 'إنشاء حساب',
    logIn: 'تسجيل الدخول',
    close: 'إغلاق',
    login: 'سجّل الدخول أو أنشئ حسابًا',
    join: 'انضم إلى مجتمعنا',
    facebook: 'فيسبوك',
    instagram: 'إنستجرام',
    linkedIn: 'لينكدإن',
    footerTitle: 'نظرة إلى المستقبل.',
    footerDescription:
      'بفضل تنوع مواقعنا الاستراتيجي، تمنح رؤية Navienty المتكاملة والشاملة تجربة سكن طلابي مبتكرة تخدم مختلف الاحتياجات بكفاءة عالية.',
    quickLinks: 'روابط سريعة',
    aboutUs: 'من نحن',
    board: 'الإدارة',
    contact: 'تواصل معنا',
    contactUs: 'تواصل معنا',
    footerEmail: 'info@navienty.com',
    explore: 'استكشاف',
    community: 'Community',
    account: 'الحساب',
    mobileLogin: 'تسجيل الدخول',
    copyright: `© ${new Date().getFullYear()} نافينتي | جميع الحقوق محفوظة.`,
  },
} as const

function normalizeLanguage(value?: string): SupportedLanguage {
  return value === 'ar' ? 'ar' : 'en'
}

function normalizeCurrency(value?: string): SupportedCurrency {
  const upper = value?.toUpperCase()
  return SUPPORTED_CURRENCIES.includes(upper as SupportedCurrency)
    ? (upper as SupportedCurrency)
    : 'EGP'
}

function cleanPhone(value?: string | null) {
  return (value || '').replace(/[^\d+]/g, '')
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

function getCountValue(value: number | string | null | undefined) {
  const numericValue = toNumber(value)
  if (numericValue === null || numericValue < 0) return 0
  return numericValue
}

function formatConvertedPrice({
  priceEgp,
  currency,
  exchangeRateFromEgp,
  locale,
}: {
  priceEgp: number | string | null | undefined
  currency: SupportedCurrency
  exchangeRateFromEgp: number
  locale: string
}) {
  const numericPrice = toNumber(priceEgp)
  if (numericPrice === null) return null

  const convertedPrice =
    currency === 'EGP' ? numericPrice : numericPrice * exchangeRateFromEgp

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(convertedPrice)
  } catch {
    return `${Math.round(convertedPrice).toLocaleString(locale)} ${currency}`
  }
}

function formatCountLabel({
  value,
  singular,
  plural,
}: {
  value: number
  singular: string
  plural: string
}) {
  return `${value} ${value === 1 ? singular : plural}`
}

function getDisplayOptionLabel(
  optionCode: OptionCode,
  t: (typeof TRANSLATIONS)['en'] | (typeof TRANSLATIONS)['ar']
) {
  if (optionCode === 'triple_room') return t.tripleRoom
  if (optionCode === 'double_room') return t.doubleRoom
  if (optionCode === 'single_room') return t.singleRoom
  return t.fullApartment
}

function normalizeOptionCode(value?: string | null): OptionCode | null {
  const normalized = String(value || '').trim().toLowerCase()

  if (
    normalized === 'triple_room' ||
    normalized === 'double_room' ||
    normalized === 'single_room' ||
    normalized === 'full_apartment'
  ) {
    return normalized
  }

  if (normalized === 'triple') return 'triple_room'
  if (normalized === 'double') return 'double_room'
  if (normalized === 'single') return 'single_room'

  return null
}

function getMinimumActiveOptionPrice(
  options: PropertyRoomSellableOption[],
  optionCode: OptionCode
) {
  const prices = options
    .filter((option) => option.is_active !== false)
    .filter((option) => normalizeOptionCode(option.code) === optionCode)
    .map((option) => toNumber(option.price_egp))
    .filter((price): price is number => price !== null)

  if (prices.length === 0) return null
  return [...prices].sort((a, b) => a - b)[0]
}

function getMinimumActiveOptionPriceAcrossRooms(
  rooms: PropertyRoom[],
  optionCode: Exclude<OptionCode, 'full_apartment'>
) {
  const prices = rooms
    .map((room) =>
      getMinimumActiveOptionPrice(room.room_sellable_options || [], optionCode)
    )
    .filter((price): price is number => price !== null)

  if (prices.length === 0) return null
  return [...prices].sort((a, b) => a - b)[0]
}

function getRoomOption(
  room: PropertyRoom,
  optionCode: Exclude<OptionCode, 'full_apartment'>
) {
  return (room.room_sellable_options || []).find(
    (option) =>
      option.is_active !== false &&
      normalizeOptionCode(option.code) === optionCode
  )
}

function getRoomOptionCapacity(
  room: PropertyRoom,
  optionCode: Exclude<OptionCode, 'full_apartment'>
) {
  const option = getRoomOption(room, optionCode)

  if (optionCode === 'single_room') return 1
  if (optionCode === 'double_room') return 2

  const occupancySize = toNumber(option?.occupancy_size)
  if (occupancySize && occupancySize > 0) return occupancySize

  return 3
}

function isActiveReservationStatus(status?: PropertyReservation['status']) {
  return status === 'pending' || status === 'reserved' || status === 'checked_in'
}

function buildRoomOccupancyState(
  room: PropertyRoom,
  reservations: PropertyReservation[],
  roomSellableOptionIdToCode: Map<string, OptionCode>
): RoomOccupancyState {
  const roomOptionIds = new Set(
    (room.room_sellable_options || []).map((option) => option.id)
  )

  const activeRoomReservations = reservations.filter((reservation) => {
    if (!isActiveReservationStatus(reservation.status)) return false
    if (!reservation.room_sellable_option_id) return false
    return roomOptionIds.has(reservation.room_sellable_option_id)
  })

  const hasEntireRoomReservation = activeRoomReservations.some(
    (reservation) => reservation.reservation_scope === 'entire_room'
  )

  if (hasEntireRoomReservation) {
    return {
      roomId: room.id,
      lockedMode: 'single_room',
      activeReservationsCount: 1,
      maxCapacity: 1,
      hasAvailability: false,
      blocksEntireProperty: true,
    }
  }

  const doubleCount = activeRoomReservations.filter((reservation) => {
    const optionCode = roomSellableOptionIdToCode.get(
      reservation.room_sellable_option_id || ''
    )
    return optionCode === 'double_room'
  }).length

  if (doubleCount > 0) {
    const maxCapacity = getRoomOptionCapacity(room, 'double_room')
    return {
      roomId: room.id,
      lockedMode: 'double_room',
      activeReservationsCount: doubleCount,
      maxCapacity,
      hasAvailability: doubleCount < maxCapacity,
      blocksEntireProperty: true,
    }
  }

  const tripleCount = activeRoomReservations.filter((reservation) => {
    const optionCode = roomSellableOptionIdToCode.get(
      reservation.room_sellable_option_id || ''
    )
    return optionCode === 'triple_room'
  }).length

  if (tripleCount > 0) {
    const maxCapacity = getRoomOptionCapacity(room, 'triple_room')
    return {
      roomId: room.id,
      lockedMode: 'triple_room',
      activeReservationsCount: tripleCount,
      maxCapacity,
      hasAvailability: tripleCount < maxCapacity,
      blocksEntireProperty: true,
    }
  }

  const roomIsInactive =
    room.status === 'inactive' || room.status === 'fully_reserved'

  return {
    roomId: room.id,
    lockedMode: null,
    activeReservationsCount: 0,
    maxCapacity: 0,
    hasAvailability: !roomIsInactive,
    blocksEntireProperty: false,
  }
}

function isRoomAvailableForOption(
  room: PropertyRoom,
  optionCode: Exclude<OptionCode, 'full_apartment'>,
  roomState: RoomOccupancyState
) {
  if (room.status === 'inactive' || room.status === 'fully_reserved') {
    return false
  }

  const roomOption = getRoomOption(room, optionCode)

  if (!roomOption || roomOption.is_active === false) {
    return false
  }

  if (!roomState.lockedMode) {
    return true
  }

  if (roomState.lockedMode !== optionCode) {
    return false
  }

  return roomState.hasAvailability
}

function LocationIcon({ className = '' }: { className?: string }) {
  return (
    <img
      src={LOCATION_PIN_ICON_URL}
      alt="Location"
      className={className}
      draggable={false}
    />
  )
}

function PropertyAddress({
  address,
  isArabic,
  variant = 'default',
}: {
  address: string
  isArabic: boolean
  variant?: 'default' | 'compact' | 'mobile'
}) {
  if (!address) return null

  return (
    <div
      className={`property-address property-address--${variant} ${
        isArabic ? 'property-address--rtl' : ''
      }`}
    >
      <span className="property-address__icon-wrap">
        <LocationIcon className="property-address__icon" />
      </span>

      <span className="property-address__text">{address}</span>
    </div>
  )
}

function FullyReservedBadge({
  label = 'Reserved',
  className = '',
}: {
  label?: string
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2 py-1 md:px-2.5 md:py-1 text-[10px] md:text-[11px] font-semibold shadow-sm border bg-red-100 text-red-700 border-red-200 ${className}`}
    >
      {label}
    </span>
  )
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.79.64 2.64a2 2 0 0 1-.45 2.11L8.03 9.74a16 16 0 0 0 6.23 6.23l1.27-1.27a2 2 0 0 1 2.11-.45c.85.31 1.74.52 2.64.64A2 2 0 0 1 22 16.92Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="currentColor"
    >
      <path d="M19.05 4.94A9.87 9.87 0 0 0 12.03 2C6.56 2 2.1 6.45 2.1 11.93c0 1.75.46 3.45 1.34 4.95L2 22l5.27-1.38a9.89 9.89 0 0 0 4.76 1.21h.01c5.47 0 9.93-4.45 9.93-9.93 0-2.65-1.03-5.14-2.92-7ZM12.04 20.15h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.13.82.83-3.05-.2-.31a8.2 8.2 0 0 1-1.27-4.37c0-4.52 3.68-8.2 8.22-8.2 2.2 0 4.27.85 5.83 2.41a8.16 8.16 0 0 1 2.4 5.82c0 4.52-3.69 8.2-8.19 8.2Zm4.49-6.15c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.52.06-.24-.12-1.03-.38-1.96-1.21-.72-.64-1.21-1.43-1.35-1.67-.14-.24-.01-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.31-.74-1.79-.2-.49-.4-.42-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 1.99s.86 2.3.98 2.46c.12.16 1.69 2.58 4.09 3.62.57.24 1.01.38 1.36.49.57.18 1.08.15 1.49.09.45-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.05-.1-.21-.16-.45-.28Z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M4 6h16v12H4z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m4 7 8 6 8-6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BrokerContactCard({
  brokerName,
  brokerImage,
  brokerPhone,
  brokerWhatsapp,
  t,
  isArabic,
}: {
  brokerName: string
  brokerCompany?: string | null
  brokerImage: string
  brokerPhone?: string | null
  brokerWhatsapp?: string | null
  brokerEmail?: string | null
  t: (typeof TRANSLATIONS)['en'] | (typeof TRANSLATIONS)['ar']
  isArabic: boolean
}) {
  const cleanedPhone = cleanPhone(brokerPhone || '')
  const cleanedWhatsapp = cleanPhone(brokerWhatsapp || '')

  const flipId = `broker-card-flip-${brokerName
    .replace(/\s+/g, '-')
    .toLowerCase()}`

  return (
    <div className="broker-card-scene">
      <input
        id={flipId}
        type="checkbox"
        className="broker-card-toggle sr-only"
        aria-label={t.brokerCardTitle}
      />

      <label
        htmlFor={flipId}
        className="broker-card-click-target"
        aria-label={t.brokerCardTitle}
      >
        <div className="broker-card-inner">
          <div
            className="broker-card-face broker-card-front"
            style={{
              backgroundImage: `url(${BROKER_CARD_FRONT_IMAGE})`,
            }}
          >
            <div className="broker-card-front-overlay">
              <div
                className={`broker-card-top-info absolute top-3 ${
                  isArabic ? 'right-4 broker-card-top-info--rtl' : 'left-4'
                }`}
              >
                <div className="broker-card-avatar broker-card-avatar--large">
                  <img
                    src={brokerImage}
                    alt={brokerName}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <p className="broker-card-name">{brokerName}</p>
                </div>
              </div>

              <div
                className={`absolute top-1/2 ${
                  isArabic ? 'right-4 text-right' : 'right-4 text-left'
                } transform -translate-y-1/2`}
              >
                <div className="flex flex-col gap-3">
                  {cleanedPhone && (
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-md">
                      <PhoneIcon />
                      <span className="font-semibold text-sm text-gray-800">
                        {cleanedPhone}
                      </span>
                    </div>
                  )}

                  {cleanedWhatsapp && (
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-md">
                      <WhatsAppIcon />
                      <span className="font-semibold text-sm text-gray-800">
                        {cleanedWhatsapp}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            className="broker-card-face broker-card-back"
            style={{
              backgroundImage: `url(${BROKER_CARD_BACK_IMAGE})`,
            }}
          >
            <div className="broker-card-back-overlay">
              <div
                className={`broker-card-back-top ${
                  isArabic ? 'broker-card-back-top--rtl' : ''
                }`}
              ></div>

              <div
                className={`broker-card-back-actions ${
                  isArabic ? 'broker-card-back-actions--rtl' : ''
                }`}
              ></div>
            </div>
          </div>
        </div>
      </label>
    </div>
  )
}

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ propertyId: string }>
  searchParams: Promise<SearchParams>
}) {
  const { propertyId } = await params
  const {
    rental_duration,
    city_id,
    university_id,
    price_range,
    lang,
    currency,
  } = await searchParams

  const selectedLanguage = normalizeLanguage(lang)
  const selectedCurrency = normalizeCurrency(currency)
  const isArabic = selectedLanguage === 'ar'
  const t = TRANSLATIONS[selectedLanguage]
  const locale = isArabic ? 'ar-EG' : 'en-US'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isSignedIn = Boolean(user)

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name_en, name_ar')
    .order('name_en', { ascending: true })

  const { data: universities } = await supabase
    .from('universities')
    .select('id, name_en, name_ar, city_id')
    .order('name_en', { ascending: true })

  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      id,
      property_id,
      title_en,
      title_ar,
      address_en,
      address_ar,
      broker_id,
      university_id,
      price_egp,
      rental_duration,
      availability_status,
      bedrooms_count,
      bathrooms_count,
      beds_count,
      guests_count,
      property_images (
        image_url,
        is_cover,
        sort_order
      )
    `)
    .eq('property_id', propertyId)
    .eq('admin_status', 'published')
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    throw new Error(`Property query failed: ${error.message}`)
  }

  if (!property) {
    notFound()
  }

  const typedProperty = property as Property

  const buildPropertyDetailsLink = (targetPropertyId: string) => {
    const params = new URLSearchParams()

    if (rental_duration) params.set('rental_duration', rental_duration)
    if (city_id) params.set('city_id', city_id)
    if (typedProperty.university_id) {
      params.set('university_id', String(typedProperty.university_id))
    } else if (university_id) {
      params.set('university_id', university_id)
    }
    if (price_range) params.set('price_range', price_range)
    params.set('lang', selectedLanguage)
    params.set('currency', selectedCurrency)

    const queryString = params.toString()
    return `/properties/${targetPropertyId}${queryString ? `?${queryString}` : ''}`
  }

  const loginRedirectUrl = `/login?redirect=${encodeURIComponent(
    buildPropertyDetailsLink(typedProperty.property_id)
  )}`

  let broker: Broker | null = null

  if (typedProperty.broker_id) {
    const { data: brokerData, error: brokerError } = await supabase
      .from('brokers')
      .select(`
        full_name,
        company_name,
        phone_number,
        whatsapp_number,
        email,
        image_url
      `)
      .eq('id', typedProperty.broker_id)
      .maybeSingle()

    if (!brokerError) {
      broker = brokerData || null
    }
  }

  let exchangeRateFromEgp = 1

  if (selectedCurrency !== 'EGP') {
    const { data: currencyData } = await supabase
      .from('currencies')
      .select('exchange_rate_from_egp')
      .eq('code', selectedCurrency)
      .maybeSingle()

    const rate = toNumber(currencyData?.exchange_rate_from_egp)
    if (rate && rate > 0) {
      exchangeRateFromEgp = rate
    }
  }

  let rooms: PropertyRoom[] = []

  const { data: roomsData, error: roomsError } = await supabase
    .from('property_rooms')
    .select(`
      id,
      room_name,
      room_name_ar,
      room_type,
      base_price_egp,
      status,
      private_bathroom,
      sort_order,
      room_beds (
        id,
        status
      ),
      room_sellable_options:property_room_sellable_options (
        id,
        code,
        name_en,
        name_ar,
        pricing_mode,
        price_egp,
        consumes_beds_count,
        occupancy_size,
        is_exclusive,
        is_active,
        sort_order
      )
    `)
    .eq('property_id_ref', typedProperty.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (!roomsError && roomsData) {
    rooms = [...(roomsData as PropertyRoom[])].sort((a, b) => {
      const sortOrderA = a.sort_order ?? Number.MAX_SAFE_INTEGER
      const sortOrderB = b.sort_order ?? Number.MAX_SAFE_INTEGER
      if (sortOrderA !== sortOrderB) return sortOrderA - sortOrderB

      const roomNameA = a.room_name || a.room_name_ar || ''
      const roomNameB = b.room_name || b.room_name_ar || ''
      return roomNameA.localeCompare(roomNameB)
    })
  }

  const { data: propertySellableOptionsData } = await supabase
    .from('property_sellable_options')
    .select(`
      id,
      code,
      option_code,
      name_en,
      name_ar,
      sell_mode,
      pricing_mode,
      price_egp,
      is_active,
      sort_order
    `)
    .eq('property_id', typedProperty.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const propertySellableOptions = (propertySellableOptionsData ||
    []) as PropertySellableOption[]

  const fullApartmentOption =
    propertySellableOptions.find(
      (option) =>
        option.is_active !== false &&
        (option.sell_mode === 'entire_property' ||
          option.code === 'full_apartment' ||
          option.option_code === 'full_apartment')
    ) || null

  const { data: propertyReservationsData, error: propertyReservationsError } =
    await supabase
      .from('property_reservations')
      .select(`
        id,
        reservation_scope,
        status,
        room_sellable_option_id
      `)
      .eq('property_id', typedProperty.id)

  if (propertyReservationsError) {
    throw new Error(propertyReservationsError.message)
  }

  const propertyReservations = (propertyReservationsData ||
    []) as PropertyReservation[]

  const roomSellableOptionIdToCode = new Map<string, OptionCode>()
  for (const room of rooms) {
    for (const option of room.room_sellable_options || []) {
      const normalized = normalizeOptionCode(option.code)
      if (normalized) {
        roomSellableOptionIdToCode.set(option.id, normalized)
      }
    }
  }

  const hasActiveFullApartmentReservation = propertyReservations.some(
    (reservation) =>
      isActiveReservationStatus(reservation.status) &&
      reservation.reservation_scope === 'entire_property'
  )

  const roomOccupancyByRoomId = new Map<string, RoomOccupancyState>(
    rooms.map((room) => [
      room.id,
      buildRoomOccupancyState(
        room,
        propertyReservations,
        roomSellableOptionIdToCode
      ),
    ])
  )

  const hasAnyActiveRoomReservation = Array.from(roomOccupancyByRoomId.values()).some(
    (roomState) => roomState.blocksEntireProperty
  )

  let offers: PropertyOfferItem[] = []

  const [
    allAmenitiesResponse,
    allFacilitiesResponse,
    allBillTypesResponse,
    propertyAmenitiesResponse,
    propertyFacilitiesResponse,
    propertyBillsResponse,
  ] = await Promise.all([
    supabase
      .from('amenities')
      .select(`
        id,
        name_en,
        name_ar,
        icon_key,
        icon_url,
        category_en,
        category_ar,
        sort_order,
        is_active
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),

    supabase
      .from('facilities')
      .select(`
        id,
        code,
        name_en,
        name_ar,
        icon_url,
        sort_order,
        is_active
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),

    supabase
      .from('bill_types')
      .select(`
        id,
        code,
        name_en,
        name_ar,
        icon_url,
        sort_order,
        is_active
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),

    supabase
      .from('property_amenities')
      .select('amenity_id')
      .eq('property_id_ref', typedProperty.id),

    supabase
      .from('property_facilities')
      .select('facility_id')
      .eq('property_id_ref', typedProperty.id),

    supabase
      .from('property_bill_includes')
      .select('bill_type_id')
      .eq('property_id_ref', typedProperty.id),
  ])

  const propertyAmenityIds = new Set(
    (propertyAmenitiesResponse.data || []).map((row: any) =>
      String(row.amenity_id)
    )
  )

  const propertyFacilityIds = new Set(
    (propertyFacilitiesResponse.data || []).map((row: any) =>
      String(row.facility_id)
    )
  )

  const propertyBillTypeIds = new Set(
    (propertyBillsResponse.data || []).map((row: any) =>
      String(row.bill_type_id)
    )
  )

  const amenityItems: PropertyOfferItem[] = !allAmenitiesResponse.error
    ? (allAmenitiesResponse.data || []).map((item: any) => ({
        id: `amenity-${item.id}`,
        name_en: item.name_en,
        name_ar: item.name_ar,
        icon_key: item.icon_key || 'sparkles',
        icon_url: item.icon_url || null,
        category_en: item.category_en || 'Amenities',
        category_ar: item.category_ar || 'المرافق',
        sort_order: item.sort_order ?? 0,
        is_available: propertyAmenityIds.has(String(item.id)),
      }))
    : []

  const facilityItems: PropertyOfferItem[] = !allFacilitiesResponse.error
    ? (allFacilitiesResponse.data || []).map((item: any) => ({
        id: `facility-${item.id}`,
        name_en: item.name_en,
        name_ar: item.name_ar,
        icon_key: 'building',
        icon_url: item.icon_url || null,
        category_en: 'Facilities',
        category_ar: 'الخدمات',
        sort_order: item.sort_order ?? 0,
        is_available: propertyFacilityIds.has(String(item.id)),
      }))
    : []

  const billItems: PropertyOfferItem[] = !allBillTypesResponse.error
    ? (allBillTypesResponse.data || []).map((item: any) => ({
        id: `bill-${item.id}`,
        name_en: item.name_en,
        name_ar: item.name_ar,
        icon_key: 'receipt',
        icon_url: item.icon_url || null,
        category_en: 'Bills included',
        category_ar: 'الفواتير المشمولة',
        sort_order: item.sort_order ?? 0,
        is_available: propertyBillTypeIds.has(String(item.id)),
      }))
    : []

  offers = [...amenityItems, ...facilityItems, ...billItems].sort((a, b) => {
    const categoryA = `${a.category_en || ''}-${a.sort_order ?? 0}-${a.name_en || ''}`
    const categoryB = `${b.category_en || ''}-${b.sort_order ?? 0}-${b.name_en || ''}`
    return categoryA.localeCompare(categoryB)
  })

  let similarProperties: SimilarProperty[] = []

  if (typedProperty.university_id) {
    const { data: similarData, error: similarError } = await supabase
      .from('properties')
      .select(`
        id,
        property_id,
        title_en,
        title_ar,
        address_en,
        address_ar,
        university_id,
        price_egp,
        rental_duration,
        property_images (
          image_url,
          is_cover,
          sort_order
        )
      `)
      .eq('university_id', typedProperty.university_id)
      .neq('property_id', typedProperty.property_id)
      .in('availability_status', ['available', 'partially_reserved'])
      .eq('admin_status', 'published')
      .eq('is_active', true)
      .limit(4)

    if (!similarError && similarData) {
      similarProperties = similarData as SimilarProperty[]
    }
  }

  const images: PropertyImage[] = Array.isArray(typedProperty.property_images)
    ? [...typedProperty.property_images].sort(
        (a: PropertyImage, b: PropertyImage) => a.sort_order - b.sort_order
      )
    : []

  const coverImage =
    images.find((image) => image.is_cover)?.image_url ||
    images[0]?.image_url ||
    'https://via.placeholder.com/1400x900?text=No+Image'

  const galleryImages =
    images.length > 0
      ? images
      : [
          {
            image_url: coverImage,
            sort_order: 0,
          },
        ]

  const mobileSliderImages = galleryImages.map((image) => image.image_url)
  const desktopGalleryImages = galleryImages.map((image) => image.image_url)

  const buildPageLink = (updates: Partial<SearchParams> = {}) => {
    const params = new URLSearchParams()

    const nextRentalDuration =
      updates.rental_duration !== undefined
        ? updates.rental_duration
        : rental_duration

    const nextCityId = updates.city_id !== undefined ? updates.city_id : city_id
    const nextUniversityId =
      updates.university_id !== undefined
        ? updates.university_id
        : university_id
    const nextPriceRange =
      updates.price_range !== undefined ? updates.price_range : price_range
    const nextLang =
      updates.lang !== undefined ? updates.lang : selectedLanguage
    const nextCurrency =
      updates.currency !== undefined ? updates.currency : selectedCurrency

    if (nextRentalDuration) params.set('rental_duration', nextRentalDuration)
    if (nextCityId) params.set('city_id', nextCityId)
    if (nextUniversityId) params.set('university_id', nextUniversityId)
    if (nextPriceRange) params.set('price_range', nextPriceRange)
    if (nextLang) params.set('lang', nextLang)
    if (nextCurrency) params.set('currency', nextCurrency)

    const queryString = params.toString()
    return queryString ? `/properties?${queryString}` : '/properties'
  }

  const buildSearchResultsLink = () => {
    const params = new URLSearchParams()

    if (rental_duration || typedProperty.rental_duration) {
      params.set(
        'rental_duration',
        rental_duration || typedProperty.rental_duration || 'monthly'
      )
    }

    if (city_id) params.set('city_id', city_id)
    if (typedProperty.university_id) {
      params.set('university_id', String(typedProperty.university_id))
    } else if (university_id) {
      params.set('university_id', university_id)
    }
    if (price_range) params.set('price_range', price_range)
    params.set('lang', selectedLanguage)
    params.set('currency', selectedCurrency)

    const queryString = params.toString()
    return queryString ? `/search?${queryString}` : '/search'
  }

  const buildSimpleNavLink = (
    path: string,
    updates: Partial<SearchParams> = {}
  ) => {
    const params = new URLSearchParams()
    params.set('lang', updates.lang ?? selectedLanguage)
    params.set('currency', updates.currency ?? selectedCurrency)
    const queryString = params.toString()
    return queryString ? `${path}?${queryString}` : path
  }

  const searchBarProps = {
    cities: (cities as City[]) ?? [],
    universities: (universities as University[]) ?? [],
    initialCityId: city_id ?? '',
    initialUniversityId: university_id ?? '',
    initialRentalDuration: rental_duration ?? '',
    initialPriceRange: price_range ?? '',
    language: selectedLanguage,
    currency: selectedCurrency,
    labels: {
      city: t.city,
      university: t.university,
      duration: t.duration,
      searchCities: t.searchCities,
      chooseUniversity: t.chooseUniversity,
      chooseDuration: t.chooseDuration,
      selectCity: t.selectCity,
      selectUniversity: t.selectUniversity,
      selectDuration: t.selectDuration,
      anyCity: t.anyCity,
      anyUniversity: t.anyUniversity,
      anyDuration: t.anyDuration,
      daily: t.daily,
      monthly: t.monthly,
    },
  }

  const primaryMenuLinks = [
    {
      label: isSignedIn ? t.account : t.login,
      href: isSignedIn
        ? buildSimpleNavLink('/account')
        : buildSimpleNavLink('/login'),
    },
    { label: t.join, href: buildSimpleNavLink('/community') },
  ]

  const socialMenuLinks = [
    { label: t.facebook, href: 'https://www.facebook.com/' },
    { label: t.instagram, href: 'https://www.instagram.com/' },
    { label: t.linkedIn, href: 'https://www.linkedin.com/' },
  ]

  const footerQuickLinks = [
    { label: t.aboutUs, href: buildSimpleNavLink('/about') },
    { label: t.board, href: buildSimpleNavLink('/board') },
    { label: t.contact, href: buildSimpleNavLink('/contact') },
  ]

  const menuFooterLinks: MenuFooterLink[] = [
    ...footerQuickLinks,
    { label: t.footerEmail, href: `mailto:${t.footerEmail}`, isEmail: true },
  ]

  const mobileAccountHref = isSignedIn
    ? buildSimpleNavLink('/account')
    : buildSimpleNavLink('/login')

  const mobileAccountLabel = isSignedIn ? t.account : t.mobileLogin

  const addressText = isArabic
    ? typedProperty.address_ar || typedProperty.address_en || ''
    : typedProperty.address_en || typedProperty.address_ar || ''

  const propertyTitle = isArabic
    ? typedProperty.title_ar || typedProperty.title_en || 'Untitled Property'
    : typedProperty.title_en || typedProperty.title_ar || 'Untitled Property'

  const brokerImage =
    broker?.image_url || 'https://via.placeholder.com/240x240?text=Broker'

  const brokerName = broker?.full_name || t.notAvailable
  const brokerPhone = broker?.phone_number || ''
  const brokerWhatsapp = broker?.whatsapp_number || ''
  const brokerEmail = broker?.email || ''
  const brokerCompany = broker?.company_name || ''

  const guestsCount = getCountValue(typedProperty.guests_count)
  const bedroomsCount = getCountValue(typedProperty.bedrooms_count)
  const bedsCount = getCountValue(typedProperty.beds_count)
  const bathroomsCount = getCountValue(typedProperty.bathrooms_count)

  const apartmentSummaryItems = [
    formatCountLabel({
      value: guestsCount,
      singular: t.guest,
      plural: t.guests,
    }),
    formatCountLabel({
      value: bedroomsCount,
      singular: t.bedroom,
      plural: t.bedrooms,
    }),
    formatCountLabel({
      value: bedsCount,
      singular: t.bed,
      plural: t.beds,
    }),
    formatCountLabel({
      value: bathroomsCount,
      singular: t.bath,
      plural: t.baths,
    }),
  ]

  const apartmentSummaryText = apartmentSummaryItems.join(' · ')

  const availableTriplePrice =
    rooms
      .filter((room) =>
        isRoomAvailableForOption(
          room,
          'triple_room',
          roomOccupancyByRoomId.get(room.id) || {
            roomId: room.id,
            lockedMode: null,
            activeReservationsCount: 0,
            maxCapacity: 0,
            hasAvailability: false,
            blocksEntireProperty: false,
          }
        )
      )
      .map((room) =>
        getMinimumActiveOptionPrice(room.room_sellable_options || [], 'triple_room')
      )
      .filter((price): price is number => price !== null)
      .sort((a, b) => a - b)[0] ?? null

  const availableDoublePrice =
    rooms
      .filter((room) =>
        isRoomAvailableForOption(
          room,
          'double_room',
          roomOccupancyByRoomId.get(room.id) || {
            roomId: room.id,
            lockedMode: null,
            activeReservationsCount: 0,
            maxCapacity: 0,
            hasAvailability: false,
            blocksEntireProperty: false,
          }
        )
      )
      .map((room) =>
        getMinimumActiveOptionPrice(room.room_sellable_options || [], 'double_room')
      )
      .filter((price): price is number => price !== null)
      .sort((a, b) => a - b)[0] ?? null

  const availableSinglePrice =
    rooms
      .filter((room) =>
        isRoomAvailableForOption(
          room,
          'single_room',
          roomOccupancyByRoomId.get(room.id) || {
            roomId: room.id,
            lockedMode: null,
            activeReservationsCount: 0,
            maxCapacity: 0,
            hasAvailability: false,
            blocksEntireProperty: false,
          }
        )
      )
      .map((room) =>
        getMinimumActiveOptionPrice(room.room_sellable_options || [], 'single_room')
      )
      .filter((price): price is number => price !== null)
      .sort((a, b) => a - b)[0] ?? null

    const tripleDisplayPrice = getMinimumActiveOptionPriceAcrossRooms(
      rooms,
      'triple_room'
    )

    const doubleDisplayPrice = getMinimumActiveOptionPriceAcrossRooms(
      rooms,
      'double_room'
    )

    const singleDisplayPrice = getMinimumActiveOptionPriceAcrossRooms(
      rooms,
      'single_room'
    )

    const hasAvailableTriple = rooms.some((room) =>
      isRoomAvailableForOption(
        room,
        'triple_room',
        roomOccupancyByRoomId.get(room.id) || {
          roomId: room.id,
          lockedMode: null,
          activeReservationsCount: 0,
          maxCapacity: 0,
          hasAvailability: false,
          blocksEntireProperty: false,
        }
      )
    )

    const hasAvailableDouble = rooms.some((room) =>
      isRoomAvailableForOption(
        room,
        'double_room',
        roomOccupancyByRoomId.get(room.id) || {
          roomId: room.id,
          lockedMode: null,
          activeReservationsCount: 0,
          maxCapacity: 0,
          hasAvailability: false,
          blocksEntireProperty: false,
        }
      )
    )

    const hasAvailableSingle = rooms.some((room) =>
      isRoomAvailableForOption(
        room,
        'single_room',
        roomOccupancyByRoomId.get(room.id) || {
          roomId: room.id,
          lockedMode: null,
          activeReservationsCount: 0,
          maxCapacity: 0,
          hasAvailability: false,
          blocksEntireProperty: false,
        }
      )
    )

  const optionCards: DisplayOption[] = [
        {
      code: 'triple_room',
      label: getDisplayOptionLabel('triple_room', t),
      price: tripleDisplayPrice,
      isBooked: !hasAvailableTriple,
    },
    {
      code: 'double_room',
      label: getDisplayOptionLabel('double_room', t),
      price: doubleDisplayPrice,
      isBooked: !hasAvailableDouble,
    },
    {
      code: 'single_room',
      label: getDisplayOptionLabel('single_room', t),
      price: singleDisplayPrice,
      isBooked: !hasAvailableSingle,
    },
 
    {
      code: 'full_apartment',
      label: getDisplayOptionLabel('full_apartment', t),
      price: toNumber(fullApartmentOption?.price_egp),
      isBooked:
        !fullApartmentOption ||
        fullApartmentOption.is_active === false ||
        hasActiveFullApartmentReservation ||
        hasAnyActiveRoomReservation ||
        typedProperty.availability_status === 'fully_reserved' ||
        typedProperty.availability_status === 'inactive',
    },
  ]

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="relative min-h-screen bg-white pb-32 text-gray-700 md:pb-0"
    >
      <input
        id="nav-menu-toggle"
        type="checkbox"
        className="peer sr-only"
        aria-hidden="true"
      />

      <input
        id="mobile-rooms-toggle"
        type="checkbox"
        className="mobile-rooms-toggle sr-only"
        aria-hidden="true"
      />

      <style>{`
        :root {
          --menu-blue: #054aff;
          --menu-cream: #f2ead8;
          --menu-cream-soft: rgba(242, 234, 216, 0.92);
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .property-address {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  max-width: 100%;
  width: fit-content;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(248, 250, 252, 0.88);
  color: #334155;
  border-radius: 999px;
  padding: 8px 14px 8px 10px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.property-address--rtl {
  flex-direction: row-reverse;
  padding: 8px 10px 8px 14px;
}

.property-address__icon-wrap {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 5px 14px rgba(5, 74, 255, 0.12);
}

.property-address__icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  display: block;
}

.property-address__text {
  min-width: 0;
  max-width: 720px;
  font-size: 14px;
  line-height: 1.45;
  font-weight: 600;
  color: #334155;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.property-address--compact {
  gap: 7px;
  padding: 6px 10px 6px 7px;
  box-shadow: none;
  background: rgba(248, 250, 252, 0.72);
}

.property-address--compact.property-address--rtl {
  padding: 6px 7px 6px 10px;
}

.property-address--compact .property-address__icon-wrap {
  width: 24px;
  height: 24px;
  flex-basis: 24px;
  box-shadow: none;
}

.property-address--compact .property-address__icon {
  width: 17px;
  height: 17px;
}

.property-address--compact .property-address__text {
  max-width: 220px;
  font-size: 12px;
  line-height: 1.35;
  font-weight: 600;
  -webkit-line-clamp: 1;
}

.property-address--mobile {
  width: 100%;
  justify-content: center;
  border-radius: 22px;
  padding: 10px 12px;
  background: #f8fafc;
  border-color: #e2e8f0;
}

.property-address--mobile .property-address__icon-wrap {
  width: 34px;
  height: 34px;
  flex-basis: 34px;
}

.property-address--mobile .property-address__icon {
  width: 24px;
  height: 24px;
}

.property-address--mobile .property-address__text {
  max-width: 280px;
  text-align: start;
  font-size: 14px;
  line-height: 1.45;
  font-weight: 700;
}

.property-address--mobile.property-address--rtl .property-address__text {
  text-align: right;
}

@media (max-width: 768px) {
  .property-address {
    gap: 9px;
  }

  .property-address__text {
    font-size: 13px;
  }
}

        .navienty-logo {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          overflow: hidden;
          text-decoration: none;
          transform: translateY(-7px);
        }

        .navienty-logo-icon {
          width: 56px;
          height: 56px;
          object-fit: contain;
          flex-shrink: 0;
          display: block;
        }

        .navienty-logo-text-wrap {
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateX(-6px);
          transition:
            max-width 0.35s ease,
            opacity 0.25s ease,
            transform 0.35s ease;
          display: flex;
          align-items: center;
        }

        .navienty-logo:hover .navienty-logo-text-wrap,
        .navienty-logo:focus-visible .navienty-logo-text-wrap {
          max-width: 120px;
          opacity: 1;
          transform: translateX(0);
        }

        .navienty-logo-text {
          width: 112px;
          min-width: 112px;
          height: auto;
          object-fit: contain;
          display: block;
          transform: translateY(-2px);
        }

        .navienty-logo-mobile {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .navienty-logo-mobile img {
          width: 42px;
          height: 42px;
          object-fit: contain;
          display: block;
        }

        .menu-trigger {
          width: 40px;
          height: 40px;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .menu-trigger:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .menu-trigger-lines {
          position: relative;
          width: 26px;
          height: 10px;
          display: block;
        }

        .menu-trigger-lines span {
          position: absolute;
          left: 0;
          width: 100%;
          height: 2px;
          background: #000000;
          border-radius: 2px;
        }

        .menu-trigger-lines span:nth-child(1) {
          top: 0;
        }

        .menu-trigger-lines span:nth-child(2) {
          bottom: 0;
        }

        .mega-menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 140;
          background: var(--menu-blue);
          color: var(--menu-cream);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateY(-8px);
          transition:
            opacity 0.26s ease,
            visibility 0.26s ease,
            transform 0.26s ease;
        }

        .peer:checked ~ .mega-menu-overlay {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateY(0);
        }

        .mega-menu-wrap {
          position: relative;
          min-height: 100dvh;
          padding: 38px 56px 38px;
        }

        .mega-menu-top {
          position: absolute;
          left: 56px;
          right: 56px;
          top: 36px;
          height: 56px;
          z-index: 3;
        }

        .mega-menu-close {
          position: absolute;
          right: 0;
          top: 0;
          display: inline-flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          color: var(--menu-cream);
          font-size: 18px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: -0.02em;
          z-index: 5;
        }

        .mega-menu-close--rtl {
          right: auto;
          left: 0;
          flex-direction: row-reverse;
        }

        .mega-menu-close-line {
          width: 46px;
          height: 2px;
          border-radius: 999px;
          background: currentColor;
          display: inline-block;
          transform: translateY(-1px);
        }

        .mega-menu-logo {
          position: absolute;
          left: 50%;
          top: -60px;
          transform: translateX(-50%);
          z-index: 2;
        }

        .mega-menu-logo img {
          width: 160px;
          height: auto;
          object-fit: contain;
          display: block;
        }

        .mega-menu-body {
          position: relative;
          min-height: calc(100dvh - 76px);
          padding-top: 100px;
          width: 100%;
          padding-left: 56px;
          padding-right: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mega-menu-left {
          position: absolute;
          left: 56px;
          bottom: 36px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 220px;
          min-width: 220px;
          min-height: auto;
        }

        .mega-menu-left-spacer {
          display: none;
        }

        .mega-menu-left-bottom {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          padding-bottom: 0;
        }

        .mega-menu-small-link {
          color: var(--menu-cream);
          text-decoration: none;
          font-size: 22px;
          line-height: 1.28;
          font-weight: 600;
          letter-spacing: -0.03em;
          display: block;
          width: fit-content;
        }

        .mega-menu-small-link:hover {
          opacity: 0.88;
        }

        .mega-menu-right {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-width: 0;
          padding-top: 0;
          transform: translateY(-100px);
        }

        .mega-menu-main-links {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          width: 100%;
          max-width: 900px;
          text-align: center;
        }

        .mega-menu-main-link {
          color: var(--menu-cream);
          text-decoration: none;
          font-weight: 600;
          font-size: 64px;
          line-height: 1.15;
          letter-spacing: -0.075em;
          display: block;
          width: fit-content;
        }

        .mega-menu-main-link:hover {
          opacity: 0.9;
        }

        .mega-menu-footer-links {
          position: absolute;
          right: 56px;
          bottom: 12px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          max-width: 240px;
          text-align: right;
        }

        .mega-menu-footer-links--rtl {
          right: auto;
          left: 56px;
          align-items: flex-start;
          text-align: left;
        }

        .mega-menu-footer-link {
          color: rgba(242, 234, 216, 0.88);
          text-decoration: none;
          font-size: 18px;
          line-height: 1.35;
          font-weight: 500;
          letter-spacing: -0.02em;
          transition:
            opacity 0.2s ease,
            transform 0.2s ease,
            color 0.2s ease;
        }

        .mega-menu-footer-link:hover {
          opacity: 1;
          color: var(--menu-cream);
          transform: translateX(-2px);
        }

        .mega-menu-footer-link--email {
          margin-top: 8px;
          opacity: 0.76;
          font-size: 16px;
        }

        .mobile-bottom-nav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 120;
          display: none;
          background: rgba(255, 255, 255, 0.96);
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 8px);
          box-shadow: 0 -8px 30px rgba(15, 23, 42, 0.08);
        }

        .mobile-bottom-nav__inner {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: center;
          height: 64px;
          padding: 0 8px;
        }

        .mobile-bottom-nav__item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-decoration: none;
          color: #6b7280;
          min-height: 100%;
          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .mobile-bottom-nav__item:hover {
          color: #111827;
        }

        .mobile-bottom-nav__item:hover .mobile-bottom-nav__icon--image {
          filter: grayscale(1) brightness(0.2);
        }

        .mobile-bottom-nav__item--active {
          color: #054aff;
        }

        .mobile-bottom-nav__item--active .mobile-bottom-nav__icon--image {
          filter: brightness(0) saturate(100%) invert(18%) sepia(98%) saturate(5178%)
            hue-rotate(223deg) brightness(104%) contrast(106%);
        }

        .mobile-bottom-nav__icon {
          width: 22px;
          height: 22px;
          display: block;
        }

        .mobile-bottom-nav__icon--image {
          object-fit: contain;
          filter: grayscale(1) brightness(0.55);
          transition: filter 0.2s ease;
        }

        .mobile-bottom-nav__label {
          font-size: 11px;
          line-height: 1;
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        .mobile-rooms-cta {
          position: fixed;
          left: 16px;
          right: 16px;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 82px);
          z-index: 121;
          display: none;
        }

        .mobile-rooms-cta__button {
          width: 100%;
          min-height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 999px;
          background: #054aff;
          color: #ffffff;
          box-shadow: 0 16px 34px rgba(5, 74, 255, 0.28);
          padding: 14px 20px;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            opacity 0.2s ease,
            background 0.2s ease;
        }

        .mobile-rooms-cta__button:hover {
          transform: translateY(-1px);
          background: #043be0;
        }

        

        .mobile-rooms-sheet {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 130;
          display: none;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition:
            opacity 0.25s ease,
            visibility 0.25s ease;
        }

        .mobile-rooms-sheet__backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.32);
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .mobile-rooms-sheet__panel {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          max-height: min(74vh, 720px);
          background: #ffffff;
          border-top-left-radius: 28px;
          border-top-right-radius: 28px;
          box-shadow: 0 -20px 54px rgba(15, 23, 42, 0.18);
          transform: translateY(100%);
          transition: transform 0.28s ease;
          overflow: hidden;
          padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 84px);
        }

        .mobile-rooms-sheet__handle {
          width: 52px;
          height: 5px;
          background: #cbd5e1;
          border-radius: 999px;
          margin: 12px auto 10px;
        }

        .mobile-rooms-sheet__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 18px 14px;
          border-bottom: 1px solid #e2e8f0;
        }

        .mobile-rooms-sheet__title {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .mobile-rooms-sheet__close {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 28px;
  line-height: 1;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}

        .mobile-rooms-sheet__body {
          max-height: calc(min(74vh, 720px) - 72px);
          overflow-y: auto;
          padding: 16px 16px 0;
        }

        .mobile-rooms-toggle:checked ~ .mobile-rooms-sheet {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        .mobile-rooms-toggle:checked ~ .mobile-rooms-sheet .mobile-rooms-sheet__backdrop {
          opacity: 1;
        }

        .mobile-rooms-toggle:checked ~ .mobile-rooms-sheet .mobile-rooms-sheet__panel {
          transform: translateY(0);
        }

        .footer-esaf {
          background: #054aff;
          color: #ffffff;
          margin-top: 56px;
        }

        .footer-esaf-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 72px 48px 34px;
        }

        .footer-esaf-top {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) 320px 280px;
          gap: 72px;
          align-items: start;
        }

        .footer-esaf-title {
          margin: 0;
          color: #ffffff;
          font-size: clamp(42px, 5vw, 64px);
          line-height: 0.98;
          letter-spacing: -0.06em;
          font-weight: 500;
          text-transform: uppercase;
        }

        .footer-esaf-description {
          margin: 28px 0 0;
          max-width: 760px;
          color: rgba(255, 255, 255, 0.95);
          font-size: 17px;
          line-height: 2.05;
          letter-spacing: -0.02em;
        }

        .footer-esaf-heading {
          margin: 0 0 18px;
          color: #ffffff;
          font-size: 24px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .footer-esaf-links {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-esaf-link {
          display: inline-block;
          width: fit-content;
          color: #ffffff;
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 8px;
          font-size: 18px;
          line-height: 1.45;
          font-weight: 500;
          transition: opacity 0.2s ease;
        }

        .footer-esaf-link:hover {
          opacity: 0.78;
        }

        .footer-esaf-email {
          display: inline-block;
          color: #ffffff;
          text-decoration: none;
          font-size: 18px;
          line-height: 1.45;
          font-weight: 500;
          transition: opacity 0.2s ease;
        }

        .footer-esaf-email:hover {
          opacity: 0.78;
        }

        .footer-esaf-bottom {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 34px;
          padding-top: 92px;
        }

        .footer-esaf-socials {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 54px;
        }

        .footer-esaf-social {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          text-decoration: none;
          transition:
            transform 0.2s ease,
            opacity 0.2s ease;
        }

        .footer-esaf-social:hover {
          transform: translateY(-2px);
          opacity: 0.8;
        }

        .footer-esaf-social svg {
          width: 28px;
          height: 28px;
          fill: currentColor;
        }

        .footer-esaf-copyright {
          margin: 0;
          color: #ffffff;
          text-align: center;
          font-size: 16px;
          line-height: 1.5;
          letter-spacing: -0.02em;
        }

        .broker-card-scene {
  position: relative;
  width: 100%;
  perspective: 1400px;
}

.broker-card-toggle {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.broker-card-click-target {
  display: block;
  width: 100%;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.broker-card-inner {
  position: relative;
  width: 100%;
  aspect-ratio: 1.58 / 1;
  transform-style: preserve-3d;
  transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.broker-card-toggle:checked + .broker-card-click-target .broker-card-inner {
  transform: rotateY(180deg);
}

@media (hover: hover) and (pointer: fine) {
  .broker-card-scene:hover .broker-card-inner {
    transform: rotateY(180deg);
  }
}

        .broker-card-face {
          position: absolute;
          inset: 0;
          border-radius: 28px;
          overflow: hidden;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          box-shadow:
            0 24px 60px rgba(15, 23, 42, 0.18),
            0 10px 24px rgba(15, 23, 42, 0.10);
        }

        .broker-card-front-overlay,
        .broker-card-back-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 20px;
        }

        .broker-card-top-info {
          display: flex;
          align-items: center;
          gap: 14px;
          max-width: 80%;
        }

        .broker-card-top-info--rtl {
          flex-direction: row-reverse;
          text-align: right;
          margin-left: auto;
        }

        .broker-card-contact-stack {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          max-width: 240px;
        }

        .broker-card-contact-stack--details {
          width: 100%;
          max-width: 100%;
          flex-direction: column;
          gap: 12px;
        }

        .broker-card-contact-stack--rtl {
          margin-left: auto;
          justify-content: flex-end;
        }

        .broker-contact-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          border-radius: 999px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition:
            transform 0.22s ease,
            opacity 0.22s ease,
            background 0.22s ease,
            color 0.22s ease,
            border-color 0.22s ease;
        }

        .broker-contact-btn:hover {
          transform: translateY(-1px);
        }

        .broker-contact-btn--solid {
          background: rgba(255, 255, 255, 0.96);
          color: #111827;
          border: 1px solid rgba(255, 255, 255, 0.96);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
        }

        .broker-contact-btn--disabled {
          background: rgba(255, 255, 255, 0.58);
          color: rgba(17, 24, 39, 0.62);
          border: 1px solid rgba(255, 255, 255, 0.65);
          cursor: not-allowed;
        }

        .broker-contact-info-card {
          width: 100%;
          border-radius: 18px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        .broker-contact-info-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .broker-contact-info-value {
          color: #0f172a;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.35;
          word-break: break-word;
        }

        .broker-card-avatar {
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          overflow: hidden;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.95);
          background: #ffffff;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.18);
        }

        .broker-card-avatar--large {
          width: 58px;
          height: 58px;
        }

        .broker-card-avatar--back {
          width: 52px;
          height: 52px;
        }

        .broker-card-name {
          margin: 0;
          color: #ffffff;
          font-size: 16px;
          line-height: 1.2;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.28);
        }

        .broker-card-role {
          margin: 4px 0 0;
          color: rgba(255, 255, 255, 0.95);
          font-size: 12px;
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.24);
        }

        .broker-card-back {
          transform: rotateY(180deg);
        }

        .broker-card-back-top {
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 72%;
        }

        .broker-card-back-top--rtl {
          flex-direction: row-reverse;
          text-align: right;
          margin-left: auto;
        }

        .broker-card-name--back {
          font-size: 16px;
        }

        .broker-card-role--back {
          font-size: 12px;
        }

        .broker-card-back-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          max-width: 100%;
        }

        .broker-card-back-actions--rtl {
          justify-content: flex-end;
        }

        .broker-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 30px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.95);
          color: #111827;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
        }

        .broker-chip--off {
          background: rgba(255, 255, 255, 0.58);
          color: rgba(17, 24, 39, 0.62);
        }

        .broker-card-flip-btn {
          position: absolute;
          left: 16px;
          bottom: 16px;
          z-index: 5;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
          color: #111827;
          font-size: 12px;
          font-weight: 800;
          line-height: 1;
          cursor: pointer;
          user-select: none;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition:
            transform 0.2s ease,
            opacity 0.2s ease,
            background 0.2s ease;
        }

        .broker-card-flip-btn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 1);
        }

        .broker-card-flip-btn--rtl {
          left: auto;
          right: 16px;
        }

        .broker-card-flip-btn--back {
          bottom: 16px;
        }

        @media (max-width: 1100px) {
          .footer-esaf-top {
            grid-template-columns: 1fr 1fr;
            gap: 48px 36px;
          }

          .footer-esaf-top-left {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 1024px) {
          .mega-menu-wrap {
            padding: 26px 24px 28px;
            overflow-y: auto;
          }

          .mega-menu-top {
            left: 24px;
            right: 24px;
            top: 24px;
            height: 40px;
          }

          .mega-menu-close {
            right: 0;
            top: 0;
            font-size: 16px;
            gap: 12px;
          }

          .mega-menu-close--rtl {
            right: auto;
            left: 0;
          }

          .mega-menu-close-line {
            width: 34px;
          }

          .mega-menu-logo {
            top: 68px;
          }

          .mega-menu-logo img {
            width: 74px;
            height: 74px;
          }

          .mega-menu-body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: auto;
            padding-top: 160px;
            padding-left: 0;
            padding-right: 0;
            padding-bottom: 180px;
          }

          .mega-menu-left {
            position: absolute;
            left: 24px;
            bottom: 28px;
            width: auto;
            min-width: 0;
          }

          .mega-menu-left-bottom {
            width: 100%;
            padding-bottom: 0;
            gap: 12px;
          }

          .mega-menu-right {
            width: 100%;
            min-width: 0;
            padding-top: 0;
          }

          .mega-menu-main-links {
            gap: 6px;
            max-width: 100%;
          }

          .mega-menu-main-link {
            font-size: clamp(54px, 14.4vw, 86px);
            line-height: 1.05;
            white-space: normal;
          }

          .mega-menu-small-link {
            font-size: 24px;
          }

          .mega-menu-footer-links {
            right: 24px;
            bottom: 12px;
            max-width: 220px;
          }

          .mega-menu-footer-links--rtl {
            right: auto;
            left: 24px;
          }

          .mega-menu-footer-link {
            font-size: 16px;
          }

          .mega-menu-footer-link--email {
            font-size: 15px;
          }
        }

        @media (max-width: 768px) {
          .navienty-logo-mobile,
          .menu-trigger {
            display: none !important;
          }

          .mobile-bottom-nav,
          .mobile-rooms-cta,
          .mobile-rooms-sheet {
            display: block;
          }

          .mega-menu-body {
            padding-bottom: 220px;
          }

          .mega-menu-footer-links {
            left: 24px;
            right: 24px;
            bottom: 76px;
            align-items: flex-start;
            text-align: left;
            max-width: none;
            gap: 8px;
          }

          .mega-menu-footer-links--rtl {
            left: 24px;
            right: 24px;
            align-items: flex-end;
            text-align: right;
          }

          .mega-menu-footer-link {
            font-size: 16px;
          }

          .mega-menu-footer-link--email {
            margin-top: 6px;
            font-size: 14px;
          }

          .footer-esaf-container {
            padding: 48px 22px 28px;
          }

          .footer-esaf-top {
            grid-template-columns: 1fr;
            gap: 34px;
          }

          .footer-esaf-title {
            font-size: 36px;
          }

          .footer-esaf-description {
            margin-top: 20px;
            font-size: 16px;
            line-height: 1.9;
          }

          .footer-esaf-heading {
            font-size: 22px;
            margin-bottom: 14px;
          }

          .footer-esaf-link,
          .footer-esaf-email {
            font-size: 17px;
          }

          .footer-esaf-bottom {
            padding-top: 56px;
            gap: 26px;
          }

          .footer-esaf-socials {
            gap: 34px;
            flex-wrap: wrap;
          }

          .footer-esaf-social svg {
            width: 24px;
            height: 24px;
          }

          .footer-esaf-copyright {
            font-size: 14px;
          }

          .broker-card-scene {
            perspective: 1000px;
          }

          .broker-card-inner {
            aspect-ratio: 1.52 / 1;
          }

          .broker-card-front-overlay,
          .broker-card-back-overlay {
            padding: 16px;
          }

          .broker-card-contact-stack {
            width: 100%;
            max-width: 100%;
            gap: 8px;
          }

          .broker-contact-btn {
            min-height: 36px;
            padding: 8px 12px;
            font-size: 11px;
          }

          .broker-card-name-badge {
            max-width: 72%;
            padding: 9px 10px;
            gap: 10px;
          }

          .broker-card-avatar {
            width: 40px;
            height: 40px;
          }

          .broker-card-avatar--large {
            width: 50px;
            height: 50px;
          }

          .broker-card-name {
            font-size: 13px;
          }

          .broker-card-role {
            font-size: 11px;
          }

          .broker-contact-info-value {
            font-size: 13px;
          }

          .broker-card-flip-btn {
            min-height: 34px;
            padding: 8px 12px;
            font-size: 11px;
          }
        }

        @media (hover: hover) and (pointer: fine) {
          .broker-card-flip-btn {
            display: none;
          }
        }
      `}</style>

      <PropertiesHeader
        homeHref={buildPageLink()}
        searchBarProps={searchBarProps}
        t={{ startSearch: t.startSearch }}
      />

      <div className="mega-menu-overlay">
        <div className="mega-menu-wrap">
          <div className="mega-menu-top">
            <label
              htmlFor="nav-menu-toggle"
              className={`mega-menu-close ${isArabic ? 'mega-menu-close--rtl' : ''}`}
              aria-label="Close menu"
            >
              <span className="mega-menu-close-line" />
              <span>{t.close}</span>
            </label>

            <div className="mega-menu-logo">
              <Link href={buildPageLink()} aria-label="Navienty home">
                <img
                  src="https://i.ibb.co/5gYVYQSR/Navienty-1.jpg"
                  alt="Navienty"
                />
              </Link>
            </div>
          </div>

          <div className="mega-menu-body">
            <div className="mega-menu-left">
              <div className="mega-menu-left-spacer" />

              <div className="mega-menu-left-bottom">
                {socialMenuLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mega-menu-small-link"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="mega-menu-right">
              <div className="mega-menu-main-links">
                {primaryMenuLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="mega-menu-main-link"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div
              className={`mega-menu-footer-links ${
                isArabic ? 'mega-menu-footer-links--rtl' : ''
              }`}
            >
              {menuFooterLinks.map((item) =>
                item.isEmail ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="mega-menu-footer-link mega-menu-footer-link--email"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="mega-menu-footer-link"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <section className="relative">
          <MobilePropertySlider
            images={mobileSliderImages}
            title={propertyTitle}
            isArabic={isArabic}
          />

          <div className="relative -mt-7 rounded-t-[28px] bg-white px-5 pb-8 pt-5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />

            <div className="text-center">
              <h1 className="text-[22px] font-bold leading-8 tracking-tight text-slate-950">
                {propertyTitle}
              </h1>

              {addressText && (
  <div className="mt-4 flex justify-center">
    <PropertyAddress
      address={addressText}
      isArabic={isArabic}
      variant="mobile"
    />
  </div>
)}

              <p className="mt-2 text-center text-[15px] font-medium leading-6 text-slate-700">
                {apartmentSummaryText}
              </p>
            </div>

            <div className="mt-6">
              <BrokerContactCard
                brokerName={brokerName}
                brokerCompany={brokerCompany}
                brokerImage={brokerImage}
                brokerPhone={brokerPhone}
                brokerWhatsapp={brokerWhatsapp}
                brokerEmail={brokerEmail}
                t={t}
                isArabic={isArabic}
              />
            </div>

            <PropertyAmenitiesSection
              isArabic={isArabic}
              title={t.whatThisPlaceOffers}
              showAllLabel={t.showAllAmenities}
              items={offers}
              sectionClassName="mt-6 border-b border-slate-200 pb-8 px-1 sm:px-2"
              showAllButtonClassName="inline-flex h-11 items-center justify-center rounded-[18px] bg-[#054aff] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#043be0]"
            />

            {similarProperties.length > 0 && (
              <section className="px-5 pb-6 pt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-[24px] font-bold tracking-tight text-slate-950">
                    {t.similarProperties}
                  </h2>

                  <Link
  href={buildSearchResultsLink()}
  className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 text-[13px] font-semibold leading-none text-slate-900 whitespace-nowrap shadow-sm transition hover:border-slate-900 hover:bg-slate-50"
>
  <span>{t.viewAll}</span>

  <svg
    viewBox="0 0 24 24"
    className={`h-4 w-4 shrink-0 ${isArabic ? 'rotate-180' : ''}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
  >
    <path
      d="M9 6l6 6-6 6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
</Link>
                </div>

                <div className="-mx-5 overflow-x-auto px-5 hide-scrollbar">
                  <div className="flex gap-4 pb-2">
                    {similarProperties.map((item) => {
                      const itemImages: PropertyImage[] = Array.isArray(
                        item.property_images
                      )
                        ? [...item.property_images].sort(
                            (a, b) => a.sort_order - b.sort_order
                          )
                        : []

                      const itemCoverImage =
                        itemImages.find((image) => image.is_cover)?.image_url ||
                        itemImages[0]?.image_url ||
                        'https://via.placeholder.com/800x500?text=No+Image'

                      const itemTitle = isArabic
                        ? item.title_ar || item.title_en || 'Untitled Property'
                        : item.title_en || item.title_ar || 'Untitled Property'

                      const itemAddress = isArabic
                        ? item.address_ar || item.address_en || ''
                        : item.address_en || item.address_ar || ''

                      const formattedPrice = formatConvertedPrice({
                        priceEgp: item.price_egp,
                        currency: selectedCurrency,
                        exchangeRateFromEgp,
                        locale,
                      })

                      return (
                        <Link
                          key={item.property_id}
                          href={buildPropertyDetailsLink(item.property_id)}
                          className="group w-[280px] shrink-0 overflow-hidden rounded-[28px] bg-[#f6f6f6] shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-1"
                        >
                          <div className="overflow-hidden rounded-[28px]">
                            <img
                              src={itemCoverImage}
                              alt={itemTitle}
                              className="h-[190px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                            />
                          </div>

                          <div className="px-4 pb-5 pt-4">
                            <h3 className="line-clamp-2 text-[18px] font-bold tracking-tight text-slate-900">
                              {itemTitle}
                            </h3>

                            {itemAddress && (
                              <div className="mt-2">
  <PropertyAddress
    address={itemAddress}
    isArabic={isArabic}
    variant="compact"
  />
</div>
                            )}

                            {formattedPrice && (
                              <div className="mt-4 text-[16px] text-slate-800">
                                <span className="font-medium">{t.from}</span>{' '}
                                <span className="font-bold text-[18px] text-emerald-700">
                                  {formattedPrice}
                                </span>{' '}
                                <span className="text-slate-700">
                                  {item.rental_duration === 'daily'
                                    ? t.perDay
                                    : t.perMonth}
                                </span>
                              </div>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}
          </div>
        </section>
      </div>

      <div className="hidden md:block">
        <div className="mx-auto max-w-[1120px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-950 md:text-[22px] lg:text-[26px]">
                {propertyTitle}
              </h1>

              {addressText && (
  <div className="mt-3">
    <PropertyAddress address={addressText} isArabic={isArabic} />
  </div>
)}
            </div>
          </div>

          <section className="mt-5">
            {desktopGalleryImages.length > 0 ? (
              <DesktopPropertyGallery
                images={desktopGalleryImages}
                title={propertyTitle}
                showAllPhotosLabel={t.showAllPhotos}
                isArabic={isArabic}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
                {t.noImages}
              </div>
            )}
          </section>

          <section className="mt-6 border-b border-slate-200 pb-6">
            <div className="max-w-4xl">
              <p className="text-[15px] font-medium text-slate-700 md:text-[16px]">
                {apartmentSummaryText}
              </p>
            </div>
          </section>

          <section className="mt-8">
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <PropertyAmenitiesSection
                isArabic={isArabic}
                title={t.whatThisPlaceOffers}
                showAllLabel={t.showAllAmenities}
                items={offers}
                hideBottomBorder
                sectionClassName="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] xl:min-h-[100%]"
                titleClassName="text-[24px] font-bold tracking-tight text-slate-950"
                gridClassName="mt-6 grid grid-cols-2 gap-x-8 gap-y-5"
                showAllButtonClassName="inline-flex h-11 items-center justify-center rounded-[18px] bg-[#054aff] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#043be0]"
              />

              <section
                className="xl:sticky xl:top-24 space-y-6"
                id="contact-broker"
              >
                <BrokerContactCard
                  brokerName={brokerName}
                  brokerCompany={brokerCompany}
                  brokerImage={brokerImage}
                  brokerPhone={brokerPhone}
                  brokerWhatsapp={brokerWhatsapp}
                  brokerEmail={brokerEmail}
                  t={t}
                  isArabic={isArabic}
                />
              </section>
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-[18px] font-bold tracking-tight text-slate-950 md:text-[22px]">
                {t.availableRooms}
              </h2>
            </div>

            <div className="space-y-3">
              {optionCards.map((option) => {
                const formattedPrice = formatConvertedPrice({
                  priceEgp: option.price,
                  currency: selectedCurrency,
                  exchangeRateFromEgp,
                  locale,
                })

                return (
                  <div
                    key={option.code}
                    className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[18px] font-bold leading-tight tracking-tight text-slate-900 lg:text-[20px]">
                            {option.label}
                          </h3>
                        </div>
                      </div>

                      {formattedPrice && (
                        <div className="shrink-0 text-start lg:text-end">
                          <div className="text-[24px] font-bold leading-none tracking-tight text-[#054aff] lg:text-[26px]">
                            {formattedPrice}
                          </div>
                          <div className="mt-1 text-[13px] text-slate-600">
                            {typedProperty.rental_duration === 'daily'
                              ? t.perDay
                              : t.perMonth}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 pt-0">
                      {!option.isBooked ? (
                        <PropertyEnquireButton
                          propertyId={typedProperty.id}
                          requestedOptionCode={option.code}
                          requestedOptionLabel={option.label}
                          isSignedIn={isSignedIn}
                          loginRedirectUrl={loginRedirectUrl}
                          label={t.enquire}
                          className="inline-flex min-h-[38px] w-full items-center justify-center rounded-full bg-[#054aff] px-4 text-[13px] font-semibold text-white transition hover:opacity-95"
                        />
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex min-h-[38px] w-full cursor-not-allowed items-center justify-center rounded-full bg-slate-200 px-4 text-[13px] font-semibold text-slate-500"
                        >
                          {t.booked}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {similarProperties.length > 0 && (
            <section className="mt-10">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-[22px] font-bold tracking-tight text-slate-950 md:text-[26px]">
                  {t.similarProperties}
                </h2>

                <Link
                  href={buildSearchResultsLink()}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-[13px] font-medium text-slate-900 transition hover:border-slate-900"
                >
                  {t.viewAll}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d={isArabic ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {similarProperties.map((item) => {
                  const itemImages: PropertyImage[] = Array.isArray(
                    item.property_images
                  )
                    ? [...item.property_images].sort(
                        (a, b) => a.sort_order - b.sort_order
                      )
                    : []

                  const itemCoverImage =
                    itemImages.find((image) => image.is_cover)?.image_url ||
                    itemImages[0]?.image_url ||
                    'https://via.placeholder.com/800x500?text=No+Image'

                  const itemTitle = isArabic
                    ? item.title_ar || item.title_en || 'Untitled Property'
                    : item.title_en || item.title_ar || 'Untitled Property'

                  const itemAddress = isArabic
                    ? item.address_ar || item.address_en || ''
                    : item.address_en || item.address_ar || ''

                  const formattedPrice = formatConvertedPrice({
                    priceEgp: item.price_egp,
                    currency: selectedCurrency,
                    exchangeRateFromEgp,
                    locale,
                  })

                  return (
                    <Link
                      key={item.property_id}
                      href={buildPropertyDetailsLink(item.property_id)}
                      className="group overflow-hidden rounded-[22px] bg-[#f6f6f6] shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-1"
                    >
                      <div className="overflow-hidden rounded-[22px]">
                        <img
                          src={itemCoverImage}
                          alt={itemTitle}
                          className="h-[165px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      </div>

                      <div className="px-4 pb-4 pt-3">
                        <h3 className="line-clamp-2 text-[15px] font-bold leading-6 tracking-tight text-slate-900 xl:text-[16px]">
                          {itemTitle}
                        </h3>

                        {itemAddress && (
                          <div className="mt-2">
  <PropertyAddress
    address={itemAddress}
    isArabic={isArabic}
    variant="compact"
  />
</div>
                        )}

                        {formattedPrice && (
                          <div className="mt-3 text-[13px] text-slate-800 xl:text-[14px]">
                            <span className="font-medium">{t.from}</span>{' '}
                            <span className="font-bold text-[15px] text-emerald-700 xl:text-[16px]">
                              {formattedPrice}
                            </span>{' '}
                            <span className="text-slate-700">
                              {item.rental_duration === 'daily'
                                ? t.perDay
                                : t.perMonth}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      <footer className="footer-esaf hidden md:block">
        <div className="footer-esaf-container">
          <div className="footer-esaf-top">
            <div className="footer-esaf-top-left">
              <h2 className={`${squadaOne.className} footer-esaf-title`}>
                {t.footerTitle}
              </h2>
            </div>

            <div>
              <h3 className="footer-esaf-heading">{t.quickLinks}</h3>
              <div className="footer-esaf-links">
                {footerQuickLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="footer-esaf-link"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="footer-esaf-heading">{t.contactUs}</h3>
              <a href={`mailto:${t.footerEmail}`} className="footer-esaf-email">
                {t.footerEmail}
              </a>
            </div>
          </div>

          <div className="footer-esaf-bottom">
            <p className="footer-esaf-copyright">{t.copyright}</p>
          </div>
        </div>
      </footer>

      <div className="mobile-rooms-cta md:hidden">
  <label htmlFor="mobile-rooms-toggle" className="mobile-rooms-cta__button">
    <span>Select Your Room</span>
    
  </label>
</div>

      <div className="mobile-rooms-sheet md:hidden">
        <label htmlFor="mobile-rooms-toggle" className="mobile-rooms-sheet__backdrop" />

        <div className="mobile-rooms-sheet__panel">
          <div className="mobile-rooms-sheet__handle" />

          <div className="mobile-rooms-sheet__header">
  <h2 className="mobile-rooms-sheet__title">{t.availableRooms}</h2>

  <label
    htmlFor="mobile-rooms-toggle"
    className="mobile-rooms-sheet__close"
    aria-label={t.close}
  >
    ×
  </label>
</div>

          <div className="mobile-rooms-sheet__body">
            <div className="space-y-4 pb-4">
              {optionCards.length > 0 ? (
                optionCards.map((option) => {
                  const formattedPrice = formatConvertedPrice({
                    priceEgp: option.price,
                    currency: selectedCurrency,
                    exchangeRateFromEgp,
                    locale,
                  })

                  return (
                    <div
                      key={option.code}
                      className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-[20px] font-bold leading-7 tracking-tight text-slate-900">
                                {option.label}
                              </h3>
                            </div>
                          </div>

                          {formattedPrice && (
                            <div className="shrink-0 text-right">
                              <p className="text-[28px] font-bold leading-none text-[#054aff]">
                                {formattedPrice}
                              </p>
                              <p className="mt-1 text-[14px] text-slate-600">
                                {typedProperty.rental_duration === 'daily'
                                  ? t.perDay
                                  : t.perMonth}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        {!option.isBooked ? (
                          <PropertyEnquireButton
                            propertyId={typedProperty.id}
                            requestedOptionCode={option.code}
                            requestedOptionLabel={option.label}
                            isSignedIn={isSignedIn}
                            loginRedirectUrl={loginRedirectUrl}
                            label={t.enquire}
                            className="inline-flex min-h-[50px] w-full items-center justify-center rounded-full bg-[#054aff] px-5 text-[16px] font-semibold text-white transition hover:opacity-95"
                          />
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex min-h-[50px] w-full cursor-not-allowed items-center justify-center rounded-full bg-slate-200 px-5 text-[16px] font-semibold text-slate-500"
                          >
                            {t.booked}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-5 text-center text-[15px] font-medium text-slate-600">
                  {t.noRooms}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
        <div className="mobile-bottom-nav__inner">
          <Link
            href={buildPageLink()}
            className="mobile-bottom-nav__item mobile-bottom-nav__item--active"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.9}
              stroke="currentColor"
              className="mobile-bottom-nav__icon"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 16l4 4"
              />
            </svg>
            <span className="mobile-bottom-nav__label">{t.explore}</span>
          </Link>

          <Link
            href={buildSimpleNavLink('/community')}
            className="mobile-bottom-nav__item"
          >
            <img
              src="https://i.ibb.co/fzNcyyxw/community-3010762.png"
              alt="Community"
              className="mobile-bottom-nav__icon mobile-bottom-nav__icon--image"
            />
            <span className="mobile-bottom-nav__label">{t.community}</span>
          </Link>

          <Link href={mobileAccountHref} className="mobile-bottom-nav__item">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.9}
              stroke="currentColor"
              className="mobile-bottom-nav__icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 19.125a7.5 7.5 0 0 1 15 0"
              />
            </svg>
            <span className="mobile-bottom-nav__label">
              {mobileAccountLabel}
            </span>
          </Link>
        </div>
      </nav>
    </main>
  )
}