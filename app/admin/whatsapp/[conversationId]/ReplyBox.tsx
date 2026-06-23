'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState, useTransition } from 'react'
import { sendWhatsAppReplyAction } from './actions'

type ReplyBoxProps = {
  conversationId: string
}

export default function ReplyBox({ conversationId }: ReplyBoxProps) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const body = message.trim()

    if (!body) {
      setError('اكتب رسالة الأول.')
      return
    }

    setError(null)

    startTransition(async () => {
      const result = await sendWhatsAppReplyAction(conversationId, body)

      if (!result.ok) {
        setError(result.error || 'فشل إرسال الرسالة.')
        return
      }

      setMessage('')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-4">
      <label className="mb-2 block text-sm font-medium">Reply</label>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={4}
        placeholder="اكتب رسالة واتساب هنا..."
        className="w-full resize-none rounded-xl border p-3 text-sm outline-none focus:border-black"
        disabled={isPending}
      />

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? 'Sending...' : 'Send WhatsApp Message'}
        </button>
      </div>
    </form>
  )
}