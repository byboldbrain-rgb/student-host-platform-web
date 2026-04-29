import Link from 'next/link'
import { requireAccountantAccess } from '@/src/lib/admin-auth'
import { createAdminClient } from '@/src/lib/supabase/admin'
import TaxFilePrintButton from './TaxFilePrintButton'

function numberValue(value: number | string | null | undefined) {
  return Number(value || 0)
}

function formatCurrency(amount: number | string | null | undefined) {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue(amount))
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('en-EG', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1)
}

function endOfToday(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function ReportRow({
  label,
  value,
  note,
  strong = false,
}: {
  label: string
  value: string
  note?: string
  strong?: boolean
}) {
  return (
    <tr>
      <td className="border border-slate-300 px-4 py-3 align-top text-sm font-bold text-slate-900">
        {label}
        {note ? (
          <div className="mt-1 text-xs font-medium leading-5 text-slate-500">
            {note}
          </div>
        ) : null}
      </td>
      <td
        className={[
          'border border-slate-300 px-4 py-3 text-right align-top text-sm text-slate-900',
          strong ? 'font-black' : 'font-bold',
        ].join(' ')}
      >
        {value}
      </td>
    </tr>
  )
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-black tracking-tight text-slate-950">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
      ) : null}
    </div>
  )
}

