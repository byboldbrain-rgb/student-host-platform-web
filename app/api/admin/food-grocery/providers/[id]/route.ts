import { NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { getCurrentAdminContext, isFoodSuperAdmin } from '@/src/lib/admin-auth'

type ProviderBusinessHourInput = {
  day_of_week?: number | string | null
  is_open?: boolean | null
  open_time?: string | null
  close_time?: string | null
}

type ProviderPatchBody = {
  category_id?: string | null
  city_id?: string | null
  primary_university_id?: string | null
  subcategory_ids?: string[]
  university_ids?: string[]
  name_en?: string | null
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
  is_featured?: boolean
  is_active?: boolean
  discount_percentage?: number | string | null
  discount_title_en?: string | null
  discount_title_ar?: string | null
  is_manually_closed?: boolean
  manual_closed_note?: string | null
  business_hours?: ProviderBusinessHourInput[]
}

function normalizeTimeValue(value?: string | null) {
  const trimmed = String(value || '').trim()
  return trimmed ? trimmed : null
}

export async function PATCH(
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

    const body = (await req.json()) as ProviderPatchBody
    const supabase = createAdminClient()

    const subcategoryIds = Array.isArray(body?.subcategory_ids)
      ? body.subcategory_ids
          .map((value: string) => String(value).trim())
          .filter((value: string) => Boolean(value) && value !== '0')
      : []

    const universityIds = Array.isArray(body?.university_ids)
      ? body.university_ids
          .map((value: string) => String(value).trim())
          .filter((value: string) => Boolean(value) && value !== '0')
      : []

    const primaryUniversityId =
      body?.primary_university_id != null && body?.primary_university_id !== ''
        ? String(body.primary_university_id).trim()
        : null

    const businessHoursInput = Array.isArray(body?.business_hours)
      ? body.business_hours
      : []

    const normalizedBusinessHours = businessHoursInput
      .map((row) => {
        const day = Number(row?.day_of_week)

        if (Number.isNaN(day) || day < 0 || day > 6) {
          return null
        }

        const isOpen = row?.is_open === true
        const openTime = isOpen ? normalizeTimeValue(row?.open_time) : null
        const closeTime = isOpen ? normalizeTimeValue(row?.close_time) : null

        return {
          provider_id: providerId,
          day_of_week: day,
          is_open: isOpen,
          open_time: openTime,
          close_time: closeTime,
        }
      })
      .filter(Boolean) as Array<{
      provider_id: number
      day_of_week: number
      is_open: boolean
      open_time: string | null
      close_time: string | null
    }>

    const uniqueDayCount = new Set(
      normalizedBusinessHours.map((row) => row.day_of_week)
    ).size

    if (normalizedBusinessHours.length > 0 && uniqueDayCount !== normalizedBusinessHours.length) {
      return NextResponse.json(
        { error: 'Business hours cannot contain duplicate days.' },
        { status: 400 }
      )
    }

    if (normalizedBusinessHours.length > 0 && uniqueDayCount !== 7) {
      return NextResponse.json(
        { error: 'Business hours must include exactly 7 unique days.' },
        { status: 400 }
      )
    }

    for (const row of normalizedBusinessHours) {
      if (row.is_open && (!row.open_time || !row.close_time)) {
        return NextResponse.json(
          { error: 'Every open business-hours row must include open_time and close_time.' },
          { status: 400 }
        )
      }
    }

    const isManuallyClosed = body?.is_manually_closed === true
    const manualClosedNote = body?.manual_closed_note?.trim() || null
    const nowIso = new Date().toISOString()

    const updatePayload = {
      category_id:
        body?.category_id != null && body?.category_id !== ''
          ? String(body.category_id).trim()
          : null,
      city_id:
        body?.city_id != null && body?.city_id !== ''
          ? String(body.city_id).trim()
          : null,
      primary_university_id: primaryUniversityId,
      name_en: body?.name_en?.trim() || '',
      name_ar: body?.name_ar?.trim() || null,
      slug: body?.slug?.trim() || null,
      short_description_en: body?.short_description_en?.trim() || null,
      short_description_ar: body?.short_description_ar?.trim() || null,
      full_description_en: body?.full_description_en?.trim() || null,
      full_description_ar: body?.full_description_ar?.trim() || null,
      phone: body?.phone?.trim() || null,
      email: body?.email?.trim() || null,
      website_url: body?.website_url?.trim() || null,
      address_line: body?.address_line?.trim() || null,
      google_maps_url: body?.google_maps_url?.trim() || null,
      logo_url: body?.logo_url?.trim() || null,
      cover_image_url: body?.cover_image_url?.trim() || null,
      whatsapp_number: body?.whatsapp_number?.trim() || null,
      whatsapp_message_template: body?.whatsapp_message_template?.trim() || null,
      is_featured: body?.is_featured === true,
      is_active: body?.is_active !== false,
      discount_percentage:
        body?.discount_percentage != null && body?.discount_percentage !== ''
          ? Number(body.discount_percentage)
          : null,
      discount_title_en: body?.discount_title_en?.trim() || null,
      discount_title_ar: body?.discount_title_ar?.trim() || null,
      is_manually_closed: isManuallyClosed,
      manual_closed_note: manualClosedNote,
      manual_closed_at: isManuallyClosed ? nowIso : null,
      manual_closed_by_admin_id: isManuallyClosed ? admin.id : null,
      updated_at: nowIso,
    }

    const { error: providerUpdateError } = await supabase
      .from('service_providers')
      .update(updatePayload)
      .eq('id', providerId)

    if (providerUpdateError) {
      return NextResponse.json(
        { error: providerUpdateError.message },
        { status: 500 }
      )
    }

    const { error: deleteSubcategoriesError } = await supabase
      .from('service_provider_subcategories')
      .delete()
      .eq('provider_id', providerId)

    if (deleteSubcategoriesError) {
      return NextResponse.json(
        { error: deleteSubcategoriesError.message },
        { status: 500 }
      )
    }

    if (subcategoryIds.length > 0) {
      const subcategoryRows = subcategoryIds.map((subcategoryId: string) => ({
        provider_id: providerId,
        subcategory_id: subcategoryId,
      }))

      const { error: insertSubcategoriesError } = await supabase
        .from('service_provider_subcategories')
        .insert(subcategoryRows)

      if (insertSubcategoriesError) {
        return NextResponse.json(
          { error: insertSubcategoriesError.message },
          { status: 500 }
        )
      }
    }

    const { error: deleteUniversitiesError } = await supabase
      .from('service_provider_universities')
      .delete()
      .eq('provider_id', providerId)

    if (deleteUniversitiesError) {
      return NextResponse.json(
        { error: deleteUniversitiesError.message },
        { status: 500 }
      )
    }

    if (universityIds.length > 0) {
      const universityRows = universityIds.map((universityId: string) => ({
        provider_id: providerId,
        university_id: universityId,
      }))

      const { error: insertUniversitiesError } = await supabase
        .from('service_provider_universities')
        .insert(universityRows)

      if (insertUniversitiesError) {
        return NextResponse.json(
          { error: insertUniversitiesError.message },
          { status: 500 }
        )
      }
    }

    const { error: deleteBusinessHoursError } = await supabase
      .from('provider_business_hours')
      .delete()
      .eq('provider_id', providerId)

    if (deleteBusinessHoursError) {
      return NextResponse.json(
        { error: deleteBusinessHoursError.message },
        { status: 500 }
      )
    }

    if (normalizedBusinessHours.length > 0) {
      const { error: insertBusinessHoursError } = await supabase
        .from('provider_business_hours')
        .insert(normalizedBusinessHours)

      if (insertBusinessHoursError) {
        return NextResponse.json(
          { error: insertBusinessHoursError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      provider_id: providerId,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal server error'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}