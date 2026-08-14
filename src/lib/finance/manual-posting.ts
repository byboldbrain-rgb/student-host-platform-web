import type {
  BuiltManualPosting,
  JournalLineInput,
  ManualTransactionDirection,
  ManualTransactionInput,
  ManualTransactionRpcPayload,
} from '@/src/lib/finance/types'

const MONEY_TOLERANCE = 0.01

function money(value: number | null | undefined): number {
  const normalized = Number(value ?? 0)
  if (!Number.isFinite(normalized)) {
    throw new Error('One of the entered amounts is invalid.')
  }
  return Math.round((normalized + Number.EPSILON) * 100) / 100
}

function requirePositive(value: number, fieldName: string): number {
  const normalized = money(value)
  if (normalized <= 0) {
    throw new Error(`${fieldName} must be greater than zero.`)
  }
  return normalized
}

function assertApproximatelyEqual(
  actual: number,
  expected: number,
  message: string,
): void {
  if (Math.abs(money(actual) - money(expected)) > MONEY_TOLERANCE) {
    throw new Error(message)
  }
}

function addLine(
  lines: JournalLineInput[],
  accountCode: string,
  debitAmount: number,
  creditAmount: number,
  description: string,
  dimensions: Pick<
    JournalLineInput,
    | 'owner_id'
    | 'broker_id'
    | 'property_id'
    | 'reservation_id'
    | 'user_id'
    | 'service_order_id'
    | 'vertical_code'
    | 'cost_center_code'
  >,
): void {
  const debit = money(debitAmount)
  const credit = money(creditAmount)

  if (debit <= 0 && credit <= 0) return
  if (debit > 0 && credit > 0) {
    throw new Error('A journal line cannot contain both debit and credit.')
  }

  lines.push({
    account_code: accountCode,
    debit_amount: debit,
    credit_amount: credit,
    description,
    ...dimensions,
  })
}

function getDirection(input: ManualTransactionInput): ManualTransactionDirection {
  switch (input.transactionType) {
    case 'owner_commission_receivable':
      return 'non_cash'
    case 'expense':
    case 'refund':
    case 'owner_payout':
    case 'provider_payout':
      return 'outflow'
    case 'bank_transfer':
      return 'transfer'
    default:
      return 'inflow'
  }
}

function buildDimensions(input: ManualTransactionInput) {
  return {
    owner_id: input.ownerId || null,
    broker_id: input.brokerId || null,
    property_id: input.propertyId || null,
    reservation_id: input.reservationId || null,
    user_id: input.userId || null,
    service_order_id: input.serviceOrderId || null,
    vertical_code: null,
    cost_center_code: null,
  }
}

function addInflowCashLines(
  lines: JournalLineInput[],
  input: ManualTransactionInput,
  grossAmount: number,
  paymentFeeAmount: number,
  description: string,
): void {
  const dimensions = buildDimensions(input)
  const netCash = money(grossAmount - paymentFeeAmount)

  if (netCash < 0) {
    throw new Error('Payment fee cannot exceed the collected amount.')
  }

  addLine(
    lines,
    input.cashAccountCode,
    netCash,
    0,
    `${description} - cash received`,
    dimensions,
  )

  if (paymentFeeAmount > 0) {
    addLine(
      lines,
      '5300',
      paymentFeeAmount,
      0,
      `${description} - payment processing fee`,
      { ...dimensions, vertical_code: 'Payments' },
    )
  }
}

function addOutflowCashLine(
  lines: JournalLineInput[],
  input: ManualTransactionInput,
  principalAmount: number,
  paymentFeeAmount: number,
  description: string,
): void {
  const dimensions = buildDimensions(input)

  if (paymentFeeAmount > 0) {
    addLine(
      lines,
      '5300',
      paymentFeeAmount,
      0,
      `${description} - payment processing fee`,
      { ...dimensions, vertical_code: 'Payments' },
    )
  }

  addLine(
    lines,
    input.cashAccountCode,
    0,
    money(principalAmount + paymentFeeAmount),
    `${description} - cash paid`,
    dimensions,
  )
}

