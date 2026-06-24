import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import ReplyBox from './ReplyBox'

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
      created_at
    `
    )
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (messagesError) {
    console.error('WHATSAPP_CONVERSATION_PAGE_MESSAGES_ERROR:', messagesError)
    throw new Error('Failed to fetch WhatsApp messages')
  }

  const conversation: WhatsAppConversation = {
    id: conversationData.id,
    status: conversationData.status,
    conversation_type: conversationData.conversation_type,
    related_property_id: conversationData.related_property_id,
    last_message_at: conversationData.last_message_at,
    created_at: conversationData.created_at,
    contact: normalizeRelation(conversationData.contact),
    related_property: normalizeRelation(conversationData.related_property),
  }

  return {
    conversation,
    messages: (messagesData ?? []) as WhatsAppMessage[],
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

export default async function WhatsAppConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const { conversation, messages } = await getConversation(conversationId)

  const contact = conversation.contact
  const relatedProperty = conversation.related_property

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
                    <div className="whitespace-pre-wrap">
                      {message.body || `[${message.message_type}]`}
                    </div>

                    <div
                      className={`mt-2 text-[11px] ${
                        isOutbound ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      {formatDate(message.created_at)}
                      {message.status ? ` · ${message.status}` : ''}
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

      <ReplyBox conversationId={conversation.id} />
    </main>
  )
}