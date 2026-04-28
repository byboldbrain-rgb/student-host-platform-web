import Link from 'next/link'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  requirePropertiesSectionAccess,
  isSuperAdmin,
  canReceivePropertyBookingRequests,
} from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'
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

type BookingRequestNotification = {
  id: string
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

function BrandLogo() {
  return (
    <Link
      href="/admin/properties"
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

function WalletIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
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

function ClipboardListIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-[20px] w-[20px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  )
}

function MobileNavIcon({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="h-[20px] w-[20px] object-contain" />
}

function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null

  return (
    <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-[5px] text-[10px] font-bold leading-none text-white shadow-md">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function formatPrice(value?: number | null, currency = 'EGP') {
  if (typeof value !== 'number' || Number.isNaN(value)) return `0 ${currency}`

  return `${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`
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
    return 'border-red-200 bg-red-50 text-red-700'
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
    property_owners: normalizeSingleRelation<PropertyOwnerRow>(row.property_owners),
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
    property_owners: normalizeSingleRelation<PropertyOwnerRow>(row.property_owners),
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

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

function OwnerDetailsCard({
  owner,
  broker,
  payoutAccount,
  isSnapshot = false,
}: {
  owner?: PropertyOwnerRow | null
  broker?: BrokerRow | null
  payoutAccount?: OwnerPayoutAccountRow | null
  isSnapshot?: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Owner Details
        </p>

        <div className="mt-3 space-y-1.5 text-sm text-slate-700">
          <p>
            <span className="font-medium text-slate-900">Owner:</span>{' '}
            {owner?.full_name || '—'}
          </p>
          <p>
            <span className="font-medium text-slate-900">Phone:</span>{' '}
            {owner?.phone_number || '—'}
          </p>
          <p>
            <span className="font-medium text-slate-900">WhatsApp:</span>{' '}
            {owner?.whatsapp_number || '—'}
          </p>
          <p>
            <span className="font-medium text-slate-900">Email:</span>{' '}
            {owner?.email || '—'}
          </p>
          <p>
            <span className="font-medium text-slate-900">Tax ID:</span>{' '}
            {owner?.tax_id || '—'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Broker Details
        </p>

        <div className="mt-3 space-y-1.5 text-sm text-slate-700">
          <p>
            <span className="font-medium text-slate-900">Broker:</span>{' '}
            {broker?.company_name || broker?.full_name || '—'}
          </p>
          <p>
            <span className="font-medium text-slate-900">Phone:</span>{' '}
            {broker?.phone_number || '—'}
          </p>
          <p>
            <span className="font-medium text-slate-900">WhatsApp:</span>{' '}
            {broker?.whatsapp_number || '—'}
          </p>
          <p>
            <span className="font-medium text-slate-900">Email:</span>{' '}
            {broker?.email || '—'}
          </p>
        </div>
      </div>

      <div
        className={`rounded-2xl border p-4 ${
          payoutAccount
            ? 'border-emerald-100 bg-emerald-50'
            : 'border-red-100 bg-red-50'
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-[0.14em] ${
            payoutAccount ? 'text-emerald-700' : 'text-red-700'
          }`}
        >
          Owner Payout Details
        </p>

        {payoutAccount ? (
          <div className="mt-3 space-y-1.5 text-sm text-slate-700">
            {isSnapshot ? (
              <p className="mb-2 inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-bold text-emerald-700">
                Paid using captured payout snapshot
              </p>
            ) : null}

            <p>
              <span className="font-medium text-slate-900">Method:</span>{' '}
              {formatPayoutMethod(payoutAccount.payout_method)}
            </p>

            {payoutAccount.account_holder_name ? (
              <p>
                <span className="font-medium text-slate-900">Account Holder:</span>{' '}
                {payoutAccount.account_holder_name}
              </p>
            ) : null}

            {payoutAccount.phone_number ? (
              <p>
                <span className="font-medium text-slate-900">Phone:</span>{' '}
                {payoutAccount.phone_number}
              </p>
            ) : null}

            {payoutAccount.instapay_handle ? (
              <p>
                <span className="font-medium text-slate-900">Instapay:</span>{' '}
                {payoutAccount.instapay_handle}
              </p>
            ) : null}

            {payoutAccount.wallet_number ? (
              <p>
                <span className="font-medium text-slate-900">Wallet Number:</span>{' '}
                {payoutAccount.wallet_number}
              </p>
            ) : null}

            {payoutAccount.bank_name ? (
              <p>
                <span className="font-medium text-slate-900">Bank:</span>{' '}
                {payoutAccount.bank_name}
              </p>
            ) : null}

            {payoutAccount.bank_account_number ? (
              <p>
                <span className="font-medium text-slate-900">Account Number:</span>{' '}
                {payoutAccount.bank_account_number}
              </p>
            ) : null}

            {payoutAccount.iban ? (
              <p>
                <span className="font-medium text-slate-900">IBAN:</span>{' '}
                {payoutAccount.iban}
              </p>
            ) : null}

            {payoutAccount.captured_at ? (
              <p>
                <span className="font-medium text-slate-900">Captured:</span>{' '}
                {formatDate(payoutAccount.captured_at)}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 text-sm font-medium text-red-700">
            No payout details added for this owner. Add payout details before marking
            settlement as paid.
          </div>
        )}
      </div>
    </div>
  )
}

function CreateSettlementForm({ group }: { group: GroupedPayables }) {
  return (
    <form action={createOwnerSettlementAction}>
      <input type="hidden" name="owner_id" value={group.owner_id} />
      <input type="hidden" name="broker_id" value={group.broker_id} />

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-full border border-[#155dfc] bg-[#155dfc] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#0f4fe0] hover:bg-[#0f4fe0] md:w-auto"
      >
        Create Settlement
      </button>
    </form>
  )
}

function ApproveSettlementForm({ settlementId }: { settlementId: string }) {
  return (
    <form action={approveOwnerSettlementAction}>
      <input type="hidden" name="settlement_id" value={settlementId} />

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-full border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-blue-700 hover:bg-blue-700"
      >
        Approve
      </button>
    </form>
  )
}

function CancelSettlementForm({ settlementId }: { settlementId: string }) {
  return (
    <form action={cancelOwnerSettlementAction}>
      <input type="hidden" name="settlement_id" value={settlementId} />
      <input type="hidden" name="cancel_reason" value="Cancelled from finance page" />

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-full border border-red-600 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        Cancel
      </button>
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
    <form action={markOwnerSettlementPaidAction} className="space-y-3">
      <input type="hidden" name="settlement_id" value={settlementId} />

      {!payoutAccount ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          This owner has no active payout details. Add payout details before marking
          this settlement as paid.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <select
          name="payout_method"
          required
          defaultValue={defaultPayoutMethod}
          disabled={!payoutAccount}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#155dfc] focus:ring-2 focus:ring-[#155dfc]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="bank_transfer">Bank Transfer</option>
          <option value="instapay">Instapay</option>
          <option value="vodafone_cash">Vodafone Cash</option>
          <option value="orange_cash">Orange Cash</option>
          <option value="etisalat_cash">Etisalat Cash</option>
          <option value="cash">Cash</option>
        </select>

        <input
          name="payout_reference"
          required
          disabled={!payoutAccount}
          placeholder="Transfer reference"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#155dfc] focus:ring-2 focus:ring-[#155dfc]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />

        <input
          name="payout_receipt_url"
          disabled={!payoutAccount}
          placeholder="Receipt URL optional"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#155dfc] focus:ring-2 focus:ring-[#155dfc]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />
      </div>

      <button
        type="submit"
        disabled={!payoutAccount}
        className={`inline-flex w-full items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
          payoutAccount
            ? 'border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700'
            : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
        }`}
      >
        Mark as Paid
      </button>
    </form>
  )
}

function MobileBottomNav({ newReservationsCount }: { newReservationsCount: number }) {
  const items = [
    {
      href: '/admin/properties/booking-requests',
      label: 'New Reservations',
      icon: (
        <MobileNavIcon
          src="https://i.ibb.co/hxXpLKv3/add-event-6756388.png"
          alt="New Reservations"
        />
      ),
      active: false,
      badgeCount: newReservationsCount,
    },
    {
      href: '/admin/properties',
      label: 'Properties',
      icon: (
        <MobileNavIcon
          src="https://i.ibb.co/Dfs0dvX3/property-11608478.png"
          alt="Properties"
        />
      ),
      active: false,
      badgeCount: 0,
    },
    {
      href: '/admin/finance/owner-settlements',
      label: 'Finance',
      icon: <WalletIcon />,
      active: true,
      badgeCount: 0,
    },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e8e8ee] bg-white md:hidden">
      <div className="mx-auto flex h-[74px] max-w-md items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const activeClass = item.active ? 'text-[#155dfc]' : 'text-[#6b7280]'

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-[88px] flex-col items-center justify-center gap-1 px-2 py-2 text-center transition"
            >
              <span className={`relative flex items-center justify-center ${activeClass}`}>
                {item.icon}

                {item.badgeCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-[5px] text-[10px] font-bold text-white shadow-md">
                    {item.badgeCount > 99 ? '99+' : item.badgeCount}
                  </span>
                )}
              </span>

              <span
                className={`text-[11px] leading-[1.1] ${activeClass} ${
                  item.active ? 'font-semibold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default async function OwnerSettlementsPage() {
  const adminContext = await requirePropertiesSectionAccess()
  const supabase = createAdminClient()
  const admin = adminContext.admin

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

  if (!isSuperAdmin(admin)) {
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

  if (!isSuperAdmin(admin)) {
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

  const totalUnsettledGross = payables.reduce(
    (sum, row) => sum + Number(row.gross_rent_amount || 0),
    0
  )
  const totalUnsettledNet = payables.reduce(
    (sum, row) => sum + Number(row.net_payable_amount || 0),
    0
  )
  const totalPlatformFees = payables.reduce(
    (sum, row) =>
      sum +
      Number(row.service_fee_amount || 0) +
      Number(row.payment_fee_amount || 0),
    0
  )
  const totalTax = payables.reduce(
    (sum, row) => sum + Number(row.tax_amount || 0),
    0
  )

  let newReservationsCount = 0

  if (canReceivePropertyBookingRequests(admin)) {
    let bookingRequestsQuery = supabase
      .from('property_booking_requests')
      .select('id')
      .in('status', ['new', 'contacted', 'in_progress'])
      .order('created_at', { ascending: false })

    if (!isSuperAdmin(admin)) {
      bookingRequestsQuery = bookingRequestsQuery.eq('broker_id', admin.broker_id)
    }

    const { data: bookingRequestsData, error: bookingRequestsError } =
      await bookingRequestsQuery

    if (bookingRequestsError) {
      throw new Error(bookingRequestsError.message)
    }

    const bookingRequests = (bookingRequestsData || []) as BookingRequestNotification[]
    newReservationsCount = bookingRequests.length
  }

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

        .desktop-header-nav-button-inactive {
          color: #20212a;
        }

        .desktop-header-nav-button-inactive:hover,
        .desktop-header-nav-button-inactive:focus-visible {
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

      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef4ff,_#f8fafc_45%,_#f8fafc_100%)] pb-24 text-slate-700 md:pb-8">
        <header className="sticky top-0 z-[110] bg-[#f5f7f9]">
          <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
            <BrandLogo />

            <div className="hidden items-center gap-6 md:flex">
              {canReceivePropertyBookingRequests(admin) && (
                <Link
                  href="/admin/properties/booking-requests"
                  className="desktop-header-nav-button desktop-header-nav-button-inactive"
                >
                  <span className="inline-flex items-center gap-2">
                    <span>New Reservations</span>
                    <NotificationBadge count={newReservationsCount} />
                  </span>
                </Link>
              )}

              <Link
                href="/admin/properties"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Properties
              </Link>

              <Link
                href="/admin/properties/reservations"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Manage Reservations
              </Link>

              <Link
                href="/admin/finance/owner-settlements"
                className="desktop-header-nav-button desktop-header-nav-button-active"
              >
                Finance
              </Link>

              {isSuperAdmin(admin) && (
                <Link
                  href="/admin/properties/review"
                  className="desktop-header-nav-button desktop-header-nav-button-inactive"
                >
                  Review Queue
                </Link>
              )}

              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1600px] px-4 pb-8 pt-6 md:px-6 md:pt-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Owner Settlements
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage owner payables, settlements, platform fees, payout details, and payout records.
              Brokers and owners are separated: the broker manages properties, while the owner receives payouts.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Unsettled Gross Rent"
              value={formatPrice(totalUnsettledGross)}
              hint={`${payables.length} payable records`}
            />
            <SummaryCard
              label="Net Payable"
              value={formatPrice(totalUnsettledNet)}
              hint="Amount payable to owners"
            />
            <SummaryCard
              label="Platform Fees"
              value={formatPrice(totalPlatformFees)}
              hint="Service + payment fees"
            />
            <SummaryCard
              label="Tax"
              value={formatPrice(totalTax)}
              hint="Tax on platform fees"
            />
          </div>

          <section className="mt-6 rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <div className="border-b border-slate-200 px-5 py-5 md:px-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Unsettled Owner Payables
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Create a settlement for each owner when you are ready to transfer money.
                  </p>
                </div>

                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#155dfc]/10 text-[#155dfc] md:flex">
                  <WalletIcon />
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6">
              {groupedPayables.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm">
                    <WalletIcon />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    No unsettled payables
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    New paid reservations and renewals will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {groupedPayables.map((group) => (
                    <article
                      key={group.owner_id}
                      className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="border-b border-slate-100 bg-slate-50 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Owner
                            </p>
                            <h3 className="mt-1 text-lg font-bold text-slate-900">
                              {group.owner_name}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              Broker: {group.broker_name} • {group.payables.length} unsettled payable records
                            </p>
                          </div>

                          <CreateSettlementForm group={group} />
                        </div>

                        <div className="mt-5">
                          <OwnerDetailsCard
                            owner={group.owner}
                            broker={group.broker}
                            payoutAccount={group.payout_account}
                          />
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-xs text-slate-500">Gross</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                              {formatPrice(group.gross_rent_amount, group.currency)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-xs text-slate-500">Service Fee</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                              {formatPrice(group.service_fee_amount, group.currency)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-xs text-slate-500">Payment Fee</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                              {formatPrice(group.payment_fee_amount, group.currency)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-xs text-slate-500">Tax</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                              {formatPrice(group.tax_amount, group.currency)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-xs text-slate-500">Net Payable</p>
                            <p className="mt-1 text-sm font-bold text-emerald-700">
                              {formatPrice(group.net_payable_amount, group.currency)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-white text-xs uppercase tracking-[0.12em] text-slate-500">
                            <tr>
                              <th className="px-5 py-3 font-semibold">Property</th>
                              <th className="px-5 py-3 font-semibold">Customer</th>
                              <th className="px-5 py-3 font-semibold">Source</th>
                              <th className="px-5 py-3 font-semibold">Gross</th>
                              <th className="px-5 py-3 font-semibold">Fees</th>
                              <th className="px-5 py-3 font-semibold">Tax</th>
                              <th className="px-5 py-3 font-semibold">Net</th>
                              <th className="px-5 py-3 font-semibold">Created</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {group.payables.map((payable) => (
                              <tr key={payable.id} className="align-top">
                                <td className="px-5 py-4">
                                  <p className="font-semibold text-slate-900">
                                    {payable.properties?.title_en ||
                                      payable.properties?.title_ar ||
                                      'Property'}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {payable.properties?.property_id || '—'}
                                  </p>
                                </td>

                                <td className="px-5 py-4">
                                  <p className="font-medium text-slate-900">
                                    {payable.property_reservations?.customer_name || '—'}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {payable.property_reservations?.customer_phone || '—'}
                                  </p>
                                </td>

                                <td className="px-5 py-4 text-slate-700">
                                  {payable.source_type}
                                </td>

                                <td className="px-5 py-4 font-semibold text-slate-900">
                                  {formatPrice(
                                    Number(payable.gross_rent_amount || 0),
                                    payable.currency
                                  )}
                                </td>

                                <td className="px-5 py-4 text-slate-700">
                                  {formatPrice(
                                    Number(payable.service_fee_amount || 0) +
                                      Number(payable.payment_fee_amount || 0),
                                    payable.currency
                                  )}
                                </td>

                                <td className="px-5 py-4 text-slate-700">
                                  {formatPrice(
                                    Number(payable.tax_amount || 0),
                                    payable.currency
                                  )}
                                </td>

                                <td className="px-5 py-4 font-bold text-emerald-700">
                                  {formatPrice(
                                    Number(payable.net_payable_amount || 0),
                                    payable.currency
                                  )}
                                </td>

                                <td className="px-5 py-4 text-slate-500">
                                  {formatDate(payable.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="mt-6 rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <div className="border-b border-slate-200 px-5 py-5 md:px-7">
              <h2 className="text-lg font-semibold text-slate-900">
                Settlements
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Approve draft settlements, issue platform fee invoices, then mark owner payouts as paid.
              </p>
            </div>

            <div className="p-4 md:p-6">
              {settlements.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm">
                    <ClipboardListIcon />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    No settlements yet
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Create your first owner settlement from unsettled payables above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {settlements.map((settlement) => {
                    const paidSnapshot = getPaidPayoutSnapshot(settlement)
                    const livePayoutAccount =
                      payoutAccountsMap.get(
                        getPayoutAccountMapKey(settlement.owner_id, settlement.broker_id)
                      ) || null
                    const payoutAccount = paidSnapshot || livePayoutAccount

                    return (
                      <article
                        key={settlement.id}
                        className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
                      >
                        <div className="border-b border-slate-100 bg-gradient-to-br from-[#eef4ff] via-[#f8fbff] to-[#edf2ff] p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                {settlement.settlement_number}
                              </p>
                              <h3 className="mt-2 text-lg font-bold text-slate-900">
                                {getOwnerName(settlement)}
                              </h3>
                              <p className="mt-1 text-sm text-slate-500">
                                Broker: {getBrokerName(settlement)}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {formatDate(settlement.period_start)} -{' '}
                                {formatDate(settlement.period_end)}
                              </p>
                            </div>

                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusClass(
                                settlement.status
                              )}`}
                            >
                              {settlement.status}
                            </span>
                          </div>
                        </div>

                        <div className="p-5">
                          <OwnerDetailsCard
                            owner={settlement.property_owners}
                            broker={settlement.brokers}
                            payoutAccount={payoutAccount}
                            isSnapshot={Boolean(paidSnapshot)}
                          />

                          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                            <div className="rounded-2xl bg-slate-50 p-3">
                              <p className="text-xs text-slate-500">Gross</p>
                              <p className="mt-1 text-sm font-bold text-slate-900">
                                {formatPrice(
                                  Number(settlement.gross_rent_collected || 0),
                                  settlement.currency
                                )}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-3">
                              <p className="text-xs text-slate-500">Fees</p>
                              <p className="mt-1 text-sm font-bold text-slate-900">
                                {formatPrice(
                                  Number(settlement.service_fee_amount || 0) +
                                    Number(settlement.payment_fee_amount || 0),
                                  settlement.currency
                                )}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-3">
                              <p className="text-xs text-slate-500">Tax</p>
                              <p className="mt-1 text-sm font-bold text-slate-900">
                                {formatPrice(
                                  Number(settlement.tax_amount || 0),
                                  settlement.currency
                                )}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-emerald-50 p-3 md:col-span-3">
                              <p className="text-xs text-emerald-700">
                                Net Payout
                              </p>
                              <p className="mt-1 text-lg font-bold text-emerald-800">
                                {formatPrice(
                                  Number(settlement.net_payout_amount || 0),
                                  settlement.currency
                                )}
                              </p>
                            </div>
                          </div>

                          {settlement.status === 'draft' ? (
                            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                              <ApproveSettlementForm settlementId={settlement.id} />
                              <CancelSettlementForm settlementId={settlement.id} />
                            </div>
                          ) : null}

                          {settlement.status === 'approved' ? (
                            <div className="mt-5">
                              <MarkSettlementPaidForm
                                settlementId={settlement.id}
                                payoutAccount={livePayoutAccount}
                              />
                            </div>
                          ) : null}

                          {settlement.status === 'paid' ? (
                            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                              <p>
                                <span className="font-semibold">Paid at:</span>{' '}
                                {formatDate(settlement.paid_at)}
                              </p>
                              <p className="mt-1">
                                <span className="font-semibold">Method:</span>{' '}
                                {formatPayoutMethod(settlement.payout_method)}
                              </p>
                              <p className="mt-1">
                                <span className="font-semibold">Reference:</span>{' '}
                                {settlement.payout_reference || '—'}
                              </p>
                              {settlement.payout_receipt_url ? (
                                <p className="mt-1">
                                  <span className="font-semibold">Receipt:</span>{' '}
                                  <a
                                    href={settlement.payout_receipt_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold underline"
                                  >
                                    Open receipt
                                  </a>
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        </section>

        <MobileBottomNav newReservationsCount={newReservationsCount} />
      </main>
    </>
  )
}