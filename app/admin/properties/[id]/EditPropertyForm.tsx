'use client'

import Link from 'next/link'
import mapboxgl from 'mapbox-gl'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  createPropertyImageUploadSignedUrlAction,
  updatePropertyAction,
} from './actions'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

type City = { id: string; name_en: string; name_ar: string }
type University = { id: string; city_id: string; name_en: string; name_ar: string }
type Broker = { id: string; full_name: string; company_name?: string | null }

type OwnerServiceArea = {
  id?: string | number
  owner_id?: string
  city_id: string | null
  university_id: string | null
  is_active?: boolean | null
}

type Owner = {
  id: string
  full_name: string
  phone_number?: string | null
  whatsapp_number?: string | null
  email?: string | null
  company_name?: string | null
  is_active?: boolean | null
  property_owner_service_areas?: OwnerServiceArea[] | null
  service_areas?: OwnerServiceArea[] | null
}

type Amenity = {
  id: string
  name_en: string
  name_ar: string
  icon_key?: string | null
  icon_url?: string | null
  category_en?: string | null
  category_ar?: string | null
  sort_order?: number
  is_active?: boolean
}

type Facility = {
  id: number
  name_en: string
  name_ar: string
  icon_url?: string | null
  sort_order?: number
  is_active?: boolean
}

type BillType = {
  id: number
  name_en: string
  name_ar: string
  icon_url?: string | null
  sort_order?: number
  is_active?: boolean
}

type MapboxAddressSuggestion = {
  id: string
  place_name: string
  text?: string
  center: [number, number]
}

type PropertyImage = {
  id: string
  image_url: string
  storage_path?: string | null
  is_cover: boolean
  sort_order: number
}

type RoomBed = {
  id: string
  status: 'available' | 'reserved' | 'occupied' | 'maintenance' | 'inactive'
  price_egp?: number | null
}

type RoomSellableOption = {
  id: string
  code:
    | 'single_room'
    | 'double_room'
    | 'triple_room'
    | 'full_apartment'
    | string
  name_en?: string | null
  name_ar?: string | null
  occupancy_size?: number | null
  pricing_mode?: 'per_person' | 'per_room' | null
  price_egp?: number | null
  consumes_beds_count?: number | null
  is_exclusive?: boolean | null
  is_active?: boolean | null
  sort_order?: number | null
}

type PropertyRoom = {
  id: string
  room_name: string
  room_name_ar: string | null
  room_type: 'single' | 'double' | 'triple' | 'quad' | 'custom'
  base_price_egp: number | null
  private_room_price_egp?: number | null
  shared_bed_price_egp?: number | null
  private_bathroom: boolean
  status: 'available' | 'partially_reserved' | 'fully_reserved' | 'inactive'
  sort_order: number
  room_beds?: RoomBed[] | null
  room_sellable_options?: RoomSellableOption[] | null
}

type Property = {
  id: string
  property_id: string
  title_en: string
  title_ar: string
  city_id: string
  university_id: string
  broker_id: string
  owner_id: string | null
  price_egp: number
  rental_duration: 'daily' | 'monthly'
  availability_status: 'available' | 'partially_reserved' | 'fully_reserved' | 'inactive'
  address_en: string | null
  address_ar: string | null
  latitude: number | null
  longitude: number | null
  bedrooms_count: number | null
  bathrooms_count: number | null
  beds_count: number | null
  guests_count: number | null
  gender: 'boys' | 'girls' | null
  airbnb_price_min: number | null
  airbnb_price_max: number | null
  smoking_policy: 'smoking_allowed' | 'non_smoking' | null
  admin_status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'
  is_active: boolean
  floor_number?: number | null
  is_featured?: boolean | null
  featured_rank?: number | null
  featured_until?: string | null
  featured_at?: string | null
  featured_by_admin_id?: string | null
}

type PropertyBookingRequest = {
  id: string
  property_id: string
  broker_id: string | null
  user_id: string | null
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  customer_whatsapp: string | null
  preferred_start_date: string | null
  preferred_end_date: string | null
  message: string | null
  status: 'new' | 'contacted' | 'in_progress' | 'converted' | 'cancelled' | string
  created_at: string
  updated_at: string
}

type RoomForm = {
  id: string
  room_name: string
  room_name_ar: string
  room_type: 'single' | 'double' | 'triple' | 'quad' | 'custom'
  rental_duration: 'daily' | 'monthly'
  beds_count: string
  private_bathroom: boolean
  is_reserved: boolean
  single_room_option_id: string
  single_room_enabled: boolean
  single_room_price_egp: string
  double_room_option_id: string
  double_room_enabled: boolean
  double_room_price_egp: string
  triple_room_option_id: string
  triple_room_enabled: boolean
  triple_room_price_egp: string
}

type ImageFileItem = {
  file: File | null
  previewUrl: string
}

type Props = {
  property: Property
  cities: City[]
  universities: University[]
  brokers: Broker[]
  owners: Owner[]
  amenities: Amenity[]
  facilities: Facility[]
  billTypes: BillType[]
  images: PropertyImage[]
  selectedAmenityIds: string[]
  selectedFacilityIds: number[]
  selectedBillTypeIds: number[]
  rooms: PropertyRoom[]
  bookingRequests: PropertyBookingRequest[]
  canChangeBroker: boolean
  canChangeAdminStatus: boolean
}

type DisplayStep = {
  id: number
  title: string
  navigateStep: number
  startStep: number
  endStep: number
}

type CoverSelection =
  | { kind: 'existing'; index: number }
  | { kind: 'new'; index: number }

type RoomOptionCode = 'single_room' | 'double_room' | 'triple_room'

type EnabledRoomOption = {
  code: RoomOptionCode
  price: string
}

type AmenityCategoryGroup = {
  key: string
  title: string
  items: Amenity[]
}


type SignedPropertyImageUpload = {
  image_url: string
  storage_path: string
  token: string
}

const PROPERTY_IMAGES_BUCKET = 'property-images'
const PROPERTY_IMAGE_UPLOAD_BATCH_SIZE = 4

function getBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase browser environment variables are missing. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

const FORM_STEPS = [
  { id: 1, title: 'Basic Info' },
  { id: 2, title: 'Basic Info' },
  { id: 3, title: 'Photos' },
  { id: 4, title: 'Property Details' },
  { id: 5, title: 'Rooms & Pricing' },
  { id: 6, title: 'Property Featured' },
  { id: 7, title: 'Review' },
]

const DISPLAY_STEPS: DisplayStep[] = [
  { id: 1, title: 'Basic Info', startStep: 1, endStep: 2, navigateStep: 1 },
  { id: 2, title: 'Photos', startStep: 3, endStep: 3, navigateStep: 3 },
  { id: 3, title: 'Property Details', startStep: 4, endStep: 4, navigateStep: 4 },
  { id: 4, title: 'Rooms & Pricing', startStep: 5, endStep: 5, navigateStep: 5 },
  { id: 5, title: 'Property Featured', startStep: 6, endStep: 6, navigateStep: 6 },
  { id: 6, title: 'Review', startStep: 7, endStep: 7, navigateStep: 7 },
]

const initialRoom: RoomForm = {
  id: '',
  room_name: '',
  room_name_ar: '',
  room_type: 'single',
  rental_duration: 'monthly',
  beds_count: '1',
  private_bathroom: false,
  is_reserved: false,
  single_room_option_id: '',
  single_room_enabled: false,
  single_room_price_egp: '',
  double_room_option_id: '',
  double_room_enabled: false,
  double_room_price_egp: '',
  triple_room_option_id: '',
  triple_room_enabled: false,
  triple_room_price_egp: '',
}

function normalizeNumberString(value: string) {
  return value.replace(/,/g, '').trim()
}

function isValidPrice(value: string) {
  const normalized = normalizeNumberString(value)
  if (!normalized) return false
  const num = Number(normalized)
  return Number.isFinite(num) && num > 0
}

function isValidNonNegativeInt(value: string) {
  const normalized = normalizeNumberString(value)
  if (!normalized) return false
  const num = Number(normalized)
  return Number.isInteger(num) && num >= 0
}

function isValidPositiveInt(value: string) {
  const normalized = normalizeNumberString(value)
  if (!normalized) return false
  const num = Number(normalized)
  return Number.isInteger(num) && num > 0
}

function getBedsCountNumber(value: string) {
  const normalized = normalizeNumberString(value)
  if (!normalized) return 0
  const num = Number(normalized)
  return Number.isInteger(num) && num > 0 ? num : 0
}

function getAvailabilityStatusFromRooms(
  rooms: RoomForm[]
): 'available' | 'partially_reserved' | 'fully_reserved' {
  if (rooms.length === 0) return 'available'

  const reservedCount = rooms.filter((room) => room.is_reserved).length

  if (reservedCount === 0) return 'available'
  if (reservedCount === rooms.length) return 'fully_reserved'
  return 'partially_reserved'
}

function formatAvailabilityStatusLabel(
  status: 'available' | 'partially_reserved' | 'fully_reserved' | 'inactive'
) {
  switch (status) {
    case 'available':
      return 'Available'
    case 'fully_reserved':
      return 'Reserved'
    case 'partially_reserved':
      return 'Partially Reserved'
    case 'inactive':
      return 'Inactive'
    default:
      return status
  }
}

function getOwnerLabel(owner: Owner) {
  const company = owner.company_name?.trim()
  const fullName = owner.full_name?.trim()
  const phone = owner.phone_number?.trim()

  const mainLabel = company || fullName || 'Owner'
  return phone ? `${mainLabel} - ${phone}` : mainLabel
}

function getOwnerServiceAreas(owner: Owner) {
  const serviceAreas =
    owner.property_owner_service_areas || owner.service_areas || []

  return Array.isArray(serviceAreas) ? serviceAreas : []
}

function ownerMatchesLocation(owner: Owner, cityId: string, universityId: string) {
  if (!cityId || !universityId) return false

  return getOwnerServiceAreas(owner).some(
    (area) =>
      area &&
      String(area.city_id) === String(cityId) &&
      String(area.university_id) === String(universityId) &&
      area.is_active !== false
  )
}

function normalizeRoomNumberFieldIfNeeded(field: keyof RoomForm, value: string) {
  if (
    field === 'beds_count' ||
    field === 'single_room_price_egp' ||
    field === 'double_room_price_egp' ||
    field === 'triple_room_price_egp'
  ) {
    return normalizeNumberString(value)
  }

  return value
}

