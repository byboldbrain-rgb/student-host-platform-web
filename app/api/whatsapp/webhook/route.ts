import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type LinkedProperty = {
  id: string
  property_id: string
  title_en: string | null
  title_ar: string | null
}

type WhatsAppMediaDownloadResult = {
  mediaId: string | null
  mediaUrl: string | null
  mediaStoragePath: string | null
  mediaMimeType: string | null
  mediaFilename: string | null
  mediaSha256: string | null
  mediaFileSize: number | null
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

type SupabaseAdminClient = ReturnType<typeof getSupabaseAdminClient>

function normalizeWhatsAppPhone(phone: string | null | undefined) {
  if (!phone) return null

  return phone.replace(/[^\d]/g, '')
}

function normalizeWhatsAppStatus(status: string | null | undefined) {
  if (
    status === 'sent' ||
    status === 'delivered' ||
    status === 'read' ||
    status === 'failed'
  ) {
    return status
  }

  return null
}

function extractPropertyPublicIdFromMessage(text: string | null | undefined) {
  if (!text) return null

  const patterns = [
    /Property\s*ID\s*:\s*(PROP-[A-Za-z0-9_-]+)/i,
    /Property\s*ID\s*[:：]\s*(PROP-[A-Za-z0-9_-]+)/i,
    /(PROP-[A-Za-z0-9_-]+)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)

    if (match?.[1]) {
      return match[1].trim()
    }
  }

  return null
}

function getTextBodyFromMessage(message: any, messageType: string) {
  if (messageType === 'text') {
    return message?.text?.body ?? null
  }

  if (messageType === 'button') {
    return message?.button?.text ?? null
  }

  if (messageType === 'interactive') {
    return (
      message?.interactive?.button_reply?.title ??
      message?.interactive?.list_reply?.title ??
      null
    )
  }

  if (messageType === 'image') {
    return message?.image?.caption ?? null
  }

  if (messageType === 'video') {
    return message?.video?.caption ?? null
  }

  if (messageType === 'document') {
    return message?.document?.caption ?? message?.document?.filename ?? null
  }

  if (messageType === 'audio') {
    return '[audio]'
  }

  if (messageType === 'sticker') {
    return '[sticker]'
  }

  return null
}

function getMediaObjectFromMessage(message: any, messageType: string) {
  if (messageType === 'image') return message?.image ?? null
  if (messageType === 'video') return message?.video ?? null
  if (messageType === 'document') return message?.document ?? null
  if (messageType === 'audio') return message?.audio ?? null
  if (messageType === 'sticker') return message?.sticker ?? null

  return null
}

function getExtensionFromMimeType(mimeType: string | null | undefined) {
  if (!mimeType) return 'bin'

  const normalized = mimeType.toLowerCase()

  if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg'
  if (normalized.includes('png')) return 'png'
  if (normalized.includes('webp')) return 'webp'
  if (normalized.includes('gif')) return 'gif'
  if (normalized.includes('mp4')) return 'mp4'
  if (normalized.includes('mpeg')) return 'mp3'
  if (normalized.includes('ogg')) return 'ogg'
  if (normalized.includes('pdf')) return 'pdf'
  if (normalized.includes('msword')) return 'doc'
  if (normalized.includes('officedocument.wordprocessingml')) return 'docx'
  if (normalized.includes('officedocument.spreadsheetml')) return 'xlsx'
  if (normalized.includes('spreadsheet')) return 'xlsx'
  if (normalized.includes('plain')) return 'txt'

  const subtype = normalized.split('/')[1]?.split(';')[0]

  return subtype || 'bin'
}

function sanitizeFilename(value: string | null | undefined) {
  if (!value) return null

  return value
    .trim()
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120)
}

function buildMediaStoragePath({
  messageId,
  mediaId,
  filename,
  mimeType,
}: {
  messageId: string | null
  mediaId: string
  filename: string | null
  mimeType: string | null
}) {
  const datePart = new Date().toISOString().slice(0, 10)
  const cleanFilename = sanitizeFilename(filename)
  const extension = getExtensionFromMimeType(mimeType)
  const randomPart =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  if (cleanFilename) {
    return `${datePart}/${messageId || mediaId}-${randomPart}-${cleanFilename}`
  }

  return `${datePart}/${messageId || mediaId}-${randomPart}.${extension}`
}

