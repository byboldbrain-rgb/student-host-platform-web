import Link from 'next/link'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { requirePropertyOwnerAccess } from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'
import OwnerPayoutReceiptButton from './OwnerPayoutReceiptButton'
import OwnerProfileForm from './OwnerProfileForm'
import {
  createOwnerSelfPayoutAccountAction,
  updateOwnerSelfPayoutAccountAction,
  deleteOwnerSelfPayoutAccountAction,
} from './actions'

type PropertyRow = {
  id: string
  property_id: string
  title_en: string
  title_ar: string
  price_egp: number | null
  rental_duration: string
  availability_status: string
  admin_status: string
  is_active: boolean
  city_id: string | null
  university_id: string | null
  broker_id: string | null
  owner_id: string | null
  created_at: string
  updated_at: string
  bedrooms_count: number | null
  bathrooms_count: number | null
  beds_count: number | null
  guests_count: number | null
}

type OwnerRow = {
  id: string
  full_name: string
  phone_number: string | null
  whatsapp_number: string | null
  email: string | null
  company_name: string | null
  image_url: string | null
  tax_id: string | null
  national_id: string | null
  billing_name: string | null
  billing_address: string | null
  notes: string | null
  is_active: boolean
}

type OwnerServiceAreaRow = {
  id: string
  city_id: string | null
  university_id: string | null
  is_active: boolean
}

type OwnerWithServiceAreaRow = OwnerRow & {
  city_id: string | null
  university_id: string | null
  service_areas: OwnerServiceAreaRow[]
  university_ids: string[]
}

type CityRow = {
  id: string
  name_en: string
  name_ar: string
}

type UniversityRow = {
  id: string
  city_id?: string | null
  name_en: string
  name_ar: string
}

type BrokerRow = {
  id: string
  full_name: string
  company_name: string | null
  phone_number: string | null
  whatsapp_number: string | null
  email: string | null
}

type OwnerPropertyLinkRow = {
  property_id_ref: string | null
  broker_id: string | null
}

type PropertyImageRow = {
  property_id_ref: string
  image_url: string
  is_cover: boolean
  sort_order: number
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
  settlement_id: string | null
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
  notes: string | null
  created_at: string
}

type OwnerPortalTab =
  | 'overview'
  | 'properties'
  | 'reservations'
  | 'finance'
  | 'profile'

type OwnerFinanceTab = 'menu' | 'payables' | 'settlements' | 'accounts'

type OwnerPortalSearchParams =
  | {
      tab?: string | string[]
      finance?: string | string[]
    }
  | Promise<{
      tab?: string | string[]
      finance?: string | string[]
    }>

const OWNER_PORTAL_TABS: {
  key: OwnerPortalTab
  label: string
  title: string
  description: string
}[] = [
  {
    key: 'overview',
    label: 'Overview',
    title: 'Overview',
    description: '',
  },
  {
    key: 'properties',
    label: 'Properties',
    title: 'Properties',
    description: '',
  },
  {
    key: 'reservations',
    label: 'Reservations',
    title: 'Reservations',
    description: 'Latest bookings across your properties.',
  },
  {
    key: 'finance',
    label: 'Finance',
    title: 'Finance',
    description: '',
  },
  {
    key: 'profile',
    label: 'Profile',
    title: 'Profile',
    description: '',
  },
]

function normalizeOwnerPortalTab(value: string | string[] | undefined): OwnerPortalTab {
  const tab = Array.isArray(value) ? value[0] : value

  if (
    tab === 'overview' ||
    tab === 'properties' ||
    tab === 'reservations' ||
    tab === 'finance' ||
    tab === 'profile'
  ) {
    return tab
  }

  return 'overview'
}

