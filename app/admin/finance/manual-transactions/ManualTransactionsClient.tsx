'use client'

import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BadgeDollarSign,
  Banknote,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  FileCheck2,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  WalletCards,
} from 'lucide-react'
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { getDefaultCashAccountCode } from '@/src/lib/finance/manual-posting'
import type {
  FinanceAccountOption,
  FinancePropertyOption,
  FinanceReservationOption,
  ManualTransactionListItem,
  ManualTransactionType,
} from '@/src/lib/finance/types'

type FinanceBankAccountOption = {
  id: string
  name_ar: string
  name_en: string
  account_type: string
  linked_finance_account_id: string
  provider_name: string | null
  currency: string
  is_active: boolean
  finance_account_code: string | null
}

type OptionsResponse = {
  accounts: Array<FinanceAccountOption & { id: string }>
  bankAccounts: FinanceBankAccountOption[]
  properties: FinancePropertyOption[]
  reservations: FinanceReservationOption[]
  admin: {
    id: string
    fullName: string
    role: string
    canPost: boolean
    canApprove: boolean
  }
}

type FormState = {
  transactionType: ManualTransactionType
  transactionDate: string
  paymentMethod: string
  bankAccountId: string
  cashAccountCode: string
  destinationBankAccountId: string
  destinationCashAccountCode: string
  reservationId: string
  propertyId: string
  ownerId: string
  brokerId: string
  userId: string
  serviceOrderId: string
  grossAmount: string
  platformRevenueAmount: string
  ownerPayableAmount: string
  providerPayableAmount: string
  paymentFeeAmount: string
  taxAmount: string
  cogsAmount: string
  refundAmount: string
  revenueAccountCode: string
  expenseAccountCode: string
  fundingAccountCode: '3000' | '3100'
  externalReference: string
  payerName: string
  payerPhone: string
  payeeName: string
  payeePhone: string
  receiptUrl: string
  description: string
  notes: string
  postNow: boolean
  idempotencyKey: string
}

type ScenarioConfig = {
  type: ManualTransactionType
  label: string
  description: string
  group: 'booking' | 'income' | 'outflow' | 'capital'
  icon: typeof Banknote
}

const SCENARIOS: ScenarioConfig[] = [
  {
    type: 'reservation_full_collection',
    label: 'تحصيل مبلغ للحجز',
    description: 'Navienty استلمت دفعة كلية أو جزئية وتفصل إيرادها عن مستحق المالك.',
    group: 'booking',
    icon: CircleDollarSign,
  },
  {
    type: 'reservation_commission_collection',
    label: 'تحصيل عمولة الحجز فقط',
    description: 'المالك استلم الإيجار وNavienty استلمت العمولة.',
    group: 'booking',
    icon: BadgeDollarSign,
  },
  {
    type: 'owner_commission_receivable',
    label: 'عمولة مستحقة على المالك',
    description: 'إثبات إيراد وذمة على المالك بدون حركة نقدية الآن.',
    group: 'booking',
    icon: ReceiptText,
  },
  {
    type: 'owner_commission_payment',
    label: 'سداد عمولة من المالك',
    description: 'تحصيل ذمة مسجلة سابقًا على المالك.',
    group: 'booking',
    icon: ArrowDownLeft,
  },
  {
    type: 'service_income',
    label: 'تحصيل خدمة',
    description: 'نظافة أو غسيل أو صيانة مع فصل مستحق مقدم الخدمة.',
    group: 'income',
    icon: WalletCards,
  },
  {
    type: 'managed_subscription',
    label: 'Managed by Navienty',
    description: 'اشتراك أو رسم إدارة شهري من المالك.',
    group: 'income',
    icon: ShieldCheck,
  },
  {
    type: 'elite_ad',
    label: 'Elite Ads',
    description: 'تحصيل إعلان مميز أو ترقية ظهور عقار.',
    group: 'income',
    icon: FileCheck2,
  },
  {
    type: 'start_kit_sale',
    label: 'بيع Start-kit',
    description: 'إيراد المنتج مع إثبات تكلفة المخزون عند توفرها.',
    group: 'income',
    icon: ReceiptText,
  },
  {
    type: 'expense',
    label: 'مصروف يدوي',
    description: 'مصروف تشغيل، تسويق، تقنية، رواتب أو غيره.',
    group: 'outflow',
    icon: ArrowUpRight,
  },
  {
    type: 'refund',
    label: 'استرداد مبلغ',
    description: 'رد مبلغ لعميل وربطه بالحجز عند الحاجة.',
    group: 'outflow',
    icon: RotateCcw,
  },
  {
    type: 'owner_payout',
    label: 'تحويل مستحقات مالك',
    description: 'تخفيض مستحقات المالك مقابل حركة دفع فعلية.',
    group: 'outflow',
    icon: ArrowUpRight,
  },
  {
    type: 'provider_payout',
    label: 'تحويل لمقدم خدمة',
    description: 'سداد مستحقات مقدم النظافة أو الغسيل أو الصيانة.',
    group: 'outflow',
    icon: ArrowUpRight,
  },
  {
    type: 'funding',
    label: 'تمويل جديد',
    description: 'رأس مال مؤسس أو استثمار خارجي.',
    group: 'capital',
    icon: Banknote,
  },
  {
    type: 'opening_balance',
    label: 'رصيد افتتاحي',
    description: 'إدخال الرصيد الحقيقي عند بداية استخدام النظام.',
    group: 'capital',
    icon: Banknote,
  },
  {
    type: 'bank_transfer',
    label: 'تحويل بين الحسابات',
    description: 'نقل نقدية بين بنك، خزينة، إنستاباي أو محفظة.',
    group: 'capital',
    icon: ArrowLeftRight,
  },
]

