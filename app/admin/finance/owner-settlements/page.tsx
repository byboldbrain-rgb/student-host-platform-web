import type { ReactNode } from 'react'
import Link from 'next/link'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  requireOwnerSettlementsAccess,
  isSuperAdmin,
  isAPAdmin,
} from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'
import AdminOwnerSettlementsNotifications from './AdminOwnerSettlementNotifications'
import {
  approveOwnerSettlementAction,
  cancelOwnerSettlementAction,
  createOwnerSettlementAction,
  markOwnerSettlementPaidAction,
} from './actions'

type PropertyOwnerRow = {
  id: string
  full_name: string
  phone_number: string | null
  whatsapp_number: string | null
  email: string | null
  tax_id: string | null
  notes: string | null
  is_active: boolean
}

type BrokerRow = {
  full_name?: string | null
  company_name?: string | null
  phone_number?: string | null
  whatsapp_number?: string | null
  email?: string | null
}

type PropertyRow = {
  property_id?: string | null
  title_en?: string | null
  title_ar?: string | null
}

type PropertyReservationRow = {
  customer_name?: string | null
  customer_phone?: string | null
}

type OwnerPayoutAccountRow = {
  id: string
  owner_id: string
  broker_id: string
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
  notes?: string | null
  captured_at?: string | null
}

type OwnerPayableRow = {
  id: string
  owner_id: string
  broker_id: string
  property_id: string
  reservation_id: string
  billing_cycle_id: string | null
  source_type: string
  gross_rent_amount: number
  service_fee_amount: number
  payment_fee_amount: number
  tax_amount: number
  adjustment_amount: number
  net_payable_amount: number
  currency: string
  status: string
  created_at: string
  brokers?: BrokerRow | null
  property_owners?: PropertyOwnerRow | null
  properties?: PropertyRow | null
  property_reservations?: PropertyReservationRow | null
}

type SettlementMetadata = {
  payables_count?: number
  owner_payout_account_id?: string
  owner_payout_method?: string
  owner_payout_details_snapshot?: OwnerPayoutAccountRow | null
  [key: string]: any
}

type SettlementRow = {
  id: string
  settlement_number: string
  owner_id: string
  broker_id: string
  status: 'draft' | 'approved' | 'paid' | 'cancelled'
  gross_rent_collected: number
  service_fee_amount: number
  payment_fee_amount: number
  tax_amount: number
  adjustment_amount: number
  net_payout_amount: number
  currency: string
  period_start: string | null
  period_end: string | null
  payout_method: string | null
  payout_reference: string | null
  payout_receipt_url: string | null
  metadata: SettlementMetadata | null
  created_at: string
  approved_at: string | null
  paid_at: string | null
  brokers?: BrokerRow | null
  property_owners?: PropertyOwnerRow | null
}

type GroupedPayables = {
  owner_id: string
  broker_id: string
  owner_name: string
  broker_name: string
  currency: string
  payout_account: OwnerPayoutAccountRow | null
  owner?: PropertyOwnerRow | null
  broker?: BrokerRow | null
  payables: OwnerPayableRow[]
  gross_rent_amount: number
  service_fee_amount: number
  payment_fee_amount: number
  tax_amount: number
  adjustment_amount: number
  net_payable_amount: number
}

type OwnerSettlementsPageProps = {
  searchParams?: Promise<{
    tab?: string
  }>
}

type ActiveTab = 'payables' | 'settlements'

function BrandLogo() {
  return (
    <Link
      href="/admin/finance/owner-settlements"
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

function WalletIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M19 7V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1" />
      <path d="M16 12h6v5h-6a2.5 2.5 0 0 1 0-5Z" />
      <path d="M18 14.5h.01" />
    </svg>
  )
}

function ClipboardListIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  )
}

function CheckIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function ClockIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function AlertIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function formatCurrency(
  amount: number | string | null | undefined,
  currency = 'EGP'
) {
  const value = Number(amount || 0)

  try {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`
  }
}

function formatDate(date?: string | null) {
  if (!date) return '—'

  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date))
  } catch {
    return '—'
  }
}

function getBrokerName(row: {
  brokers?: {
    full_name?: string | null
    company_name?: string | null
  } | null
}) {
  return row.brokers?.company_name || row.brokers?.full_name || 'Broker'
}

function getOwnerName(row: {
  property_owners?: {
    full_name?: string | null
  } | null
}) {
  return row.property_owners?.full_name || 'Owner'
}

function formatPayoutMethod(method?: string | null) {
  if (!method) return '—'

  const labels: Record<string, string> = {
    bank_transfer: 'Bank Transfer',
    instapay: 'Instapay',
    vodafone_cash: 'Vodafone Cash',
    orange_cash: 'Orange Cash',
    etisalat_cash: 'Etisalat Cash',
    cash: 'Cash',
    wallet: 'Wallet',
  }

  return labels[method] || method
}

function getStatusClass(status: string) {
  if (status === 'draft') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (status === 'approved') {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  if (status === 'paid') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'cancelled') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  return 'border-slate-200 bg-slate-100 text-slate-700'
}

function getPaidPayoutSnapshot(settlement: SettlementRow) {
  if (settlement.status !== 'paid') return null

  const snapshot = settlement.metadata?.owner_payout_details_snapshot

  if (!snapshot || typeof snapshot !== 'object') return null

  return snapshot as OwnerPayoutAccountRow
}

function normalizeSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] || null
  }

  return value || null
}

function normalizeOwnerPayableRows(rows: any[]): OwnerPayableRow[] {
  return rows.map((row) => ({
    ...row,
    brokers: normalizeSingleRelation<BrokerRow>(row.brokers),
    property_owners: normalizeSingleRelation<PropertyOwnerRow>(
      row.property_owners
    ),
    properties: normalizeSingleRelation<PropertyRow>(row.properties),
    property_reservations: normalizeSingleRelation<PropertyReservationRow>(
      row.property_reservations
    ),
  })) as OwnerPayableRow[]
}

function normalizeSettlementRows(rows: any[]): SettlementRow[] {
  return rows.map((row) => ({
    ...row,
    brokers: normalizeSingleRelation<BrokerRow>(row.brokers),
    property_owners: normalizeSingleRelation<PropertyOwnerRow>(
      row.property_owners
    ),
  })) as SettlementRow[]
}

function getPayoutAccountMapKey(ownerId: string, brokerId: string) {
  return `${ownerId}:${brokerId}`
}

function groupPayablesByOwner(
  payables: OwnerPayableRow[],
  payoutAccountsMap: Map<string, OwnerPayoutAccountRow>
) {
  const map = new Map<string, GroupedPayables>()

  payables.forEach((payable) => {
    const groupKey = getPayoutAccountMapKey(payable.owner_id, payable.broker_id)
    const current = map.get(groupKey)
    const ownerName = getOwnerName(payable)
    const brokerName = getBrokerName(payable)
    const currency = payable.currency || 'EGP'
    const payoutAccount = payoutAccountsMap.get(groupKey) || null

    if (!current) {
      map.set(groupKey, {
        owner_id: payable.owner_id,
        broker_id: payable.broker_id,
        owner_name: ownerName,
        broker_name: brokerName,
        currency,
        payout_account: payoutAccount,
        owner: payable.property_owners,
        broker: payable.brokers,
        payables: [payable],
        gross_rent_amount: Number(payable.gross_rent_amount || 0),
        service_fee_amount: Number(payable.service_fee_amount || 0),
        payment_fee_amount: Number(payable.payment_fee_amount || 0),
        tax_amount: Number(payable.tax_amount || 0),
        adjustment_amount: Number(payable.adjustment_amount || 0),
        net_payable_amount: Number(payable.net_payable_amount || 0),
      })
      return
    }

    current.payables.push(payable)
    current.gross_rent_amount += Number(payable.gross_rent_amount || 0)
    current.service_fee_amount += Number(payable.service_fee_amount || 0)
    current.payment_fee_amount += Number(payable.payment_fee_amount || 0)
    current.tax_amount += Number(payable.tax_amount || 0)
    current.adjustment_amount += Number(payable.adjustment_amount || 0)
    current.net_payable_amount += Number(payable.net_payable_amount || 0)
  })

  return Array.from(map.values())
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div
        className={[
          'mt-1.5 break-words text-sm font-bold text-slate-950',
          mono ? 'font-mono text-[13px] tracking-tight' : '',
        ].join(' ')}
      >
        {value}
      </div>
    </div>
  )
}

function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#054aff]">
            {eyebrow}
          </p>
        ) : null}

        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h2>

        {description ? (
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

function TabsNav({
  activeTab,
  payablesCount,
  settlementsCount,
}: {
  activeTab: ActiveTab
  payablesCount: number
  settlementsCount: number
}) {
  const tabs: {
    id: ActiveTab
    href: string
    label: string
    description: string
    count: number
    icon: ReactNode
  }[] = [
    {
      id: 'payables',
      href: '/admin/finance/owner-settlements?tab=payables',
      label: 'Unsettled Payables',
      description: 'Create owner settlements',
      count: payablesCount,
      icon: <WalletIcon className="h-5 w-5" />,
    },
    {
      id: 'settlements',
      href: '/admin/finance/owner-settlements?tab=settlements',
      label: 'Settlements',
      description: 'Approve and pay settlements',
      count: settlementsCount,
      icon: <ClipboardListIcon className="h-5 w-5" />,
    },
  ]

  return (
    <div className="mb-8 rounded-[30px] border border-white/80 bg-white/80 p-2 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03] backdrop-blur">
      <div className="grid gap-2 md:grid-cols-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={[
                'group flex items-center justify-between gap-4 rounded-[24px] border px-4 py-4 transition duration-300 sm:px-5',
                isActive
                  ? 'border-[#054aff]/20 bg-[#054aff] text-white shadow-[0_14px_40px_rgba(5,74,255,0.28)]'
                  : 'border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950 hover:shadow-sm',
              ].join(' ')}
            >
              <span className="flex min-w-0 items-center gap-4">
                <span
                  className={[
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition',
                    isActive
                      ? 'border-white/20 bg-white/15 text-white'
                      : 'border-slate-200 bg-white text-[#054aff]',
                  ].join(' ')}
                >
                  {tab.icon}
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-black">{tab.label}</span>
                  <span
                    className={[
                      'mt-1 block truncate text-xs font-semibold',
                      isActive ? 'text-blue-100' : 'text-slate-400',
                    ].join(' ')}
                  >
                    {tab.description}
                  </span>
                </span>
              </span>

              <span
                className={[
                  'inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-black',
                  isActive
                    ? 'bg-white text-[#054aff]'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-[#054aff]/10 group-hover:text-[#054aff]',
                ].join(' ')}
              >
                {tab.count > 99 ? '99+' : tab.count}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function ActionButton({
  children,
  variant,
}: {
  children: ReactNode
  variant: 'approve' | 'reject' | 'primary' | 'paid'
}) {
  const className =
    variant === 'approve'
      ? 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/20'
      : variant === 'reject'
        ? 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600/20'
        : variant === 'paid'
          ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/20'
          : 'bg-[#054aff] text-white hover:bg-[#003ed6] focus-visible:ring-[#054aff]/20'

  return (
    <button
      type="submit"
      className={`inline-flex h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-black shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-4 ${className}`}
    >
      {children}
    </button>
  )
}

function TextInput({
  name,
  placeholder,
  required = false,
  disabled = false,
  defaultValue,
}: {
  name: string
  placeholder: string
  required?: boolean
  disabled?: boolean
  defaultValue?: string | null
}) {
  return (
    <input
      name={name}
      type="text"
      required={required}
      disabled={disabled}
      defaultValue={defaultValue || ''}
      placeholder={placeholder}
      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    />
  )
}

function SelectInput({
  name,
  required = false,
  disabled = false,
  defaultValue,
  children,
}: {
  name: string
  required?: boolean
  disabled?: boolean
  defaultValue?: string | null
  children: ReactNode
}) {
  return (
    <select
      name={name}
      required={required}
      disabled={disabled}
      defaultValue={defaultValue || ''}
      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    >
      {children}
    </select>
  )
}

function ReceiptUploadInput({ disabled = false }: { disabled?: boolean }) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
        Upload Receipt
      </label>

      <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
        <label
          htmlFor="payout_receipt_file"
          className={[
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed p-4 text-center transition',
            disabled
              ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
              : 'border-blue-200 bg-blue-50/40 text-slate-700 hover:border-[#054aff] hover:bg-blue-50',
          ].join(' ')}
        >
          <span className="text-sm font-black">Choose receipt image</span>

          <span className="text-xs font-semibold text-slate-500">
            PNG, JPG, JPEG, WEBP
          </span>

          <input
            id="payout_receipt_file"
            name="payout_receipt_file"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            disabled={disabled}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 file:mr-3 file:cursor-pointer file:rounded-xl file:border-0 file:bg-[#054aff] file:px-4 file:py-2 file:text-xs file:font-black file:text-white hover:file:bg-[#003ed6] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          />
        </label>
      </div>
    </div>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section className="rounded-[32px] border border-dashed border-slate-300 bg-white/90 p-10 text-center shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-14">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
        <ClipboardListIcon />
      </div>

      <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
        {description}
      </p>
    </section>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black capitalize ${getStatusClass(
        status
      )}`}
    >
      {status}
    </span>
  )
}