async function findLinkedPropertyFromMessage({
  supabase,
  textBody,
}: {
  supabase: SupabaseAdminClient
  textBody: string | null
}): Promise<LinkedProperty | null> {
  const propertyPublicId = extractPropertyPublicIdFromMessage(textBody)

  if (!propertyPublicId) {
    return null
  }

  const { data, error } = await supabase
    .from('properties')
    .select(
      `
      id,
      property_id,
      title_en,
      title_ar
    `
    )
    .eq('property_id', propertyPublicId)
    .maybeSingle()

  if (error) {
    console.error('WHATSAPP_LINKED_PROPERTY_LOOKUP_ERROR:', {
      propertyPublicId,
      error,
    })

    return null
  }

  if (!data) {
    console.warn('WHATSAPP_LINKED_PROPERTY_NOT_FOUND:', {
      propertyPublicId,
    })

    return null
  }

  return data as LinkedProperty
}

async function downloadAndStoreWhatsAppMedia({
  supabase,
  message,
  messageType,
}: {
  supabase: SupabaseAdminClient
  message: any
  messageType: string
}): Promise<WhatsAppMediaDownloadResult | null> {
  const accessToken = process.env.META_WA_ACCESS_TOKEN
  const bucketName = process.env.SUPABASE_WHATSAPP_MEDIA_BUCKET || 'whatsapp-media'

  if (!accessToken) {
    console.error('WHATSAPP_MEDIA_MISSING_ACCESS_TOKEN')
    return null
  }

  const mediaObject = getMediaObjectFromMessage(message, messageType)
  const mediaId = mediaObject?.id ?? null

  if (!mediaId) {
    return null
  }

  const fallbackMimeType = mediaObject?.mime_type ?? null
  const fallbackFilename =
    mediaObject?.filename ??
    mediaObject?.caption ??
    `${messageType}-${mediaId}.${getExtensionFromMimeType(fallbackMimeType)}`

  try {
    const metadataRes = await fetch(`https://graph.facebook.com/v25.0/${mediaId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const metadata = await metadataRes.json()

    if (!metadataRes.ok) {
      console.error('WHATSAPP_MEDIA_METADATA_FETCH_ERROR:', metadata)

      return {
        mediaId,
        mediaUrl: null,
        mediaStoragePath: null,
        mediaMimeType: fallbackMimeType,
        mediaFilename: fallbackFilename,
        mediaSha256: mediaObject?.sha256 ?? null,
        mediaFileSize: null,
      }
    }

    const mediaDownloadUrl = metadata?.url ?? null
    const mediaMimeType = metadata?.mime_type ?? fallbackMimeType
    const mediaSha256 = metadata?.sha256 ?? mediaObject?.sha256 ?? null
    const mediaFileSize = metadata?.file_size ? Number(metadata.file_size) : null
    const mediaFilename =
      fallbackFilename ||
      `${messageType}-${mediaId}.${getExtensionFromMimeType(mediaMimeType)}`

    if (!mediaDownloadUrl) {
      console.error('WHATSAPP_MEDIA_URL_MISSING:', metadata)

      return {
        mediaId,
        mediaUrl: null,
        mediaStoragePath: null,
        mediaMimeType,
        mediaFilename,
        mediaSha256,
        mediaFileSize,
      }
    }

    const fileRes = await fetch(mediaDownloadUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!fileRes.ok) {
      const errorText = await fileRes.text().catch(() => null)

      console.error('WHATSAPP_MEDIA_DOWNLOAD_ERROR:', {
        status: fileRes.status,
        statusText: fileRes.statusText,
        body: errorText,
      })

      return {
        mediaId,
        mediaUrl: null,
        mediaStoragePath: null,
        mediaMimeType,
        mediaFilename,
        mediaSha256,
        mediaFileSize,
      }
    }

    const arrayBuffer = await fileRes.arrayBuffer()
    const storagePath = buildMediaStoragePath({
      messageId: message?.id ?? null,
      mediaId,
      filename: mediaFilename,
      mimeType: mediaMimeType,
    })

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, arrayBuffer, {
        contentType: mediaMimeType || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('WHATSAPP_MEDIA_STORAGE_UPLOAD_ERROR:', uploadError)

      return {
        mediaId,
        mediaUrl: null,
        mediaStoragePath: null,
        mediaMimeType,
        mediaFilename,
        mediaSha256,
        mediaFileSize,
      }
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath)

    const publicUrl = publicUrlData?.publicUrl ?? null

    console.log('WHATSAPP_MEDIA_STORED:', {
      mediaId,
      storagePath,
      publicUrl,
      mimeType: mediaMimeType,
    })

    return {
      mediaId,
      mediaUrl: publicUrl,
      mediaStoragePath: storagePath,
      mediaMimeType,
      mediaFilename,
      mediaSha256,
      mediaFileSize,
    }
  } catch (error) {
    console.error('WHATSAPP_MEDIA_PROCESSING_ERROR:', error)

    return {
      mediaId,
      mediaUrl: null,
      mediaStoragePath: null,
      mediaMimeType: fallbackMimeType,
      mediaFilename: fallbackFilename,
      mediaSha256: mediaObject?.sha256 ?? null,
      mediaFileSize: null,
    }
  }
}

async function findQuotedMessageId({
  supabase,
  conversationId,
  replyToMetaMessageId,
}: {
  supabase: SupabaseAdminClient
  conversationId: string | null
  replyToMetaMessageId: string | null
}) {
  if (!conversationId || !replyToMetaMessageId) return null

  const { data: quotedMessage, error: quotedMessageError } = await supabase
    .from('whatsapp_messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .or(`wamid.eq.${replyToMetaMessageId},meta_message_id.eq.${replyToMetaMessageId}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (quotedMessageError) {
    console.error('WHATSAPP_QUOTED_MESSAGE_LOOKUP_ERROR:', quotedMessageError)
    return null
  }

  return quotedMessage?.id ?? null
}

async function markLatestClickIntentAsSent({
  supabase,
  linkedProperty,
  conversationId,
}: {
  supabase: SupabaseAdminClient
  linkedProperty: LinkedProperty
  conversationId: string
}) {
  const now = new Date().toISOString()

  const { data: latestIntentData, error: lookupError } = await supabase
    .from('whatsapp_click_intents')
    .select('id, property_id, property_public_id, status, created_at')
    .eq('property_public_id', linkedProperty.property_id)
    .eq('status', 'clicked')
    .is('linked_conversation_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lookupError) {
    console.error('WHATSAPP_CLICK_INTENT_LOOKUP_ERROR:', lookupError)
    return
  }

  const latestIntent = latestIntentData as {
    id: string
    property_id: string | null
    property_public_id: string | null
    status: string
    created_at: string
  } | null

  if (!latestIntent?.id) {
    console.log('WHATSAPP_CLICK_INTENT_NO_MATCH:', {
      propertyId: linkedProperty.id,
      propertyPublicId: linkedProperty.property_id,
      conversationId,
    })

    return
  }

  const { data: updatedIntent, error: updateError } = await supabase
    .from('whatsapp_click_intents')
    .update({
      status: 'sent',
      linked_conversation_id: conversationId,
      updated_at: now,
    })
    .eq('id', latestIntent.id)
    .select('id, status, linked_conversation_id')
    .single()

  if (updateError) {
    console.error('WHATSAPP_CLICK_INTENT_UPDATE_ERROR:', updateError)
    return
  }

  console.log('WHATSAPP_CLICK_INTENT_LINKED:', {
    clickIntentId: latestIntent.id,
    updatedIntent,
    conversationId,
    propertyPublicId: linkedProperty.property_id,
  })
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  const verifyToken = process.env.META_WA_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.log('WHATSAPP_WEBHOOK_PAYLOAD:', JSON.stringify(body, null, 2))

    const supabase = getSupabaseAdminClient()
    const entries = body?.entry ?? []

    for (const entry of entries) {
      const changes = entry?.changes ?? []

      for (const change of changes) {
        const value = change?.value
        const messages = value?.messages ?? []
        const contacts = value?.contacts ?? []
        const statuses = value?.statuses ?? []

        for (const message of messages) {
          const waId =
            normalizeWhatsAppPhone(message?.from) ||
            normalizeWhatsAppPhone(contacts?.[0]?.wa_id)

          if (!waId) {
            console.warn('WHATSAPP_WEBHOOK_SKIPPED_NO_PHONE:', message)
            continue
          }

          const displayName = contacts?.[0]?.profile?.name ?? null
          const messageType = message?.type ?? 'unknown'
          const textBody = getTextBodyFromMessage(message, messageType)
          const replyToMetaMessageId = message?.context?.id ?? null

          const linkedProperty = await findLinkedPropertyFromMessage({
            supabase,
            textBody,
          })

          const mediaResult = await downloadAndStoreWhatsAppMedia({
            supabase,
            message,
            messageType,
          })

          const now = new Date().toISOString()

          const contactPayload: Record<string, unknown> = {
            phone: waId,
            display_name: displayName,
            last_inbound_at: now,
            last_message_at: now,
            updated_at: now,
            metadata: {
              last_raw_contact: contacts?.[0] ?? null,
            },
          }

          if (linkedProperty) {
            contactPayload.contact_type = 'student'
          }

          const { data: contact, error: contactError } = await supabase
            .from('whatsapp_contacts')
            .upsert(contactPayload, {
              onConflict: 'phone',
            })
            .select('id')
            .single()

          if (contactError || !contact) {
            console.error('WHATSAPP_CONTACT_UPSERT_ERROR:', contactError)
            continue
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
              'WHATSAPP_CONVERSATION_LOOKUP_ERROR:',
              conversationLookupError
            )
          }

          if (existingConversation?.id) {
            conversationId = existingConversation.id

            const conversationUpdatePayload: Record<string, unknown> = {
              last_message_at: now,
              updated_at: now,
            }

            if (linkedProperty) {
              conversationUpdatePayload.conversation_type = 'student_booking'
              conversationUpdatePayload.related_property_id = linkedProperty.id
            }

            const { error: conversationUpdateError } = await supabase
              .from('whatsapp_conversations')
              .update(conversationUpdatePayload)
              .eq('id', conversationId)

            if (conversationUpdateError) {
              console.error(
                'WHATSAPP_CONVERSATION_UPDATE_ERROR:',
                conversationUpdateError
              )
            }
          } else {
            const conversationCreatePayload: Record<string, unknown> = {
              contact_id: contact.id,
              status: 'open',
              conversation_type: linkedProperty ? 'student_booking' : 'general',
              last_message_at: now,
            }

            if (linkedProperty) {
              conversationCreatePayload.related_property_id = linkedProperty.id
            }

            const { data: newConversation, error: conversationCreateError } =
              await supabase
                .from('whatsapp_conversations')
                .insert(conversationCreatePayload)
                .select('id')
                .single()

            if (conversationCreateError || !newConversation) {
              console.error(
                'WHATSAPP_CONVERSATION_CREATE_ERROR:',
                conversationCreateError
              )
              continue
            }

            conversationId = newConversation.id
          }

          const replyToMessageId = await findQuotedMessageId({
            supabase,
            conversationId,
            replyToMetaMessageId,
          })

          const { error: messageInsertError } = await supabase
            .from('whatsapp_messages')
            .insert({
              conversation_id: conversationId,
              contact_id: contact.id,
              direction: 'inbound',
              meta_message_id: message?.id ?? null,
              wamid: message?.id ?? null,
              message_type: messageType,
              body: textBody,
              status: 'received',
              media_id: mediaResult?.mediaId ?? null,
              media_mime_type: mediaResult?.mediaMimeType ?? null,
              media_filename: mediaResult?.mediaFilename ?? null,
              media_url: mediaResult?.mediaUrl ?? null,
              media_storage_path: mediaResult?.mediaStoragePath ?? null,
              media_sha256: mediaResult?.mediaSha256 ?? null,
              media_file_size: mediaResult?.mediaFileSize ?? null,
              reply_to_message_id: replyToMessageId,
              reply_to_meta_message_id: replyToMetaMessageId,
              raw_payload: {
                entry,
                change,
                value,
                message,
                contact: contacts?.[0] ?? null,
                linked_property: linkedProperty,
                media: mediaResult,
                reply_to_meta_message_id: replyToMetaMessageId,
                reply_to_message_id: replyToMessageId,
              },
            })

          if (messageInsertError) {
            console.error('WHATSAPP_MESSAGE_INSERT_ERROR:', messageInsertError)
          }

          if (linkedProperty && conversationId) {
            await markLatestClickIntentAsSent({
              supabase,
              linkedProperty,
              conversationId,
            })

            console.log('WHATSAPP_STUDENT_BOOKING_LINKED:', {
              conversationId,
              propertyPublicId: linkedProperty.property_id,
              propertyId: linkedProperty.id,
              waId,
            })
          }
        }

        for (const statusEvent of statuses) {
          const wamid = statusEvent?.id ?? null
          const rawStatus = statusEvent?.status ?? null
          const normalizedStatus = normalizeWhatsAppStatus(rawStatus)
          const error = statusEvent?.errors?.[0] ?? null

          if (!wamid || !normalizedStatus) {
            console.warn('WHATSAPP_STATUS_SKIPPED:', statusEvent)
            continue
          }

          const { error: statusUpdateError } = await supabase
            .from('whatsapp_messages')
            .update({
              status: normalizedStatus,
              error_code: error?.code ? String(error.code) : null,
              error_message: error?.message ?? error?.title ?? null,
            })
            .or(`wamid.eq.${wamid},meta_message_id.eq.${wamid}`)

          if (statusUpdateError) {
            console.error('WHATSAPP_STATUS_UPDATE_ERROR:', statusUpdateError)
          } else {
            console.log('WHATSAPP_STATUS_UPDATED:', {
              wamid,
              status: normalizedStatus,
            })
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('WHATSAPP_WEBHOOK_ERROR:', error)

    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