const TRANSACTION_TYPE_LABELS = Object.fromEntries(
  SCENARIOS.map((scenario) => [scenario.type, scenario.label]),
) as Record<ManualTransactionType, string>

const PAYMENT_METHODS = [
  ['cash', 'نقدي'],
  ['bank_transfer', 'تحويل بنكي'],
  ['instapay', 'InstaPay'],
  ['vodafone_cash', 'Vodafone Cash'],
  ['orange_cash', 'Orange Cash'],
  ['etisalat_cash', 'Etisalat Cash'],
  ['card', 'بطاقة'],
  ['payment_gateway', 'بوابة دفع'],
  ['mixed', 'أكثر من طريقة'],
  ['other', 'أخرى'],
  ['non_cash', 'بدون حركة نقدية'],
] as const

const REVENUE_ACCOUNTS_BY_SCENARIO: Partial<
  Record<ManualTransactionType, string[]>
> = {
  reservation_full_collection: ['4000'],
  reservation_commission_collection: ['4000'],
  owner_commission_receivable: ['4000'],
  service_income: ['4200', '4210', '4220', '4800'],
  managed_subscription: ['4100'],
  elite_ad: ['4400'],
  start_kit_sale: ['4300'],
}

function localDateString() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function makeIdempotencyKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createInitialForm(): FormState {
  return {
    transactionType: 'reservation_full_collection',
    transactionDate: localDateString(),
    paymentMethod: 'instapay',
    bankAccountId: '',
    cashAccountCode: '1020',
    destinationBankAccountId: '',
    destinationCashAccountCode: '',
    reservationId: '',
    propertyId: '',
    ownerId: '',
    brokerId: '',
    userId: '',
    serviceOrderId: '',
    grossAmount: '',
    platformRevenueAmount: '',
    ownerPayableAmount: '',
    providerPayableAmount: '',
    paymentFeeAmount: '0',
    taxAmount: '0',
    cogsAmount: '0',
    refundAmount: '',
    revenueAccountCode: '4000',
    expenseAccountCode: '6900',
    fundingAccountCode: '3000',
    externalReference: '',
    payerName: '',
    payerPhone: '',
    payeeName: '',
    payeePhone: '',
    receiptUrl: '',
    description: '',
    notes: '',
    postNow: true,
    idempotencyKey: makeIdempotencyKey(),
  }
}

function numberOf(value: string) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function statusClasses(status: ManualTransactionListItem['status']) {
  switch (status) {
    case 'posted':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pending_approval':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'draft':
      return 'bg-slate-50 text-slate-700 border-slate-200'
    case 'rejected':
    case 'void':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200'
  }
}

