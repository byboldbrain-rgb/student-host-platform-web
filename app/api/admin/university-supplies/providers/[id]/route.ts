import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const providerId = Number(params.id)

    if (!providerId) {
      return NextResponse.json({ error: 'Invalid provider id' }, { status: 400 })
    }

    const {
      subcategory_ids = [],
      university_ids = [],
      business_hours = [],
      ...providerData
    } = body

    /** ========================
     * 1. UPDATE MAIN PROVIDER
     ========================= */
    const { error: providerError } = await supabase
      .from('service_providers')
      .update({
        ...providerData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', providerId)

    if (providerError) {
      return NextResponse.json({ error: providerError.message }, { status: 400 })
    }

    /** ========================
     * 2. SUBCATEGORIES
     ========================= */
    await supabase
      .from('service_provider_subcategories')
      .delete()
      .eq('provider_id', providerId)

    if (Array.isArray(subcategory_ids) && subcategory_ids.length > 0) {
      const rows = subcategory_ids.map((id: string | number) => ({
        provider_id: providerId,
        subcategory_id: Number(id),
      }))

      const { error: subError } = await supabase
        .from('service_provider_subcategories')
        .insert(rows)

      if (subError) {
        return NextResponse.json({ error: subError.message }, { status: 400 })
      }
    }

    /** ========================
     * 3. UNIVERSITIES
     ========================= */
    await supabase
      .from('service_provider_universities')
      .delete()
      .eq('provider_id', providerId)

    if (Array.isArray(university_ids) && university_ids.length > 0) {
      const rows = university_ids.map((id: string | number) => ({
        provider_id: providerId,
        university_id: id,
      }))

      const { error: uniError } = await supabase
        .from('service_provider_universities')
        .insert(rows)

      if (uniError) {
        return NextResponse.json({ error: uniError.message }, { status: 400 })
      }
    }

    /** ========================
     * 4. BUSINESS HOURS
     ========================= */
    await supabase
      .from('provider_business_hours')
      .delete()
      .eq('provider_id', providerId)

    if (Array.isArray(business_hours) && business_hours.length > 0) {
      const rows = business_hours.map((row: any) => ({
        provider_id: providerId,
        day_of_week: row.day_of_week,
        is_open: row.is_open,
        open_time: row.open_time,
        close_time: row.close_time,
      }))

      const { error: hoursError } = await supabase
        .from('provider_business_hours')
        .insert(rows)

      if (hoursError) {
        return NextResponse.json({ error: hoursError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    )
  }
}