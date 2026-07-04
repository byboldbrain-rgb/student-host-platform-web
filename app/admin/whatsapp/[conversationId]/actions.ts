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

type SendWhatsAppMediaReplyResult = {
  ok: boolean
  error?: string
}

type SendWhatsAppContactReplyResult = {
  ok: boolean
  error?: string
}

type CreateBookingRequestResult = {
  ok: boolean
  bookingRequestId?: string
  error?: string
}

type MarkAsOwnerResult = {
  ok: boolean
  error?: string
}

type RequestedOptionCode =
  | 'single_room'
  | 'double_room'
  | 'triple_room'
  | 'full_apartment'
  | null

type WhatsAppMediaType = 'image' | 'video' | 'audio' | 'document' | 'sticker'

type WhatsAppContactRelation = {
  id: string
  phone: string | null
  display_name?: string | null
  opted_out?: boolean | null
  blocked?: boolean | null
}

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

function normalizeMediaHint(value: FormDataEntryValue | null) {
  if (
    value === 'document' ||
    value === 'photos' ||
    value === 'camera' ||
    value === 'audio' ||
    value === 'sticker'
  ) {
    return value
  }

  return null
}

function getWhatsAppMediaType(
  file: File,
  hint: ReturnType<typeof normalizeMediaHint>
): WhatsAppMediaType {
  const mimeType = file.type || ''

  if (hint === 'document') return 'document'
  if (hint === 'audio') return 'audio'
  if (hint === 'sticker') return 'sticker'

  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'

  return 'document'
}

function normalizeWhatsAppPhoneForContact(phone: string) {
  return phone.replace(/[^0-9]/g, '')
}

