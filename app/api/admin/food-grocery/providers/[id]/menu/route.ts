import { NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { getCurrentAdminContext, isFoodSuperAdmin } from '@/src/lib/admin-auth'

const MENU_IMAGES_BUCKET = 'food-grocery'

function safeFileName(fileName: string) {
  return fileName
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function parseRequestBody(req: Request) {
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()

    const categoriesRaw = formData.get('categories')
    const itemsRaw = formData.get('items')

    const categories = categoriesRaw ? JSON.parse(String(categoriesRaw)) : []
    const items = itemsRaw ? JSON.parse(String(itemsRaw)) : []

    return {
      type: 'form-data' as const,
      categories: Array.isArray(categories) ? categories : [],
      items: Array.isArray(items) ? items : [],
      formData,
    }
  }

  const body = await req.json()

  return {
    type: 'json' as const,
    categories: Array.isArray(body?.categories) ? body.categories : [],
    items: Array.isArray(body?.items) ? body.items : [],
    formData: null,
  }
}

async function uploadItemImageIfExists({
  supabase,
  formData,
  providerId,
  item,
}: {
  supabase: ReturnType<typeof createAdminClient>
  formData: FormData | null
  providerId: number
  item: any
}) {
  if (!formData) {
    return item?.image_url || null
  }

  const possibleKeys = [
    `item_image_${item?.id}`,
    `image_${item?.id}`,
    `itemImage_${item?.id}`,
  ]

  let file: File | null = null

  for (const key of possibleKeys) {
    const value = formData.get(key)
    if (value instanceof File && value.size > 0) {
      file = value
      break
    }
  }

  if (!file) {
    return item?.image_url || null
  }

  const fileExt = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
  const cleanedName = safeFileName(file.name.replace(/\.[^/.]+$/, ''))
  const filePath = `providers/${providerId}/menu/${Date.now()}-${item?.id}-${cleanedName}.${fileExt}`

  const arrayBuffer = await file.arrayBuffer()
  const fileBuffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from(MENU_IMAGES_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data: publicUrlData } = supabase.storage
    .from(MENU_IMAGES_BUCKET)
    .getPublicUrl(filePath)

  return publicUrlData?.publicUrl || null
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminContext = await getCurrentAdminContext()

    if (!adminContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminContext.admin
    const canEdit =
      isFoodSuperAdmin(admin) ||
      admin.role === 'food_editor' ||
      admin.role === 'food_adder'

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const providerId = Number(id)

    if (!providerId || Number.isNaN(providerId)) {
      return NextResponse.json({ error: 'Invalid provider id' }, { status: 400 })
    }

    const parsed = await parseRequestBody(req)
    const categories = parsed.categories
    const items = parsed.items
    const formData = parsed.formData

    const supabase = createAdminClient()

    const { data: existingItems, error: existingItemsError } = await supabase
      .from('restaurant_menu_items')
      .select('id, image_url')
      .eq('restaurant_id', providerId)

    if (existingItemsError) {
      return NextResponse.json({ error: existingItemsError.message }, { status: 500 })
    }

    const existingItemIds =
      existingItems?.map((item) => Number(item.id)).filter(Boolean) ?? []

    if (existingItemIds.length > 0) {
      const { error: deleteVariantsError } = await supabase
        .from('restaurant_menu_item_variants')
        .delete()
        .in('menu_item_id', existingItemIds)

      if (deleteVariantsError) {
        return NextResponse.json({ error: deleteVariantsError.message }, { status: 500 })
      }
    }

    const { error: deleteItemsError } = await supabase
      .from('restaurant_menu_items')
      .delete()
      .eq('restaurant_id', providerId)

    if (deleteItemsError) {
      return NextResponse.json({ error: deleteItemsError.message }, { status: 500 })
    }

    const { error: deleteCategoriesError } = await supabase
      .from('restaurant_menu_categories')
      .delete()
      .eq('restaurant_id', providerId)

    if (deleteCategoriesError) {
      return NextResponse.json({ error: deleteCategoriesError.message }, { status: 500 })
    }

    const insertedCategoriesMap = new Map<number, number>()

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i]

      const { data: insertedCategory, error } = await supabase
        .from('restaurant_menu_categories')
        .insert({
          restaurant_id: providerId,
          name_en: category?.name_en || '',
          name_ar: category?.name_ar || '',
          sort_order: i,
        })
        .select('id')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      insertedCategoriesMap.set(Number(category.id), Number(insertedCategory.id))
    }

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const item = items[itemIndex]
      const mappedCategoryId = insertedCategoriesMap.get(Number(item.menu_category_id))

      if (!mappedCategoryId) continue

      let finalImageUrl: string | null = item?.image_url || null

      try {
        finalImageUrl = await uploadItemImageIfExists({
          supabase,
          formData,
          providerId,
          item,
        })
      } catch (uploadError: any) {
        return NextResponse.json(
          { error: uploadError?.message || 'Failed to upload item image' },
          { status: 500 }
        )
      }

      const { data: insertedItem, error: itemError } = await supabase
        .from('restaurant_menu_items')
        .insert({
          restaurant_id: providerId,
          menu_category_id: mappedCategoryId,
          name_en: item?.name_en || '',
          name_ar: item?.name_ar || null,
          description_en: item?.description_en || null,
          description_ar: item?.description_ar || null,
          price: Number(item?.price || 0),
          image_url: finalImageUrl,
          is_available: item?.is_available !== false,
          sort_order: itemIndex,
        })
        .select('id')
        .single()

      if (itemError) {
        return NextResponse.json({ error: itemError.message }, { status: 500 })
      }

      const variants = Array.isArray(item?.restaurant_menu_item_variants)
        ? item.restaurant_menu_item_variants
        : []

      if (variants.length > 0) {
        const payload = variants.map((variant: any, variantIndex: number) => ({
          menu_item_id: insertedItem.id,
          name_en: variant?.name_en || '',
          name_ar: variant?.name_ar || null,
          price: Number(variant?.price || 0),
          compare_at_price:
            variant?.compare_at_price != null
              ? Number(variant.compare_at_price)
              : null,
          sku: variant?.sku || null,
          is_default: variant?.is_default === true,
          is_available: variant?.is_available !== false,
          sort_order: variantIndex,
        }))

        const { error: variantsError } = await supabase
          .from('restaurant_menu_item_variants')
          .insert(payload)

        if (variantsError) {
          return NextResponse.json({ error: variantsError.message }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}