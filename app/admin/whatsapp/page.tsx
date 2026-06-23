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

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return 'http://localhost:3000'
}

async function getWhatsAppConversations() {
  const baseUrl = getBaseUrl()
  const secret = process.env.WHATSAPP_TEST_SEND_SECRET

  if (!secret) {
    throw new Error('Missing WHATSAPP_TEST_SEND_SECRET')
  }

  const res = await fetch(
    `${baseUrl}/api/whatsapp/conversations?secret=${secret}`,
    {
      cache: 'no-store',
    }
  )

  if (!res.ok) {
    const errorText = await res.text()

    console.error('WHATSAPP_INBOX_FETCH_ERROR:', {
      status: res.status,
      statusText: res.statusText,
      body: errorText,
    })

    throw new Error('Failed to fetch WhatsApp conversations')
  }

  return res.json() as Promise<{
    ok: boolean
    conversations: WhatsAppConversation[]
  }>
}

function formatDate(value: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default async function WhatsAppInboxPage() {
  const data = await getWhatsAppConversations()
  const conversations = data.conversations ?? []

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