import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import type { ReactNode } from 'react'
import { createClient } from '@/src/lib/supabase/server'
import {
  requirePropertiesSectionAccess,
  requirePropertyReviewerAccess,
} from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'
import {
  approvePropertyAction,
  rejectPropertyAction,
} from '../actions'
import PropertyGalleryEditor from './PropertyGalleryEditor'

const hiddenSaveButtonClass = 'hidden'

type PropertyImage = {
  id?: string
  image_url?: string | null
  is_cover?: boolean | null
  sort_order?: number | null
  storage_path?: string | null
}

type ReviewProperty = {
  id: string
  property_id: string
  title_en?: string | null
  title_ar?: string | null
  description_en?: string | null
  description_ar?: string | null
  address_en?: string | null
  address_ar?: string | null
  city_id?: string | null
  university_id?: string | null
  broker_id?: string | null
  price_egp?: number | null
  rental_duration?: 'daily' | 'monthly' | string | null
  availability_status?: string | null
  bedrooms_count?: number | null
  bathrooms_count?: number | null
  beds_count?: number | null
  guests_count?: number | null
  gender?: string | null
  smoking_policy?: string | null
  admin_status?: string | null
  is_active?: boolean | null
  review_notes?: string | null
  created_at?: string | null
  updated_at?: string | null
  property_images?: PropertyImage[] | null
  [key: string]: unknown
}

type City = {
  id: string
  name_en?: string | null
  name_ar?: string | null
}

type University = {
  id: string
  name_en?: string | null
  name_ar?: string | null
}

type Broker = {
  id: string
  full_name?: string | null
  company_name?: string | null
  phone_number?: string | null
  whatsapp_number?: string | null
  email?: string | null
  image_url?: string | null
}

type Amenity = {
  id: string
  name_en?: string | null
  name_ar?: string | null
  icon_url?: string | null
  is_active?: boolean | null
  sort_order?: number | null
}

type BillType = {
  id: number
  name_en?: string | null
  name_ar?: string | null
  icon_url?: string | null
  is_active?: boolean | null
  sort_order?: number | null
}

type RoomType = {
  id: string
  room_type_code?: string | null
  name_en?: string | null
  name_ar?: string | null
  description_en?: string | null
  description_ar?: string | null
  price_egp?: number | null
  rental_duration?: 'daily' | 'monthly' | string | null
  bathrooms_count?: number | null
  available_rooms_count?: number | null
  move_in_date?: string | null
  move_out_text?: string | null
  min_stay_months?: number | null
  is_active?: boolean | null
  sort_order?: number | null
}

