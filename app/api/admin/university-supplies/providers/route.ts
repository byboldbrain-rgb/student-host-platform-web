import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const nameEn = String(body?.name_en || '').trim()
    const nameAr = String(body?.name_ar || '').trim()
    const phone = String(body?.phone || '').trim()
    const whatsappNumber = String(body?.whatsapp_number || '').trim()
    const descriptionEn = String(body?.description_en || '').trim()
    const descriptionAr = String(body?.description_ar || '').trim()
    const requestedSlug = String(body?.slug || '').trim()
    const categorySlug = String(body?.category || 'university_supplies').trim()

    if (!nameEn) {
      return NextResponse.json({ error: 'Name EN is required' }, { status: 400 })
    }

    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
    }

    const normalizedSlug = requestedSlug || slugify(nameEn || nameAr || `provider-${Date.now()}`)

    const { data: categoryRow, error: categoryError } = await supabase
      .from('service_categories')
      .select('id, slug, name_en')
      .or(`slug.eq.university-supplies,slug.eq.university_supplies`)
      .maybeSingle()

    if (categoryError) {
      return NextResponse.json({ error: categoryError.message }, { status: 400 })
    }

    if (!categoryRow) {
      return NextResponse.json(
        { error: 'University Supplies category was not found in service_categories' },
        { status: 400 }
      )
    }

    const { data: existingSlug, error: existingSlugError } = await supabase
      .from('service_providers')
      .select('id')
      .eq('slug', normalizedSlug)
      .maybeSingle()

    if (existingSlugError) {
      return NextResponse.json({ error: existingSlugError.message }, { status: 400 })
    }

    if (existingSlug) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    const insertPayload = {
      category_id: Number(categoryRow.id),
      name_en: nameEn,
      name_ar: nameAr || null,
      slug: normalizedSlug,
      short_description_en: descriptionEn || null,
      short_description_ar: descriptionAr || null,
      full_description_en: descriptionEn || null,
      full_description_ar: descriptionAr || null,
      phone,
      whatsapp_number: whatsappNumber || null,
      is_active: true,
      is_featured: false,
      is_manually_closed: false,
      extra_data: {},
    }

    const { data: insertedProvider, error: insertError } = await supabase
      .from('service_providers')
      .insert(insertPayload)
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      id: insertedProvider.id,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}