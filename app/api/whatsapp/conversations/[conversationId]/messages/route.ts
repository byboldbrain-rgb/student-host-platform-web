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

export async function GET(
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

    if (!conversationId) {
      return NextResponse.json(
        { ok: false, error: 'Missing conversationId' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient()

    const { data: conversation, error: conversationError } = await supabase
      .from('whatsapp_conversations')
      .select(
        `
        id,
        status,
        conversation_type,
        last_message_at,
        created_at,
        contact:whatsapp_contacts (
          id,
          phone,
          display_name,
          contact_type,
          opted_out,
          blocked
        )
      `
      )
      .eq('id', conversationId)
      .single()

    if (conversationError) {
      console.error('WHATSAPP_CONVERSATION_FETCH_ERROR:', conversationError)

      return NextResponse.json(
        { ok: false, error: conversationError.message },
        { status: 404 }
      )
    }

    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_messages')
      .select(
        `
        id,
        direction,
        message_type,
        body,
        status,
        error_code,
        error_message,
        media_id,
        media_mime_type,
        media_filename,
        created_at
      `
      )
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('WHATSAPP_MESSAGES_FETCH_ERROR:', messagesError)

      return NextResponse.json(
        { ok: false, error: messagesError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      conversation,
      messages: messages ?? [],
    })
  } catch (error) {
    console.error('WHATSAPP_MESSAGES_ROUTE_ERROR:', error)

    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 }
    )
  }
}