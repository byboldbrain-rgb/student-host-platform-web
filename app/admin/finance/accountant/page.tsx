import type { ReactNode } from 'react'
import Link from 'next/link'
import { requireAccountantAccess } from '@/src/lib/admin-auth'
import { createAdminClient } from '@/src/lib/supabase/admin'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

function BrandLogo() {
  return (
    <Link
      href="/admin/finance/accountant"
      className="navienty-logo"
      aria-label="Navienty admin home"
    >
      <img
        src="https://i.ibb.co/p6CBgjz0/Navienty-13.png"
        alt="Navienty icon"
        className="navienty-logo-icon"
      />
      <span className="navienty-logo-text-wrap">
        <img
          src="https://i.ibb.co/kVC7z9x7/Navienty-15.png"
          alt="Navienty"
          className="navienty-logo-text"
        />
      </span>
    </Link>
  )
}

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

function formatNumber(value: number | string | null | undefined) {
  return new Intl.NumberFormat('en-EG').format(numberValue(value))
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function toISODate(date: Date) {
  return date.toISOString()
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1)
}

function StatCard({
  label,
  value,
  description,
  tone = 'blue',
}: {
  label: string
  value: ReactNode
  description?: string
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'purple'
}) {
  const tones = {
    blue: 'from-blue-50 to-white border-blue-100 text-blue-600',
    emerald: 'from-emerald-50 to-white border-emerald-100 text-emerald-600',
    amber: 'from-amber-50 to-white border-amber-100 text-amber-600',
    rose: 'from-rose-50 to-white border-rose-100 text-rose-600',
    slate: 'from-slate-50 to-white border-slate-200 text-slate-600',
    purple: 'from-violet-50 to-white border-violet-100 text-violet-600',
  }

  return (
    <article
      className={`rounded-[28px] border bg-gradient-to-br p-5 shadow-[0_14px_45px_rgba(15,23,42,0.06)] ${tones[tone]}`}
    >
      <p className="text-xs font-black uppercase tracking-[0.16em]">{label}</p>
      <div className="mt-3 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </div>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      ) : null}
    </article>
  )
}

function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string
  description?: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)]">
      <div className="pointer-events-none h-1 bg-gradient-to-r from-blue-500/15 via-transparent to-transparent" />

      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {description}
              </p>
            ) : null}
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </section>
  )
}

