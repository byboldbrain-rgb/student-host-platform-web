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

function normalizeWhatsAppPhone(phone: string | null | undefined) {
  if (!phone) return null
  return phone.replace(/[^\d]/g, '')
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const to = normalizeWhatsAppPhone(searchParams.get('to'))
    const secret = searchParams.get('secret')

    if (secret !== process.env.WHATSAPP_TEST_SEND_SECRET) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!to) {
      return NextResponse.json(
        { ok: false, error: 'Missing "to" phone number' },
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

    const messageBody = 'Test message from Navienty WhatsApp API ✅'

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
          to,
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
      console.error('WHATSAPP_TEST_SEND_ERROR:', data)

      return NextResponse.json(
        { ok: false, error: data },
        { status: res.status }
      )
    }

    const supabase = getSupabaseAdminClient()
    const now = new Date().toISOString()
    const metaMessageId = data?.messages?.[0]?.id ?? null

    const { data: contact, error: contactError } = await supabase
      .from('whatsapp_contacts')
      .upsert(
        {
          phone: to,
          last_outbound_at: now,
          last_message_at: now,
          updated_at: now,
        },
        {
          onConflict: 'phone',
        }
      )
      .select('id')
      .single()

    if (contactError || !contact) {
      console.error('WHATSAPP_OUTBOUND_CONTACT_UPSERT_ERROR:', contactError)

      return NextResponse.json({
        ok: true,
        warning: 'Message sent but contact was not saved',
        data,
      })
    }

    let conversationId: string | null = null

    const { data: existingConversation, error: conversationLookupError } =
      await supabase
        .from('whatsapp_conversations')
        .select('id')
        .eq('contact_id', contact.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (conversationLookupError) {
      console.error(
        'WHATSAPP_OUTBOUND_CONVERSATION_LOOKUP_ERROR:',
        conversationLookupError
      )
    }

    if (existingConversation?.id) {
      conversationId = existingConversation.id

      const { error: conversationUpdateError } = await supabase
        .from('whatsapp_conversations')
        .update({
          last_message_at: now,
          updated_at: now,
        })
        .eq('id', conversationId)

      if (conversationUpdateError) {
        console.error(
          'WHATSAPP_OUTBOUND_CONVERSATION_UPDATE_ERROR:',
          conversationUpdateError
        )
      }
    } else {
      const { data: newConversation, error: conversationCreateError } =
        await supabase
          .from('whatsapp_conversations')
          .insert({
            contact_id: contact.id,
            status: 'open',
            conversation_type: 'general',
            last_message_at: now,
          })
          .select('id')
          .single()

      if (conversationCreateError || !newConversation) {
        console.error(
          'WHATSAPP_OUTBOUND_CONVERSATION_CREATE_ERROR:',
          conversationCreateError
        )

        return NextResponse.json({
          ok: true,
          warning: 'Message sent but conversation was not saved',
          data,
        })
      }

      conversationId = newConversation.id
    }

    const { error: messageInsertError } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversationId,
        contact_id: contact.id,
        direction: 'outbound',
        meta_message_id: metaMessageId,
        wamid: metaMessageId,
        message_type: 'text',
        body: messageBody,
        status: 'sent',
        raw_payload: {
          request: {
            to,
            type: 'text',
            body: messageBody,
          },
          response: data,
        },
      })

    if (messageInsertError) {
      console.error('WHATSAPP_OUTBOUND_MESSAGE_INSERT_ERROR:', messageInsertError)
    }

    console.log('WHATSAPP_TEST_SEND_SUCCESS:', data)

    return NextResponse.json({
      ok: true,
      data,
    })
  } catch (error) {
    console.error('WHATSAPP_TEST_SEND_EXCEPTION:', error)

    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 }
    )
  }
}