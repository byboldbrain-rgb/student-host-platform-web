'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

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

type SendWhatsAppReplyResult = {
  ok: boolean
  error?: string
}

export async function sendWhatsAppReplyAction(
  conversationId: string,
  messageBody: string
): Promise<SendWhatsAppReplyResult> {
  try {
    const body = messageBody.trim()

    if (!conversationId) {
      return {
        ok: false,
        error: 'Missing conversation ID',
      }
    }

    if (!body) {
      return {
        ok: false,
        error: 'اكتب رسالة الأول.',
      }
    }

    const accessToken = process.env.META_WA_ACCESS_TOKEN
    const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      return {
        ok: false,
        error: 'Missing WhatsApp environment variables',
      }
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
      console.error('WHATSAPP_REPLY_CONVERSATION_FETCH_ERROR:', conversationError)

      return {
        ok: false,
        error: 'Conversation not found',
      }
    }

    const contact = Array.isArray(conversation.contact)
      ? conversation.contact[0]
      : conversation.contact

    if (!contact?.phone) {
      return {
        ok: false,
        error: 'Conversation contact has no phone',
      }
    }

    if (contact.blocked) {
      return {
        ok: false,
        error: 'Contact is blocked',
      }
    }

    if (contact.opted_out) {
      return {
        ok: false,
        error: 'Contact opted out',
      }
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
            body,
          },
        }),
      }
    )

    const data = await res.json()

    if (!res.ok) {
      console.error('WHATSAPP_REPLY_SEND_ERROR:', data)

      return {
        ok: false,
        error:
          data?.error?.message ||
          data?.error?.error_user_msg ||
          'فشل إرسال رسالة واتساب.',
      }
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
        body,
        status: 'sent',
        raw_payload: {
          request: {
            to: contact.phone,
            type: 'text',
            body,
          },
          response: data,
        },
      })

    if (messageInsertError) {
      console.error('WHATSAPP_REPLY_MESSAGE_INSERT_ERROR:', messageInsertError)

      return {
        ok: false,
        error: 'Message sent but failed to save in database',
      }
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

    revalidatePath(`/admin/whatsapp/${conversation.id}`)
    revalidatePath('/admin/whatsapp')

    return {
      ok: true,
    }
  } catch (error) {
    console.error('WHATSAPP_REPLY_ACTION_ERROR:', error)

    return {
      ok: false,
      error: 'Unexpected error',
    }
  }
}