import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import ReplyBox from './ReplyBox'
import CreateBookingRequestButton from './CreateBookingRequestButton'
import MarkAsOwnerButton from './MarkAsOwnerButton'
import WhatsAppRealtimeBridge from './WhatsAppRealtimeBridge'
import EnableWhatsappNotificationsButton from '../EnableWhatsappNotificationsButton'

export const dynamic = 'force-dynamic'

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

type WhatsAppQuotedMessage = {
  id: string
  direction: 'inbound' | 'outbound'
  message_type: string
  body: string | null
  media_filename: string | null
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
  reply_to_message_id: string | null
  reply_to_meta_message_id: string | null
  reply_to_message?: WhatsAppQuotedMessage | null
  created_at: string
}

type WhatsAppListMessage = {
  id: string
  direction: 'inbound' | 'outbound'
  message_type: string
  body: string | null
  status: string | null
  created_at: string
}

type WhatsAppConversationListItem = {
  id: string
  status: string
  conversation_type: string
  last_message_at: string | null
  created_at: string
  contact: WhatsAppContact | null
  last_message: WhatsAppListMessage | null
  messages: WhatsAppListMessage[]
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

type ConversationFilter = 'all' | 'unread' | 'open' | 'owners' | 'students'

type SearchParams = {
  q?: string | string[]
  filter?: string | string[]
  replyTo?: string | string[]
}

const navientyChatPattern = {
  backgroundColor: '#F8FBFF',
  backgroundImage:
    "linear-gradient(rgba(248, 251, 255, 0.78), rgba(248, 251, 255, 0.78)), url('https://i.ibb.co/W4YtBrdH/Chat-GPT-Image-Jun-24-2026-08-05-08-PM.png')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
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

async function getWhatsAppConversations() {
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
    console.error('WHATSAPP_INBOX_SUPABASE_ERROR:', error)
    throw new Error('Failed to fetch WhatsApp conversations')
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

      const contact = Array.isArray(conversation.contact)
        ? conversation.contact[0] ?? null
        : conversation.contact ?? null

      return {
        id: conversation.id,
        status: conversation.status,
        conversation_type: conversation.conversation_type,
        last_message_at: conversation.last_message_at,
        created_at: conversation.created_at,
        contact,
        last_message: sortedMessages[0] ?? null,
        messages: sortedMessages.slice(0, 5),
      } as WhatsAppConversationListItem
    }) ?? []

  return conversations
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
      reply_to_message_id,
      reply_to_meta_message_id,
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

  const rawMessages = (messagesData ?? []) as WhatsAppMessage[]
  const messageById = new Map(
    rawMessages.map((message) => [message.id, message])
  )

  const messages = rawMessages.map((message) => ({
    ...message,
    reply_to_message: message.reply_to_message_id
      ? messageById.get(message.reply_to_message_id) ?? null
      : null,
  }))

  return {
    conversation,
    messages,
    existingBookingRequestId,
  }
}

function getSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

function getActiveFilter(
  value: string | string[] | undefined
): ConversationFilter {
  const rawValue = getSingleSearchParam(value)

  if (
    rawValue === 'unread' ||
    rawValue === 'open' ||
    rawValue === 'owners' ||
    rawValue === 'students'
  ) {
    return rawValue
  }

  return 'all'
}

