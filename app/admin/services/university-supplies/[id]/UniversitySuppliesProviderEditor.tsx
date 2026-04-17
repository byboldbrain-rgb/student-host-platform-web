'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProviderInfoForm from './ProviderInfoForm'
import MenuBuilder from './MenuBuilder'
import DeliveryZonesEditor from './DeliveryZonesEditor'
import ImagesEditor from './ImagesEditor'

type ProviderBusinessHour = {
  id?: number
  provider_id?: number
  day_of_week: number
  is_open: boolean
  open_time?: string | null
  close_time?: string | null
}

type UniversitySuppliesProvider = {
  id: number
  category_id: string | number
  city_id?: string | null
  primary_university_id?: string | null
  name_en: string
  name_ar?: string | null
  slug?: string | null
  short_description_en?: string | null
  short_description_ar?: string | null
  full_description_en?: string | null
  full_description_ar?: string | null
  phone?: string | null
  email?: string | null
  website_url?: string | null
  address_line?: string | null
  google_maps_url?: string | null
  logo_url?: string | null
  cover_image_url?: string | null
  whatsapp_number?: string | null
  whatsapp_message_template?: string | null
  is_featured?: boolean | null
  is_active?: boolean | null
  discount_percentage?: number | null
  discount_title_en?: string | null
  discount_title_ar?: string | null
  is_manually_closed?: boolean | null
  manual_closed_note?: string | null
  manual_closed_at?: string | null
  manual_closed_by_admin_id?: string | null
  provider_business_hours?: ProviderBusinessHour[] | null
  service_categories?: {
    id?: string | number
    slug?: string | null
    name_en?: string | null
    name_ar?: string | null
  } | null
  service_provider_subcategories?: Array<{
    subcategory_id: string | number
    service_subcategories?: {
      id: string | number
      category_id: string | number
      slug?: string | null
      name_en?: string | null
      name_ar?: string | null
    } | null
  }> | null
  service_provider_universities?: Array<{
    university_id: string | number
  }> | null
}

type ServiceCategory = {
  id: string | number
  slug: string
  name_en: string
  name_ar?: string | null
}

type ServiceSubcategory = {
  id: string | number
  category_id: string | number
  slug: string
  name_en: string
  name_ar: string
  is_active?: boolean | null
}

type MenuCategory = {
  id: number
  restaurant_id: number
  name_en: string
  name_ar: string
  sort_order?: number | null
}

type MenuItemVariant = {
  id: number
  menu_item_id: number
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
  id: number
  restaurant_id: number
  menu_category_id: number
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

type ProviderDeliveryArea = {
  area_id: number
  city_id: string
  code: string
  name_en: string
  name_ar: string
  sort_order?: number | null
  is_active?: boolean
  provider_area_fee_id?: number | null
  provider_is_available: boolean
  delivery_fee: number
  estimated_delivery_minutes?: number | null
  minimum_order_amount?: number | null
  default_delivery_fee: number
  default_estimated_delivery_minutes?: number | null
  default_minimum_order_amount?: number | null
  is_overridden?: boolean
}

type ServiceAsset = {
  id: number
  provider_id: number
  asset_type: string
  title?: string | null
  file_url: string
  file_mime_type?: string | null
  sort_order?: number | null
  is_active?: boolean | null
}

type ProviderBusinessHourFormRow = {
  day_of_week: number
  is_open: boolean
  open_time: string
  close_time: string
}

type ProviderFormState = {
  category_id: string
  subcategory_ids: string[]
  university_ids: string[]
  name_en: string
  name_ar: string
  slug: string
  short_description_en: string
  short_description_ar: string
  full_description_en: string
  full_description_ar: string
  phone: string
  email: string
  website_url: string
  address_line: string
  google_maps_url: string
  logo_url: string
  cover_image_url: string
  whatsapp_number: string
  whatsapp_message_template: string
  city_id: string
  primary_university_id: string
  is_featured: boolean
  is_active: boolean
  discount_percentage: string
  discount_title_en: string
  discount_title_ar: string
  is_manually_closed: boolean
  manual_closed_note: string
  business_hours: ProviderBusinessHourFormRow[]
}

type StepKey = 'info' | 'menu' | 'zones' | 'images'

type DisplayStep = {
  id: number
  key: StepKey
  title: string
  description: string
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function buildDefaultBusinessHours(): ProviderBusinessHourFormRow[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day_of_week: day,
    is_open: true,
    open_time: '10:00',
    close_time: '22:00',
  }))
}