function Pill({
  children,
  tone = 'slate',
}: {
  children: ReactNode
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'purple'
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    purple: 'bg-violet-50 text-violet-700 ring-violet-100',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

function QuickLink({
  href,
  title,
  description,
  tone = 'blue',
}: {
  href: string
  title: string
  description: string
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'purple'
}) {
  const tones = {
    blue: 'hover:border-blue-200 hover:bg-blue-50/60',
    emerald: 'hover:border-emerald-200 hover:bg-emerald-50/60',
    amber: 'hover:border-amber-200 hover:bg-amber-50/60',
    rose: 'hover:border-rose-200 hover:bg-rose-50/60',
    slate: 'hover:border-slate-300 hover:bg-slate-50',
    purple: 'hover:border-violet-200 hover:bg-violet-50/60',
  }

  return (
    <Link
      href={href}
      className={`group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>

        <span className="mt-1 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700">
          →
        </span>
      </div>
    </Link>
  )
}

function EmptySmall({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm font-semibold text-slate-500">
      {message}
    </div>
  )
}

function TaxMetricCard({
  label,
  value,
  description,
  tone = 'slate',
}: {
  label: string
  value: ReactNode
  description: string
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'purple'
}) {
  const tones = {
    blue: 'border-blue-100 bg-blue-50/60',
    emerald: 'border-emerald-100 bg-emerald-50/60',
    amber: 'border-amber-100 bg-amber-50/60',
    rose: 'border-rose-100 bg-rose-50/60',
    slate: 'border-slate-200 bg-slate-50/70',
    purple: 'border-violet-100 bg-violet-50/60',
  }

  return (
    <div className={`rounded-3xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}

function TaxBreakdownRow({
  label,
  value,
  description,
}: {
  label: string
  value: ReactNode
  description: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-black text-slate-950">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>

      <div className="text-left text-base font-black text-slate-950 sm:text-right">
        {value}
      </div>
    </div>
  )
}

function statusTone(
  status?: string | null
): 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'purple' {
  if (!status) return 'slate'

  if (['paid', 'settled', 'approved', 'issued', 'accepted'].includes(status)) {
    return 'emerald'
  }

  if (
    ['draft', 'pending', 'settlement_draft', 'not_submitted'].includes(status)
  ) {
    return 'amber'
  }

  if (['cancelled', 'void', 'rejected', 'failed'].includes(status)) {
    return 'rose'
  }

  return 'slate'
}

export default async function AccountantDashboardPage() {
  await requireAccountantAccess()

  const supabase = createAdminClient()

  const now = new Date()
  const monthStart = startOfMonth(now)
  const yearStart = startOfYear(now)

  const [
    rentReceiptsResult,
    walletDepositsResult,
    ownerPayablesResult,
    settlementsResult,
    invoicesResult,
    ledgerResult,
  ] = await Promise.all([
    supabase
      .from('rent_collection_receipts')
      .select(`
        id,
        receipt_number,
        amount,
        status,
        receipt_type,
        issued_at,
        payer_name,
        owner_name,
        property_title,
        payout_reference:metadata
      `)
      .gte('issued_at', toISODate(yearStart))
      .order('issued_at', { ascending: false }),

    supabase
      .from('wallet_deposit_requests')
      .select(`
        id,
        amount,
        payment_method,
        status,
        transaction_reference,
        sender_name,
        sender_phone,
        created_at,
        reviewed_at
      `)
      .gte('created_at', toISODate(yearStart))
      .order('created_at', { ascending: false }),

    supabase
      .from('owner_payables')
      .select(`
        id,
        gross_rent_amount,
        service_fee_amount,
        payment_fee_amount,
        tax_amount,
        adjustment_amount,
        net_payable_amount,
        status,
        source_type,
        created_at,
        owner_id,
        broker_id,
        property_id,
        reservation_id
      `)
      .gte('created_at', toISODate(yearStart))
      .order('created_at', { ascending: false }),

    supabase
      .from('owner_settlements')
      .select(`
        id,
        settlement_number,
        status,
        gross_rent_collected,
        service_fee_amount,
        payment_fee_amount,
        tax_amount,
        adjustment_amount,
        net_payout_amount,
        period_start,
        period_end,
        payout_method,
        payout_reference,
        approved_at,
        paid_at,
        created_at
      `)
      .gte('created_at', toISODate(yearStart))
      .order('created_at', { ascending: false }),

    supabase
      .from('platform_fee_invoices')
      .select(`
        id,
        invoice_number,
        status,
        service_fee_amount,
        payment_fee_amount,
        subtotal_amount,
        tax_amount,
        total_amount,
        tax_rate,
        issued_at,
        paid_at,
        eta_submission_status,
        owner_id,
        broker_id,
        settlement_id
      `)
      .gte('issued_at', toISODate(yearStart))
      .order('issued_at', { ascending: false }),

    supabase
      .from('accounting_ledger_entries')
      .select(`
        id,
        entry_number,
        entry_type,
        direction,
        amount,
        currency,
        description,
        created_at,
        reference_table,
        reference_id
      `)
      .gte('created_at', toISODate(yearStart))
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const errors = [
    rentReceiptsResult.error,
    walletDepositsResult.error,
    ownerPayablesResult.error,
    settlementsResult.error,
    invoicesResult.error,
    ledgerResult.error,
  ].filter(Boolean)

  if (errors.length > 0) {
    throw new Error(errors.map((error) => error?.message).join(' | '))
  }

  const rentReceipts = rentReceiptsResult.data || []
  const walletDeposits = walletDepositsResult.data || []
  const ownerPayables = ownerPayablesResult.data || []
  const settlements = settlementsResult.data || []
  const invoices = invoicesResult.data || []
  const ledgerEntries = ledgerResult.data || []

  const issuedRentReceipts = rentReceipts.filter(
    (item: any) => item.status === 'issued'
  )
  const approvedWalletDeposits = walletDeposits.filter(
    (item: any) => item.status === 'approved'
  )

  const monthRentReceipts = issuedRentReceipts.filter((item: any) => {
    return item.issued_at && new Date(item.issued_at) >= monthStart
  })

  const monthWalletDeposits = approvedWalletDeposits.filter((item: any) => {
    return item.created_at && new Date(item.created_at) >= monthStart
  })

  const totalRentCollectedYtd = issuedRentReceipts.reduce(
    (sum: number, item: any) => sum + numberValue(item.amount),
    0
  )

  const totalRentCollectedMtd = monthRentReceipts.reduce(
    (sum: number, item: any) => sum + numberValue(item.amount),
    0
  )

  const totalWalletDepositsYtd = approvedWalletDeposits.reduce(
    (sum: number, item: any) => sum + numberValue(item.amount),
    0
  )

  const totalWalletDepositsMtd = monthWalletDeposits.reduce(
    (sum: number, item: any) => sum + numberValue(item.amount),
    0
  )

  const unsettledOwnerPayables = ownerPayables.filter(
    (item: any) => item.status === 'unsettled'
  )

  const totalUnsettledOwnerPayables = unsettledOwnerPayables.reduce(
    (sum: number, item: any) => sum + numberValue(item.net_payable_amount),
    0
  )

  const draftSettlements = settlements.filter(
    (item: any) => item.status === 'draft'
  )
  const approvedSettlements = settlements.filter(
    (item: any) => item.status === 'approved'
  )
  const paidSettlements = settlements.filter(
    (item: any) => item.status === 'paid'
  )

  const totalPaidOwnerPayoutsYtd = paidSettlements.reduce(
    (sum: number, item: any) => sum + numberValue(item.net_payout_amount),
    0
  )

  const totalApprovedAwaitingPayout = approvedSettlements.reduce(
    (sum: number, item: any) => sum + numberValue(item.net_payout_amount),
    0
  )

  const issuedInvoices = invoices.filter((item: any) => item.status === 'issued')
  const paidInvoices = invoices.filter((item: any) => item.status === 'paid')
  const validInvoices = invoices.filter((item: any) =>
    ['issued', 'paid'].includes(item.status)
  )

  const totalPlatformRevenueYtd = validInvoices.reduce(
    (sum: number, item: any) => sum + numberValue(item.subtotal_amount),
    0
  )

  const totalTaxPayableYtd = validInvoices.reduce(
    (sum: number, item: any) => sum + numberValue(item.tax_amount),
    0
  )

  const totalInvoicesYtd = validInvoices.reduce(
    (sum: number, item: any) => sum + numberValue(item.total_amount),
    0
  )

  const serviceFeesYtd = validInvoices.reduce(
    (sum: number, item: any) => sum + numberValue(item.service_fee_amount),
    0
  )

  const paymentFeesYtd = validInvoices.reduce(
    (sum: number, item: any) => sum + numberValue(item.payment_fee_amount),
    0
  )

  const incomingForTaxFile = totalRentCollectedYtd + totalWalletDepositsYtd
  const outgoingForTaxFile = totalPaidOwnerPayoutsYtd
  const netPlatformTaxableRevenue = totalPlatformRevenueYtd
  const estimatedCashPositionForReview = incomingForTaxFile - outgoingForTaxFile

  const walletDepositsPending = walletDeposits.filter(
    (item: any) => item.status === 'pending'
  )

  const paidSettlementsWithoutReference = paidSettlements.filter(
    (item: any) => !item.payout_reference
  )

  const invoiceMismatches = invoices.filter((invoice: any) => {
    const expected =
      numberValue(invoice.service_fee_amount) +
      numberValue(invoice.payment_fee_amount) +
      numberValue(invoice.tax_amount)

    return Math.abs(expected - numberValue(invoice.total_amount)) > 0.01
  })

  const taxReadinessIssues =
    invoiceMismatches.length +
    paidSettlementsWithoutReference.length +
    walletDepositsPending.length

  const ledgerDebitsYtd = ledgerEntries
    .filter((item: any) => item.direction === 'debit')
    .reduce((sum: number, item: any) => sum + numberValue(item.amount), 0)

  const ledgerCreditsYtd = ledgerEntries
    .filter((item: any) => item.direction === 'credit')
    .reduce((sum: number, item: any) => sum + numberValue(item.amount), 0)

  const ledgerDifference = ledgerDebitsYtd - ledgerCreditsYtd

  const recentSettlements = settlements.slice(0, 6)
  const recentInvoices = invoices.slice(0, 6)
  const recentReceipts = rentReceipts.slice(0, 6)

  return (
    <>
      <style>{`
        .navienty-logo {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          overflow: visible;
          transform: none;
          margin-top: -10px;
        }

        .navienty-logo-icon {
          width: 56px;
          height: 56px;
          object-fit: contain;
          flex-shrink: 0;
          display: block;
        }

        .navienty-logo-text-wrap {
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateX(-6px);
          transition:
            max-width 0.35s ease,
            opacity 0.25s ease,
            transform 0.35s ease;
          display: flex;
          align-items: center;
        }

        .navienty-logo:hover .navienty-logo-text-wrap,
        .navienty-logo:focus-visible .navienty-logo-text-wrap {
          max-width: 120px;
          opacity: 1;
          transform: translateX(0);
        }

        .navienty-logo-text {
          width: 112px;
          min-width: 112px;
          height: auto;
          object-fit: contain;
          display: block;
          transform: translateY(-2px);
        }

        .desktop-header-nav-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #20212a;
          text-decoration: none;
          font-size: 15px;
          line-height: 1;
          border: none;
          background: none;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          padding: 8px 0;
          transition: color 0.3s ease;
        }

        .desktop-header-nav-button::after,
        .desktop-header-nav-button::before {
          content: '';
          width: 0%;
          height: 2px;
          background: #000000;
          display: block;
          transition: 0.5s;
          position: absolute;
          left: 0;
        }

        .desktop-header-nav-button::before {
          top: 0;
        }

        .desktop-header-nav-button::after {
          bottom: 0;
        }

        .desktop-header-nav-button:hover::after,
        .desktop-header-nav-button:hover::before,
        .desktop-header-nav-button:focus-visible::after,
        .desktop-header-nav-button:focus-visible::before {
          width: 100%;
        }

        .desktop-header-nav-button-active {
          color: #054aff;
        }

        @media (max-width: 768px) {
          .navienty-logo {
            transform: none;
            margin-top: 0;
          }

          .navienty-logo-icon {
            width: 42px;
            height: 42px;
          }

          .navienty-logo-text-wrap {
            display: none;
          }

          .mobile-header-inner {
            justify-content: center !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef4ff,_#f8fafc_45%,_#f8fafc_100%)] pb-10 text-slate-950">
        <header className="sticky top-0 z-[110] bg-[#f5f7f9]">
          <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
            <BrandLogo />

            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/admin/finance/accountant"
                className="desktop-header-nav-button desktop-header-nav-button-active"
              >
                Accountant
              </Link>

              <Link
                href="/admin/finance/deposit-requests"
                className="desktop-header-nav-button"
              >
                Deposit Requests
              </Link>

              <Link
                href="/admin/finance/reports/tax-file"
                className="desktop-header-nav-button"
              >
                Tax File
              </Link>

              <Link
                href="/admin/change-password"
                className="desktop-header-nav-button"
              >
                Change Password
              </Link>

              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                Finance Control Center
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Accountant Dashboard
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
                Review collections, payouts, owner settlements, invoices, ledger
                entries, reconciliation risks, and tax-file-ready financial
                totals.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Pill tone="blue">YTD from {yearStart.getFullYear()}</Pill>
              <Pill tone="emerald">MTD active</Pill>
              <Pill tone={taxReadinessIssues ? 'amber' : 'emerald'}>
                {taxReadinessIssues
                  ? `${formatNumber(taxReadinessIssues)} tax checks`
                  : 'Tax ready'}
              </Pill>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Rent collected MTD"
              value={formatCurrency(totalRentCollectedMtd)}
              description="Issued rent collection receipts this month."
              tone="emerald"
            />

            <StatCard
              label="Wallet deposits MTD"
              value={formatCurrency(totalWalletDepositsMtd)}
              description="Approved wallet deposits this month."
              tone="blue"
            />

            <StatCard
              label="Unsettled owner payables"
              value={formatCurrency(totalUnsettledOwnerPayables)}
              description={`${formatNumber(unsettledOwnerPayables.length)} unsettled payable records.`}
              tone="amber"
            />

            <StatCard
              label="Awaiting owner payout"
              value={formatCurrency(totalApprovedAwaitingPayout)}
              description={`${formatNumber(approvedSettlements.length)} approved settlements not paid yet.`}
              tone="rose"
            />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Platform revenue YTD"
              value={formatCurrency(totalPlatformRevenueYtd)}
              description="Service fees + payment fees before tax."
              tone="purple"
            />

            <StatCard
              label="Tax payable YTD"
              value={formatCurrency(totalTaxPayableYtd)}
              description="Tax amount from issued and paid platform invoices."
              tone="amber"
            />

            <StatCard
              label="Owner payouts YTD"
              value={formatCurrency(totalPaidOwnerPayoutsYtd)}
              description="Paid settlement net payout amounts."
              tone="emerald"
            />

            <StatCard
              label="Invoice total YTD"
              value={formatCurrency(totalInvoicesYtd)}
              description={`${formatNumber(issuedInvoices.length)} issued / ${formatNumber(paidInvoices.length)} paid invoices.`}
              tone="blue"
            />
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
            <SectionCard
              title="Tax File Summary"
              description="A tax-ready executive summary for incoming cash, outgoing payouts, platform revenue, tax liability, and compliance checks."
              action={
                <div className="flex flex-wrap gap-2">
                  <Pill tone={taxReadinessIssues ? 'amber' : 'emerald'}>
                    {taxReadinessIssues
                      ? 'Needs review'
                      : 'Ready for review'}
                  </Pill>

                  <Link
                    href="/admin/finance/reports/tax-file"
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 px-4 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Print / Save PDF
                  </Link>
                </div>
              }
            >
              <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-[0_16px_45px_rgba(15,23,42,0.18)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">
                      Tax Supporting Report
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight">
                      تقرير ملخص الملف الضريبي
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                      Summary prepared from issued receipts, approved wallet
                      deposits, paid owner settlements, and platform fee
                      invoices. Open the official tax report page to print or
                      save as PDF.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">
                      Estimated cash position
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {formatCurrency(estimatedCashPositionForReview)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">
                      Incoming cash basis minus paid owner payouts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <TaxMetricCard
                  label="Incoming cash basis YTD"
                  value={formatCurrency(incomingForTaxFile)}
                  description="Rent receipts + approved wallet deposits."
                  tone="blue"
                />

                <TaxMetricCard
                  label="Outgoing payouts YTD"
                  value={formatCurrency(outgoingForTaxFile)}
                  description="Paid owner settlements only."
                  tone="emerald"
                />

                <TaxMetricCard
                  label="Taxable platform revenue"
                  value={formatCurrency(netPlatformTaxableRevenue)}
                  description="Service fees + payment fees before tax."
                  tone="purple"
                />

                <TaxMetricCard
                  label="Tax payable YTD"
                  value={formatCurrency(totalTaxPayableYtd)}
                  description="Tax amount from issued and paid invoices."
                  tone="amber"
                />
              </div>

              <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                  <TaxBreakdownRow
                    label="Total rent collected"
                    value={formatCurrency(totalRentCollectedYtd)}
                    description="Issued rent collection receipts within current year."
                  />

                  <TaxBreakdownRow
                    label="Total approved wallet deposits"
                    value={formatCurrency(totalWalletDepositsYtd)}
                    description="Approved student wallet deposits within current year."
                  />

                  <TaxBreakdownRow
                    label="Platform service fees"
                    value={formatCurrency(serviceFeesYtd)}
                    description="Service fee amount from issued and paid platform invoices."
                  />

                  <TaxBreakdownRow
                    label="Platform payment fees"
                    value={formatCurrency(paymentFeesYtd)}
                    description="Payment fee amount from issued and paid platform invoices."
                  />

                  <TaxBreakdownRow
                    label="Total platform invoices"
                    value={formatCurrency(totalInvoicesYtd)}
                    description="Total invoice value including tax."
                  />
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        Tax readiness checks
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Resolve these items before submitting or sharing the tax
                        file with the accountant.
                      </p>
                    </div>

                    <Pill tone={taxReadinessIssues ? 'amber' : 'emerald'}>
                      {taxReadinessIssues
                        ? `${formatNumber(taxReadinessIssues)} issues`
                        : 'Clean'}
                    </Pill>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                      <span className="text-xs font-bold text-slate-600">
                        Pending wallet deposits
                      </span>
                      <Pill
                        tone={
                          walletDepositsPending.length ? 'amber' : 'emerald'
                        }
                      >
                        {formatNumber(walletDepositsPending.length)}
                      </Pill>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                      <span className="text-xs font-bold text-slate-600">
                        Paid payouts missing reference
                      </span>
                      <Pill
                        tone={
                          paidSettlementsWithoutReference.length
                            ? 'rose'
                            : 'emerald'
                        }
                      >
                        {formatNumber(paidSettlementsWithoutReference.length)}
                      </Pill>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                      <span className="text-xs font-bold text-slate-600">
                        Invoice total mismatches
                      </span>
                      <Pill tone={invoiceMismatches.length ? 'rose' : 'emerald'}>
                        {formatNumber(invoiceMismatches.length)}
                      </Pill>
                    </div>
                  </div>

                  <Link
                    href="/admin/finance/reports/tax-file"
                    className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
                  >
                    Open official tax report
                  </Link>
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-black text-amber-950">
                  Tax filing note
                </p>
                <p className="mt-1 text-sm leading-7 text-amber-900/80">
                  This summary is prepared for tax review and internal
                  reconciliation. It includes collections, wallet deposits, owner
                  payouts, platform revenue, and invoice tax. For full tax-file
                  accuracy, operational expenses such as salaries, office rent,
                  ads, legal fees, bank charges, and vendor invoices should be
                  tracked in a dedicated expenses module.
                </p>
              </div>
            </SectionCard>

            <SectionCard
              title="Accounting Health Checks"
              description="Issues that should be reviewed before closing the period."
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      Pending wallet deposits
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Requests waiting for approval or rejection.
                    </p>
                  </div>
                  <Pill
                    tone={walletDepositsPending.length ? 'amber' : 'emerald'}
                  >
                    {formatNumber(walletDepositsPending.length)}
                  </Pill>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      Paid settlements missing payout reference
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Paid payouts should have a bank/cash reference.
                    </p>
                  </div>
                  <Pill
                    tone={
                      paidSettlementsWithoutReference.length
                        ? 'rose'
                        : 'emerald'
                    }
                  >
                    {formatNumber(paidSettlementsWithoutReference.length)}
                  </Pill>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      Invoice total mismatches
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Service fee + payment fee + tax should equal total.
                    </p>
                  </div>
                  <Pill tone={invoiceMismatches.length ? 'rose' : 'emerald'}>
                    {formatNumber(invoiceMismatches.length)}
                  </Pill>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      Ledger sample balance
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Based on latest fetched ledger entries.
                    </p>
                  </div>
                  <Pill
                    tone={Math.abs(ledgerDifference) > 0.01 ? 'amber' : 'emerald'}
                  >
                    {formatCurrency(ledgerDifference)}
                  </Pill>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <SectionCard
              title="Collections Review"
              description="Latest issued rent receipts."
              action={
                <Link
                  href="/admin/finance/rent-receipts"
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 px-4 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  View all
                </Link>
              }
            >
              {recentReceipts.length === 0 ? (
                <EmptySmall message="No rent receipts found." />
              ) : (
                <div className="space-y-3">
                  {recentReceipts.map((receipt: any) => (
                    <div
                      key={receipt.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs font-black text-slate-500">
                            {receipt.receipt_number}
                          </p>
                          <p className="mt-1 text-sm font-black text-slate-950">
                            {receipt.payer_name || 'Unknown payer'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {receipt.property_title || 'No property title'}
                          </p>
                        </div>
                        <Pill tone={statusTone(receipt.status)}>
                          {receipt.status}
                        </Pill>
                      </div>

                      <div className="mt-3 flex items-end justify-between gap-3">
                        <p className="text-lg font-black text-slate-950">
                          {formatCurrency(receipt.amount)}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {formatDate(receipt.issued_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Owner Settlements"
              description="Latest settlement records."
              action={
                <Link
                  href="/admin/finance/settlements"
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 px-4 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  View all
                </Link>
              }
            >
              {recentSettlements.length === 0 ? (
                <EmptySmall message="No settlements found." />
              ) : (
                <div className="space-y-3">
                  {recentSettlements.map((settlement: any) => (
                    <div
                      key={settlement.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs font-black text-slate-500">
                            {settlement.settlement_number}
                          </p>
                          <p className="mt-1 text-sm font-black text-slate-950">
                            Net payout
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {settlement.period_start || '-'} →{' '}
                            {settlement.period_end || '-'}
                          </p>
                        </div>
                        <Pill tone={statusTone(settlement.status)}>
                          {settlement.status}
                        </Pill>
                      </div>

                      <div className="mt-3 flex items-end justify-between gap-3">
                        <p className="text-lg font-black text-slate-950">
                          {formatCurrency(settlement.net_payout_amount)}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {settlement.payout_method || 'No payout method'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Platform Invoices"
              description="Latest platform fee invoices."
              action={
                <Link
                  href="/admin/finance/platform-invoices"
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 px-4 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  View all
                </Link>
              }
            >
              {recentInvoices.length === 0 ? (
                <EmptySmall message="No platform invoices found." />
              ) : (
                <div className="space-y-3">
                  {recentInvoices.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs font-black text-slate-500">
                            {invoice.invoice_number}
                          </p>
                          <p className="mt-1 text-sm font-black text-slate-950">
                            {formatCurrency(invoice.total_amount)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Tax: {formatCurrency(invoice.tax_amount)}
                          </p>
                        </div>
                        <Pill tone={statusTone(invoice.status)}>
                          {invoice.status}
                        </Pill>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <Pill tone={statusTone(invoice.eta_submission_status)}>
                          ETA: {invoice.eta_submission_status || 'not_submitted'}
                        </Pill>
                        <p className="text-xs font-semibold text-slate-500">
                          {formatDate(invoice.issued_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <SectionCard
              title="Reports Center"
              description="Reports the accountant can generate or review."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <QuickLink
                  href="/admin/finance/reports/owner-statement"
                  title="Owner Statement"
                  description="Owner collections, deductions, settlements, and payouts."
                  tone="emerald"
                />

                <QuickLink
                  href="/admin/finance/reports/student-statement"
                  title="Student Statement"
                  description="Wallet deposits, booking payments, deductions, and refunds."
                  tone="blue"
                />

                <QuickLink
                  href="/admin/finance/reports/property-revenue"
                  title="Property Revenue"
                  description="Gross rent, platform fees, owner payout, and tax by property."
                  tone="purple"
                />

                <QuickLink
                  href="/admin/finance/reports/tax-file"
                  title="Tax File"
                  description="Printable PDF-ready tax supporting report."
                  tone="amber"
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Latest Ledger Entries"
              description="Recent accounting entries from the general ledger."
              action={
                <Link
                  href="/admin/finance/ledger"
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 px-4 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Open ledger
                </Link>
              }
            >
              {ledgerEntries.length === 0 ? (
                <EmptySmall message="No ledger entries found." />
              ) : (
                <div className="overflow-hidden rounded-3xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                            Entry
                          </th>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                            Type
                          </th>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                            Direction
                          </th>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                            Date
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200 bg-white">
                        {ledgerEntries.map((entry: any) => (
                          <tr key={entry.id}>
                            <td className="whitespace-nowrap px-4 py-3">
                              <div className="font-mono text-xs font-black text-slate-600">
                                {entry.entry_number}
                              </div>
                              <div className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                                {entry.description || '-'}
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-4 py-3">
                              <Pill tone="slate">{entry.entry_type}</Pill>
                            </td>

                            <td className="whitespace-nowrap px-4 py-3">
                              <Pill
                                tone={
                                  entry.direction === 'debit'
                                    ? 'blue'
                                    : 'emerald'
                                }
                              >
                                {entry.direction}
                              </Pill>
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 font-black text-slate-950">
                              {formatCurrency(entry.amount)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-500">
                              {formatDate(entry.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          <div className="mt-6">
            <SectionCard
              title="Accountant Navigation"
              description="Recommended accountant sections based on your current database schema."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <QuickLink
                  href="/admin/finance/ledger"
                  title="General Ledger"
                  description="All debit and credit accounting entries."
                  tone="slate"
                />

                <QuickLink
                  href="/admin/finance/rent-receipts"
                  title="Rent Receipts"
                  description="Issued, draft, and void collection receipts."
                  tone="emerald"
                />

                <QuickLink
                  href="/admin/finance/deposit-requests"
                  title="Wallet Deposits"
                  description="Review incoming wallet deposit requests."
                  tone="blue"
                />

                <QuickLink
                  href="/admin/finance/owner-payables"
                  title="Owner Payables"
                  description="Unsettled, draft, settled, and cancelled owner dues."
                  tone="amber"
                />

                <QuickLink
                  href="/admin/finance/settlements"
                  title="Owner Settlements"
                  description="Draft, approved, paid, and cancelled payout batches."
                  tone="purple"
                />

                <QuickLink
                  href="/admin/finance/platform-invoices"
                  title="Platform Invoices"
                  description="Service fees, payment fees, tax, and ETA status."
                  tone="rose"
                />

                <QuickLink
                  href="/admin/finance/reconciliation"
                  title="Reconciliation"
                  description="Find missing ledger entries and mismatched totals."
                  tone="amber"
                />

                <QuickLink
                  href="/admin/finance/adjustments"
                  title="Adjustments"
                  description="Manual corrections with audit and ledger trail."
                  tone="rose"
                />

                <QuickLink
                  href="/admin/finance/settings"
                  title="Finance Settings"
                  description="Service fee, payment fee, tax rate, and company info."
                  tone="slate"
                />
              </div>
            </SectionCard>
          </div>
        </section>
      </main>
    </>
  )
}