function formatDate(value: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatMessageTime(value: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatListTime(value: string | null) {
  if (!value) return '—'

  const date = new Date(value)
  const now = new Date()

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()

  if (sameDay) {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  if (isYesterday) return 'Yesterday'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
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
    return 'bg-blue-50 text-blue-700 ring-blue-100'
  }

  if (type === 'owner_onboarding') {
    return 'bg-indigo-50 text-indigo-700 ring-indigo-100'
  }

  return 'bg-slate-100 text-slate-700 ring-slate-200'
}

function getContactName(contact: WhatsAppContact | null) {
  return contact?.display_name || contact?.phone || 'Unknown contact'
}

function getContactPhone(contact: WhatsAppContact | null) {
  return contact?.phone || '—'
}

function getLastMessagePreview(message: WhatsAppListMessage | null) {
  if (!message) return 'No messages yet'

  if (message.body) {
    return message.direction === 'outbound'
      ? `You: ${message.body}`
      : message.body
  }

  return `[${message.message_type}]`
}

function needsReply(conversation: WhatsAppConversationListItem) {
  return conversation.last_message?.direction === 'inbound'
}

function conversationMatchesSearch(
  conversation: WhatsAppConversationListItem,
  searchQuery: string
) {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  if (!normalizedQuery) return true

  const contact = conversation.contact
  const lastMessage = conversation.last_message

  const searchableText = [
    contact?.display_name,
    contact?.phone,
    contact?.contact_type,
    conversation.status,
    conversation.conversation_type,
    lastMessage?.body,
    lastMessage?.status,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return searchableText.includes(normalizedQuery)
}

function filterConversations({
  conversations,
  searchQuery,
  activeFilter,
}: {
  conversations: WhatsAppConversationListItem[]
  searchQuery: string
  activeFilter: ConversationFilter
}) {
  return conversations.filter((conversation) => {
    if (!conversationMatchesSearch(conversation, searchQuery)) {
      return false
    }

    const contactType = conversation.contact?.contact_type
    const conversationType = conversation.conversation_type

    if (activeFilter === 'unread') {
      return needsReply(conversation)
    }

    if (activeFilter === 'open') {
      return conversation.status === 'open'
    }

    if (activeFilter === 'owners') {
      return contactType === 'owner' || conversationType === 'owner_onboarding'
    }

    if (activeFilter === 'students') {
      return contactType === 'student' || conversationType === 'student_booking'
    }

    return true
  })
}

function buildConversationHref({
  conversationId,
  searchQuery,
  activeFilter,
}: {
  conversationId: string
  searchQuery: string
  activeFilter: ConversationFilter
}) {
  const params = new URLSearchParams()

  if (activeFilter !== 'all') {
    params.set('filter', activeFilter)
  }

  if (searchQuery.trim()) {
    params.set('q', searchQuery.trim())
  }

  const queryString = params.toString()

  return queryString
    ? `/admin/whatsapp/${conversationId}?${queryString}`
    : `/admin/whatsapp/${conversationId}`
}

function buildReplyHref({
  conversationId,
  messageId,
  searchQuery,
  activeFilter,
}: {
  conversationId: string
  messageId: string
  searchQuery: string
  activeFilter: ConversationFilter
}) {
  const params = new URLSearchParams()

  if (activeFilter !== 'all') {
    params.set('filter', activeFilter)
  }

  if (searchQuery.trim()) {
    params.set('q', searchQuery.trim())
  }

  params.set('replyTo', messageId)

  return `/admin/whatsapp/${conversationId}?${params.toString()}`
}

function buildCancelReplyHref({
  conversationId,
  searchQuery,
  activeFilter,
}: {
  conversationId: string
  searchQuery: string
  activeFilter: ConversationFilter
}) {
  return buildConversationHref({
    conversationId,
    searchQuery,
    activeFilter,
  })
}

function getQuotedMessagePreview(
  message: WhatsAppQuotedMessage | null | undefined
) {
  if (!message) return ''

  return message.body || message.media_filename || `[${message.message_type}]`
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

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m21 21-4.35-4.35M10.8 18.1a7.3 7.3 0 1 1 0-14.6 7.3 7.3 0 0 1 0 14.6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M6.6 18.5 3.5 21V6.8A3.8 3.8 0 0 1 7.3 3h9.4a3.8 3.8 0 0 1 3.8 3.8v7.9a3.8 3.8 0 0 1-3.8 3.8H6.6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 9.2h8M8 13h5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M20 12a8 8 0 1 1-2.34-5.66M20 4.5v5h-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M15 6 9 12l6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StudentIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 12.25a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M4.75 20.25c.8-3.35 3.35-5.25 7.25-5.25s6.45 1.9 7.25 5.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8.75 5.75 12 4l3.25 1.75L12 7.5 8.75 5.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function OwnerIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 10.75 12 4l8 6.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.25 10.25V20h11.5v-9.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 20v-5.5h5V20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function NavientyRail({
  activeFilter,
}: {
  activeFilter: ConversationFilter
}) {
  const railItems = [
    {
      label: 'Inbox',
      href: '/admin/whatsapp',
      icon: <MessageIcon />,
      active: activeFilter === 'all',
    },
    {
      label: 'Students',
      href: '/admin/whatsapp?filter=students',
      icon: <StudentIcon />,
      active: activeFilter === 'students',
    },
    {
      label: 'Owners',
      href: '/admin/whatsapp?filter=owners',
      icon: <OwnerIcon />,
      active: activeFilter === 'owners',
    },
  ]

  return (
    <aside className="hidden w-[72px] shrink-0 flex-col items-center justify-between border-r border-blue-100 bg-[#F7FAFF] py-4 lg:flex">
      <div className="flex flex-col items-center gap-4">
        <Link
          href="/admin/whatsapp"
          className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg shadow-blue-500/15 ring-1 ring-blue-100 transition hover:shadow-blue-500/25"
          title="Navienty WhatsApp Inbox"
        >
          <img
            src="https://i.ibb.co/7NVrNvxd/Untitled.png"
            alt="Navienty logo"
            className="h-full w-full object-contain"
            draggable={false}
          />
        </Link>

        <div className="mt-2 flex flex-col gap-2">
          {railItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={[
                'flex h-11 w-11 items-center justify-center rounded-2xl transition',
                item.active
                  ? 'bg-[#0B55FF] text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-500 hover:bg-blue-50 hover:text-[#0B55FF]',
              ].join(' ')}
              title={item.label}
            >
              {item.icon}
              <span className="sr-only">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  )
}

function ConversationSidebar({
  conversations,
  totalCount,
  activeConversationId,
  searchQuery,
  activeFilter,
  basePath,
  className = '',
}: {
  conversations: WhatsAppConversationListItem[]
  totalCount: number
  activeConversationId: string
  searchQuery: string
  activeFilter: ConversationFilter
  basePath: string
  className?: string
}) {
  return (
    <aside
      className={[
        'flex h-full w-full min-w-0 flex-col border-r border-blue-100 bg-white md:w-[390px] md:shrink-0 xl:w-[420px]',
        className,
      ].join(' ')}
    >
      <div className="border-b border-blue-100 bg-white px-4 pb-4 pt-5">
        <div className="mb-4">
          <h1 className="text-2xl font-black tracking-tight text-slate-950">
            Navienty
          </h1>
        </div>

        <form action={basePath} className="relative">
          {activeFilter !== 'all' ? (
            <input type="hidden" name="filter" value={activeFilter} />
          ) : null}

          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </div>

          <input
            name="q"
            defaultValue={searchQuery}
            placeholder="Search or start a new chat"
            className="h-12 w-full rounded-full border border-transparent bg-[#F3F7FF] pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
        </form>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        {conversations.length === 0 ? (
          <div className="mx-4 mt-6 rounded-3xl border border-dashed border-blue-200 bg-blue-50/40 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0B55FF] shadow-sm">
              <MessageIcon />
            </div>

            <h2 className="font-bold text-slate-950">
              No conversations found
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              جرّب تغيير البحث. أي رسائل جديدة من WhatsApp API هتظهر هنا.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {conversations.map((conversation) => {
              const contact = conversation.contact
              const lastMessage = conversation.last_message
              const isActive = conversation.id === activeConversationId
              const hasUnreadSignal = needsReply(conversation)

              return (
                <Link
                  key={conversation.id}
                  href={buildConversationHref({
                    conversationId: conversation.id,
                    searchQuery,
                    activeFilter,
                  })}
                  className={[
                    'group relative block px-4 py-3 transition',
                    isActive
                      ? 'bg-[#EAF2FF]'
                      : 'bg-white hover:bg-[#F8FBFF]',
                  ].join(' ')}
                >
                  <div className="min-w-0">
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[15px] font-black text-slate-950"
                          dir="auto"
                        >
                          {getContactName(contact)}
                        </div>

                        <div
                          className="mt-0.5 truncate text-xs font-semibold text-slate-500"
                          dir="ltr"
                        >
                          {getContactPhone(contact)}
                        </div>
                      </div>

                      <div className="shrink-0 text-xs font-semibold text-slate-400">
                        {formatListTime(conversation.last_message_at)}
                      </div>
                    </div>

                    <p
                      className={[
                        'truncate text-sm',
                        hasUnreadSignal
                          ? 'font-semibold text-slate-900'
                          : 'text-slate-500',
                      ].join(' ')}
                      dir="auto"
                    >
                      {getLastMessagePreview(lastMessage)}
                    </p>
                  </div>

                  {isActive ? (
                    <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-[#0B55FF]" />
                  ) : null}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </aside>
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
          'mb-2 rounded-2xl border p-3 text-xs',
          isOutbound
            ? 'border-blue-100 bg-white/60 text-slate-700'
            : 'border-slate-200 bg-slate-50 text-slate-700',
        ].join(' ')}
      >
        <div className="font-bold">{filename}</div>
        <div className="mt-1 text-slate-500">
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
        className="mb-2 block overflow-hidden rounded-2xl"
      >
        <img
          src={mediaUrl}
          alt={filename}
          className="max-h-[360px] w-full max-w-[360px] rounded-2xl object-cover shadow-sm"
        />
      </a>
    )
  }

  if (isVideoMessage(message)) {
    return (
      <div className="mb-2 overflow-hidden rounded-2xl">
        <video
          src={mediaUrl}
          controls
          className="max-h-[360px] w-full max-w-[420px] rounded-2xl"
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
        'mb-2 block rounded-2xl border p-3 text-sm transition',
        isOutbound
          ? 'border-blue-100 bg-white/60 text-slate-900 hover:bg-white'
          : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white',
      ].join(' ')}
    >
      <div className="font-bold">Open file</div>
      <div className="mt-1 text-xs text-slate-500">
        {filename}
        {fileSize ? ` · ${fileSize}` : ''}
      </div>
    </a>
  )
}

function ConversationContextCard({
  conversation,
}: {
  conversation: WhatsAppConversation
}) {
  return (
    <section className="rounded-[28px] border border-blue-100 bg-white/90 p-4 shadow-xl shadow-blue-950/5 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#0B55FF]">
            Conversation Details
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={[
                'rounded-full px-3 py-1 text-xs font-bold ring-1',
                getConversationTypeBadgeClass(conversation.conversation_type),
              ].join(' ')}
            >
              {conversation.conversation_type}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
              {conversation.status}
            </span>
          </div>
        </div>

        <div className="text-sm font-medium text-slate-500">
          Last activity: {formatDate(conversation.last_message_at)}
        </div>
      </div>
    </section>
  )
}

function LinkedPropertyCard({
  property,
}: {
  property: RelatedProperty
}) {
  return (
    <section className="rounded-[28px] border border-blue-100 bg-[#EAF2FF]/90 p-4 shadow-xl shadow-blue-950/5 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#0B55FF]">
            Linked Property
          </div>

          <h2 className="mt-2 truncate text-lg font-black text-slate-950">
            {getPropertyTitle(property)}
          </h2>

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
            <span className="rounded-full bg-white px-3 py-1">
              {property.property_id}
            </span>

            <span className="rounded-full bg-white px-3 py-1">
              {formatPrice(property.price_egp)}
            </span>

            <span className="rounded-full bg-white px-3 py-1">
              {property.availability_status || 'unknown'}
            </span>

            <span className="rounded-full bg-white px-3 py-1">
              {property.admin_status || 'unknown'}
            </span>
          </div>
        </div>

        <Link
          href={`/properties/${property.property_id}`}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#0B55FF] px-5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-[#0048DB]"
        >
          Open property
        </Link>
      </div>
    </section>
  )
}

function MessageBubble({
  message,
  conversationId,
  searchQuery,
  activeFilter,
}: {
  message: WhatsAppMessage
  conversationId: string
  searchQuery: string
  activeFilter: ConversationFilter
}) {
  const isOutbound = message.direction === 'outbound'
  const quotedMessage = message.reply_to_message

  return (
    <div
      id={`message-${message.id}`}
      className={[
        'message-anchor flex w-full scroll-mt-32',
        isOutbound ? 'justify-end' : 'justify-start',
      ].join(' ')}
    >
      <div
        className={[
          'message-bubble-content max-w-[85%] rounded-3xl border px-3.5 py-2.5 text-[15px] leading-7 shadow-sm transition-all duration-300 md:max-w-[75%]',
          isOutbound
            ? 'rounded-br-md border-blue-100 bg-[#DCEBFF] text-slate-950'
            : 'rounded-bl-md border-white bg-white text-slate-950 shadow-blue-950/5',
        ].join(' ')}
      >
        {quotedMessage ? (
          <a
            href={`#message-${quotedMessage.id}`}
            className={[
              'mb-2 block cursor-pointer rounded-2xl border-l-4 px-3 py-2 text-left text-xs leading-5 transition hover:scale-[1.01]',
              isOutbound
                ? 'border-[#0B55FF] bg-white/60 text-slate-700 hover:bg-white'
                : 'border-slate-400 bg-slate-50 text-slate-700 hover:bg-blue-50',
            ].join(' ')}
            title="Go to original message"
          >
            <div className="mb-0.5 font-black text-slate-900">
              {quotedMessage.direction === 'outbound' ? 'You' : 'Customer'}
            </div>

            <div className="line-clamp-2 break-words" dir="auto">
              {getQuotedMessagePreview(quotedMessage)}
            </div>
          </a>
        ) : null}

        <MediaPreview message={message} isOutbound={isOutbound} />

        {message.body ? (
          <div className="whitespace-pre-wrap break-words" dir="auto">
            {message.body}
          </div>
        ) : !message.media_url ? (
          <div className="whitespace-pre-wrap break-words" dir="auto">
            [{message.message_type}]
          </div>
        ) : null}

        <div
          className={[
            'mt-1 flex flex-wrap items-center justify-end gap-1 text-[11px] font-semibold',
            isOutbound ? 'text-[#2C61B8]' : 'text-slate-400',
          ].join(' ')}
        >
          <span>{formatMessageTime(message.created_at)}</span>

          {message.status ? (
            <>
              <span>·</span>
              <span>{message.status}</span>
            </>
          ) : null}

          {message.media_mime_type ? (
            <>
              <span>·</span>
              <span>{message.media_mime_type}</span>
            </>
          ) : null}
        </div>

        {message.error_message ? (
          <div className="mt-2 rounded-2xl bg-red-50 p-2 text-xs font-semibold leading-5 text-red-700 ring-1 ring-red-100">
            {message.error_message}
          </div>
        ) : null}

        <div className="mt-1 flex justify-end">
          <Link
            href={buildReplyHref({
              conversationId,
              messageId: message.id,
              searchQuery,
              activeFilter,
            })}
            className="text-[11px] font-black text-slate-400 transition hover:text-[#0B55FF]"
          >
            Reply
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function WhatsAppConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ conversationId: string }>
  searchParams?: Promise<SearchParams>
}) {
  const { conversationId } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const searchQuery = getSingleSearchParam(resolvedSearchParams.q)
  const activeFilter = getActiveFilter(resolvedSearchParams.filter)
  const replyToMessageId = getSingleSearchParam(resolvedSearchParams.replyTo)

  const [{ conversation, messages, existingBookingRequestId }, conversations] =
    await Promise.all([
      getConversation(conversationId),
      getWhatsAppConversations(),
    ])

  const filteredConversations = filterConversations({
    conversations,
    searchQuery,
    activeFilter,
  })

  const contact = conversation.contact
  const relatedProperty = conversation.related_property
  const replyToMessage = replyToMessageId
    ? messages.find((message) => message.id === replyToMessageId) ?? null
    : null
  const cancelReplyHref = buildCancelReplyHref({
    conversationId: conversation.id,
    searchQuery,
    activeFilter,
  })
  const isOwnerConversation =
    conversation.conversation_type === 'owner_onboarding' ||
    contact?.contact_type === 'owner'

  return (
    <main className="min-h-screen bg-[#F3F7FF] p-0 text-slate-950 md:p-4">
      <style>
        {`
          html {
            scroll-behavior: smooth;
          }

          .message-anchor:target .message-bubble-content {
            animation: navientyMessageHighlight 1.8s ease-in-out;
          }

          @keyframes navientyMessageHighlight {
            0% {
              box-shadow: 0 0 0 0 rgba(11, 85, 255, 0.75);
              outline: 0 solid rgba(11, 85, 255, 0);
              transform: scale(1);
            }

            35% {
              box-shadow: 0 0 0 8px rgba(11, 85, 255, 0.22);
              outline: 3px solid rgba(11, 85, 255, 0.35);
              transform: scale(1.015);
            }

            100% {
              box-shadow: 0 0 0 0 rgba(11, 85, 255, 0);
              outline: 0 solid rgba(11, 85, 255, 0);
              transform: scale(1);
            }
          }
        `}
      </style>

      <WhatsAppRealtimeBridge conversationId={conversation.id} />

      <div className="mx-auto flex h-[100dvh] max-w-[1500px] overflow-hidden bg-white shadow-2xl shadow-blue-950/10 ring-1 ring-blue-100 md:h-[calc(100vh-2rem)] md:rounded-[30px]">
        <NavientyRail activeFilter={activeFilter} />

        <ConversationSidebar
          conversations={filteredConversations}
          totalCount={conversations.length}
          activeConversationId={conversation.id}
          searchQuery={searchQuery}
          activeFilter={activeFilter}
          basePath={`/admin/whatsapp/${conversation.id}`}
          className="hidden md:flex"
        />

        <section className="flex min-w-0 flex-1 flex-col bg-[#F8FBFF]">
          <header className="flex min-h-[76px] items-center justify-between gap-3 border-b border-blue-100 bg-white/95 px-3 py-3 backdrop-blur md:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/admin/whatsapp"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0B55FF] transition hover:bg-blue-100 md:hidden"
                title="Back to inbox"
              >
                <BackIcon />
              </Link>

              <div className="min-w-0">
                <h1
                  className="truncate text-base font-black text-slate-950 md:text-lg"
                  dir="auto"
                >
                  {getContactName(contact)}
                </h1>

                <p
                  className="mt-0.5 truncate text-xs font-semibold text-slate-500 md:text-sm"
                  dir="ltr"
                >
                  {getContactPhone(contact)}
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <EnableWhatsappNotificationsButton />

              <Link
                href={`/admin/whatsapp/${conversation.id}`}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-blue-50 px-4 text-sm font-bold text-[#0B55FF] transition hover:bg-blue-100"
              >
                <RefreshIcon />
                Refresh
              </Link>
            </div>
          </header>

          <div
            className="min-h-0 flex-1 scroll-smooth overflow-y-auto px-3 py-4 md:px-8 md:py-6"
            style={navientyChatPattern}
          >
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
              <ConversationContextCard conversation={conversation} />

              <MarkAsOwnerButton
                conversationId={conversation.id}
                isOwnerConversation={isOwnerConversation}
              />

              {relatedProperty ? (
                <LinkedPropertyCard property={relatedProperty} />
              ) : (
                <section className="rounded-[28px] border border-dashed border-blue-200 bg-white/90 p-4 text-sm font-medium text-slate-500 shadow-sm backdrop-blur">
                  No property linked to this conversation yet.
                </section>
              )}

              {relatedProperty ? (
                <CreateBookingRequestButton
                  conversationId={conversation.id}
                  existingBookingRequestId={existingBookingRequestId}
                />
              ) : null}

              <div className="my-1 flex justify-center">
                <span className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-black text-slate-500 shadow-sm ring-1 ring-blue-100 backdrop-blur">
                  Messages · {messages.length}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 pb-2">
                {messages.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-blue-200 bg-white/90 p-8 text-center text-sm font-medium text-slate-500 shadow-sm backdrop-blur">
                    No messages in this conversation yet.
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      conversationId={conversation.id}
                      searchQuery={searchQuery}
                      activeFilter={activeFilter}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <ReplyBox
            conversationId={conversation.id}
            conversationType={conversation.conversation_type}
            replyToMessage={replyToMessage}
            cancelReplyHref={cancelReplyHref}
          />
        </section>
      </div>
    </main>
  )
}