function formatPrice(value?: number | null) {
  if (typeof value !== 'number') return '—'

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${value} EGP`
  }
}

function getStatusLabel(value?: string | null) {
  if (!value) return 'Unknown'

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function parseString(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

function parseNullableString(value: FormDataEntryValue | null) {
  const parsed = parseString(value)
  return parsed === '' ? null : parsed
}

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = parseString(value)
  if (parsed === '') return fallback
  const num = Number(parsed)
  return Number.isFinite(num) ? num : fallback
}

async function approveAndSaveAllPropertyAction(formData: FormData) {
  'use server'

  await requirePropertiesSectionAccess()
  await requirePropertyReviewerAccess()

  const supabase = await createClient()
  const propertyDbId = parseString(formData.get('property_db_id'))
  const propertyRouteId = parseString(formData.get('property_route_id'))
  const propertyActionId = parseString(formData.get('property_id'))

  if (!propertyDbId || !propertyRouteId || !propertyActionId) {
    throw new Error('Property id is required.')
  }

  const now = new Date().toISOString()

  const propertyPayload = {
    title_en: parseString(formData.get('title_en')),
    title_ar: parseString(formData.get('title_ar')),
    description_en: parseString(formData.get('description_en')),
    description_ar: parseString(formData.get('description_ar')),
    address_en: parseNullableString(formData.get('address_en')),
    address_ar: parseNullableString(formData.get('address_ar')),
    city_id: parseNullableString(formData.get('city_id')),
    university_id: parseNullableString(formData.get('university_id')),
    broker_id: parseNullableString(formData.get('broker_id')),
    price_egp: parseNumber(formData.get('price_egp'), 0),
    rental_duration: parseString(formData.get('rental_duration')),
    availability_status: parseString(formData.get('availability_status')),
    bedrooms_count: parseNumber(formData.get('bedrooms_count'), 0),
    bathrooms_count: parseNumber(formData.get('bathrooms_count'), 0),
    beds_count: parseNumber(formData.get('beds_count'), 0),
    guests_count: parseNumber(formData.get('guests_count'), 0),
    gender: parseNullableString(formData.get('gender')),
    smoking_policy: parseNullableString(formData.get('smoking_policy')),
    admin_status: parseString(formData.get('admin_status')),
    updated_at: now,
  }

  const { error: propertyUpdateError } = await supabase
    .from('properties')
    .update(propertyPayload)
    .eq('id', propertyDbId)

  if (propertyUpdateError) {
    throw new Error(`Failed to update property: ${propertyUpdateError.message}`)
  }

  const selectedAmenityIds = formData
    .getAll('amenity_ids')
    .map((value) => String(value))
    .filter(Boolean)

  const { error: deleteAmenitiesError } = await supabase
    .from('property_amenities')
    .delete()
    .eq('property_id_ref', propertyDbId)

  if (deleteAmenitiesError) {
    throw new Error(`Failed to reset amenities: ${deleteAmenitiesError.message}`)
  }

  if (selectedAmenityIds.length > 0) {
    const amenityRows = selectedAmenityIds.map((amenityId) => ({
      property_id_ref: propertyDbId,
      amenity_id: amenityId,
    }))

    const { error: insertAmenitiesError } = await supabase
      .from('property_amenities')
      .insert(amenityRows)

    if (insertAmenitiesError) {
      throw new Error(`Failed to save amenities: ${insertAmenitiesError.message}`)
    }
  }

  const selectedBillTypeIds = formData
    .getAll('bill_type_ids')
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))

  const { error: deleteBillsError } = await supabase
    .from('property_bill_includes')
    .delete()
    .eq('property_id_ref', propertyDbId)

  if (deleteBillsError) {
    throw new Error(`Failed to reset bills: ${deleteBillsError.message}`)
  }

  if (selectedBillTypeIds.length > 0) {
    const billRows = selectedBillTypeIds.map((billTypeId) => ({
      property_id_ref: propertyDbId,
      bill_type_id: billTypeId,
    }))

    const { error: insertBillsError } = await supabase
      .from('property_bill_includes')
      .insert(billRows)

    if (insertBillsError) {
      throw new Error(`Failed to save bills: ${insertBillsError.message}`)
    }
  }

  const roomTypeIds = formData
    .getAll('room_type_ids')
    .map((value) => String(value))
    .filter(Boolean)

  for (const roomTypeId of roomTypeIds) {
    const payload = {
      room_type_code: parseNullableString(formData.get(`room_type_code_${roomTypeId}`)),
      name_en: parseString(formData.get(`room_name_en_${roomTypeId}`)),
      name_ar: parseNullableString(formData.get(`room_name_ar_${roomTypeId}`)),
      description_en: parseNullableString(formData.get(`room_description_en_${roomTypeId}`)),
      description_ar: parseNullableString(formData.get(`room_description_ar_${roomTypeId}`)),
      price_egp: parseNumber(formData.get(`room_price_egp_${roomTypeId}`), 0),
      rental_duration:
        parseString(formData.get(`room_rental_duration_${roomTypeId}`)) || 'monthly',
      updated_at: now,
    }

    const { error: roomUpdateError } = await supabase
      .from('property_room_types')
      .update(payload)
      .eq('id', roomTypeId)

    if (roomUpdateError) {
      throw new Error(`Failed to update room type: ${roomUpdateError.message}`)
    }
  }

  const existingImagesRes = await supabase
    .from('property_images')
    .select('id, image_url, is_cover, sort_order, storage_path')
    .eq('property_id_ref', propertyDbId)
    .order('sort_order', { ascending: true })

  if (existingImagesRes.error) {
    throw new Error(`Failed to load current images: ${existingImagesRes.error.message}`)
  }

  const existingImages = (existingImagesRes.data || []) as PropertyImage[]

  const removeIds = formData
    .getAll('remove_image_ids')
    .map((value) => String(value))
    .filter(Boolean)

  const files = formData
    .getAll('images')
    .filter((value): value is File => value instanceof File && value.size > 0)

  const imagesToRemove = existingImages.filter(
    (image) => image.id && removeIds.includes(image.id)
  )

  if (imagesToRemove.length > 0) {
    const storagePathsToRemove = imagesToRemove
      .map((image) => image.storage_path || '')
      .filter(Boolean)

    if (storagePathsToRemove.length > 0) {
      const { error: storageDeleteError } = await supabase.storage
        .from('property-images')
        .remove(storagePathsToRemove)

      if (storageDeleteError) {
        throw new Error(`Failed to delete files from storage: ${storageDeleteError.message}`)
      }
    }

    const { error: dbDeleteError } = await supabase
      .from('property_images')
      .delete()
      .in('id', removeIds)

    if (dbDeleteError) {
      throw new Error(`Failed to delete images from database: ${dbDeleteError.message}`)
    }
  }

  if (files.length > 0) {
    const remainingImages = existingImages.filter(
      (image) => !image.id || !removeIds.includes(image.id)
    )

    const insertRows: Array<{
      property_id_ref: string
      image_url: string
      storage_path: string
      is_cover: boolean
      sort_order: number
    }> = []

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index]
      const fileExt = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
      const fileName = `${Date.now()}-${index}-${randomUUID()}.${fileExt}`
      const storagePath = `properties/${propertyDbId}/${fileName}`
      const arrayBuffer = await file.arrayBuffer()

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(storagePath, arrayBuffer, {
          contentType: file.type || 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`)
      }

      const { data: publicUrlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(storagePath)

      insertRows.push({
        property_id_ref: propertyDbId,
        image_url: publicUrlData.publicUrl,
        storage_path: storagePath,
        is_cover: false,
        sort_order: remainingImages.length + index,
      })
    }

    if (insertRows.length > 0) {
      const { error: insertImagesError } = await supabase
        .from('property_images')
        .insert(insertRows)

      if (insertImagesError) {
        throw new Error(`Failed to save uploaded images: ${insertImagesError.message}`)
      }
    }
  }

  const refreshedImagesRes = await supabase
    .from('property_images')
    .select('id, image_url, is_cover, sort_order, storage_path')
    .eq('property_id_ref', propertyDbId)
    .order('sort_order', { ascending: true })

  if (refreshedImagesRes.error) {
    throw new Error(`Failed to refresh images: ${refreshedImagesRes.error.message}`)
  }

  const refreshedImages = (refreshedImagesRes.data || []) as PropertyImage[]

  for (let index = 0; index < refreshedImages.length; index += 1) {
    const image = refreshedImages[index]

    if (!image.id) continue

    const { error: reorderImageError } = await supabase
      .from('property_images')
      .update({
        sort_order: index,
        is_cover: index === 0,
      })
      .eq('id', image.id)

    if (reorderImageError) {
      throw new Error(`Failed to reorder images: ${reorderImageError.message}`)
    }
  }

  await approvePropertyAction(formData)

  revalidatePath(`/admin/properties/review/${propertyRouteId}`)
  revalidatePath('/admin/properties/review')
  redirect('/admin/properties/review')
}