function normalizeBusinessHours(
  rows?: ProviderBusinessHour[] | null
): ProviderBusinessHourFormRow[] {
  const defaults = buildDefaultBusinessHours()

  if (!Array.isArray(rows) || rows.length === 0) {
    return defaults
  }

  const rowsMap = new Map<number, ProviderBusinessHourFormRow>()

  rows.forEach((row) => {
    const day = Number(row.day_of_week)

    if (Number.isNaN(day) || day < 0 || day > 6) return

    rowsMap.set(day, {
      day_of_week: day,
      is_open: row.is_open !== false,
      open_time: row.open_time || '10:00',
      close_time: row.close_time || '22:00',
    })
  })

  return defaults.map((defaultRow) => rowsMap.get(defaultRow.day_of_week) || defaultRow)
}

export default function UniversitySuppliesProviderEditor({
  provider,
  menuCategories,
  menuItems,
  deliveryAreas,
  assets,
  cities,
  universities,
  serviceCategories = [],
  serviceSubcategories = [],
}: {
  provider: UniversitySuppliesProvider
  menuCategories: MenuCategory[]
  menuItems: MenuItem[]
  deliveryAreas: ProviderDeliveryArea[]
  assets: ServiceAsset[]
  cities: any[]
  universities: any[]
  serviceCategories?: ServiceCategory[]
  serviceSubcategories?: ServiceSubcategory[]
}) {
  const router = useRouter()

  const safeServiceCategories = Array.isArray(serviceCategories) ? serviceCategories : []
  const safeServiceSubcategories = Array.isArray(serviceSubcategories)
    ? serviceSubcategories
    : []

  const universitySuppliesCategory = useMemo(() => {
    return (
      safeServiceCategories.find(
        (category) =>
          category.slug === 'university-supplies' ||
          category.slug === 'university_supplies' ||
          category.name_en?.toLowerCase() === 'university supplies'
      ) || null
    )
  }, [safeServiceCategories])

  const existingSubcategoryIds = (
    provider.service_provider_subcategories?.map((item) => String(item.subcategory_id)) || []
  ).filter(Boolean)

  const existingUniversityIds = Array.from(
    new Set(
      [
        ...(provider.service_provider_universities?.map((item) => String(item.university_id)) ||
          []),
        provider.primary_university_id ? String(provider.primary_university_id) : null,
      ].filter(Boolean) as string[]
    )
  )

  const [providerForm, setProviderForm] = useState<ProviderFormState>({
    category_id: universitySuppliesCategory
      ? String(universitySuppliesCategory.id)
      : String(provider.category_id || ''),
    subcategory_ids: existingSubcategoryIds,
    university_ids: existingUniversityIds,
    name_en: provider.name_en || '',
    name_ar: provider.name_ar || '',
    slug: provider.slug || '',
    short_description_en: provider.short_description_en || '',
    short_description_ar: provider.short_description_ar || '',
    full_description_en: provider.full_description_en || '',
    full_description_ar: provider.full_description_ar || '',
    phone: provider.phone || '',
    email: provider.email || '',
    website_url: provider.website_url || '',
    address_line: provider.address_line || '',
    google_maps_url: provider.google_maps_url || '',
    logo_url: provider.logo_url || '',
    cover_image_url: provider.cover_image_url || '',
    whatsapp_number: provider.whatsapp_number || '',
    whatsapp_message_template: provider.whatsapp_message_template || '',
    city_id: provider.city_id || '',
    primary_university_id:
      provider.primary_university_id || existingUniversityIds[0] || '',
    is_featured: Boolean(provider.is_featured),
    is_active: provider.is_active !== false,
    discount_percentage: provider.discount_percentage?.toString?.() || '',
    discount_title_en: provider.discount_title_en || '',
    discount_title_ar: provider.discount_title_ar || '',
    is_manually_closed: Boolean(provider.is_manually_closed),
    manual_closed_note: provider.manual_closed_note || '',
    business_hours: normalizeBusinessHours(provider.provider_business_hours),
  })

  const steps = useMemo<DisplayStep[]>(() => {
    return [
      {
        id: 1,
        key: 'info',
        title: 'Basic Info',
        description: '',
      },
      {
        id: 2,
        key: 'menu',
        title: 'Menu Builder',
        description: '',
      },
      {
        id: 3,
        key: 'zones',
        title: 'Delivery Zones',
        description: '',
      },
      {
        id: 4,
        key: 'images',
        title: 'Logo',
        description: '',
      },
    ]
  }, [])

  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [categories, setCategories] = useState<MenuCategory[]>(
    menuCategories.length
      ? menuCategories
      : [
          {
            id: Date.now(),
            restaurant_id: provider.id,
            name_en: '',
            name_ar: '',
            sort_order: 0,
          },
        ]
  )

  const [items, setItems] = useState<MenuItem[]>(menuItems.length ? menuItems : [])
  const [itemImageFiles, setItemImageFiles] = useState<Record<number, File | null>>({})

  const [deliveryAreasState, setDeliveryAreasState] = useState<ProviderDeliveryArea[]>(
    Array.isArray(deliveryAreas) ? deliveryAreas : []
  )

  const [gallery, setGallery] = useState<ServiceAsset[]>(
    assets.filter((item) => item.asset_type === 'gallery')
  )

  useEffect(() => {
    if (currentStep > steps.length - 1) {
      setCurrentStep(steps.length - 1)
    }
  }, [steps.length, currentStep])

  const current = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
      setMessage('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      setMessage('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToStep = (index: number) => {
    setCurrentStep(index)
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const validateAll = () => {
    if (!providerForm.category_id) {
      return 'Category is required.'
    }

    if (providerForm.subcategory_ids.length === 0) {
      return 'Please select at least one business subcategory.'
    }

    if (!providerForm.name_en.trim() && !providerForm.name_ar.trim()) {
      return 'Provider must have at least an English or Arabic name.'
    }

    if (providerForm.business_hours.length !== 7) {
      return 'Business hours must include all 7 days.'
    }

    for (const row of providerForm.business_hours) {
      if (row.is_open) {
        if (!row.open_time || !row.close_time) {
          return 'Every open day must have both open and close time.'
        }
      }
    }

    if (categories.length === 0) {
      return 'Add at least one category before saving.'
    }

    for (const category of categories) {
      if (!category.name_en?.trim() && !category.name_ar?.trim()) {
        return 'Every category must have at least an English or Arabic name.'
      }
    }

    const normalizedCategoryArNames = categories
      .map((category) => category.name_ar?.trim().toLowerCase())
      .filter(Boolean)

    if (new Set(normalizedCategoryArNames).size !== normalizedCategoryArNames.length) {
      return 'Arabic category names must be unique.'
    }

    for (const item of items) {
      if (!item.menu_category_id) {
        return 'Every menu item must belong to a category.'
      }

      const categoryExists = categories.some(
        (category) => Number(category.id) === Number(item.menu_category_id)
      )

      if (!categoryExists) {
        return 'One or more menu items are linked to a deleted category.'
      }

      if (!item.name_en?.trim() && !item.name_ar?.trim()) {
        return 'Every menu item must have at least an English or Arabic name.'
      }

      if (Number(item.price || 0) < 0) {
        return 'Item base price cannot be negative.'
      }

      for (const variant of item.restaurant_menu_item_variants || []) {
        if (!variant.name_en?.trim() && !variant.name_ar?.trim()) {
          return 'Every variant must have at least an English or Arabic name.'
        }

        if (Number(variant.price || 0) < 0) {
          return 'Variant price cannot be negative.'
        }
      }
    }

    return null
  }

  const parseSafeJson = async (response: Response) => {
    const text = await response.text()

    if (!text) return null

    try {
      return JSON.parse(text)
    } catch {
      return { error: text }
    }
  }

  const buildMenuFormData = () => {
    const formData = new FormData()

    const sanitizedCategories = categories.map((category, index) => ({
      ...category,
      name_en: category.name_en?.trim() || '',
      name_ar: category.name_ar?.trim() || '',
      sort_order: index,
    }))

    const sanitizedItems = items.map((item, index) => ({
      ...item,
      name_en: item.name_en?.trim() || '',
      name_ar: item.name_ar?.trim() || '',
      description_en: item.description_en?.trim() || '',
      description_ar: item.description_ar?.trim() || '',
      image_url:
        typeof item.image_url === 'string' && !item.image_url.startsWith('blob:')
          ? item.image_url.trim()
          : '',
      price: Number(item.price || 0),
      sort_order: index,
      restaurant_menu_item_variants: (item.restaurant_menu_item_variants || []).map(
        (variant, variantIndex) => ({
          ...variant,
          name_en: variant.name_en?.trim() || '',
          name_ar: variant.name_ar?.trim() || '',
          sku: variant.sku?.trim() || '',
          price: Number(variant.price || 0),
          compare_at_price:
            variant.compare_at_price != null
              ? Number(variant.compare_at_price)
              : null,
          sort_order: variantIndex,
        })
      ),
    }))

    formData.append('categories', JSON.stringify(sanitizedCategories))
    formData.append('items', JSON.stringify(sanitizedItems))

    Object.entries(itemImageFiles).forEach(([itemId, file]) => {
      if (file) {
        formData.append(`item_image_${itemId}`, file)
      }
    })

    return formData
  }

  const handleSaveAll = async () => {
    try {
      setSaving(true)
      setMessage('')

      const validationError = validateAll()
      if (validationError) {
        setMessage(validationError)
        setSaving(false)
        return
      }

      const businessHoursPayload = providerForm.business_hours.map((row) => ({
        day_of_week: Number(row.day_of_week),
        is_open: Boolean(row.is_open),
        open_time: row.is_open ? row.open_time || null : null,
        close_time: row.is_open ? row.close_time || null : null,
      }))

      const providerRes = await fetch(
        `/api/admin/university-supplies/providers/${provider.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...providerForm,
            category_id: providerForm.category_id || null,
            subcategory_ids: providerForm.subcategory_ids,
            university_ids: providerForm.university_ids,
            primary_university_id: providerForm.primary_university_id || null,
            city_id: providerForm.city_id || null,
            discount_percentage: providerForm.discount_percentage
              ? Number(providerForm.discount_percentage)
              : null,
            is_manually_closed: providerForm.is_manually_closed,
            manual_closed_note: providerForm.manual_closed_note.trim() || null,
            business_hours: businessHoursPayload,
          }),
        }
      )

      const providerJson = await parseSafeJson(providerRes)
      if (!providerRes.ok) {
        throw new Error(providerJson?.error || 'Failed to save provider info')
      }

      const menuFormData = buildMenuFormData()

      const menuRes = await fetch(
        `/api/admin/university-supplies/providers/${provider.id}/menu`,
        {
          method: 'PUT',
          body: menuFormData,
        }
      )

      const menuJson = await parseSafeJson(menuRes)
      if (!menuRes.ok) {
        throw new Error(menuJson?.error || 'Failed to save menu')
      }

      const areasPayload = deliveryAreasState.map((area) => ({
        area_id: area.area_id,
        is_available: Boolean(area.provider_is_available),
        delivery_fee: area.provider_is_available ? Number(area.delivery_fee || 0) : 0,
        estimated_delivery_minutes: area.provider_is_available
          ? area.estimated_delivery_minutes ?? null
          : null,
        minimum_order_amount: area.provider_is_available
          ? area.minimum_order_amount ?? null
          : null,
      }))

      const zonesRes = await fetch(
        `/api/admin/university-supplies/providers/${provider.id}/zones`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ areas: areasPayload }),
        }
      )

      const zonesJson = await parseSafeJson(zonesRes)
      if (!zonesRes.ok) {
        throw new Error(zonesJson?.error || 'Failed to save delivery areas')
      }

      const assetsRes = await fetch(
        `/api/admin/university-supplies/providers/${provider.id}/assets`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logo_url: providerForm.logo_url,
            cover_image_url: providerForm.cover_image_url,
            assets: gallery.map((item, index) => ({
              ...item,
              asset_type: 'gallery',
              sort_order: index,
            })),
          }),
        }
      )

      const assetsJson = await parseSafeJson(assetsRes)
      if (!assetsRes.ok) {
        throw new Error(assetsJson?.error || 'Failed to save images')
      }

      setMessage('All changes saved successfully.')
      setItemImageFiles({})
      router.refresh()
    } catch (error: any) {
      setMessage(error?.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const getStepStatus = (index: number) => {
    if (index < currentStep) return 'done'
    if (index === currentStep) return 'active'
    return 'upcoming'
  }

  const renderStepContent = () => {
    if (current.key === 'info') {
      return (
        <ProviderInfoForm
          form={providerForm}
          setForm={setProviderForm}
          cities={cities}
          universities={universities}
          serviceCategories={safeServiceCategories}
          serviceSubcategories={safeServiceSubcategories}
        />
      )
    }

    if (current.key === 'menu') {
      return (
        <MenuBuilder
          providerId={provider.id}
          categories={categories}
          setCategories={setCategories}
          items={items}
          setItems={setItems}
          itemImageFiles={itemImageFiles}
          setItemImageFiles={setItemImageFiles}
        />
      )
    }

    if (current.key === 'zones') {
      return (
        <DeliveryZonesEditor
          cityId={providerForm.city_id}
          areas={deliveryAreasState}
          setAreas={setDeliveryAreasState}
        />
      )
    }

    if (current.key === 'images') {
      return (
        <ImagesEditor
          providerId={provider.id}
          logoUrl={providerForm.logo_url}
          setLogoUrl={(value: string) =>
            setProviderForm((prev) => ({ ...prev, logo_url: value }))
          }
          coverUrl={providerForm.cover_image_url}
          setCoverUrl={(value: string) =>
            setProviderForm((prev) => ({ ...prev, cover_image_url: value }))
          }
          gallery={gallery}
          setGallery={setGallery}
        />
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 rounded-[28px] border border-[#e6ebf2] bg-white px-6 py-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[#667085]">
                <span>University Supplies</span>
                <span>•</span>
                <span>Edit Provider</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-[28px] font-semibold tracking-[-0.03em] text-[#101828] md:text-[36px]">
                  {providerForm.name_en || providerForm.name_ar || 'Unnamed Provider'}
                </h1>

                {providerForm.is_manually_closed ? (
                  <span className="inline-flex items-center rounded-full border border-[#fecaca] bg-[#fef2f2] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#b42318]">
                    Closed Manually
                  </span>
                ) : null}
              </div>

              {providerForm.is_manually_closed && providerForm.manual_closed_note?.trim() ? (
                <p className="mt-3 max-w-2xl text-sm text-[#667085]">
                  {providerForm.manual_closed_note.trim()}
                </p>
              ) : null}
            </div>

            <div className="w-full max-w-[320px] rounded-2xl border border-[#e6ebf2] bg-[#f8fafc] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-[#344054]">Completion</span>
                <span className="text-sm font-semibold text-[#101828]">
                  {Math.round(progress)}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[#e4e7ec]">
                <div
                  className="h-full rounded-full bg-[#175cd3] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-[#667085]">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[28px] border border-[#e6ebf2] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] lg:sticky lg:top-6">
            <div className="mb-4 px-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
                Setup Flow
              </p>
            </div>

            <div className="space-y-2">
              {steps.map((step, index) => {
                const status = getStepStatus(index)

                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => goToStep(index)}
                    className={cn(
                      'w-full rounded-2xl border px-4 py-4 text-left transition-all',
                      status === 'active' &&
                        'border-[#bfd6ff] bg-[#f5f9ff] shadow-[inset_0_0_0_1px_rgba(23,92,211,0.04)]',
                      status === 'done' &&
                        'border-[#e4e7ec] bg-white hover:border-[#d0d5dd] hover:bg-[#f9fafb]',
                      status === 'upcoming' &&
                        'border-transparent bg-white hover:border-[#eaecf0] hover:bg-[#f9fafb]'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                          status === 'active' && 'bg-[#175cd3] text-white',
                          status === 'done' && 'bg-[#ecfdf3] text-[#027a48]',
                          status === 'upcoming' && 'bg-[#f2f4f7] text-[#667085]'
                        )}
                      >
                        {status === 'done' ? '✓' : index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-[#101828]">
                            {step.title}
                          </p>
                          {status === 'active' ? (
                            <span className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#175cd3]">
                              Current
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-[#667085]">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium text-[#175cd3]">
                  Step {currentStep + 1}
                </p>
                <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.03em] text-[#101828]">
                  {current.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#667085]">
                  {current.description}
                </p>
              </div>
            </div>

            <section className="rounded-[28px] border border-[#e6ebf2] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-6">
              {renderStepContent()}
            </section>

            {message ? (
              <div
                className={cn(
                  'mt-5 rounded-2xl border px-4 py-3 text-sm',
                  message.toLowerCase().includes('success') ||
                    message.toLowerCase().includes('saved')
                    ? 'border-[#abefc6] bg-[#ecfdf3] text-[#067647]'
                    : 'border-[#fedf89] bg-[#fffaeb] text-[#b54708]'
                )}
              >
                {message}
              </div>
            ) : null}

            <div className="mt-6 rounded-[24px] border border-[#e6ebf2] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={currentStep === 0 || saving}
                  className="inline-flex items-center justify-center rounded-xl border border-[#d0d5dd] bg-white px-5 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Back
                </button>

                <div className="text-center text-sm text-[#667085]">
                  {message
                    ? message
                    : currentStep === steps.length - 1
                    ? 'Review all updates, then save the provider.'
                    : `Next step: ${steps[currentStep + 1]?.title}`}
                </div>

                {currentStep === steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-xl bg-[#175cd3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1849a9] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Provider'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-xl bg-[#175cd3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1849a9] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}