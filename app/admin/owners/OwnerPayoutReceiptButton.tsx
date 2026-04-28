'use client'

type OwnerRow = {
  id: string
  full_name: string
  phone_number: string | null
  whatsapp_number: string | null
  email: string | null
  company_name: string | null
  tax_id: string | null
  national_id: string | null
  billing_name: string | null
  billing_address: string | null
}

type PropertyRow = {
  id: string
  property_id: string
  title_en: string
  title_ar: string
}

type ReservationRow = {
  id: string
  property_id: string
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  customer_whatsapp: string | null
  reservation_scope: string
  reserved_option_code: string | null
  reserved_option_name_en: string | null
  total_price_egp: number | null
  start_date: string | null
  end_date: string | null
  status: string
  payment_status: string
  created_at: string
}

type OwnerPayableRow = {
  id: string
  property_id: string
  reservation_id: string
  gross_rent_amount: number
  service_fee_amount: number
  payment_fee_amount: number
  tax_amount: number
  adjustment_amount: number
  net_payable_amount: number
  currency: string
  status: string
  source_type: string
  created_at: string
  settlement_id?: string | null
}

type OwnerSettlementRow = {
  id: string
  settlement_number: string
  gross_rent_collected: number
  service_fee_amount: number
  payment_fee_amount: number
  tax_amount: number
  adjustment_amount: number
  net_payout_amount: number
  currency: string
  status: string
  period_start: string | null
  period_end: string | null
  paid_at: string | null
  payout_method: string | null
  payout_reference: string | null
  created_at: string
}

type PayoutAccountRow = {
  id: string
  payout_method: string
  account_holder_name: string | null
  phone_number: string | null
  bank_name: string | null
  bank_account_number: string | null
  iban: string | null
  wallet_number: string | null
  instapay_handle: string | null
  is_default: boolean
  is_active: boolean
}

