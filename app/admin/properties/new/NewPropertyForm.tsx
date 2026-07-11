'use client'

import Link from 'next/link'
import mapboxgl from 'mapbox-gl'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  createPropertyAction,
  createPropertyVideoUploadSignedUrlAction,
} from './actions'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

type City = {
  id: string
  name_en: string
  name_ar: string
}

type University = {
  id: string
  city_id: string
  name_en: string
  name_ar: string
}

type PropertyArea = {
  id: string
  city_id: string
  code?: string | null
  name_en: string
  name_ar?: string | null
  sort_order?: number
  is_active?: boolean
}

type Broker = {
  id: string
  full_name: string
  company_name?: string | null
}

type Owner = {
  id: string
  full_name: string
  company_name?: string | null
  phone_number?: string | null
  whatsapp_number?: string | null
  email?: string | null
  tax_id?: string | null
  national_id?: string | null
  is_active?: boolean
}

type OwnerServiceArea = {
  id?: string | number
  owner_id: string
  city_id: string | null
  university_id: string | null
  is_active?: boolean | null
}

type BrokerUniversity = {
  broker_id: string
  university_id: string
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

type RoomForm = {
  room_name: string
  room_name_ar: string
  room_type: 'single' | 'double' | 'triple' | 'quad' | 'custom'
  rental_duration: 'daily' | 'monthly'
  beds_count: string
  private_bathroom: boolean
  single_room_enabled: boolean
  single_room_price_egp: string
  double_room_enabled: boolean
  double_room_price_egp: string
  triple_room_enabled: boolean
  triple_room_price_egp: string
}

type ImageFileItem = {
  file: File | null
  previewUrl: string
}

type SignedPropertyVideoUpload = {
  video_url: string
  storage_path: string
  token: string
}

type Props = {
  cities: City[]
  universities: University[]
  propertyAreas: PropertyArea[]
  brokers: Broker[]
  owners: Owner[]
  ownerServiceAreas: OwnerServiceArea[]
  brokerUniversities: BrokerUniversity[]
  amenities: Amenity[]
  billTypes: BillType[]
}

type DisplayStep = {
  id: number
  title: string
  startStep: number
  endStep: number
  navigateStep: number
}

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

type OwnerMode = 'existing' | 'new'


const PROPERTY_VIDEOS_BUCKET = 'property-videos'
const MAX_PROPERTY_VIDEO_BYTES = 200 * 1024 * 1024
const ALLOWED_PROPERTY_VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov']

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

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB'
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`
}

function getVideoContentType(file: File) {
  if (file.type) return file.type

  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  if (extension === 'webm') return 'video/webm'
  if (extension === 'mov') return 'video/quicktime'
  return 'video/mp4'
}

function getVideoValidationMessage(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime']
  const hasAllowedType =
    allowedMimeTypes.includes(file.type.toLowerCase()) ||
    ALLOWED_PROPERTY_VIDEO_EXTENSIONS.includes(extension)

  if (!hasAllowedType) {
    return 'Only MP4, WebM, and MOV videos are allowed.'
  }

  if (file.size <= 0) {
    return 'The selected video file is empty.'
  }

  if (file.size > MAX_PROPERTY_VIDEO_BYTES) {
    return 'The property video must be smaller than 200 MB.'
  }

  return ''
}

function generatePropertyCode() {
  return `PROP-${Date.now()}`
}

const initialRoom: RoomForm = {
  room_name: '',
  room_name_ar: '',
  room_type: 'single',
  rental_duration: 'monthly',
  beds_count: '1',
  private_bathroom: false,
  single_room_enabled: false,
  single_room_price_egp: '',
  double_room_enabled: false,
  double_room_price_egp: '',
  triple_room_enabled: false,
  triple_room_price_egp: '',
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

function normalizeNumberString(value: string) {
  return value.replace(/,/g, '').trim()
}

function isValidPrice(value: string) {
  const normalized = normalizeNumberString(value)
  if (!normalized) return false
  const num = Number(normalized)
  return Number.isFinite(num) && num > 0
}

function isValidPositiveInt(value: string) {
  const normalized = normalizeNumberString(value)
  if (!normalized) return false
  const num = Number(normalized)
  return Number.isInteger(num) && num > 0
}

function isValidNonNegativeInt(value: string) {
  const normalized = normalizeNumberString(value)
  if (!normalized) return false
  const num = Number(normalized)
  return Number.isInteger(num) && num >= 0
}

function getBedsCountNumber(value: string) {
  const normalized = normalizeNumberString(value)
  if (!normalized) return 0
  const num = Number(normalized)
  return Number.isInteger(num) && num > 0 ? num : 0
}

function normalizeNumberFieldIfNeeded(field: keyof RoomForm, value: string) {
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
          className={`text-sm font-semibold ${disabled ? 'text-[#9ca3af]' : 'text-[#1a1a1a]'}`}
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
}: {
  inputId: string
  inputName: string
  inputValue: string | number
  title: string
  iconUrl?: string | null
}) {
  return (
    <label htmlFor={inputId} className="group relative block cursor-pointer">
      <input
        id={inputId}
        type="checkbox"
        name={inputName}
        value={String(inputValue)}
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

export default function NewPropertyForm({
  cities,
  universities,
  propertyAreas,
  brokers,
  owners,
  ownerServiceAreas,
  brokerUniversities,
  amenities,
  billTypes,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState('')
  const [stepError, setStepError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)

  const [propertyCode, setPropertyCode] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [titleAr, setTitleAr] = useState('')
  const [addressEn, setAddressEn] = useState('')
  const [addressAr, setAddressAr] = useState('')
  const [addressSearch, setAddressSearch] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState<MapboxAddressSuggestion[]>([])
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [addressSearchError, setAddressSearchError] = useState('')
  const [selectedLatitude, setSelectedLatitude] = useState('')
  const [selectedLongitude, setSelectedLongitude] = useState('')
  const [selectedMapLocationLabel, setSelectedMapLocationLabel] = useState('')

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''
  const propertyRentalDuration: 'monthly' = 'monthly'

  const [cityId, setCityId] = useState('')
  const [universityIds, setUniversityIds] = useState<string[]>([])
  const primaryUniversityId = universityIds[0] || ''
  const [areaId, setAreaId] = useState('')
  const [brokerId, setBrokerId] = useState('')

  const [ownerMode, setOwnerMode] = useState<OwnerMode>('new')
  const [ownerId, setOwnerId] = useState('')
  const [ownerSearch, setOwnerSearch] = useState('')

  const [newOwnerFullName, setNewOwnerFullName] = useState('')
  const [newOwnerPhone, setNewOwnerPhone] = useState('')

  const [priceEgp, setPriceEgp] = useState('')
  const [floorNumber, setFloorNumber] = useState('0')

  const [bedroomsCount, setBedroomsCount] = useState('0')
  const [bathroomsCount, setBathroomsCount] = useState('0')
  const [bedsCount, setBedsCount] = useState('0')
  const [guestsCount, setGuestsCount] = useState('0')
  const [gender, setGender] = useState('')

  const [imageFiles, setImageFiles] = useState<ImageFileItem[]>([])
  const [coverIndex, setCoverIndex] = useState(0)
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false)

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('')
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [videoUploadProgress, setVideoUploadProgress] = useState('')

  const [rooms, setRooms] = useState<RoomForm[]>([
    {
      ...initialRoom,
      room_name: 'Bedroom 1',
      room_name_ar: 'Bedroom 1',
      beds_count: '1',
      single_room_enabled: true,
    },
  ])

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  const inputClass =
    'w-full rounded-md border border-[#cfcfcf] px-3 py-2.5 text-sm outline-none transition focus:border-[#0071c2]'

  const selectClass =
    'w-full rounded-md border border-[#cfcfcf] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0071c2]'

  useEffect(() => {
    setPropertyCode(generatePropertyCode())
  }, [])

  useEffect(() => {
    return () => {
      imageFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
    }
  }, [imageFiles])


  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    }
  }, [videoPreviewUrl])

  const filteredUniversities = useMemo(() => {
    if (!cityId) return []
    return universities.filter((university) => university.city_id === cityId)
  }, [cityId, universities])

  const selectedUniversities = useMemo(() => {
    return universityIds
      .map((id) => universities.find((university) => university.id === id))
      .filter(Boolean) as University[]
  }, [universityIds, universities])

  const filteredPropertyAreas = useMemo(() => {
    if (!cityId) return []

    return [...propertyAreas]
      .filter((area) => area.city_id === cityId && area.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [cityId, propertyAreas])

  const selectedArea = useMemo(() => {
    return propertyAreas.find((area) => area.id === areaId) || null
  }, [propertyAreas, areaId])

  const selectedCity = useMemo(() => {
    return cities.find((city) => city.id === cityId) || null
  }, [cities, cityId])

  const filteredBrokers = useMemo(() => {
    if (universityIds.length === 0) return []

    return brokers.filter((broker) => {
      const brokerUniversityIds = new Set(
        brokerUniversities
          .filter((item) => item.broker_id === broker.id)
          .map((item) => item.university_id)
      )

      return universityIds.every((id) => brokerUniversityIds.has(id))
    })
  }, [universityIds, brokerUniversities, brokers])

  const activeOwners = useMemo(() => {
    return [...owners]
      .filter((owner) => owner.is_active !== false)
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [owners])

  const eligibleOwners = useMemo(() => {
    if (!cityId || universityIds.length === 0) return []

    return activeOwners.filter((owner) => {
      return universityIds.every((selectedUniversityId) =>
        ownerServiceAreas.some((area) => {
          if (area.is_active === false) return false
          if (area.owner_id !== owner.id) return false
          if (area.city_id !== cityId) return false
          if (area.university_id !== selectedUniversityId) return false
          return true
        })
      )
    })
  }, [activeOwners, ownerServiceAreas, cityId, universityIds])

  const displayedOwners = useMemo(() => {
    const search = ownerSearch.trim().toLowerCase()

    if (!cityId || universityIds.length === 0) return []
    if (!search) return eligibleOwners.slice(0, 80)

    return eligibleOwners
      .filter((owner) => {
        const haystack = [owner.full_name, owner.phone_number]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(search)
      })
      .slice(0, 80)
  }, [eligibleOwners, ownerSearch, cityId, universityIds])

  const selectedOwner = useMemo(() => {
    return activeOwners.find((owner) => owner.id === ownerId) || null
  }, [activeOwners, ownerId])

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

    return Array.from(groupMap.values()).sort((a, b) => a.title.localeCompare(b.title))
  }, [activeAmenities])

  const activeBillTypes = useMemo(() => {
    return [...billTypes]
      .filter((item) => item.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [billTypes])

  const totalBedsFromRooms = useMemo(() => {
    return rooms.reduce((sum, room) => {
      const roomBeds = Number(normalizeNumberString(room.beds_count || '0'))
      if (!Number.isFinite(roomBeds) || roomBeds <= 0) return sum
      return sum + roomBeds
    }, 0)
  }, [rooms])

  useEffect(() => {
    setBedsCount(String(totalBedsFromRooms))
  }, [totalBedsFromRooms])

  useEffect(() => {
    if (rooms.length > 0 && Number(bedroomsCount) === 0) {
      setBedroomsCount(String(rooms.length))
    }
  }, [rooms.length, bedroomsCount])

  useEffect(() => {
    if (ownerMode !== 'existing') return
    if (!ownerId) return

    const ownerStillValid = eligibleOwners.some((owner) => owner.id === ownerId)
    if (!ownerStillValid) setOwnerId('')
  }, [ownerMode, ownerId, eligibleOwners])

  useEffect(() => {
    if (!areaId) return
    const areaStillValid = filteredPropertyAreas.some((area) => area.id === areaId)
    if (!areaStillValid) setAreaId('')
  }, [areaId, filteredPropertyAreas])

  useEffect(() => {
    if (!brokerId) return
    const brokerStillValid = filteredBrokers.some((broker) => broker.id === brokerId)
    if (!brokerStillValid) setBrokerId('')
  }, [brokerId, filteredBrokers])

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
          selectedArea?.name_en,
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
    selectedArea?.name_en,
    selectedCity?.name_en,
    selectedLatitude,
    selectedLongitude,
    selectedMapLocationLabel,
  ])

  const lowestAvailableOptionPrice = useMemo(() => {
    const prices = rooms.flatMap((room) =>
      getEnabledRoomOptions(room).map((option) => Number(normalizeNumberString(option.price)))
    )

    const validPrices = prices.filter((price) => Number.isFinite(price) && price > 0)
    if (validPrices.length === 0) return null
    return Math.min(...validPrices)
  }, [rooms])

  const handleCityChange = (value: string) => {
    setCityId(value)
    setUniversityIds([])
    setAreaId('')
    setBrokerId('')
    setOwnerId('')
    setOwnerSearch('')
  }

  const handleUniversityChange = (value: string) => {
    if (!value) {
      setUniversityIds([])
    } else {
      setUniversityIds((prev) =>
        prev.includes(value) ? prev.filter((id) => id !== value) : [...prev, value]
      )
    }

    setBrokerId('')
    setOwnerId('')
    setOwnerSearch('')
  }

  const handleAddressSearchInputChange = (value: string) => {
    setAddressSearch(value)
    setSelectedLatitude('')
    setSelectedLongitude('')
    setSelectedMapLocationLabel('')
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

  const handleOwnerModeChange = (value: OwnerMode) => {
    setOwnerMode(value)
    setOwnerId('')
    setOwnerSearch('')
  }

  const addImages = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return

    const newItems: ImageFileItem[] = Array.from(filesList).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setImageFiles((prev) => [...prev, ...newItems])
  }

  const removeImage = (index: number) => {
    setImageFiles((prev) => {
      const itemToRemove = prev[index]
      if (itemToRemove?.previewUrl) URL.revokeObjectURL(itemToRemove.previewUrl)
      return prev.filter((_, i) => i !== index)
    })

    if (coverIndex === index) setCoverIndex(0)
    else if (coverIndex > index) setCoverIndex((prev) => prev - 1)
  }


  const selectVideo = (filesList: FileList | null) => {
    const file = filesList?.[0]
    if (!file) return

    const validationMessage = getVideoValidationMessage(file)
    if (validationMessage) {
      setStepError(validationMessage)
      return
    }

    setStepError('')
    setVideoFile(file)
    setVideoPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl)
      return URL.createObjectURL(file)
    })
  }

  const removeVideo = () => {
    setVideoFile(null)
    setVideoPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl)
      return ''
    })

    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  const addRoom = () => {
    const nextNumber = rooms.length + 1

    setRooms((prev) => [
      ...prev,
      {
        ...initialRoom,
        room_name: `Bedroom ${nextNumber}`,
        room_name_ar: `Bedroom ${nextNumber}`,
        beds_count: '1',
        single_room_enabled: true,
        rental_duration: 'monthly',
      },
    ])
  }

  const updateRoom = (index: number, field: keyof RoomForm, value: string | boolean) => {
    setRooms((prev) =>
      prev.map((room, i) => {
        if (i !== index) return room

        const nextRoom = {
          ...room,
          [field]:
            typeof value === 'string' && field !== 'room_name' && field !== 'room_name_ar'
              ? normalizeNumberFieldIfNeeded(field, value)
              : value,
          rental_duration: 'monthly',
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
    setRooms((prev) => prev.filter((_, i) => i !== index))
  }

  const hasAtLeastOneImage = imageFiles.some((item) => item.file !== null)
  const hasValidRoom = rooms.some((room) => getRoomValidationMessage(room) === '')

  const hasInvalidCompletedRoom = rooms.some((room) => {
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

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (
          !propertyCode.trim() ||
          !titleEn.trim() ||
          !titleAr.trim() ||
          !addressEn.trim() ||
          !addressAr.trim()
        ) {
          return 'Please complete Property Code, Title EN, Title AR, Address EN, and Address AR.'
        }

        if (!selectedLatitude.trim() || !selectedLongitude.trim()) {
          return 'Please search the property map location and select the correct result from the suggestions.'
        }

        return ''

      case 2:
        if (
          !cityId.trim() ||
          universityIds.length === 0 ||
          !areaId.trim() ||
          !brokerId.trim() ||
          !gender.trim()
        ) {
          return 'Please complete city, universities, area, broker, and gender.'
        }

        if (!filteredPropertyAreas.some((area) => area.id === areaId)) {
          return 'Selected area is not available for the selected city.'
        }

        if (!filteredBrokers.some((broker) => broker.id === brokerId)) {
          return 'Selected broker is not assigned to all selected universities.'
        }

        if (ownerMode === 'existing') {
          if (!ownerId.trim()) {
            return 'Please select an existing owner or switch to Create New Owner.'
          }

          if (!eligibleOwners.some((owner) => owner.id === ownerId)) {
            return 'Selected owner is not available for the selected city and selected universities.'
          }
        }

        if (ownerMode === 'new') {
          if (!newOwnerFullName.trim()) return 'Please enter the new owner full name.'
          if (!newOwnerPhone.trim()) return 'Please enter the new owner phone number.'
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

  const submitProperty = async () => {
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

    const formElement = document.getElementById('new-property-form') as HTMLFormElement | null

    if (!formElement) {
      setErrorMessage('Form not found')
      return
    }

    const formData = new FormData(formElement)

    formData.set('property_id', propertyCode)
    formData.set('title_en', titleEn)
    formData.set('title_ar', titleAr)
    formData.set('description_en', '')
    formData.set('description_ar', '')
    formData.set('address_en', addressEn)
    formData.set('address_ar', addressAr)
    formData.set('latitude', selectedLatitude)
    formData.set('longitude', selectedLongitude)
    formData.set('city_id', cityId)
    formData.set('university_id', primaryUniversityId)
    formData.delete('university_ids')
    universityIds.forEach((id) => formData.append('university_ids', id))
    formData.set('area_id', areaId)
    formData.set('broker_id', brokerId)

    formData.set('owner_mode', ownerMode)
    formData.set('owner_id', ownerMode === 'existing' ? ownerId : '')
    formData.set('new_owner_full_name', newOwnerFullName.trim())
    formData.set('new_owner_company_name', '')
    formData.set('new_owner_phone_number', newOwnerPhone.trim())
    formData.set('new_owner_whatsapp_number', '')
    formData.set('new_owner_email', '')
    formData.set('new_owner_tax_id', '')
    formData.set('new_owner_national_id', '')

    formData.set('price_egp', normalizeNumberString(priceEgp))
    formData.set('floor_number', normalizeNumberString(floorNumber))
    formData.set('rental_duration', 'monthly')
    formData.set('gender', gender)
    formData.set('bedrooms_count', normalizeNumberString(bedroomsCount))
    formData.set('bathrooms_count', normalizeNumberString(bathroomsCount))
    formData.set('beds_count', normalizeNumberString(bedsCount))
    formData.set('guests_count', normalizeNumberString(guestsCount))
    formData.set('smoking_policy', '')

    formData.delete('room_name')
    formData.delete('room_name_ar')
    formData.delete('room_type')
    formData.delete('room_rental_duration')
    formData.delete('room_beds_count')
    formData.delete('room_private_bathroom')
    formData.delete('room_single_room_enabled')
    formData.delete('room_single_room_price_egp')
    formData.delete('room_double_room_enabled')
    formData.delete('room_double_room_price_egp')
    formData.delete('room_triple_room_enabled')
    formData.delete('room_triple_room_price_egp')

    rooms.forEach((room) => {
      formData.append('room_name', room.room_name)
      formData.append('room_name_ar', room.room_name_ar || room.room_name)
      formData.append('room_type', room.room_type)
      formData.append('room_rental_duration', 'monthly')
      formData.append('room_beds_count', normalizeNumberString(room.beds_count))
      formData.append('room_private_bathroom', room.private_bathroom ? 'true' : 'false')
      formData.append('room_single_room_enabled', room.single_room_enabled ? 'true' : 'false')
      formData.append('room_single_room_price_egp', normalizeNumberString(room.single_room_price_egp))
      formData.append('room_double_room_enabled', room.double_room_enabled ? 'true' : 'false')
      formData.append('room_double_room_price_egp', normalizeNumberString(room.double_room_price_egp))
      formData.append('room_triple_room_enabled', room.triple_room_enabled ? 'true' : 'false')
      formData.append('room_triple_room_price_egp', normalizeNumberString(room.triple_room_price_egp))
    })

    formData.delete('images')
    imageFiles.forEach((item) => {
      if (item.file) formData.append('images', item.file)
    })

    const getValue = (name: string) => String(formData.get(name) || '').trim()

    const ownerComplete =
      ownerMode === 'existing'
        ? Boolean(ownerId.trim())
        : Boolean(newOwnerFullName.trim() && newOwnerPhone.trim())

    const basicFieldsComplete =
      [
        'property_id',
        'title_en',
        'title_ar',
        'address_en',
        'address_ar',
        'latitude',
        'longitude',
        'city_id',
        'university_id',
        'area_id',
        'broker_id',
        'price_egp',
        'floor_number',
        'rental_duration',
        'gender',
        'bedrooms_count',
        'bathrooms_count',
        'beds_count',
        'guests_count',
      ].every((field) => getValue(field)) && ownerComplete

    const adminStatus =
      basicFieldsComplete && hasAtLeastOneImage && hasValidRoom ? 'pending_review' : 'draft'

    formData.set('admin_status', adminStatus)
    formData.set('cover_index', String(coverIndex))

    formData.delete('uploaded_video_url')
    formData.delete('uploaded_video_storage_path')
    formData.delete('uploaded_video_mime_type')
    formData.delete('uploaded_video_file_size')

    if (videoFile) {
      setIsUploadingVideo(true)
      setVideoUploadProgress('Uploading property video...')

      try {
        const signedUploadFormData = new FormData()
        signedUploadFormData.set('property_code', propertyCode)
        signedUploadFormData.set('file_name', videoFile.name)
        signedUploadFormData.set('file_type', getVideoContentType(videoFile))
        signedUploadFormData.set('file_size', String(videoFile.size))

        const signedUpload: SignedPropertyVideoUpload =
          await createPropertyVideoUploadSignedUrlAction(signedUploadFormData)

        const supabaseBrowserClient = getBrowserSupabaseClient()
        const { error: directUploadError } = await supabaseBrowserClient.storage
          .from(PROPERTY_VIDEOS_BUCKET)
          .uploadToSignedUrl(
            signedUpload.storage_path,
            signedUpload.token,
            videoFile,
            {
              cacheControl: '3600',
              contentType: getVideoContentType(videoFile),
              upsert: false,
            }
          )

        if (directUploadError) {
          throw new Error(
            `Failed to upload ${videoFile.name}: ${directUploadError.message}`
          )
        }

        formData.set('uploaded_video_url', signedUpload.video_url)
        formData.set('uploaded_video_storage_path', signedUpload.storage_path)
        formData.set('uploaded_video_mime_type', getVideoContentType(videoFile))
        formData.set('uploaded_video_file_size', String(videoFile.size))
        setVideoUploadProgress('Video uploaded. Saving property...')
      } catch (error: any) {
        setErrorMessage(error?.message || 'Failed to upload property video')
        setVideoUploadProgress('')
        setIsUploadingVideo(false)
        return
      }
    }

    startTransition(async () => {
      try {
        await createPropertyAction(formData)
        setVideoUploadProgress('')
        setIsUploadingVideo(false)
        router.push('/admin/properties')
        router.refresh()
      } catch (error: any) {
        setErrorMessage(error.message || 'Something went wrong')
        setVideoUploadProgress('')
        setIsUploadingVideo(false)
      }
    })
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

  const reviewOwnerLabel =
    ownerMode === 'existing' ? selectedOwner?.full_name || '-' : newOwnerFullName || '-'

  const reviewOwnerSubLabel =
    ownerMode === 'existing'
      ? selectedOwner
        ? selectedOwner.phone_number || ''
        : ''
      : newOwnerPhone || ''

  const isBusy = isPending || isUploadingVideo

  return (
    <form
      id="new-property-form"
      onSubmit={(event) => event.preventDefault()}
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

      <input type="hidden" name="admin_status" value="draft" />
      <input type="hidden" name="property_id" value={propertyCode} />
      <input type="hidden" name="title_en" value={titleEn} />
      <input type="hidden" name="title_ar" value={titleAr} />
      <input type="hidden" name="description_en" value="" />
      <input type="hidden" name="description_ar" value="" />
      <input type="hidden" name="address_en" value={addressEn} />
      <input type="hidden" name="address_ar" value={addressAr} />
      <input type="hidden" name="latitude" value={selectedLatitude} />
      <input type="hidden" name="longitude" value={selectedLongitude} />
      <input type="hidden" name="city_id" value={cityId} />
      <input type="hidden" name="university_id" value={primaryUniversityId} />
      {universityIds.map((id) => (
        <input key={id} type="hidden" name="university_ids" value={id} />
      ))}
      <input type="hidden" name="area_id" value={areaId} />
      <input type="hidden" name="broker_id" value={brokerId} />
      <input type="hidden" name="owner_mode" value={ownerMode} />
      <input type="hidden" name="owner_id" value={ownerMode === 'existing' ? ownerId : ''} />
      <input type="hidden" name="new_owner_full_name" value={newOwnerFullName} />
      <input type="hidden" name="new_owner_company_name" value="" />
      <input type="hidden" name="new_owner_phone_number" value={newOwnerPhone} />
      <input type="hidden" name="new_owner_whatsapp_number" value="" />
      <input type="hidden" name="new_owner_email" value="" />
      <input type="hidden" name="new_owner_tax_id" value="" />
      <input type="hidden" name="new_owner_national_id" value="" />
      <input type="hidden" name="price_egp" value={priceEgp} />
      <input type="hidden" name="floor_number" value={floorNumber} />
      <input type="hidden" name="rental_duration" value={propertyRentalDuration} />
      <input type="hidden" name="gender" value={gender} />
      <input type="hidden" name="bedrooms_count" value={bedroomsCount} />
      <input type="hidden" name="bathrooms_count" value={bathroomsCount} />
      <input type="hidden" name="beds_count" value={bedsCount} />
      <input type="hidden" name="guests_count" value={guestsCount} />
      <input type="hidden" name="smoking_policy" value="" />

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
                  <label className="mb-1.5 block text-sm font-medium">Universities</label>
                  <div className={`rounded-md border border-[#cfcfcf] bg-white p-3 ${!cityId ? 'bg-[#f5f5f5]' : ''}`}>
                    {!cityId ? (
                      <p className="text-sm text-[#6b7280]">Select City first</p>
                    ) : filteredUniversities.length === 0 ? (
                      <p className="text-sm text-[#6b7280]">No universities for this city</p>
                    ) : (
                      <div className="max-h-[220px] space-y-2 overflow-y-auto">
                        {filteredUniversities.map((university) => {
                          const checked = universityIds.includes(university.id)

                          return (
                            <label
                              key={university.id}
                              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition ${
                                checked
                                  ? 'border-[#0071c2] bg-[#f0f7ff]'
                                  : 'border-[#e5e7eb] bg-white hover:bg-[#fafafa]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleUniversityChange(university.id)}
                                className="h-4 w-4"
                              />
                              <span className="text-sm font-medium text-[#1a1a1a]">
                                {university.name_en}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {universityIds.length > 0 ? (
                    <p className="mt-2 text-xs text-[#6b7280]">
                      Selected: {universityIds.length}. First selected university is saved as the primary university.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-[#6b7280]">
                      Select one or more universities where this property should appear.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Area</label>
                  <select
                    value={areaId}
                    onChange={(e) => setAreaId(e.target.value)}
                    disabled={!cityId}
                    className={`${selectClass} disabled:bg-[#f5f5f5]`}
                  >
                    <option value="">
                      {!cityId
                        ? 'Select City'
                        : filteredPropertyAreas.length > 0
                          ? 'Select Area'
                          : 'No areas for this city'}
                    </option>
                    {filteredPropertyAreas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name_en}
                        {area.name_ar ? ` - ${area.name_ar}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-[#6b7280]">
                    Area is saved in properties.area_id and filtered by selected city.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Broker</label>
                  <select
                    value={brokerId}
                    onChange={(e) => setBrokerId(e.target.value)}
                    disabled={universityIds.length === 0}
                    className={`${selectClass} disabled:bg-[#f5f5f5]`}
                  >
                    <option value="">
                      {universityIds.length > 0 ? 'Select Broker' : 'Select Universities'}
                    </option>
                    {filteredBrokers.map((broker) => (
                      <option key={broker.id} value={broker.id}>
                        {broker.full_name}
                        {broker.company_name ? ` - ${broker.company_name}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-[#6b7280]">
                    Broker must be assigned to all selected universities.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className={selectClass}>
                    <option value="">Select Gender</option>
                    <option value="boys">Boys</option>
                    <option value="girls">Girls</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Owner</label>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleOwnerModeChange('new')}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        ownerMode === 'new'
                          ? 'border-[#0071c2] bg-[#f0f7ff] text-[#0f3f75]'
                          : 'border-[#d1d5db] bg-white text-[#1a1a1a]'
                      }`}
                    >
                      <p className="font-semibold">Create New Owner</p>
                      <p className="mt-1 text-xs text-[#6b7280]">
                        The new owner will be assigned to this city and all selected universities.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOwnerModeChange('existing')}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        ownerMode === 'existing'
                          ? 'border-[#0071c2] bg-[#f0f7ff] text-[#0f3f75]'
                          : 'border-[#d1d5db] bg-white text-[#1a1a1a]'
                      }`}
                    >
                      <p className="font-semibold">Use Existing Owner</p>
                      <p className="mt-1 text-xs text-[#6b7280]">
                        Owner must be assigned to all selected universities.
                      </p>
                    </button>
                  </div>
                </div>

                {ownerMode === 'new' ? (
                  <div className="md:col-span-2 rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-4">
                    <div className="mb-4">
                      <h3 className="text-base font-semibold text-[#0f3f75]">New Owner Details</h3>
                      <p className="mt-1 text-xs text-[#6b7280]">
                        A new owner will be created and automatically assigned to the selected city and universities.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">Full Name</label>
                        <input
                          value={newOwnerFullName}
                          onChange={(e) => setNewOwnerFullName(e.target.value)}
                          placeholder="Owner full name"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium">Phone Number</label>
                        <input
                          value={newOwnerPhone}
                          onChange={(e) => setNewOwnerPhone(e.target.value)}
                          placeholder="Owner phone"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Search Owner</label>
                      <input
                        value={ownerSearch}
                        onChange={(e) => setOwnerSearch(e.target.value)}
                        placeholder={
                          cityId && universityIds.length > 0
                            ? 'Search by name or phone...'
                            : 'Select city and universities first'
                        }
                        disabled={!cityId || universityIds.length === 0}
                        className={`${inputClass} disabled:bg-[#f5f5f5]`}
                      />
                      <p className="mt-2 text-xs text-[#6b7280]">
                        Owners are filtered by the selected city and all selected universities.
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium">Existing Owner</label>
                      <select
                        value={ownerId}
                        onChange={(e) => setOwnerId(e.target.value)}
                        disabled={!cityId || universityIds.length === 0}
                        className={`${selectClass} disabled:bg-[#f5f5f5]`}
                      >
                        <option value="">
                          {!cityId
                            ? 'Select City'
                            : universityIds.length === 0
                              ? 'Select Universities'
                              : displayedOwners.length > 0
                                ? 'Select Owner'
                                : 'No matching owners'}
                        </option>

                        {selectedOwner && !displayedOwners.some((owner) => owner.id === selectedOwner.id) ? (
                          <option value={selectedOwner.id}>
                            {selectedOwner.full_name}
                            {selectedOwner.phone_number ? ` - ${selectedOwner.phone_number}` : ''}
                          </option>
                        ) : null}

                        {displayedOwners.map((owner) => (
                          <option key={owner.id} value={owner.id}>
                            {owner.full_name}
                            {owner.phone_number ? ` - ${owner.phone_number}` : ''}
                          </option>
                        ))}
                      </select>

                      {cityId && universityIds.length > 0 && eligibleOwners.length === 0 ? (
                        <div className="mt-2 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-xs text-[#92400e]">
                          No active owners are assigned to this city and all selected universities. You can switch to <strong>Create New Owner</strong>.
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-[#6b7280]">
                          Showing owners assigned to all selected universities only.
                        </p>
                      )}
                    </div>

                    {selectedOwner ? (
                      <div className="md:col-span-2 rounded-md border border-[#dbeafe] bg-[#f0f7ff] p-4 text-sm text-[#0f3f75]">
                        <p className="font-semibold text-[#0f3f75]">Selected owner details</p>
                        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                          <p>Name: {selectedOwner.full_name || '—'}</p>
                          <p>Phone: {selectedOwner.phone_number || '—'}</p>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </section>

          <section className={currentStep === 3 ? 'block' : 'hidden'}>
            <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] md:text-[36px]">Photos</h1>

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
                  isDraggingPhotos ? 'border-[#0071c2] bg-[#f0f7ff]' : 'border-[#9ca3af] bg-white'
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

              {imageFiles.length > 0 && (
                <div className="mt-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[#4b5563]">
                      {imageFiles.length} image{imageFiles.length === 1 ? '' : 's'} selected
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
                    {imageFiles.map((item, index) => (
                      <div key={`${item.previewUrl}-${index}`} className="overflow-hidden rounded-md border border-[#d9d9d9] bg-white">
                        {item.previewUrl && (
                          <img src={item.previewUrl} alt={`Preview ${index + 1}`} className="h-48 w-full object-cover" />
                        )}

                        <div className="space-y-3 p-3">
                          <p className="truncate text-xs text-[#6b7280]">
                            {item.file?.name || `Image ${index + 1}`}
                          </p>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setCoverIndex(index)}
                              disabled={!item.file}
                              className={`rounded-md px-3 py-2 text-sm font-medium ${
                                coverIndex === index && item.file
                                  ? 'bg-[#0071c2] text-white'
                                  : 'border border-[#cfcfcf] bg-white text-[#1a1a1a]'
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {coverIndex === index && item.file ? 'Cover' : 'Set Cover'}
                            </button>

                            <button
                              type="button"
                              onClick={() => removeImage(index)}
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

              <div className="mt-8 border-t border-[#e5e7eb] pt-8">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mov"
                  className="hidden"
                  onChange={(event) => {
                    selectVideo(event.target.files)
                    event.target.value = ''
                  }}
                />

                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#111827]">
                      Property Video
                    </h2>
                    <p className="mt-1 text-sm text-[#6b7280]">
                      Optional — upload one MP4, WebM, or MOV video up to 200 MB.
                    </p>
                  </div>

                  {videoFile && (
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="rounded-md border border-[#0071c2] px-4 py-2 text-sm font-medium text-[#0071c2]"
                    >
                      Replace video
                    </button>
                  )}
                </div>

                {!videoFile ? (
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#9ca3af] bg-[#fafafa] px-6 py-10 text-center transition hover:border-[#0071c2] hover:bg-[#f0f7ff]"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf4ff] text-[#0071c2]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-7 w-7"
                        aria-hidden="true"
                      >
                        <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.5-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
                      </svg>
                    </span>
                    <span className="mt-4 text-base font-semibold text-[#111827]">
                      Upload property video
                    </span>
                    <span className="mt-1 text-sm text-[#6b7280]">
                      The video will appear through the “View property video” button.
                    </span>
                  </button>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-[#d9d9d9] bg-[#111827]">
                    <video
                      src={videoPreviewUrl}
                      controls
                      preload="metadata"
                      playsInline
                      className="max-h-[520px] w-full bg-black object-contain"
                    />

                    <div className="flex flex-col gap-3 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#111827]">
                          {videoFile.name}
                        </p>
                        <p className="mt-1 text-xs text-[#6b7280]">
                          {formatFileSize(videoFile.size)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={removeVideo}
                        className="rounded-md border border-[#ef4444] px-4 py-2 text-sm font-semibold text-[#dc2626] transition hover:bg-[#fff1f2]"
                      >
                        Remove video
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                    <span className="ml-2 font-semibold">{lowestAvailableOptionPrice} EGP</span>
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
                  helperText="You can set this manually. It does not have to exactly match the number of room cards below."
                />

                <CounterField
                  label="How many beds are there?"
                  value={bedsCount}
                  onChange={setBedsCount}
                  helperText="This is auto-calculated from room beds, but you can still adjust it if needed."
                />

                <CounterField label="How many guests can stay?" value={guestsCount} onChange={setGuestsCount} />
                <CounterField label="How many bathrooms are there?" value={bathroomsCount} onChange={setBathroomsCount} />
              </div>
            </div>
          </section>

          <section className={currentStep === 5 ? 'block' : 'hidden'}>
            <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] md:text-[36px]">
              Rooms & Pricing
            </h1>

            <div className="mt-6 rounded-md border border-[#e7e7e7] bg-white p-6 shadow-sm">
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
                {rooms.map((room, index) => {
                  const bedsCountValue = getBedsCountNumber(room.beds_count)

                  return (
                    <div key={index} className="rounded-md border border-[#e5e7eb] bg-white p-5 shadow-sm">
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-[22px] font-bold text-[#1a1a1a]">
                            {room.room_name || `Bedroom ${index + 1}`}
                          </h3>
                          <p className="mt-1 text-sm text-[#6b7280]">
                            {getRoomOptionCountLabel(room)} • {room.beds_count || '0'} bed(s)
                          </p>
                        </div>

                        {rooms.length > 1 && (
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
                          <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">Room Type</label>
                          <select
                            value={room.room_type}
                            onChange={(e) => updateRoom(index, 'room_type', e.target.value)}
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
                          <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">Beds Count</label>
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
                              onChange={(e) => updateRoom(index, 'private_bathroom', e.target.checked)}
                              className="h-4 w-4"
                            />
                            <span className="text-sm font-medium text-[#1a1a1a]">Private bathroom</span>
                          </label>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 gap-4 xl:grid-cols-3">
                          <RoomOptionField
                            title="Single Room"
                            description="يعرض خيار حجز الغرفة كاملة لطالب واحد."
                            enabled={room.single_room_enabled}
                            price={room.single_room_price_egp}
                            onToggle={(value) => updateRoom(index, 'single_room_enabled', value)}
                            onPriceChange={(value) => updateRoom(index, 'single_room_price_egp', value)}
                            inputClass={inputClass}
                          />

                          <RoomOptionField
                            title="Double Room"
                            description="يعرض حجز سرير واحد داخل غرفة دابل، ويتطلب 2 سرير أو أكثر."
                            enabled={room.double_room_enabled}
                            price={room.double_room_price_egp}
                            onToggle={(value) => updateRoom(index, 'double_room_enabled', value)}
                            onPriceChange={(value) => updateRoom(index, 'double_room_price_egp', value)}
                            inputClass={inputClass}
                            disabled={bedsCountValue < 2}
                            disabledReason="Double Room requires at least 2 beds."
                          />

                          <RoomOptionField
                            title="Triple Room"
                            description="يعرض حجز سرير واحد داخل غرفة تربل، ويتطلب 3 سراير أو أكثر."
                            enabled={room.triple_room_enabled}
                            price={room.triple_room_price_egp}
                            onToggle={(value) => updateRoom(index, 'triple_room_enabled', value)}
                            onPriceChange={(value) => updateRoom(index, 'triple_room_price_egp', value)}
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
                      />
                    ))}
                  </div>
                </FeatureSection>
              ))}

              <FeatureSection title="Bills Included" subtitle="Select the bills already included in the property price.">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {activeBillTypes.map((item) => (
                    <FeatureSelectableCard
                      key={item.id}
                      inputId={`bill-type-${item.id}`}
                      inputName="bill_type_ids"
                      inputValue={item.id}
                      title={item.name_en}
                      iconUrl={item.icon_url}
                    />
                  ))}
                </div>
              </FeatureSection>
            </div>
          </section>

          <section className={currentStep === 7 ? 'block' : 'hidden'}>
            <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] md:text-[36px]">Review</h1>

            <div className="mt-6 space-y-6">
              <div className="rounded-md border border-[#e7e7e7] bg-white p-4 shadow-sm md:p-5">
                <h2 className="mb-3 text-lg font-semibold">Review Summary</h2>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Property Code</p>
                    <p className="mt-1 font-semibold">{propertyCode || '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Title EN</p>
                    <p className="mt-1 font-semibold">{titleEn || '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Title AR</p>
                    <p className="mt-1 font-semibold">{titleAr || '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Address EN</p>
                    <p className="mt-1 font-semibold">{addressEn || '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Address AR</p>
                    <p className="mt-1 font-semibold">{addressAr || '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Map Location</p>
                    <p className="mt-1 font-semibold">
                      {selectedLatitude && selectedLongitude ? selectedMapLocationLabel || 'Selected from map search' : '-'}
                    </p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">City</p>
                    <p className="mt-1 font-semibold">{cities.find((city) => city.id === cityId)?.name_en || '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Universities</p>
                    <p className="mt-1 font-semibold">
                      {selectedUniversities.length > 0
                        ? selectedUniversities.map((university) => university.name_en).join(', ')
                        : '-'}
                    </p>
                    {selectedUniversities.length > 0 ? (
                      <p className="mt-1 text-xs text-[#6b7280]">
                        Primary: {selectedUniversities[0]?.name_en}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Area</p>
                    <p className="mt-1 font-semibold">{selectedArea?.name_en || '-'}</p>
                    {selectedArea?.name_ar ? <p className="mt-1 text-xs text-[#6b7280]">{selectedArea.name_ar}</p> : null}
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Broker</p>
                    <p className="mt-1 font-semibold">{brokers.find((broker) => broker.id === brokerId)?.full_name || '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Owner</p>
                    <p className="mt-1 font-semibold">{reviewOwnerLabel}</p>
                    {reviewOwnerSubLabel ? <p className="mt-1 text-xs text-[#6b7280]">{reviewOwnerSubLabel}</p> : null}
                    <p className="mt-1 text-xs text-[#6b7280]">
                      {ownerMode === 'new' ? 'New owner will be created' : 'Existing owner selected'}
                    </p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Gender</p>
                    <p className="mt-1 font-semibold">{gender || '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Full Apartment Price</p>
                    <p className="mt-1 font-semibold">{priceEgp ? `${priceEgp} EGP` : '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Floor Number</p>
                    <p className="mt-1 font-semibold">{floorNumber}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Lowest Room Option Price</p>
                    <p className="mt-1 font-semibold">{lowestAvailableOptionPrice ? `${lowestAvailableOptionPrice} EGP` : '-'}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Images</p>
                    <p className="mt-1 font-semibold">{imageFiles.filter((item) => item.file).length}</p>
                  </div>


                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Video</p>
                    <p className="mt-1 font-semibold">
                      {videoFile ? videoFile.name : 'No video selected'}
                    </p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Bedrooms</p>
                    <p className="mt-1 font-semibold">{bedroomsCount}</p>
                  </div>

                  <div className="rounded-md border border-[#ececec] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">Bathrooms</p>
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
                    <p className="mt-1 font-semibold">{rooms.length}</p>
                  </div>
                </div>

                {rooms.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-base font-semibold text-[#1a1a1a]">Rooms Summary</h3>

                    <div className="space-y-3">
                      {rooms.map((room, index) => {
                        const optionLabels: string[] = []

                        if (room.single_room_enabled) {
                          optionLabels.push(`Single: ${room.single_room_price_egp || '-'} EGP`)
                        }

                        if (room.double_room_enabled) {
                          optionLabels.push(`Double: ${room.double_room_price_egp || '-'} EGP`)
                        }

                        if (room.triple_room_enabled) {
                          optionLabels.push(`Triple: ${room.triple_room_price_egp || '-'} EGP`)
                        }

                        return (
                          <div key={index} className="rounded-md border border-[#ececec] p-3">
                            <p className="font-semibold text-[#1a1a1a]">{room.room_name || `Room ${index + 1}`}</p>
                            <p className="mt-2 text-sm text-[#6b7280]">
                              Type: {room.room_type} | Beds: {room.beds_count || '0'}
                            </p>
                            <p className="mt-1 text-sm text-[#6b7280]">
                              Options: {optionLabels.length > 0 ? optionLabels.join(' | ') : '-'}
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

            {videoUploadProgress && (
              <div className="mb-4 rounded-xl border border-[#bdd7f4] bg-[#f3f9ff] px-4 py-3 text-sm font-medium text-[#0b66c3]">
                {videoUploadProgress}
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
                  type="button"
                  onClick={submitProperty}
                  disabled={isBusy || !propertyCode}
                  className="inline-flex h-[46px] min-w-[160px] items-center justify-center rounded-xl bg-[#0071c2] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#005fa3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploadingVideo ? videoUploadProgress || 'Uploading video...' : isPending ? 'Saving...' : 'Save Property'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </form>
  )
}