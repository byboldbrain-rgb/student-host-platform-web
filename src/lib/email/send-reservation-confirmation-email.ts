import { Resend } from 'resend'

type SendReservationConfirmationEmailParams = {
  to: string
  customerName: string
  confirmationCode: string
  propertyTitle: string
  propertyCode?: string | null
  reservationScope?: string | null
  totalPriceEgp?: number | null
  paymentStatus?: string | null
  startDate?: string | null
  endDate?: string | null
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatReservationScope(value?: string | null) {
  if (value === 'entire_property') return 'Full Apartment'
  if (value === 'entire_room') return 'Single Room'
  if (value === 'beds') return 'Shared Room / Bed'
  return 'Reservation'
}

function formatMoney(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null

  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return null

  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${value}T00:00:00`))
  } catch {
    return value
  }
}

export async function sendReservationConfirmationEmail({
  to,
  customerName,
  confirmationCode,
  propertyTitle,
  propertyCode,
  reservationScope,
  totalPriceEgp,
  paymentStatus,
  startDate,
  endDate,
}: SendReservationConfirmationEmailParams) {
  const resendApiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'Navienty Bookings <bookings@navienty.com>'

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is missing')
  }

  if (!to?.trim()) {
    return {
      skipped: true,
      reason: 'Missing recipient email',
    }
  }

  const resend = new Resend(resendApiKey)

  const safeCustomerName = escapeHtml(customerName || 'Student')
  const safeConfirmationCode = escapeHtml(confirmationCode)
  const safePropertyTitle = escapeHtml(propertyTitle || 'Navienty property')
  const safePropertyCode = propertyCode ? escapeHtml(propertyCode) : null
  const bookingType = formatReservationScope(reservationScope)
  const price = formatMoney(totalPriceEgp)
  const formattedStartDate = formatDate(startDate)
  const formattedEndDate = formatDate(endDate)
  const normalizedPaymentStatus = paymentStatus || 'paid'

  const subject = `Your Navienty booking is confirmed: ${confirmationCode}`

  const text = [
    `Hi ${customerName || 'Student'},`,
    '',
    'Your Navienty booking has been confirmed.',
    '',
    `Confirmation Code: ${confirmationCode}`,
    `Property: ${propertyTitle}`,
    propertyCode ? `Property ID: ${propertyCode}` : null,
    `Booking Type: ${bookingType}`,
    price ? `Total Price: ${price}` : null,
    `Payment Status: ${normalizedPaymentStatus}`,
    formattedStartDate ? `Start Date: ${formattedStartDate}` : null,
    formattedEndDate ? `End Date: ${formattedEndDate}` : null,
    '',
    'Please keep this confirmation code. You may need it later to access Navienty services.',
    '',
    'Thank you,',
    'Navienty Team',
  ]
    .filter(Boolean)
    .join('\n')

  const html = `
    <div style="margin:0;padding:0;background:#f6f8fb;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:24px;padding:28px;box-shadow:0 12px 30px rgba(15,23,42,0.08);">
          <div style="margin-bottom:22px;">
            <p style="margin:0;color:#054aff;font-size:13px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">
              Navienty Booking Confirmation
            </p>
            <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;color:#0f172a;">
              Your booking is confirmed
            </h1>
          </div>

          <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#334155;">
            Hi <strong>${safeCustomerName}</strong>, your booking has been confirmed successfully.
          </p>

          <div style="border-radius:20px;background:#054aff;padding:22px;margin:22px 0;color:#ffffff;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.78);">
              Confirmation Code
            </p>
            <p style="margin:0;font-size:30px;font-weight:900;letter-spacing:0.04em;">
              ${safeConfirmationCode}
            </p>
          </div>

          <div style="border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
            <div style="padding:14px 16px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#64748b;">Property</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#111827;">${safePropertyTitle}</p>
            </div>

            ${
              safePropertyCode
                ? `
                  <div style="padding:14px 16px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:12px;color:#64748b;">Property ID</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#111827;">${safePropertyCode}</p>
                  </div>
                `
                : ''
            }

            <div style="padding:14px 16px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#64748b;">Booking Type</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#111827;">${escapeHtml(bookingType)}</p>
            </div>

            ${
              price
                ? `
                  <div style="padding:14px 16px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:12px;color:#64748b;">Total Price</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#111827;">${escapeHtml(price)}</p>
                  </div>
                `
                : ''
            }

            <div style="padding:14px 16px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#64748b;">Payment Status</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#16a34a;">${escapeHtml(normalizedPaymentStatus)}</p>
            </div>

            ${
              formattedStartDate
                ? `
                  <div style="padding:14px 16px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:12px;color:#64748b;">Start Date</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#111827;">${escapeHtml(formattedStartDate)}</p>
                  </div>
                `
                : ''
            }

            ${
              formattedEndDate
                ? `
                  <div style="padding:14px 16px;">
                    <p style="margin:0;font-size:12px;color:#64748b;">End Date</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#111827;">${escapeHtml(formattedEndDate)}</p>
                  </div>
                `
                : ''
            }
          </div>

          <p style="margin:22px 0 0;font-size:14px;line-height:1.7;color:#64748b;">
            Please keep this confirmation code. You may need it later to access Navienty services.
          </p>

          <p style="margin:22px 0 0;font-size:14px;line-height:1.7;color:#334155;">
            Thank you,<br />
            <strong>Navienty Team</strong>
          </p>
        </div>
      </div>
    </div>
  `

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    text,
    html,
  })

  if (error) {
    throw new Error(error.message)
  }

  return {
    skipped: false,
    id: data?.id || null,
  }
}