type Props = {
  owner: OwnerRow
  settlement: OwnerSettlementRow
  payables: OwnerPayableRow[]
  properties: PropertyRow[]
  reservations: ReservationRow[]
  payoutAccounts: PayoutAccountRow[]
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatMoney(value: number | null | undefined, currency = 'EGP') {
  const numericValue = Number(value || 0)

  return `${numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function humanize(value: string | null | undefined) {
  if (!value) return '—'

  return value
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function maskAccount(value: string | null | undefined) {
  const parsed = String(value || '').trim()

  if (!parsed) return '—'

  if (parsed.length <= 4) return `*${parsed}`

  return `*${parsed.slice(-4)}`
}

function getPayoutAccountLabel(account: PayoutAccountRow | null | undefined) {
  if (!account) return '—'

  if (account.bank_account_number) {
    return `${account.bank_name || 'Bank'} ${maskAccount(account.bank_account_number)}`
  }

  if (account.iban) {
    return `IBAN ${maskAccount(account.iban)}`
  }

  if (account.instapay_handle) {
    return account.instapay_handle
  }

  if (account.wallet_number) {
    return maskAccount(account.wallet_number)
  }

  if (account.phone_number) {
    return maskAccount(account.phone_number)
  }

  return '—'
}

export default function OwnerPayoutReceiptButton({
  owner,
  settlement,
  payables,
  properties,
  reservations,
  payoutAccounts,
}: Props) {
  const handleGenerate = () => {
    const propertyById = new Map(properties.map((property) => [property.id, property]))
    const reservationById = new Map(
      reservations.map((reservation) => [reservation.id, reservation])
    )

    const settlementPayables = payables.filter((payable) => {
      if (payable.settlement_id) {
        return payable.settlement_id === settlement.id
      }

      if (settlement.status === 'paid') {
        return payable.status === 'settled'
      }

      return payable.status !== 'cancelled'
    })

    const activeDefaultAccount =
      payoutAccounts.find((account) => account.is_active && account.is_default) ||
      payoutAccounts.find((account) => account.is_active) ||
      null

    const gross = Number(settlement.gross_rent_collected || 0)
    const serviceFee = Number(settlement.service_fee_amount || 0)
    const paymentFee = Number(settlement.payment_fee_amount || 0)
    const tax = Number(settlement.tax_amount || 0)
    const adjustment = Number(settlement.adjustment_amount || 0)
    const net = Number(settlement.net_payout_amount || 0)
    const currency = settlement.currency || 'EGP'

    const descriptor = settlement.settlement_number || settlement.id.slice(0, 8)

    const rowsHtml =
      settlementPayables.length > 0
        ? settlementPayables
            .map((payable) => {
              const property = propertyById.get(payable.property_id)
              const reservation = reservationById.get(payable.reservation_id)

              return `
                <tr>
                  <td>${escapeHtml(humanize(payable.source_type))}</td>
                  <td>${escapeHtml(reservation?.id?.slice(0, 8) || payable.reservation_id.slice(0, 8))}</td>
                  <td>${escapeHtml(property?.title_en || '—')}</td>
                  <td>${escapeHtml(formatDate(reservation?.start_date))}</td>
                  <td>${escapeHtml(formatDate(reservation?.end_date))}</td>
                  <td>${escapeHtml(formatDate(payable.created_at))}</td>
                  <td class="amount">${escapeHtml(formatMoney(payable.net_payable_amount, payable.currency))}</td>
                </tr>
              `
            })
            .join('')
        : `
          <tr>
            <td colspan="7" class="empty">
              No detailed payable items were found for this settlement.
            </td>
          </tr>
        `

    const reportHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Payout Report - ${escapeHtml(settlement.settlement_number)}</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              background: #f8fafc;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 13px;
            }

            .page {
              width: 1120px;
              min-height: 780px;
              margin: 24px auto;
              background: #ffffff;
              padding: 28px 32px;
              border: 1px solid #e2e8f0;
            }

            .top {
              display: flex;
              justify-content: space-between;
              gap: 32px;
              align-items: flex-start;
            }

            .company h1 {
              margin: 0 0 12px;
              font-size: 22px;
              font-weight: 800;
            }

            .company p,
            .owner p {
              margin: 3px 0;
              line-height: 1.35;
            }

            .owner {
              min-width: 360px;
              padding-top: 104px;
            }

            .owner h2 {
              margin: 0 0 8px;
              font-size: 18px;
            }

            .report-title {
              margin-top: 26px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              gap: 24px;
            }

            .report-title h3 {
              margin: 0;
              font-size: 18px;
            }

            .muted {
              color: #475569;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }

            th {
              background: #f1f5f9;
              color: #334155;
              font-weight: 800;
              text-align: left;
              padding: 8px 7px;
              border-bottom: 2px solid #020617;
              white-space: nowrap;
            }

            td {
              padding: 8px 7px;
              border-bottom: 1px solid #020617;
              vertical-align: top;
            }

            .amount {
              text-align: right;
              white-space: nowrap;
              font-weight: 700;
            }

            .summary {
              margin-top: 52px;
            }

            .summary-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr 1fr;
              border-bottom: 2px solid #020617;
            }

            .summary-grid > div {
              background: #f1f5f9;
              padding: 8px 7px;
              font-weight: 800;
            }

            .summary-grid .right {
              text-align: right;
            }

            .note {
              margin: 10px 0 18px;
              color: #475569;
            }

            .breakdown td {
              border-bottom: 2px solid #020617;
            }

            .breakdown .label {
              font-weight: 700;
            }

            .breakdown .amount {
              font-weight: 500;
            }

            .breakdown .net .label,
            .breakdown .net .amount {
              font-weight: 900;
            }

            .empty {
              text-align: center;
              padding: 22px;
              color: #64748b;
            }

            .actions {
              position: sticky;
              top: 0;
              display: flex;
              justify-content: center;
              gap: 10px;
              padding: 12px;
              background: rgba(248, 250, 252, 0.95);
              border-bottom: 1px solid #e2e8f0;
            }

            .actions button {
              border: 0;
              border-radius: 12px;
              padding: 10px 16px;
              cursor: pointer;
              font-weight: 800;
            }

            .print {
              background: #2563eb;
              color: white;
            }

            .close {
              background: white;
              color: #0f172a;
              border: 1px solid #cbd5e1 !important;
            }

            @media print {
              body {
                background: white;
              }

              .actions {
                display: none;
              }

              .page {
                width: auto;
                margin: 0;
                border: 0;
                padding: 20px;
              }
            }
          </style>
        </head>

        <body>
          <div class="actions">
            <button class="print" onclick="window.print()">Print / Save PDF</button>
            <button class="close" onclick="window.close()">Close</button>
          </div>

          <main class="page">
            <section class="top">
              <div class="company">
                <h1>Navienty</h1>
                <p>Student Host Platform</p>
                <p>Owner Payout Report</p>
                <p>Currency: ${escapeHtml(currency)}</p>
                <p>Settlement: ${escapeHtml(settlement.settlement_number)}</p>
                <p>Status: ${escapeHtml(humanize(settlement.status))}</p>
              </div>

              <div class="owner">
                <h2>${escapeHtml(owner.billing_name || owner.full_name)}</h2>
                <p>${escapeHtml(owner.company_name || 'Individual Owner')}</p>
                <p>${escapeHtml(owner.email || '—')}</p>
                <p>${escapeHtml(owner.phone_number || owner.whatsapp_number || '—')}</p>
                <p>Tax ID: ${escapeHtml(owner.tax_id || '—')}</p>
                <p>National ID: ${escapeHtml(owner.national_id || '—')}</p>
              </div>
            </section>

            <section class="report-title">
              <div>
                <h3>Payout report</h3>
                <p class="muted">
                  ${escapeHtml(formatDate(settlement.period_start))}
                  -
                  ${escapeHtml(formatDate(settlement.period_end))}
                </p>
              </div>

              <div>
                <p><strong>Statement Descriptor</strong></p>
                <p>${escapeHtml(descriptor)}</p>
              </div>
            </section>

            <table>
              <thead>
                <tr>
                  <th>Type / Transaction type</th>
                  <th>Reference number</th>
                  <th>Property</th>
                  <th>Check-in date</th>
                  <th>Check-out date</th>
                  <th>Issue date</th>
                  <th>Transaction amount</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <section class="summary">
              <div class="summary-grid">
                <div>Payout type</div>
                <div>Payout currency</div>
                <div class="right">Payout amount</div>
                <div class="right">Payout account</div>
              </div>

              <div class="summary-grid" style="border-bottom: 0;">
                <div>Net</div>
                <div>${escapeHtml(currency)}</div>
                <div class="right">${escapeHtml(formatMoney(net, currency))}</div>
                <div class="right">${escapeHtml(getPayoutAccountLabel(activeDefaultAccount))}</div>
              </div>

              <p class="note">
                Navienty's commission, payment fees, taxes and adjustments have already been deducted from the payout amount.
              </p>

              <table class="breakdown">
                <thead>
                  <tr>
                    <th>Payout breakdown</th>
                    <th>Currency</th>
                    <th class="amount">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="label">Gross</td>
                    <td>${escapeHtml(currency)}</td>
                    <td class="amount">${escapeHtml(formatMoney(gross, currency))}</td>
                  </tr>
                  <tr>
                    <td class="label">Commission</td>
                    <td>${escapeHtml(currency)}</td>
                    <td class="amount">-${escapeHtml(formatMoney(serviceFee, currency))}</td>
                  </tr>
                  <tr>
                    <td class="label">Payments Service Fee</td>
                    <td>${escapeHtml(currency)}</td>
                    <td class="amount">-${escapeHtml(formatMoney(paymentFee, currency))}</td>
                  </tr>
                  <tr>
                    <td class="label">Taxes</td>
                    <td>${escapeHtml(currency)}</td>
                    <td class="amount">-${escapeHtml(formatMoney(tax, currency))}</td>
                  </tr>
                  <tr>
                    <td class="label">Adjustments</td>
                    <td>${escapeHtml(currency)}</td>
                    <td class="amount">${escapeHtml(formatMoney(adjustment, currency))}</td>
                  </tr>
                  <tr class="net">
                    <td class="label">Net</td>
                    <td>${escapeHtml(currency)}</td>
                    <td class="amount">${escapeHtml(formatMoney(net, currency))}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </main>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank', 'width=1200,height=900')

    if (!printWindow) {
      alert('Please allow popups to generate the payout report.')
      return
    }

    printWindow.document.open()
    printWindow.document.write(reportHtml)
    printWindow.document.close()
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
    >
      Generate Receipt
    </button>
  )
}