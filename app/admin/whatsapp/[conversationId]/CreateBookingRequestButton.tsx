'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { createBookingRequestFromWhatsAppAction } from './actions'

type CreateBookingRequestButtonProps = {
  conversationId: string
  existingBookingRequestId?: string | null
}

export default function CreateBookingRequestButton({
  conversationId,
  existingBookingRequestId = null,
}: CreateBookingRequestButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createdBookingRequestId, setCreatedBookingRequestId] = useState<
    string | null
  >(existingBookingRequestId)
  const [isPending, startTransition] = useTransition()

  const bookingRequestId = createdBookingRequestId || existingBookingRequestId

  function handleClick() {
    if (bookingRequestId) return

    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await createBookingRequestFromWhatsAppAction(conversationId)

      if (!result.ok) {
        if (result.bookingRequestId) {
          setCreatedBookingRequestId(result.bookingRequestId)
          setSuccess('Booking request already exists for this conversation.')
          router.refresh()
          return
        }

        setError(result.error || 'Failed to create booking request.')
        return
      }

      setCreatedBookingRequestId(result.bookingRequestId || null)
      setSuccess('Booking request created successfully.')
      router.refresh()
    })
  }

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold">Sales Action</h2>

          {bookingRequestId ? (
            <p className="mt-1 text-sm text-gray-500">
              A booking request has already been created from this WhatsApp
              conversation.
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              Create a booking request from this WhatsApp conversation.
            </p>
          )}
        </div>

        {bookingRequestId ? (
          <Link
            href="/admin/properties/booking-requests"
            className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Open Booking Requests
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isPending ? 'Creating...' : 'Create Booking Request'}
          </button>
        )}
      </div>

      {bookingRequestId ? (
        <div className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-700">
          Booking request exists.
          <span className="mt-1 block font-mono text-xs">
            ID: {bookingRequestId}
          </span>
        </div>
      ) : null}

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