async function getConversationContact(conversationId: string) {
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
        display_name,
        opted_out,
        blocked
      )
    `
    )
    .eq('id', conversationId)
    .single()

  if (conversationError || !conversation) {
    console.error('WHATSAPP_CONVERSATION_FETCH_ERROR:', conversationError)

    return {
      ok: false as const,
      error: 'Conversation not found',
      supabase,
      conversation: null,
      contact: null,
    }
  }

  const contact = normalizeRelation(
    conversation.contact as WhatsAppContactRelation | WhatsAppContactRelation[] | null
  )

  if (!contact?.phone) {
    return {
      ok: false as const,
      error: 'Conversation contact has no phone',
      supabase,
      conversation,
      contact,
    }
  }

  if (contact.blocked) {
    return {
      ok: false as const,
      error: 'Contact is blocked',
      supabase,
      conversation,
      contact,
    }
  }

  if (contact.opted_out) {
    return {
      ok: false as const,
      error: 'Contact opted out',
      supabase,
      conversation,
      contact,
    }
  }

  return {
    ok: true as const,
    supabase,
    conversation,
    contact,
  }
}

async function updateWhatsAppConversationActivity({
  supabase,
  conversationId,
  contactId,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>
  conversationId: string
  contactId: string
}) {
  const now = new Date().toISOString()

  await supabase
    .from('whatsapp_contacts')
    .update({
      last_outbound_at: now,
      last_message_at: now,
      updated_at: now,
    })
    .eq('id', contactId)

  await supabase
    .from('whatsapp_conversations')
    .update({
      last_message_at: now,
      updated_at: now,
    })
    .eq('id', conversationId)

  revalidatePath(`/admin/whatsapp/${conversationId}`)
  revalidatePath('/admin/whatsapp')
}


type WhatsAppReplyContext = {
  replyToMessageId: string | null
  replyToMetaMessageId: string | null
}

async function getWhatsAppReplyContext({
  supabase,
  conversationId,
  replyToMessageId,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>
  conversationId: string
  replyToMessageId?: string | null
}): Promise<WhatsAppReplyContext | null> {
  if (!replyToMessageId) return null

  const { data: quotedMessage, error: quotedMessageError } = await supabase
    .from('whatsapp_messages')
    .select('id, wamid, meta_message_id')
    .eq('id', replyToMessageId)
    .eq('conversation_id', conversationId)
    .maybeSingle()

  if (quotedMessageError) {
    console.error('WHATSAPP_REPLY_QUOTED_MESSAGE_FETCH_ERROR:', quotedMessageError)
    return null
  }

  const quotedMetaMessageId =
    quotedMessage?.wamid || quotedMessage?.meta_message_id || null

  if (!quotedMessage?.id || !quotedMetaMessageId) return null

  return {
    replyToMessageId: quotedMessage.id,
    replyToMetaMessageId: quotedMetaMessageId,
  }
}

function sanitizeStorageFilename(value: string | null | undefined) {
  const fallback = 'attachment'

  return (value || fallback)
    .trim()
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120) || fallback
}

async function uploadOutboundWhatsAppMediaPreview({
  supabase,
  conversationId,
  file,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>
  conversationId: string
  file: File
}) {
  const bucketName = process.env.SUPABASE_WHATSAPP_MEDIA_BUCKET || 'whatsapp-media'
  const safeFilename = sanitizeStorageFilename(file.name)
  const randomPart =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const storagePath = `outbound/${conversationId}/${Date.now()}-${randomPart}-${safeFilename}`
  const arrayBuffer = await file.arrayBuffer()

  const { error: storageUploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (storageUploadError) {
    console.error(
      'WHATSAPP_OUTBOUND_MEDIA_STORAGE_UPLOAD_ERROR:',
      storageUploadError
    )

    return {
      ok: false as const,
      error: 'فشل حفظ الملف في Supabase Storage. تأكد إن bucket whatsapp-media موجود.',
      mediaUrl: null,
      storagePath: null,
    }
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(storagePath)

  return {
    ok: true as const,
    error: null,
    mediaUrl: publicUrlData?.publicUrl ?? null,
    storagePath,
  }
}

export async function sendWhatsAppReplyAction(
  conversationId: string,
  messageBody: string,
  replyToMessageId?: string | null
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

    const conversationResult = await getConversationContact(conversationId)

    if (!conversationResult.ok) {
      return {
        ok: false,
        error: conversationResult.error,
      }
    }

    const { supabase, conversation, contact } = conversationResult

    const replyContext = await getWhatsAppReplyContext({
      supabase,
      conversationId: conversation.id,
      replyToMessageId,
    })

    const sendPayload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: contact.phone,
      type: 'text',
      text: {
        preview_url: false,
        body,
      },
    }

    if (replyContext?.replyToMetaMessageId) {
      sendPayload.context = {
        message_id: replyContext.replyToMetaMessageId,
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
        body: JSON.stringify(sendPayload),
      }
    )

    const data = await res.json().catch(() => ({}))

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
        reply_to_message_id: replyContext?.replyToMessageId ?? null,
        reply_to_meta_message_id: replyContext?.replyToMetaMessageId ?? null,
        raw_payload: {
          request: sendPayload,
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

    await updateWhatsAppConversationActivity({
      supabase,
      conversationId: conversation.id,
      contactId: contact.id,
    })

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

export async function sendWhatsAppMediaReplyAction(
  conversationId: string,
  formData: FormData
): Promise<SendWhatsAppMediaReplyResult> {
  try {
    if (!conversationId) {
      return {
        ok: false,
        error: 'Missing conversation ID',
      }
    }

    const fileValue = formData.get('file')
    const captionValue = formData.get('caption')
    const mediaHint = normalizeMediaHint(formData.get('media_type_hint'))

    if (!(fileValue instanceof File)) {
      return {
        ok: false,
        error: 'اختار ملف الأول.',
      }
    }

    const file = fileValue
    const caption = typeof captionValue === 'string' ? captionValue.trim() : ''
    const replyToMessageIdValue = formData.get('reply_to_message_id')
    const replyToMessageId =
      typeof replyToMessageIdValue === 'string' && replyToMessageIdValue.trim()
        ? replyToMessageIdValue.trim()
        : null

    if (file.size <= 0) {
      return {
        ok: false,
        error: 'الملف فاضي.',
      }
    }

    const mediaType = getWhatsAppMediaType(file, mediaHint)

    if (mediaType === 'sticker' && file.type !== 'image/webp') {
      return {
        ok: false,
        error: 'الاستيكر لازم يكون بصيغة WebP.',
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

    const conversationResult = await getConversationContact(conversationId)

    if (!conversationResult.ok) {
      return {
        ok: false,
        error: conversationResult.error,
      }
    }

    const { supabase, conversation, contact } = conversationResult

    const replyContext = await getWhatsAppReplyContext({
      supabase,
      conversationId: conversation.id,
      replyToMessageId,
    })

    const previewUpload = await uploadOutboundWhatsAppMediaPreview({
      supabase,
      conversationId: conversation.id,
      file,
    })

    if (!previewUpload.ok) {
      return {
        ok: false,
        error: previewUpload.error,
      }
    }

    const uploadFormData = new FormData()
    uploadFormData.append('messaging_product', 'whatsapp')
    uploadFormData.append('file', file, file.name || 'attachment')

    const uploadRes = await fetch(
      `https://graph.facebook.com/v25.0/${phoneNumberId}/media`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: uploadFormData,
      }
    )

    const uploadData = await uploadRes.json().catch(() => ({}))

    if (!uploadRes.ok) {
      console.error('WHATSAPP_MEDIA_UPLOAD_ERROR:', uploadData)

      return {
        ok: false,
        error:
          uploadData?.error?.message ||
          uploadData?.error?.error_user_msg ||
          'فشل رفع الملف إلى WhatsApp.',
      }
    }

    const mediaId = uploadData?.id

    if (!mediaId) {
      return {
        ok: false,
        error: 'WhatsApp did not return media ID.',
      }
    }

    const mediaObject: Record<string, unknown> = {
      id: mediaId,
    }

    if (
      caption &&
      (mediaType === 'image' ||
        mediaType === 'video' ||
        mediaType === 'document')
    ) {
      mediaObject.caption = caption
    }

    if (mediaType === 'document' && file.name) {
      mediaObject.filename = file.name
    }

    const sendPayload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: contact.phone,
      type: mediaType,
      [mediaType]: mediaObject,
    }

    if (replyContext?.replyToMetaMessageId) {
      sendPayload.context = {
        message_id: replyContext.replyToMetaMessageId,
      }
    }

    const sendRes = await fetch(
      `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendPayload),
      }
    )

    const sendData = await sendRes.json().catch(() => ({}))

    if (!sendRes.ok) {
      console.error('WHATSAPP_MEDIA_SEND_ERROR:', sendData)

      return {
        ok: false,
        error:
          sendData?.error?.message ||
          sendData?.error?.error_user_msg ||
          'فشل إرسال الملف على WhatsApp.',
      }
    }

    const metaMessageId = sendData?.messages?.[0]?.id ?? null

    const { error: messageInsertError } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversation.id,
        contact_id: contact.id,
        direction: 'outbound',
        meta_message_id: metaMessageId,
        wamid: metaMessageId,
        message_type: mediaType,
        body: caption || null,
        status: 'sent',
        media_id: mediaId,
        media_mime_type: file.type || null,
        media_filename: file.name || null,
        media_url: previewUpload.mediaUrl,
        media_storage_path: previewUpload.storagePath,
        media_file_size: file.size,
        reply_to_message_id: replyContext?.replyToMessageId ?? null,
        reply_to_meta_message_id: replyContext?.replyToMetaMessageId ?? null,
        raw_payload: {
          upload_response: uploadData,
          send_request: sendPayload,
          send_response: sendData,
        },
      })

    if (messageInsertError) {
      console.error('WHATSAPP_MEDIA_MESSAGE_INSERT_ERROR:', messageInsertError)

      return {
        ok: false,
        error: 'Media sent but failed to save in database',
      }
    }

    await updateWhatsAppConversationActivity({
      supabase,
      conversationId: conversation.id,
      contactId: contact.id,
    })

    return {
      ok: true,
    }
  } catch (error) {
    console.error('WHATSAPP_MEDIA_REPLY_ACTION_ERROR:', error)

    return {
      ok: false,
      error: 'Unexpected error',
    }
  }
}

export async function sendWhatsAppContactReplyAction(
  conversationId: string,
  contactName: string,
  contactPhone: string
): Promise<SendWhatsAppContactReplyResult> {
  try {
    const name = contactName.trim()
    const phone = contactPhone.trim()
    const waId = normalizeWhatsAppPhoneForContact(phone)

    if (!conversationId) {
      return {
        ok: false,
        error: 'Missing conversation ID',
      }
    }

    if (!name || !phone || !waId) {
      return {
        ok: false,
        error: 'اكتب اسم ورقم جهة الاتصال.',
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

    const conversationResult = await getConversationContact(conversationId)

    if (!conversationResult.ok) {
      return {
        ok: false,
        error: conversationResult.error,
      }
    }

    const { supabase, conversation, contact } = conversationResult

    const sendPayload = {
      messaging_product: 'whatsapp',
      to: contact.phone,
      type: 'contacts',
      contacts: [
        {
          name: {
            formatted_name: name,
            first_name: name,
          },
          phones: [
            {
              phone,
              wa_id: waId,
              type: 'CELL',
            },
          ],
        },
      ],
    }

    const sendRes = await fetch(
      `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendPayload),
      }
    )

    const sendData = await sendRes.json().catch(() => ({}))

    if (!sendRes.ok) {
      console.error('WHATSAPP_CONTACT_SEND_ERROR:', sendData)

      return {
        ok: false,
        error:
          sendData?.error?.message ||
          sendData?.error?.error_user_msg ||
          'فشل إرسال جهة الاتصال على WhatsApp.',
      }
    }

    const metaMessageId = sendData?.messages?.[0]?.id ?? null
    const body = `Contact: ${name} - ${phone}`

    const { error: messageInsertError } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversation.id,
        contact_id: contact.id,
        direction: 'outbound',
        meta_message_id: metaMessageId,
        wamid: metaMessageId,
        message_type: 'contacts',
        body,
        status: 'sent',
        raw_payload: {
          send_request: sendPayload,
          send_response: sendData,
        },
      })

    if (messageInsertError) {
      console.error(
        'WHATSAPP_CONTACT_MESSAGE_INSERT_ERROR:',
        messageInsertError
      )

      return {
        ok: false,
        error: 'Contact sent but failed to save in database',
      }
    }

    await updateWhatsAppConversationActivity({
      supabase,
      conversationId: conversation.id,
      contactId: contact.id,
    })

    return {
      ok: true,
    }
  } catch (error) {
    console.error('WHATSAPP_CONTACT_REPLY_ACTION_ERROR:', error)

    return {
      ok: false,
      error: 'Unexpected error',
    }
  }
}

