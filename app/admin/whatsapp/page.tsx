import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import EnableWhatsappNotificationsButton from './EnableWhatsappNotificationsButton'

export const dynamic = 'force-dynamic'

type WhatsAppContact = {
  id: string
  phone: string
  display_name: string | null
  contact_type: string
  opted_out: boolean
  blocked: boolean
}

type WhatsAppMessage = {
  id: string
  direction: 'inbound' | 'outbound'
  message_type: string
  body: string | null
  status: string | null
  created_at: string
}

type WhatsAppConversation = {
  id: string
  status: string
  conversation_type: string
  last_message_at: string | null
  created_at: string
  contact: WhatsAppContact | null
  last_message: WhatsAppMessage | null
  messages: WhatsAppMessage[]
}

type ConversationFilter = 'all' | 'unread' | 'open' | 'owners' | 'students'

type SearchParams = {
  q?: string | string[]
  filter?: string | string[]
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
      } as WhatsAppConversation
    }) ?? []

  return conversations
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

function getContactName(contact: WhatsAppContact | null) {
  return contact?.display_name || contact?.phone || 'Unknown contact'
}

function getContactPhone(contact: WhatsAppContact | null) {
  return contact?.phone || null
}

function shouldShowPhoneUnderName(contact: WhatsAppContact | null) {
  return Boolean(contact?.display_name && contact?.phone)
}

function getLastMessagePreview(message: WhatsAppMessage | null) {
  if (!message) return 'No messages yet'

  if (message.body) {
    return message.direction === 'outbound'
      ? `You: ${message.body}`
      : message.body
  }

  return `[${message.message_type}]`
}

function needsReply(conversation: WhatsAppConversation) {
  return conversation.last_message?.direction === 'inbound'
}

function conversationMatchesSearch(
  conversation: WhatsAppConversation,
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
  conversations: WhatsAppConversation[]
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
  conversations: WhatsAppConversation[]
  totalCount: number
  activeConversationId?: string | null
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
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              Navienty WhatsApp
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {totalCount} conversations · Admin inbox
            </p>
          </div>

          <EnableWhatsappNotificationsButton />
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
              const phone = getContactPhone(contact)

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

                        {shouldShowPhoneUnderName(contact) ? (
                          <div
                            className="mt-0.5 truncate text-xs font-semibold text-slate-500"
                            dir="ltr"
                          >
                            {phone}
                          </div>
                        ) : null}
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

function EmptyRightPanel() {
  return (
    <section className="hidden min-w-0 flex-1 items-center justify-center bg-[#F8FBFF] p-8 md:flex">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] bg-white p-4 shadow-xl shadow-blue-500/10 ring-1 ring-blue-100">
          <img
            src="https://i.ibb.co/7NVrNvxd/Untitled.png"
            alt="Navienty logo"
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>

        <h2 className="text-2xl font-black text-slate-950">
          Select a conversation
        </h2>

        <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
          اختار محادثة من القائمة علشان ترد على الطلاب أو الملاك من WhatsApp API.
        </p>
      </div>
    </section>
  )
}

export default async function WhatsAppInboxPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const searchQuery = getSingleSearchParam(resolvedSearchParams.q)
  const activeFilter = getActiveFilter(resolvedSearchParams.filter)

  const conversations = await getWhatsAppConversations()
  const filteredConversations = filterConversations({
    conversations,
    searchQuery,
    activeFilter,
  })

  return (
    <main className="min-h-screen bg-[#F3F7FF] p-0 text-slate-950 md:p-4">
      <div className="mx-auto flex h-[100dvh] max-w-[1500px] overflow-hidden bg-white shadow-2xl shadow-blue-950/10 ring-1 ring-blue-100 md:h-[calc(100vh-2rem)] md:rounded-[30px]">
        <NavientyRail activeFilter={activeFilter} />

        <ConversationSidebar
          conversations={filteredConversations}
          totalCount={conversations.length}
          activeConversationId={null}
          searchQuery={searchQuery}
          activeFilter={activeFilter}
          basePath="/admin/whatsapp"
        />

        <EmptyRightPanel />
      </div>
    </main>
  )
}
