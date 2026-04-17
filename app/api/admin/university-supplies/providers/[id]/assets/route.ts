import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

type AssetPayload = {
  id?: number
  provider_id?: number
  asset_type: string
  title?: string | null
  file_url: string
  file_mime_type?: string | null
  sort_order?: number | null
  is_active?: boolean | null
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

    const body = await req.json()

    const {
      logo_url,
      cover_image_url,
      assets = [],
    }: {
      logo_url?: string
      cover_image_url?: string
      assets: AssetPayload[]
    } = body

    /** ========================
     * 1. UPDATE LOGO & COVER
     ========================= */
    const { error: providerError } = await supabase
      .from('service_providers')
      .update({
        logo_url: logo_url || null,
        cover_image_url: cover_image_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', providerId)

    if (providerError) {
      return NextResponse.json({ error: providerError.message }, { status: 400 })
    }

    /** ========================
     * 2. DELETE OLD GALLERY
     ========================= */
    await supabase
      .from('service_provider_assets')
      .delete()
      .eq('provider_id', providerId)
      .eq('asset_type', 'gallery')

    /** ========================
     * 3. INSERT NEW GALLERY
     ========================= */
    if (Array.isArray(assets) && assets.length > 0) {
      const rows = assets.map((item, index) => ({
        provider_id: providerId,
        asset_type: 'gallery',
        title: item.title || null,
        file_url: item.file_url,
        file_mime_type: item.file_mime_type || null,
        sort_order: index,
        is_active: item.is_active !== false,
      }))

      const { error: insertError } = await supabase
        .from('service_provider_assets')
        .insert(rows)

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 })
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