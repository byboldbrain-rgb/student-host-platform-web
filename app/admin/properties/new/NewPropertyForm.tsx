'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPropertyAction } from './actions'
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

type Props = {
  cities: City[]
  universities: University[]
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
  {
    id: 1,
    title: 'Basic Info',
    startStep: 1,
    endStep: 2,
    navigateStep: 1,
  },
  {
    id: 2,
    title: 'Photos',
    startStep: 3,
    endStep: 3,
    navigateStep: 3,
  },
  {
    id: 3,
    title: 'Property Details',
    startStep: 4,
    endStep: 4,
    navigateStep: 4,
  },
  {
    id: 4,
    title: 'Rooms & Pricing',
    startStep: 5,
    endStep: 5,
    navigateStep: 5,
  },
  {
    id: 5,
    title: 'Property Featured',
    startStep: 6,
    endStep: 6,
    navigateStep: 6,
  },
  {
    id: 6,
    title: 'Review',
    startStep: 7,
    endStep: 7,
    navigateStep: 7,
  },
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
        disabled
          ? 'border-[#ececec] bg-[#f7f7f7]'
          : 'border-[#e5e7eb] bg-[#fafafa]'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
              disabled={disabled}
              className="mt-0.5 h-4 w-4"
            />
            <span
              className={`text-sm font-semibold ${
                disabled ? 'text-[#9ca3af]' : 'text-[#1a1a1a]'
              }`}
            >
              {title}
            </span>
          </label>

          <p
            className={`mt-2 text-sm ${
              disabled ? 'text-[#9ca3af]' : 'text-[#6b7280]'
            }`}
          >
            {description}
          </p>

          {disabled && disabledReason && (
            <p className="mt-2 text-xs font-medium text-[#b45309]">
              {disabledReason}
            </p>
          )}
        </div>
      </div>

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
  if (room.rental_duration.trim() === '') return 'Room rental duration is required.'
  if (!isValidPositiveInt(room.beds_count)) return 'Beds count must be at least 1.'

  const enabledAnyOption =
    room.single_room_enabled || room.double_room_enabled || room.triple_room_enabled

  if (!enabledAnyOption) {
    return 'Enable at least one booking option for this room.'
  }

  if (room.single_room_enabled && !isValidPrice(room.single_room_price_egp)) {
    return 'Single Room price must be a valid value.'
  }

  if (room.double_room_enabled) {
    if (bedsCount < 2) {
      return 'Double Room requires at least 2 beds.'
    }

    if (!isValidPrice(room.double_room_price_egp)) {
      return 'Double Room price must be a valid value.'
    }
  }

  if (room.triple_room_enabled) {
    if (bedsCount < 3) {
      return 'Triple Room requires at least 3 beds.'
    }

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

function IconThumb({
  label,
  iconUrl,
}: {
  label: string
  iconUrl?: string | null
}) {
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
  children: React.ReactNode
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
    <Link
      href="/admin/properties"
      className="navienty-logo"
      aria-label="Navienty admin home"
    >
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
  const [descriptionEn, setDescriptionEn] = useState('')
  const [addressEn, setAddressEn] = useState('')

  const [cityId, setCityId] = useState('')
  const [universityId, setUniversityId] = useState('')
  const [brokerId, setBrokerId] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [ownerSearch, setOwnerSearch] = useState('')
  const [priceEgp, setPriceEgp] = useState('')
  const [propertyRentalDuration, setPropertyRentalDuration] = useState<
    'monthly' | 'daily'
  >('monthly')

  const [bedroomsCount, setBedroomsCount] = useState('0')
  const [bathroomsCount, setBathroomsCount] = useState('0')
  const [bedsCount, setBedsCount] = useState('0')
  const [guestsCount, setGuestsCount] = useState('0')
  const [gender, setGender] = useState('')

  const [imageFiles, setImageFiles] = useState<ImageFileItem[]>([])
  const [coverIndex, setCoverIndex] = useState(0)
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false)

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
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl)
        }
      })
    }
  }, [imageFiles])

  const filteredUniversities = useMemo(() => {
    if (!cityId) return []
    return universities.filter((university) => university.city_id === cityId)
  }, [cityId, universities])

  const filteredBrokers = useMemo(() => {
    if (!universityId) return []

    const allowedBrokerIds = new Set(
      brokerUniversities
        .filter((item) => item.university_id === universityId)
        .map((item) => item.broker_id)
    )

    return brokers.filter((broker) => allowedBrokerIds.has(broker.id))
  }, [universityId, brokerUniversities, brokers])

  const activeOwners = useMemo(() => {
    return [...owners]
      .filter((owner) => owner.is_active !== false)
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [owners])

  const eligibleOwners = useMemo(() => {
    if (!cityId || !universityId) return []

    const eligibleOwnerIds = new Set(
      ownerServiceAreas
        .filter((area) => {
          if (area.is_active === false) return false
          if (area.city_id !== cityId) return false
          if (area.university_id !== universityId) return false
          return true
        })
        .map((area) => area.owner_id)
    )

    return activeOwners.filter((owner) => eligibleOwnerIds.has(owner.id))
  }, [activeOwners, ownerServiceAreas, cityId, universityId])

  const displayedOwners = useMemo(() => {
    const search = ownerSearch.trim().toLowerCase()

    if (!cityId || !universityId) {
      return []
    }

    if (!search) {
      return eligibleOwners.slice(0, 80)
    }

    return eligibleOwners
      .filter((owner) => {
        const haystack = [
          owner.full_name,
          owner.company_name,
          owner.phone_number,
          owner.whatsapp_number,
          owner.email,
          owner.tax_id,
          owner.national_id,
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

  const activeAmenities = useMemo(() => {
    return [...amenities]
      .filter((item) => item.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [amenities])

    const amenityCategoryGroups = useMemo<AmenityCategoryGroup[]>(() => {
    const groupMap = new Map<string, AmenityCategoryGroup>()

    activeAmenities.forEach((item) => {
      const rawCategory =
        item.category_en?.trim() ||
        item.category_ar?.trim() ||
        'Other Amenities'

      if (!groupMap.has(rawCategory)) {
        groupMap.set(rawCategory, {
          key: rawCategory,
          title: rawCategory,
          items: [],
        })
      }

      groupMap.get(rawCategory)!.items.push(item)
    })

    return Array.from(groupMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    )
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

  const canAutoSuggestBedrooms = useMemo(() => {
    return rooms.length > 0
  }, [rooms.length])

  useEffect(() => {
    if (canAutoSuggestBedrooms && Number(bedroomsCount) === 0) {
      setBedroomsCount(String(rooms.length))
    }
  }, [canAutoSuggestBedrooms, rooms.length, bedroomsCount])

  useEffect(() => {
    if (!ownerId) return

    const ownerStillValid = eligibleOwners.some((owner) => owner.id === ownerId)

    if (!ownerStillValid) {
      setOwnerId('')
    }
  }, [ownerId, eligibleOwners])

  const lowestAvailableOptionPrice = useMemo(() => {
    const prices = rooms.flatMap((room) =>
      getEnabledRoomOptions(room).map((option) =>
        Number(normalizeNumberString(option.price))
      )
    )

    const validPrices = prices.filter((price) => Number.isFinite(price) && price > 0)

    if (validPrices.length === 0) return null
    return Math.min(...validPrices)
  }, [rooms])

  const handleCityChange = (value: string) => {
    setCityId(value)
    setUniversityId('')
    setBrokerId('')
    setOwnerId('')
    setOwnerSearch('')
  }

  const handleUniversityChange = (value: string) => {
    setUniversityId(value)
    setBrokerId('')
    setOwnerId('')
    setOwnerSearch('')
  }

  const handleBrokerChange = (value: string) => {
    setBrokerId(value)
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
      if (itemToRemove?.previewUrl) {
        URL.revokeObjectURL(itemToRemove.previewUrl)
      }

      return prev.filter((_, i) => i !== index)
    })

    if (coverIndex === index) {
      setCoverIndex(0)
    } else if (coverIndex > index) {
      setCoverIndex((prev) => prev - 1)
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
      },
    ])
  }

  const updateRoom = (
    index: number,
    field: keyof RoomForm,
    value: string | boolean
  ) => {
    setRooms((prev) =>
      prev.map((room, i) => {
        if (i !== index) return room

        const nextRoom = {
          ...room,
          [field]:
            typeof value === 'string' &&
            field !== 'room_name' &&
            field !== 'room_name_ar'
              ? normalizeNumberFieldIfNeeded(field, value)
              : value,
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
      room.rental_duration.trim() !== '' ||
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
          !descriptionEn.trim() ||
          !addressEn.trim()
        ) {
          return 'Please complete Property Code, Title EN, Description EN, and Address EN.'
        }
        return ''

      case 2:
        if (
          !cityId.trim() ||
          !universityId.trim() ||
          !brokerId.trim() ||
          !ownerId.trim() ||
          !gender.trim() ||
          !propertyRentalDuration.trim()
        ) {
          return 'Please complete city, university, broker, owner, gender, and rental duration.'
        }

        if (!eligibleOwners.some((owner) => owner.id === ownerId)) {
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
          !isValidPrice(priceEgp) ||
          !isValidNonNegativeInt(bedroomsCount) ||
          !isValidNonNegativeInt(bathroomsCount) ||
          !isValidNonNegativeInt(bedsCount) ||
          !isValidNonNegativeInt(guestsCount)
        ) {
          return 'Full apartment price, bedrooms, bathrooms, beds, and guests must be valid values.'
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

    const formElement = document.getElementById(
      'new-property-form'
    ) as HTMLFormElement | null

    if (!formElement) {
      setErrorMessage('Form not found')
      return
    }

    const formData = new FormData(formElement)

    formData.set('property_id', propertyCode)
    formData.set('title_en', titleEn)
    formData.set('title_ar', titleEn)
    formData.set('description_en', descriptionEn)
    formData.set('description_ar', descriptionEn)
    formData.set('address_en', addressEn)
    formData.set('address_ar', addressEn)
    formData.set('city_id', cityId)
    formData.set('university_id', universityId)
    formData.set('broker_id', brokerId)
    formData.set('owner_id', ownerId)
    formData.set('price_egp', normalizeNumberString(priceEgp))
    formData.set('rental_duration', propertyRentalDuration)
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
      formData.append('room_rental_duration', room.rental_duration)
      formData.append('room_beds_count', normalizeNumberString(room.beds_count))
      formData.append(
        'room_private_bathroom',
        room.private_bathroom ? 'true' : 'false'
      )

      formData.append(
        'room_single_room_enabled',
        room.single_room_enabled ? 'true' : 'false'
      )
      formData.append(
        'room_single_room_price_egp',
        normalizeNumberString(room.single_room_price_egp)
      )

      formData.append(
        'room_double_room_enabled',
        room.double_room_enabled ? 'true' : 'false'
      )
      formData.append(
        'room_double_room_price_egp',
        normalizeNumberString(room.double_room_price_egp)
      )

      formData.append(
        'room_triple_room_enabled',
        room.triple_room_enabled ? 'true' : 'false'
      )
      formData.append(
        'room_triple_room_price_egp',
        normalizeNumberString(room.triple_room_price_egp)
      )
    })

    formData.delete('images')
    imageFiles.forEach((item) => {
      if (item.file) {
        formData.append('images', item.file)
      }
    })

    const getValue = (name: string) => String(formData.get(name) || '').trim()

    const basicFieldsComplete = [
      'property_id',
      'title_en',
      'description_en',
      'address_en',
      'city_id',
      'university_id',
      'broker_id',
      'owner_id',
      'price_egp',
      'rental_duration',
      'gender',
      'bedrooms_count',
      'bathrooms_count',
      'beds_count',
      'guests_count',
    ].every((field) => getValue(field))

    const adminStatus =
      basicFieldsComplete && hasAtLeastOneImage && hasValidRoom
        ? 'pending_review'
        : 'draft'

    formData.set('admin_status', adminStatus)
    formData.set('cover_index', String(coverIndex))

    startTransition(async () => {
      try {
        await createPropertyAction(formData)
        router.push('/admin/properties')
        router.refresh()
      } catch (error: any) {
        setErrorMessage(error.message || 'Something went wrong')
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

  return (
    <form
      id="new-property-form"
      onSubmit={(event) => event.preventDefault()}
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

        .desktop-header-nav-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #20212a;
          text-decoration: none;
          font-size: 15px;
          line-height: 1;
          border: none;
          background: none;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          padding: 8px 0;
          transition: color 0.3s ease;
        }

        .desktop-header-nav-button::before {
          margin-left: auto;
        }

        .desktop-header-nav-button::after,
        .desktop-header-nav-button::before {
          content: '';
          width: 0%;
          height: 2px;
          background: #000000;
          display: block;
          transition: 0.5s;
          position: absolute;
          left: 0;
        }

        .desktop-header-nav-button::before {
          top: 0;
        }

        .desktop-header-nav-button::after {
          bottom: 0;
        }

        .desktop-header-nav-button:hover::after,
        .desktop-header-nav-button:hover::before,
        .desktop-header-nav-button:focus-visible::after,
        .desktop-header-nav-button:focus-visible::before {
          width: 100%;
        }

        .desktop-header-nav-button-active {
          color: #054aff;
        }

        .desktop-header-nav-button-inactive {
          color: #20212a;
        }

        .desktop-header-nav-button-inactive:hover,
        .desktop-header-nav-button-inactive:focus-visible {
          color: #054aff;
        }

        @media (max-width: 768px) {
          .navienty-logo {
            transform: none;
            margin-top: 0;
          }

          .navienty-logo-icon {
            width: 42px;
            height: 42px;
          }

          .navienty-logo-text-wrap {
            display: none;
          }

          .mobile-header-inner {
            justify-content: center !important;
          }
        }
      `}</style>

      <input type="hidden" name="admin_status" value="draft" />
      <input type="hidden" name="property_id" value={propertyCode} />
      <input type="hidden" name="title_en" value={titleEn} />
      <input type="hidden" name="title_ar" value={titleEn} />
      <input type="hidden" name="description_en" value={descriptionEn} />
      <input type="hidden" name="description_ar" value={descriptionEn} />
      <input type="hidden" name="address_en" value={addressEn} />
      <input type="hidden" name="address_ar" value={addressEn} />
      <input type="hidden" name="city_id" value={cityId} />
      <input type="hidden" name="university_id" value={universityId} />
      <input type="hidden" name="broker_id" value={brokerId} />
      <input type="hidden" name="owner_id" value={ownerId} />
      <input type="hidden" name="price_egp" value={priceEgp} />
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
                    {status === 'active' && (
                      <span className="ml-2 text-[#054aff]">◑</span>
                    )}
                  </div>

                  <div className="mt-4 flex h-[3px] w-[145px] overflow-hidden rounded-full bg-[#bdbdbd]">
                    <div
                      className={`h-full ${
                        progress > 0 ? 'bg-[#0071c2]' : 'bg-transparent'
                      }`}
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
          <div className="w-full">
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
                      value={propertyCode}
                      onChange={(e) => setPropertyCode(e.target.value)}
                      placeholder="Property Code"
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
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

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
                      Description EN
                    </label>
                    <textarea
                      value={descriptionEn}
                      onChange={(e) => setDescriptionEn(e.target.value)}
                      placeholder="Description EN"
                      rows={4}
                      className="w-full rounded-md border border-[#cfcfcf] px-3 py-2.5 text-sm outline-none transition focus:border-[#0071c2]"
                    />
                  </div>

                  <div className="md:col-span-2">
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
                </div>
              </div>
            </section>

            <section className={currentStep === 2 ? 'block' : 'hidden'}>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] md:text-[36px]">
                    Basic Info
                  </h1>
                </div>
              </div>

              <div className="mt-6 rounded-md border border-[#e7e7e7] bg-white p-4 shadow-sm md:p-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      City
                    </label>
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
                    <label className="mb-1.5 block text-sm font-medium">
                      University
                    </label>
                    <select
                      value={universityId}
                      onChange={(e) => handleUniversityChange(e.target.value)}
                      disabled={!cityId}
                      className={`${selectClass} disabled:bg-[#f5f5f5]`}
                    >
                      <option value="">
                        {cityId ? 'Select University' : 'Select City'}
                      </option>
                      {filteredUniversities.map((university) => (
                        <option key={university.id} value={university.id}>
                          {university.name_en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Broker
                    </label>
                    <select
                      value={brokerId}
                      onChange={(e) => handleBrokerChange(e.target.value)}
                      disabled={!universityId}
                      className={`${selectClass} disabled:bg-[#f5f5f5]`}
                    >
                      <option value="">
                        {universityId ? 'Select Broker' : 'Select University'}
                      </option>
                      {filteredBrokers.map((broker) => (
                        <option key={broker.id} value={broker.id}>
                          {broker.full_name}
                          {broker.company_name ? ` - ${broker.company_name}` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-[#6b7280]">
                      Broker is the person/company handling listing and operations.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Search Owner
                    </label>
                    <input
                      value={ownerSearch}
                      onChange={(e) => setOwnerSearch(e.target.value)}
                      placeholder={
                        cityId && universityId
                          ? 'Search by name, phone, email, tax ID...'
                          : 'Select city and university first'
                      }
                      disabled={!cityId || !universityId}
                      className={`${inputClass} disabled:bg-[#f5f5f5]`}
                    />
                    <p className="mt-2 text-xs text-[#6b7280]">
                      Owners are filtered by the selected city and university.
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium">
                      Owner
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
                          {selectedOwner.full_name}
                          {selectedOwner.phone_number
                            ? ` - ${selectedOwner.phone_number}`
                            : ''}
                        </option>
                      ) : null}

                      {displayedOwners.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.full_name}
                          {owner.company_name ? ` - ${owner.company_name}` : ''}
                          {owner.phone_number ? ` - ${owner.phone_number}` : ''}
                        </option>
                      ))}
                    </select>

                    {cityId && universityId && eligibleOwners.length === 0 ? (
                      <p className="mt-2 text-xs font-medium text-[#b42318]">
                        No active owners are assigned to this city and university.
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-[#6b7280]">
                        Showing owners assigned to the selected city and university only.
                      </p>
                    )}
                  </div>

                  {selectedOwner ? (
                    <div className="md:col-span-2 rounded-md border border-[#dbeafe] bg-[#f0f7ff] p-4 text-sm text-[#0f3f75]">
                      <p className="font-semibold text-[#0f3f75]">
                        Selected owner details
                      </p>
                      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                        <p>Name: {selectedOwner.full_name || '—'}</p>
                        <p>Company: {selectedOwner.company_name || '—'}</p>
                        <p>Phone: {selectedOwner.phone_number || '—'}</p>
                        <p>WhatsApp: {selectedOwner.whatsapp_number || '—'}</p>
                        <p>Email: {selectedOwner.email || '—'}</p>
                        <p>Tax ID: {selectedOwner.tax_id || '—'}</p>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Gender
                    </label>
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

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Rental Duration
                    </label>
                    <select
                      value={propertyRentalDuration}
                      onChange={(e) =>
                        setPropertyRentalDuration(
                          e.target.value as 'monthly' | 'daily'
                        )
                      }
                      className={selectClass}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="daily">Daily</option>
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

                    <p className="text-[18px] font-bold text-[#111827]">
                      Drag and drop or
                    </p>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 inline-flex items-center gap-2 rounded-md border border-[#006ce4] bg-white px-5 py-3 text-[16px] font-semibold text-[#006ce4] transition hover:bg-[#f7fbff]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <path d="M7 10l5-5 5 5" />
                        <path d="M12 5v12" />
                      </svg>
                      Upload photos
                    </button>
                  </div>
                </div>

                {imageFiles.length > 0 && (
                  <div className="mt-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium text-[#4b5563]">
                        {imageFiles.length} image
                        {imageFiles.length === 1 ? '' : 's'} selected
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
                        <div
                          key={`${item.previewUrl}-${index}`}
                          className="overflow-hidden rounded-md border border-[#d9d9d9] bg-white"
                        >
                          {item.previewUrl && (
                            <img
                              src={item.previewUrl}
                              alt={`Preview ${index + 1}`}
                              className="h-48 w-full object-cover"
                            />
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
                                {coverIndex === index && item.file
                                  ? 'Cover'
                                  : 'Set Cover'}
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
                      onChange={(e) =>
                        setPriceEgp(normalizeNumberString(e.target.value))
                      }
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

                  <div>
                    <CounterField
                      label="How many bedrooms are there?"
                      value={bedroomsCount}
                      onChange={setBedroomsCount}
                      helperText="You can set this manually. It does not have to exactly match the number of room cards below."
                    />
                  </div>

                  <div>
                    <CounterField
                      label="How many beds are there?"
                      value={bedsCount}
                      onChange={setBedsCount}
                      helperText="This is auto-calculated from room beds, but you can still adjust it if needed."
                    />
                  </div>

                  <div>
                    <CounterField
                      label="How many guests can stay?"
                      value={guestsCount}
                      onChange={setGuestsCount}
                    />
                  </div>

                  <div>
                    <CounterField
                      label="How many bathrooms are there?"
                      value={bathroomsCount}
                      onChange={setBathroomsCount}
                    />
                  </div>
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
                      <div
                        key={index}
                        className="rounded-md border border-[#e5e7eb] bg-white p-5 shadow-sm"
                      >
                        <div className="mb-5 flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-[22px] font-bold text-[#1a1a1a]">
                              {room.room_name || `Bedroom ${index + 1}`}
                            </h3>
                            <p className="mt-1 text-sm text-[#6b7280]">
                              {getRoomOptionCountLabel(room)} •{' '}
                              {room.beds_count || '0'} bed(s)
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
                              onChange={(e) =>
                                updateRoom(index, 'room_name', e.target.value)
                              }
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
                              Rental Duration
                            </label>
                            <select
                              value={room.rental_duration}
                              onChange={(e) =>
                                updateRoom(index, 'rental_duration', e.target.value)
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
                              onChange={(e) =>
                                updateRoom(index, 'beds_count', e.target.value)
                              }
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
                                  updateRoom(
                                    index,
                                    'private_bathroom',
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4"
                              />
                              <span className="text-sm font-medium text-[#1a1a1a]">
                                Private bathroom
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
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] md:text-[36px]">
                    Property Featured
                  </h1>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                {amenityCategoryGroups.map((group) => (
                  <FeatureSection
                    key={group.key}
                    title={group.title}
                    subtitle={`${group.items.length} item${
                      group.items.length === 1 ? '' : 's'
                    }`}
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
                        Title EN
                      </p>
                      <p className="mt-1 font-semibold">{titleEn || '-'}</p>
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
                        {universities.find((university) => university.id === universityId)
                          ?.name_en || '-'}
                      </p>
                    </div>

                    <div className="rounded-md border border-[#ececec] p-3">
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                        Broker
                      </p>
                      <p className="mt-1 font-semibold">
                        {brokers.find((broker) => broker.id === brokerId)?.full_name ||
                          '-'}
                      </p>
                    </div>

                    <div className="rounded-md border border-[#ececec] p-3">
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                        Owner
                      </p>
                      <p className="mt-1 font-semibold">
                        {selectedOwner?.full_name || '-'}
                      </p>
                      {selectedOwner ? (
                        <p className="mt-1 text-xs text-[#6b7280]">
                          {selectedOwner.company_name ||
                            selectedOwner.phone_number ||
                            selectedOwner.whatsapp_number ||
                            selectedOwner.email ||
                            ''}
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-md border border-[#ececec] p-3">
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                        Gender
                      </p>
                      <p className="mt-1 font-semibold">{gender || '-'}</p>
                    </div>

                    <div className="rounded-md border border-[#ececec] p-3">
                      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">
                        Rental Duration
                      </p>
                      <p className="mt-1 font-semibold">
                        {propertyRentalDuration || '-'}
                      </p>
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
                      <p className="mt-1 font-semibold">
                        {imageFiles.filter((item) => item.file).length}
                      </p>
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
                      <p className="mt-1 font-semibold">{rooms.length}</p>
                    </div>
                  </div>

                  {rooms.length > 0 && (
                    <div className="mt-6">
                      <h3 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                        Rooms Summary
                      </h3>

                      <div className="space-y-3">
                        {rooms.map((room, index) => {
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
                              key={index}
                              className="rounded-md border border-[#ececec] p-3"
                            >
                              <p className="font-semibold text-[#1a1a1a]">
                                {room.room_name || `Room ${index + 1}`}
                              </p>
                              <p className="mt-2 text-sm text-[#6b7280]">
                                Type: {room.room_type} | Duration:{' '}
                                {room.rental_duration} | Beds:{' '}
                                {room.beds_count || '0'}
                              </p>
                              <p className="mt-1 text-sm text-[#6b7280]">
                                Options:{' '}
                                {optionLabels.length > 0
                                  ? optionLabels.join(' | ')
                                  : '-'}
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

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={currentStep === 1 || isPending}
                className="inline-flex h-[46px] items-center justify-center rounded-xl border border-[#d1d5db] bg-white px-5 text-sm font-medium text-[#1a1a1a] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>

              {currentStep < FORM_STEPS.length ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={isPending}
                  className="inline-flex h-[46px] min-w-[140px] items-center justify-center rounded-xl bg-[#0071c2] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#005fa3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitProperty}
                  disabled={isPending || !propertyCode}
                  className="inline-flex h-[46px] min-w-[160px] items-center justify-center rounded-xl bg-[#0071c2] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#005fa3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Property'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </form>
  )
}