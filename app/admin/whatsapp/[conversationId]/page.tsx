import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import ReplyBox from './ReplyBox'
import CreateBookingRequestButton from './CreateBookingRequestButton'
import MarkAsOwnerButton from './MarkAsOwnerButton'

type WhatsAppContact = {
  id: string
  phone: string
  display_name: string | null
  contact_type: string
  opted_out: boolean
  blocked: boolean
}

type RelatedProperty = {
  id: string
  property_id: string
  title_en: string | null
  title_ar: string | null
  price_egp: number | null
  admin_status: string | null
  availability_status: string | null
}

type WhatsAppMessage = {
  id: string
  direction: 'inbound' | 'outbound'
  message_type: string
  body: string | null
  status: string | null
  error_code: string | null
  error_message: string | null
  media_id: string | null
  media_mime_type: string | null
  media_filename: string | null
  media_url: string | null
  media_storage_path: string | null
  media_file_size: number | null
  created_at: string
}

type WhatsAppConversation = {
  id: string
  status: string
  conversation_type: string
  related_property_id: string | null
  last_message_at: string | null
  created_at: string
  contact: WhatsAppContact | null
  related_property: RelatedProperty | null
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

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation
}

async function getExistingBookingRequestId({
  supabase,
  conversationId,
  propertyId,
  contactPhone,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>
  conversationId: string
  propertyId: string | null
  contactPhone: string | null
}) {
  const { data: linkedClickIntent, error: linkedClickIntentError } =
    await supabase
      .from('whatsapp_click_intents')
      .select('linked_booking_request_id')
      .eq('linked_conversation_id', conversationId)
      .not('linked_booking_request_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

  if (linkedClickIntentError) {
    console.error(
      'WHATSAPP_EXISTING_BOOKING_CLICK_INTENT_ERROR:',
      linkedClickIntentError
    )
  }

  if (linkedClickIntent?.linked_booking_request_id) {
    return linkedClickIntent.linked_booking_request_id as string
  }

  if (!propertyId || !contactPhone) {
    return null
  }

  const { data: existingBookingRequest, error: existingBookingRequestError } =
    await supabase
      .from('property_booking_requests')
      .select('id')
      .eq('property_id', propertyId)
      .eq('customer_whatsapp', contactPhone)
      .in('status', ['new', 'contacted', 'in_progress', 'converted'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

  if (existingBookingRequestError) {
    console.error(
      'WHATSAPP_EXISTING_BOOKING_REQUEST_ERROR:',
      existingBookingRequestError
    )
  }

  return existingBookingRequest?.id ?? null
}

async function getConversation(conversationId: string) {
  const supabase = getSupabaseAdminClient()

  const { data: conversationData, error: conversationError } = await supabase
    .from('whatsapp_conversations')
    .select(
      `
      id,
      status,
      conversation_type,
      related_property_id,
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
      related_property:properties (
        id,
        property_id,
        title_en,
        title_ar,
        price_egp,
        admin_status,
        availability_status
      )
    `
    )
    .eq('id', conversationId)
    .single()

  if (conversationError || !conversationData) {
    console.error('WHATSAPP_CONVERSATION_PAGE_FETCH_ERROR:', conversationError)
    throw new Error('Failed to fetch WhatsApp conversation')
  }

  const { data: messagesData, error: messagesError } = await supabase
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
      media_url,
      media_storage_path,
      media_file_size,
      created_at
    `
    )
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (messagesError) {
    console.error('WHATSAPP_CONVERSATION_PAGE_MESSAGES_ERROR:', messagesError)
    throw new Error('Failed to fetch WhatsApp messages')
  }

  const contact = normalizeRelation(conversationData.contact)
  const relatedProperty = normalizeRelation(conversationData.related_property)

  const conversation: WhatsAppConversation = {
    id: conversationData.id,
    status: conversationData.status,
    conversation_type: conversationData.conversation_type,
    related_property_id: conversationData.related_property_id,
    last_message_at: conversationData.last_message_at,
    created_at: conversationData.created_at,
    contact,
    related_property: relatedProperty,
  }

  const existingBookingRequestId = await getExistingBookingRequestId({
    supabase,
    conversationId: conversation.id,
    propertyId: conversation.related_property_id,
    contactPhone: contact?.phone ?? null,
  })

  return {
    conversation,
    messages: (messagesData ?? []) as WhatsAppMessage[],
    existingBookingRequestId,
  }
}

function formatDate(value: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatPrice(value: number | null) {
  if (value === null || value === undefined) return '—'

  return `${new Intl.NumberFormat('en-US').format(value)} EGP`
}

function formatFileSize(value: number | null) {
  if (!value || Number.isNaN(value)) return null

  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`

  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function getPropertyTitle(property: RelatedProperty | null) {
  if (!property) return 'Unknown property'

  return property.title_ar || property.title_en || property.property_id
}

function getConversationTypeBadgeClass(type: string) {
  if (type === 'student_booking') {
    return 'bg-blue-50 text-blue-700'
  }

  if (type === 'owner_onboarding') {
    return 'bg-green-50 text-green-700'
  }

  return 'bg-gray-100 text-gray-700'
}

function isImageMessage(message: WhatsAppMessage) {
  return (
    message.message_type === 'image' ||
    Boolean(message.media_mime_type?.startsWith('image/'))
  )
}

function isVideoMessage(message: WhatsAppMessage) {
  return (
    message.message_type === 'video' ||
    Boolean(message.media_mime_type?.startsWith('video/'))
  )
}

function isAudioMessage(message: WhatsAppMessage) {
  return (
    message.message_type === 'audio' ||
    Boolean(message.media_mime_type?.startsWith('audio/'))
  )
}

function MediaPreview({
  message,
  isOutbound,
}: {
  message: WhatsAppMessage
  isOutbound: boolean
}) {
  const mediaUrl = message.media_url
  const fileSize = formatFileSize(message.media_file_size)
  const filename =
    message.media_filename ||
    message.media_mime_type ||
    `[${message.message_type}]`

  if (!mediaUrl) {
    if (!message.media_id) return null

    return (
      <div
        className={[
          'mb-2 rounded-xl border p-3 text-xs',
          isOutbound
            ? 'border-white/20 bg-white/10 text-white'
            : 'border-gray-200 bg-white text-gray-700',
        ].join(' ')}
      >
        <div className="font-medium">{filename}</div>
        <div className={isOutbound ? 'text-gray-300' : 'text-gray-500'}>
          Media received but preview URL is not available.
        </div>
      </div>
    )
  }

  if (isImageMessage(message)) {
    return (
      <a
        href={mediaUrl}
        target="_blank"
        rel="noreferrer"
        className="mb-2 block overflow-hidden rounded-xl"
      >
        <img
          src={mediaUrl}
          alt={filename}
          className="max-h-[360px] w-full max-w-[360px] rounded-xl object-cover"
        />
      </a>
    )
  }

  if (isVideoMessage(message)) {
    return (
      <div className="mb-2 overflow-hidden rounded-xl">
        <video
          src={mediaUrl}
          controls
          className="max-h-[360px] w-full max-w-[420px] rounded-xl"
        />
      </div>
    )
  }

  if (isAudioMessage(message)) {
    return (
      <div className="mb-2">
        <audio src={mediaUrl} controls className="w-full max-w-[360px]" />
      </div>
    )
  }

  return (
    <a
      href={mediaUrl}
      target="_blank"
      rel="noreferrer"
      className={[
        'mb-2 block rounded-xl border p-3 text-sm transition',
        isOutbound
          ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
          : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50',
      ].join(' ')}
    >
      <div className="font-semibold">Open file</div>
      <div
        className={
          isOutbound ? 'text-xs text-gray-300' : 'text-xs text-gray-500'
        }
      >
        {filename}
        {fileSize ? ` · ${fileSize}` : ''}
      </div>
    </a>
  )
}

export default async function WhatsAppConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const { conversation, messages, existingBookingRequestId } =
    await getConversation(conversationId)

  const contact = conversation.contact
  const relatedProperty = conversation.related_property
  const isOwnerConversation =
    conversation.conversation_type === 'owner_onboarding' ||
    contact?.contact_type === 'owner'

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/whatsapp"
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Back to WhatsApp Inbox
          </Link>

          <h1 className="mt-3 text-2xl font-bold">
            {contact?.display_name || contact?.phone || 'Unknown contact'}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {contact?.phone || '—'} · {contact?.contact_type || 'unknown'} ·{' '}
            {conversation.status}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">Conversation Details</h2>

            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium',
                  getConversationTypeBadgeClass(conversation.conversation_type),
                ].join(' ')}
              >
                {conversation.conversation_type}
              </span>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                {conversation.status}
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Last activity: {formatDate(conversation.last_message_at)}
          </div>
        </div>
      </section>

      <MarkAsOwnerButton
        conversationId={conversation.id}
        isOwnerConversation={isOwnerConversation}
      />

      {relatedProperty ? (
        <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                Linked Property
              </div>

              <h2 className="mt-2 text-lg font-bold text-gray-950">
                {getPropertyTitle(relatedProperty)}
              </h2>

              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="rounded-full bg-white px-3 py-1">
                  {relatedProperty.property_id}
                </span>

                <span className="rounded-full bg-white px-3 py-1">
                  {formatPrice(relatedProperty.price_egp)}
                </span>

                <span className="rounded-full bg-white px-3 py-1">
                  {relatedProperty.availability_status || 'unknown'}
                </span>

                <span className="rounded-full bg-white px-3 py-1">
                  {relatedProperty.admin_status || 'unknown'}
                </span>
              </div>
            </div>

            <Link
              href={`/properties/${relatedProperty.property_id}`}
              className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Open property
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed bg-white p-4">
          <div className="text-sm text-gray-500">
            No property linked to this conversation yet.
          </div>
        </section>
      )}

      {relatedProperty ? (
        <CreateBookingRequestButton
          conversationId={conversation.id}
          existingBookingRequestId={existingBookingRequestId}
        />
      ) : null}

      <section className="rounded-2xl border bg-white p-4">
        <div className="mb-4 border-b pb-3">
          <h2 className="font-semibold">Messages</h2>
          <p className="text-sm text-gray-500">
            Last activity: {formatDate(conversation.last_message_at)}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {messages.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
              No messages in this conversation yet.
            </div>
          ) : (
            messages.map((message) => {
              const isOutbound = message.direction === 'outbound'

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isOutbound ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                      isOutbound
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <MediaPreview message={message} isOutbound={isOutbound} />

                    {message.body ? (
                      <div className="whitespace-pre-wrap">{message.body}</div>
                    ) : !message.media_url ? (
                      <div className="whitespace-pre-wrap">
                        [{message.message_type}]
                      </div>
                    ) : null}

                    <div
                      className={`mt-2 text-[11px] ${
                        isOutbound ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      {formatDate(message.created_at)}
                      {message.status ? ` · ${message.status}` : ''}
                      {message.media_mime_type
                        ? ` · ${message.media_mime_type}`
                        : ''}
                    </div>

                    {message.error_message ? (
                      <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">
                        {message.error_message}
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      <ReplyBox
        conversationId={conversation.id}
        conversationType={conversation.conversation_type}
      />
    </main>
  )
}