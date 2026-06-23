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

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get('secret')

    if (secret !== process.env.WHATSAPP_TEST_SEND_SECRET) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
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
        ),
        messages:whatsapp_messages (
          id,
          direction,
          message_type,
          body,
          status,
          created_at
        )
      `
      )
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(50)

    if (error) {
      console.error('WHATSAPP_CONVERSATIONS_FETCH_ERROR:', error)

      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      )
    }

    const conversations =
      data?.map((conversation) => {
        const messages = Array.isArray(conversation.messages)
          ? conversation.messages
          : []

        const sortedMessages = [...messages].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )

        return {
          ...conversation,
          last_message: sortedMessages[0] ?? null,
          messages: sortedMessages.slice(0, 5),
        }
      }) ?? []

    return NextResponse.json({
      ok: true,
      conversations,
    })
  } catch (error) {
    console.error('WHATSAPP_CONVERSATIONS_ROUTE_ERROR:', error)

    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 }
    )
  }
}