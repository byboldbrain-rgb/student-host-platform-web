import { NextResponse } from 'next/server'
import { createClient } from '../../../../src/lib/supabase/server'

type OrderItemInput = {
  menu_item_id?: number | string | null
  menu_item_variant_id?: number | string | null
  item_name_en?: string | null
  item_name_ar?: string | null
  variant_name_en?: string | null
  variant_name_ar?: string | null
  quantity?: number | string | null
  unit_price?: number | string | null
  total_price?: number | string | null
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      restaurant_id,
      customer_name,
      customer_phone,
      customer_address,
      area_id,
      area_name,
      delivery_fee,
      subtotal,
      total_amount,
      notes,
      items,
    } = body || {}

    if (
      !restaurant_id ||
      !customer_name ||
      !customer_phone ||
      !customer_address ||
      !area_id ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const normalizedItems: OrderItemInput[] = items
      .map((item: OrderItemInput) => ({
        menu_item_id: item?.menu_item_id ?? null,
        menu_item_variant_id: item?.menu_item_variant_id ?? null,
        item_name_en: item?.item_name_en?.trim() || null,
        item_name_ar: item?.item_name_ar?.trim() || null,
        variant_name_en: item?.variant_name_en?.trim() || null,
        variant_name_ar: item?.variant_name_ar?.trim() || null,
        quantity: toNumber(item?.quantity, 0),
        unit_price: toNumber(item?.unit_price, 0),
        total_price: toNumber(item?.total_price, 0),
      }))
      .filter((item) => item.menu_item_id && item.quantity && item.quantity > 0)

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order items' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: order, error: orderError } = await supabase
      .from('restaurant_orders')
      .insert({
        restaurant_id,
        customer_name,
        customer_phone,
        customer_address,
        area_id,
        area_name,
        delivery_fee: toNumber(delivery_fee, 0),
        subtotal: toNumber(subtotal, 0),
        total_amount: toNumber(total_amount, 0),
        notes: typeof notes === 'string' ? notes : null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    const orderItemsPayload = normalizedItems.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      menu_item_variant_id: item.menu_item_variant_id || null,
      item_name_en: item.item_name_en,
      item_name_ar: item.item_name_ar,
      variant_name_en: item.variant_name_en,
      variant_name_ar: item.variant_name_ar,
      quantity: toNumber(item.quantity, 1),
      unit_price: toNumber(item.unit_price, 0),
      total_price: toNumber(item.total_price, 0),
    }))

    const { error: itemsError } = await supabase
      .from('restaurant_order_items')
      .insert(orderItemsPayload)

    if (itemsError) {
      await supabase.from('restaurant_orders').delete().eq('id', order.id)

      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}