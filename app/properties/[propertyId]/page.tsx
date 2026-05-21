import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Squada_One } from 'next/font/google'
import { createClient } from '../../../src/lib/supabase/server'
import PropertiesHeader from '../PropertiesHeader'
import DesktopPropertyGallery from './DesktopPropertyGallery'
import MobilePropertySlider from './MobilePropertySlider'
import PropertyAmenitiesSection from './PropertyAmenitiesSection'
import PropertyEnquireButton from './PropertyEnquireButton'
import SwipeableSheetWrapper from './SwipeableSheetWrapper'
import './property-page.css'
import PwaInstallBanner from '../../components/PwaInstallBanner'

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

const SITE_URL = 'https://www.navienty.com'
const DEFAULT_OG_IMAGE = '/icon.png'

type SearchParams = {
  rental_duration?: string
  city_id?: string
  university_id?: string
  area_id?: string
  price_range?: string
  lang?: string
  currency?: string
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
  city_id?: string | null
  university_id?: string | null
  area_id?: string | null
  price_egp?: number | string | null
  floor_number?: number | string | null
  rental_duration?: 'daily' | 'monthly' | null
  availability_status?:
    | 'available'
    | 'partially_reserved'
    | 'fully_reserved'
    | 'inactive'
    | null
  gender?: 'boys' | 'girls' | string | null
  bedrooms_count?: number | null
  bathrooms_count?: number | null
  beds_count?: number | null
  property_images?: PropertyImage[]
}

