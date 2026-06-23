import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type ClickIntentBody = {
  propertyId?: string | null
  propertyPublicId?: string | null
  requestedOptionCode?: string | null
  roomTypeLabel?: string | null
  source?: string | null
  generatedMessage?: string | null
  whatsappTargetNumber?: string | null
  customerName?: string | null
  customerPhone?: string | null
  customerWhatsapp?: string | null
  metadata?: Record<string, unknown> | null
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function normalizePhone(value: string | null | undefined) {
  if (!value) return null
  return value.replace(/[^\d]/g, '')
}

function normalizeSource(value: string | null | undefined) {
  if (
    value === 'property_page' ||
    value === 'search_page' ||
    value === 'admin_preview' ||
    value === 'unknown'
  ) {
    return value
  }

  return 'property_page'
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ClickIntentBody

    const propertyId = body.propertyId?.trim() || null
    const propertyPublicId = body.propertyPublicId?.trim() || null
    const generatedMessage = body.generatedMessage?.trim() || null

    const whatsappTargetNumber =
      normalizePhone(body.whatsappTargetNumber) ||
      normalizePhone(process.env.NAVIENTY_WHATSAPP_NUMBER)

    if (!propertyId && !propertyPublicId) {
      return NextResponse.json(
        { ok: false, error: 'Missing property identifier' },
        { status: 400 }
      )
    }

    if (!generatedMessage) {
      return NextResponse.json(
        { ok: false, error: 'Missing generated message' },
        { status: 400 }
      )
    }

    if (!whatsappTargetNumber) {
      return NextResponse.json(
        { ok: false, error: 'Missing WhatsApp target number' },
        { status: 500 }
      )
    }

    const supabase = getSupabaseAdminClient()

    let propertyQuery = supabase
      .from('properties')
      .select(
        `
        id,
        property_id,
        title_en,
        title_ar
      `
      )
      .limit(1)

    if (propertyId) {
      propertyQuery = propertyQuery.eq('id', propertyId)
    } else if (propertyPublicId) {
      propertyQuery = propertyQuery.eq('property_id', propertyPublicId)
    }

    const { data: properties, error: propertyError } = await propertyQuery

    if (propertyError) {
      console.error('WHATSAPP_CLICK_PROPERTY_LOOKUP_ERROR:', propertyError)

      return NextResponse.json(
        { ok: false, error: 'Failed to find property' },
        { status: 500 }
      )
    }

    const property = properties?.[0] ?? null

    if (!property) {
      return NextResponse.json(
        { ok: false, error: 'Property not found' },
        { status: 404 }
      )
    }

    const propertyTitle = property.title_ar || property.title_en || null
    const now = new Date().toISOString()

    const { data: clickIntent, error: insertError } = await supabase
      .from('whatsapp_click_intents')
      .insert({
        property_id: property.id,
        property_public_id: property.property_id,
        property_title: propertyTitle,

        requested_option_code: body.requestedOptionCode || null,
        room_type_label: body.roomTypeLabel || null,

        source: normalizeSource(body.source),

        customer_name: body.customerName || null,
        customer_phone: normalizePhone(body.customerPhone),
        customer_whatsapp: normalizePhone(body.customerWhatsapp),

        whatsapp_target_number: whatsappTargetNumber,
        generated_message: generatedMessage,

        status: 'clicked',

        metadata: {
          ...(body.metadata || {}),
          user_agent: req.headers.get('user-agent'),
          referer: req.headers.get('referer'),
        },

        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single()

    if (insertError || !clickIntent) {
      console.error('WHATSAPP_CLICK_INTENT_INSERT_ERROR:', insertError)

      return NextResponse.json(
        { ok: false, error: 'Failed to save WhatsApp click intent' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      clickIntentId: clickIntent.id,
      whatsappTargetNumber,
    })
  } catch (error) {
    console.error('WHATSAPP_CLICK_INTENT_ROUTE_ERROR:', error)

    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 }
    )
  }
}