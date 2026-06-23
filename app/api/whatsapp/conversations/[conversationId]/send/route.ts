import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const secret = req.nextUrl.searchParams.get('secret')

    if (secret !== process.env.WHATSAPP_TEST_SEND_SECRET) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { conversationId } = await context.params
    const body = await req.json()
    const messageBody = String(body?.body ?? '').trim()

    if (!conversationId) {
      return NextResponse.json(
        { ok: false, error: 'Missing conversationId' },
        { status: 400 }
      )
    }

    if (!messageBody) {
      return NextResponse.json(
        { ok: false, error: 'Missing message body' },
        { status: 400 }
      )
    }

    const accessToken = process.env.META_WA_ACCESS_TOKEN
    const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json(
        { ok: false, error: 'Missing WhatsApp environment variables' },
        { status: 500 }
      )
    }

    const supabase = getSupabaseAdminClient()

    const { data: conversation, error: conversationError } = await supabase
      .from('whatsapp_conversations')
      .select(
        `
        id,
        status,
        contact:whatsapp_contacts (
          id,
          phone,
          opted_out,
          blocked
        )
      `
      )
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation) {
      console.error('WHATSAPP_SEND_CONVERSATION_FETCH_ERROR:', conversationError)

      return NextResponse.json(
        { ok: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const contact = Array.isArray(conversation.contact)
      ? conversation.contact[0]
      : conversation.contact

    if (!contact?.phone) {
      return NextResponse.json(
        { ok: false, error: 'Conversation contact has no phone' },
        { status: 400 }
      )
    }

    if (contact.blocked) {
      return NextResponse.json(
        { ok: false, error: 'Contact is blocked' },
        { status: 403 }
      )
    }

    if (contact.opted_out) {
      return NextResponse.json(
        { ok: false, error: 'Contact opted out' },
        { status: 403 }
      )
    }

    const res = await fetch(
      `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: contact.phone,
          type: 'text',
          text: {
            preview_url: false,
            body: messageBody,
          },
        }),
      }
    )

    const data = await res.json()

    if (!res.ok) {
      console.error('WHATSAPP_CONVERSATION_SEND_ERROR:', data)

      return NextResponse.json(
        { ok: false, error: data },
        { status: res.status }
      )
    }

    const now = new Date().toISOString()
    const metaMessageId = data?.messages?.[0]?.id ?? null

    const { error: messageInsertError } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversation.id,
        contact_id: contact.id,
        direction: 'outbound',
        meta_message_id: metaMessageId,
        wamid: metaMessageId,
        message_type: 'text',
        body: messageBody,
        status: 'sent',
        raw_payload: {
          request: {
            to: contact.phone,
            type: 'text',
            body: messageBody,
          },
          response: data,
        },
      })

    if (messageInsertError) {
      console.error('WHATSAPP_CONVERSATION_MESSAGE_INSERT_ERROR:', messageInsertError)
    }

    await supabase
      .from('whatsapp_contacts')
      .update({
        last_outbound_at: now,
        last_message_at: now,
        updated_at: now,
      })
      .eq('id', contact.id)

    await supabase
      .from('whatsapp_conversations')
      .update({
        last_message_at: now,
        updated_at: now,
      })
      .eq('id', conversation.id)

    return NextResponse.json({
      ok: true,
      data,
    })
  } catch (error) {
    console.error('WHATSAPP_CONVERSATION_SEND_ROUTE_ERROR:', error)

    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 }
    )
  }
}