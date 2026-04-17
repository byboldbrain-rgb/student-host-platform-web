import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { getCurrentAdminContext, isFoodSuperAdmin } from '@/src/lib/admin-auth'

type AreaInput = {
  code?: string | null
  name_en?: string | null
  name_ar?: string | null
  sort_order?: number | null
  is_active?: boolean | null
  default_delivery_fee?: number | string | null
  default_estimated_delivery_minutes?: number | string | null
  default_minimum_order_amount?: number | string | null
}

type SaveAreasInput = {
  city_id?: string | null
  areas?: AreaInput[]
}

function canManageDeliveryDefaults(role: string) {
  return (
    role === 'food_super_admin' ||
    role === 'food_editor' ||
    role === 'food_adder'
  )
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export async function POST(req: Request) {
  try {
    const adminContext = await getCurrentAdminContext()

    if (!adminContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminContext.admin

    if (!isFoodSuperAdmin(admin) && !canManageDeliveryDefaults(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await req.json()) as SaveAreasInput
    const cityId = body?.city_id?.trim() || null
    const incomingAreas = Array.isArray(body?.areas) ? body.areas : []

    if (!cityId) {
      return NextResponse.json({ error: 'city_id is required' }, { status: 400 })
    }

    if (incomingAreas.length === 0) {
      return NextResponse.json({ error: 'At least one area is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('id', cityId)
      .maybeSingle()

    if (cityError) {
      return NextResponse.json({ error: cityError.message }, { status: 500 })
    }

    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 })
    }

    const rows = incomingAreas
      .map((area, index) => {
        const code = area.code?.trim() || null
        const nameEn = area.name_en?.trim() || null
        const nameAr = area.name_ar?.trim() || null

        if (!code && !nameEn && !nameAr) {
          return null
        }

        return {
          city_id: cityId,
          code: code || `area-${Date.now()}-${index + 1}`,
          name_en: nameEn || nameAr || `Area ${index + 1}`,
          name_ar: nameAr || nameEn || `منطقة ${index + 1}`,
          sort_order: Number.isFinite(Number(area.sort_order))
            ? Number(area.sort_order)
            : index,
          is_active: area.is_active !== false,
          default_delivery_fee: Math.max(0, Number(area.default_delivery_fee || 0)),
          default_estimated_delivery_minutes: toNullableNumber(
            area.default_estimated_delivery_minutes
          ),
          default_minimum_order_amount: toNullableNumber(
            area.default_minimum_order_amount
          ),
        }
      })
      .filter(Boolean)

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No valid areas were provided' },
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
        default_delivery_fee,
        default_estimated_delivery_minutes,
        default_minimum_order_amount
      `)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery areas created successfully',
      count: data?.length || 0,
      areas: data || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}