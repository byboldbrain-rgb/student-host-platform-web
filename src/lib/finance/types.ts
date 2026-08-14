export const MANUAL_TRANSACTION_TYPES = [
  'reservation_full_collection',
  'reservation_commission_collection',
  'owner_commission_receivable',
  'owner_commission_payment',
  'service_income',
  'managed_subscription',
  'elite_ad',
  'start_kit_sale',
  'expense',
  'funding',
  'refund',
  'owner_payout',
  'provider_payout',
  'opening_balance',
  'bank_transfer',
] as const

export type ManualTransactionType = (typeof MANUAL_TRANSACTION_TYPES)[number]

export const MANUAL_PAYMENT_METHODS = [
  'cash',
  'bank_transfer',
  'instapay',
  'vodafone_cash',
  'orange_cash',
  'etisalat_cash',
  'wallet',
  'card',
  'payment_gateway',
  'mixed',
  'other',
  'non_cash',
] as const

export type ManualPaymentMethod = (typeof MANUAL_PAYMENT_METHODS)[number]

export type ManualTransactionDirection =
  | 'inflow'
  | 'outflow'
  | 'non_cash'
  | 'transfer'

export type JournalLineInput = {
  account_code: string
  debit_amount: number
  credit_amount: number
  description?: string
  owner_id?: string | null
  broker_id?: string | null
  property_id?: string | null
  reservation_id?: string | null
  user_id?: string | null
  service_order_id?: number | null
  vertical_code?: string | null
  cost_center_code?: string | null
  area_id?: string | null
  metadata?: Record<string, unknown>
}

export type ManualTransactionInput = {
  transactionType: ManualTransactionType
  transactionDate: string
  paymentMethod: ManualPaymentMethod
  cashAccountCode: string
  destinationCashAccountCode?: string

  grossAmount: number
  platformRevenueAmount?: number
  ownerPayableAmount?: number
  providerPayableAmount?: number
  paymentFeeAmount?: number
  taxAmount?: number
  cogsAmount?: number
  receivableAmount?: number
  refundAmount?: number

  revenueAccountCode?: string
  expenseAccountCode?: string
  fundingAccountCode?: '3000' | '3100'

  reservationId?: string | null
  propertyId?: string | null
  ownerId?: string | null
  brokerId?: string | null
  userId?: string | null
  serviceOrderId?: number | null

  bankAccountId?: string | null
  destinationBankAccountId?: string | null
  externalReference?: string | null
  payerName?: string | null
  payerPhone?: string | null
  payeeName?: string | null
  payeePhone?: string | null
  receiptUrl?: string | null
  description: string
  notes?: string | null
  idempotencyKey: string
  postNow?: boolean
  metadata?: Record<string, unknown>
}

export type ManualTransactionRpcPayload = {
  transaction_type: ManualTransactionType
  direction: ManualTransactionDirection
  transaction_date: string
  payment_method: ManualPaymentMethod
  currency: 'EGP'
  bank_account_id?: string | null
  destination_bank_account_id?: string | null
  reservation_id?: string | null
  property_id?: string | null
  owner_id?: string | null
  broker_id?: string | null
  user_id?: string | null
  service_order_id?: number | null
  gross_amount: number
  platform_revenue_amount: number
  owner_payable_amount: number
  provider_payable_amount: number
  payment_fee_amount: number
  tax_amount: number
  cogs_amount: number
  receivable_amount: number
  refund_amount: number
  external_reference?: string | null
  payer_name?: string | null
  payer_phone?: string | null
  payee_name?: string | null
  payee_phone?: string | null
  receipt_url?: string | null
  description: string
  notes?: string | null
  idempotency_key: string
  metadata: Record<string, unknown>
}

export type BuiltManualPosting = {
  transaction: ManualTransactionRpcPayload
  lines: JournalLineInput[]
}

export type FinanceAccountOption = {
  code: string
  name_ar: string
  name_en: string
  account_type: string
  normal_balance: 'debit' | 'credit'
  system_key: string | null
  allow_manual_posting: boolean
}

export type FinancePropertyOption = {
  id: string
  property_id: string
  title_ar: string
  title_en: string
  owner_id: string
  broker_id: string
}

export type FinanceReservationOption = {
  id: string
  property_id: string
  customer_name: string
  total_price_egp: number
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded'
  status: string
  created_at: string
  season_name_ar: string | null
  season_name_en: string | null
  user_id: string | null
}

export type ManualTransactionListItem = {
  id: string
  transaction_number: string
  transaction_type: ManualTransactionType
  direction: ManualTransactionDirection
  status: 'draft' | 'pending_approval' | 'approved' | 'posted' | 'rejected' | 'void'
  transaction_date: string
  payment_method: ManualPaymentMethod | null
  gross_amount: number
  platform_revenue_amount: number
  owner_payable_amount: number
  provider_payable_amount: number
  payment_fee_amount: number
  tax_amount: number
  description: string
  external_reference: string | null
  reservation_id: string | null
  reservation_customer_name: string | null
  reservation_payment_status: string | null
  property_id: string | null
  public_property_id: string | null
  property_title_ar: string | null
  property_title_en: string | null
  entry_number: string | null
  total_debit: number | null
  total_credit: number | null
  created_by_name: string | null
  created_by_role: string | null
  posted_at: string | null
  created_at: string
}