export default async function TaxFileReportPage({
  searchParams,
}: {
  searchParams?: {
    from?: string
    to?: string
  }
}) {
  await requireAccountantAccess()

  const supabase = createAdminClient()

  const now = new Date()
  const fromDate = searchParams?.from
    ? new Date(searchParams.from)
    : startOfYear(now)

  const toDate = searchParams?.to
    ? endOfToday(new Date(searchParams.to))
    : endOfToday(now)

  const fromDateInput = toDateInputValue(fromDate)
  const toDateInput = toDateInputValue(toDate)

  const [
    settingsResult,
    rentReceiptsResult,
    walletDepositsResult,
    settlementsResult,
    invoicesResult,
    ownerPayablesResult,
  ] = await Promise.all([
    supabase
      .from('platform_finance_settings')
      .select(
        'company_name, company_tax_id, company_address, currency, service_fee_type, service_fee_value, payment_fee_type, payment_fee_value, tax_rate'
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from('rent_collection_receipts')
      .select(
        'id, receipt_number, amount, status, receipt_type, payer_name, payer_phone, owner_name, property_title, issued_at'
      )
      .gte('issued_at', fromDate.toISOString())
      .lte('issued_at', toDate.toISOString())
      .order('issued_at', { ascending: false }),

    supabase
      .from('wallet_deposit_requests')
      .select(
        'id, amount, payment_method, status, transaction_reference, sender_name, sender_phone, created_at, reviewed_at'
      )
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString())
      .order('created_at', { ascending: false }),

    supabase
      .from('owner_settlements')
      .select(
        'id, settlement_number, status, gross_rent_collected, service_fee_amount, payment_fee_amount, tax_amount, adjustment_amount, net_payout_amount, payout_method, payout_reference, period_start, period_end, paid_at, approved_at, created_at'
      )
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString())
      .order('created_at', { ascending: false }),

    supabase
      .from('platform_fee_invoices')
      .select(
        'id, invoice_number, status, service_fee_amount, payment_fee_amount, subtotal_amount, tax_amount, total_amount, tax_rate, issued_at, paid_at, eta_uuid, eta_submission_status'
      )
      .gte('issued_at', fromDate.toISOString())
      .lte('issued_at', toDate.toISOString())
      .order('issued_at', { ascending: false }),

    supabase
      .from('owner_payables')
      .select(
        'id, status, source_type, gross_rent_amount, service_fee_amount, payment_fee_amount, tax_amount, adjustment_amount, net_payable_amount, created_at'
      )
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString())
      .order('created_at', { ascending: false }),
  ])

  const errors = [
    settingsResult.error,
    rentReceiptsResult.error,
    walletDepositsResult.error,
    settlementsResult.error,
    invoicesResult.error,
    ownerPayablesResult.error,
  ].filter(Boolean)

  if (errors.length > 0) {
    throw new Error(errors.map((error) => error?.message).join(' | '))
  }

  const settings = settingsResult.data
  const rentReceipts = rentReceiptsResult.data || []
  const walletDeposits = walletDepositsResult.data || []
  const settlements = settlementsResult.data || []
  const invoices = invoicesResult.data || []
  const ownerPayables = ownerPayablesResult.data || []

  const issuedRentReceipts = rentReceipts.filter(
    (receipt: any) => receipt.status === 'issued'
  )

  const approvedWalletDeposits = walletDeposits.filter(
    (deposit: any) => deposit.status === 'approved'
  )

  const paidSettlements = settlements.filter(
    (settlement: any) => settlement.status === 'paid'
  )

  const validInvoices = invoices.filter((invoice: any) =>
    ['issued', 'paid'].includes(invoice.status)
  )

  const totalRentCollected = issuedRentReceipts.reduce(
    (sum: number, receipt: any) => sum + numberValue(receipt.amount),
    0
  )

  const totalWalletDeposits = approvedWalletDeposits.reduce(
    (sum: number, deposit: any) => sum + numberValue(deposit.amount),
    0
  )

  const totalIncomingCashBasis = totalRentCollected + totalWalletDeposits

  const totalOwnerPayoutsPaid = paidSettlements.reduce(
    (sum: number, settlement: any) =>
      sum + numberValue(settlement.net_payout_amount),
    0
  )

  const totalGrossRentInSettlements = paidSettlements.reduce(
    (sum: number, settlement: any) =>
      sum + numberValue(settlement.gross_rent_collected),
    0
  )

  const totalServiceFees = validInvoices.reduce(
    (sum: number, invoice: any) =>
      sum + numberValue(invoice.service_fee_amount),
    0
  )

  const totalPaymentFees = validInvoices.reduce(
    (sum: number, invoice: any) =>
      sum + numberValue(invoice.payment_fee_amount),
    0
  )

  const totalPlatformRevenueBeforeTax = validInvoices.reduce(
    (sum: number, invoice: any) => sum + numberValue(invoice.subtotal_amount),
    0
  )

  const totalTaxAmount = validInvoices.reduce(
    (sum: number, invoice: any) => sum + numberValue(invoice.tax_amount),
    0
  )

  const totalInvoiceAmount = validInvoices.reduce(
    (sum: number, invoice: any) => sum + numberValue(invoice.total_amount),
    0
  )

  const unsettledOwnerPayables = ownerPayables.filter(
    (payable: any) => payable.status === 'unsettled'
  )

  const totalUnsettledOwnerPayables = unsettledOwnerPayables.reduce(
    (sum: number, payable: any) =>
      sum + numberValue(payable.net_payable_amount),
    0
  )

  const invoiceMismatches = invoices.filter((invoice: any) => {
    const expected =
      numberValue(invoice.service_fee_amount) +
      numberValue(invoice.payment_fee_amount) +
      numberValue(invoice.tax_amount)

    return Math.abs(expected - numberValue(invoice.total_amount)) > 0.01
  })

  const paidSettlementsWithoutReference = paidSettlements.filter(
    (settlement: any) => !settlement.payout_reference
  )

  const generatedAt = new Date()

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }

          html,
          body {
            background: #ffffff !important;
          }

          .no-print {
            display: none !important;
          }

          .print-page {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }

          .print-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print-table {
            page-break-inside: auto;
          }

          .print-table tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>

      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef4ff,_#f8fafc_45%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
        <div className="no-print mx-auto mb-5 flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin/finance/accountant"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            ← Back to Accountant
          </Link>

          <form className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
            <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              From
            </label>
            <input
              name="from"
              type="date"
              defaultValue={fromDateInput}
              className="h-10 rounded-2xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10"
            />

            <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              To
            </label>
            <input
              name="to"
              type="date"
              defaultValue={toDateInput}
              className="h-10 rounded-2xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10"
            />

            <button
              type="submit"
              className="h-10 rounded-2xl bg-blue-600 px-4 text-xs font-black text-white shadow-sm"
            >
              Apply
            </button>
          </form>

          <TaxFilePrintButton />
        </div>

        <article className="print-page mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_14px_45px_rgba(15,23,42,0.06)] sm:p-8">
          <header className="print-section border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Tax Supporting Report
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  تقرير ملخص الملف الضريبي
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  تقرير داخلي مساعد لتجهيز ومراجعة أرقام الإقرار والملف
                  الضريبي، بناءً على بيانات التحصيل والتسويات والفواتير داخل
                  النظام.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-300 p-4 text-sm">
                <div className="font-black text-slate-950">
                  {settings?.company_name || 'Navienty'}
                </div>
                <div className="mt-1 text-slate-600">
                  Tax ID: {settings?.company_tax_id || '-'}
                </div>
                <div className="mt-1 max-w-xs leading-6 text-slate-600">
                  {settings?.company_address || '-'}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-100 p-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Period From
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {formatDateOnly(fromDate.toISOString())}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Period To
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {formatDateOnly(toDate.toISOString())}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Generated At
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {formatDateOnly(generatedAt.toISOString())}
                </p>
              </div>
            </div>
          </header>

          <section className="print-section mt-8">
            <SectionTitle
              title="1. Executive Tax Summary"
              subtitle="الأرقام الرئيسية التي يتم الرجوع إليها عند تجهيز الملف الضريبي."
            />

            <div className="overflow-hidden rounded-3xl border border-slate-300">
              <table className="print-table w-full border-collapse bg-white">
                <tbody>
                  <ReportRow
                    label="Total Incoming Cash Basis"
                    note="Rent collection receipts + approved wallet deposits."
                    value={formatCurrency(totalIncomingCashBasis)}
                    strong
                  />

                  <ReportRow
                    label="Total Rent Collected"
                    note="Issued rent collection receipts only."
                    value={formatCurrency(totalRentCollected)}
                  />

                  <ReportRow
                    label="Total Approved Wallet Deposits"
                    note="Approved wallet deposit requests only."
                    value={formatCurrency(totalWalletDeposits)}
                  />

                  <ReportRow
                    label="Total Owner Payouts Paid"
                    note="Paid owner settlements net payout amount."
                    value={formatCurrency(totalOwnerPayoutsPaid)}
                    strong
                  />

                  <ReportRow
                    label="Gross Rent in Paid Settlements"
                    note="Gross rent collected included in paid settlements."
                    value={formatCurrency(totalGrossRentInSettlements)}
                  />

                  <ReportRow
                    label="Platform Service Fees"
                    value={formatCurrency(totalServiceFees)}
                  />

                  <ReportRow
                    label="Platform Payment Fees"
                    value={formatCurrency(totalPaymentFees)}
                  />

                  <ReportRow
                    label="Platform Revenue Before Tax"
                    note="Service fees + payment fees before tax."
                    value={formatCurrency(totalPlatformRevenueBeforeTax)}
                    strong
                  />

                  <ReportRow
                    label="Tax Amount"
                    note="Tax amount from issued and paid platform invoices."
                    value={formatCurrency(totalTaxAmount)}
                    strong
                  />

                  <ReportRow
                    label="Total Platform Invoices"
                    note="Invoice total including tax."
                    value={formatCurrency(totalInvoiceAmount)}
                  />
                </tbody>
              </table>
            </div>
          </section>

          <section className="print-section mt-8">
            <SectionTitle
              title="2. Tax Configuration"
              subtitle="إعدادات الرسوم والضريبة المستخدمة داخل النظام وقت استخراج التقرير."
            />

            <div className="overflow-hidden rounded-3xl border border-slate-300">
              <table className="print-table w-full border-collapse bg-white">
                <tbody>
                  <ReportRow
                    label="Currency"
                    value={settings?.currency || 'EGP'}
                  />
                  <ReportRow
                    label="Service Fee"
                    value={`${settings?.service_fee_type || '-'} / ${
                      settings?.service_fee_value ?? '-'
                    }`}
                  />
                  <ReportRow
                    label="Payment Fee"
                    value={`${settings?.payment_fee_type || '-'} / ${
                      settings?.payment_fee_value ?? '-'
                    }`}
                  />
                  <ReportRow
                    label="Tax Rate"
                    value={`${settings?.tax_rate ?? 0}%`}
                  />
                </tbody>
              </table>
            </div>
          </section>

          <section className="print-section mt-8">
            <SectionTitle
              title="3. Compliance Checks"
              subtitle="مؤشرات مراجعة قبل الاعتماد النهائي للتقرير."
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-300 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Invoice Mismatches
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {invoiceMismatches.length}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Service fee + payment fee + tax should equal total.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-300 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Paid Payouts Missing Reference
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {paidSettlementsWithoutReference.length}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Paid settlements should have payout references.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-300 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Unsettled Owner Payables
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {formatCurrency(totalUnsettledOwnerPayables)}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Not paid yet and should not be counted as actual payout.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <SectionTitle
              title="4. Platform Fee Invoices"
              subtitle="الفواتير الصادرة أو المدفوعة خلال الفترة."
            />

            <div className="overflow-hidden rounded-3xl border border-slate-300">
              <table className="print-table w-full border-collapse bg-white text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-300 px-3 py-2 text-left">
                      Invoice
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-left">
                      Status
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-right">
                      Subtotal
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-right">
                      Tax
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-right">
                      Total
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-left">
                      ETA
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {validInvoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="border border-slate-300 px-3 py-4 text-center text-slate-500"
                      >
                        No valid invoices in this period.
                      </td>
                    </tr>
                  ) : (
                    validInvoices.map((invoice: any) => (
                      <tr key={invoice.id}>
                        <td className="border border-slate-300 px-3 py-2 font-mono text-xs font-bold">
                          {invoice.invoice_number}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 font-bold">
                          {invoice.status}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-right font-bold">
                          {formatCurrency(invoice.subtotal_amount)}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-right font-bold">
                          {formatCurrency(invoice.tax_amount)}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-right font-black">
                          {formatCurrency(invoice.total_amount)}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-xs">
                          {invoice.eta_submission_status || 'not_submitted'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8">
            <SectionTitle
              title="5. Paid Owner Settlements"
              subtitle="المدفوعات الخارجة للملاك خلال الفترة."
            />

            <div className="overflow-hidden rounded-3xl border border-slate-300">
              <table className="print-table w-full border-collapse bg-white text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-300 px-3 py-2 text-left">
                      Settlement
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-right">
                      Gross Rent
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-right">
                      Deductions
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-right">
                      Net Payout
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-left">
                      Method / Ref
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paidSettlements.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="border border-slate-300 px-3 py-4 text-center text-slate-500"
                      >
                        No paid owner settlements in this period.
                      </td>
                    </tr>
                  ) : (
                    paidSettlements.map((settlement: any) => {
                      const deductions =
                        numberValue(settlement.service_fee_amount) +
                        numberValue(settlement.payment_fee_amount) +
                        numberValue(settlement.tax_amount) -
                        numberValue(settlement.adjustment_amount)

                      return (
                        <tr key={settlement.id}>
                          <td className="border border-slate-300 px-3 py-2 font-mono text-xs font-bold">
                            {settlement.settlement_number}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right font-bold">
                            {formatCurrency(settlement.gross_rent_collected)}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right font-bold">
                            {formatCurrency(deductions)}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right font-black">
                            {formatCurrency(settlement.net_payout_amount)}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-xs">
                            {settlement.payout_method || '-'} /{' '}
                            {settlement.payout_reference || '-'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="print-section mt-10 border-t border-slate-300 pt-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm font-black text-slate-950">
                  Prepared By
                </p>
                <div className="mt-10 border-t border-slate-400 pt-2 text-xs text-slate-500">
                  Accountant Signature
                </div>
              </div>

              <div>
                <p className="text-sm font-black text-slate-950">
                  Reviewed By
                </p>
                <div className="mt-10 border-t border-slate-400 pt-2 text-xs text-slate-500">
                  Finance Manager / Legal Accountant Signature
                </div>
              </div>
            </div>

            <p className="mt-6 text-xs leading-6 text-slate-500">
              Disclaimer: This report is generated from Navienty internal
              records for reconciliation and tax preparation support. Official
              tax filing, e-invoice, and e-receipt submission should be verified
              through the Egyptian Tax Authority systems and by the responsible
              accountant.
            </p>
          </footer>
        </article>
      </main>
    </>
  )
}