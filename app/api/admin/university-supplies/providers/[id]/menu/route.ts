import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

type MenuCategoryPayload = {
  id?: number
  restaurant_id?: number
  name_en: string
  name_ar: string
  sort_order?: number | null
}

type MenuItemVariantPayload = {
  id?: number
  menu_item_id?: number
  name_en: string
  name_ar?: string | null
  price?: number | null
  compare_at_price?: number | null
  sku?: string | null
  is_default?: boolean | null
  is_available?: boolean | null
  sort_order?: number | null
}

type MenuItemPayload = {
  id?: number
  restaurant_id?: number
  menu_category_id: number
  name_en: string
  name_ar?: string | null
  description_en?: string | null
  description_ar?: string | null
  price?: number | null
  image_url?: string | null
  is_available?: boolean | null
  sort_order?: number | null
  restaurant_menu_item_variants?: MenuItemVariantPayload[] | null
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const providerId = Number(params.id)

    if (!providerId) {
      return NextResponse.json({ error: 'Invalid provider id' }, { status: 400 })
    }

    const formData = await req.formData()

    const rawCategories = formData.get('categories')
    const rawItems = formData.get('items')

    const categories: MenuCategoryPayload[] = rawCategories
      ? JSON.parse(String(rawCategories))
      : []

    const items: MenuItemPayload[] = rawItems
      ? JSON.parse(String(rawItems))
      : []

    const itemImageMap = new Map<string, File>()
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('item_image_') && value instanceof File && value.size > 0) {
        const itemId = key.replace('item_image_', '')
        itemImageMap.set(itemId, value)
      }
    }

    const uploadedImageUrls = new Map<string, string>()

    for (const [itemId, file] of itemImageMap.entries()) {
      const safeName = file.name.replace(/\s+/g, '-')
      const filePath = `providers/${providerId}/menu-items/${Date.now()}-${itemId}-${safeName}`

      const arrayBuffer = await file.arrayBuffer()
      const fileBuffer = Buffer.from(arrayBuffer)

      const { error: uploadError } = await supabase.storage
        .from('university-supplies')
        .upload(filePath, fileBuffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: true,
        })

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 400 })
      }

      const { data: publicUrlData } = supabase.storage
        .from('university-supplies')
        .getPublicUrl(filePath)

      uploadedImageUrls.set(itemId, publicUrlData.publicUrl)
    }

    const { error: deleteVariantsError } = await supabase
      .from('restaurant_menu_item_variants')
      .delete()
      .eq('menu_item_id', -1)

    if (deleteVariantsError && deleteVariantsError.code !== 'PGRST116') {
    }

    const { data: existingItems, error: existingItemsError } = await supabase
      .from('restaurant_menu_items')
      .select('id')
      .eq('restaurant_id', providerId)

    if (existingItemsError) {
      return NextResponse.json({ error: existingItemsError.message }, { status: 400 })
    }

    const existingItemIds = (existingItems || []).map((item) => item.id)

    if (existingItemIds.length > 0) {
      const { error: deleteExistingVariantsError } = await supabase
        .from('restaurant_menu_item_variants')
        .delete()
        .in('menu_item_id', existingItemIds)

      if (deleteExistingVariantsError) {
        return NextResponse.json({ error: deleteExistingVariantsError.message }, { status: 400 })
      }
    }

    const { error: deleteItemsError } = await supabase
      .from('restaurant_menu_items')
      .delete()
      .eq('restaurant_id', providerId)

    if (deleteItemsError) {
      return NextResponse.json({ error: deleteItemsError.message }, { status: 400 })
    }

    const { error: deleteCategoriesError } = await supabase
      .from('restaurant_menu_categories')
      .delete()
      .eq('restaurant_id', providerId)

    if (deleteCategoriesError) {
      return NextResponse.json({ error: deleteCategoriesError.message }, { status: 400 })
    }

    const categoryIdMap = new Map<number, number>()

    if (categories.length > 0) {
      const categoryRows = categories.map((category, index) => ({
        restaurant_id: providerId,
        name_en: category.name_en || '',
        name_ar: category.name_ar || '',
        sort_order: category.sort_order ?? index,
      }))

      const { data: insertedCategories, error: insertCategoriesError } = await supabase
        .from('restaurant_menu_categories')
        .insert(categoryRows)
        .select('id, name_en, name_ar, sort_order')

      if (insertCategoriesError) {
        return NextResponse.json({ error: insertCategoriesError.message }, { status: 400 })
      }

      ;(insertedCategories || []).forEach((inserted, index) => {
        const original = categories[index]
        if (original?.id != null) {
          categoryIdMap.set(Number(original.id), Number(inserted.id))
        }
      })
    }

    for (const [itemIndex, item] of items.entries()) {
      const mappedCategoryId =
        categoryIdMap.get(Number(item.menu_category_id)) ?? Number(item.menu_category_id)

      const uploadedImageUrl =
        uploadedImageUrls.get(String(item.id)) || uploadedImageUrls.get(String(itemIndex))

      const { data: insertedItem, error: insertItemError } = await supabase
        .from('restaurant_menu_items')
        .insert({
          restaurant_id: providerId,
          menu_category_id: mappedCategoryId,
          name_en: item.name_en || '',
          name_ar: item.name_ar || null,
          description_en: item.description_en || null,
          description_ar: item.description_ar || null,
          price: Number(item.price || 0),
          image_url: uploadedImageUrl || item.image_url || null,
          is_available: item.is_available !== false,
          sort_order: item.sort_order ?? itemIndex,
        })
        .select('id')
        .single()

      if (insertItemError) {
        return NextResponse.json({ error: insertItemError.message }, { status: 400 })
      }

      const insertedItemId = insertedItem.id
      const variants = Array.isArray(item.restaurant_menu_item_variants)
        ? item.restaurant_menu_item_variants
        : []

      if (variants.length > 0) {
        const variantRows = variants.map((variant, variantIndex) => ({
          menu_item_id: insertedItemId,
          name_en: variant.name_en || '',
          name_ar: variant.name_ar || null,
          price: Number(variant.price || 0),
          compare_at_price:
            variant.compare_at_price != null ? Number(variant.compare_at_price) : null,
          sku: variant.sku || null,
          is_default: variant.is_default === true,
          is_available: variant.is_available !== false,
          sort_order: variant.sort_order ?? variantIndex,
        }))

        const { error: insertVariantsError } = await supabase
          .from('restaurant_menu_item_variants')
          .insert(variantRows)

        if (insertVariantsError) {
          return NextResponse.json({ error: insertVariantsError.message }, { status: 400 })
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