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

          const textBody =
            messageType === 'text'
              ? message?.text?.body ?? null
              : messageType === 'button'
                ? message?.button?.text ?? null
                : messageType === 'interactive'
                  ? message?.interactive?.button_reply?.title ??
                    message?.interactive?.list_reply?.title ??
                    null
                  : null

          const now = new Date().toISOString()

          const { data: contact, error: contactError } = await supabase
            .from('whatsapp_contacts')
            .upsert(
              {
                phone: waId,
                display_name: displayName,
                last_inbound_at: now,
                last_message_at: now,
                updated_at: now,
                metadata: {
                  last_raw_contact: contacts?.[0] ?? null,
                },
              },
              {
                onConflict: 'phone',
              }
            )
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

            const { error: conversationUpdateError } = await supabase
              .from('whatsapp_conversations')
              .update({
                last_message_at: now,
                updated_at: now,
              })
              .eq('id', conversationId)

            if (conversationUpdateError) {
              console.error(
                'WHATSAPP_CONVERSATION_UPDATE_ERROR:',
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
                'WHATSAPP_CONVERSATION_CREATE_ERROR:',
                conversationCreateError
              )
              continue
            }

            conversationId = newConversation.id
          }

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
              raw_payload: {
                entry,
                change,
                value,
                message,
                contact: contacts?.[0] ?? null,
              },
            })

          if (messageInsertError) {
            console.error('WHATSAPP_MESSAGE_INSERT_ERROR:', messageInsertError)
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