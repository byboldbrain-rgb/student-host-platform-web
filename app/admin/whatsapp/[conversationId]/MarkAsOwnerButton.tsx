'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { markWhatsAppConversationAsOwnerAction } from './actions'

type MarkAsOwnerButtonProps = {
  conversationId: string
  isOwnerConversation?: boolean
}

export default function MarkAsOwnerButton({
  conversationId,
  isOwnerConversation = false,
}: MarkAsOwnerButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await markWhatsAppConversationAsOwnerAction(conversationId)

      if (!result.ok) {
        setError(result.error || 'Failed to mark conversation as owner.')
        return
      }

      setSuccess('Conversation marked as owner successfully.')
      router.refresh()
    })
  }

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold">Owner Onboarding</h2>

          {isOwnerConversation ? (
            <p className="mt-1 text-sm text-gray-500">
              This conversation is already marked as owner onboarding.
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              Mark this WhatsApp contact as an owner and move the conversation to
              owner onboarding.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleClick}
          disabled={isPending || isOwnerConversation}
          className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isOwnerConversation
            ? 'Already Owner'
            : isPending
              ? 'Marking...'
              : 'Mark as Owner'}
        </button>
      </div>

      {success ? (
        <p className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-700">
          {success}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}