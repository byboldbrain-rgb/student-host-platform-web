import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

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

function formatDate(value: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default async function WhatsAppInboxPage() {
  const conversations = await getWhatsAppConversations()

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">WhatsApp Inbox</h1>
        <p className="mt-1 text-sm text-gray-500">
          محادثات واتساب الخاصة بـ Navienty
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-4 font-semibold">Contact</th>
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 font-semibold">Last message</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Last activity</th>
              <th className="p-4 font-semibold">Action</th>
            </tr>
          </thead>

          <tbody>
            {conversations.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={6}>
                  No WhatsApp conversations yet.
                </td>
              </tr>
            ) : (
              conversations.map((conversation) => {
                const contact = conversation.contact
                const lastMessage = conversation.last_message

                return (
                  <tr key={conversation.id} className="border-t">
                    <td className="p-4">
                      <div className="font-medium">
                        {contact?.display_name || contact?.phone || 'Unknown'}
                      </div>

                      <div className="text-xs text-gray-500">
                        {contact?.phone || '—'}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                        {contact?.contact_type || 'unknown'}
                      </span>
                    </td>

                    <td className="max-w-xs p-4">
                      <div className="truncate">
                        {lastMessage?.body || '—'}
                      </div>

                      <div className="text-xs text-gray-500">
                        {lastMessage?.direction || '—'}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                        {conversation.status}
                      </span>
                    </td>

                    <td className="p-4 text-gray-600">
                      {formatDate(conversation.last_message_at)}
                    </td>

                    <td className="p-4">
                      <Link
                        href={`/admin/whatsapp/${conversation.id}`}
                        className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}