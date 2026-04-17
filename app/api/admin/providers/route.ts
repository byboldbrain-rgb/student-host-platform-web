import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = await createClient()

    const { data: category } = await supabase
      .from('service_categories')
      .select('id')
      .eq('slug', body.category)
      .single()

    if (!category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const { error } = await supabase.from('service_providers').insert({
      name_en: body.name_en,
      name_ar: body.name_ar,
      phone: body.phone,
      whatsapp_number: body.whatsapp_number,
      slug: body.slug,
      short_description_en: body.description_en,
      short_description_ar: body.description_ar,
      category_id: category.id,
      is_active: true,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}