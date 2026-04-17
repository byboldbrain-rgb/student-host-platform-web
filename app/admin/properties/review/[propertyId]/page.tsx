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

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-[20px] border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_14px_34px_rgba(37,99,235,0.28)]'

const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[20px] border border-[#c7c7c7] bg-white px-5 py-3 text-sm font-semibold text-[#1f2937] shadow-[0_8px_22px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[#b8b8b8] hover:bg-[#f7f7f7] hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]'

const backButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[20px] border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_14px_34px_rgba(37,99,235,0.28)]'

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
  is_active?: boolean | null
  sort_order?: number | null
}

type Facility = {
  id: number
  name_en?: string | null
  name_ar?: string | null
  is_active?: boolean | null
  sort_order?: number | null
}

type BillType = {
  id: number
  name_en?: string | null
  name_ar?: string | null
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

  const selectedFacilityIds = formData
    .getAll('facility_ids')
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))

  const { error: deleteFacilitiesError } = await supabase
    .from('property_facilities')
    .delete()
    .eq('property_id_ref', propertyDbId)

  if (deleteFacilitiesError) {
    throw new Error(`Failed to reset facilities: ${deleteFacilitiesError.message}`)
  }

  if (selectedFacilityIds.length > 0) {
    const facilityRows = selectedFacilityIds.map((facilityId) => ({
      property_id_ref: propertyDbId,
      facility_id: facilityId,
    }))

    const { error: insertFacilitiesError } = await supabase
      .from('property_facilities')
      .insert(facilityRows)

    if (insertFacilitiesError) {
      throw new Error(`Failed to save facilities: ${insertFacilitiesError.message}`)
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

function StatusBadge({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  )
}

function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-[22px] font-semibold tracking-tight text-[#111827]">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-1 text-sm leading-6 text-gray-500">{subtitle}</p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  )
}

function MetricCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[26px] border border-gray-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-[#111827]">
        {value}
      </div>
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
      <div className="mb-2 text-sm font-medium text-[#111827]">{label}</div>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        className="w-full rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
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
      <div className="mb-2 text-sm font-medium text-[#111827]">{label}</div>
      <select
        name={name}
        defaultValue={defaultValue === null || defaultValue === undefined ? '' : String(defaultValue)}
        className="w-full rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
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
      <div className="mb-2 text-sm font-medium text-[#111827]">{label}</div>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ''}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
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
  items: { value: string; label: string }[]
  selectedValues: string[]
}) {
  return (
    <div>
      <div className="mb-3 text-sm font-medium text-[#111827]">{title}</div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <label
            key={`${name}-${item.value}`}
            className="flex items-center gap-3 rounded-[18px] border border-gray-200 bg-[#fafafa] px-4 py-3 text-sm text-[#111827]"
          >
            <input
              type="checkbox"
              name={name}
              value={item.value}
              defaultChecked={selectedValues.includes(item.value)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>{item.label}</span>
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
    propertyFacilitiesRes,
    propertyBillsRes,
    roomTypesRes,
    allCitiesRes,
    allUniversitiesRes,
    allBrokersRes,
    allAmenitiesRes,
    allFacilitiesRes,
    allBillTypesRes,
  ] = await Promise.all([
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
      .select('id, name_en, name_ar, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name_en', { ascending: true }),

    supabase
      .from('facilities')
      .select('id, name_en, name_ar, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name_en', { ascending: true }),

    supabase
      .from('bill_types')
      .select('id, name_en, name_ar, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name_en', { ascending: true }),
  ])

  const roomTypes = (roomTypesRes?.data || []) as RoomType[]
  const allCities = (allCitiesRes?.data || []) as City[]
  const allUniversities = (allUniversitiesRes?.data || []) as University[]
  const allBrokers = (allBrokersRes?.data || []) as Broker[]
  const allAmenities = (allAmenitiesRes?.data || []) as Amenity[]
  const allFacilities = (allFacilitiesRes?.data || []) as Facility[]
  const allBillTypes = (allBillTypesRes?.data || []) as BillType[]

  const amenityIds = (propertyAmenitiesRes.data || [])
    .map((item: { amenity_id: string }) => item.amenity_id)
    .filter(Boolean)

  const facilityIds = (propertyFacilitiesRes.data || [])
    .map((item: { facility_id: number }) => String(item.facility_id))
    .filter(Boolean)

  const billTypeIds = (propertyBillsRes.data || [])
    .map((item: { bill_type_id: number }) => String(item.bill_type_id))
    .filter(Boolean)

  const sortedPropertyImages = Array.isArray(typedProperty.property_images)
    ? [...typedProperty.property_images].sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
      )
    : []

  return (
    <main className="min-h-screen bg-[#fbfbfb] text-gray-700">
      <header className="sticky top-0 z-40 border-b border-[#f5f7f9] bg-[#f5f7f9]">
        <div className="mx-auto flex min-h-[104px] max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/properties">
              <img
                src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
                alt="Navienty"
                className="w-[130px]"
              />
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/admin/properties/new" className={primaryButtonClass}>
              Add Property
            </Link>

            <Link href="/admin/properties/review" className={secondaryButtonClass}>
              Review Queue
            </Link>

            <Link href="/admin/properties/admins" className={secondaryButtonClass}>
              Property Admins
            </Link>

            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8 lg:px-8">
        <form action={approveAndSaveAllPropertyAction} encType="multipart/form-data">
          <input type="hidden" name="property_db_id" value={typedProperty.id} />
          <input type="hidden" name="property_route_id" value={typedProperty.property_id} />
          <input type="hidden" name="property_id" value={typedProperty.id} />

          <section className="overflow-hidden rounded-[34px] border border-gray-200 bg-gradient-to-br from-white via-white to-blue-50/50 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-7">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-4xl self-start">
                <Link href="/admin/properties/review" className={backButtonClass}>
                  <span>Back to Review Queue</span>
                </Link>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#111827] md:text-[42px]">
                  Property Preview &amp; Edit
                </h1>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:w-[560px] xl:self-start">
                <MetricCard
                  label="Property ID"
                  value={typedProperty.property_id || '—'}
                />
                <MetricCard
                  label="Current Price"
                  value={formatPrice(typedProperty.price_egp)}
                />
              </div>
            </div>
          </section>

          <div className="mt-8 space-y-6">
            <SectionCard title="Property Gallery">
              <PropertyGalleryEditor
                initialImages={sortedPropertyImages}
                saveButtonClass={hiddenSaveButtonClass}
              />
            </SectionCard>

            <SectionCard
              title="Basic Property Info"
            >
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Input label="Title EN" name="title_en" defaultValue={typedProperty.title_en} />
                  <Input label="Title AR" name="title_ar" defaultValue={typedProperty.title_ar} />
                  <Input
                    label="Price EGP"
                    name="price_egp"
                    type="number"
                    defaultValue={typedProperty.price_egp}
                  />
                  <Select
                    label="Rental Duration"
                    name="rental_duration"
                    defaultValue={typedProperty.rental_duration}
                    options={[
                      { value: 'daily', label: 'Daily' },
                      { value: 'monthly', label: 'Monthly' },
                    ]}
                  />
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
                    label="Admin Status"
                    name="admin_status"
                    defaultValue={typedProperty.admin_status}
                    options={[
                      { value: 'draft', label: 'Draft' },
                      { value: 'pending_review', label: 'Pending Review' },
                      { value: 'published', label: 'Published' },
                      { value: 'rejected', label: 'Rejected' },
                      { value: 'archived', label: 'Archived' },
                    ]}
                  />
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
                  <Select
                    label="Gender"
                    name="gender"
                    defaultValue={typedProperty.gender}
                    options={[
                      { value: 'boys', label: 'Boys' },
                      { value: 'girls', label: 'Girls' },
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
            </SectionCard>

            <SectionCard
              title="Descriptions"
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <TextArea
                  label="English Description"
                  name="description_en"
                  rows={8}
                  defaultValue={typedProperty.description_en}
                />
                <TextArea
                  label="Arabic Description"
                  name="description_ar"
                  rows={8}
                  defaultValue={typedProperty.description_ar}
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Location & Broker Details"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Address EN"
                  name="address_en"
                  defaultValue={typedProperty.address_en}
                />
                <Input
                  label="Address AR"
                  name="address_ar"
                  defaultValue={typedProperty.address_ar}
                />
                <Select
                  label="City"
                  name="city_id"
                  defaultValue={typedProperty.city_id}
                  options={allCities.map((item) => ({
                    value: item.id,
                    label: item.name_en || item.name_ar || item.id,
                  }))}
                />
                <Select
                  label="University"
                  name="university_id"
                  defaultValue={typedProperty.university_id}
                  options={allUniversities.map((item) => ({
                    value: item.id,
                    label: item.name_en || item.name_ar || item.id,
                  }))}
                />
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
            </SectionCard>

            <SectionCard
              title="Amenities"
            >
              <CheckboxGroup
                title="Select Amenities"
                name="amenity_ids"
                items={allAmenities.map((item) => ({
                  value: item.id,
                  label: item.name_en || item.name_ar || item.id,
                }))}
                selectedValues={amenityIds}
              />
            </SectionCard>

            <SectionCard
              title="Facilities"
            >
              <CheckboxGroup
                title="Select Facilities"
                name="facility_ids"
                items={allFacilities.map((item) => ({
                  value: String(item.id),
                  label: item.name_en || item.name_ar || String(item.id),
                }))}
                selectedValues={facilityIds}
              />
            </SectionCard>

            <SectionCard
              title="Bills Included"
            >
              <CheckboxGroup
                title="Select Included Bills"
                name="bill_type_ids"
                items={allBillTypes.map((item) => ({
                  value: String(item.id),
                  label: item.name_en || item.name_ar || String(item.id),
                }))}
                selectedValues={billTypeIds}
              />
            </SectionCard>

            <SectionCard
              title="Room Types"
            >
              {roomTypes.length > 0 ? (
                <div className="space-y-6">
                  {roomTypes.map((room, index) => (
                    <div
                      key={room.id}
                      className="rounded-[26px] border border-gray-200 bg-[#fafafa] p-5"
                    >
                      <input type="hidden" name="room_type_ids" value={room.id} />

                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-semibold text-[#111827]">
                              {room.name_en || room.name_ar || `Room ${index + 1}`}
                            </h4>

                            <StatusBadge
                              label={getStatusLabel(room.room_type_code)}
                              className="border-slate-200 bg-white text-slate-700"
                            />
                          </div>

                          <p className="mt-2 text-sm text-gray-500">
                            Current price: {formatPrice(room.price_egp)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Select
                          label="Room Type Code"
                          name={`room_type_code_${room.id}`}
                          defaultValue={room.room_type_code}
                          options={[
                            { value: 'single', label: 'Single' },
                            { value: 'double', label: 'Double' },
                            { value: 'triple', label: 'Triple' },
                          ]}
                        />
                        <Input
                          label="Room Name EN"
                          name={`room_name_en_${room.id}`}
                          defaultValue={room.name_en}
                        />
                        <Input
                          label="Room Name AR"
                          name={`room_name_ar_${room.id}`}
                          defaultValue={room.name_ar}
                        />
                        <Input
                          label="Price EGP"
                          name={`room_price_egp_${room.id}`}
                          type="number"
                          defaultValue={room.price_egp}
                        />
                        <Select
                          label="Rental Duration"
                          name={`room_rental_duration_${room.id}`}
                          defaultValue={room.rental_duration}
                          options={[
                            { value: 'daily', label: 'Daily' },
                            { value: 'monthly', label: 'Monthly' },
                          ]}
                        />
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <TextArea
                          label="English Description"
                          name={`room_description_en_${room.id}`}
                          rows={5}
                          defaultValue={room.description_en}
                        />
                        <TextArea
                          label="Arabic Description"
                          name={`room_description_ar_${room.id}`}
                          rows={5}
                          defaultValue={room.description_ar}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No room types added for this property.
                </p>
              )}
            </SectionCard>

            <section className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-[22px] font-semibold tracking-tight text-[#111827]">
                    Property Actions
                  </h3>
                  
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    className="inline-flex min-w-[220px] items-center justify-center rounded-[20px] border border-emerald-600 bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(5,150,105,0.18)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-emerald-700"
                  >
                    Approve &amp; Publish
                  </button>

                  <button
                    type="submit"
                    formAction={rejectPropertyAndBackAction}
                    className="inline-flex min-w-[220px] items-center justify-center rounded-[20px] border border-rose-600 bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(225,29,72,0.18)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-rose-700"
                  >
                    Reject Property
                  </button>
                </div>
              </div>
            </section>
          </div>
        </form>
      </div>
    </main>
  )
}