import { NextRequest, NextResponse } from 'next/server'

import { buildManualPosting } from '@/src/lib/finance/manual-posting'
import {
  canApproveFinanceTransactions,
  getFinanceAdminContext,
} from '@/src/lib/finance/server'
import {
  MANUAL_PAYMENT_METHODS,
  MANUAL_TRANSACTION_TYPES,
  type ManualTransactionInput,
  type ManualTransactionType,
} from '@/src/lib/finance/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function optionalUuid(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  const text = String(value).trim()
  if (!UUID_PATTERN.test(text)) {
    throw new Error(`Invalid UUID: ${text}`)
  }
  return text
}

function optionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text || null
}

function numberValue(value: unknown, fieldName: string): number {
  if (value === null || value === undefined || value === '') return 0
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative number.`)
  }
  return parsed
}

function parseManualInput(body: Record<string, unknown>): ManualTransactionInput {
  const transactionType = String(body.transactionType || '') as ManualTransactionType
  if (!MANUAL_TRANSACTION_TYPES.includes(transactionType)) {
    throw new Error('Unsupported transaction type.')
  }

  const paymentMethod = String(body.paymentMethod || '')
  if (
    !MANUAL_PAYMENT_METHODS.includes(
      paymentMethod as (typeof MANUAL_PAYMENT_METHODS)[number],
    )
  ) {
    throw new Error('Unsupported payment method.')
  }

  const transactionDate = String(body.transactionDate || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
    throw new Error('Transaction date must use YYYY-MM-DD.')
  }

  const description = String(body.description || '').trim()
  if (!description) {
    throw new Error('Description is required.')
  }

  const cashAccountCode = String(body.cashAccountCode || '').trim()
  if (!/^\d{4}$/.test(cashAccountCode)) {
    throw new Error('A valid cash account code is required.')
  }

  const idempotencyKey = String(body.idempotencyKey || '').trim()
  if (!idempotencyKey || idempotencyKey.length > 200) {
    throw new Error('A valid idempotency key is required.')
  }

  const serviceOrderIdRaw = body.serviceOrderId
  let serviceOrderId: number | null = null
  if (serviceOrderIdRaw !== null && serviceOrderIdRaw !== undefined && serviceOrderIdRaw !== '') {
    const parsed = Number(serviceOrderIdRaw)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error('Service order ID must be a positive integer.')
    }
    serviceOrderId = parsed
  }

  const postNow = body.postNow !== false

  return {
    transactionType,
    transactionDate,
    paymentMethod: paymentMethod as ManualTransactionInput['paymentMethod'],
    cashAccountCode,
    destinationCashAccountCode: optionalText(body.destinationCashAccountCode) || undefined,
    grossAmount: numberValue(body.grossAmount, 'Gross amount'),
    platformRevenueAmount: numberValue(
      body.platformRevenueAmount,
      'Platform revenue amount',
    ),
    ownerPayableAmount: numberValue(body.ownerPayableAmount, 'Owner payable amount'),
    providerPayableAmount: numberValue(
      body.providerPayableAmount,
      'Provider payable amount',
    ),
    paymentFeeAmount: numberValue(body.paymentFeeAmount, 'Payment fee amount'),
    taxAmount: numberValue(body.taxAmount, 'Tax amount'),
    cogsAmount: numberValue(body.cogsAmount, 'COGS amount'),
    receivableAmount: numberValue(body.receivableAmount, 'Receivable amount'),
    refundAmount: numberValue(body.refundAmount, 'Refund amount'),
    revenueAccountCode: optionalText(body.revenueAccountCode) || undefined,
    expenseAccountCode: optionalText(body.expenseAccountCode) || undefined,
    fundingAccountCode:
      body.fundingAccountCode === '3100' ? '3100' : '3000',
    reservationId: optionalUuid(body.reservationId),
    propertyId: optionalUuid(body.propertyId),
    ownerId: optionalUuid(body.ownerId),
    brokerId: optionalUuid(body.brokerId),
    userId: optionalUuid(body.userId),
    serviceOrderId,
    bankAccountId: optionalUuid(body.bankAccountId),
    destinationBankAccountId: optionalUuid(body.destinationBankAccountId),
    externalReference: optionalText(body.externalReference),
    payerName: optionalText(body.payerName),
    payerPhone: optionalText(body.payerPhone),
    payeeName: optionalText(body.payeeName),
    payeePhone: optionalText(body.payeePhone),
    receiptUrl: optionalText(body.receiptUrl),
    description,
    notes: optionalText(body.notes),
    idempotencyKey,
    postNow,
    metadata:
      typeof body.metadata === 'object' && body.metadata !== null
        ? (body.metadata as Record<string, unknown>)
        : {},
  }
}


async function enrichManualInputFromDatabase(
  context: NonNullable<Awaited<ReturnType<typeof getFinanceAdminContext>>>,
  input: ManualTransactionInput,
): Promise<ManualTransactionInput> {
  let propertyId = input.propertyId || null
  let ownerId = input.ownerId || null
  let brokerId = input.brokerId || null
  let userId = input.userId || null

  if (input.reservationId) {
    const { data: reservation, error: reservationError } = await context.adminClient
      .from('property_reservations')
      .select('id, property_id, user_id')
      .eq('id', input.reservationId)
      .maybeSingle()

    if (reservationError) {
      throw new Error(`Failed to validate reservation: ${reservationError.message}`)
    }
    if (!reservation) {
      throw new Error('The linked reservation was not found.')
    }
    if (propertyId && propertyId !== reservation.property_id) {
      throw new Error('The selected property does not belong to the linked reservation.')
    }

    propertyId = reservation.property_id
    userId = reservation.user_id || userId
  }

  if (propertyId) {
    const { data: property, error: propertyError } = await context.adminClient
      .from('properties')
      .select('id, owner_id, broker_id')
      .eq('id', propertyId)
      .maybeSingle()

    if (propertyError) {
      throw new Error(`Failed to validate property: ${propertyError.message}`)
    }
    if (!property) {
      throw new Error('The linked property was not found.')
    }
    if (ownerId && ownerId !== property.owner_id) {
      throw new Error('The selected owner does not match the linked property.')
    }
    if (brokerId && brokerId !== property.broker_id) {
      throw new Error('The selected broker does not match the linked property.')
    }

    ownerId = property.owner_id
    brokerId = property.broker_id
  }

  return {
    ...input,
    propertyId,
    ownerId,
    brokerId,
    userId,
  }
}

export async function GET(request: NextRequest) {
  try {
    const context = await getFinanceAdminContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')?.trim()
    const type = searchParams.get('type')?.trim()
    const reservationId = searchParams.get('reservationId')?.trim()
    const limitParam = Number(searchParams.get('limit') || 100)
    const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 100, 1), 300)

    let query = context.adminClient
      .from('finance_manual_transactions_v')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) query = query.eq('status', status)
    if (type) query = query.eq('transaction_type', type)
    if (reservationId) query = query.eq('reservation_id', reservationId)

    const { data, error } = await query
    if (error) {
      return NextResponse.json(
        { error: `Failed to load transactions: ${error.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      transactions: data || [],
      admin: {
        id: context.admin.id,
        fullName: context.admin.full_name,
        role: context.admin.role,
        canApprove: canApproveFinanceTransactions(context.admin.role),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getFinanceAdminContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawBody = (await request.json()) as Record<string, unknown>
    const parsedInput = parseManualInput(rawBody)
    const input = await enrichManualInputFromDatabase(context, parsedInput)
    const posting = buildManualPosting(input)

    const { data, error } = await context.adminClient.rpc(
      'finance_create_manual_transaction',
      {
        p_transaction: posting.transaction,
        p_lines: posting.lines,
        p_created_by_admin_id: context.admin.id,
        p_post_now: input.postNow !== false,
      },
    )

    if (error) {
      return NextResponse.json(
        { error: `Failed to create transaction: ${error.message}` },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        result: data,
        generatedLines: posting.lines,
      },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