async function rejectPropertyAndBackAction(formData: FormData) {
  'use server'

  await rejectPropertyAction(formData)
  revalidatePath('/admin/properties/review')
  redirect('/admin/properties/review')
}

function BrandLogo() {
  return (
    <Link href="/admin" className="navienty-logo" aria-label="Navienty admin home">
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

function MobileBottomNavItem({
  href,
  label,
  isPrimary = false,
}: {
  href: string
  label: string
  isPrimary?: boolean
}) {
  return (
    <Link
      href={href}
      className={[
        'flex min-h-[52px] items-center justify-center rounded-2xl px-3 text-center text-[11px] font-semibold leading-tight transition-all duration-200',
        isPrimary
          ? 'border border-blue-600 bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]'
          : 'border border-gray-200 bg-white text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.05)]',
      ].join(' ')}
    >
      {label}
    </Link>
  )
}

function StatusBadge({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  )
}

function ReviewStepHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[32px] font-bold tracking-tight text-[#1a1a1a] md:text-[36px]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 text-sm text-[#6b7280]">{subtitle}</p>
        ) : null}
      </div>
    </div>
  )
}

function ReviewSection({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-md border border-[#e7e7e7] bg-white p-4 shadow-sm md:p-5">
      <div className="mb-5">
        <h3 className="text-[18px] font-bold text-[#162033]">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-[#687385]">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  )
}

function ReviewStatCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-md border border-[#ececec] p-3">
      <p className="text-xs uppercase tracking-wide text-[#6b6b6b]">{label}</p>
      <p className="mt-1 font-semibold text-[#1a1a1a]">{value}</p>
    </div>
  )
}

function Input({
  label,
  name,
  defaultValue,
  type = 'text',
  placeholder,
}: {
  label: string
  name: string
  defaultValue?: string | number | null
  type?: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <div className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">{label}</div>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        className="w-full rounded-md border border-[#cfcfcf] px-3 py-2.5 text-sm outline-none transition focus:border-[#0071c2]"
      />
    </label>
  )
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string
  name: string
  defaultValue?: string | number | null
  options: { value: string | number; label: string }[]
}) {
  return (
    <label className="block">
      <div className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">{label}</div>
      <select
        name={name}
        defaultValue={defaultValue === null || defaultValue === undefined ? '' : String(defaultValue)}
        className="w-full rounded-md border border-[#cfcfcf] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0071c2]"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={`${name}-${option.value}`} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextArea({
  label,
  name,
  defaultValue,
  rows = 5,
  placeholder,
}: {
  label: string
  name: string
  defaultValue?: string | null
  rows?: number
  placeholder?: string
}) {
  return (
    <label className="block">
      <div className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">{label}</div>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ''}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-md border border-[#cfcfcf] px-3 py-2.5 text-sm outline-none transition focus:border-[#0071c2]"
      />
    </label>
  )
}

function CheckboxGroup({
  title,
  name,
  items,
  selectedValues,
}: {
  title: string
  name: string
  items: { value: string; label: string; iconUrl?: string | null }[]
  selectedValues: string[]
}) {
  return (
    <div>
      <div className="mb-4 text-sm font-medium text-[#1a1a1a]">{title}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <label
            key={`${name}-${item.value}`}
            className="group relative block cursor-pointer"
            htmlFor={`${name}-${item.value}`}
          >
            <input
              id={`${name}-${item.value}`}
              type="checkbox"
              name={name}
              value={item.value}
              defaultChecked={selectedValues.includes(item.value)}
              className="peer sr-only"
            />

            <div className="flex min-h-[76px] items-center gap-3 rounded-2xl border border-[#e6ebf2] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-[#bdd7f4] hover:shadow-md peer-checked:border-[#0b66c3] peer-checked:bg-[#f3f9ff] peer-checked:shadow-[0_0_0_3px_rgba(11,102,195,0.08)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#dbe4f0] bg-white shadow-sm">
                {item.iconUrl ? (
                  <img
                    src={item.iconUrl}
                    alt={item.label}
                    className="h-6 w-6 object-contain"
                  />
                ) : (
                  <span className="text-xs font-bold text-[#0b66c3]">
                    {item.label
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join('') || '•'}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#162033]">{item.label}</p>
              </div>

              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#ccd7e4] bg-white text-transparent transition peer-checked:border-[#0b66c3] peer-checked:bg-[#0b66c3] peer-checked:text-white">
                ✓
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

export default async function PropertyReviewPreviewPage({
  params,
}: {
  params: Promise<{ propertyId: string }>
}) {
  await requirePropertiesSectionAccess()
  await requirePropertyReviewerAccess()

  const { propertyId } = await params
  const supabase = await createClient()

  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      property_images (
        id,
        image_url,
        is_cover,
        sort_order,
        storage_path
      )
    `)
    .eq('property_id', propertyId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load property preview: ${error.message}`)
  }

  if (!property) {
    notFound()
  }

  const typedProperty = property as ReviewProperty

  const [
    propertyAmenitiesRes,
    propertyBillsRes,
    roomTypesRes,
    allCitiesRes,
    allUniversitiesRes,
    allBrokersRes,
    allAmenitiesRes,
    allBillTypesRes,
  ] = await Promise.all([
    supabase
      .from('property_amenities')
      .select('amenity_id')
      .eq('property_id_ref', typedProperty.id),

    supabase
      .from('property_bill_includes')
      .select('bill_type_id')
      .eq('property_id_ref', typedProperty.id),

    supabase
      .from('property_room_types')
      .select(`
        id,
        room_type_code,
        name_en,
        name_ar,
        description_en,
        description_ar,
        price_egp,
        rental_duration,
        bathrooms_count,
        available_rooms_count,
        move_in_date,
        move_out_text,
        min_stay_months,
        is_active,
        sort_order
      `)
      .eq('property_id_ref', typedProperty.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),

    supabase
      .from('cities')
      .select('id, name_en, name_ar')
      .order('name_en', { ascending: true }),

    supabase
      .from('universities')
      .select('id, name_en, name_ar')
      .order('name_en', { ascending: true }),

    supabase
      .from('brokers')
      .select('id, full_name, company_name')
      .order('full_name', { ascending: true }),

    supabase
      .from('amenities')
      .select('id, name_en, name_ar, icon_url, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name_en', { ascending: true }),

    supabase
      .from('bill_types')
      .select('id, name_en, name_ar, icon_url, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name_en', { ascending: true }),
  ])

  const roomTypes = (roomTypesRes?.data || []) as RoomType[]
  const allCities = (allCitiesRes?.data || []) as City[]
  const allUniversities = (allUniversitiesRes?.data || []) as University[]
  const allBrokers = (allBrokersRes?.data || []) as Broker[]
  const allAmenities = (allAmenitiesRes?.data || []) as Amenity[]
  const allBillTypes = (allBillTypesRes?.data || []) as BillType[]

  const amenityIds = (propertyAmenitiesRes.data || [])
    .map((item: { amenity_id: string }) => item.amenity_id)
    .filter(Boolean)

  const billTypeIds = (propertyBillsRes.data || [])
    .map((item: { bill_type_id: number }) => String(item.bill_type_id))
    .filter(Boolean)

  const sortedPropertyImages = Array.isArray(typedProperty.property_images)
    ? [...typedProperty.property_images].sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
      )
    : []

  const cityLabel =
    allCities.find((item) => item.id === typedProperty.city_id)?.name_en ||
    allCities.find((item) => item.id === typedProperty.city_id)?.name_ar ||
    '—'

  const universityLabel =
    allUniversities.find((item) => item.id === typedProperty.university_id)?.name_en ||
    allUniversities.find((item) => item.id === typedProperty.university_id)?.name_ar ||
    '—'

  const brokerLabel =
    allBrokers.find((item) => item.id === typedProperty.broker_id)?.full_name ||
    allBrokers.find((item) => item.id === typedProperty.broker_id)?.company_name ||
    '—'

  return (
    <>
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

      <main className="min-h-screen bg-[#f2f2f2] pb-28 text-slate-700 md:pb-0">
        <header className="sticky top-0 z-[110] bg-[#f5f7f9]">
          <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
            <BrandLogo />

            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/admin/properties/new"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Add Property
              </Link>

              <Link
                href="/admin/cities/new"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Add City
              </Link>

              <Link
                href="/admin/universities/new"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Add University
              </Link>

              <Link
                href="/admin/brokers/new"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Add Broker
              </Link>

              <Link
                href="/admin/properties/review"
                className="desktop-header-nav-button desktop-header-nav-button-active"
              >
                Review Queue
              </Link>

              <Link
                href="/admin/properties/admins"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Property Admins
              </Link>

              <AdminLogoutButton />
            </div>

            <div className="md:hidden">
              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <form action={approveAndSaveAllPropertyAction} encType="multipart/form-data">
          <input type="hidden" name="property_db_id" value={typedProperty.id} />
          <input type="hidden" name="property_route_id" value={typedProperty.property_id} />
          <input type="hidden" name="property_id" value={typedProperty.id} />

          <main className="px-4 py-8 md:px-6 md:py-10 xl:px-8">
            <div className="mx-auto w-full max-w-[1600px]">
              <div className="space-y-8">
                <section>
                  <ReviewStepHeader
                    title="Review Property"
                    subtitle=""
                  />

                  <div className="mt-6 rounded-md border border-[#e7e7e7] bg-white p-4 shadow-sm md:p-5">
                    <h2 className="mb-3 text-lg font-semibold text-[#1a1a1a]">
                      Review Summary
                    </h2>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <ReviewStatCard
                        label="Property Code"
                        value={typedProperty.property_id || '—'}
                      />
                      <ReviewStatCard
                        label="Title EN"
                        value={typedProperty.title_en || '—'}
                      />
                      <ReviewStatCard label="City" value={cityLabel} />
                      <ReviewStatCard label="University" value={universityLabel} />
                      <ReviewStatCard label="Broker" value={brokerLabel} />
                      <ReviewStatCard
                        label="Admin Status"
                        value={getStatusLabel(typedProperty.admin_status)}
                      />
                      <ReviewStatCard
                        label="Availability"
                        value={getStatusLabel(typedProperty.availability_status)}
                      />
                      <ReviewStatCard
                        label="Rental Duration"
                        value={getStatusLabel(typedProperty.rental_duration)}
                      />
                      <ReviewStatCard
                        label="Price"
                        value={formatPrice(typedProperty.price_egp)}
                      />
                      <ReviewStatCard
                        label="Bedrooms"
                        value={String(typedProperty.bedrooms_count ?? 0)}
                      />
                      <ReviewStatCard
                        label="Bathrooms"
                        value={String(typedProperty.bathrooms_count ?? 0)}
                      />
                      <ReviewStatCard
                        label="Beds"
                        value={String(typedProperty.beds_count ?? 0)}
                      />
                      <ReviewStatCard
                        label="Guests"
                        value={String(typedProperty.guests_count ?? 0)}
                      />
                      <ReviewStatCard
                        label="Gender"
                        value={getStatusLabel(typedProperty.gender)}
                      />
                      <ReviewStatCard
                        label="Smoking Policy"
                        value={getStatusLabel(typedProperty.smoking_policy)}
                      />
                      <ReviewStatCard
                        label="Images"
                        value={String(sortedPropertyImages.length)}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <ReviewStepHeader
                    title="Photos"
                    subtitle=""
                  />

                  <div className="mt-6">
                    <ReviewSection title="Property Gallery">
                      <PropertyGalleryEditor
                        initialImages={sortedPropertyImages}
                        saveButtonClass={hiddenSaveButtonClass}
                      />
                    </ReviewSection>
                  </div>
                </section>

                <section>
                  <ReviewStepHeader
                    title="Basic Info"
                    subtitle=""
                  />

                  <div className="mt-6 space-y-6">
                    <ReviewSection title="Basic Property Info">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <Input
                            label="Title EN"
                            name="title_en"
                            defaultValue={typedProperty.title_en}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Input
                            label="Title AR"
                            name="title_ar"
                            defaultValue={typedProperty.title_ar}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <TextArea
                            label="Description EN"
                            name="description_en"
                            rows={4}
                            defaultValue={typedProperty.description_en}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <TextArea
                            label="Description AR"
                            name="description_ar"
                            rows={4}
                            defaultValue={typedProperty.description_ar}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Input
                            label="Address EN"
                            name="address_en"
                            defaultValue={typedProperty.address_en}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Input
                            label="Address AR"
                            name="address_ar"
                            defaultValue={typedProperty.address_ar}
                          />
                        </div>
                      </div>
                    </ReviewSection>

                    <ReviewSection title="Location & Broker">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <Select
                            label="City"
                            name="city_id"
                            defaultValue={typedProperty.city_id}
                            options={allCities.map((item) => ({
                              value: item.id,
                              label: item.name_en || item.name_ar || item.id,
                            }))}
                          />
                        </div>

                        <div>
                          <Select
                            label="University"
                            name="university_id"
                            defaultValue={typedProperty.university_id}
                            options={allUniversities.map((item) => ({
                              value: item.id,
                              label: item.name_en || item.name_ar || item.id,
                            }))}
                          />
                        </div>

                        <div>
                          <Select
                            label="Broker"
                            name="broker_id"
                            defaultValue={typedProperty.broker_id}
                            options={allBrokers.map((item) => ({
                              value: item.id,
                              label: item.full_name || item.company_name || item.id,
                            }))}
                          />
                        </div>

                        <div>
                          <Select
                            label="Gender"
                            name="gender"
                            defaultValue={typedProperty.gender}
                            options={[
                              { value: 'boys', label: 'Boys' },
                              { value: 'girls', label: 'Girls' },
                            ]}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Select
                            label="Rental Duration"
                            name="rental_duration"
                            defaultValue={typedProperty.rental_duration}
                            options={[
                              { value: 'monthly', label: 'Monthly' },
                              { value: 'daily', label: 'Daily' },
                            ]}
                          />
                        </div>
                      </div>
                    </ReviewSection>
                  </div>
                </section>

                <section>
                  <ReviewStepHeader
                    title="Property Details"
                    subtitle=""
                  />

                  <div className="mt-6">
                    <ReviewSection title="Property Details">
                      <div className="space-y-10">
                        <div>
                          <Input
                            label="Full Apartment Price (EGP)"
                            name="price_egp"
                            type="number"
                            defaultValue={typedProperty.price_egp}
                            placeholder="Example: 9000"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                          <Input
                            label="Bedrooms"
                            name="bedrooms_count"
                            type="number"
                            defaultValue={typedProperty.bedrooms_count}
                          />
                          <Input
                            label="Bathrooms"
                            name="bathrooms_count"
                            type="number"
                            defaultValue={typedProperty.bathrooms_count}
                          />
                          <Input
                            label="Beds"
                            name="beds_count"
                            type="number"
                            defaultValue={typedProperty.beds_count}
                          />
                          <Input
                            label="Guests"
                            name="guests_count"
                            type="number"
                            defaultValue={typedProperty.guests_count}
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <Select
                            label="Availability Status"
                            name="availability_status"
                            defaultValue={typedProperty.availability_status}
                            options={[
                              { value: 'available', label: 'Available' },
                              { value: 'reserved', label: 'Reserved' },
                            ]}
                          />
                          <Select
                            label="Smoking Policy"
                            name="smoking_policy"
                            defaultValue={typedProperty.smoking_policy}
                            options={[
                              { value: 'smoking_allowed', label: 'Smoking Allowed' },
                              { value: 'non_smoking', label: 'Non Smoking' },
                            ]}
                          />
                        </div>
                      </div>
                    </ReviewSection>
                  </div>
                </section>

                <section>
                  <ReviewStepHeader
                    title="Property Featured"
                    subtitle=""
                  />

                  <div className="mt-6 space-y-6">
                    <ReviewSection
                      title="Amenities"
                      subtitle=""
                    >
                      <CheckboxGroup
                        title="Select Amenities"
                        name="amenity_ids"
                        items={allAmenities.map((item) => ({
                          value: item.id,
                          label: item.name_en || item.name_ar || item.id,
                          iconUrl: item.icon_url,
                        }))}
                        selectedValues={amenityIds}
                      />
                    </ReviewSection>

                    <ReviewSection
                      title="Bills Included"
                      subtitle=""
                    >
                      <CheckboxGroup
                        title="Select Included Bills"
                        name="bill_type_ids"
                        items={allBillTypes.map((item) => ({
                          value: String(item.id),
                          label: item.name_en || item.name_ar || String(item.id),
                          iconUrl: item.icon_url,
                        }))}
                        selectedValues={billTypeIds}
                      />
                    </ReviewSection>
                  </div>
                </section>

                <section>
                  <ReviewStepHeader
                    title="Rooms & Pricing"
                    subtitle=""
                  />

                  <div className="mt-6">
                    <ReviewSection title="Room Types">
                      {roomTypes.length > 0 ? (
                        <div className="space-y-5">
                          {roomTypes.map((room, index) => (
                            <div
                              key={room.id}
                              className="rounded-md border border-[#e5e7eb] bg-white p-5 shadow-sm"
                            >
                              <input type="hidden" name="room_type_ids" value={room.id} />

                              <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-[22px] font-bold text-[#1a1a1a]">
                                      {room.name_en || room.name_ar || `Room ${index + 1}`}
                                    </h3>

                                    <StatusBadge
                                      label={getStatusLabel(room.room_type_code)}
                                      className="border-[#dbeafe] bg-[#f0f7ff] text-[#0f3f75]"
                                    />
                                  </div>

                                  <p className="mt-1 text-sm text-[#6b7280]">
                                    Current price: {formatPrice(room.price_egp)}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                  <Input
                                    label="Room Name EN"
                                    name={`room_name_en_${room.id}`}
                                    defaultValue={room.name_en}
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <Input
                                    label="Room Name AR"
                                    name={`room_name_ar_${room.id}`}
                                    defaultValue={room.name_ar}
                                  />
                                </div>

                                <div>
                                  <Select
                                    label="Room Type Code"
                                    name={`room_type_code_${room.id}`}
                                    defaultValue={room.room_type_code}
                                    options={[
                                      { value: 'single', label: 'Single' },
                                      { value: 'double', label: 'Double' },
                                      { value: 'triple', label: 'Triple' },
                                      { value: 'quad', label: 'Quad' },
                                      { value: 'custom', label: 'Custom' },
                                    ]}
                                  />
                                </div>

                                <div>
                                  <Select
                                    label="Rental Duration"
                                    name={`room_rental_duration_${room.id}`}
                                    defaultValue={room.rental_duration}
                                    options={[
                                      { value: 'monthly', label: 'Monthly' },
                                      { value: 'daily', label: 'Daily' },
                                    ]}
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <Input
                                    label="Price EGP"
                                    name={`room_price_egp_${room.id}`}
                                    type="number"
                                    defaultValue={room.price_egp}
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <TextArea
                                    label="English Description"
                                    name={`room_description_en_${room.id}`}
                                    rows={4}
                                    defaultValue={room.description_en}
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <TextArea
                                    label="Arabic Description"
                                    name={`room_description_ar_${room.id}`}
                                    rows={4}
                                    defaultValue={room.description_ar}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[#6b7280]">
                          No room types added for this property.
                        </p>
                      )}
                    </ReviewSection>
                  </div>
                </section>

                <section>
                  <ReviewStepHeader
                    title="Publish"
                    subtitle=""
                  />

                  <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm md:p-5">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Link
                        href="/admin/properties/review"
                        className="inline-flex h-[46px] items-center justify-center rounded-xl border border-[#d1d5db] bg-white px-5 text-sm font-medium text-[#1a1a1a] transition hover:bg-[#f9fafb]"
                      >
                        Back to Queue
                      </Link>

                      <button
                        type="submit"
                        className="inline-flex h-[46px] items-center justify-center rounded-xl bg-[#0071c2] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#005fa3]"
                      >
                        Approve &amp; Publish
                      </button>

                      <button
                        type="submit"
                        formAction={rejectPropertyAndBackAction}
                        className="inline-flex h-[46px] items-center justify-center rounded-xl border border-[#e0a8a8] bg-[#fff2f2] px-6 text-sm font-semibold text-[#b42318] transition hover:bg-[#ffe8e8]"
                      >
                        Reject Property
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </main>
        </form>

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-[640px] grid-cols-3 gap-2">
            <MobileBottomNavItem href="/admin/properties/new" label="Add Property" />
            <MobileBottomNavItem href="/admin/cities/new" label="Add City" />
            <MobileBottomNavItem href="/admin/universities/new" label="Add University" />
            <MobileBottomNavItem href="/admin/brokers/new" label="Add Broker" />
            <MobileBottomNavItem
              href="/admin/properties/review"
              label="Review Queue"
              isPrimary
            />
            <MobileBottomNavItem
              href="/admin/properties/admins"
              label="Property Admins"
            />
          </div>
        </nav>
      </main>
    </>
  )
}