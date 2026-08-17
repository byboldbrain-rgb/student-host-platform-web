import { NextRequest, NextResponse } from 'next/server'

import { getCurrentAdminContext } from '@/src/lib/admin-auth'
import { createAdminClient } from '@/src/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WHATSAPP_MEDIA_BUCKET = 'whatsapp-media'
const MAX_MEDIA_BYTES = 25 * 1024 * 1024

function isSafeStoragePath(value: string) {
  if (!value || value.length > 1000) return false
  if (value.startsWith('/') || value.includes('..') || value.includes('\\')) {
    return false
  }

  return /^[A-Za-z0-9_./\-]+$/.test(value)
}

export async function GET(req: NextRequest) {
  const adminContext = await getCurrentAdminContext()

  if (!adminContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const storagePath = req.nextUrl.searchParams.get('path')?.trim() ?? ''

  if (!isSafeStoragePath(storagePath)) {
    return NextResponse.json({ error: 'Invalid media path' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(WHATSAPP_MEDIA_BUCKET)
    .download(storagePath)

  if (error || !data) {
    console.error('WHATSAPP_PRIVATE_MEDIA_DOWNLOAD_ERROR', {
      storagePath,
      code: (error as { statusCode?: string } | null)?.statusCode ?? null,
    })

    return NextResponse.json({ error: 'Media not found' }, { status: 404 })
  }

  if (data.size > MAX_MEDIA_BYTES) {
    return NextResponse.json({ error: 'Media is too large' }, { status: 413 })
  }

  const bytes = await data.arrayBuffer()
  const contentType = data.type || 'application/octet-stream'

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': 'private, max-age=300, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  })
}