export function buildManualPosting(input: ManualTransactionInput): BuiltManualPosting {
  const grossAmount = requirePositive(input.grossAmount, 'Gross amount')
  const platformRevenueAmount = money(input.platformRevenueAmount)
  const ownerPayableAmount = money(input.ownerPayableAmount)
  const providerPayableAmount = money(input.providerPayableAmount)
  const paymentFeeAmount = money(input.paymentFeeAmount)
  const taxAmount = money(input.taxAmount)
  const cogsAmount = money(input.cogsAmount)
  const receivableAmount = money(input.receivableAmount)
  const refundAmount = money(input.refundAmount)
  const description = input.description.trim()

  if (!description) {
    throw new Error('Description is required.')
  }
  if (!input.transactionDate) {
    throw new Error('Transaction date is required.')
  }
  if (!input.cashAccountCode) {
    throw new Error('A cash or bank account is required.')
  }
  if (!input.idempotencyKey) {
    throw new Error('Idempotency key is required.')
  }

  const direction = getDirection(input)
  const dimensions = buildDimensions(input)
  const lines: JournalLineInput[] = []

  switch (input.transactionType) {
    case 'reservation_full_collection': {
      if (!input.reservationId) {
        throw new Error('A reservation must be linked to a full booking collection.')
      }
      const allocated = money(
        platformRevenueAmount + ownerPayableAmount + taxAmount,
      )
      assertApproximatelyEqual(
        grossAmount,
        allocated,
        'Gross collection must equal platform revenue + owner payable + tax.',
      )

      addInflowCashLines(
        lines,
        input,
        grossAmount,
        paymentFeeAmount,
        description,
      )
      addLine(
        lines,
        '2010',
        0,
        ownerPayableAmount,
        `${description} - amount due to owner`,
        { ...dimensions, vertical_code: 'Stays' },
      )
      addLine(
        lines,
        input.revenueAccountCode || '4000',
        0,
        platformRevenueAmount,
        `${description} - Navienty commission`,
        { ...dimensions, vertical_code: 'Stays' },
      )
      addLine(
        lines,
        '2200',
        0,
        taxAmount,
        `${description} - tax payable`,
        dimensions,
      )
      break
    }

    case 'reservation_commission_collection': {
      const allocated = money(platformRevenueAmount + taxAmount)
      assertApproximatelyEqual(
        grossAmount,
        allocated,
        'Collected amount must equal Navienty revenue + tax.',
      )

      addInflowCashLines(
        lines,
        input,
        grossAmount,
        paymentFeeAmount,
        description,
      )
      addLine(
        lines,
        input.revenueAccountCode || '4000',
        0,
        platformRevenueAmount,
        `${description} - booking commission`,
        { ...dimensions, vertical_code: 'Stays' },
      )
      addLine(
        lines,
        '2200',
        0,
        taxAmount,
        `${description} - tax payable`,
        dimensions,
      )
      break
    }

    case 'owner_commission_receivable': {
      if (!input.ownerId) {
        throw new Error('An owner must be linked to an owner receivable.')
      }
      if (paymentFeeAmount > 0) {
        throw new Error('A non-cash receivable cannot have a payment fee.')
      }
      const expectedReceivable = money(platformRevenueAmount + taxAmount)
      assertApproximatelyEqual(
        grossAmount,
        expectedReceivable,
        'Receivable amount must equal Navienty revenue + tax.',
      )

      addLine(
        lines,
        '1110',
        grossAmount,
        0,
        `${description} - owner receivable`,
        { ...dimensions, vertical_code: 'Stays' },
      )
      addLine(
        lines,
        input.revenueAccountCode || '4000',
        0,
        platformRevenueAmount,
        `${description} - commission revenue`,
        { ...dimensions, vertical_code: 'Stays' },
      )
      addLine(
        lines,
        '2200',
        0,
        taxAmount,
        `${description} - tax payable`,
        dimensions,
      )
      break
    }

    case 'owner_commission_payment': {
      if (!input.ownerId) {
        throw new Error('An owner must be linked to an owner payment.')
      }
      addInflowCashLines(
        lines,
        input,
        grossAmount,
        paymentFeeAmount,
        description,
      )
      addLine(
        lines,
        '1110',
        0,
        grossAmount,
        `${description} - settle owner receivable`,
        { ...dimensions, vertical_code: 'Stays' },
      )
      break
    }

    case 'service_income': {
      const allocated = money(
        platformRevenueAmount + providerPayableAmount + taxAmount,
      )
      assertApproximatelyEqual(
        grossAmount,
        allocated,
        'Service collection must equal platform revenue + provider payable + tax.',
      )

      addInflowCashLines(
        lines,
        input,
        grossAmount,
        paymentFeeAmount,
        description,
      )
      addLine(
        lines,
        '2020',
        0,
        providerPayableAmount,
        `${description} - provider payable`,
        { ...dimensions, vertical_code: 'Services' },
      )
      addLine(
        lines,
        input.revenueAccountCode || '4800',
        0,
        platformRevenueAmount,
        `${description} - Navienty service revenue`,
        { ...dimensions, vertical_code: 'Services' },
      )
      addLine(
        lines,
        '2200',
        0,
        taxAmount,
        `${description} - tax payable`,
        dimensions,
      )
      break
    }

    case 'managed_subscription':
    case 'elite_ad': {
      const revenueAccountCode =
        input.transactionType === 'managed_subscription' ? '4100' : '4400'
      assertApproximatelyEqual(
        grossAmount,
        money(platformRevenueAmount + taxAmount),
        'Collected amount must equal revenue + tax.',
      )

      addInflowCashLines(
        lines,
        input,
        grossAmount,
        paymentFeeAmount,
        description,
      )
      addLine(
        lines,
        revenueAccountCode,
        0,
        platformRevenueAmount,
        `${description} - revenue`,
        dimensions,
      )
      addLine(
        lines,
        '2200',
        0,
        taxAmount,
        `${description} - tax payable`,
        dimensions,
      )
      break
    }

    case 'start_kit_sale': {
      assertApproximatelyEqual(
        grossAmount,
        money(platformRevenueAmount + taxAmount),
        'Sale collection must equal sales revenue + tax.',
      )

      addInflowCashLines(
        lines,
        input,
        grossAmount,
        paymentFeeAmount,
        description,
      )
      addLine(
        lines,
        '4300',
        0,
        platformRevenueAmount,
        `${description} - product revenue`,
        { ...dimensions, vertical_code: 'Ready' },
      )
      addLine(
        lines,
        '2200',
        0,
        taxAmount,
        `${description} - tax payable`,
        dimensions,
      )
      if (cogsAmount > 0) {
        addLine(
          lines,
          '5200',
          cogsAmount,
          0,
          `${description} - cost of goods sold`,
          { ...dimensions, vertical_code: 'Ready' },
        )
        addLine(
          lines,
          '1250',
          0,
          cogsAmount,
          `${description} - inventory reduction`,
          { ...dimensions, vertical_code: 'Ready' },
        )
      }
      break
    }

    case 'expense': {
      const expenseAccountCode = input.expenseAccountCode || '6900'
      addLine(
        lines,
        expenseAccountCode,
        grossAmount,
        0,
        `${description} - expense`,
        dimensions,
      )
      addOutflowCashLine(
        lines,
        input,
        grossAmount,
        paymentFeeAmount,
        description,
      )
      break
    }

    case 'funding': {
      addInflowCashLines(
        lines,
        input,
        grossAmount,
        paymentFeeAmount,
        description,
      )
      addLine(
        lines,
        input.fundingAccountCode || '3000',
        0,
        grossAmount,
        `${description} - equity funding`,
        { ...dimensions, vertical_code: 'Corporate' },
      )
      break
    }

    case 'refund': {
      const actualRefund = refundAmount > 0 ? refundAmount : grossAmount
      assertApproximatelyEqual(
        grossAmount,
        actualRefund,
        'Gross amount and refund amount must match.',
      )
      addLine(
        lines,
        '5400',
        actualRefund,
        0,
        `${description} - refund/loss`,
        { ...dimensions, vertical_code: 'Stays' },
      )
      addOutflowCashLine(
        lines,
        input,
        actualRefund,
        paymentFeeAmount,
        description,
      )
      break
    }

    case 'owner_payout': {
      if (!input.ownerId) {
        throw new Error('An owner must be linked to an owner payout.')
      }
      addLine(
        lines,
        '2010',
        grossAmount,
        0,
        `${description} - reduce owner payable`,
        { ...dimensions, vertical_code: 'Stays' },
      )
      addOutflowCashLine(
        lines,
        input,
        grossAmount,
        paymentFeeAmount,
        description,
      )
      break
    }

    case 'provider_payout': {
      addLine(
        lines,
        '2020',
        grossAmount,
        0,
        `${description} - reduce provider payable`,
        { ...dimensions, vertical_code: 'Services' },
      )
      addOutflowCashLine(
        lines,
        input,
        grossAmount,
        paymentFeeAmount,
        description,
      )
      break
    }

    case 'opening_balance': {
      if (paymentFeeAmount > 0) {
        throw new Error('Opening balance cannot include a payment fee.')
      }
      addLine(
        lines,
        input.cashAccountCode,
        grossAmount,
        0,
        `${description} - opening cash`,
        { ...dimensions, vertical_code: 'Corporate' },
      )
      addLine(
        lines,
        input.fundingAccountCode || '3000',
        0,
        grossAmount,
        `${description} - opening equity`,
        { ...dimensions, vertical_code: 'Corporate' },
      )
      break
    }

    case 'bank_transfer': {
      if (!input.destinationCashAccountCode) {
        throw new Error('A destination cash account is required for transfers.')
      }
      if (input.destinationCashAccountCode === input.cashAccountCode) {
        throw new Error('Source and destination accounts must be different.')
      }
      const netDestination = money(grossAmount - paymentFeeAmount)
      if (netDestination < 0) {
        throw new Error('Payment fee cannot exceed the transfer amount.')
      }
      addLine(
        lines,
        input.destinationCashAccountCode,
        netDestination,
        0,
        `${description} - destination account`,
        dimensions,
      )
      if (paymentFeeAmount > 0) {
        addLine(
          lines,
          '5300',
          paymentFeeAmount,
          0,
          `${description} - transfer fee`,
          { ...dimensions, vertical_code: 'Payments' },
        )
      }
      addLine(
        lines,
        input.cashAccountCode,
        0,
        grossAmount,
        `${description} - source account`,
        dimensions,
      )
      break
    }

    default: {
      const neverType: never = input.transactionType
      throw new Error(`Unsupported manual transaction type: ${neverType}`)
    }
  }

  const totalDebit = money(
    lines.reduce((sum, line) => sum + line.debit_amount, 0),
  )
  const totalCredit = money(
    lines.reduce((sum, line) => sum + line.credit_amount, 0),
  )

  assertApproximatelyEqual(
    totalDebit,
    totalCredit,
    `Generated entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}.`,
  )

  if (lines.length < 2) {
    throw new Error('The transaction did not generate enough journal lines.')
  }

  const transaction: ManualTransactionRpcPayload = {
    transaction_type: input.transactionType,
    direction,
    transaction_date: input.transactionDate,
    payment_method: input.paymentMethod,
    currency: 'EGP',
    bank_account_id: input.bankAccountId || null,
    destination_bank_account_id: input.destinationBankAccountId || null,
    reservation_id: input.reservationId || null,
    property_id: input.propertyId || null,
    owner_id: input.ownerId || null,
    broker_id: input.brokerId || null,
    user_id: input.userId || null,
    service_order_id: input.serviceOrderId || null,
    gross_amount: grossAmount,
    platform_revenue_amount: platformRevenueAmount,
    owner_payable_amount: ownerPayableAmount,
    provider_payable_amount: providerPayableAmount,
    payment_fee_amount: paymentFeeAmount,
    tax_amount: taxAmount,
    cogs_amount: cogsAmount,
    receivable_amount:
      input.transactionType === 'owner_commission_receivable'
        ? grossAmount
        : receivableAmount,
    refund_amount:
      input.transactionType === 'refund'
        ? refundAmount || grossAmount
        : refundAmount,
    external_reference: input.externalReference || null,
    payer_name: input.payerName || null,
    payer_phone: input.payerPhone || null,
    payee_name: input.payeeName || null,
    payee_phone: input.payeePhone || null,
    receipt_url: input.receiptUrl || null,
    description,
    notes: input.notes || null,
    idempotency_key: input.idempotencyKey,
    metadata: input.metadata || {},
  }

  return { transaction, lines }
}

export function getDefaultCashAccountCode(
  paymentMethod: ManualTransactionInput['paymentMethod'],
): string {
  switch (paymentMethod) {
    case 'cash':
      return '1000'
    case 'instapay':
      return '1020'
    case 'vodafone_cash':
    case 'orange_cash':
    case 'etisalat_cash':
      return '1030'
    case 'card':
    case 'payment_gateway':
      return '1040'
    default:
      return '1010'
  }
}