type SimilarProperty = {
  id: string
  property_id: string
  title_en?: string | null
  title_ar?: string | null
  address_en?: string | null
  address_ar?: string | null
  city_id?: string | null
  university_id?: string | null
  area_id?: string | null
  price_egp?: number | string | null
  rental_duration?: 'daily' | 'monthly' | null
  gender?: 'boys' | 'girls' | string | null
  property_images?: PropertyImage[]
  property_rooms?: any[]
  property_sellable_options?: any[]
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
type NormalizedGender = 'boys' | 'girls' | null

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
    book: 'Enquire',
    booked: 'Booked',
    noRooms: 'No rooms available for this property.',
    apartmentDetails: 'Apartment details',
    floorNumber: 'Floor',
    groundFloor: 'Ground floor',
    bedroomsCount: 'Bedrooms',
    bathroomsCount: 'Bathrooms',
    bedsCount: 'Beds',
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
    boysMeta: 'Boys only',
    girlsMeta: 'Girls only',
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
    area: 'Area',
    duration: 'Duration',
    searchCities: 'Search cities',
    searchAreas: 'Search areas',
    chooseUniversity: 'Choose university',
    chooseArea: 'Choose area',
    chooseDuration: 'Choose duration',
    selectCity: 'Select city',
    selectUniversity: 'Select university',
    selectArea: 'Select area',
    selectDuration: 'Select duration',
    anyCity: 'Any city',
    anyUniversity: 'Any university',
    anyArea: 'Any area',
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
    selectYourRoom: 'Select Your Room',
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
    book: 'احجز',
    booked: 'محجوز',
    noRooms: 'لا توجد غرف متاحة لهذا العقار.',
    apartmentDetails: 'بيانات الشقة',
    floorNumber: 'الدور',
    groundFloor: 'الدور الأرضي',
    bedroomsCount: 'عدد الغرف',
    bathroomsCount: 'عدد الحمامات',
    bedsCount: 'عدد السراير',
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
    boysMeta: 'ولاد فقط',
    girlsMeta: 'بنات فقط',
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
    area: 'المنطقة',
    duration: 'المدة',
    searchCities: 'ابحث عن مدينة',
    searchAreas: 'ابحث عن منطقة',
    chooseUniversity: 'اختر الجامعة',
    chooseArea: 'اختر المنطقة',
    chooseDuration: 'اختر المدة',
    selectCity: 'اختر المدينة',
    selectUniversity: 'اختر الجامعة',
    selectArea: 'اختر المنطقة',
    selectDuration: 'اختر المدة',
    anyCity: 'أي مدينة',
    anyUniversity: 'أي جامعة',
    anyArea: 'أي منطقة',
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
    community: 'المجتمع',
    account: 'الحساب',
    mobileLogin: 'تسجيل الدخول',
    selectYourRoom: 'اختر غرفتك',
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

function normalizeGender(value?: string | null): NormalizedGender {
  const normalized = value?.toLowerCase().trim()

  if (normalized === 'boys') return 'boys'
  if (normalized === 'girls') return 'girls'

  return null
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

function getAbsoluteUrl(url?: string | null) {
  const value = url?.trim()

  if (!value) return `${SITE_URL}${DEFAULT_OG_IMAGE}`
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  if (value.startsWith('/')) return `${SITE_URL}${value}`

  return value
}

function getSortedSeoImages(images?: Array<Partial<PropertyImage>> | null) {
  const validImages =
    images
      ?.map((image, index) => ({
        imageUrl: image?.image_url?.trim() ?? '',
        isCover: image?.is_cover === true,
        sortOrder:
          typeof image?.sort_order === 'number'
            ? image.sort_order
            : Number.POSITIVE_INFINITY,
        originalIndex: index,
      }))
      .filter((image) => Boolean(image.imageUrl)) ?? []

  return validImages
    .sort((a, b) => {
      if (a.isCover !== b.isCover) return a.isCover ? -1 : 1

      const sortOrderDiff = a.sortOrder - b.sortOrder
      if (sortOrderDiff !== 0) return sortOrderDiff

      return a.originalIndex - b.originalIndex
    })
    .map((image) => getAbsoluteUrl(image.imageUrl))
}

function getSeoCoverImage(property: any) {
  return getSortedSeoImages(property?.property_images)[0] || `${SITE_URL}${DEFAULT_OG_IMAGE}`
}

function getCanonicalPropertyUrl(propertyId: string) {
  return `${SITE_URL}/properties/${propertyId}`
}

function getPropertySeoTitle(property: any) {
  const title = property?.title_ar || property?.title_en || 'سكن طلاب'

  return `${title} | Navienty`
}

function getPropertySeoDescription(property: any) {
  const title = property?.title_ar || property?.title_en || 'سكن طلاب'
  const address = property?.address_ar || property?.address_en
  const minPrice = getPropertyMinPrice(property)
  const priceText = minPrice
    ? ` ابتداءً من ${new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        maximumFractionDigits: 0,
      }).format(minPrice)}${property?.rental_duration === 'daily' ? ' يوميًا' : ' شهريًا'}.`
    : ''
  const locationText = address ? ` في ${address}.` : '.'

  return `${title}${locationText}${priceText} قارن تفاصيل السكن والصور وتواصل مع المضيف عبر Navienty، بدون أي عمولة على الطالب.`
}

async function getPublishedPropertyForSeo(propertyId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('properties')
    .select(`
      id,
      property_id,
      title_en,
      title_ar,
      address_en,
      address_ar,
      price_egp,
      rental_duration,
      availability_status,
      gender,
      bedrooms_count,
      bathrooms_count,
      beds_count,
      property_images (
        image_url,
        is_cover,
        sort_order
      ),
      property_rooms (
        status,
        is_active,
        property_room_sellable_options (
          price_egp,
          is_active
        )
      ),
      property_sellable_options (
        price_egp,
        is_active
      )
    `)
    .eq('property_id', propertyId)
    .eq('admin_status', 'published')
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    throw new Error(`Property metadata query failed: ${error.message}`)
  }

  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ propertyId: string }>
}): Promise<Metadata> {
  const { propertyId } = await params
  const property = await getPublishedPropertyForSeo(propertyId)

  if (!property) {
    return {
      title: 'سكن غير متاح | Navienty',
      description: 'هذا السكن غير متاح حاليًا على Navienty.',
      robots: {
        index: false,
        follow: true,
      },
    }
  }

  const canonicalUrl = getCanonicalPropertyUrl(property.property_id)
  const title = getPropertySeoTitle(property)
  const description = getPropertySeoDescription(property)
  const image = getSeoCoverImage(property)
  const shouldIndex = property.availability_status !== 'inactive'

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: shouldIndex,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Navienty',
      locale: 'ar_EG',
      type: 'website',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: property.title_ar || property.title_en || 'Navienty',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}