export async function markWhatsAppConversationAsOwnerAction(
  conversationId: string
): Promise<MarkAsOwnerResult> {
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
        contact_id,
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
        'WHATSAPP_MARK_OWNER_CONVERSATION_FETCH_ERROR:',
        conversationError
      )

      return {
        ok: false,
        error: 'Conversation not found',
      }
    }

    const contact = normalizeRelation(
      conversation.contact as
        | { id: string; phone: string | null; display_name: string | null }
        | { id: string; phone: string | null; display_name: string | null }[]
        | null
    )
    const contactId = contact?.id || conversation.contact_id

    if (!contactId) {
      return {
        ok: false,
        error: 'Conversation has no contact',
      }
    }

    const now = new Date().toISOString()

    const { error: contactUpdateError } = await supabase
      .from('whatsapp_contacts')
      .update({
        contact_type: 'owner',
        updated_at: now,
      })
      .eq('id', contactId)

    if (contactUpdateError) {
      console.error(
        'WHATSAPP_MARK_OWNER_CONTACT_UPDATE_ERROR:',
        contactUpdateError
      )

      return {
        ok: false,
        error: 'Failed to mark contact as owner',
      }
    }

    const { error: conversationUpdateError } = await supabase
      .from('whatsapp_conversations')
      .update({
        conversation_type: 'owner_onboarding',
        updated_at: now,
      })
      .eq('id', conversation.id)

    if (conversationUpdateError) {
      console.error(
        'WHATSAPP_MARK_OWNER_CONVERSATION_UPDATE_ERROR:',
        conversationUpdateError
      )

      return {
        ok: false,
        error: 'Failed to update conversation type',
      }
    }

    revalidatePath(`/admin/whatsapp/${conversation.id}`)
    revalidatePath('/admin/whatsapp')

    return {
      ok: true,
    }
  } catch (error) {
    console.error('WHATSAPP_MARK_OWNER_ACTION_ERROR:', error)

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

    const contact = normalizeRelation(
      conversation.contact as
        | { id: string; phone: string | null; display_name: string | null }
        | { id: string; phone: string | null; display_name: string | null }[]
        | null
    )

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
      console.error('WHATSAPP_BOOKING_MESSAGE_LOOKUP_ERROR:', messageLookupError)
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

    const customerName = contact.display_name?.trim() || `WhatsApp ${contact.phone}`
    const propertyTitle = property.title_ar || property.title_en || property.property_id
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
