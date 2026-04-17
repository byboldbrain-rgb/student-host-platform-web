import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

type AreaPayload = {
  id?: number
  city_id: string
  code: string
  name_en: string
  name_ar: string
  sort_order?: number | null
  is_active?: boolean | null
  default_delivery_fee?: number | null
  default_estimated_delivery_minutes?: number | null
  default_minimum_order_amount?: number | null
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const cityId = searchParams.get('city_id')

    if (!cityId) {
      return NextResponse.json({ error: 'city_id is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('city_delivery_areas')
      .select(`
        id,
        city_id,
        code,
        name_en,
        name_ar,
        sort_order,
        is_active,
        created_at,
        updated_at,
        default_delivery_fee,
        default_estimated_delivery_minutes,
        default_minimum_order_amount
      `)
      .eq('city_id', cityId)
      .order('sort_order', { ascending: true })
      .order('name_en', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const cityId = String(body?.city_id || '').trim()
    const areas: AreaPayload[] = Array.isArray(body?.areas) ? body.areas : []

    if (!cityId) {
      return NextResponse.json({ error: 'city_id is required' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('city_delivery_areas')
      .delete()
      .eq('city_id', cityId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    if (areas.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const rows = areas.map((area, index) => ({
      city_id: cityId,
      code: String(area.code || '').trim(),
      name_en: String(area.name_en || '').trim(),
      name_ar: String(area.name_ar || '').trim(),
      sort_order: area.sort_order ?? index,
      is_active: area.is_active !== false,
      default_delivery_fee:
        area.default_delivery_fee != null ? Number(area.default_delivery_fee) : 0,
      default_estimated_delivery_minutes:
        area.default_estimated_delivery_minutes != null
          ? Number(area.default_estimated_delivery_minutes)
          : null,
      default_minimum_order_amount:
        area.default_minimum_order_amount != null
          ? Number(area.default_minimum_order_amount)
          : null,
    }))

    const invalidRow = rows.find(
      (row) => !row.code || !row.name_en || !row.name_ar
    )

    if (invalidRow) {
      return NextResponse.json(
        { error: 'Each area must include code, name_en, and name_ar' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('city_delivery_areas')
      .insert(rows)
      .select(`
        id,
        city_id,
        code,
        name_en,
        name_ar,
        sort_order,
        is_active,
        created_at,
        updated_at,
        default_delivery_fee,
        default_estimated_delivery_minutes,
        default_minimum_order_amount
      `)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}