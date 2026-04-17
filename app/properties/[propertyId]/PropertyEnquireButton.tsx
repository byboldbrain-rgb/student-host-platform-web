'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createPropertyBookingRequestFromProfile,
  type RequestedOptionCode,
} from '@/src/lib/actions/property-booking-requests'

type PropertyEnquireButtonProps = {
  propertyId: string
  requestedOptionCode: RequestedOptionCode
  requestedOptionLabel?: string
  isSignedIn: boolean
  loginRedirectUrl: string
  accountRedirectUrl?: string
  label: string
  className?: string
  successMessage?: string
}

export default function PropertyEnquireButton({
  propertyId,
  requestedOptionCode,
  requestedOptionLabel,
  isSignedIn,
  loginRedirectUrl,
  accountRedirectUrl = '/account?complete_profile=1',
  label,
  className,
  successMessage = 'Your request has been sent successfully.',
}: PropertyEnquireButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  function handleClick() {
    setMessage('')
    setMessageType('')

    if (!isSignedIn) {
      router.push(loginRedirectUrl)
      return
    }

    startTransition(async () => {
      const result = await createPropertyBookingRequestFromProfile(
        propertyId,
        requestedOptionCode,
        requestedOptionLabel
      )

      if (!result.success) {
        if (result.code === 'UNAUTHENTICATED') {
          router.push(loginRedirectUrl)
          return
        }

        if (result.code === 'PROFILE_INCOMPLETE') {
          router.push(accountRedirectUrl)
          return
        }

        setMessage(result.error)
        setMessageType('error')
        return
      }

      setMessage(successMessage)
      setMessageType('success')
    })
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={className}
      >
        {isPending ? 'Loading...' : label}
      </button>

      {message ? (
        <p
          className={`mt-2 text-center text-xs ${
            messageType === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}