function normalizeOwnerFinanceTab(
  value: string | string[] | undefined
): OwnerFinanceTab {
  const financeTab = Array.isArray(value) ? value[0] : value

  if (
    financeTab === 'payables' ||
    financeTab === 'settlements' ||
    financeTab === 'accounts'
  ) {
    return financeTab
  }

  return 'menu'
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

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

function getStatusClass(status: string | null | undefined) {
  const normalized = String(status || '').toLowerCase()

  if (
    normalized.includes('paid') ||
    normalized.includes('published') ||
    normalized.includes('available') ||
    normalized.includes('reserved') ||
    normalized.includes('approved') ||
    normalized.includes('settled') ||
    normalized.includes('active')
  ) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (
    normalized.includes('pending') ||
    normalized.includes('draft') ||
    normalized.includes('review') ||
    normalized.includes('partial') ||
    normalized.includes('unsettled')
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (
    normalized.includes('cancel') ||
    normalized.includes('reject') ||
    normalized.includes('inactive') ||
    normalized.includes('failed') ||
    normalized.includes('void')
  ) {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
        status
      )}`}
    >
      {humanize(status)}
    </span>
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
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  )
}

function StatCard({
  label,
  value,
  helper,
  tone = 'blue',
}: {
  label: string
  value: string
  helper?: string
  tone?: 'blue' | 'emerald' | 'amber' | 'slate'
}) {
  const toneClass =
    tone === 'emerald'
      ? 'from-emerald-500 to-emerald-600'
      : tone === 'amber'
        ? 'from-amber-500 to-orange-500'
        : tone === 'slate'
          ? 'from-slate-700 to-slate-900'
          : 'from-blue-600 to-blue-700'

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className={`h-1.5 bg-gradient-to-r ${toneClass}`} />
      <div className="p-5">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
          {value}
        </p>
        {helper ? (
          <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
        ) : null}
      </div>
    </div>
  )
}

function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-950 md:text-xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="p-5 md:p-6">{children}</div>
    </section>
  )
}

function DataTable({
  headers,
  children,
}: {
  headers: string[]
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
        </table>
      </div>
    </div>
  )
}

function BrandLogo() {
  return (
    <Link
      href="/admin/owners?tab=overview"
      className="flex h-full items-center overflow-hidden"
    >
      <img
        src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
        alt="Navienty"
        style={{
          height: '180%',
          width: 'auto',
          objectFit: 'contain',
          transform: 'scale(1)',
          display: 'block',
        }}
      />
    </Link>
  )
}

function QuickNav({ activeTab }: { activeTab: OwnerPortalTab }) {
  return (
    <nav className="sticky top-20 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto w-full max-w-[1500px] px-3 py-2 md:px-6">
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-center md:flex-nowrap md:gap-2">
          {OWNER_PORTAL_TABS.map((tab) => {
            const isActive = activeTab === tab.key

            return (
              <Link
                key={tab.key}
                href={`/admin/owners?tab=${tab.key}`}
                scroll={false}
                className={`flex items-center justify-center rounded-xl border px-2 py-2 text-center text-[11px] font-black leading-tight transition sm:px-4 sm:text-sm ${
                  isActive
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-600 hover:text-blue-700'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

function PageTitle({ activeTab }: { activeTab: OwnerPortalTab }) {
  const currentTab =
    OWNER_PORTAL_TABS.find((tab) => tab.key === activeTab) || OWNER_PORTAL_TABS[0]

  return (
    <div className="mb-8">
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
        {currentTab.title}
      </h1>
      {currentTab.description ? (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 md:text-base">
          {currentTab.description}
        </p>
      ) : null}
    </div>
  )
}

function FinanceChoiceCard({
  href,
  title,
  tone = 'blue',
}: {
  href: string
  title: string
  description: string
  value: string
  tone?: 'blue' | 'emerald' | 'amber'
}) {
  const toneClass =
    tone === 'emerald'
      ? 'from-emerald-500 to-emerald-600'
      : tone === 'amber'
        ? 'from-amber-500 to-orange-500'
        : 'from-blue-600 to-blue-700'

  return (
    <Link
      href={href}
      scroll={false}
      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`h-2 bg-gradient-to-r ${toneClass}`} />

      <div className="p-6">
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h2>
      </div>
    </Link>
  )
}

function InfoPill({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-slate-900">
        {value || '—'}
      </p>
    </div>
  )
}

function PayoutAccountForm({
  account,
}: {
  account?: PayoutAccountRow | null
}) {
  const isEdit = Boolean(account)

  return (
    <form
      action={
        isEdit
          ? updateOwnerSelfPayoutAccountAction
          : createOwnerSelfPayoutAccountAction
      }
      className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4"
    >
      {account ? (
        <input type="hidden" name="payout_account_id" value={account.id} />
      ) : null}

      <input type="hidden" name="bank_account_number" value="" />
      <input type="hidden" name="iban" value="" />
      <input type="hidden" name="notes" value="" />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Payout Method
          </label>
          <select
            name="payout_method"
            defaultValue={account?.payout_method || 'instapay'}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="instapay">Instapay</option>
            <option value="vodafone_cash">Vodafone Cash</option>
            <option value="orange_cash">Orange Cash</option>
            <option value="etisalat_cash">Etisalat Cash</option>
            <option value="we_pay">We Pay</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Account Holder Name
          </label>
          <input
            name="account_holder_name"
            defaultValue={account?.account_holder_name || ''}
            placeholder="Account holder name"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Phone Number
          </label>
          <input
            name="phone_number"
            defaultValue={account?.phone_number || ''}
            placeholder="Phone number"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Instapay Handle
          </label>
          <input
            name="instapay_handle"
            defaultValue={account?.instapay_handle || ''}
            placeholder="example@instapay"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Wallet Number
          </label>
          <input
            name="wallet_number"
            defaultValue={account?.wallet_number || ''}
            placeholder="Cash wallet number"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Bank Name
          </label>
          <input
            name="bank_name"
            defaultValue={account?.bank_name || ''}
            placeholder="Bank name"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="is_default"
            value="true"
            defaultChecked={account?.is_default || false}
            className="h-4 w-4 rounded border-slate-300"
          />
          Make default payout account
        </label>

        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          {isEdit ? 'Update payout account' : 'Add payout account'}
        </button>
      </div>
    </form>
  )
}

async function loadOwnerProfile(params: {
  supabase: ReturnType<typeof createAdminClient>
  ownerId: string
}) {
  const { supabase, ownerId } = params

  const res = await supabase
    .from('property_owners')
    .select(
      'id, full_name, phone_number, whatsapp_number, email, company_name, image_url, tax_id, national_id, billing_name, billing_address, notes, is_active'
    )
    .eq('id', ownerId)
    .maybeSingle<OwnerRow>()

  if (res.error) {
    return {
      owner: null,
      errorMessage: res.error.message,
    }
  }

  return {
    owner: res.data,
    errorMessage: null as string | null,
  }
}

export default async function OwnerPortalPage({
  searchParams,
}: {
  searchParams?: OwnerPortalSearchParams
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const activeTab = normalizeOwnerPortalTab(resolvedSearchParams.tab)
  const activeFinanceTab = normalizeOwnerFinanceTab(resolvedSearchParams.finance)

  const adminContext = await requirePropertyOwnerAccess()
  const supabase = createAdminClient()

  const ownerId = String(adminContext.admin.owner_id || '').trim()

  if (!ownerId) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <EmptyState
          title="Owner account is not linked"
          description="This admin account does not have an owner profile assigned. Add the property_owners.id value into admin_users.owner_id."
        />
      </main>
    )
  }

  const { owner, errorMessage: ownerLoadError } = await loadOwnerProfile({
    supabase,
    ownerId,
  })

  if (!owner) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <EmptyState
          title="Owner profile was not found"
          description={
            ownerLoadError
              ? `Could not load owner profile: ${ownerLoadError}`
              : `No property_owners row was found for owner_id: ${ownerId}`
          }
        />
      </main>
    )
  }

  const { data: ownerServiceAreasData, error: ownerServiceAreasError } =
    await supabase
      .from('property_owner_service_areas')
      .select('id, city_id, university_id, is_active')
      .eq('owner_id', ownerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .returns<OwnerServiceAreaRow[]>()

  if (ownerServiceAreasError) throw new Error(ownerServiceAreasError.message)

  const ownerServiceAreas = ownerServiceAreasData ?? []

  const ownerCityIds = Array.from(
    new Set(
      ownerServiceAreas
        .map((area) => String(area.city_id || '').trim())
        .filter(Boolean)
    )
  )

  const ownerUniversityIds = Array.from(
    new Set(
      ownerServiceAreas
        .map((area) => String(area.university_id || '').trim())
        .filter(Boolean)
    )
  )

  const ownerCityId = ownerCityIds[0] || null
  const ownerUniversityId = ownerUniversityIds[0] || null

  const ownerWithServiceArea: OwnerWithServiceAreaRow = {
    ...owner,
    city_id: ownerCityId,
    university_id: ownerUniversityId,
    service_areas: ownerServiceAreas,
    university_ids: ownerUniversityIds,
  }

  const { data: ownerPropertyLinks, error: ownerPropertyLinksError } = await supabase
    .from('owner_properties')
    .select('property_id_ref, broker_id')
    .eq('owner_id', ownerId)
    .eq('is_active', true)
    .returns<OwnerPropertyLinkRow[]>()

  if (ownerPropertyLinksError) throw new Error(ownerPropertyLinksError.message)

  const linkedPropertyIds = Array.from(
    new Set(
      (ownerPropertyLinks ?? [])
        .map((item) => String(item.property_id_ref || '').trim())
        .filter(Boolean)
    )
  )

  const ownerLinkedBrokerIds = Array.from(
    new Set(
      (ownerPropertyLinks ?? [])
        .map((item) => String(item.broker_id || '').trim())
        .filter(Boolean)
    )
  )

  const [directPropertiesRes, linkedPropertiesRes] = await Promise.all([
    supabase
      .from('properties')
      .select(
        'id, property_id, title_en, title_ar, price_egp, rental_duration, availability_status, admin_status, is_active, city_id, university_id, broker_id, owner_id, created_at, updated_at, bedrooms_count, bathrooms_count, beds_count, guests_count'
      )
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false }),
    linkedPropertyIds.length > 0
      ? supabase
          .from('properties')
          .select(
            'id, property_id, title_en, title_ar, price_egp, rental_duration, availability_status, admin_status, is_active, city_id, university_id, broker_id, owner_id, created_at, updated_at, bedrooms_count, bathrooms_count, beds_count, guests_count'
          )
          .in('id', linkedPropertyIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as PropertyRow[], error: null }),
  ])

  if (directPropertiesRes.error) throw new Error(directPropertiesRes.error.message)
  if (linkedPropertiesRes.error) throw new Error(linkedPropertiesRes.error.message)

  const propertyMap = new Map<string, PropertyRow>()

  ;((directPropertiesRes.data ?? []) as PropertyRow[]).forEach((property) => {
    propertyMap.set(property.id, property)
  })

  ;((linkedPropertiesRes.data ?? []) as PropertyRow[]).forEach((property) => {
    propertyMap.set(property.id, property)
  })

  const properties = Array.from(propertyMap.values()).sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const propertyIds = properties.map((property) => property.id)

  const cityIds = Array.from(
    new Set(
      [...ownerCityIds, ...properties.map((property) => property.city_id)]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  )

  const universityIds = Array.from(
    new Set(
      [
        ...ownerUniversityIds,
        ...properties.map((property) => property.university_id),
      ]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  )

  const brokerIds = Array.from(
    new Set(
      [
        ...ownerLinkedBrokerIds,
        ...properties.map((property) => String(property.broker_id || '').trim()),
      ].filter(Boolean)
    )
  )

  const [
    allCitiesRes,
    allUniversitiesRes,
    citiesRes,
    universitiesRes,
    brokersRes,
    propertyImagesRes,
    reservationsRes,
    ownerPayablesRes,
    ownerSettlementsRes,
    payoutAccountsRes,
  ] = await Promise.all([
    supabase.from('cities').select('id, name_en, name_ar').order('name_en'),
    supabase
      .from('universities')
      .select('id, city_id, name_en, name_ar')
      .order('name_en'),
    cityIds.length > 0
      ? supabase.from('cities').select('id, name_en, name_ar').in('id', cityIds)
      : Promise.resolve({ data: [] as CityRow[], error: null }),
    universityIds.length > 0
      ? supabase
          .from('universities')
          .select('id, city_id, name_en, name_ar')
          .in('id', universityIds)
      : Promise.resolve({ data: [] as UniversityRow[], error: null }),
    brokerIds.length > 0
      ? supabase
          .from('brokers')
          .select('id, full_name, company_name, phone_number, whatsapp_number, email')
          .in('id', brokerIds)
      : Promise.resolve({ data: [] as BrokerRow[], error: null }),
    propertyIds.length > 0
      ? supabase
          .from('property_images')
          .select('property_id_ref, image_url, is_cover, sort_order')
          .in('property_id_ref', propertyIds)
          .order('is_cover', { ascending: false })
          .order('sort_order', { ascending: true })
      : Promise.resolve({ data: [] as PropertyImageRow[], error: null }),
    propertyIds.length > 0
      ? supabase
          .from('property_reservations')
          .select(
            'id, property_id, customer_name, customer_phone, customer_email, customer_whatsapp, reservation_scope, reserved_option_code, reserved_option_name_en, total_price_egp, start_date, end_date, status, payment_status, created_at'
          )
          .in('property_id', propertyIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as ReservationRow[], error: null }),
    supabase
      .from('owner_payables')
      .select(
        'id, property_id, reservation_id, settlement_id, gross_rent_amount, service_fee_amount, payment_fee_amount, tax_amount, adjustment_amount, net_payable_amount, currency, status, source_type, created_at'
      )
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false }),
    supabase
      .from('owner_settlements')
      .select(
        'id, settlement_number, gross_rent_collected, service_fee_amount, payment_fee_amount, tax_amount, adjustment_amount, net_payout_amount, currency, status, period_start, period_end, paid_at, payout_method, payout_reference, created_at'
      )
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('owner_payout_accounts')
      .select(
        'id, broker_id, payout_method, account_holder_name, phone_number, bank_name, bank_account_number, iban, wallet_number, instapay_handle, is_default, is_active, notes, created_at'
      )
      .eq('owner_id', ownerId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  if (allCitiesRes.error) throw new Error(allCitiesRes.error.message)
  if (allUniversitiesRes.error) throw new Error(allUniversitiesRes.error.message)
  if (citiesRes.error) throw new Error(citiesRes.error.message)
  if (universitiesRes.error) throw new Error(universitiesRes.error.message)
  if (brokersRes.error) throw new Error(brokersRes.error.message)
  if (propertyImagesRes.error) throw new Error(propertyImagesRes.error.message)
  if (reservationsRes.error) throw new Error(reservationsRes.error.message)
  if (ownerPayablesRes.error) throw new Error(ownerPayablesRes.error.message)
  if (ownerSettlementsRes.error) throw new Error(ownerSettlementsRes.error.message)
  if (payoutAccountsRes.error) throw new Error(payoutAccountsRes.error.message)

  const allCities = (allCitiesRes.data ?? []) as CityRow[]
  const allUniversities = (allUniversitiesRes.data ?? []) as UniversityRow[]
  const brokers = (brokersRes.data ?? []) as BrokerRow[]
  const propertyImages = (propertyImagesRes.data ?? []) as PropertyImageRow[]
  const reservations = (reservationsRes.data ?? []) as ReservationRow[]
  const ownerPayables = (ownerPayablesRes.data ?? []) as OwnerPayableRow[]
  const ownerSettlements = (ownerSettlementsRes.data ?? []) as OwnerSettlementRow[]
  const payoutAccounts = (payoutAccountsRes.data ?? []) as PayoutAccountRow[]

  const latestReservations = reservations.slice(0, 6)
  const latestOwnerPayables = ownerPayables.slice(0, 8)

  const brokerById = new Map(brokers.map((broker) => [broker.id, broker]))
  const propertyById = new Map(properties.map((property) => [property.id, property]))

  const imagesByPropertyId = new Map<string, PropertyImageRow[]>()

  propertyImages.forEach((image) => {
    const existing = imagesByPropertyId.get(image.property_id_ref) ?? []
    existing.push(image)
    imagesByPropertyId.set(image.property_id_ref, existing)
  })

  const universityById = new Map(
    allUniversities.map((university) => [university.id, university])
  )

  const ownerUniversityNames = ownerUniversityIds
    .map((universityId) => universityById.get(universityId)?.name_en)
    .filter(Boolean)
    .join(', ')

  const totalPropertyValue = properties.reduce((sum, property) => {
    return sum + Number(property.price_egp || 0)
  }, 0)

  const totalSettled = ownerSettlements.reduce((sum, settlement) => {
    if (settlement.status !== 'paid') return sum
    return sum + Number(settlement.net_payout_amount || 0)
  }, 0)

  const defaultPayoutAccount =
    payoutAccounts.find((account) => account.is_default && account.is_active) ||
    payoutAccounts.find((account) => account.is_active) ||
    null

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-800">
      <header className="sticky top-0 z-40 h-20 border-b border-gray-200 bg-[#f7f7f7] shadow-sm">
        <div className="mx-auto flex h-full w-full max-w-[1920px] items-center justify-between px-4 md:px-6">
          <BrandLogo />
          <AdminLogoutButton />
        </div>
      </header>

      <QuickNav activeTab={activeTab} />

      <div className="mx-auto w-full max-w-[1500px] px-4 py-8 md:px-6 lg:py-10">
        <PageTitle activeTab={activeTab} />

        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Properties"
              value={String(properties.length)}
              helper="Total properties linked to your profile"
              tone="blue"
            />
            <StatCard
              label="Listed Value"
              value={formatMoney(totalPropertyValue)}
              helper="Based on current property prices"
              tone="slate"
            />
            <StatCard
              label="Paid Settlements"
              value={formatMoney(totalSettled)}
              helper=""
              tone="emerald"
            />
          </div>
        ) : null}

        {activeTab === 'properties' ? (
          <SectionCard title="" subtitle="">
            {properties.length === 0 ? (
              <EmptyState
                title="No properties linked"
                description="No properties are linked to this owner account yet."
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => {
                  const images = imagesByPropertyId.get(property.id) ?? []
                  const coverImage = images[0]?.image_url
                  const broker = property.broker_id
                    ? brokerById.get(property.broker_id)
                    : null

                  return (
                    <article
                      key={property.id}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative h-52 bg-slate-100">
                        {coverImage ? (
                          <img
                            src={coverImage}
                            alt={property.title_en}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="line-clamp-2 text-lg font-black text-slate-950">
                          {property.title_en}
                        </h3>

                        <div className="mt-4 rounded-2xl bg-blue-50 p-3 text-sm text-blue-800">
                          <p className="font-black">Broker</p>
                          <p className="mt-1">
                            {broker?.full_name || '—'}
                            {broker?.company_name ? ` - ${broker.company_name}` : ''}
                          </p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </SectionCard>
        ) : null}

        {activeTab === 'reservations' ? (
          <SectionCard
            title="Recent Reservations"
            subtitle="Latest bookings across your properties."
          >
            {latestReservations.length === 0 ? (
              <EmptyState
                title="No reservations yet"
                description="Reservations will appear here once students book your properties."
              />
            ) : (
              <DataTable headers={['Property', 'Customer', 'Total', 'Stay', 'Created']}>
                {latestReservations.map((reservation) => {
                  const property = propertyById.get(reservation.property_id)

                  return (
                    <tr key={reservation.id}>
                      <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-900">
                        {property?.title_en || '—'}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <p className="font-bold text-slate-900">
                          {reservation.customer_name}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-bold">
                        {formatMoney(reservation.total_price_egp)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        {formatDate(reservation.start_date)} -{' '}
                        {formatDate(reservation.end_date)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                        {formatDateTime(reservation.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </DataTable>
            )}
          </SectionCard>
        ) : null}

        {activeTab === 'finance' ? (
          <div className="space-y-8">
            {activeFinanceTab === 'menu' ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <FinanceChoiceCard
                    href="/admin/owners?tab=finance&finance=settlements"
                    title="Settlements"
                    description="View owner settlement batches, payout status, paid dates, and generate printable payout receipts."
                    value={formatMoney(totalSettled)}
                    tone="emerald"
                  />

                  <FinanceChoiceCard
                    href="/admin/owners?tab=finance&finance=accounts"
                    title="Payout Accounts"
                    description="Manage bank accounts, wallets, Instapay, and default payout destinations for your settlements."
                    value={
                      defaultPayoutAccount
                        ? humanize(defaultPayoutAccount.payout_method)
                        : 'Not configured'
                    }
                    tone="blue"
                  />
                </div>

                <SectionCard title="Finance Summary" subtitle="">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <StatCard
                      label="Paid Settlements"
                      value={formatMoney(totalSettled)}
                      helper="Total paid settlement records"
                      tone="emerald"
                    />
                    <StatCard
                      label="Payout Accounts"
                      value={String(payoutAccounts.length)}
                      helper=""
                      tone="blue"
                    />
                  </div>
                </SectionCard>
              </div>
            ) : null}

            {activeFinanceTab !== 'menu' ? (
              <div className="mb-6">
                <Link
                  href="/admin/owners?tab=finance"
                  scroll={false}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  ← Back to Finance
                </Link>
              </div>
            ) : null}

            {activeFinanceTab === 'payables' ? (
              <SectionCard
                title="Owner Payables"
                subtitle="Latest payable calculations before settlement."
              >
                {latestOwnerPayables.length === 0 ? (
                  <EmptyState
                    title="No payables yet"
                    description="Payables will appear after rent collection records are generated."
                  />
                ) : (
                  <DataTable
                    headers={[
                      'Property',
                      'Source',
                      'Gross Rent',
                      'Fees',
                      'Tax',
                      'Adjustment',
                      'Net Payable',
                      'Status',
                      'Created',
                    ]}
                  >
                    {latestOwnerPayables.map((payable) => {
                      const property = propertyById.get(payable.property_id)
                      const fees =
                        Number(payable.service_fee_amount || 0) +
                        Number(payable.payment_fee_amount || 0)

                      return (
                        <tr key={payable.id}>
                          <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-900">
                            {property?.title_en || '—'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            {humanize(payable.source_type)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            {formatMoney(payable.gross_rent_amount, payable.currency)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            {formatMoney(fees, payable.currency)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            {formatMoney(payable.tax_amount, payable.currency)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            {formatMoney(payable.adjustment_amount, payable.currency)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 font-black text-slate-950">
                            {formatMoney(payable.net_payable_amount, payable.currency)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <StatusBadge status={payable.status} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                            {formatDateTime(payable.created_at)}
                          </td>
                        </tr>
                      )
                    })}
                  </DataTable>
                )}
              </SectionCard>
            ) : null}

            {activeFinanceTab === 'settlements' ? (
              <SectionCard
                title="Owner Settlements"
                subtitle="Settlement batches and printable payout reports."
              >
                {ownerSettlements.length === 0 ? (
                  <EmptyState
                    title="No settlements yet"
                    description="Settlements will appear here when finance creates payout batches."
                  />
                ) : (
                  <DataTable
                    headers={[
                      'Settlement',
                      'Period',
                      'Gross',
                      'Deductions',
                      'Net Payout',
                      'Method',
                      'Status',
                      'Paid At',
                      'Receipt',
                    ]}
                  >
                    {ownerSettlements.map((settlement) => {
                      const deductions =
                        Number(settlement.service_fee_amount || 0) +
                        Number(settlement.payment_fee_amount || 0) +
                        Number(settlement.tax_amount || 0) -
                        Number(settlement.adjustment_amount || 0)

                      return (
                        <tr key={settlement.id}>
                          <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-900">
                            {settlement.settlement_number}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            {formatDate(settlement.period_start)} -{' '}
                            {formatDate(settlement.period_end)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            {formatMoney(
                              settlement.gross_rent_collected,
                              settlement.currency
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            {formatMoney(deductions, settlement.currency)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 font-black text-slate-950">
                            {formatMoney(
                              settlement.net_payout_amount,
                              settlement.currency
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            {humanize(settlement.payout_method)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <StatusBadge status={settlement.status} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                            {formatDateTime(settlement.paid_at)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <OwnerPayoutReceiptButton
                              owner={owner}
                              settlement={settlement}
                              payables={ownerPayables}
                              properties={properties}
                              reservations={reservations}
                              payoutAccounts={payoutAccounts}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </DataTable>
                )}
              </SectionCard>
            ) : null}

            {activeFinanceTab === 'accounts' ? (
              <SectionCard
                title="Payout Accounts"
                subtitle="Manage where your settlements are paid."
              >
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
                  <div className="space-y-5">
                    {defaultPayoutAccount ? (
                      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                          Default account
                        </p>
                        <p className="mt-2 text-base font-black text-slate-950">
                          {humanize(defaultPayoutAccount.payout_method)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {defaultPayoutAccount.account_holder_name ||
                            defaultPayoutAccount.instapay_handle ||
                            defaultPayoutAccount.wallet_number ||
                            defaultPayoutAccount.phone_number ||
                            '—'}
                        </p>
                      </div>
                    ) : null}

                    <PayoutAccountForm />
                  </div>

                  <div>
                    {payoutAccounts.length === 0 ? (
                      <EmptyState
                        title="No payout accounts"
                        description="No payout account is currently configured for your owner profile."
                      />
                    ) : (
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {payoutAccounts.map((account) => (
                          <div
                            key={account.id}
                            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-base font-black text-slate-950">
                                  {humanize(account.payout_method)}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {account.account_holder_name ||
                                    account.instapay_handle ||
                                    account.wallet_number ||
                                    account.phone_number ||
                                    '—'}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {account.is_default ? (
                                  <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-black text-white">
                                    Default
                                  </span>
                                ) : null}
                                <StatusBadge
                                  status={account.is_active ? 'active' : 'inactive'}
                                />
                              </div>
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-slate-600">
                              {account.bank_name ? (
                                <p>
                                  <span className="font-bold">Bank:</span>{' '}
                                  {account.bank_name}
                                </p>
                              ) : null}

                              {account.wallet_number ? (
                                <p>
                                  <span className="font-bold">Wallet:</span>{' '}
                                  {account.wallet_number}
                                </p>
                              ) : null}

                              {account.instapay_handle ? (
                                <p>
                                  <span className="font-bold">Instapay:</span>{' '}
                                  {account.instapay_handle}
                                </p>
                              ) : null}
                            </div>

                            <div className="mt-5 space-y-3">
                              <details className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <summary className="cursor-pointer text-sm font-black text-blue-700">
                                  Edit payout account
                                </summary>
                                <div className="mt-4">
                                  <PayoutAccountForm account={account} />
                                </div>
                              </details>

                              {account.is_active ? (
                                <form action={deleteOwnerSelfPayoutAccountAction}>
                                  <input
                                    type="hidden"
                                    name="payout_account_id"
                                    value={account.id}
                                  />
                                  <button
                                    type="submit"
                                    className="w-full rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-black text-red-600 transition hover:bg-red-50"
                                  >
                                    Deactivate account
                                  </button>
                                </form>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'profile' ? (
  <SectionCard title="" subtitle="">
    <style>
      {`
        .owner-profile-form-clean :is(
          div:has(input[name="tax_id"]),
          div:has(input[name="national_id"]),
          div:has(input[name="taxId"]),
          div:has(input[name="nationalId"])
        ) {
          display: none !important;
        }
      `}
    </style>

    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[360px_1fr]">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="min-w-0">
          <p className="text-lg font-black text-slate-950">
            {owner.full_name}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <InfoPill label="Email" value={owner.email} />
          <InfoPill
            label="Phone"
            value={owner.phone_number || owner.whatsapp_number}
          />
          <InfoPill
            label="Universities"
            value={
              ownerUniversityNames ||
              `${ownerUniversityIds.length} selected universities`
            }
          />
        </div>
      </div>

      <div className="owner-profile-form-clean">
        <OwnerProfileForm
          owner={ownerWithServiceArea}
          cities={allCities}
          universities={allUniversities}
        />
      </div>
    </div>
  </SectionCard>
) : null}
      </div>
    </main>
  )
}