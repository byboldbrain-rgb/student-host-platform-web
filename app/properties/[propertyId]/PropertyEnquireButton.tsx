'use client'

import { useState } from 'react'
import type { RequestedOptionCode } from '@/src/lib/actions/property-booking-requests'

type PropertyEnquireButtonProps = {
  propertyId: string
  propertyPublicId?: string
  propertyTitle?: string
  brokerWhatsappNumber?: string | null
  requestedOptionCode: RequestedOptionCode
  requestedOptionLabel?: string
  isSignedIn: boolean
  loginRedirectUrl: string
  accountRedirectUrl?: string
  label: string
  className?: string
  successMessage?: string
}

type WhatsAppClickIntentResponse = {
  ok: boolean
  clickIntentId?: string
  whatsappTargetNumber?: string
  error?: string
}

function normalizeWhatsAppNumber(value?: string | null) {
  const rawValue = String(value || '').trim()

  if (!rawValue) return ''

  const cleanedValue = rawValue.replace(/[^\d+]/g, '')

  if (cleanedValue.startsWith('+')) {
    return cleanedValue.replace(/\D/g, '')
  }

  const digitsOnly = cleanedValue.replace(/\D/g, '')

  if (digitsOnly.startsWith('00')) {
    return digitsOnly.slice(2)
  }

  if (digitsOnly.startsWith('01') && digitsOnly.length === 11) {
    return `20${digitsOnly.slice(1)}`
  }

  return digitsOnly
}

function getRequestedOptionMessageLabel({
  requestedOptionCode,
  requestedOptionLabel,
}: {
  requestedOptionCode: RequestedOptionCode
  requestedOptionLabel?: string
}) {
  const cleanLabel = requestedOptionLabel?.trim()

  if (cleanLabel) return cleanLabel

  if (requestedOptionCode === 'single_room') return 'غرفة سينجل'
  if (requestedOptionCode === 'double_room') return 'غرفة دوبل'
  if (requestedOptionCode === 'triple_room') return 'غرفة تريبل'
  if (requestedOptionCode === 'full_apartment') return 'الشقة بالكامل'

  return 'هذا السكن'
}

function buildWhatsAppMessage({
  requestedOptionCode,
  requestedOptionLabel,
  propertyPublicId,
  propertyId,
  propertyTitle,
}: {
  requestedOptionCode: RequestedOptionCode
  requestedOptionLabel?: string
  propertyPublicId?: string
  propertyId: string
  propertyTitle?: string
}) {
  const optionLabel = getRequestedOptionMessageLabel({
    requestedOptionCode,
    requestedOptionLabel,
  })

  const propertyIdentifier = propertyPublicId?.trim() || propertyId
  const cleanPropertyTitle = propertyTitle?.trim()

  const lines = [
    `مساء الخير، عاوز أستفسر عن السكن.`,
    '',
    `Property ID: ${propertyIdentifier}`,
    cleanPropertyTitle ? `Property: ${cleanPropertyTitle}` : '',
    `Room type: ${optionLabel}`,
    `Source: Navienty Website`,
  ].filter((line) => line !== '' || true)

  return lines.join('\n')
}

function buildWhatsAppBookingUrl({
  whatsappNumber,
  message,
}: {
  whatsappNumber: string
  message: string
}) {
  const normalizedNumber = normalizeWhatsAppNumber(whatsappNumber)

  if (!normalizedNumber) return ''

  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`
}

export default function PropertyEnquireButton({
  propertyId,
  propertyPublicId,
  propertyTitle,
  brokerWhatsappNumber,
  requestedOptionCode,
  requestedOptionLabel,
  label,
  className,
}: PropertyEnquireButtonProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    if (isLoading) return

    setMessage('')
    setIsLoading(true)

    try {
      const generatedMessage = buildWhatsAppMessage({
        requestedOptionCode,
        requestedOptionLabel,
        propertyPublicId,
        propertyId,
        propertyTitle,
      })

      const optionLabel = getRequestedOptionMessageLabel({
        requestedOptionCode,
        requestedOptionLabel,
      })

      const response = await fetch('/api/whatsapp/click-intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          propertyPublicId,
          requestedOptionCode,
          roomTypeLabel: optionLabel,
          source: 'property_page',
          generatedMessage,
          whatsappTargetNumber: null,
          metadata: {
            old_broker_whatsapp_number: brokerWhatsappNumber || null,
            property_title: propertyTitle || null,
          },
        }),
      })

      const data = (await response.json()) as WhatsAppClickIntentResponse

      if (!response.ok || !data.ok) {
        setMessage(
          data.error ||
            'حدث خطأ أثناء تسجيل طلب التواصل. حاول مرة أخرى بعد لحظات.'
        )
        return
      }

      const whatsappNumber = data.whatsappTargetNumber

      if (!whatsappNumber) {
        setMessage('رقم واتساب Navienty غير متاح حاليًا.')
        return
      }

      const whatsappUrl = buildWhatsAppBookingUrl({
        whatsappNumber,
        message: generatedMessage,
      })

      if (!whatsappUrl) {
        setMessage('رقم واتساب Navienty غير صالح.')
        return
      }

      window.location.href = whatsappUrl
    } catch (error) {
      console.error('WHATSAPP_CLICK_INTENT_CLIENT_ERROR:', error)
      setMessage('حدث خطأ أثناء فتح واتساب. حاول مرة أخرى.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full shrink-0">
      <button
        type="button"
        onClick={handleClick}
        className={className}
        disabled={isLoading}
      >
        {isLoading ? 'جاري فتح واتساب...' : label}
      </button>

      {message ? (
        <p className="mt-2 text-center text-xs text-red-600">{message}</p>
      ) : null}
    </div>
  )
}