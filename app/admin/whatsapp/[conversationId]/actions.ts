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

type CreateBookingRequestResult = {
  ok: boolean
  bookingRequestId?: string
  error?: string
}

type RequestedOptionCode =
  | 'single_room'
  | 'double_room'
  | 'triple_room'
  | 'full_apartment'
  | null

function normalizeRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation ?? null
}

function normalizeRequestedOptionCode(
  value: string | null | undefined
): RequestedOptionCode {
  if (
    value === 'single_room' ||
    value === 'double_room' ||
    value === 'triple_room' ||
    value === 'full_apartment'
  ) {
    return value
  }

  return null
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
      console.error(
        'WHATSAPP_REPLY_CONVERSATION_FETCH_ERROR:',
        conversationError
      )

      return {
        ok: false,
        error: 'Conversation not found',
      }
    }

    const contact = normalizeRelation(conversation.contact)

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

export async function createBookingRequestFromWhatsAppAction(
  conversationId: string
): Promise<CreateBookingRequestResult> {
  try {
    if (!conversationId) {
      return {
        ok: false,
        error: 'Missing conversation ID',
      }
    }

    const supabase = getSupabaseAdminClient()

    const { data: conversation, error: conversationError } = await supabase
      .from('whatsapp_conversations')
      .select(
        `
        id,
        status,
        conversation_type,
        related_property_id,
        contact:whatsapp_contacts (
          id,
          phone,
          display_name
        )
      `
      )
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation) {
      console.error(
        'WHATSAPP_BOOKING_CONVERSATION_FETCH_ERROR:',
        conversationError
      )

      return {
        ok: false,
        error: 'Conversation not found',
      }
    }

    const contact = normalizeRelation(conversation.contact)

    if (!conversation.related_property_id) {
      return {
        ok: false,
        error: 'No property linked to this conversation',
      }
    }

    if (!contact?.phone) {
      return {
        ok: false,
        error: 'Conversation contact has no phone',
      }
    }

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select(
        `
        id,
        property_id,
        broker_id,
        title_en,
        title_ar
      `
      )
      .eq('id', conversation.related_property_id)
      .single()

    if (propertyError || !property) {
      console.error('WHATSAPP_BOOKING_PROPERTY_FETCH_ERROR:', propertyError)

      return {
        ok: false,
        error: 'Linked property not found',
      }
    }

    const { data: existingBookingRequest, error: existingLookupError } =
      await supabase
        .from('property_booking_requests')
        .select('id')
        .eq('property_id', property.id)
        .eq('customer_whatsapp', contact.phone)
        .in('status', ['new', 'contacted', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (existingLookupError) {
      console.error(
        'WHATSAPP_BOOKING_EXISTING_LOOKUP_ERROR:',
        existingLookupError
      )

      return {
        ok: false,
        error: 'Failed to check existing booking request',
      }
    }

    if (existingBookingRequest?.id) {
      return {
        ok: false,
        error:
          'There is already an active booking request for this student and property',
        bookingRequestId: existingBookingRequest.id,
      }
    }

    const { data: latestInboundMessage, error: messageLookupError } =
      await supabase
        .from('whatsapp_messages')
        .select('body')
        .eq('conversation_id', conversation.id)
        .eq('direction', 'inbound')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (messageLookupError) {
      console.error(
        'WHATSAPP_BOOKING_MESSAGE_LOOKUP_ERROR:',
        messageLookupError
      )
    }

    const { data: latestClickIntent, error: clickIntentLookupError } =
      await supabase
        .from('whatsapp_click_intents')
        .select('id, requested_option_code, room_type_label')
        .eq('linked_conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (clickIntentLookupError) {
      console.error(
        'WHATSAPP_BOOKING_CLICK_INTENT_LOOKUP_ERROR:',
        clickIntentLookupError
      )
    }

    const requestedOptionCode = normalizeRequestedOptionCode(
      latestClickIntent?.requested_option_code
    )

    const customerName =
      contact.display_name?.trim() || `WhatsApp ${contact.phone}`

    const propertyTitle =
      property.title_ar || property.title_en || property.property_id

    const notes = [
      'Created automatically from WhatsApp conversation.',
      '',
      `Conversation ID: ${conversation.id}`,
      `Property ID: ${property.property_id}`,
      `Property: ${propertyTitle}`,
      latestClickIntent?.room_type_label
        ? `Requested room type: ${latestClickIntent.room_type_label}`
        : null,
      '',
      latestInboundMessage?.body
        ? `Latest student message:\n${latestInboundMessage.body}`
        : null,
    ]
      .filter(Boolean)
      .join('\n')

    const { data: bookingRequest, error: insertError } = await supabase
      .from('property_booking_requests')
      .insert({
        property_id: property.id,
        broker_id: property.broker_id,
        customer_name: customerName,
        customer_phone: contact.phone,
        customer_whatsapp: contact.phone,
        message: latestInboundMessage?.body || notes,
        status: 'new',
        requested_option_code: requestedOptionCode,
        request_source: 'student',
        admin_internal_notes: notes,
        whatsapp_conversation_id: conversation.id,
        whatsapp_contact_id: contact.id,
      })
      .select('id')
      .single()

    if (insertError || !bookingRequest) {
      console.error('WHATSAPP_BOOKING_REQUEST_INSERT_ERROR:', insertError)

      return {
        ok: false,
        error: insertError?.message || 'Failed to create booking request',
      }
    }

    if (latestClickIntent?.id) {
      const { error: clickIntentUpdateError } = await supabase
        .from('whatsapp_click_intents')
        .update({
          linked_booking_request_id: bookingRequest.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', latestClickIntent.id)

      if (clickIntentUpdateError) {
        console.error(
          'WHATSAPP_BOOKING_CLICK_INTENT_UPDATE_ERROR:',
          clickIntentUpdateError
        )
      }
    }

    await supabase
      .from('whatsapp_conversations')
      .update({
        conversation_type: 'student_booking',
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id)

    revalidatePath(`/admin/whatsapp/${conversation.id}`)
    revalidatePath('/admin/whatsapp')
    revalidatePath('/admin/properties/booking-requests')

    return {
      ok: true,
      bookingRequestId: bookingRequest.id,
    }
  } catch (error) {
    console.error('WHATSAPP_BOOKING_REQUEST_ACTION_ERROR:', error)

    return {
      ok: false,
      error: 'Unexpected error',
    }
  }
}