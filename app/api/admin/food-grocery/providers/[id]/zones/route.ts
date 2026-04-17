import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { getCurrentAdminContext, isFoodSuperAdmin } from '@/src/lib/admin-auth'

type DeliveryAreaInput = {
  area_id?: number | string | null
  is_enabled?: boolean | null
  is_available?: boolean | null
  delivery_fee?: number | string | null
  estimated_delivery_minutes?: number | string | null
  minimum_order_amount?: number | string | null
}

type CityDeliveryAreaRow = {
  id: number
  city_id: string
  default_delivery_fee: number | string | null
  default_estimated_delivery_minutes: number | null
  default_minimum_order_amount: number | string | null
}

type ProviderAreaOverrideRow = {
  id: number
  provider_id: number
  area_id: number
  is_enabled: boolean | null
  delivery_fee: number | string | null
  estimated_delivery_minutes: number | null
  minimum_order_amount: number | string | null
}

function canManageZones(role: string) {
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

function numbersEqual(a: number | null, b: number | null) {
  if (a === null && b === null) return true
  if (a === null || b === null) return false
  return Number(a) === Number(b)
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

    if (!isFoodSuperAdmin(admin) && !canManageZones(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const providerId = Number(id)

    if (!Number.isFinite(providerId)) {
      return NextResponse.json({ error: 'Invalid provider id' }, { status: 400 })
    }

    const body = await req.json()
    const incomingAreas: DeliveryAreaInput[] = Array.isArray(body?.areas) ? body.areas : []

    const supabase = await createClient()

    const { data: provider, error: providerError } = await supabase
      .from('service_providers')
      .select('id, city_id')
      .eq('id', providerId)
      .maybeSingle()

    if (providerError) {
      return NextResponse.json({ error: providerError.message }, { status: 500 })
    }

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    if (!provider.city_id) {
      return NextResponse.json(
        { error: 'Provider must have a city before configuring delivery areas' },
        { status: 400 }
      )
    }

    const { data: cityAreas, error: cityAreasError } = await supabase
      .from('city_delivery_areas')
      .select(`
        id,
        city_id,
        default_delivery_fee,
        default_estimated_delivery_minutes,
        default_minimum_order_amount
      `)
      .eq('city_id', provider.city_id)
      .eq('is_active', true)

    if (cityAreasError) {
      return NextResponse.json({ error: cityAreasError.message }, { status: 500 })
    }

    const { data: existingOverrides, error: existingOverridesError } = await supabase
      .from('provider_delivery_area_overrides')
      .select(`
        id,
        provider_id,
        area_id,
        is_enabled,
        delivery_fee,
        estimated_delivery_minutes,
        minimum_order_amount
      `)
      .eq('provider_id', providerId)

    if (existingOverridesError) {
      return NextResponse.json({ error: existingOverridesError.message }, { status: 500 })
    }

    const cityAreaMap = new Map<number, CityDeliveryAreaRow>()
    for (const area of (cityAreas || []) as CityDeliveryAreaRow[]) {
      cityAreaMap.set(Number(area.id), area)
    }

    const existingOverrideMap = new Map<number, ProviderAreaOverrideRow>()
    for (const override of (existingOverrides || []) as ProviderAreaOverrideRow[]) {
      existingOverrideMap.set(Number(override.area_id), override)
    }

    const normalizedIncoming = incomingAreas
      .map((area) => {
        const areaId = Number(area.area_id)
        const isEnabled =
          area.is_enabled !== undefined && area.is_enabled !== null
            ? area.is_enabled === true
            : area.is_available === true

        return {
          area_id: areaId,
          is_enabled: isEnabled,
          delivery_fee: toNullableNumber(area.delivery_fee),
          estimated_delivery_minutes: toNullableNumber(area.estimated_delivery_minutes),
          minimum_order_amount: toNullableNumber(area.minimum_order_amount),
        }
      })
      .filter((area) => Number.isFinite(area.area_id))
      .filter((area) => cityAreaMap.has(area.area_id))

    const idsToDelete: number[] = []
    const rowsToUpsert: Array<{
      provider_id: number
      area_id: number
      is_enabled: boolean | null
      delivery_fee: number | null
      estimated_delivery_minutes: number | null
      minimum_order_amount: number | null
    }> = []

    for (const submitted of normalizedIncoming) {
      const masterArea = cityAreaMap.get(submitted.area_id)
      if (!masterArea) continue

      const defaultFee = toNullableNumber(masterArea.default_delivery_fee) ?? 0
      const defaultEta = toNullableNumber(masterArea.default_estimated_delivery_minutes)
      const defaultMinOrder = toNullableNumber(masterArea.default_minimum_order_amount)

      const finalEnabled = submitted.is_enabled
      const finalFee = submitted.delivery_fee ?? 0
      const finalEta = submitted.estimated_delivery_minutes
      const finalMinOrder = submitted.minimum_order_amount

      const existingOverride = existingOverrideMap.get(submitted.area_id)

      const sameAsDefault =
        finalEnabled === true &&
        numbersEqual(finalFee, defaultFee) &&
        numbersEqual(finalEta, defaultEta) &&
        numbersEqual(finalMinOrder, defaultMinOrder)

      if (sameAsDefault) {
        if (existingOverride) {
          idsToDelete.push(existingOverride.id)
        }
        continue
      }

      rowsToUpsert.push({
        provider_id: providerId,
        area_id: submitted.area_id,
        is_enabled: finalEnabled,
        delivery_fee: finalFee,
        estimated_delivery_minutes: finalEta,
        minimum_order_amount: finalMinOrder,
      })
    }

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('provider_delivery_area_overrides')
        .delete()
        .in('id', idsToDelete)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }
    }

    if (rowsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('provider_delivery_area_overrides')
        .upsert(rowsToUpsert, {
          onConflict: 'provider_id,area_id',
        })

      if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery area overrides saved successfully',
      deleted_overrides_count: idsToDelete.length,
      upserted_overrides_count: rowsToUpsert.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}