function PayoutDetailsCard({
  payoutAccount,
  isSnapshot = false,
}: {
  payoutAccount?: OwnerPayoutAccountRow | null
  isSnapshot?: boolean
}) {
  if (!payoutAccount) {
    return (
      <div className="rounded-[26px] border border-rose-100 bg-rose-50/80 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm">
            <AlertIcon />
          </div>

          <div>
            <h3 className="text-sm font-black text-rose-950">
              Missing payout details
            </h3>
            <p className="mt-1 text-sm font-medium leading-6 text-rose-800/80">
              Add active payout details before marking this settlement as paid.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[26px] border border-emerald-100 bg-emerald-50/80 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div>
            <h3 className="text-sm font-black text-emerald-950">
              Payout details ready
            </h3>
          </div>
        </div>

        {isSnapshot ? (
          <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-black text-emerald-700">
            Snapshot
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <DetailItem
          label="Method"
          value={formatPayoutMethod(payoutAccount.payout_method)}
        />
        <DetailItem
          label="Account Holder"
          value={payoutAccount.account_holder_name || '—'}
        />
        <DetailItem label="Phone" value={payoutAccount.phone_number || '—'} mono />
        <DetailItem
          label="Instapay"
          value={payoutAccount.instapay_handle || '—'}
          mono
        />
        <DetailItem
          label="Wallet Number"
          value={payoutAccount.wallet_number || '—'}
          mono
        />
        <DetailItem label="Bank" value={payoutAccount.bank_name || '—'} />
      </div>
    </div>
  )
}

function CreateSettlementForm({ group }: { group: GroupedPayables }) {
  return (
    <form action={createOwnerSettlementAction}>
      <input type="hidden" name="owner_id" value={group.owner_id} />
      <input type="hidden" name="broker_id" value={group.broker_id} />
      <ActionButton variant="primary">Create Settlement</ActionButton>
    </form>
  )
}

function ApproveSettlementForm({ settlementId }: { settlementId: string }) {
  return (
    <form action={approveOwnerSettlementAction}>
      <input type="hidden" name="settlement_id" value={settlementId} />
      <ActionButton variant="approve">Approve</ActionButton>
    </form>
  )
}

function CancelSettlementForm({ settlementId }: { settlementId: string }) {
  return (
    <form action={cancelOwnerSettlementAction}>
      <input type="hidden" name="settlement_id" value={settlementId} />
      <input
        type="hidden"
        name="cancel_reason"
        value="Cancelled from finance page"
      />
      <ActionButton variant="reject">Cancel</ActionButton>
    </form>
  )
}

function MarkSettlementPaidForm({
  settlementId,
  payoutAccount,
}: {
  settlementId: string
  payoutAccount?: OwnerPayoutAccountRow | null
}) {
  const defaultPayoutMethod = payoutAccount?.payout_method || 'bank_transfer'

  return (
    <form action={markOwnerSettlementPaidAction} className="space-y-4">
      <input type="hidden" name="settlement_id" value={settlementId} />

      {!payoutAccount ? (
        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5">
          <div className="text-sm font-black text-rose-950">
            Missing payout details
          </div>
          <p className="mt-1 text-sm font-medium leading-6 text-rose-800/80">
            This owner has no active payout details. Add payout details before
            marking this settlement as paid.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3">
        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Payout Method
          </label>
          <SelectInput
            name="payout_method"
            required
            defaultValue={defaultPayoutMethod}
            disabled={!payoutAccount}
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="instapay">Instapay</option>
            <option value="vodafone_cash">Vodafone Cash</option>
            <option value="orange_cash">Orange Cash</option>
            <option value="etisalat_cash">Etisalat Cash</option>
            <option value="cash">Cash</option>
          </SelectInput>
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Transfer Reference
          </label>
          <TextInput
            name="payout_reference"
            placeholder="Enter transfer reference"
            required
            disabled={!payoutAccount}
          />
        </div>

        <ReceiptUploadInput disabled={!payoutAccount} />
      </div>

      <button
        type="submit"
        disabled={!payoutAccount}
        className={`inline-flex h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-black shadow-sm transition focus:outline-none focus-visible:ring-4 ${
          payoutAccount
            ? 'bg-emerald-600 text-white hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg focus-visible:ring-emerald-600/20'
            : 'cursor-not-allowed bg-slate-100 text-slate-400'
        }`}
      >
        Mark as Paid
      </button>
    </form>
  )
}

function OwnerSummaryGrid({
  owner,
  broker,
}: {
  owner?: PropertyOwnerRow | null
  broker?: BrokerRow | null
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <DetailItem label="Owner" value={owner?.full_name || '—'} />
      <DetailItem label="Owner Phone" value={owner?.phone_number || '—'} mono />
      <DetailItem
        label="Broker"
        value={broker?.company_name || broker?.full_name || '—'}
      />
      <DetailItem label="Broker Phone" value={broker?.phone_number || '—'} mono />
    </div>
  )
}

function PayablesTable({ payables }: { payables: OwnerPayableRow[] }) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-5 py-4 font-black">Property</th>
              <th className="px-5 py-4 font-black">Customer</th>
              <th className="px-5 py-4 font-black">Source</th>
              <th className="px-5 py-4 font-black">Gross</th>
              <th className="px-5 py-4 font-black">Fees</th>
              <th className="px-5 py-4 font-black">Tax</th>
              <th className="px-5 py-4 font-black">Net</th>
              <th className="px-5 py-4 font-black">Created</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {payables.map((payable) => (
              <tr
                key={payable.id}
                className="align-top transition hover:bg-slate-50/70"
              >
                <td className="px-5 py-4">
                  <p className="font-black text-slate-950">
                    {payable.properties?.title_en ||
                      payable.properties?.title_ar ||
                      'Property'}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {payable.properties?.property_id || '—'}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="font-bold text-slate-950">
                    {payable.property_reservations?.customer_name || '—'}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {payable.property_reservations?.customer_phone || '—'}
                  </p>
                </td>

                <td className="px-5 py-4 font-bold text-slate-600">
                  {payable.source_type}
                </td>

                <td className="px-5 py-4 font-black text-slate-950">
                  {formatCurrency(payable.gross_rent_amount, payable.currency)}
                </td>

                <td className="px-5 py-4 font-bold text-slate-600">
                  {formatCurrency(
                    Number(payable.service_fee_amount || 0) +
                      Number(payable.payment_fee_amount || 0),
                    payable.currency
                  )}
                </td>

                <td className="px-5 py-4 font-bold text-slate-600">
                  {formatCurrency(payable.tax_amount, payable.currency)}
                </td>

                <td className="px-5 py-4 font-black text-emerald-700">
                  {formatCurrency(payable.net_payable_amount, payable.currency)}
                </td>

                <td className="px-5 py-4 font-bold text-slate-500">
                  {formatDate(payable.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default async function OwnerSettlementsPage({
  searchParams,
}: OwnerSettlementsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const activeTab: ActiveTab =
    resolvedSearchParams.tab === 'settlements' ? 'settlements' : 'payables'

  const adminContext = await requireOwnerSettlementsAccess()
  const supabase = createAdminClient()
  const admin = adminContext.admin
  const hasGlobalOwnerSettlementsAccess = isSuperAdmin(admin) || isAPAdmin(admin)

  let payablesQuery = supabase
    .from('owner_payables')
    .select(`
      id,
      owner_id,
      broker_id,
      property_id,
      reservation_id,
      billing_cycle_id,
      source_type,
      gross_rent_amount,
      service_fee_amount,
      payment_fee_amount,
      tax_amount,
      adjustment_amount,
      net_payable_amount,
      currency,
      status,
      created_at,
      brokers (
        full_name,
        company_name,
        phone_number,
        whatsapp_number,
        email
      ),
      property_owners (
        id,
        full_name,
        phone_number,
        whatsapp_number,
        email,
        tax_id,
        notes,
        is_active
      ),
      properties (
        property_id,
        title_en,
        title_ar
      ),
      property_reservations (
        customer_name,
        customer_phone
      )
    `)
    .eq('status', 'unsettled')
    .order('created_at', { ascending: true })

  let settlementsQuery = supabase
    .from('owner_settlements')
    .select(`
      id,
      settlement_number,
      owner_id,
      broker_id,
      status,
      gross_rent_collected,
      service_fee_amount,
      payment_fee_amount,
      tax_amount,
      adjustment_amount,
      net_payout_amount,
      currency,
      period_start,
      period_end,
      payout_method,
      payout_reference,
      payout_receipt_url,
      metadata,
      created_at,
      approved_at,
      paid_at,
      brokers (
        full_name,
        company_name,
        phone_number,
        whatsapp_number,
        email
      ),
      property_owners (
        id,
        full_name,
        phone_number,
        whatsapp_number,
        email,
        tax_id,
        notes,
        is_active
      )
    `)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })

  if (!hasGlobalOwnerSettlementsAccess) {
    if (!admin.broker_id) {
      throw new Error('Editor account is missing broker assignment')
    }

    payablesQuery = payablesQuery.eq('broker_id', admin.broker_id)
    settlementsQuery = settlementsQuery.eq('broker_id', admin.broker_id)
  }

  const [
    { data: payablesData, error: payablesError },
    { data: settlementsData, error: settlementsError },
  ] = await Promise.all([payablesQuery, settlementsQuery])

  if (payablesError) {
    throw new Error(payablesError.message)
  }

  if (settlementsError) {
    throw new Error(settlementsError.message)
  }

  const payables = normalizeOwnerPayableRows((payablesData || []) as any[])
  const settlements = normalizeSettlementRows((settlementsData || []) as any[])

  const ownerIds = Array.from(
    new Set([
      ...payables.map((payable) => payable.owner_id),
      ...settlements.map((settlement) => settlement.owner_id),
    ].filter(Boolean))
  ) as string[]

  const payoutAccountsMap = new Map<string, OwnerPayoutAccountRow>()

  if (ownerIds.length > 0) {
    let payoutAccountsQuery = supabase
      .from('owner_payout_accounts')
      .select(`
        id,
        owner_id,
        broker_id,
        payout_method,
        account_holder_name,
        phone_number,
        bank_name,
        bank_account_number,
        iban,
        wallet_number,
        instapay_handle,
        is_default,
        is_active,
        notes
      `)
      .in('owner_id', ownerIds)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (!hasGlobalOwnerSettlementsAccess) {
      payoutAccountsQuery = payoutAccountsQuery.eq('broker_id', admin.broker_id)
    }

    const { data: payoutAccountsData, error: payoutAccountsError } =
      await payoutAccountsQuery

    if (payoutAccountsError) {
      throw new Error(payoutAccountsError.message)
    }

    ;((payoutAccountsData || []) as any[]).forEach((account) => {
      const normalizedAccount = account as OwnerPayoutAccountRow
      const mapKey = getPayoutAccountMapKey(
        normalizedAccount.owner_id,
        normalizedAccount.broker_id
      )

      if (!payoutAccountsMap.has(mapKey)) {
        payoutAccountsMap.set(mapKey, normalizedAccount)
      }
    })
  }

  const groupedPayables = groupPayablesByOwner(payables, payoutAccountsMap)
  const approvedSettlementsCount = settlements.filter(
    (settlement) => settlement.status === 'approved'
  ).length
  const notificationsEnabledForAdmin =
    adminContext.admin.role === 'AP' || adminContext.admin.role === 'super_admin'

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
          font-weight: 700;
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

      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe,_transparent_32%),radial-gradient(circle_at_top_right,_#dcfce7,_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] pb-10 text-slate-950">
        <header className="sticky top-0 z-[110] border-b border-white/60 bg-white/75 backdrop-blur-xl">
          <div className="mobile-header-inner flex h-[76px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
            <BrandLogo />

            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/admin/finance/owner-settlements"
                className="desktop-header-nav-button desktop-header-nav-button-active"
              >
                Owner Settlements
              </Link>

              <Link
                href="/admin/change-password"
                className="desktop-header-nav-button"
              >
                Change Password
              </Link>

              <AdminOwnerSettlementsNotifications
                enabled={notificationsEnabledForAdmin}
                initialPayablesCount={groupedPayables.length}
                initialSettlementsCount={approvedSettlementsCount}
              />

              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 flex items-center justify-between gap-3 md:hidden">
            <Link
              href="/admin/change-password"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm"
            >
              Change Password
            </Link>

            <AdminOwnerSettlementsNotifications
              enabled={notificationsEnabledForAdmin}
              initialPayablesCount={groupedPayables.length}
              initialSettlementsCount={approvedSettlementsCount}
            />
          </div>

          <TabsNav
            activeTab={activeTab}
            payablesCount={groupedPayables.length}
            settlementsCount={settlements.length}
          />

          {activeTab === 'payables' ? (
            <section>
              {groupedPayables.length === 0 ? (
                <EmptyState
                  title="No unsettled payables"
                  description="New paid reservations and renewals will appear here automatically."
                />
              ) : (
                <div className="grid gap-6">
                  {groupedPayables.map((group) => (
                    <article
                      key={`${group.owner_id}:${group.broker_id}`}
                      className="overflow-hidden rounded-[34px] border border-white/80 bg-white/90 shadow-[0_22px_70px_rgba(15,23,42,0.09)] ring-1 ring-slate-900/[0.03] backdrop-blur"
                    >
                      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="p-5 sm:p-6 lg:p-7">
                          <OwnerSummaryGrid
                            owner={group.owner}
                            broker={group.broker}
                          />

                          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <DetailItem
                              label="Gross"
                              value={formatCurrency(
                                group.gross_rent_amount,
                                group.currency
                              )}
                            />
                            <DetailItem
                              label="Service Fee"
                              value={formatCurrency(
                                group.service_fee_amount,
                                group.currency
                              )}
                            />
                            <DetailItem
                              label="Payment Fee"
                              value={formatCurrency(
                                group.payment_fee_amount,
                                group.currency
                              )}
                            />
                            <DetailItem
                              label="Tax"
                              value={formatCurrency(group.tax_amount, group.currency)}
                            />
                          </div>

                          <div className="mt-6">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <h4 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                                Payable Records
                              </h4>
                            </div>

                            <PayablesTable payables={group.payables} />
                          </div>
                        </div>

                        <aside className="border-t border-slate-200/70 bg-slate-50/80 p-5 sm:p-6 xl:border-l xl:border-t-0">
                          <div className="sticky top-28 space-y-5">
                            <div className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                                Net Payable
                              </p>
                              <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                                {formatCurrency(
                                  group.net_payable_amount,
                                  group.currency
                                )}
                              </p>
                              <p className="mt-2 text-xs font-semibold text-slate-500">
                                Final amount payable to this owner.
                              </p>
                            </div>

                            <PayoutDetailsCard
                              payoutAccount={group.payout_account}
                            />

                            <CreateSettlementForm group={group} />
                          </div>
                        </aside>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === 'settlements' ? (
            <section>
              <SectionTitle eyebrow="" title="Settlements" description="" />

              {settlements.length === 0 ? (
                <EmptyState
                  title="No settlements yet"
                  description="Create your first owner settlement from unsettled payables above."
                />
              ) : (
                <div className="grid gap-6 xl:grid-cols-2">
                  {settlements.map((settlement) => {
                    const paidSnapshot = getPaidPayoutSnapshot(settlement)
                    const livePayoutAccount =
                      payoutAccountsMap.get(
                        getPayoutAccountMapKey(
                          settlement.owner_id,
                          settlement.broker_id
                        )
                      ) || null
                    const payoutAccount = paidSnapshot || livePayoutAccount

                    return (
                      <article
                        key={settlement.id}
                        className="overflow-hidden rounded-[34px] border border-white/80 bg-white/90 shadow-[0_22px_70px_rgba(15,23,42,0.09)] ring-1 ring-slate-900/[0.03] backdrop-blur"
                      >
                        <div className="relative overflow-hidden bg-slate-950 p-6 text-white">
                          <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" />
                          <div className="absolute -bottom-20 left-8 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />

                          <div className="relative w-full rounded-[30px] border border-white/10 bg-white/10 p-6 backdrop-blur sm:p-8">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100">
                              Net Payout
                            </p>

                            <p className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                              {formatCurrency(
                                settlement.net_payout_amount,
                                settlement.currency
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-5 p-5 sm:p-6">
                          <OwnerSummaryGrid
                            owner={settlement.property_owners}
                            broker={settlement.brokers}
                          />

                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <DetailItem
                              label="Gross"
                              value={formatCurrency(
                                settlement.gross_rent_collected,
                                settlement.currency
                              )}
                            />
                            <DetailItem
                              label="Fees"
                              value={formatCurrency(
                                Number(settlement.service_fee_amount || 0) +
                                  Number(settlement.payment_fee_amount || 0),
                                settlement.currency
                              )}
                            />
                            <DetailItem
                              label="Tax"
                              value={formatCurrency(
                                settlement.tax_amount,
                                settlement.currency
                              )}
                            />
                            <DetailItem
                              label="Created"
                              value={formatDate(settlement.created_at)}
                            />
                          </div>

                          <PayoutDetailsCard
                            payoutAccount={payoutAccount}
                            isSnapshot={Boolean(paidSnapshot)}
                          />

                          {settlement.status === 'draft' ? (
                            <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-4">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <ApproveSettlementForm
                                  settlementId={settlement.id}
                                />
                                <CancelSettlementForm
                                  settlementId={settlement.id}
                                />
                              </div>
                            </div>
                          ) : null}

                          {settlement.status === 'approved' ? (
                            <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-4">
                              <div className="mb-4 flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                  <WalletIcon />
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-slate-950">
                                    Ready for payout
                                  </h4>
                                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                                    Enter the transfer reference after paying the
                                    owner.
                                  </p>
                                </div>
                              </div>

                              <MarkSettlementPaidForm
                                settlementId={settlement.id}
                                payoutAccount={livePayoutAccount}
                              />
                            </div>
                          ) : null}

                          {settlement.status === 'paid' ? (
                            <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/80 p-5">
                              <div className="mb-4 flex items-start gap-3">
                                <div>
                                  <h4 className="text-sm font-black text-emerald-950">
                                    Payment completed
                                  </h4>
                                </div>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                <DetailItem
                                  label="Paid At"
                                  value={formatDate(settlement.paid_at)}
                                />
                                <DetailItem
                                  label="Method"
                                  value={formatPayoutMethod(
                                    settlement.payout_method
                                  )}
                                />
                                <DetailItem
                                  label="Reference"
                                  value={settlement.payout_reference || '—'}
                                  mono
                                />
                                <DetailItem
                                  label="Receipt"
                                  value={
                                    settlement.payout_receipt_url ? (
                                      <a
                                        href={settlement.payout_receipt_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-black text-[#054aff] underline"
                                      >
                                        Open receipt
                                      </a>
                                    ) : (
                                      '—'
                                    )
                                  }
                                />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          ) : null}
        </section>
      </main>
    </>
  )
}