function getRoomOptionPrice(
  room: PropertyRoom,
  code: 'single_room' | 'double_room' | 'triple_room'
) {
  const options = Array.isArray(room?.room_sellable_options)
    ? room.room_sellable_options
    : []

  const option = options.find(
    (item) => item.code === code && item.is_active !== false
  )

  return option?.price_egp != null ? String(option.price_egp) : ''
}

function getRoomOptionEnabled(
  room: PropertyRoom,
  code: 'single_room' | 'double_room' | 'triple_room'
) {
  const options = Array.isArray(room?.room_sellable_options)
    ? room.room_sellable_options
    : []

  return options.some((item) => item.code === code && item.is_active !== false)
}

function getRoomOptionId(
  room: PropertyRoom,
  code: 'single_room' | 'double_room' | 'triple_room'
) {
  const options = Array.isArray(room?.room_sellable_options)
    ? room.room_sellable_options
    : []

  const option = options.find(
    (item) => item.code === code && item.is_active !== false
  )

  return option?.id || ''
}

function getEnabledRoomOptions(room: RoomForm) {
  const options: EnabledRoomOption[] = []

  if (room.single_room_enabled && isValidPrice(room.single_room_price_egp)) {
    options.push({ code: 'single_room', price: room.single_room_price_egp })
  }

  if (room.double_room_enabled && isValidPrice(room.double_room_price_egp)) {
    options.push({ code: 'double_room', price: room.double_room_price_egp })
  }

  if (room.triple_room_enabled && isValidPrice(room.triple_room_price_egp)) {
    options.push({ code: 'triple_room', price: room.triple_room_price_egp })
  }

  return options
}

function getRoomOptionCountLabel(room: RoomForm) {
  const count = getEnabledRoomOptions(room).length
  if (count === 0) return 'No booking options enabled'
  if (count === 1) return '1 booking option enabled'
  return `${count} booking options enabled`
}

function getRoomValidationMessage(room: RoomForm) {
  const bedsCount = getBedsCountNumber(room.beds_count)

  if (room.room_name.trim() === '') return 'Room name EN is required.'
  if (room.room_type.trim() === '') return 'Room type is required.'
  if (!isValidPositiveInt(room.beds_count)) return 'Beds count must be at least 1.'

  const enabledAnyOption =
    room.single_room_enabled || room.double_room_enabled || room.triple_room_enabled

  if (!enabledAnyOption) return 'Enable at least one booking option for this room.'

  if (room.single_room_enabled && !isValidPrice(room.single_room_price_egp)) {
    return 'Single Room price must be a valid value.'
  }

  if (room.double_room_enabled) {
    if (bedsCount < 2) return 'Double Room requires at least 2 beds.'
    if (!isValidPrice(room.double_room_price_egp)) {
      return 'Double Room price must be a valid value.'
    }
  }

  if (room.triple_room_enabled) {
    if (bedsCount < 3) return 'Triple Room requires at least 3 beds.'
    if (!isValidPrice(room.triple_room_price_egp)) {
      return 'Triple Room price must be a valid value.'
    }
  }

  return ''
}

function getInitials(label: string) {
  return label
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatDateTimeLocalInputValue(value?: string | null) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16)
}

function IconThumb({ label, iconUrl }: { label: string; iconUrl?: string | null }) {
  if (iconUrl) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#dbe4f0] bg-white shadow-sm">
        <img src={iconUrl} alt={label} className="h-6 w-6 object-contain" />
      </div>
    )
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#e8f1ff] to-[#f5f9ff] text-sm font-bold text-[#0b66c3] shadow-sm">
      {getInitials(label) || '•'}
    </div>
  )
}

function CounterField({
  label,
  value,
  onChange,
  helperText,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  helperText?: string
}) {
  const numericValue = Number(value || 0)

  return (
    <div>
      <p className="mb-3 text-[18px] font-medium text-[#1a1a1a]">{label}</p>

      <div className="flex h-[52px] w-[160px] items-center justify-between rounded-md border border-[#bfbfbf] bg-white px-4">
        <button
          type="button"
          onClick={() => onChange(String(Math.max(0, numericValue - 1)))}
          className="text-[28px] leading-none text-[#0071c2]"
        >
          −
        </button>

        <span className="text-[24px] font-semibold text-[#1a1a1a]">
          {numericValue}
        </span>

        <button
          type="button"
          onClick={() => onChange(String(numericValue + 1))}
          className="text-[28px] leading-none text-[#0071c2]"
        >
          +
        </button>
      </div>

      {helperText && <p className="mt-2 text-sm text-[#6b7280]">{helperText}</p>}
    </div>
  )
}

function RoomOptionField({
  title,
  description,
  enabled,
  price,
  onToggle,
  onPriceChange,
  inputClass,
  disabled = false,
  disabledReason,
}: {
  title: string
  description: string
  enabled: boolean
  price: string
  onToggle: (value: boolean) => void
  onPriceChange: (value: string) => void
  inputClass: string
  disabled?: boolean
  disabledReason?: string
}) {
  return (
    <div
      className={`rounded-md border p-4 ${
        disabled ? 'border-[#ececec] bg-[#f7f7f7]' : 'border-[#e5e7eb] bg-[#fafafa]'
      }`}
    >
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          disabled={disabled}
          className="h-4 w-4"
        />
        <span
          className={`text-sm font-semibold ${
            disabled ? 'text-[#9ca3af]' : 'text-[#1a1a1a]'
          }`}
        >
          {title}
        </span>
      </label>

      <p className={`mt-2 text-sm ${disabled ? 'text-[#9ca3af]' : 'text-[#6b7280]'}`}>
        {description}
      </p>

      {disabled && disabledReason && (
        <p className="mt-2 text-xs font-medium text-[#b45309]">{disabledReason}</p>
      )}

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
          Price (EGP)
        </label>
        <input
          type="number"
          min="1"
          step="any"
          value={price}
          onChange={(e) => onPriceChange(e.target.value)}
          placeholder={`Price for ${title}`}
          disabled={!enabled || disabled}
          className={`${inputClass} disabled:cursor-not-allowed disabled:bg-[#f3f4f6]`}
        />
      </div>
    </div>
  )
}

function FeatureSelectableCard({
  inputId,
  inputName,
  inputValue,
  title,
  iconUrl,
  defaultChecked = false,
}: {
  inputId: string
  inputName: string
  inputValue: string | number
  title: string
  iconUrl?: string | null
  defaultChecked?: boolean
}) {
  return (
    <label htmlFor={inputId} className="group relative block cursor-pointer">
      <input
        id={inputId}
        type="checkbox"
        name={inputName}
        value={String(inputValue)}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />

      <div className="flex min-h-[88px] items-center gap-3 rounded-2xl border border-[#e6ebf2] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-[#bdd7f4] hover:shadow-md peer-checked:border-[#0b66c3] peer-checked:bg-[#f3f9ff] peer-checked:shadow-[0_0_0_3px_rgba(11,102,195,0.08)]">
        <IconThumb label={title} iconUrl={iconUrl} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#162033]">{title}</p>
        </div>

        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#ccd7e4] bg-white text-transparent transition peer-checked:border-[#0b66c3] peer-checked:bg-[#0b66c3] peer-checked:text-white">
          ✓
        </div>
      </div>
    </label>
  )
}