// دالة جديدة لاستخراج أقل سعر من العقار (من الغرف أو خيارات السكن)
function getPropertyMinPrice(property: any): number | null {
  const prices: number[] = []

  if (Array.isArray(property.property_rooms)) {
    property.property_rooms.forEach((room: any) => {
      if (
        room.is_active !== false &&
        room.status !== 'inactive' &&
        room.status !== 'fully_reserved'
      ) {
        if (Array.isArray(room.property_room_sellable_options)) {
          room.property_room_sellable_options.forEach((opt: any) => {
            if (opt.is_active !== false && opt.price_egp != null) {
              const p = toNumber(opt.price_egp)
              if (p !== null && p > 0) prices.push(p)
            }
          })
        }
      }
    })
  }

  if (Array.isArray(property.property_sellable_options)) {
    property.property_sellable_options.forEach((opt: any) => {
      if (opt.is_active !== false && opt.price_egp != null) {
        const p = toNumber(opt.price_egp)
        if (p !== null && p > 0) prices.push(p)
      }
    })
  }

  if (prices.length > 0) {
    return Math.min(...prices)
  }

  return toNumber(property.price_egp)
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

function formatFloorLabel({
  value,
  language,
  t,
}: {
  value: number
  language: SupportedLanguage
  t: (typeof TRANSLATIONS)['en'] | (typeof TRANSLATIONS)['ar']
}) {
  if (value === 0) return t.groundFloor
  return language === 'ar' ? `${t.floorNumber} ${value}` : `${t.floorNumber} ${value}`
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

function GenderMeta({
  gender,
  language,
  className = '',
  showDot = true,
}: {
  gender?: string | null
  language: SupportedLanguage
  className?: string
  showDot?: boolean
}) {
  const normalizedGender = normalizeGender(gender)

  if (!normalizedGender) return null

  const label =
    normalizedGender === 'boys'
      ? TRANSLATIONS[language].boysMeta
      : TRANSLATIONS[language].girlsMeta

  return (
    <span className={`property-meta-gender ${className}`}>
      {showDot && <span className="property-meta-dot" />}
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

function BrokerContactCard({
  brokerName,
  brokerImage,
  brokerPhone,
  brokerWhatsapp,
  t,
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
    <div className="broker-card-scene" dir="ltr">
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
              <div className="broker-card-top-info absolute left-4 top-3">
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

              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-left">
                <div className="flex flex-col gap-3">
                  {cleanedPhone && (
                    <div className="flex flex-row items-center gap-2 rounded-xl bg-white/90 px-4 py-2 shadow-md backdrop-blur">
                      <PhoneIcon />
                      <span className="font-semibold text-sm text-gray-800">
                        {cleanedPhone}
                      </span>
                    </div>
                  )}

                  {cleanedWhatsapp && (
                    <div className="flex flex-row items-center gap-2 rounded-xl bg-white/90 px-4 py-2 shadow-md backdrop-blur">
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
              <div className="broker-card-back-top" />
              <div className="broker-card-back-actions" />
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
    area_id,
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
      city_id,
      university_id,
      area_id,
      price_egp,
      floor_number,
      rental_duration,
      availability_status,
      gender,
      bedrooms_count,
      bathrooms_count,
      beds_count,
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
    if (city_id || typedProperty.city_id) {
      params.set('city_id', city_id || String(typedProperty.city_id))
    }
    if (typedProperty.university_id) {
      params.set('university_id', String(typedProperty.university_id))
    } else if (university_id) {
      params.set('university_id', university_id)
    }
    if (area_id || typedProperty.area_id) {
      params.set('area_id', area_id || String(typedProperty.area_id))
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

  const hasAnyActiveRoomReservation = Array.from(
    roomOccupancyByRoomId.values()
  ).some((roomState) => roomState.blocksEntireProperty)

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

  const offers = [...amenityItems, ...facilityItems, ...billItems].sort(
    (a, b) => {
      const categoryA = `${a.category_en || ''}-${a.sort_order ?? 0}-${a.name_en || ''}`
      const categoryB = `${b.category_en || ''}-${b.sort_order ?? 0}-${b.name_en || ''}`
      return categoryA.localeCompare(categoryB)
    }
  )

  let similarProperties: SimilarProperty[] = []

  if (typedProperty.university_id) {
    // تم تعديل هذا الاستعلام لجلب أسعار الغرف بدلاً من سعر العقار بالكامل
    const { data: similarData, error: similarError } = await supabase
      .from('properties')
      .select(`
        id,
        property_id,
        title_en,
        title_ar,
        address_en,
        address_ar,
        city_id,
        university_id,
        area_id,
        price_egp,
        rental_duration,
        gender,
        property_images (
          image_url,
          is_cover,
          sort_order
        ),
        property_rooms (
          status,
          is_active,
          property_room_sellable_options (
            price_egp,
            is_active
          )
        ),
        property_sellable_options (
          price_egp,
          is_active
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

    const nextAreaId =
      updates.area_id !== undefined ? updates.area_id : area_id

    const nextPriceRange =
      updates.price_range !== undefined ? updates.price_range : price_range

    const nextLang =
      updates.lang !== undefined ? updates.lang : selectedLanguage

    const nextCurrency =
      updates.currency !== undefined ? updates.currency : selectedCurrency

    if (nextRentalDuration) params.set('rental_duration', nextRentalDuration)
    if (nextCityId) params.set('city_id', nextCityId)
    if (nextUniversityId) params.set('university_id', nextUniversityId)
    if (nextAreaId) params.set('area_id', nextAreaId)
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

    if (city_id || typedProperty.city_id) {
      params.set('city_id', city_id || String(typedProperty.city_id))
    }

    if (typedProperty.university_id) {
      params.set('university_id', String(typedProperty.university_id))
    } else if (university_id) {
      params.set('university_id', university_id)
    }

    if (area_id || typedProperty.area_id) {
      params.set('area_id', area_id || String(typedProperty.area_id))
    }

    if (price_range) params.set('price_range', price_range)
    params.set('lang', selectedLanguage)
    params.set('currency', selectedCurrency)

    const queryString = params.toString()
    return queryString ? `/properties/search?${queryString}` : '/properties/search'
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

  const primaryMenuLinks = [
    {
      label: isSignedIn ? t.account : t.login,
      href: isSignedIn
        ? buildSimpleNavLink('/account')
        : buildSimpleNavLink('/account-login'),
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
    : buildSimpleNavLink('/account-login')

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

  const bedroomsCount = getCountValue(typedProperty.bedrooms_count)
  const bedsCount = getCountValue(typedProperty.beds_count)
  const bathroomsCount = getCountValue(typedProperty.bathrooms_count)
  const floorNumber = getCountValue(typedProperty.floor_number)

  const apartmentSummaryItems = [
    formatFloorLabel({
      value: floorNumber,
      language: selectedLanguage,
      t,
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

  const canonicalUrl = getCanonicalPropertyUrl(typedProperty.property_id)
  const structuredImages = desktopGalleryImages
    .filter(Boolean)
    .slice(0, 8)
    .map((imageUrl) => getAbsoluteUrl(imageUrl))

  const seoPriceCandidates = optionCards
    .map((option) => option.price)
    .filter((price): price is number => typeof price === 'number' && price > 0)

  const seoPriceEgp =
    seoPriceCandidates.length > 0
      ? Math.min(...seoPriceCandidates)
      : toNumber(typedProperty.price_egp)

  const propertyAvailability =
    typedProperty.availability_status === 'fully_reserved'
      ? 'https://schema.org/SoldOut'
      : typedProperty.availability_status === 'partially_reserved'
        ? 'https://schema.org/LimitedAvailability'
        : typedProperty.availability_status === 'inactive'
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock'

  const propertyDescription = getPropertySeoDescription({
    ...typedProperty,
    property_rooms: rooms.map((room) => ({
      ...room,
      property_room_sellable_options: room.room_sellable_options,
    })),
    property_sellable_options: propertySellableOptions,
  })

  const propertyJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: propertyTitle,
    image: structuredImages.length > 0 ? structuredImages : [getAbsoluteUrl(coverImage)],
    description: propertyDescription,
    brand: {
      '@type': 'Brand',
      name: 'Navienty',
    },
    audience: {
      '@type': 'Audience',
      audienceType: 'University students',
    },
    category: 'Student accommodation',
    offers: seoPriceEgp
      ? {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'EGP',
          price: seoPriceEgp,
          availability: propertyAvailability,
        }
      : undefined,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'بدون عمولة على الطالب',
        value: 'نعم',
      },
      typedProperty.gender
        ? {
            '@type': 'PropertyValue',
            name: 'مناسب لـ',
            value: normalizeGender(typedProperty.gender) === 'girls' ? 'طالبات' : 'طلاب',
          }
        : undefined,
      typedProperty.rental_duration
        ? {
            '@type': 'PropertyValue',
            name: 'مدة السكن',
            value: typedProperty.rental_duration === 'daily' ? 'يومي' : 'شهري',
          }
        : undefined,
    ].filter(Boolean),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'سكن الطلاب',
        item: `${SITE_URL}/properties`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: propertyTitle,
        item: canonicalUrl,
      },
    ],
  }

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="relative min-h-screen bg-white pb-32 text-gray-700 dark:bg-[#050816] dark:text-slate-100 md:pb-0"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(propertyJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      <PwaInstallBanner />
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
        /* لمنع تمرير الخلفية عند فتح القائمة */
        body:has(#mobile-rooms-toggle:checked) {
          overflow: hidden;
        }

        @media (prefers-color-scheme: dark) {
          .property-address {
            color: #cbd5e1;
          }

          .property-address__text {
            color: #cbd5e1;
          }

          .property-address__icon-wrap {
            background: rgba(96, 165, 250, 0.10);
          }

          .property-meta-gender {
            color: #94a3b8;
          }

          .property-meta-dot {
            background: currentColor;
            opacity: 0.55;
          }

          .broker-card-name {
            color: #f8fafc;
          }

          .mobile-bottom-nav {
            background: rgba(11, 18, 32, 0.96);
            border-top-color: rgba(255, 255, 255, 0.10);
            box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.28);
          }

          .mobile-bottom-nav__item {
            color: #94a3b8;
          }

          .mobile-bottom-nav__item:hover {
            color: #f8fafc;
          }

          .mobile-bottom-nav__item--active {
            color: #60a5fa;
          }

          .mobile-bottom-nav__item--active .mobile-bottom-nav__icon--image {
            filter: brightness(0) saturate(100%) invert(63%) sepia(98%)
              saturate(961%) hue-rotate(181deg) brightness(101%) contrast(96%);
          }

          .mobile-bottom-nav__icon--image {
            filter: brightness(0) invert(1);
            opacity: 0.72;
          }

          .mobile-bottom-nav__item:hover .mobile-bottom-nav__icon--image,
          .mobile-bottom-nav__item--active .mobile-bottom-nav__icon--image {
            filter: brightness(0) invert(1);
            opacity: 1;
          }

          .mobile-rooms-sheet__backdrop {
            background: rgba(0, 0, 0, 0.62);
          }

          .mobile-rooms-sheet__panel {
            background: #050816;
            color: #f8fafc;
            border-top: 1px solid rgba(255, 255, 255, 0.10);
            box-shadow: 0 -24px 60px rgba(0, 0, 0, 0.52);
          }

          .mobile-rooms-sheet__handle {
            background: rgba(255, 255, 255, 0.18);
          }

          .mobile-rooms-sheet__header {
            border-bottom-color: rgba(255, 255, 255, 0.10);
          }

          .mobile-rooms-sheet__title {
            color: #f8fafc;
          }

          .mobile-rooms-sheet__close {
            background: #111827;
            color: #f8fafc;
          }

          .mobile-rooms-sheet__close:hover {
            background: #1f2937;
          }

          .mobile-rooms-sheet__body {
            background: #050816;
          }

          .footer-esaf {
            background: #054aff;
          }
        }
      `}</style>

      <PropertiesHeader
        homeHref={buildPageLink()}
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

          <div className="relative -mt-7 rounded-t-[28px] bg-white px-5 pb-8 pt-5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] dark:bg-[#050816] dark:shadow-[0_-10px_28px_rgba(0,0,0,0.35)]">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200 dark:bg-white/15" />

            <div className="text-center">
              <h1 className="text-[22px] font-bold leading-8 tracking-tight text-slate-950 dark:text-slate-100">
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

              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[15px] font-medium leading-6 text-slate-700 dark:text-slate-300">
                <span>{apartmentSummaryText}</span>
                <GenderMeta
                  gender={typedProperty.gender}
                  language={selectedLanguage}
                />
              </div>
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
              sectionClassName="mt-6 border-b border-slate-200 pb-8 px-1 sm:px-2 dark:border-white/10"
              showAllButtonClassName="inline-flex h-11 items-center justify-center rounded-[18px] bg-[#054aff] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#043be0]"
            />

            {similarProperties.length > 0 && (
              <section className="px-5 pb-6 pt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-[24px] font-bold tracking-tight text-slate-950 dark:text-slate-100">
                    {t.similarProperties}
                  </h2>

                  <Link
                    href={buildSearchResultsLink()}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 text-[13px] font-semibold leading-none text-slate-900 whitespace-nowrap shadow-sm transition hover:border-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b1220] dark:text-slate-100 dark:hover:border-white/20 dark:hover:bg-[#111827]"
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

                      // التعديل: هنا سيتم حساب أقل سعر للغرف بدلاً من عرض سعر الشقة بالكامل
                      const displayPriceEgp = getPropertyMinPrice(item)

                      const formattedPrice = formatConvertedPrice({
                        priceEgp: displayPriceEgp,
                        currency: selectedCurrency,
                        exchangeRateFromEgp,
                        locale,
                      })

                      return (
                        <Link
                          key={item.property_id}
                          href={buildPropertyDetailsLink(item.property_id)}
                          className="group w-[280px] shrink-0 overflow-hidden rounded-[28px] bg-[#f6f6f6] shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 dark:bg-[#0b1220] dark:shadow-[0_14px_34px_rgba(0,0,0,0.32)]"
                        >
                          <div className="overflow-hidden rounded-[28px]">
                            <img
                              src={itemCoverImage}
                              alt={itemTitle}
                              className="h-[190px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                            />
                          </div>

                          <div className="px-4 pb-5 pt-4">
                            <h3 className="line-clamp-2 text-[18px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
                              {itemTitle}
                            </h3>

                            <div className="mt-2">
                              <GenderMeta
                                gender={item.gender}
                                language={selectedLanguage}
                                className="property-meta-gender--compact"
                                showDot={false}
                              />
                            </div>

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
                              <div className="mt-4 text-[16px] text-slate-800 dark:text-slate-300">
                                <span className="font-medium">{t.from}</span>{' '}
                                <span className="font-bold text-[18px] text-emerald-700 dark:text-emerald-400">
                                  {formattedPrice}
                                </span>{' '}
                                <span className="text-slate-700 dark:text-slate-400">
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
              <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100 md:text-[22px] lg:text-[26px]">
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
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600 dark:border-white/15 dark:bg-[#0b1220] dark:text-slate-400">
                {t.noImages}
              </div>
            )}
          </section>

          <section className="mt-6 border-b border-slate-200 pb-6 dark:border-white/10">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-medium text-slate-700 dark:text-slate-300 md:text-[16px]">
                <span>{apartmentSummaryText}</span>
                <GenderMeta
                  gender={typedProperty.gender}
                  language={selectedLanguage}
                />
              </div>
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
                sectionClassName="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_18px_42px_rgba(0,0,0,0.32)] xl:min-h-[100%]"
                titleClassName="text-[24px] font-bold tracking-tight text-slate-950 dark:text-slate-100"
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
              <h2 className="text-[18px] font-bold tracking-tight text-slate-950 dark:text-slate-100 md:text-[22px]">
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
                    className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_10px_26px_rgba(0,0,0,0.30)]"
                  >
                    <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[18px] font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100 lg:text-[20px]">
                            {option.label}
                          </h3>
                        </div>
                      </div>

                      {formattedPrice && (
                        <div className="shrink-0 text-start lg:text-end">
                          <div className="text-[24px] font-bold leading-none tracking-tight text-[#054aff] lg:text-[26px]">
                            {formattedPrice}
                          </div>
                          <div className="mt-1 text-[13px] text-slate-600 dark:text-slate-400">
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
                          label={t.book}
                          className="inline-flex min-h-[38px] w-full items-center justify-center rounded-full bg-[#054aff] px-4 text-[13px] font-semibold text-white transition hover:opacity-95"
                        />
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex min-h-[38px] w-full cursor-not-allowed items-center justify-center rounded-full bg-slate-200 px-4 text-[13px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-500"
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
                <h2 className="text-[22px] font-bold tracking-tight text-slate-950 dark:text-slate-100 md:text-[26px]">
                  {t.similarProperties}
                </h2>

                <Link
                  href={buildSearchResultsLink()}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-[13px] font-medium text-slate-900 transition hover:border-slate-900 dark:border-white/10 dark:bg-[#0b1220] dark:text-slate-100 dark:hover:border-white/25"
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

                  // التعديل هنا أيضاً ليطابق نسخة الموبايل (أقل سعر للسرير)
                  const displayPriceEgp = getPropertyMinPrice(item)

                  const formattedPrice = formatConvertedPrice({
                    priceEgp: displayPriceEgp,
                    currency: selectedCurrency,
                    exchangeRateFromEgp,
                    locale,
                  })

                  return (
                    <Link
                      key={item.property_id}
                      href={buildPropertyDetailsLink(item.property_id)}
                      className="group overflow-hidden rounded-[22px] bg-[#f6f6f6] shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 dark:bg-[#0b1220] dark:shadow-[0_12px_30px_rgba(0,0,0,0.30)]"
                    >
                      <div className="overflow-hidden rounded-[22px]">
                        <img
                          src={itemCoverImage}
                          alt={itemTitle}
                          className="h-[165px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      </div>

                      <div className="px-4 pb-4 pt-3">
                        <h3 className="line-clamp-2 text-[15px] font-bold leading-6 tracking-tight text-slate-900 dark:text-slate-100 xl:text-[16px]">
                          {itemTitle}
                        </h3>

                        <div className="mt-1.5">
                          <GenderMeta
                            gender={item.gender}
                            language={selectedLanguage}
                            className="property-meta-gender--compact"
                            showDot={false}
                          />
                        </div>

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
                            <span className="text-slate-700 dark:text-slate-400">
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
          <span>{t.selectYourRoom}</span>
        </label>
      </div>

      <div className="mobile-rooms-sheet md:hidden">
        <label
          htmlFor="mobile-rooms-toggle"
          className="mobile-rooms-sheet__backdrop"
        />

        <SwipeableSheetWrapper>
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

          <div className="mobile-rooms-sheet__body overflow-y-auto max-h-[75vh] scroll-smooth overscroll-contain">
            <div className="space-y-4 pb-24">
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
                      className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_18px_42px_rgba(0,0,0,0.34)]"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-[20px] font-bold leading-7 tracking-tight text-slate-900 dark:text-slate-100">
                                {option.label}
                              </h3>
                            </div>
                          </div>

                          {formattedPrice && (
                            <div className="shrink-0 text-right">
                              <p className="text-[28px] font-bold leading-none text-[#054aff]">
                                {formattedPrice}
                              </p>
                              <p className="mt-1 text-[14px] text-slate-600 dark:text-slate-400">
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
                            label={t.book}
                            className="inline-flex min-h-[50px] w-full items-center justify-center rounded-full bg-[#054aff] px-5 text-[16px] font-semibold text-white transition hover:opacity-95"
                          />
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex min-h-[50px] w-full cursor-not-allowed items-center justify-center rounded-full bg-slate-200 px-5 text-[16px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-500"
                          >
                            {t.booked}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-5 text-center text-[15px] font-medium text-slate-600 dark:border-white/10 dark:bg-[#0b1220] dark:text-slate-400">
                  {t.noRooms}
                </div>
              )}
            </div>
          </div>
        </SwipeableSheetWrapper>
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