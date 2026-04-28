'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updatePropertyAction } from './actions'

type City = { id: string; name_en: string; name_ar: string }
type University = { id: string; city_id: string; name_en: string; name_ar: string }
type Broker = { id: string; full_name: string; company_name?: string | null }

type OwnerServiceArea = {
  id?: string
  city_id: string
  university_id: string
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

type Amenity = { id: string; name_en: string; name_ar: string }
type Facility = { id: number; name_en: string; name_ar: string }
type BillType = { id: number; name_en: string; name_ar: string }

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
  description_en: string
  description_ar: string
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

const FORM_STEPS = [
  { id: 1, title: 'Basic Info' },
  { id: 2, title: 'Relations' },
  { id: 3, title: 'Photos' },
  { id: 4, title: 'Property Details' },
  { id: 5, title: 'Property Featured' },
  { id: 6, title: 'Rooms & Pricing' },
  { id: 7, title: 'Review' },
]

const DISPLAY_STEPS: DisplayStep[] = [
  { id: 1, title: 'Basic Info', startStep: 1, endStep: 1, navigateStep: 1 },
  { id: 2, title: 'Relations', startStep: 2, endStep: 2, navigateStep: 2 },
  { id: 3, title: 'Photos', startStep: 3, endStep: 3, navigateStep: 3 },
  { id: 4, title: 'Property Details', startStep: 4, endStep: 4, navigateStep: 4 },
  { id: 5, title: 'Property Featured', startStep: 5, endStep: 5, navigateStep: 5 },
  { id: 6, title: 'Rooms & Pricing', startStep: 6, endStep: 6, navigateStep: 6 },
  { id: 7, title: 'Review', startStep: 7, endStep: 7, navigateStep: 7 },
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
  single_room_enabled: true,
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

function getAvailabilityStatusFromRooms(
  rooms: RoomForm[]
): 'available' | 'partially_reserved' | 'fully_reserved' {
  if (rooms.length === 0) return 'available'

  const reservedCount = rooms.filter((room) => room.is_reserved).length

  if (reservedCount === 0) return 'available'
  if (reservedCount === rooms.length) return 'fully_reserved'
  return 'partially_reserved'
}

function formatBookingRequestStatus(status: string) {
  if (!status) return 'Unknown'

  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatBookingRequestDate(value?: string | null) {
  if (!value) return '—'

  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function getBookingRequestStatusClass(status: string) {
  if (status === 'new') {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  if (status === 'contacted') {
    return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  }

  if (status === 'in_progress') {
    return 'border-purple-200 bg-purple-50 text-purple-700'
  }

  if (status === 'converted') {
    return 'border-green-200 bg-green-50 text-green-700'
  }

  if (status === 'cancelled') {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  return 'border-gray-200 bg-gray-50 text-gray-700'
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

  return options.some(
    (item) => item.code === code && item.is_active !== false
  )
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
  const options: Array<{ label: string; price: string; bedsUsed: number }> = []

  if (room.single_room_enabled && isValidPrice(room.single_room_price_egp)) {
    options.push({
      label: 'Single',
      price: room.single_room_price_egp,
      bedsUsed: 1,
    })
  }

  if (room.double_room_enabled && isValidPrice(room.double_room_price_egp)) {
    options.push({
      label: 'Double',
      price: room.double_room_price_egp,
      bedsUsed: 2,
    })
  }

  if (room.triple_room_enabled && isValidPrice(room.triple_room_price_egp)) {
    options.push({
      label: 'Triple',
      price: room.triple_room_price_egp,
      bedsUsed: 3,
    })
  }

  return options
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
}: {
  title: string
  description: string
  enabled: boolean
  price: string
  onToggle: (value: boolean) => void
  onPriceChange: (value: string) => void
  inputClass: string
  disabled?: boolean
}) {
  return (
    <div
      className={`rounded-md border border-[#ececec] p-4 ${
        disabled ? 'bg-[#f8fafc]' : 'bg-white'
      }`}
    >
      <label className="mb-3 flex items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          disabled={disabled}
          className="h-4 w-4"
        />
        <span className="text-sm font-medium text-[#1a1a1a]">{title}</span>
      </label>

      <p className="mb-3 text-sm text-[#6b7280]">{description}</p>

      <input
        type="number"
        min="1"
        step="any"
        value={price}
        onChange={(e) => onPriceChange(e.target.value)}
        placeholder={`${title} price`}
        disabled={!enabled || disabled}
        className={`${inputClass} disabled:bg-[#f5f5f5]`}
      />
    </div>
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
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [errorMessage, setErrorMessage] = useState('')
  const [stepError, setStepError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)

  const [propertyCode, setPropertyCode] = useState(property.property_id)
  const [adminStatus, setAdminStatus] = useState<
    'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'
  >(property.admin_status)
  const [titleEn, setTitleEn] = useState(property.title_en)
  const [titleAr, setTitleAr] = useState(property.title_ar)
  const [descriptionEn, setDescriptionEn] = useState(property.description_en)
  const [descriptionAr, setDescriptionAr] = useState(property.description_ar)
  const [addressEn, setAddressEn] = useState(property.address_en || '')
  const [addressAr, setAddressAr] = useState(property.address_ar || '')

  const [cityId, setCityId] = useState(property.city_id)
  const [universityId, setUniversityId] = useState(property.university_id)
  const [brokerId, setBrokerId] = useState(property.broker_id)
  const [ownerId, setOwnerId] = useState(property.owner_id || '')
  const [priceEgp, setPriceEgp] = useState(String(property.price_egp || ''))
  const [propertyRentalDuration, setPropertyRentalDuration] = useState<
    'daily' | 'monthly'
  >(property.rental_duration)
  const [availabilityStatus, setAvailabilityStatus] = useState<
    'available' | 'partially_reserved' | 'fully_reserved' | 'inactive'
  >(property.availability_status)

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
  const [smokingPolicy, setSmokingPolicy] = useState(
    property.smoking_policy || ''
  )
  const [airbnbPriceMin, setAirbnbPriceMin] = useState(
    String(property.airbnb_price_min ?? '')
  )
  const [airbnbPriceMax, setAirbnbPriceMax] = useState(
    String(property.airbnb_price_max ?? '')
  )
  const [latitude, setLatitude] = useState(String(property.latitude ?? ''))
  const [longitude, setLongitude] = useState(String(property.longitude ?? ''))

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
          room_name_ar: room?.room_name_ar || '',
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
      : [{ ...initialRoom, rental_duration: property?.rental_duration || 'monthly' }]
  )

  const inputClass =
    'w-full rounded-md border border-[#cfcfcf] px-3 py-2.5 text-sm outline-none transition focus:border-[#0071c2]'
  const selectClass =
    'w-full rounded-md border border-[#cfcfcf] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0071c2]'

  const filteredUniversities = useMemo(() => {
    if (!cityId) return []
    return universities.filter((u) => u.city_id === cityId)
  }, [cityId, universities])

  const selectedOwner = useMemo(() => {
    return owners.find((owner) => owner.id === ownerId) || null
  }, [owners, ownerId])

  const filteredOwners = useMemo(() => {
    if (!cityId || !universityId) return []

    const matchingOwners = owners.filter(
      (owner) =>
        owner.is_active !== false &&
        ownerMatchesLocation(owner, cityId, universityId)
    )

    const selectedOwnerExists =
      selectedOwner &&
      selectedOwner.is_active !== false &&
      !matchingOwners.some((owner) => owner.id === selectedOwner.id)

    const finalOwners = selectedOwnerExists
      ? [...matchingOwners, selectedOwner]
      : matchingOwners

    return finalOwners.sort((a, b) =>
      getOwnerLabel(a).localeCompare(getOwnerLabel(b))
    )
  }, [owners, cityId, universityId, selectedOwner])

  const activeBrokerName =
    brokers.find((broker) => broker.id === property.broker_id)?.full_name ||
    property.broker_id

  const activeOwnerName =
    selectedOwner?.full_name ||
    owners.find((owner) => owner.id === property.owner_id)?.full_name ||
    property.owner_id ||
    ''

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

  const lowestRoomOptionPrice = useMemo(() => {
    const prices = roomState.flatMap((room) =>
      getEnabledRoomOptions(room).map((option) =>
        Number(normalizeNumberString(option.price))
      )
    )
    const validPrices = prices.filter((value) => Number.isFinite(value) && value > 0)
    if (validPrices.length === 0) return null
    return Math.min(...validPrices)
  }, [roomState])

  const hasValidRoom = roomState.some((room) => {
    const bedsCountValue = Number(normalizeNumberString(room.beds_count || '0'))

    const hasValidSingle =
      room.single_room_enabled &&
      isValidPrice(room.single_room_price_egp) &&
      bedsCountValue >= 1

    const hasValidDouble =
      room.double_room_enabled &&
      isValidPrice(room.double_room_price_egp) &&
      bedsCountValue >= 2

    const hasValidTriple =
      room.triple_room_enabled &&
      isValidPrice(room.triple_room_price_egp) &&
      bedsCountValue >= 3

    return (
      room.room_name.trim() !== '' &&
      room.room_name_ar.trim() !== '' &&
      room.room_type.trim() !== '' &&
      room.rental_duration.trim() !== '' &&
      isValidPositiveInt(room.beds_count) &&
      (hasValidSingle || hasValidDouble || hasValidTriple)
    )
  })

  const hasInvalidCompletedRoom = roomState.some((room) => {
    const hasAnyValue =
      room.room_name.trim() !== '' ||
      room.room_name_ar.trim() !== '' ||
      room.room_type.trim() !== '' ||
      room.rental_duration.trim() !== '' ||
      room.beds_count.trim() !== '' ||
      room.single_room_enabled ||
      room.single_room_price_egp.trim() !== '' ||
      room.double_room_enabled ||
      room.double_room_price_egp.trim() !== '' ||
      room.triple_room_enabled ||
      room.triple_room_price_egp.trim() !== ''

    if (!hasAnyValue) return false

    const bedsCountValue = Number(normalizeNumberString(room.beds_count || '0'))

    const hasInvalidEnabledOption =
      (room.single_room_enabled &&
        (!isValidPrice(room.single_room_price_egp) || bedsCountValue < 1)) ||
      (room.double_room_enabled &&
        (!isValidPrice(room.double_room_price_egp) || bedsCountValue < 2)) ||
      (room.triple_room_enabled &&
        (!isValidPrice(room.triple_room_price_egp) || bedsCountValue < 3))

    const enabledOptionsCount = [
      room.single_room_enabled,
      room.double_room_enabled,
      room.triple_room_enabled,
    ].filter(Boolean).length

    return (
      room.room_name.trim() === '' ||
      room.room_name_ar.trim() === '' ||
      room.room_type.trim() === '' ||
      room.rental_duration.trim() === '' ||
      !isValidPositiveInt(room.beds_count) ||
      enabledOptionsCount === 0 ||
      hasInvalidEnabledOption
    )
  })

  const hasBookingRequests = safeBookingRequests.length > 0

  useEffect(() => {
    if (roomState.length > 0) {
      setBedsCount(String(totalBedsFromRooms))
    } else {
      setBedsCount('0')
    }
  }, [totalBedsFromRooms, roomState.length])

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

    const ownerStillValid = owners.some(
      (owner) =>
        owner.id === ownerId &&
        owner.is_active !== false &&
        ownerMatchesLocation(owner, cityId, universityId)
    )

    if (!ownerStillValid && ownerId !== property.owner_id) {
      setOwnerId('')
    }
  }, [cityId, universityId, ownerId, owners, property.owner_id])

  useEffect(() => {
    return () => {
      newImageFiles.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl)
        }
      })
    }
  }, [newImageFiles])

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
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl)
      }

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
        room_name_ar: `غرفة نوم ${nextNumber}`,
        rental_duration: propertyRentalDuration,
      },
    ])
  }

  const updateRoom = (index: number, field: keyof RoomForm, value: string | boolean) => {
    setRoomState((prev) =>
      prev.map((room, i) =>
        i === index
          ? {
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
            }
          : room
      )
    )
  }

  const removeRoom = (index: number) => {
    setRoomState((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCityChange = (value: string) => {
    setCityId(value)

    const nextUniversities = universities.filter((u) => u.city_id === value)
    const universityStillValid = nextUniversities.some((u) => u.id === universityId)

    if (!universityStillValid) {
      setUniversityId('')
    }

    setOwnerId('')
  }

  const handleUniversityChange = (value: string) => {
    setUniversityId(value)
    setOwnerId('')
  }

  const handleBrokerChange = (value: string) => {
    setBrokerId(value)
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (
          !propertyCode.trim() ||
          !titleEn.trim() ||
          !titleAr.trim() ||
          !descriptionEn.trim() ||
          !descriptionAr.trim() ||
          !addressEn.trim() ||
          !addressAr.trim()
        ) {
          return 'Please complete all basic information fields.'
        }
        return ''

      case 2:
        if (
          !cityId.trim() ||
          !universityId.trim() ||
          !priceEgp.trim() ||
          !propertyRentalDuration.trim()
        ) {
          return 'Please complete city, university, prices start from, and rental duration.'
        }

        if (!isValidPrice(priceEgp)) {
          return 'Please enter a valid full apartment price.'
        }

        if (!canChangeBroker && !property.broker_id.trim()) {
          return 'Broker information is missing for this property.'
        }

        if (canChangeBroker && !brokerId.trim()) {
          return 'Please select a broker.'
        }

        if (!ownerId.trim()) {
          return 'Please select the property owner.'
        }

        if (
          !owners.some(
            (owner) =>
              owner.id === ownerId &&
              owner.is_active !== false &&
              ownerMatchesLocation(owner, cityId, universityId)
          )
        ) {
          return 'Selected owner is not available for the selected city and university.'
        }

        return ''

      case 3:
        if (!hasAtLeastOneImage) {
          return 'Please upload at least one image.'
        }
        return ''

      case 4:
        if (
          !isValidNonNegativeInt(bedroomsCount) ||
          !isValidNonNegativeInt(bathroomsCount) ||
          !isValidNonNegativeInt(bedsCount) ||
          !isValidNonNegativeInt(guestsCount)
        ) {
          return 'Bedrooms, bathrooms, beds, and guests must be valid non-negative numbers.'
        }
        return ''

      case 6:
        if (!hasValidRoom) {
          return 'Please complete at least one room with valid enabled pricing options and beds count.'
        }

        if (hasInvalidCompletedRoom) {
          return 'One or more rooms have incomplete data or invalid option pricing.'
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
    const status = getDisplayStepStatus(step)
    if (status === 'done') return 100
    if (status === 'active') return 45
    return 0
  }

  const handleSubmit = async (formData: FormData) => {
    setErrorMessage('')
    setStepError('')

    const finalValidationSteps = [1, 2, 3, 4, 6]
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
    formData.set('description_en', descriptionEn)
    formData.set('description_ar', descriptionAr)
    formData.set('address_en', addressEn)
    formData.set('address_ar', addressAr)
    formData.set('city_id', cityId)
    formData.set('university_id', universityId)
    formData.set('owner_id', ownerId)
    formData.set('price_egp', normalizeNumberString(priceEgp))
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
    formData.set('latitude', normalizeNumberString(latitude))
    formData.set('longitude', normalizeNumberString(longitude))

    if (!canChangeBroker) {
      formData.set('broker_id', property.broker_id)
    } else {
      formData.set('broker_id', brokerId)
    }

    if (!canChangeAdminStatus) {
      formData.set('admin_status', property.admin_status)
    } else {
      formData.set(
        'admin_status',
        adminStatus === 'pending_review' ? 'pending_review' : 'draft'
      )
    }

    formData.delete('existing_image_ids')
    existingImages.forEach((image) => {
      formData.append('existing_image_ids', image.id)
    })

    formData.delete('images')
    newImageFiles.forEach((item) => {
      if (item.file) {
        formData.append('images', item.file)
      }
    })

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
      formData.append('room_name_ar', room.room_name_ar)
      formData.append('room_type', room.room_type)
      formData.append('room_rental_duration', room.rental_duration)
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
        await updatePropertyAction(formData)
        router.push('/admin/properties')
        router.refresh()
      } catch (error: any) {
        setErrorMessage(error.message || 'Something went wrong')
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

  return (
    <form
      action={handleSubmit}
      onKeyDown={(event) => {
        const target = event.target as HTMLElement
        const tagName = target.tagName.toLowerCase()
        const isTextarea = tagName === 'textarea'

        if (event.key === 'Enter' && !isTextarea) {
          event.preventDefault()
        }
      }}
      className="min-h-screen bg-[#f2f2f2]"
    >
      <input type="hidden" name="property_db_id" value={property.id} />
      {!canChangeBroker && <input type="hidden" name="broker_id" value={property.broker_id} />}
      {!canChangeAdminStatus && (
        <input type="hidden" name="admin_status" value={property.admin_status} />
      )}

      <div className="border-b border-[#e4e4e4] bg-[#f7f7f7]">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
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
                      className={`${progress > 0 ? 'bg-[#0071c2]' : 'bg-transparent'} h-full`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <main className="px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto max-w-[1100px]">
          <div className="max-w-[1000px]">
            <section className={currentStep === 1 ? 'block' : 'hidden'}>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] md:text-[36px]">
                    Basic Info
                  </h1>
                </div>
              </div>

              <div className="mt-6 rounded-md border border-[#e7e7e7] bg-white p-4 shadow-sm md:p-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                      Property Code
                    </label>
                    <input
                      name="property_id"
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
                      name="title_en"
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
                      name="title_ar"
                      value={titleAr}
                      onChange={(e) => setTitleAr(e.target.value)}
                      placeholder="Title AR"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                      Description EN
                    </label>
                    <textarea
                      name="description_en"
                      value={descriptionEn}
                      onChange={(e) => setDescriptionEn(e.target.value)}
                      placeholder="Description EN"
                      rows={4}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                      Description AR
                    </label>
                    <textarea
                      name="description_ar"
                      value={descriptionAr}
                      onChange={(e) => setDescriptionAr(e.target.value)}
                      placeholder="Description AR"
                      rows={4}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                      Address EN
                    </label>
                    <input
                      name="address_en"
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
                      name="address_ar"
                      value={addressAr}
                      onChange={(e) => setAddressAr(e.target.value)}
                      placeholder="Address AR"
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                      Status
                    </label>

                    {canChangeAdminStatus ? (
                      <select
                        name="admin_status"
                        value={adminStatus === 'pending_review' ? 'pending_review' : 'draft'}
                        onChange={(e) =>
                          setAdminStatus(e.target.value as 'draft' | 'pending_review')
                        }
                        className={selectClass}
                      >
                        <option value="draft">Draft</option>
                        <option value="pending_review">Submit for Review</option>
                      </select>
                    ) : (
                      <input
                        value={property.admin_status}
                        disabled
                        className={`${inputClass} bg-[#f5f5f5]`}
                      />
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className={currentStep === 2 ? 'block' : 'hidden'}>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] md:text-[36px]">
                    Relations
                  </h1>
                </div>
              </div>

              <div className="mt-6 rounded-md border border-[#e7e7e7] bg-white p-4 shadow-sm md:p-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                      City
                    </label>
                    <select
                      name="city_id"
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
                    <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                      University
                    </label>
                    <select
                      name="university_id"
                      value={universityId}
                      onChange={(e) => handleUniversityChange(e.target.value)}
                      disabled={!cityId}
                      className={`${selectClass} disabled:bg-[#f5f5f5]`}
                    >
                      <option value="">{cityId ? 'Select University' : 'Select City'}</option>
                      {filteredUniversities.map((university) => (
                        <option key={university.id} value={university.id}>
                          {university.name_en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                      Broker
                    </label>

                    {canChangeBroker ? (
                      <select
                        name="broker_id"
                        value={brokerId}
                        onChange={(e) => handleBrokerChange(e.target.value)}
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
                    <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                      Owner
                    </label>
                    <select
                      name="owner_id"
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
                          : 'Select Owner'}
                      </option>

                      {filteredOwners.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {getOwnerLabel(owner)}
                        </option>
                      ))}
                    </select>

                    {cityId && universityId && filteredOwners.length === 0 ? (
                      <p className="mt-2 text-xs font-medium text-[#b42318]">
                        No active owners found.
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-[#6b7280]">
                        Owners are filtered by the selected city and university.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                      Prices Start From
                    </label>
                    <input
                      name="price_egp"
                      type="number"
                      min="0"
                      value={priceEgp}
                      onChange={(e) => setPriceEgp(normalizeNumberString(e.target.value))}
                      placeholder="Full apartment price EGP"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                      Rental Duration
                    </label>
                    <select
                      name="rental_duration"
                      value={propertyRentalDuration}
                      onChange={(e) =>
                        setPropertyRentalDuration(e.target.value as 'monthly' | 'daily')
                      }
                      className={selectClass}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                      Availability Status
                    </label>
                    <select
                      name="availability_status"
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
                    <p className="mb-3 text-[18px] font-medium text-[#1a1a1a]">
                      How many bedrooms are there?
                    </p>

                    <div className="flex h-[52px] w-[160px] items-center justify-center rounded-md border border-[#bfbfbf] bg-[#f9fafb] px-4">
                      <span className="text-[24px] font-semibold text-[#1a1a1a]">
                        {bedroomsCount}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-[#6b7280]">
                      This value is automatically calculated from the number of rooms.
                    </p>
                  </div>

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

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Select Gender</option>
                        <option value="boys">Boys</option>
                        <option value="girls">Girls</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                        Smoking Policy
                      </label>
                      <select
                        name="smoking_policy"
                        value={smokingPolicy}
                        onChange={(e) => setSmokingPolicy(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Select Smoking Policy</option>
                        <option value="smoking_allowed">Smoking Allowed</option>
                        <option value="non_smoking">Non Smoking</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={currentStep === 5 ? 'block' : 'hidden'}>
              <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] md:text-[36px]">
                Property Featured
              </h1>

              <div className="mt-6 space-y-6">
                <div className="rounded-md border border-[#e7e7e7] bg-white p-4 shadow-sm md:p-5">
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]">
                        Amenities
                      </h3>
                      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
                        {amenities.map((item) => (
                          <label key={item.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              name="amenity_ids"
                              value={item.id}
                              defaultChecked={selectedAmenityIds.includes(item.id)}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">{item.name_en}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]">
                        Facilities
                      </h3>
                      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
                        {facilities.map((item) => (
                          <label key={item.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              name="facility_ids"
                              value={item.id}
                              defaultChecked={selectedFacilityIds.includes(item.id)}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">{item.name_en}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]">
                        Bills Included
                      </h3>
                      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
                        {billTypes.map((item) => (
                          <label key={item.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              name="bill_type_ids"
                              value={item.id}
                              defaultChecked={selectedBillTypeIds.includes(item.id)}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">{item.name_en}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={currentStep === 6 ? 'block' : 'hidden'}>
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

                <div className="space-y-5">
                  {roomState.map((room, index) => {
                    const bedsCountValue = Number(normalizeNumberString(room.beds_count || '0'))
                    const enabledOptions = [
                      room.single_room_enabled
                        ? `Single: ${room.single_room_price_egp || '-'} EGP`
                        : null,
                      room.double_room_enabled
                        ? `Double: ${room.double_room_price_egp || '-'} EGP`
                        : null,
                      room.triple_room_enabled
                        ? `Triple: ${room.triple_room_price_egp || '-'} EGP`
                        : null,
                    ].filter(Boolean)

                    return (
                      <div
                        key={room.id || `room-${index}`}
                        className="rounded-md border border-[#e5e7eb] bg-white p-5 shadow-sm"
                      >
                        <div className="mb-5 flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-[22px] font-bold text-[#1a1a1a]">
                              {room.room_name || `Bedroom ${index + 1}`}
                            </h3>
                            <p className="mt-1 text-sm text-[#6b7280]">
                              {enabledOptions.length > 0
                                ? enabledOptions.join(' • ')
                                : 'No booking option enabled yet'}{' '}
                              • {room.beds_count || '0'} bed(s)
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
                          <div>
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
                              Room Name AR
                            </label>
                            <input
                              value={room.room_name_ar}
                              onChange={(e) => updateRoom(index, 'room_name_ar', e.target.value)}
                              placeholder="Room Name AR"
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                              Rental Duration
                            </label>
                            <select
                              value={room.rental_duration}
                              onChange={(e) =>
                                updateRoom(
                                  index,
                                  'rental_duration',
                                  e.target.value as RoomForm['rental_duration']
                                )
                              }
                              className={selectClass}
                            >
                              <option value="monthly">Monthly</option>
                              <option value="daily">Daily</option>
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

                          <div className="md:col-span-2 rounded-md border border-[#e5e7eb] p-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              <RoomOptionField
                                title="Enable Single Room"
                                description=""
                                enabled={room.single_room_enabled}
                                price={room.single_room_price_egp}
                                onToggle={(value) =>
                                  updateRoom(index, 'single_room_enabled', value)
                                }
                                onPriceChange={(value) =>
                                  updateRoom(index, 'single_room_price_egp', value)
                                }
                                inputClass={inputClass}
                                disabled={bedsCountValue < 1}
                              />

                              <RoomOptionField
                                title="Enable Double Room"
                                description=""
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
                              />

                              <RoomOptionField
                                title="Enable Triple Room"
                                description=""
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
                              />
                            </div>
                          </div>

                          <div className="md:col-span-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <label className="flex items-center gap-3 rounded-md border border-[#e5e7eb] bg-[#fafafa] p-4">
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

                            <label className="flex items-center gap-3 rounded-md border border-[#e5e7eb] bg-[#fafafa] p-4">
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
                      <p className="mt-1 font-semibold">
                        {canChangeAdminStatus
                          ? adminStatus === 'pending_review'
                            ? 'pending_review'
                            : 'draft'
                          : property.admin_status}
                      </p>
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
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">City</p>
                      <p className="mt-1 font-semibold">
                        {cities.find((c) => c.id === cityId)?.name_en || '-'}
                      </p>
                    </div>

                    <div className="rounded-md border border-[#ececec] p-3">
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                        University
                      </p>
                      <p className="mt-1 font-semibold">
                        {universities.find((u) => u.id === universityId)?.name_en || '-'}
                      </p>
                    </div>

                    <div className="rounded-md border border-[#ececec] p-3">
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                        Broker
                      </p>
                      <p className="mt-1 font-semibold">
                        {brokers.find((b) => b.id === brokerId)?.full_name ||
                          activeBrokerName ||
                          '-'}
                      </p>
                    </div>

                    <div className="rounded-md border border-[#ececec] p-3">
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                        Owner
                      </p>
                      <p className="mt-1 font-semibold">
                        {selectedOwner ? getOwnerLabel(selectedOwner) : activeOwnerName || '-'}
                      </p>
                    </div>

                    <div className="rounded-md border border-[#ececec] p-3">
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Gender</p>
                      <p className="mt-1 font-semibold">{gender || '-'}</p>
                    </div>

                    <div className="rounded-md border border-[#ececec] p-3">
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                        Rental Duration
                      </p>
                      <p className="mt-1 font-semibold">{propertyRentalDuration || '-'}</p>
                    </div>

                    <div className="rounded-md border border-[#ececec] p-3">
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                        Prices Start From
                      </p>
                      <p className="mt-1 font-semibold">
                        {priceEgp ? `${priceEgp} EGP` : '-'}
                      </p>
                    </div>

                    <div className="rounded-md border border-[#ececec] p-3">
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                        Lowest Room Option Price
                      </p>
                      <p className="mt-1 font-semibold">
                        {lowestRoomOptionPrice ? `${lowestRoomOptionPrice} EGP` : '-'}
                      </p>
                    </div>

                    <div className="rounded-md border border-[#ececec] p-3">
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Images</p>
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
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Beds</p>
                      <p className="mt-1 font-semibold">{bedsCount}</p>
                    </div>

                    <div className="rounded-md border border-[#ececec] p-3">
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Guests</p>
                      <p className="mt-1 font-semibold">{guestsCount || '-'}</p>
                    </div>

                    <div className="rounded-md border border-[#ececec] p-3">
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Rooms</p>
                      <p className="mt-1 font-semibold">{roomState.length}</p>
                    </div>

                    <div className="rounded-md border border-[#ececec] p-3">
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                        Smoking Policy
                      </p>
                      <p className="mt-1 font-semibold">{smokingPolicy || '-'}</p>
                    </div>

                    <div className="rounded-md border border-[#ececec] p-3 md:col-span-2">
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
                          const enabledOptions = [
                            room.single_room_enabled
                              ? `Single: ${room.single_room_price_egp || '-'} EGP`
                              : null,
                            room.double_room_enabled
                              ? `Double: ${room.double_room_price_egp || '-'} EGP`
                              : null,
                            room.triple_room_enabled
                              ? `Triple: ${room.triple_room_price_egp || '-'} EGP`
                              : null,
                          ].filter(Boolean)

                          return (
                            <div
                              key={room.id || `review-room-${index}`}
                              className="rounded-md border border-[#ececec] p-3"
                            >
                              <p className="font-semibold text-[#1a1a1a]">
                                {room.room_name || `Room ${index + 1}`}
                              </p>
                              <p className="text-sm text-[#6b7280]">
                                {room.room_name_ar || '-'}
                              </p>
                              <p className="mt-2 text-sm text-[#6b7280]">
                                Type: {room.room_type} | Duration: {room.rental_duration} | Beds:{' '}
                                {room.beds_count || '0'}
                              </p>
                              <p className="mt-1 text-sm text-[#6b7280]">
                                Status: {room.is_reserved ? 'Reserved' : 'Available'}
                              </p>
                              <p className="mt-1 text-sm text-[#6b7280]">
                                Options:{' '}
                                {enabledOptions.length > 0 ? enabledOptions.join(' | ') : '-'}
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
          </div>

          {stepError && (
            <div className="mt-6 max-w-[1000px] rounded-md border border-[#f1c86b] bg-[#fff8e7] p-3 text-sm text-[#8a6400]">
              {stepError}
            </div>
          )}

          {errorMessage && (
            <div className="mt-6 max-w-[1000px] rounded-md border border-[#e0a8a8] bg-[#fff2f2] p-3 text-sm text-[#b42318]">
              {errorMessage}
            </div>
          )}

          <div className="mt-8 max-w-[1000px]">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={currentStep === 1 || isPending}
                className="rounded-md border border-[#cfcfcf] bg-white px-5 py-2.5 text-sm font-medium text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>

              {currentStep < FORM_STEPS.length ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={isPending}
                  className="rounded-md bg-[#0071c2] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#005fa3] disabled:opacity-50"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isPending || !propertyCode}
                  className="rounded-md bg-[#0071c2] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#005fa3] disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Update Property'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </form>
  )
}