function FeatureSection({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-3xl border border-[#e6ebf2] bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-1">
        <h3 className="text-[18px] font-bold text-[#162033]">{title}</h3>
        {subtitle && <p className="text-sm text-[#687385]">{subtitle}</p>}
      </div>

      {children}
    </div>
  )
}

function BrandLogo() {
  return (
    <Link href="/admin/properties" className="navienty-logo" aria-label="Navienty admin home">
      <img
        src="https://i.ibb.co/p6CBgjz0/Navienty-13.png"
        alt="Navienty icon"
        className="navienty-logo-icon"
      />
      <span className="navienty-logo-text-wrap">
        <img
          src="https://i.ibb.co/kVC7z9x7/Navienty-15.png"
          alt="Navienty"
          className="navienty-logo-text"
        />
      </span>
    </Link>
  )
}

export default function EditPropertyForm({
  property,
  cities = [],
  universities = [],
  brokers = [],
  owners = [],
  amenities = [],
  facilities = [],
  billTypes = [],
  images = [],
  selectedAmenityIds = [],
  selectedFacilityIds = [],
  selectedBillTypeIds = [],
  rooms = [],
  bookingRequests = [],
  canChangeBroker,
  canChangeAdminStatus,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  const [errorMessage, setErrorMessage] = useState('')
  const [stepError, setStepError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)

  const [propertyCode, setPropertyCode] = useState(property.property_id)
  const [adminStatus] = useState<
    'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'
  >(property.admin_status)

  const [titleEn, setTitleEn] = useState(property.title_en)
  const [titleAr, setTitleAr] = useState(property.title_ar)
  const [addressEn, setAddressEn] = useState(property.address_en || '')
  const [addressAr, setAddressAr] = useState(property.address_ar || '')

  const [cityId, setCityId] = useState(property.city_id)
  const [universityId, setUniversityId] = useState(property.university_id)
  const [brokerId, setBrokerId] = useState(property.broker_id)
  const [ownerId, setOwnerId] = useState(property.owner_id || '')
  const [ownerSearch, setOwnerSearch] = useState('')

  const [priceEgp, setPriceEgp] = useState(String(property.price_egp || ''))
  const [propertyRentalDuration] = useState<'daily' | 'monthly'>(
    property.rental_duration || 'monthly'
  )

  const [availabilityStatus, setAvailabilityStatus] = useState<
    'available' | 'partially_reserved' | 'fully_reserved' | 'inactive'
  >(property.availability_status)

  const [floorNumber, setFloorNumber] = useState(
    String(property.floor_number ?? 0)
  )

  const [bedroomsCount, setBedroomsCount] = useState(
    String(property.bedrooms_count ?? 0)
  )
  const [bathroomsCount, setBathroomsCount] = useState(
    String(property.bathrooms_count ?? 0)
  )
  const [bedsCount, setBedsCount] = useState(String(property.beds_count ?? 0))
  const [guestsCount, setGuestsCount] = useState(
    String(property.guests_count ?? 0)
  )
  const [gender, setGender] = useState(property.gender || '')
  const [smokingPolicy] = useState(property.smoking_policy || '')
  const [airbnbPriceMin] = useState(String(property.airbnb_price_min ?? ''))
  const [airbnbPriceMax] = useState(String(property.airbnb_price_max ?? ''))
  const [isFeatured, setIsFeatured] = useState(property.is_featured === true)
  const [featuredRank, setFeaturedRank] = useState(
    String(property.featured_rank ?? 0)
  )
  const [featuredUntil, setFeaturedUntil] = useState(
    formatDateTimeLocalInputValue(property.featured_until)
  )
  const [addressSearch, setAddressSearch] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState<MapboxAddressSuggestion[]>([])
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [addressSearchError, setAddressSearchError] = useState('')
  const [selectedLatitude, setSelectedLatitude] = useState(String(property.latitude ?? ''))
  const [selectedLongitude, setSelectedLongitude] = useState(String(property.longitude ?? ''))
  const [selectedMapLocationLabel, setSelectedMapLocationLabel] = useState(
    property.latitude != null && property.longitude != null
      ? `${property.latitude}, ${property.longitude}`
      : ''
  )

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

  const safeImages = Array.isArray(images) ? images : []
  const safeRooms = Array.isArray(rooms) ? rooms : []
  const safeBookingRequests = Array.isArray(bookingRequests)
    ? bookingRequests
    : []

  const [existingImages, setExistingImages] =
    useState<PropertyImage[]>(safeImages)
  const [newImageFiles, setNewImageFiles] = useState<ImageFileItem[]>([])
  const [coverSelection, setCoverSelection] = useState<CoverSelection>(() => {
    const existingCoverIndex = safeImages.findIndex((img) => img.is_cover)
    if (existingCoverIndex >= 0) {
      return { kind: 'existing', index: existingCoverIndex }
    }

    return { kind: 'existing', index: 0 }
  })

  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false)

  const [roomState, setRoomState] = useState<RoomForm[]>(
    safeRooms.length > 0
      ? safeRooms.map((room) => ({
          id: room?.id || '',
          room_name: room?.room_name || '',
          room_name_ar: room?.room_name_ar || room?.room_name || '',
          room_type: room?.room_type || 'single',
          rental_duration: property?.rental_duration || 'monthly',
          beds_count: String(
            Array.isArray(room?.room_beds) ? room.room_beds.length : 1
          ),
          private_bathroom: Boolean(room?.private_bathroom),
          is_reserved:
            room?.status === 'fully_reserved' ||
            room?.status === 'partially_reserved',
          single_room_option_id: getRoomOptionId(room, 'single_room'),
          single_room_enabled: getRoomOptionEnabled(room, 'single_room'),
          single_room_price_egp: getRoomOptionPrice(room, 'single_room'),
          double_room_option_id: getRoomOptionId(room, 'double_room'),
          double_room_enabled: getRoomOptionEnabled(room, 'double_room'),
          double_room_price_egp: getRoomOptionPrice(room, 'double_room'),
          triple_room_option_id: getRoomOptionId(room, 'triple_room'),
          triple_room_enabled: getRoomOptionEnabled(room, 'triple_room'),
          triple_room_price_egp: getRoomOptionPrice(room, 'triple_room'),
        }))
      : [
          {
            ...initialRoom,
            room_name: 'Bedroom 1',
            room_name_ar: 'Bedroom 1',
            beds_count: '1',
            single_room_enabled: true,
            rental_duration: property?.rental_duration || 'monthly',
          },
        ]
  )

  const inputClass =
    'w-full rounded-md border border-[#cfcfcf] px-3 py-2.5 text-sm outline-none transition focus:border-[#0071c2]'

  const selectClass =
    'w-full rounded-md border border-[#cfcfcf] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0071c2]'

  useEffect(() => {
    return () => {
      newImageFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
    }
  }, [newImageFiles])

  const filteredUniversities = useMemo(() => {
    if (!cityId) return []
    return universities.filter((university) => university.city_id === cityId)
  }, [cityId, universities])

  const selectedUniversity = useMemo(() => {
    return universities.find((university) => university.id === universityId) || null
  }, [universities, universityId])

  const selectedCity = useMemo(() => {
    return cities.find((city) => city.id === cityId) || null
  }, [cities, cityId])

  const activeOwners = useMemo(() => {
    return [...owners]
      .filter((owner) => owner.is_active !== false)
      .sort((a, b) => getOwnerLabel(a).localeCompare(getOwnerLabel(b)))
  }, [owners])

  const eligibleOwners = useMemo(() => {
    if (!cityId || !universityId) return []

    return activeOwners.filter((owner) =>
      ownerMatchesLocation(owner, cityId, universityId)
    )
  }, [activeOwners, cityId, universityId])

  const displayedOwners = useMemo(() => {
    const search = ownerSearch.trim().toLowerCase()

    if (!cityId || !universityId) return []
    if (!search) return eligibleOwners.slice(0, 80)

    return eligibleOwners
      .filter((owner) => {
        const haystack = [
          owner.full_name,
          owner.company_name,
          owner.phone_number,
          owner.whatsapp_number,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(search)
      })
      .slice(0, 80)
  }, [eligibleOwners, ownerSearch, cityId, universityId])

  const selectedOwner = useMemo(() => {
    return activeOwners.find((owner) => owner.id === ownerId) || null
  }, [activeOwners, ownerId])

  const activeBrokerName =
    brokers.find((broker) => broker.id === property.broker_id)?.full_name ||
    property.broker_id

  const activeAmenities = useMemo(() => {
    return [...amenities]
      .filter((item) => item.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [amenities])

  const amenityCategoryGroups = useMemo<AmenityCategoryGroup[]>(() => {
    const groupMap = new Map<string, AmenityCategoryGroup>()

    activeAmenities.forEach((item) => {
      const rawCategory =
        item.category_en?.trim() || item.category_ar?.trim() || 'Other Amenities'

      if (!groupMap.has(rawCategory)) {
        groupMap.set(rawCategory, { key: rawCategory, title: rawCategory, items: [] })
      }

      groupMap.get(rawCategory)!.items.push(item)
    })

    return Array.from(groupMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    )
  }, [activeAmenities])

  const activeFacilities = useMemo(() => {
    return [...facilities]
      .filter((item) => item.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [facilities])

  const activeBillTypes = useMemo(() => {
    return [...billTypes]
      .filter((item) => item.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [billTypes])

  const hasAtLeastOneImage =
    existingImages.length > 0 || newImageFiles.some((item) => item.file !== null)

  const totalImageCount =
    existingImages.length + newImageFiles.filter((item) => item.file !== null).length

  const totalBedsFromRooms = useMemo(() => {
    return roomState.reduce((sum, room) => {
      const roomBeds = Number(normalizeNumberString(room.beds_count || '0'))
      if (!Number.isFinite(roomBeds) || roomBeds <= 0) return sum
      return sum + roomBeds
    }, 0)
  }, [roomState])

  const derivedAvailabilityStatus = useMemo(() => {
    if (availabilityStatus === 'inactive') return 'inactive'
    return getAvailabilityStatusFromRooms(roomState)
  }, [availabilityStatus, roomState])

  const lowestAvailableOptionPrice = useMemo(() => {
    const prices = roomState.flatMap((room) =>
      getEnabledRoomOptions(room).map((option) =>
        Number(normalizeNumberString(option.price))
      )
    )

    const validPrices = prices.filter((price) => Number.isFinite(price) && price > 0)
    if (validPrices.length === 0) return null
    return Math.min(...validPrices)
  }, [roomState])

  const hasValidRoom = roomState.some((room) => getRoomValidationMessage(room) === '')

  const hasInvalidCompletedRoom = roomState.some((room) => {
    const hasAnyValue =
      room.room_name.trim() !== '' ||
      room.room_type.trim() !== '' ||
      room.beds_count.trim() !== '' ||
      room.single_room_enabled ||
      room.single_room_price_egp.trim() !== '' ||
      room.double_room_enabled ||
      room.double_room_price_egp.trim() !== '' ||
      room.triple_room_enabled ||
      room.triple_room_price_egp.trim() !== ''

    if (!hasAnyValue) return false
    return getRoomValidationMessage(room) !== ''
  })

  const hasBookingRequests = safeBookingRequests.length > 0

  useEffect(() => {
    setBedsCount(String(totalBedsFromRooms))
  }, [totalBedsFromRooms])

  useEffect(() => {
    if (roomState.length > 0 && Number(bedroomsCount) === 0) {
      setBedroomsCount(String(roomState.length))
    }
  }, [roomState.length, bedroomsCount])

  useEffect(() => {
    setBedroomsCount(String(roomState.length))
  }, [roomState.length])

  useEffect(() => {
    if (availabilityStatus !== 'inactive') {
      setAvailabilityStatus(getAvailabilityStatusFromRooms(roomState))
    }
  }, [roomState, availabilityStatus])

  useEffect(() => {
    if (!ownerId) return
    if (!cityId || !universityId) return

    const ownerStillValid = eligibleOwners.some((owner) => owner.id === ownerId)
    const isCurrentOwner = ownerId === property.owner_id

    if (!ownerStillValid && !isCurrentOwner) {
      setOwnerId('')
    }
  }, [ownerId, cityId, universityId, eligibleOwners, property.owner_id])

  const setSelectedMapLocation = useCallback(
    (longitudeValue: number, latitudeValue: number, label: string) => {
      if (!Number.isFinite(longitudeValue) || !Number.isFinite(latitudeValue)) return

      const normalizedLongitude = Number(longitudeValue.toFixed(7))
      const normalizedLatitude = Number(latitudeValue.toFixed(7))
      const fallbackLabel = `${normalizedLatitude}, ${normalizedLongitude}`

      setSelectedLongitude(String(normalizedLongitude))
      setSelectedLatitude(String(normalizedLatitude))
      setSelectedMapLocationLabel(label || fallbackLabel)
    },
    []
  )

  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || mapRef.current) return

    mapboxgl.accessToken = mapboxToken

    const initialLongitude = Number(selectedLongitude)
    const initialLatitude = Number(selectedLatitude)
    const hasInitialLocation =
      Number.isFinite(initialLongitude) && Number.isFinite(initialLatitude)

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: hasInitialLocation
        ? [initialLongitude, initialLatitude]
        : [31.1837, 27.1809],
      zoom: hasInitialLocation ? 15 : 12,
    })

    map.addControl(
      new mapboxgl.NavigationControl({
        showCompass: false,
        showZoom: true,
        visualizePitch: false,
      }),
      'bottom-right'
    )

    map.on('load', () => {
      window.setTimeout(() => map.resize(), 100)
    })

    map.on('click', (event) => {
      const { lng, lat } = event.lngLat
      setSelectedMapLocation(lng, lat, 'Pinned location on map')
      setAddressSuggestions([])
      setAddressSearchError('')
    })

    mapRef.current = map

    return () => {
      markerRef.current?.remove()
      markerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [mapboxToken, setSelectedMapLocation])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const latitude = Number(selectedLatitude)
    const longitude = Number(selectedLongitude)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }

    if (!markerRef.current) {
      const marker = new mapboxgl.Marker({
        color: '#054aff',
        draggable: true,
      })
        .setLngLat([longitude, latitude])
        .addTo(map)

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat()
        setSelectedMapLocation(lngLat.lng, lngLat.lat, 'Pinned location on map')
        setAddressSuggestions([])
        setAddressSearchError('')
      })

      markerRef.current = marker
    } else {
      markerRef.current.setLngLat([longitude, latitude])
    }

    const moveMap = () => {
      map.easeTo({
        center: [longitude, latitude],
        zoom: Math.max(map.getZoom(), 15),
        duration: 650,
      })
    }

    if (map.loaded()) {
      moveMap()
    } else {
      map.once('load', moveMap)
    }
  }, [selectedLatitude, selectedLongitude, setSelectedMapLocation])

  useEffect(() => {
    const searchTerm = addressSearch.trim()

    if (searchTerm.length < 3) {
      setAddressSuggestions([])
      setIsSearchingAddress(false)
      setAddressSearchError('')
      return
    }

    if (
      selectedLatitude &&
      selectedLongitude &&
      selectedMapLocationLabel &&
      searchTerm === selectedMapLocationLabel.trim()
    ) {
      setAddressSuggestions([])
      setIsSearchingAddress(false)
      setAddressSearchError('')
      return
    }

    if (!mapboxToken) {
      setAddressSuggestions([])
      setIsSearchingAddress(false)
      setAddressSearchError('Mapbox token is missing. Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local.')
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingAddress(true)
      setAddressSearchError('')

      try {
        const queryParts = [
          searchTerm,
          selectedUniversity?.name_en,
          selectedCity?.name_en,
          'Egypt',
        ].filter(Boolean)

        const encodedQuery = encodeURIComponent(queryParts.join(', '))
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${encodeURIComponent(
          mapboxToken
        )}&country=EG&language=en,ar&limit=6&types=address,poi,place,locality,neighborhood`

        const response = await fetch(endpoint, { signal: controller.signal })

        if (!response.ok) {
          throw new Error('Mapbox request failed')
        }

        const data = await response.json()
        const features = Array.isArray(data?.features)
          ? (data.features
              .map((feature: any) => {
                const center = feature?.center
                const longitude = Number(center?.[0])
                const latitude = Number(center?.[1])

                if (
                  !feature?.id ||
                  !feature?.place_name ||
                  !Number.isFinite(latitude) ||
                  !Number.isFinite(longitude)
                ) {
                  return null
                }

                return {
                  id: String(feature.id),
                  place_name: String(feature.place_name),
                  text: feature.text ? String(feature.text) : undefined,
                  center: [longitude, latitude] as [number, number],
                }
              })
              .filter(Boolean) as MapboxAddressSuggestion[])
          : []

        setAddressSuggestions(features)
      } catch (error: any) {
        if (error?.name === 'AbortError') return
        setAddressSuggestions([])
        setAddressSearchError('Could not load address results. Try a more specific address.')
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingAddress(false)
        }
      }
    }, 450)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [
    addressSearch,
    mapboxToken,
    selectedCity?.name_en,
    selectedLatitude,
    selectedLongitude,
    selectedMapLocationLabel,
    selectedUniversity?.name_en,
  ])

  const handleAddressSearchInputChange = (value: string) => {
    setAddressSearch(value)
  }

  const handleSelectAddressSuggestion = (suggestion: MapboxAddressSuggestion) => {
    const [longitude, latitude] = suggestion.center
    const fullAddress = suggestion.place_name

    setAddressSearch(fullAddress)
    setSelectedMapLocation(longitude, latitude, fullAddress)
    setAddressSuggestions([])
    setAddressSearchError('')
  }

  const clearSelectedMapLocation = () => {
    setSelectedLatitude('')
    setSelectedLongitude('')
    setSelectedMapLocationLabel('')
    setAddressSearch('')
    setAddressSuggestions([])
    setAddressSearchError('')
  }

  const handleCityChange = (value: string) => {
    setCityId(value)

    const nextUniversities = universities.filter((u) => u.city_id === value)
    const universityStillValid = nextUniversities.some((u) => u.id === universityId)

    if (!universityStillValid) {
      setUniversityId('')
    }

    setOwnerId('')
    setOwnerSearch('')
  }

  const handleUniversityChange = (value: string) => {
    setUniversityId(value)
    setOwnerId('')
    setOwnerSearch('')
  }

  const addImages = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return

    const newItems: ImageFileItem[] = Array.from(filesList).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setNewImageFiles((prev) => [...prev, ...newItems])
  }

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => {
      const next = prev.filter((_, i) => i !== index)

      setCoverSelection((current) => {
        if (current.kind !== 'existing') return current

        if (current.index === index) {
          if (next.length > 0) return { kind: 'existing', index: 0 }
          if (newImageFiles.length > 0) return { kind: 'new', index: 0 }
          return { kind: 'existing', index: 0 }
        }

        if (current.index > index) {
          return { kind: 'existing', index: current.index - 1 }
        }

        return current
      })

      return next
    })
  }

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => {
      const item = prev[index]
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)

      const next = prev.filter((_, i) => i !== index)

      setCoverSelection((current) => {
        if (current.kind !== 'new') return current

        if (current.index === index) {
          if (existingImages.length > 0) return { kind: 'existing', index: 0 }
          if (next.length > 0) return { kind: 'new', index: 0 }
          return { kind: 'existing', index: 0 }
        }

        if (current.index > index) {
          return { kind: 'new', index: current.index - 1 }
        }

        return current
      })

      return next
    })
  }

  const addRoom = () => {
    const nextNumber = roomState.length + 1

    setRoomState((prev) => [
      ...prev,
      {
        ...initialRoom,
        room_name: `Bedroom ${nextNumber}`,
        room_name_ar: `Bedroom ${nextNumber}`,
        beds_count: '1',
        single_room_enabled: true,
        rental_duration: propertyRentalDuration,
      },
    ])
  }

  const updateRoom = (index: number, field: keyof RoomForm, value: string | boolean) => {
    setRoomState((prev) =>
      prev.map((room, i) => {
        if (i !== index) return room

        const nextRoom = {
          ...room,
          [field]:
            typeof value === 'string' &&
            field !== 'room_name' &&
            field !== 'room_name_ar' &&
            field !== 'id' &&
            field !== 'single_room_option_id' &&
            field !== 'double_room_option_id' &&
            field !== 'triple_room_option_id'
              ? normalizeRoomNumberFieldIfNeeded(field, value)
              : value,
          rental_duration: propertyRentalDuration,
        } as RoomForm

        if (field === 'room_name' && typeof value === 'string') {
          nextRoom.room_name_ar = value
        }

        const beds = getBedsCountNumber(nextRoom.beds_count)

        if (beds < 2) {
          nextRoom.double_room_enabled = false
          nextRoom.double_room_price_egp = ''
        }

        if (beds < 3) {
          nextRoom.triple_room_enabled = false
          nextRoom.triple_room_price_egp = ''
        }

        return nextRoom
      })
    )
  }

  const removeRoom = (index: number) => {
    setRoomState((prev) => prev.filter((_, i) => i !== index))
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (
          !propertyCode.trim() ||
          !titleEn.trim() ||
          !titleAr.trim() ||
          !addressEn.trim() ||
          !addressAr.trim() ||
          !selectedLatitude.trim() ||
          !selectedLongitude.trim()
        ) {
          return 'Please complete Property Code, Title EN, Title AR, Address EN, Address AR, and Map Location.'
        }
        return ''

      case 2:
        if (
          !cityId.trim() ||
          !universityId.trim() ||
          !brokerId.trim() ||
          !ownerId.trim() ||
          !gender.trim()
        ) {
          return 'Please complete city, university, broker, owner, and gender.'
        }

        if (!filteredUniversities.some((university) => university.id === universityId)) {
          return 'Selected university is not available for the selected city.'
        }

        if (!canChangeBroker && !property.broker_id.trim()) {
          return 'Broker information is missing for this property.'
        }

        if (canChangeBroker && !brokers.some((broker) => broker.id === brokerId)) {
          return 'Selected broker was not found.'
        }

        if (!eligibleOwners.some((owner) => owner.id === ownerId)) {
          return 'Selected owner is not available for the selected city and university.'
        }

        return ''

      case 3:
        if (!hasAtLeastOneImage) return 'Please upload at least one image.'
        return ''

      case 4:
        if (
          !isValidPrice(priceEgp) ||
          !isValidNonNegativeInt(floorNumber) ||
          !isValidNonNegativeInt(bedroomsCount) ||
          !isValidNonNegativeInt(bathroomsCount) ||
          !isValidNonNegativeInt(bedsCount) ||
          !isValidNonNegativeInt(guestsCount)
        ) {
          return 'Full apartment price, floor number, bedrooms, bathrooms, beds, and guests must be valid values.'
        }
        return ''

      case 5:
        if (!hasValidRoom) {
          return 'Please complete at least one room with valid beds count and at least one enabled booking option price.'
        }

        if (hasInvalidCompletedRoom) {
          return 'One or more rooms have incomplete data, invalid prices, or options that do not match the room bed count.'
        }

        return ''

      default:
        return ''
    }
  }

  const goNext = () => {
    const validationMessage = validateStep(currentStep)
    if (validationMessage) {
      setStepError(validationMessage)
      return
    }

    setStepError('')
    setCurrentStep((prev) => Math.min(prev + 1, FORM_STEPS.length))
  }

  const goBack = () => {
    setStepError('')
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const goToStep = (step: number) => {
    if (step <= currentStep) {
      setStepError('')
      setCurrentStep(step)
      return
    }

    for (let s = 1; s < step; s++) {
      const validationMessage = validateStep(s)
      if (validationMessage) {
        setStepError(validationMessage)
        setCurrentStep(s)
        return
      }
    }

    setStepError('')
    setCurrentStep(step)
  }

  const getDisplayStepStatus = (step: DisplayStep) => {
    if (currentStep > step.endStep) return 'done'
    if (currentStep >= step.startStep && currentStep <= step.endStep) return 'active'
    return 'upcoming'
  }

  const getDisplayStepProgress = (step: DisplayStep) => {
    if (step.startStep === 1 && step.endStep === 2) {
      if (currentStep > 2) return 100
      if (currentStep === 2) return 100
      if (currentStep === 1) return 50
      return 0
    }

    const status = getDisplayStepStatus(step)
    if (status === 'done') return 100
    if (status === 'active') return 45
    return 0
  }

  const handleSubmit = async (formData: FormData) => {
    setErrorMessage('')
    setStepError('')

    const finalValidationSteps = [1, 2, 3, 4, 5]
    for (const step of finalValidationSteps) {
      const validationMessage = validateStep(step)
      if (validationMessage) {
        setStepError(validationMessage)
        setCurrentStep(step)
        return
      }
    }

    formData.set('property_db_id', property.id)
    formData.set('property_id', propertyCode)
    formData.set('title_en', titleEn)
    formData.set('title_ar', titleAr)
    formData.set('address_en', addressEn)
    formData.set('address_ar', addressAr)
    formData.set('city_id', cityId)
    formData.set('university_id', universityId)
    formData.set('owner_id', ownerId)
    formData.set('price_egp', normalizeNumberString(priceEgp))
    formData.set('floor_number', normalizeNumberString(floorNumber))
    formData.set('rental_duration', propertyRentalDuration)
    formData.set('availability_status', derivedAvailabilityStatus)
    formData.set('bedrooms_count', String(roomState.length))
    formData.set('bathrooms_count', normalizeNumberString(bathroomsCount))
    formData.set('beds_count', normalizeNumberString(bedsCount))
    formData.set('guests_count', normalizeNumberString(guestsCount))
    formData.set('gender', gender)
    formData.set('smoking_policy', smokingPolicy)
    formData.set('airbnb_price_min', normalizeNumberString(airbnbPriceMin))
    formData.set('airbnb_price_max', normalizeNumberString(airbnbPriceMax))
    formData.set('latitude', normalizeNumberString(selectedLatitude))
    formData.set('longitude', normalizeNumberString(selectedLongitude))

    if (canChangeAdminStatus) {
      formData.set('is_featured', isFeatured ? 'true' : 'false')
      formData.set('featured_rank', normalizeNumberString(featuredRank || '0'))
      formData.set('featured_until', featuredUntil)
    } else {
      formData.set('is_featured', property.is_featured === true ? 'true' : 'false')
      formData.set('featured_rank', String(property.featured_rank ?? 0))
      formData.set('featured_until', property.featured_until ?? '')
    }

    if (!canChangeBroker) {
      formData.set('broker_id', property.broker_id)
    } else {
      formData.set('broker_id', brokerId)
    }

    if (!canChangeAdminStatus) {
      formData.set('admin_status', property.admin_status)
    } else {
      formData.set('admin_status', adminStatus)
    }

    formData.delete('existing_image_ids')
    existingImages.forEach((image) => {
      formData.append('existing_image_ids', image.id)
    })

    formData.delete('images')
    formData.delete('uploaded_image_url')
    formData.delete('uploaded_image_storage_path')

    const filesToUpload = newImageFiles
      .map((item) => item.file)
      .filter((file): file is File => file instanceof File && file.size > 0)

    if (filesToUpload.length > 0) {
      setIsUploadingImages(true)

      try {
        const supabaseBrowserClient = getBrowserSupabaseClient()
        const uploadedImages: SignedPropertyImageUpload[] = []

        for (
          let batchStart = 0;
          batchStart < filesToUpload.length;
          batchStart += PROPERTY_IMAGE_UPLOAD_BATCH_SIZE
        ) {
          const batch = filesToUpload.slice(
            batchStart,
            batchStart + PROPERTY_IMAGE_UPLOAD_BATCH_SIZE
          )
          const batchEnd = Math.min(
            batchStart + batch.length,
            filesToUpload.length
          )

          setUploadProgress(
            `Uploading images ${batchStart + 1}-${batchEnd} of ${filesToUpload.length}...`
          )

          const batchResults = await Promise.all(
            batch.map(async (file) => {
              const signedUploadFormData = new FormData()
              signedUploadFormData.set('property_db_id', property.id)
              signedUploadFormData.set('file_name', file.name)
              signedUploadFormData.set('file_type', file.type || 'image/jpeg')

              const signedUpload = await createPropertyImageUploadSignedUrlAction(
                signedUploadFormData
              )

              const { error: directUploadError } = await supabaseBrowserClient.storage
                .from(PROPERTY_IMAGES_BUCKET)
                .uploadToSignedUrl(
                  signedUpload.storage_path,
                  signedUpload.token,
                  file,
                  {
                    cacheControl: '3600',
                    contentType: file.type || undefined,
                    upsert: false,
                  }
                )

              if (directUploadError) {
                throw new Error(
                  `Failed to upload ${file.name}: ${directUploadError.message}`
                )
              }

              return signedUpload
            })
          )

          uploadedImages.push(...batchResults)
        }

        uploadedImages.forEach((uploadedImage) => {
          formData.append('uploaded_image_url', uploadedImage.image_url)
          formData.append(
            'uploaded_image_storage_path',
            uploadedImage.storage_path
          )
        })
      } catch (error: any) {
        setErrorMessage(error?.message || 'Failed to upload property images')
        setUploadProgress('')
        setIsUploadingImages(false)
        return
      }
    }

    formData.set('cover_kind', coverSelection.kind)
    formData.set('cover_index', String(coverSelection.index))

    formData.delete('room_id')
    formData.delete('room_name')
    formData.delete('room_name_ar')
    formData.delete('room_type')
    formData.delete('room_rental_duration')
    formData.delete('room_beds_count')
    formData.delete('room_private_bathroom')
    formData.delete('room_is_reserved')
    formData.delete('room_single_room_option_id')
    formData.delete('room_single_room_enabled')
    formData.delete('room_single_room_price_egp')
    formData.delete('room_double_room_option_id')
    formData.delete('room_double_room_enabled')
    formData.delete('room_double_room_price_egp')
    formData.delete('room_triple_room_option_id')
    formData.delete('room_triple_room_enabled')
    formData.delete('room_triple_room_price_egp')

    roomState.forEach((room) => {
      formData.append('room_id', room.id || '')
      formData.append('room_name', room.room_name)
      formData.append('room_name_ar', room.room_name_ar || room.room_name)
      formData.append('room_type', room.room_type)
      formData.append('room_rental_duration', propertyRentalDuration)
      formData.append('room_beds_count', normalizeNumberString(room.beds_count))
      formData.append('room_private_bathroom', room.private_bathroom ? 'true' : 'false')
      formData.append('room_is_reserved', room.is_reserved ? 'true' : 'false')

      formData.append('room_single_room_option_id', room.single_room_option_id || '')
      formData.append(
        'room_single_room_enabled',
        room.single_room_enabled ? 'true' : 'false'
      )
      formData.append(
        'room_single_room_price_egp',
        normalizeNumberString(room.single_room_price_egp)
      )

      formData.append('room_double_room_option_id', room.double_room_option_id || '')
      formData.append(
        'room_double_room_enabled',
        room.double_room_enabled ? 'true' : 'false'
      )
      formData.append(
        'room_double_room_price_egp',
        normalizeNumberString(room.double_room_price_egp)
      )

      formData.append('room_triple_room_option_id', room.triple_room_option_id || '')
      formData.append(
        'room_triple_room_enabled',
        room.triple_room_enabled ? 'true' : 'false'
      )
      formData.append(
        'room_triple_room_price_egp',
        normalizeNumberString(room.triple_room_price_egp)
      )
    })

    startTransition(async () => {
      try {
        setUploadProgress('Saving property updates...')
        await updatePropertyAction(formData)
        setUploadProgress('')
        setIsUploadingImages(false)
        router.push('/admin/properties')
        router.refresh()
      } catch (error: any) {
        setErrorMessage(error.message || 'Something went wrong')
        setUploadProgress('')
        setIsUploadingImages(false)
      }
    })
  }

  const existingCoverActive =
    coverSelection.kind === 'existing' &&
    coverSelection.index >= 0 &&
    coverSelection.index < existingImages.length

  const newCoverActive =
    coverSelection.kind === 'new' &&
    coverSelection.index >= 0 &&
    coverSelection.index < newImageFiles.length

  const isBusy = isPending || isUploadingImages

  return (
    <form
      action={handleSubmit}
      onKeyDown={(event) => {
        const target = event.target as HTMLElement
        const tagName = target.tagName.toLowerCase()
        const isTextarea = tagName === 'textarea'

        if (event.key === 'Enter' && !isTextarea) event.preventDefault()
      }}
      className="min-h-screen bg-[#f2f2f2]"
    >
      <style>{`
        .navienty-logo {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          overflow: visible;
          transform: none;
          margin-top: -10px;
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
          transition: max-width 0.35s ease, opacity 0.25s ease, transform 0.35s ease;
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
        @media (max-width: 768px) {
          .navienty-logo { transform: none; margin-top: 0; }
          .navienty-logo-icon { width: 42px; height: 42px; }
          .navienty-logo-text-wrap { display: none; }
          .mobile-header-inner { justify-content: center !important; }
        }
      `}</style>

      <input type="hidden" name="property_db_id" value={property.id} />
      <input type="hidden" name="latitude" value={selectedLatitude} />
      <input type="hidden" name="longitude" value={selectedLongitude} />
      {!canChangeBroker && <input type="hidden" name="broker_id" value={property.broker_id} />}
      {!canChangeAdminStatus && (
        <input type="hidden" name="admin_status" value={property.admin_status} />
      )}
      {!canChangeAdminStatus && (
        <>
          <input
            type="hidden"
            name="is_featured"
            value={property.is_featured === true ? 'true' : 'false'}
          />
          <input
            type="hidden"
            name="featured_rank"
            value={String(property.featured_rank ?? 0)}
          />
          <input
            type="hidden"
            name="featured_until"
            value={property.featured_until ?? ''}
          />
        </>
      )}

      <header className="sticky top-0 z-[110] bg-[#f5f7f9]">
        <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
          <BrandLogo />
          <div className="hidden items-center gap-6 md:flex">
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <div className="border-b border-[#e4e4e4] bg-[#f7f7f7]">
        <div className="mx-auto w-full max-w-[1600px] px-6 md:px-8 xl:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            {DISPLAY_STEPS.map((step) => {
              const status = getDisplayStepStatus(step)
              const progress = getDisplayStepProgress(step)

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(step.navigateStep)}
                  className="group flex min-w-[120px] flex-col items-center text-center"
                >
                  <div
                    className={`text-[14px] transition ${
                      status === 'active'
                        ? 'font-medium text-[#1a1a1a]'
                        : status === 'done'
                          ? 'text-[#1a1a1a]'
                          : 'text-[#b8b8b8]'
                    }`}
                  >
                    {step.title}
                    {status === 'done' && (
                      <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#008234] text-[10px] text-white">
                        ✓
                      </span>
                    )}
                    {status === 'active' && <span className="ml-2 text-[#054aff]">◑</span>}
                  </div>

                  <div className="mt-4 flex h-[3px] w-[145px] overflow-hidden rounded-full bg-[#bdbdbd]">
                    <div
                      className={`h-full ${progress > 0 ? 'bg-[#0071c2]' : 'bg-transparent'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <main className="px-4 py-8 md:px-6 md:py-10 xl:px-8">
        <div className="mx-auto w-full max-w-[1600px]">
          <section className={currentStep === 1 ? 'block' : 'hidden'}>
            <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] md:text-[36px]">
              Basic Info
            </h1>

            <div className="mt-6 rounded-md border border-[#e7e7e7] bg-white p-4 shadow-sm md:p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                    Property Code
                  </label>
                  <input
                    value={propertyCode}
                    onChange={(e) => setPropertyCode(e.target.value)}
                    placeholder="Property Code"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                    Title EN
                  </label>
                  <input
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="Title EN"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                    Title AR
                  </label>
                  <input
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="Title AR"
                    className={inputClass}
                    dir="rtl"
                  />
                </div>

                <div className="relative md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                    Search map location
                  </label>
                  <input
                    value={addressSearch}
                    onChange={(e) => handleAddressSearchInputChange(e.target.value)}
                    placeholder="Search the map location only — this will not change Address EN/AR"
                    className={inputClass}
                    autoComplete="off"
                  />

                  {isSearchingAddress && (
                    <p className="mt-2 text-xs font-medium text-[#6b7280]">
                      Searching Mapbox...
                    </p>
                  )}

                  {addressSearchError && (
                    <p className="mt-2 text-xs font-medium text-[#b42318]">
                      {addressSearchError}
                    </p>
                  )}

                  {addressSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[74px] z-50 overflow-hidden rounded-xl border border-[#dbe4f0] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
                      {addressSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() => handleSelectAddressSuggestion(suggestion)}
                          className="block w-full border-b border-[#edf2f7] px-4 py-3 text-left transition last:border-b-0 hover:bg-[#f5f9ff]"
                        >
                          <span className="block text-sm font-semibold text-[#162033]">
                            {suggestion.text || suggestion.place_name}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-[#687385]">
                            {suggestion.place_name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedLatitude && selectedLongitude ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full bg-[#ecfdf3] px-3 py-1.5 text-xs font-semibold text-[#027a48]">
                        <span>✓ Map location selected</span>
                        <button
                          type="button"
                          onClick={clearSelectedMapLocation}
                          className="rounded-full bg-white/70 px-2 py-0.5 text-[#027a48]"
                        >
                          Clear
                        </button>
                      </div>

                      <span className="text-xs font-medium text-[#687385]">
                        {selectedLatitude}, {selectedLongitude}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[#6b7280]">
                      Search and select a result, or click on the map and drag the pin to the exact location. This does not change Address EN or Address AR.
                    </p>
                  )}

                  <div className="mt-4 overflow-hidden rounded-2xl border border-[#dbe4f0] bg-[#eef4fb] shadow-sm">
                    {mapboxToken ? (
                      <div ref={mapContainerRef} className="h-[340px] w-full" />
                    ) : (
                      <div className="flex h-[240px] items-center justify-center px-6 text-center text-sm font-medium text-[#b42318]">
                        Mapbox token is missing. Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local.
                      </div>
                    )}
                  </div>

                  <div className="mt-3 rounded-2xl border border-dashed border-[#bdd7f4] bg-[#f5f9ff] px-4 py-3 text-sm text-[#35506b]">
                    <p className="font-semibold text-[#162033]">Map location only</p>
                    <p className="mt-1 leading-6">
                      Use search to get near the property, then click the map or drag the pin to the exact building/area. Address EN and Address AR stay separate and are only the written address shown to students.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                    Address EN
                  </label>
                  <input
                    value={addressEn}
                    onChange={(e) => setAddressEn(e.target.value)}
                    placeholder="Address EN"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                    Address AR
                  </label>
                  <input
                    value={addressAr}
                    onChange={(e) => setAddressAr(e.target.value)}
                    placeholder="Address AR"
                    className={inputClass}
                    dir="rtl"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className={currentStep === 2 ? 'block' : 'hidden'}>
            <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] md:text-[36px]">
              Basic Info
            </h1>

            <div className="mt-6 rounded-md border border-[#e7e7e7] bg-white p-4 shadow-sm md:p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">City</label>
                  <select
                    value={cityId}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">University</label>
                  <select
                    value={universityId}
                    onChange={(e) => handleUniversityChange(e.target.value)}
                    disabled={!cityId}
                    className={`${selectClass} disabled:bg-[#f5f5f5]`}
                  >
                    <option value="">
                      {!cityId
                        ? 'Select City'
                        : filteredUniversities.length > 0
                          ? 'Select University'
                          : 'No universities for this city'}
                    </option>

                    {filteredUniversities.map((university) => (
                      <option key={university.id} value={university.id}>
                        {university.name_en}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-[#6b7280]">
                    This property is saved to the selected primary university.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Broker</label>

                  {canChangeBroker ? (
                    <select
                      value={brokerId}
                      onChange={(e) => setBrokerId(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select Broker</option>
                      {brokers.map((broker) => (
                        <option key={broker.id} value={broker.id}>
                          {broker.full_name}
                          {broker.company_name ? ` - ${broker.company_name}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={activeBrokerName}
                      disabled
                      className={`${inputClass} bg-[#f5f5f5]`}
                    />
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select Gender</option>
                    <option value="boys">Boys</option>
                    <option value="girls">Girls</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Owner</label>

                  <div className="rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-4">
                    <div className="mb-4">
                      <h3 className="text-base font-semibold text-[#0f3f75]">
                        Use Existing Owner
                      </h3>
                      <p className="mt-1 text-xs text-[#6b7280]">
                        Owner must be assigned to the selected city and university.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Search Owner
                        </label>
                        <input
                          value={ownerSearch}
                          onChange={(e) => setOwnerSearch(e.target.value)}
                          placeholder={
                            cityId && universityId
                              ? 'Search by name or phone...'
                              : 'Select city and university first'
                          }
                          disabled={!cityId || !universityId}
                          className={`${inputClass} disabled:bg-[#f5f5f5]`}
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Existing Owner
                        </label>
                        <select
                          value={ownerId}
                          onChange={(e) => setOwnerId(e.target.value)}
                          disabled={!cityId || !universityId}
                          className={`${selectClass} disabled:bg-[#f5f5f5]`}
                        >
                          <option value="">
                            {!cityId
                              ? 'Select City'
                              : !universityId
                                ? 'Select University'
                                : displayedOwners.length > 0
                                  ? 'Select Owner'
                                  : 'No matching owners'}
                          </option>

                          {selectedOwner &&
                          !displayedOwners.some((owner) => owner.id === selectedOwner.id) ? (
                            <option value={selectedOwner.id}>
                              {getOwnerLabel(selectedOwner)}
                            </option>
                          ) : null}

                          {displayedOwners.map((owner) => (
                            <option key={owner.id} value={owner.id}>
                              {getOwnerLabel(owner)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {cityId && universityId && eligibleOwners.length === 0 ? (
                      <div className="mt-3 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-xs text-[#92400e]">
                        No active owners are assigned to this city and university.
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-[#6b7280]">
                        Showing owners assigned to the selected university only.
                      </p>
                    )}

                    {selectedOwner ? (
                      <div className="mt-4 rounded-md border border-[#dbeafe] bg-[#f0f7ff] p-4 text-sm text-[#0f3f75]">
                        <p className="font-semibold text-[#0f3f75]">Selected owner details</p>
                        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                          <p>Name: {selectedOwner.full_name || '—'}</p>
                          <p>Phone: {selectedOwner.phone_number || '—'}</p>
                          <p>Company: {selectedOwner.company_name || '—'}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                    Availability Status
                  </label>
                  <select
                    value={availabilityStatus}
                    onChange={(e) =>
                      setAvailabilityStatus(
                        e.target.value as
                          | 'available'
                          | 'partially_reserved'
                          | 'fully_reserved'
                          | 'inactive'
                      )
                    }
                    className={selectClass}
                  >
                    <option value="available">Available</option>
                    <option value="partially_reserved">Partially Reserved</option>
                    <option value="fully_reserved">Reserved</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className={currentStep === 3 ? 'block' : 'hidden'}>
            <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] md:text-[36px]">
              Photos
            </h1>

            <div className="mt-6 rounded-md border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                multiple
                className="hidden"
                onChange={(e) => {
                  addImages(e.target.files)
                  e.target.value = ''
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDraggingPhotos(true)
                }}
                onDragEnter={(e) => {
                  e.preventDefault()
                  setIsDraggingPhotos(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  setIsDraggingPhotos(false)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDraggingPhotos(false)
                  addImages(e.dataTransfer.files)
                }}
                className={`rounded-md border-2 border-dashed px-6 py-10 text-center transition ${
                  isDraggingPhotos
                    ? 'border-[#0071c2] bg-[#f0f7ff]'
                    : 'border-[#9ca3af] bg-white'
                }`}
              >
                <div className="mx-auto flex max-w-[540px] flex-col items-center justify-center">
                  <div className="mb-6 flex h-[110px] w-[110px] items-center justify-center rounded-xl bg-[#f2f2f2]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#cfcfcf"
                      strokeWidth="1.7"
                      className="h-14 w-14"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <circle cx="16.5" cy="9" r="1.5" />
                      <path d="M5 17l4.5-4.5 3 3L15 13l4 4" />
                    </svg>
                  </div>

                  <p className="text-[18px] font-bold text-[#111827]">Drag and drop or</p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 inline-flex items-center gap-2 rounded-md border border-[#006ce4] bg-white px-5 py-3 text-[16px] font-semibold text-[#006ce4] transition hover:bg-[#f7fbff]"
                  >
                    Upload photos
                  </button>
                </div>
              </div>

              {totalImageCount > 0 && (
                <div className="mt-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[#4b5563]">
                      {totalImageCount} image{totalImageCount === 1 ? '' : 's'} selected
                    </p>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-md border border-[#0071c2] px-4 py-2 text-sm font-medium text-[#0071c2]"
                    >
                      Add more photos
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {existingImages.map((item, index) => (
                      <div
                        key={`existing-${item.id}`}
                        className="overflow-hidden rounded-md border border-[#d9d9d9] bg-white"
                      >
                        <img
                          src={item.image_url}
                          alt={`Existing ${index + 1}`}
                          className="h-48 w-full object-cover"
                        />

                        <div className="space-y-3 p-3">
                          <p className="truncate text-xs text-[#6b7280]">
                            Existing image #{index + 1}
                          </p>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setCoverSelection({ kind: 'existing', index })}
                              className={`rounded-md px-3 py-2 text-sm font-medium ${
                                coverSelection.kind === 'existing' &&
                                coverSelection.index === index &&
                                existingCoverActive
                                  ? 'bg-[#0071c2] text-white'
                                  : 'border border-[#cfcfcf] bg-white text-[#1a1a1a]'
                              }`}
                            >
                              {coverSelection.kind === 'existing' &&
                              coverSelection.index === index &&
                              existingCoverActive
                                ? 'Cover'
                                : 'Set Cover'}
                            </button>

                            <button
                              type="button"
                              onClick={() => removeExistingImage(index)}
                              className="rounded-md border border-[#cfcfcf] bg-white px-3 py-2 text-sm font-medium text-[#1a1a1a]"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {newImageFiles.map((item, index) => (
                      <div
                        key={`new-${item.previewUrl}-${index}`}
                        className="overflow-hidden rounded-md border border-[#d9d9d9] bg-white"
                      >
                        <img
                          src={item.previewUrl}
                          alt={`New ${index + 1}`}
                          className="h-48 w-full object-cover"
                        />

                        <div className="space-y-3 p-3">
                          <p className="truncate text-xs text-[#6b7280]">
                            {item.file?.name || `New image ${index + 1}`}
                          </p>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setCoverSelection({ kind: 'new', index })}
                              disabled={!item.file}
                              className={`rounded-md px-3 py-2 text-sm font-medium ${
                                coverSelection.kind === 'new' &&
                                coverSelection.index === index &&
                                newCoverActive &&
                                item.file
                                  ? 'bg-[#0071c2] text-white'
                                  : 'border border-[#cfcfcf] bg-white text-[#1a1a1a]'
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {coverSelection.kind === 'new' &&
                              coverSelection.index === index &&
                              newCoverActive &&
                              item.file
                                ? 'Cover'
                                : 'Set Cover'}
                            </button>

                            <button
                              type="button"
                              onClick={() => removeNewImage(index)}
                              className="rounded-md border border-[#cfcfcf] bg-white px-3 py-2 text-sm font-medium text-[#1a1a1a]"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className={currentStep === 4 ? 'block' : 'hidden'}>
            <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] md:text-[36px]">
              Property Details
            </h1>

            <div className="mt-6 rounded-md border border-[#e7e7e7] bg-white p-6 shadow-sm">
              <div className="space-y-10">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                    Full Apartment Price (EGP)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={priceEgp}
                    onChange={(e) => setPriceEgp(normalizeNumberString(e.target.value))}
                    placeholder="Example: 9000"
                    className={inputClass}
                  />
                  <p className="mt-2 text-sm text-[#6b7280]">
                    This is the full property price when the whole apartment is booked.
                  </p>
                </div>

                {lowestAvailableOptionPrice && (
                  <div className="rounded-md border border-[#dbeafe] bg-[#f0f7ff] p-4 text-sm text-[#0f3f75]">
                    Lowest room option currently entered:
                    <span className="ml-2 font-semibold">
                      {lowestAvailableOptionPrice} EGP
                    </span>
                  </div>
                )}

                <CounterField
                  label="What floor is the apartment on?"
                  value={floorNumber}
                  onChange={setFloorNumber}
                  helperText="Use 0 for ground floor."
                />

                <CounterField
                  label="How many bedrooms are there?"
                  value={bedroomsCount}
                  onChange={setBedroomsCount}
                  helperText="This value is automatically synced from room cards when rooms change."
                />

                <CounterField
                  label="How many beds are there?"
                  value={bedsCount}
                  onChange={setBedsCount}
                  helperText="This is auto-calculated from room beds, but you can still adjust it if needed."
                />

                <CounterField
                  label="How many guests can stay?"
                  value={guestsCount}
                  onChange={setGuestsCount}
                />

                <CounterField
                  label="How many bathrooms are there?"
                  value={bathroomsCount}
                  onChange={setBathroomsCount}
                />
              </div>
            </div>
          </section>

          <section className={currentStep === 5 ? 'block' : 'hidden'}>
            <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] md:text-[36px]">
              Rooms & Pricing
            </h1>

            <div className="mt-6 rounded-md border border-[#e7e7e7] bg-white p-6 shadow-sm">
              {hasBookingRequests && (
                <div className="mb-6 rounded-md border border-[#f1c86b] bg-[#fff8e7] p-4 text-sm text-[#8a6400]">
                  This property already has booking requests. Please avoid changing the broker or
                  room structure unless necessary, so broker-facing requests stay consistent.
                </div>
              )}

              <div className="mb-6 rounded-md border border-[#dbeafe] bg-[#f0f7ff] p-4 text-sm text-[#0f3f75]">
                لكل غرفة فعل الخيارات اللي عايزها تتعرض للعميل:
                <span className="mx-1 font-semibold">Single Room</span>
                و
                <span className="mx-1 font-semibold">Double Room</span>
                و
                <span className="mx-1 font-semibold">Triple Room</span>
                مع سعر مستقل لكل خيار.
              </div>

              <div className="space-y-5">
                {roomState.map((room, index) => {
                  const bedsCountValue = getBedsCountNumber(room.beds_count)

                  return (
                    <div
                      key={room.id || index}
                      className="rounded-md border border-[#e5e7eb] bg-white p-5 shadow-sm"
                    >
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-[22px] font-bold text-[#1a1a1a]">
                            {room.room_name || `Bedroom ${index + 1}`}
                          </h3>
                          <p className="mt-1 text-sm text-[#6b7280]">
                            {getRoomOptionCountLabel(room)} • {room.beds_count || '0'} bed(s)
                            {' • '}
                            <span className={room.is_reserved ? 'text-[#b42318]' : 'text-[#027a48]'}>
                              {room.is_reserved ? 'Reserved' : 'Available'}
                            </span>
                          </p>
                        </div>

                        {roomState.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRoom(index)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#bfbfbf] text-[24px] text-[#6b7280]"
                          >
                            −
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                            Room Name EN
                          </label>
                          <input
                            value={room.room_name}
                            onChange={(e) => updateRoom(index, 'room_name', e.target.value)}
                            placeholder="Room Name EN"
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                            Room Type
                          </label>
                          <select
                            value={room.room_type}
                            onChange={(e) =>
                              updateRoom(index, 'room_type', e.target.value)
                            }
                            className={selectClass}
                          >
                            <option value="single">Single</option>
                            <option value="double">Double</option>
                            <option value="triple">Triple</option>
                            <option value="quad">Quad</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                            Beds Count
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={room.beds_count}
                            onChange={(e) => updateRoom(index, 'beds_count', e.target.value)}
                            placeholder="Beds Count"
                            className={inputClass}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={room.private_bathroom}
                              onChange={(e) =>
                                updateRoom(index, 'private_bathroom', e.target.checked)
                              }
                              className="h-4 w-4"
                            />
                            <span className="text-sm font-medium text-[#1a1a1a]">
                              Private bathroom
                            </span>
                          </label>
                        </div>

                        <div className="md:col-span-2">
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={room.is_reserved}
                              onChange={(e) =>
                                updateRoom(index, 'is_reserved', e.target.checked)
                              }
                              className="h-4 w-4"
                            />
                            <span className="text-sm font-medium text-[#1a1a1a]">
                              Room is reserved
                            </span>
                          </label>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 gap-4 xl:grid-cols-3">
                          <RoomOptionField
                            title="Single Room"
                            description="يعرض خيار حجز الغرفة كاملة لطالب واحد."
                            enabled={room.single_room_enabled}
                            price={room.single_room_price_egp}
                            onToggle={(value) =>
                              updateRoom(index, 'single_room_enabled', value)
                            }
                            onPriceChange={(value) =>
                              updateRoom(index, 'single_room_price_egp', value)
                            }
                            inputClass={inputClass}
                          />

                          <RoomOptionField
                            title="Double Room"
                            description="يعرض حجز سرير واحد داخل غرفة دابل، ويتطلب 2 سرير أو أكثر."
                            enabled={room.double_room_enabled}
                            price={room.double_room_price_egp}
                            onToggle={(value) =>
                              updateRoom(index, 'double_room_enabled', value)
                            }
                            onPriceChange={(value) =>
                              updateRoom(index, 'double_room_price_egp', value)
                            }
                            inputClass={inputClass}
                            disabled={bedsCountValue < 2}
                            disabledReason="Double Room requires at least 2 beds."
                          />

                          <RoomOptionField
                            title="Triple Room"
                            description="يعرض حجز سرير واحد داخل غرفة تربل، ويتطلب 3 سراير أو أكثر."
                            enabled={room.triple_room_enabled}
                            price={room.triple_room_price_egp}
                            onToggle={(value) =>
                              updateRoom(index, 'triple_room_enabled', value)
                            }
                            onPriceChange={(value) =>
                              updateRoom(index, 'triple_room_price_egp', value)
                            }
                            inputClass={inputClass}
                            disabled={bedsCountValue < 3}
                            disabledReason="Triple Room requires at least 3 beds."
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={addRoom}
                className="mt-6 inline-flex items-center gap-2 text-[18px] font-medium text-[#0071c2]"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#0071c2] text-[18px]">
                  +
                </span>
                Add room
              </button>
            </div>
          </section>

          <section className={currentStep === 6 ? 'block' : 'hidden'}>
            <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] md:text-[36px]">
              Property Featured
            </h1>

            <div className="mt-6 space-y-6">
              {canChangeAdminStatus && (
                <FeatureSection
                  title="Featured Placement"
                  subtitle="Use this to push selected properties to the top of search results. This is separate from amenities/facilities."
                >
                  <div className="space-y-5">
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e6ebf2] bg-[#f8fbff] p-4">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(event) => setIsFeatured(event.target.checked)}
                        className="mt-1 h-4 w-4"
                      />

                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-[#162033]">
                          Mark this property as Featured
                        </span>
                        <span className="mt-1 block text-sm text-[#687385]">
                          Featured properties appear before normal properties in the public
                          search page.
                        </span>
                      </span>
                    </label>

                    {isFeatured && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                            Featured Rank
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={featuredRank}
                            onChange={(event) => setFeaturedRank(event.target.value)}
                            placeholder="100"
                            className={inputClass}
                          />
                          <p className="mt-2 text-xs text-[#687385]">
                            Higher rank appears first. Example: 100 appears before 50.
                          </p>
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                            Featured Until
                          </span>
                          <input
                            type="datetime-local"
                            value={featuredUntil}
                            onChange={(event) => setFeaturedUntil(event.target.value)}
                            className={inputClass}
                          />
                          <p className="mt-2 text-xs text-[#687385]">
                            Leave empty to keep it featured without an expiry date.
                          </p>
                        </label>
                      </div>
                    )}
                  </div>
                </FeatureSection>
              )}

              {!canChangeAdminStatus && property.is_featured === true && (
                <FeatureSection
                  title="Featured Placement"
                  subtitle="This property is currently featured. Only super admins can change this setting."
                >
                  <div className="rounded-2xl border border-[#dbeafe] bg-[#eff6ff] p-4 text-sm text-[#1e3a8a]">
                    Featured Rank: {property.featured_rank ?? 0}
                    {property.featured_until
                      ? ` · Until: ${new Date(property.featured_until).toLocaleString()}`
                      : ' · No expiry date'}
                  </div>
                </FeatureSection>
              )}

              {amenityCategoryGroups.map((group) => (
                <FeatureSection
                  key={group.key}
                  title={group.title}
                  subtitle={`${group.items.length} item${group.items.length === 1 ? '' : 's'}`}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((item) => (
                      <FeatureSelectableCard
                        key={item.id}
                        inputId={`amenity-${item.id}`}
                        inputName="amenity_ids"
                        inputValue={item.id}
                        title={item.name_en}
                        iconUrl={item.icon_url}
                        defaultChecked={selectedAmenityIds.includes(item.id)}
                      />
                    ))}
                  </div>
                </FeatureSection>
              ))}

              {activeFacilities.length > 0 && (
                <FeatureSection
                  title="Facilities"
                  subtitle={`${activeFacilities.length} item${
                    activeFacilities.length === 1 ? '' : 's'
                  }`}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {activeFacilities.map((item) => (
                      <FeatureSelectableCard
                        key={item.id}
                        inputId={`facility-${item.id}`}
                        inputName="facility_ids"
                        inputValue={item.id}
                        title={item.name_en}
                        iconUrl={item.icon_url}
                        defaultChecked={selectedFacilityIds.includes(item.id)}
                      />
                    ))}
                  </div>
                </FeatureSection>
              )}

              <FeatureSection
                title="Bills Included"
                subtitle="Select the bills already included in the property price."
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {activeBillTypes.map((item) => (
                    <FeatureSelectableCard
                      key={item.id}
                      inputId={`bill-type-${item.id}`}
                      inputName="bill_type_ids"
                      inputValue={item.id}
                      title={item.name_en}
                      iconUrl={item.icon_url}
                      defaultChecked={selectedBillTypeIds.includes(item.id)}
                    />
                  ))}
                </div>
              </FeatureSection>
            </div>
          </section>

          <section className={currentStep === 7 ? 'block' : 'hidden'}>
            <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] md:text-[36px]">
              Review
            </h1>

            <div className="mt-6 space-y-6">
              <div className="rounded-md border border-[#e7e7e7] bg-white p-4 shadow-sm md:p-5">
                <h2 className="mb-3 text-lg font-semibold">Review Summary</h2>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Property Code
                    </p>
                    <p className="mt-1 font-semibold">{propertyCode || '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Status
                    </p>
                    <p className="mt-1 font-semibold">{adminStatus}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Availability Status
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatAvailabilityStatusLabel(derivedAvailabilityStatus)}
                    </p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Title EN
                    </p>
                    <p className="mt-1 font-semibold">{titleEn || '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Title AR
                    </p>
                    <p className="mt-1 font-semibold">{titleAr || '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Address EN
                    </p>
                    <p className="mt-1 font-semibold">{addressEn || '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Address AR
                    </p>
                    <p className="mt-1 font-semibold">{addressAr || '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Map Location
                    </p>
                    <p className="mt-1 font-semibold">
                      {selectedLatitude && selectedLongitude
                        ? selectedMapLocationLabel || `${selectedLatitude}, ${selectedLongitude}`
                        : '-'}
                    </p>
                    {selectedLatitude && selectedLongitude ? (
                      <p className="mt-1 text-xs text-[#6b7280]">
                        {selectedLatitude}, {selectedLongitude}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      City
                    </p>
                    <p className="mt-1 font-semibold">
                      {cities.find((city) => city.id === cityId)?.name_en || '-'}
                    </p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      University
                    </p>
                    <p className="mt-1 font-semibold">
                      {selectedUniversity?.name_en || '-'}
                    </p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Broker
                    </p>
                    <p className="mt-1 font-semibold">
                      {brokers.find((broker) => broker.id === brokerId)?.full_name ||
                        activeBrokerName ||
                        '-'}
                    </p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Owner
                    </p>
                    <p className="mt-1 font-semibold">
                      {selectedOwner ? getOwnerLabel(selectedOwner) : '-'}
                    </p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Gender
                    </p>
                    <p className="mt-1 font-semibold">{gender || '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Full Apartment Price
                    </p>
                    <p className="mt-1 font-semibold">
                      {priceEgp ? `${priceEgp} EGP` : '-'}
                    </p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Floor Number
                    </p>
                    <p className="mt-1 font-semibold">{floorNumber}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Lowest Room Option Price
                    </p>
                    <p className="mt-1 font-semibold">
                      {lowestAvailableOptionPrice
                        ? `${lowestAvailableOptionPrice} EGP`
                        : '-'}
                    </p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Images
                    </p>
                    <p className="mt-1 font-semibold">{totalImageCount}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Bedrooms
                    </p>
                    <p className="mt-1 font-semibold">{bedroomsCount}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Bathrooms
                    </p>
                    <p className="mt-1 font-semibold">{bathroomsCount || '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Beds
                    </p>
                    <p className="mt-1 font-semibold">{bedsCount}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Guests
                    </p>
                    <p className="mt-1 font-semibold">{guestsCount || '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Rooms
                    </p>
                    <p className="mt-1 font-semibold">{roomState.length}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                      Booking Requests
                    </p>
                    <p className="mt-1 font-semibold">{safeBookingRequests.length}</p>
                  </div>
                </div>

                {roomState.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                      Rooms Summary
                    </h3>

                    <div className="space-y-3">
                      {roomState.map((room, index) => {
                        const optionLabels: string[] = []

                        if (room.single_room_enabled) {
                          optionLabels.push(
                            `Single: ${room.single_room_price_egp || '-'} EGP`
                          )
                        }

                        if (room.double_room_enabled) {
                          optionLabels.push(
                            `Double: ${room.double_room_price_egp || '-'} EGP`
                          )
                        }

                        if (room.triple_room_enabled) {
                          optionLabels.push(
                            `Triple: ${room.triple_room_price_egp || '-'} EGP`
                          )
                        }

                        return (
                          <div
                            key={room.id || index}
                            className="rounded-md border border-[#ececec] p-3"
                          >
                            <p className="font-semibold text-[#1a1a1a]">
                              {room.room_name || `Room ${index + 1}`}
                            </p>
                            <p className="mt-2 text-sm text-[#6b7280]">
                              Type: {room.room_type} | Beds: {room.beds_count || '0'}
                            </p>
                            <p className="mt-1 text-sm text-[#6b7280]">
                              Status: {room.is_reserved ? 'Reserved' : 'Available'}
                            </p>
                            <p className="mt-1 text-sm text-[#6b7280]">
                              Options:{' '}
                              {optionLabels.length > 0 ? optionLabels.join(' | ') : '-'}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="mt-8 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm md:p-5">
            {(stepError || errorMessage) && (
              <div className="mb-4 space-y-3">
                {stepError && (
                  <div className="rounded-xl border border-[#f1c86b] bg-[#fff8e7] px-4 py-3 text-sm font-medium text-[#8a6400]">
                    {stepError}
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-xl border border-[#e0a8a8] bg-[#fff2f2] px-4 py-3 text-sm font-medium text-[#b42318]">
                    {errorMessage}
                  </div>
                )}
              </div>
            )}

            {uploadProgress && (
              <div className="mb-4 rounded-xl border border-[#bdd7f4] bg-[#f3f9ff] px-4 py-3 text-sm font-medium text-[#0b66c3]">
                {uploadProgress}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={currentStep === 1 || isBusy}
                className="inline-flex h-[46px] items-center justify-center rounded-xl border border-[#d1d5db] bg-white px-5 text-sm font-medium text-[#1a1a1a] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>

              {currentStep < FORM_STEPS.length ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={isBusy}
                  className="inline-flex h-[46px] min-w-[140px] items-center justify-center rounded-xl bg-[#0071c2] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#005fa3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isBusy || !propertyCode}
                  className="inline-flex h-[46px] min-w-[160px] items-center justify-center rounded-xl bg-[#0071c2] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#005fa3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploadingImages ? uploadProgress || 'Uploading images...' : isPending ? 'Saving...' : 'Update Property'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </form>
  )
}