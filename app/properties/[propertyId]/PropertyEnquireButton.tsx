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

function buildWhatsAppBookingUrl({
  brokerWhatsappNumber,
  requestedOptionCode,
  requestedOptionLabel,
  propertyPublicId,
  propertyId,
  propertyTitle,
}: {
  brokerWhatsappNumber?: string | null
  requestedOptionCode: RequestedOptionCode
  requestedOptionLabel?: string
  propertyPublicId?: string
  propertyId: string
  propertyTitle?: string
}) {
  const whatsappNumber = normalizeWhatsAppNumber(brokerWhatsappNumber)

  if (!whatsappNumber) return ''

  const optionLabel = getRequestedOptionMessageLabel({
    requestedOptionCode,
    requestedOptionLabel,
  })

  const propertyIdentifier = propertyPublicId?.trim() || propertyId
  const cleanPropertyTitle = propertyTitle?.trim()

  const lines = [
    `مساء الخير، عاوز احجز ${optionLabel}.`,
    cleanPropertyTitle ? `اسم السكن: ${cleanPropertyTitle}` : '',
    `Property ID: ${propertyIdentifier}`,
  ].filter(Boolean)

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    lines.join('\n')
  )}`
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

  function handleClick() {
    setMessage('')

    const whatsappUrl = buildWhatsAppBookingUrl({
      brokerWhatsappNumber,
      requestedOptionCode,
      requestedOptionLabel,
      propertyPublicId,
      propertyId,
      propertyTitle,
    })

    if (!whatsappUrl) {
      setMessage('رقم واتساب الوسيط غير متاح لهذا السكن.')
      return
    }

    window.location.href = whatsappUrl
  }

  return (
    <div className="w-full shrink-0">
      <button type="button" onClick={handleClick} className={className}>
        {label}
      </button>

      {message ? (
        <p className="mt-2 text-center text-xs text-red-600">{message}</p>
      ) : null}
    </div>
  )
}