function statusLabel(status: ManualTransactionListItem['status']) {
  switch (status) {
    case 'posted':
      return 'مرحّلة'
    case 'pending_approval':
      return 'تنتظر الاعتماد'
    case 'draft':
      return 'مسودة'
    case 'approved':
      return 'معتمدة'
    case 'rejected':
      return 'مرفوضة'
    case 'void':
      return 'ملغاة'
    default:
      return status
  }
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-bold text-slate-700">
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100'

export default function ManualTransactionsClient() {
  const [options, setOptions] = useState<OptionsResponse | null>(null)
  const [transactions, setTransactions] = useState<ManualTransactionListItem[]>([])
  const [form, setForm] = useState<FormState>(() => createInitialForm())
  const [scenarioGroup, setScenarioGroup] = useState<ScenarioConfig['group']>('booking')
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true)
    try {
      const response = await fetch(
        '/api/admin/finance/manual-transactions/options',
        { cache: 'no-store' },
      )
      const payload = (await response.json()) as OptionsResponse & { error?: string }
      if (!response.ok) throw new Error(payload.error || 'فشل تحميل الاختيارات.')
      setOptions(payload)

      setForm((current) => {
        if (current.bankAccountId || payload.bankAccounts.length === 0) return current
        const preferred =
          payload.bankAccounts.find(
            (account) => account.finance_account_code === current.cashAccountCode,
          ) || payload.bankAccounts[0]
        return {
          ...current,
          bankAccountId: preferred?.id || '',
          cashAccountCode:
            preferred?.finance_account_code || current.cashAccountCode,
        }
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'فشل تحميل البيانات.')
    } finally {
      setLoadingOptions(false)
    }
  }, [])

  const loadTransactions = useCallback(async () => {
    setLoadingTransactions(true)
    try {
      const response = await fetch(
        '/api/admin/finance/manual-transactions?limit=200',
        { cache: 'no-store' },
      )
      const payload = (await response.json()) as {
        transactions?: ManualTransactionListItem[]
        error?: string
      }
      if (!response.ok) throw new Error(payload.error || 'فشل تحميل الحركات.')
      setTransactions(payload.transactions || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'فشل تحميل الحركات.')
    } finally {
      setLoadingTransactions(false)
    }
  }, [])

  useEffect(() => {
    void Promise.all([loadOptions(), loadTransactions()])
  }, [loadOptions, loadTransactions])

  const selectedScenario = useMemo(
    () => SCENARIOS.find((item) => item.type === form.transactionType)!,
    [form.transactionType],
  )

  const selectedReservation = useMemo(
    () => options?.reservations.find((item) => item.id === form.reservationId),
    [form.reservationId, options?.reservations],
  )

  const revenueAccounts = useMemo(() => {
    const allowedCodes = REVENUE_ACCOUNTS_BY_SCENARIO[form.transactionType]
    if (!options) return []
    return options.accounts.filter(
      (account) =>
        account.account_type === 'revenue' &&
        (!allowedCodes || allowedCodes.includes(account.code)),
    )
  }, [form.transactionType, options])

  const expenseAccounts = useMemo(
    () =>
      options?.accounts.filter((account) =>
        ['cogs', 'opex', 'other_expense', 'tax'].includes(
          account.account_type,
        ),
      ) || [],
    [options],
  )

  const allocationDifference = useMemo(() => {
    const gross = numberOf(form.grossAmount)
    const revenue = numberOf(form.platformRevenueAmount)
    const owner = numberOf(form.ownerPayableAmount)
    const provider = numberOf(form.providerPayableAmount)
    const tax = numberOf(form.taxAmount)

    switch (form.transactionType) {
      case 'reservation_full_collection':
        return gross - revenue - owner - tax
      case 'reservation_commission_collection':
      case 'owner_commission_receivable':
      case 'managed_subscription':
      case 'elite_ad':
      case 'start_kit_sale':
        return gross - revenue - tax
      case 'service_income':
        return gross - revenue - provider - tax
      default:
        return 0
    }
  }, [form])

  const allocationIsRelevant = [
    'reservation_full_collection',
    'reservation_commission_collection',
    'owner_commission_receivable',
    'service_income',
    'managed_subscription',
    'elite_ad',
    'start_kit_sale',
  ].includes(form.transactionType)

  const filteredTransactions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return transactions.filter((transaction) => {
      if (statusFilter !== 'all' && transaction.status !== statusFilter) return false
      if (!term) return true
      return [
        transaction.transaction_number,
        transaction.description,
        transaction.reservation_customer_name,
        transaction.property_title_ar,
        transaction.property_title_en,
        transaction.external_reference,
        transaction.entry_number,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    })
  }, [searchTerm, statusFilter, transactions])

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function chooseScenario(type: ManualTransactionType) {
    const scenario = SCENARIOS.find((item) => item.type === type)!
    setScenarioGroup(scenario.group)
    setForm((current) => {
      const nonCash = type === 'owner_commission_receivable'
      const revenueAccountCode =
        REVENUE_ACCOUNTS_BY_SCENARIO[type]?.[0] || current.revenueAccountCode

      return {
        ...current,
        transactionType: type,
        paymentMethod: nonCash ? 'non_cash' : current.paymentMethod === 'non_cash' ? 'instapay' : current.paymentMethod,
        cashAccountCode: nonCash
          ? current.cashAccountCode
          : getDefaultCashAccountCode(
              current.paymentMethod === 'non_cash'
                ? 'instapay'
                : (current.paymentMethod as Parameters<
                    typeof getDefaultCashAccountCode
                  >[0]),
            ),
        revenueAccountCode,
        description: scenario.label,
      }
    })
  }

  function chooseReservation(reservationId: string) {
    if (!options) return
    const reservation = options.reservations.find((item) => item.id === reservationId)
    const property = reservation
      ? options.properties.find((item) => item.id === reservation.property_id)
      : null

    setForm((current) => ({
      ...current,
      reservationId,
      propertyId: reservation?.property_id || '',
      ownerId: property?.owner_id || '',
      brokerId: property?.broker_id || '',
      userId: reservation?.user_id || '',
      grossAmount:
        reservation && current.transactionType === 'reservation_full_collection'
          ? String(reservation.total_price_egp)
          : current.grossAmount,
      payerName: reservation?.customer_name || current.payerName,
      description: reservation
        ? `${TRANSACTION_TYPE_LABELS[current.transactionType]} - ${reservation.customer_name}`
        : current.description,
    }))
  }

  function chooseProperty(propertyId: string) {
    const property = options?.properties.find((item) => item.id === propertyId)
    setForm((current) => ({
      ...current,
      propertyId,
      ownerId: property?.owner_id || '',
      brokerId: property?.broker_id || '',
    }))
  }

  function chooseBankAccount(bankAccountId: string, destination = false) {
    const account = options?.bankAccounts.find((item) => item.id === bankAccountId)
    setForm((current) =>
      destination
        ? {
            ...current,
            destinationBankAccountId: bankAccountId,
            destinationCashAccountCode:
              account?.finance_account_code || current.destinationCashAccountCode,
          }
        : {
            ...current,
            bankAccountId,
            cashAccountCode:
              account?.finance_account_code || current.cashAccountCode,
          },
    )
  }

  async function submitTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/finance/manual-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          grossAmount: numberOf(form.grossAmount),
          platformRevenueAmount: numberOf(form.platformRevenueAmount),
          ownerPayableAmount: numberOf(form.ownerPayableAmount),
          providerPayableAmount: numberOf(form.providerPayableAmount),
          paymentFeeAmount: numberOf(form.paymentFeeAmount),
          taxAmount: numberOf(form.taxAmount),
          cogsAmount: numberOf(form.cogsAmount),
          refundAmount: numberOf(form.refundAmount),
          serviceOrderId: form.serviceOrderId || null,
        }),
      })

      const payload = (await response.json()) as {
        result?: {
          transaction_number?: string
          entry_number?: string
          status?: string
        }
        error?: string
      }

      if (!response.ok) throw new Error(payload.error || 'فشل تسجيل الحركة.')

      const result = payload.result || {}
      setSuccess(
        `تم تسجيل ${result.transaction_number || 'الحركة'} وإنشاء القيد ${result.entry_number || ''}. الحالة: ${
          result.status === 'pending_approval' ? 'تنتظر الاعتماد' : 'مرحّلة'
        }`,
      )

      const previousType = form.transactionType
      setForm({
        ...createInitialForm(),
        transactionType: previousType,
        description: TRANSACTION_TYPE_LABELS[previousType],
        bankAccountId: form.bankAccountId,
        cashAccountCode: form.cashAccountCode,
      })
      await loadTransactions()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'فشل تسجيل الحركة.')
    } finally {
      setSubmitting(false)
    }
  }

  async function approveTransaction(id: string) {
    setApprovingId(id)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(
        `/api/admin/finance/manual-transactions/${id}/approve`,
        { method: 'POST' },
      )
      const payload = (await response.json()) as {
        result?: { transaction_number?: string }
        error?: string
      }
      if (!response.ok) throw new Error(payload.error || 'فشل اعتماد الحركة.')
      setSuccess(`تم اعتماد وترحيل ${payload.result?.transaction_number || 'الحركة'}.`)
      await loadTransactions()
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'فشل اعتماد الحركة.')
    } finally {
      setApprovingId(null)
    }
  }

  const showReservation = [
    'reservation_full_collection',
    'reservation_commission_collection',
    'owner_commission_receivable',
    'owner_commission_payment',
    'refund',
  ].includes(form.transactionType)
  const showOwner = [
    'reservation_full_collection',
    'owner_commission_receivable',
    'owner_commission_payment',
    'managed_subscription',
    'elite_ad',
    'owner_payout',
  ].includes(form.transactionType)
  const showRevenue = [
    'reservation_full_collection',
    'reservation_commission_collection',
    'owner_commission_receivable',
    'service_income',
    'managed_subscription',
    'elite_ad',
    'start_kit_sale',
  ].includes(form.transactionType)
  const showTax = showRevenue
  const showPayment = form.transactionType !== 'owner_commission_receivable'
  const isOutflow = ['expense', 'refund', 'owner_payout', 'provider_payout'].includes(
    form.transactionType,
  )
  const SelectedScenarioIcon = selectedScenario.icon

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-700">
                <ShieldCheck className="h-5 w-5" />
                Navienty Finance OS
              </div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                الحركات المالية اليدوية
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                سجّل الحجوزات والتحصيلات والمصروفات التي تمت خارج Wallets. كل حركة تُحوّل تلقائيًا إلى قيد محاسبي متوازن، ويمكن للمحاسب أو الإدارة مراجعتها وترحيلها من نفس الشاشة.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {options?.admin && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <div className="font-bold">{options.admin.fullName}</div>
                  <div className="text-xs uppercase text-slate-500">{options.admin.role}</div>
                </div>
              )}
              <button
                type="button"
                onClick={() => void Promise.all([loadOptions(), loadTransactions()])}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold transition hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" /> تحديث
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
          <form onSubmit={submitTransaction} className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">1. اختر نوع الحركة</h2>
                  <p className="mt-1 text-sm text-slate-500">اختيار النوع يحدد القيد المحاسبي تلقائيًا.</p>
                </div>
                <Plus className="h-5 w-5 text-blue-600" />
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {(
                  [
                    ['booking', 'الحجوزات'],
                    ['income', 'الإيرادات'],
                    ['outflow', 'المدفوعات'],
                    ['capital', 'النقدية والتمويل'],
                  ] as const
                ).map(([group, label]) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setScenarioGroup(group)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      scenarioGroup === group
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {SCENARIOS.filter((scenario) => scenario.group === scenarioGroup).map(
                  (scenario) => {
                    const Icon = scenario.icon
                    const selected = scenario.type === form.transactionType
                    return (
                      <button
                        key={scenario.type}
                        type="button"
                        onClick={() => chooseScenario(scenario.type)}
                        className={`rounded-2xl border p-4 text-right transition ${
                          selected
                            ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`rounded-xl p-2 ${
                              selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-black">{scenario.label}</div>
                              {selected && <Check className="h-5 w-5 text-blue-600" />}
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {scenario.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  },
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-black">2. الربط بالحجز والعقار</h2>
                <p className="mt-1 text-sm text-slate-500">
                  الربط اختياري في أغلب الحالات وإلزامي عند تحصيل الحجز بالكامل.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {showReservation && (
                  <div className="md:col-span-2">
                    <FieldLabel>الحجز</FieldLabel>
                    <select
                      value={form.reservationId}
                      onChange={(event) => chooseReservation(event.target.value)}
                      className={inputClass}
                      disabled={loadingOptions}
                    >
                      <option value="">بدون ربط بحجز</option>
                      {options?.reservations.map((reservation) => {
                        const property = options.properties.find(
                          (item) => item.id === reservation.property_id,
                        )
                        return (
                          <option key={reservation.id} value={reservation.id}>
                            {reservation.customer_name} — {property?.title_ar || property?.title_en || 'عقار'} — {formatMoney(reservation.total_price_egp)} EGP — {reservation.payment_status}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}

                <div>
                  <FieldLabel>العقار</FieldLabel>
                  <select
                    value={form.propertyId}
                    onChange={(event) => chooseProperty(event.target.value)}
                    className={inputClass}
                    disabled={loadingOptions}
                  >
                    <option value="">بدون ربط بعقار</option>
                    {options?.properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.property_id} — {property.title_ar || property.title_en}
                      </option>
                    ))}
                  </select>
                </div>

                {showOwner && (
                  <div>
                    <FieldLabel>Owner ID</FieldLabel>
                    <input
                      value={form.ownerId}
                      onChange={(event) => updateForm('ownerId', event.target.value)}
                      className={inputClass}
                      placeholder="يتم ملؤه تلقائيًا من العقار"
                    />
                  </div>
                )}

                {form.transactionType === 'service_income' && (
                  <div>
                    <FieldLabel>Service Order ID</FieldLabel>
                    <input
                      type="number"
                      min="1"
                      value={form.serviceOrderId}
                      onChange={(event) => updateForm('serviceOrderId', event.target.value)}
                      className={inputClass}
                      placeholder="اختياري"
                    />
                  </div>
                )}
              </div>

              {selectedReservation && (
                <div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm md:grid-cols-3">
                  <div>
                    <div className="text-xs text-blue-600">العميل</div>
                    <div className="mt-1 font-black text-blue-950">
                      {selectedReservation.customer_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600">قيمة الحجز</div>
                    <div className="mt-1 font-black text-blue-950">
                      {formatMoney(selectedReservation.total_price_egp)} EGP
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600">حالة الدفع الحالية</div>
                    <div className="mt-1 font-black text-blue-950">
                      {selectedReservation.payment_status}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-black">3. المبالغ والتوزيع</h2>
                <p className="mt-1 text-sm text-slate-500">
                  لا يتم اعتبار إجمالي الإيجار إيرادًا لـNavienty. أدخل نصيب Navienty ومستحق المالك كلٌ على حدة.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <FieldLabel>المبلغ الإجمالي (EGP)</FieldLabel>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.grossAmount}
                    onChange={(event) => updateForm('grossAmount', event.target.value)}
                    className={inputClass}
                  />
                </div>

                {showRevenue && (
                  <div>
                    <FieldLabel>إيراد Navienty</FieldLabel>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.platformRevenueAmount}
                      onChange={(event) =>
                        updateForm('platformRevenueAmount', event.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                )}

                {form.transactionType === 'reservation_full_collection' && (
                  <div>
                    <FieldLabel>مستحق المالك</FieldLabel>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.ownerPayableAmount}
                      onChange={(event) =>
                        updateForm('ownerPayableAmount', event.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                )}

                {form.transactionType === 'service_income' && (
                  <div>
                    <FieldLabel>مستحق مقدم الخدمة</FieldLabel>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.providerPayableAmount}
                      onChange={(event) =>
                        updateForm('providerPayableAmount', event.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                )}

                {showTax && (
                  <div>
                    <FieldLabel>الضريبة</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.taxAmount}
                      onChange={(event) => updateForm('taxAmount', event.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}

                {showPayment && (
                  <div>
                    <FieldLabel>رسوم التحصيل/الدفع</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.paymentFeeAmount}
                      onChange={(event) =>
                        updateForm('paymentFeeAmount', event.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                )}

                {form.transactionType === 'start_kit_sale' && (
                  <div>
                    <FieldLabel>تكلفة المنتج</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.cogsAmount}
                      onChange={(event) => updateForm('cogsAmount', event.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}

                {form.transactionType === 'refund' && (
                  <div>
                    <FieldLabel>المبلغ المسترد</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.refundAmount}
                      onChange={(event) => updateForm('refundAmount', event.target.value)}
                      className={inputClass}
                      placeholder="اتركه فارغًا لاستخدام الإجمالي"
                    />
                  </div>
                )}

                {showRevenue && revenueAccounts.length > 0 && (
                  <div>
                    <FieldLabel>حساب الإيراد</FieldLabel>
                    <select
                      value={form.revenueAccountCode}
                      onChange={(event) =>
                        updateForm('revenueAccountCode', event.target.value)
                      }
                      className={inputClass}
                    >
                      {revenueAccounts.map((account) => (
                        <option key={account.code} value={account.code}>
                          {account.code} — {account.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {form.transactionType === 'expense' && (
                  <div>
                    <FieldLabel>حساب المصروف</FieldLabel>
                    <select
                      value={form.expenseAccountCode}
                      onChange={(event) =>
                        updateForm('expenseAccountCode', event.target.value)
                      }
                      className={inputClass}
                    >
                      {expenseAccounts.map((account) => (
                        <option key={account.code} value={account.code}>
                          {account.code} — {account.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {['funding', 'opening_balance'].includes(form.transactionType) && (
                  <div>
                    <FieldLabel>مصدر رأس المال</FieldLabel>
                    <select
                      value={form.fundingAccountCode}
                      onChange={(event) =>
                        updateForm(
                          'fundingAccountCode',
                          event.target.value === '3100' ? '3100' : '3000',
                        )
                      }
                      className={inputClass}
                    >
                      <option value="3000">3000 — رأس مال المؤسس</option>
                      <option value="3100">3100 — رأس مال المستثمرين</option>
                    </select>
                  </div>
                )}
              </div>

              {allocationIsRelevant && (
                <div
                  className={`mt-5 flex flex-col justify-between gap-3 rounded-2xl border p-4 text-sm sm:flex-row sm:items-center ${
                    Math.abs(allocationDifference) <= 0.01
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                >
                  <div>
                    <div className="font-black">فحص توزيع المبلغ</div>
                    <div className="mt-1 text-xs">
                      يجب أن يساوي الإجمالي مجموع الإيراد + مستحق المالك/المقدم + الضريبة.
                    </div>
                  </div>
                  <div className="text-lg font-black" dir="ltr">
                    Difference: {formatMoney(allocationDifference)} EGP
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-black">4. الدفع والمستند</h2>
                <p className="mt-1 text-sm text-slate-500">
                  اختر الحساب الذي دخلت إليه أو خرجت منه النقدية وسجل المرجع والإيصال.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>{isOutflow ? 'الحساب المدفوع منه' : 'الحساب المستلم عليه'}</FieldLabel>
                  <select
                    value={form.bankAccountId}
                    onChange={(event) => chooseBankAccount(event.target.value)}
                    className={inputClass}
                    disabled={!showPayment || loadingOptions}
                  >
                    <option value="">اختر الحساب</option>
                    {options?.bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name_ar} — {account.finance_account_code || 'بدون حساب دفتر أستاذ'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>طريقة الدفع</FieldLabel>
                  <select
                    value={form.paymentMethod}
                    onChange={(event) => {
                      const value = event.target.value
                      updateForm('paymentMethod', value)
                      if (value !== 'non_cash') {
                        updateForm(
                          'cashAccountCode',
                          getDefaultCashAccountCode(
                            value as Parameters<typeof getDefaultCashAccountCode>[0],
                          ),
                        )
                      }
                    }}
                    className={inputClass}
                    disabled={!showPayment}
                  >
                    {PAYMENT_METHODS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {form.transactionType === 'bank_transfer' && (
                  <div className="md:col-span-2">
                    <FieldLabel>الحساب المحول إليه</FieldLabel>
                    <select
                      value={form.destinationBankAccountId}
                      onChange={(event) => chooseBankAccount(event.target.value, true)}
                      className={inputClass}
                      required
                    >
                      <option value="">اختر الحساب المستلم</option>
                      {options?.bankAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name_ar} — {account.finance_account_code || 'بدون حساب دفتر أستاذ'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <FieldLabel>تاريخ الحركة</FieldLabel>
                  <input
                    required
                    type="date"
                    value={form.transactionDate}
                    onChange={(event) => updateForm('transactionDate', event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <FieldLabel>رقم مرجعي خارجي</FieldLabel>
                  <input
                    value={form.externalReference}
                    onChange={(event) =>
                      updateForm('externalReference', event.target.value)
                    }
                    className={inputClass}
                    placeholder="رقم تحويل / إيصال / عملية"
                  />
                </div>

                <div>
                  <FieldLabel>{isOutflow ? 'اسم المستفيد' : 'اسم الدافع'}</FieldLabel>
                  <input
                    value={isOutflow ? form.payeeName : form.payerName}
                    onChange={(event) =>
                      updateForm(
                        isOutflow ? 'payeeName' : 'payerName',
                        event.target.value,
                      )
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <FieldLabel>{isOutflow ? 'هاتف المستفيد' : 'هاتف الدافع'}</FieldLabel>
                  <input
                    value={isOutflow ? form.payeePhone : form.payerPhone}
                    onChange={(event) =>
                      updateForm(
                        isOutflow ? 'payeePhone' : 'payerPhone',
                        event.target.value,
                      )
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>رابط الإيصال أو المستند</FieldLabel>
                  <input
                    type="url"
                    value={form.receiptUrl}
                    onChange={(event) => updateForm('receiptUrl', event.target.value)}
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FieldLabel>وصف الحركة</FieldLabel>
                  <input
                    required
                    value={form.description}
                    onChange={(event) => updateForm('description', event.target.value)}
                    className={inputClass}
                    placeholder="مثال: تحصيل حجز أحمد - شقة شارع الجامعة"
                  />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>ملاحظات داخلية</FieldLabel>
                  <textarea
                    value={form.notes}
                    onChange={(event) => updateForm('notes', event.target.value)}
                    className={`${inputClass} min-h-24 resize-y`}
                  />
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={form.postNow}
                  onChange={(event) => updateForm('postNow', event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
                <div>
                  <div className="font-black">طلب ترحيل الحركة فورًا</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    المحاسب والإدارة يمكنهم حفظ الحركة كمسودة أو اعتمادها وترحيلها فورًا من نفس الشاشة.
                  </p>
                </div>
              </label>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={submitting || loadingOptions}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : form.postNow ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  {submitting
                    ? 'جاري إنشاء القيد...'
                    : form.postNow
                      ? 'تسجيل وترحيل الحركة'
                      : 'حفظ كمسودة'}
                </button>
                <button
                  type="button"
                  onClick={() => setForm(createInitialForm())}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" /> إعادة تعيين
                </button>
              </div>
            </div>
          </form>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300">
                    القيد المتوقع
                  </div>
                  <h2 className="mt-2 text-xl font-black">{selectedScenario.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {selectedScenario.description}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <SelectedScenarioIcon className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">الإجمالي</span>
                  <span className="font-black" dir="ltr">
                    {formatMoney(numberOf(form.grossAmount))} EGP
                  </span>
                </div>
                {showRevenue && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">إيراد Navienty</span>
                    <span className="font-black" dir="ltr">
                      {formatMoney(numberOf(form.platformRevenueAmount))} EGP
                    </span>
                  </div>
                )}
                {form.transactionType === 'reservation_full_collection' && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">التزام للمالك</span>
                    <span className="font-black" dir="ltr">
                      {formatMoney(numberOf(form.ownerPayableAmount))} EGP
                    </span>
                  </div>
                )}
                {form.transactionType === 'service_income' && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">التزام لمقدم الخدمة</span>
                    <span className="font-black" dir="ltr">
                      {formatMoney(numberOf(form.providerPayableAmount))} EGP
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                  <span className="text-slate-400">حساب النقدية</span>
                  <span className="font-mono font-bold">{form.cashAccountCode || '—'}</span>
                </div>
              </div>

              {form.transactionType === 'reservation_full_collection' && (
                <div className="mt-4 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4 text-xs leading-6 text-blue-100">
                  بعد الترحيل، يعاد حساب <strong>payment_status</strong> للحجز من الدفعات الحالية + التحصيلات اليدوية، بدون الحاجة إلى Wallet Transaction.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black">آخر الحركات</h2>
                  <p className="mt-1 text-xs text-slate-500">{transactions.length} حركة محملة</p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadTransactions()}
                  className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingTransactions ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className={`${inputClass} pr-10`}
                    placeholder="بحث برقم الحركة أو العميل"
                  />
                </div>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="all">كل الحالات</option>
                    <option value="posted">مرحّلة</option>
                    <option value="pending_approval">تنتظر الاعتماد</option>
                    <option value="draft">مسودة</option>
                    <option value="rejected">مرفوضة</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="mt-4 max-h-[720px] space-y-3 overflow-y-auto pl-1">
                {loadingTransactions && transactions.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-slate-500">
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" /> جاري التحميل
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
                    لا توجد حركات مطابقة.
                  </div>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <article
                      key={transaction.id}
                      className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-black text-blue-700">
                              {transaction.transaction_number}
                            </span>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusClasses(transaction.status)}`}
                            >
                              {statusLabel(transaction.status)}
                            </span>
                          </div>
                          <h3 className="mt-2 truncate font-black">
                            {TRANSACTION_TYPE_LABELS[transaction.transaction_type] || transaction.transaction_type}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {transaction.description}
                          </p>
                        </div>
                        <div className="shrink-0 text-left">
                          <div className="font-black" dir="ltr">
                            {formatMoney(transaction.gross_amount)} EGP
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400">
                            {transaction.transaction_date}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                        {transaction.reservation_customer_name && (
                          <span>العميل: {transaction.reservation_customer_name}</span>
                        )}
                        {transaction.property_title_ar && (
                          <span>العقار: {transaction.property_title_ar}</span>
                        )}
                        {transaction.entry_number && (
                          <span className="font-mono">{transaction.entry_number}</span>
                        )}
                      </div>

                      {transaction.status === 'pending_approval' && options?.admin.canApprove && (
                        <button
                          type="button"
                          onClick={() => void approveTransaction(transaction.id)}
                          disabled={approvingId === transaction.id}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {approvingId === transaction.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          اعتماد وترحيل
                        </button>
                      )}
                    </article>
                  ))
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
