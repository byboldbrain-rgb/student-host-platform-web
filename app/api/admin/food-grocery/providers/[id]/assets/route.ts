import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { getCurrentAdminContext, isFoodSuperAdmin } from '@/src/lib/admin-auth'

type AssetInput = {
  asset_type?: string
  title?: string | null
  file_url?: string | null
  file_mime_type?: string | null
  sort_order?: number | null
  is_active?: boolean | null
}

function canManageProviderAssets(role: string) {
  return (
    role === 'food_super_admin' ||
    role === 'food_editor' ||
    role === 'food_adder'
  )
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

    if (!isFoodSuperAdmin(admin) && !canManageProviderAssets(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const providerId = Number(id)

    if (!Number.isFinite(providerId)) {
      return NextResponse.json({ error: 'Invalid provider id' }, { status: 400 })
    }

    const body = await req.json()
    const logoUrl =
      typeof body?.logo_url === 'string' && body.logo_url.trim()
        ? body.logo_url.trim()
        : null

    const coverImageUrl =
      typeof body?.cover_image_url === 'string' && body.cover_image_url.trim()
        ? body.cover_image_url.trim()
        : null

    const assets: AssetInput[] = Array.isArray(body?.assets) ? body.assets : []

    const supabase = await createClient()

    const { data: existingProvider, error: providerCheckError } = await supabase
      .from('service_providers')
      .select('id')
      .eq('id', providerId)
      .maybeSingle()

    if (providerCheckError) {
      return NextResponse.json(
        { error: providerCheckError.message },
        { status: 500 }
      )
    }

    if (!existingProvider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const { error: providerUpdateError } = await supabase
      .from('service_providers')
      .update({
        logo_url: logoUrl,
        cover_image_url: coverImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', providerId)

    if (providerUpdateError) {
      return NextResponse.json(
        { error: providerUpdateError.message },
        { status: 500 }
      )
    }

    const { error: deleteAssetsError } = await supabase
      .from('service_provider_assets')
      .delete()
      .eq('provider_id', providerId)

    if (deleteAssetsError) {
      return NextResponse.json(
        { error: deleteAssetsError.message },
        { status: 500 }
      )
    }

    const filteredAssets = assets
      .filter((asset) => typeof asset?.file_url === 'string' && asset.file_url.trim())
      .map((asset, index) => ({
        provider_id: providerId,
        asset_type:
          typeof asset.asset_type === 'string' && asset.asset_type.trim()
            ? asset.asset_type.trim()
            : 'gallery',
        title:
          typeof asset.title === 'string' && asset.title.trim()
            ? asset.title.trim()
            : null,
        file_url: String(asset.file_url).trim(),
        file_mime_type:
          typeof asset.file_mime_type === 'string' && asset.file_mime_type.trim()
            ? asset.file_mime_type.trim()
            : null,
        sort_order: Number.isFinite(Number(asset.sort_order))
          ? Number(asset.sort_order)
          : index,
        is_active: asset.is_active !== false,
      }))

    if (filteredAssets.length > 0) {
      const { error: insertAssetsError } = await supabase
        .from('service_provider_assets')
        .insert(filteredAssets)

      if (insertAssetsError) {
        return NextResponse.json(
          { error: insertAssetsError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Images saved successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}