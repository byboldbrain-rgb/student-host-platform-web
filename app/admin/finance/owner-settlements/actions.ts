'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  requirePropertyBookingRequestsAccess,
  isSuperAdmin,
} from '@/src/lib/admin-auth'

type SettlementStatus = 'draft' | 'approved' | 'paid' | 'cancelled'

type OwnerPayoutAccount = {
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
}

type SettlementMetadata = {
  payables_count?: number
  owner_id?: string
  owner_payout_account_id?: string
  owner_payout_method?: string
  owner_payout_details_snapshot?: Record<string, any>
  [key: string]: any
}

function parseRequiredString(value: FormDataEntryValue | null, label: string) {
  const parsed = String(value || '').trim()

  if (!parsed) {
    throw new Error(`${label} is required`)
  }

  return parsed
}

function parseOptionalString(value: FormDataEntryValue | null) {
  const parsed = String(value || '').trim()
  return parsed || null
}

function roundMoney(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

async function getAuthorizedFinanceContext() {
  const adminContext = await requirePropertyBookingRequestsAccess()
  const supabase = createAdminClient()
  const admin = adminContext.admin

  return {
    supabase,
    admin,
  }
}

async function assertBrokerAccess(params: {
  admin: any
  brokerId: string
}) {
  const { admin, brokerId } = params

  if (isSuperAdmin(admin)) return

  if (!admin.broker_id) {
    throw new Error('Editor account is missing broker assignment')
  }

  if (admin.broker_id !== brokerId) {
    throw new Error('You are not allowed to manage this broker finance records')
  }
}

async function assertOwnerAccess(params: {
  supabase: ReturnType<typeof createAdminClient>
  admin: any
  ownerId: string
  brokerId: string
}) {
  const { supabase, admin, ownerId, brokerId } = params

  await assertBrokerAccess({
    admin,
    brokerId,
  })

  const { data: owner, error } = await supabase
    .from('property_owners')
    .select('id, full_name, phone_number, whatsapp_number, email, is_active')
    .eq('id', ownerId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!owner) {
    throw new Error('Owner not found')
  }

  const { data: ownerPropertyLink, error: ownerPropertyLinkError } =
    await supabase
      .from('owner_properties')
      .select('id')
      .eq('owner_id', ownerId)
      .eq('broker_id', brokerId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

  if (ownerPropertyLinkError) {
    throw new Error(ownerPropertyLinkError.message)
  }

  if (ownerPropertyLink) {
    return {
      ...owner,
      broker_id: brokerId,
    } as {
      id: string
      broker_id: string
      full_name: string
      phone_number: string | null
      whatsapp_number: string | null
      email: string | null
      is_active: boolean
    }
  }

  const { data: directProperty, error: directPropertyError } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('broker_id', brokerId)
    .limit(1)
    .maybeSingle()

  if (directPropertyError) {
    throw new Error(directPropertyError.message)
  }

  if (!directProperty) {
    throw new Error('You are not allowed to manage this owner for this broker')
  }

  return {
    ...owner,
    broker_id: brokerId,
  } as {
    id: string
    broker_id: string
    full_name: string
    phone_number: string | null
    whatsapp_number: string | null
    email: string | null
    is_active: boolean
  }
}

async function getDefaultOwnerPayoutAccount(params: {
  supabase: ReturnType<typeof createAdminClient>
  ownerId: string
  brokerId: string
}) {
  const { supabase, ownerId, brokerId } = params

  const { data: payoutAccount, error } = await supabase
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
    .eq('owner_id', ownerId)
    .eq('broker_id', brokerId)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (payoutAccount || null) as OwnerPayoutAccount | null
}

function assertPayoutAccountHasRequiredDetails(payoutAccount: OwnerPayoutAccount) {
  const method = payoutAccount.payout_method

  if (method === 'bank_transfer') {
    if (!payoutAccount.account_holder_name?.trim()) {
      throw new Error('Owner bank payout account holder name is missing')
    }

    if (!payoutAccount.bank_name?.trim()) {
      throw new Error('Owner bank name is missing')
    }

    if (
      !payoutAccount.bank_account_number?.trim() &&
      !payoutAccount.iban?.trim()
    ) {
      throw new Error('Owner bank account number or IBAN is missing')
    }

    return
  }

  if (method === 'instapay') {
    if (!payoutAccount.instapay_handle?.trim()) {
      throw new Error('Owner Instapay handle is missing')
    }

    return
  }

  if (
    method === 'vodafone_cash' ||
    method === 'orange_cash' ||
    method === 'etisalat_cash'
  ) {
    if (!payoutAccount.wallet_number?.trim()) {
      throw new Error('Owner wallet number is missing')
    }

    return
  }

  if (method === 'cash') {
    return
  }

  throw new Error('Owner payout method is not supported')
}

async function getAuthorizedSettlement(params: {
  supabase: ReturnType<typeof createAdminClient>
  admin: any
  settlementId: string
}) {
  const { supabase, admin, settlementId } = params

  const { data: settlement, error } = await supabase
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
      notes,
      metadata
    `)
    .eq('id', settlementId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!settlement) {
    throw new Error('Settlement not found')
  }

  await assertBrokerAccess({
    admin,
    brokerId: settlement.broker_id,
  })

  return settlement as {
    id: string
    settlement_number: string
    owner_id: string
    broker_id: string
    status: SettlementStatus
    gross_rent_collected: number
    service_fee_amount: number
    payment_fee_amount: number
    tax_amount: number
    adjustment_amount: number
    net_payout_amount: number
    currency: string
    period_start: string | null
    period_end: string | null
    notes: string | null
    metadata: SettlementMetadata | null
  }
}

async function createLedgerEntry(params: {
  supabase: ReturnType<typeof createAdminClient>
  adminUserId: string
  brokerId: string
  ownerId: string
  settlementId: string
  invoiceId?: string | null
  entryType:
    | 'owner_payout'
    | 'service_fee_revenue'
    | 'payment_fee_revenue'
    | 'tax_payable'
    | 'adjustment'
  direction: 'debit' | 'credit'
  amount: number
  currency: string
  description: string
}) {
  const {
    supabase,
    adminUserId,
    brokerId,
    ownerId,
    settlementId,
    invoiceId = null,
    entryType,
    direction,
    amount,
    currency,
    description,
  } = params

  if (!Number.isFinite(amount) || amount <= 0) return

  const { error } = await supabase.from('accounting_ledger_entries').insert({
    entry_type: entryType,
    direction,
    amount: roundMoney(amount),
    currency,
    broker_id: brokerId,
    owner_id: ownerId,
    settlement_id: settlementId,
    invoice_id: invoiceId,
    reference_table: invoiceId ? 'platform_fee_invoices' : 'owner_settlements',
    reference_id: invoiceId || settlementId,
    description,
    created_by_admin_id: adminUserId,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function createOwnerSettlementAction(formData: FormData) {
  const ownerId = parseRequiredString(formData.get('owner_id'), 'Owner id')
  const brokerId = parseRequiredString(formData.get('broker_id'), 'Broker id')
  const notes = parseOptionalString(formData.get('notes'))

  const { supabase, admin } = await getAuthorizedFinanceContext()

  const owner = await assertOwnerAccess({
    supabase,
    admin,
    ownerId,
    brokerId,
  })

  const { data: payablesData, error: payablesError } = await supabase
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
      created_at
    `)
    .eq('owner_id', owner.id)
    .eq('broker_id', brokerId)
    .eq('status', 'unsettled')
    .order('created_at', { ascending: true })

  if (payablesError) {
    throw new Error(payablesError.message)
  }

  const payables = (payablesData || []) as any[]

  if (payables.length === 0) {
    throw new Error('No unsettled owner payables found for this owner')
  }

  const currency = payables[0]?.currency || 'EGP'

  const grossRentCollected = roundMoney(
    payables.reduce((sum, row) => sum + Number(row.gross_rent_amount || 0), 0)
  )
  const serviceFeeAmount = roundMoney(
    payables.reduce((sum, row) => sum + Number(row.service_fee_amount || 0), 0)
  )
  const paymentFeeAmount = roundMoney(
    payables.reduce((sum, row) => sum + Number(row.payment_fee_amount || 0), 0)
  )
  const taxAmount = roundMoney(
    payables.reduce((sum, row) => sum + Number(row.tax_amount || 0), 0)
  )
  const adjustmentAmount = roundMoney(
    payables.reduce((sum, row) => sum + Number(row.adjustment_amount || 0), 0)
  )
  const netPayoutAmount = roundMoney(
    payables.reduce((sum, row) => sum + Number(row.net_payable_amount || 0), 0)
  )

  const createdDates = payables
    .map((row) => String(row.created_at || '').slice(0, 10))
    .filter(Boolean)

  const periodStart = createdDates.length > 0 ? createdDates[0] : null
  const periodEnd =
    createdDates.length > 0 ? createdDates[createdDates.length - 1] : null

  const { data: settlement, error: settlementError } = await supabase
    .from('owner_settlements')
    .insert({
      owner_id: owner.id,
      broker_id: brokerId,
      status: 'draft',
      gross_rent_collected: grossRentCollected,
      service_fee_amount: serviceFeeAmount,
      payment_fee_amount: paymentFeeAmount,
      tax_amount: taxAmount,
      adjustment_amount: adjustmentAmount,
      net_payout_amount: netPayoutAmount,
      currency,
      period_start: periodStart,
      period_end: periodEnd,
      notes,
      created_by_admin_id: admin.id,
      metadata: {
        owner_id: owner.id,
        owner_name: owner.full_name,
        broker_id: brokerId,
        payables_count: payables.length,
      },
    })
    .select('id')
    .single()

  if (settlementError || !settlement) {
    throw new Error(settlementError?.message || 'Failed to create settlement')
  }

  const settlementItems = payables.flatMap((payable) => {
    const items: any[] = [
      {
        settlement_id: settlement.id,
        owner_payable_id: payable.id,
        reservation_id: payable.reservation_id,
        billing_cycle_id: payable.billing_cycle_id,
        item_type: 'rent_collection',
        description: `Rent collection - ${payable.source_type}`,
        gross_amount: Number(payable.gross_rent_amount || 0),
        deduction_amount: 0,
        net_amount: Number(payable.gross_rent_amount || 0),
        metadata: {
          owner_id: payable.owner_id,
          broker_id: payable.broker_id,
          property_id: payable.property_id,
          source_type: payable.source_type,
        },
      },
    ]

    if (Number(payable.service_fee_amount || 0) > 0) {
      items.push({
        settlement_id: settlement.id,
        owner_payable_id: payable.id,
        reservation_id: payable.reservation_id,
        billing_cycle_id: payable.billing_cycle_id,
        item_type: 'service_fee',
        description: 'Platform service fee',
        gross_amount: 0,
        deduction_amount: Number(payable.service_fee_amount || 0),
        net_amount: -Number(payable.service_fee_amount || 0),
        metadata: {
          owner_id: payable.owner_id,
          broker_id: payable.broker_id,
          property_id: payable.property_id,
        },
      })
    }

    if (Number(payable.payment_fee_amount || 0) > 0) {
      items.push({
        settlement_id: settlement.id,
        owner_payable_id: payable.id,
        reservation_id: payable.reservation_id,
        billing_cycle_id: payable.billing_cycle_id,
        item_type: 'payment_fee',
        description: 'Payment processing fee',
        gross_amount: 0,
        deduction_amount: Number(payable.payment_fee_amount || 0),
        net_amount: -Number(payable.payment_fee_amount || 0),
        metadata: {
          owner_id: payable.owner_id,
          broker_id: payable.broker_id,
          property_id: payable.property_id,
        },
      })
    }

    if (Number(payable.tax_amount || 0) > 0) {
      items.push({
        settlement_id: settlement.id,
        owner_payable_id: payable.id,
        reservation_id: payable.reservation_id,
        billing_cycle_id: payable.billing_cycle_id,
        item_type: 'tax',
        description: 'Tax on platform fees',
        gross_amount: 0,
        deduction_amount: Number(payable.tax_amount || 0),
        net_amount: -Number(payable.tax_amount || 0),
        metadata: {
          owner_id: payable.owner_id,
          broker_id: payable.broker_id,
          property_id: payable.property_id,
        },
      })
    }

    if (Number(payable.adjustment_amount || 0) !== 0) {
      items.push({
        settlement_id: settlement.id,
        owner_payable_id: payable.id,
        reservation_id: payable.reservation_id,
        billing_cycle_id: payable.billing_cycle_id,
        item_type: 'adjustment',
        description: 'Manual adjustment',
        gross_amount: 0,
        deduction_amount: 0,
        net_amount: Number(payable.adjustment_amount || 0),
        metadata: {
          owner_id: payable.owner_id,
          broker_id: payable.broker_id,
          property_id: payable.property_id,
        },
      })
    }

    return items
  })

  const { error: itemsError } = await supabase
    .from('owner_settlement_items')
    .insert(settlementItems)

  if (itemsError) {
    throw new Error(itemsError.message)
  }

  const payableIds = payables.map((payable) => payable.id)

  const { error: updatePayablesError } = await supabase
    .from('owner_payables')
    .update({
      status: 'settlement_draft',
      settlement_id: settlement.id,
      updated_at: new Date().toISOString(),
    })
    .in('id', payableIds)

  if (updatePayablesError) {
    throw new Error(updatePayablesError.message)
  }

  await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.id,
    action_type: 'owner_settlement_created',
    target_table: 'owner_settlements',
    target_id: settlement.id,
    details: {
      owner_id: owner.id,
      owner_name: owner.full_name,
      broker_id: brokerId,
      payables_count: payables.length,
      owner_payable_ids: payableIds,
      gross_rent_collected: grossRentCollected,
      service_fee_amount: serviceFeeAmount,
      payment_fee_amount: paymentFeeAmount,
      tax_amount: taxAmount,
      net_payout_amount: netPayoutAmount,
      currency,
    },
  })

  revalidatePath('/admin/finance/owner-settlements')
}

export async function approveOwnerSettlementAction(formData: FormData) {
  const settlementId = parseRequiredString(
    formData.get('settlement_id'),
    'Settlement id'
  )

  const { supabase, admin } = await getAuthorizedFinanceContext()

  const settlement = await getAuthorizedSettlement({
    supabase,
    admin,
    settlementId,
  })

  if (settlement.status !== 'draft') {
    throw new Error('Only draft settlements can be approved')
  }

  const { error: approveError } = await supabase
    .from('owner_settlements')
    .update({
      status: 'approved',
      approved_by_admin_id: admin.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', settlement.id)

  if (approveError) {
    throw new Error(approveError.message)
  }

  const subtotalAmount = roundMoney(
    Number(settlement.service_fee_amount || 0) +
      Number(settlement.payment_fee_amount || 0)
  )
  const taxAmount = roundMoney(Number(settlement.tax_amount || 0))
  const totalAmount = roundMoney(subtotalAmount + taxAmount)

  let invoiceId: string | null = null

  if (subtotalAmount > 0 || taxAmount > 0) {
    const { data: existingInvoice, error: existingInvoiceError } = await supabase
      .from('platform_fee_invoices')
      .select('id')
      .eq('settlement_id', settlement.id)
      .limit(1)
      .maybeSingle()

    if (existingInvoiceError) {
      throw new Error(existingInvoiceError.message)
    }

    if (existingInvoice) {
      invoiceId = existingInvoice.id
    } else {
      const { data: invoice, error: invoiceError } = await supabase
        .from('platform_fee_invoices')
        .insert({
          owner_id: settlement.owner_id,
          broker_id: settlement.broker_id,
          settlement_id: settlement.id,
          status: 'issued',
          service_fee_amount: roundMoney(Number(settlement.service_fee_amount || 0)),
          payment_fee_amount: roundMoney(Number(settlement.payment_fee_amount || 0)),
          subtotal_amount: subtotalAmount,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          tax_rate:
            subtotalAmount > 0
              ? roundMoney((taxAmount / subtotalAmount) * 100)
              : 0,
          currency: settlement.currency || 'EGP',
          issued_at: new Date().toISOString(),
          eta_submission_status: 'not_submitted',
          created_by_admin_id: admin.id,
          notes: `Platform fee invoice for settlement ${settlement.settlement_number}`,
          metadata: {
            owner_id: settlement.owner_id,
            broker_id: settlement.broker_id,
            settlement_number: settlement.settlement_number,
          },
        })
        .select('id')
        .single()

      if (invoiceError || !invoice) {
        throw new Error(invoiceError?.message || 'Failed to create platform fee invoice')
      }

      invoiceId = invoice.id

      const invoiceItems: any[] = []

      if (Number(settlement.service_fee_amount || 0) > 0) {
        invoiceItems.push({
          invoice_id: invoiceId,
          item_type: 'service_fee',
          description: 'Platform service fee',
          quantity: 1,
          unit_amount: roundMoney(Number(settlement.service_fee_amount || 0)),
          subtotal_amount: roundMoney(Number(settlement.service_fee_amount || 0)),
          tax_amount: 0,
          total_amount: roundMoney(Number(settlement.service_fee_amount || 0)),
        })
      }

      if (Number(settlement.payment_fee_amount || 0) > 0) {
        invoiceItems.push({
          invoice_id: invoiceId,
          item_type: 'payment_fee',
          description: 'Payment processing fee',
          quantity: 1,
          unit_amount: roundMoney(Number(settlement.payment_fee_amount || 0)),
          subtotal_amount: roundMoney(Number(settlement.payment_fee_amount || 0)),
          tax_amount: 0,
          total_amount: roundMoney(Number(settlement.payment_fee_amount || 0)),
        })
      }

      if (taxAmount > 0) {
        invoiceItems.push({
          invoice_id: invoiceId,
          item_type: 'tax',
          description: 'Tax on platform fees',
          quantity: 1,
          unit_amount: taxAmount,
          subtotal_amount: 0,
          tax_amount: taxAmount,
          total_amount: taxAmount,
        })
      }

      if (invoiceItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('platform_fee_invoice_items')
          .insert(invoiceItems)

        if (itemsError) {
          throw new Error(itemsError.message)
        }
      }
    }

    await createLedgerEntry({
      supabase,
      adminUserId: admin.id,
      brokerId: settlement.broker_id,
      ownerId: settlement.owner_id,
      settlementId: settlement.id,
      invoiceId,
      entryType: 'service_fee_revenue',
      direction: 'credit',
      amount: Number(settlement.service_fee_amount || 0),
      currency: settlement.currency,
      description: `Service fee revenue from settlement ${settlement.settlement_number}`,
    })

    await createLedgerEntry({
      supabase,
      adminUserId: admin.id,
      brokerId: settlement.broker_id,
      ownerId: settlement.owner_id,
      settlementId: settlement.id,
      invoiceId,
      entryType: 'payment_fee_revenue',
      direction: 'credit',
      amount: Number(settlement.payment_fee_amount || 0),
      currency: settlement.currency,
      description: `Payment fee revenue from settlement ${settlement.settlement_number}`,
    })

    await createLedgerEntry({
      supabase,
      adminUserId: admin.id,
      brokerId: settlement.broker_id,
      ownerId: settlement.owner_id,
      settlementId: settlement.id,
      invoiceId,
      entryType: 'tax_payable',
      direction: 'credit',
      amount: Number(settlement.tax_amount || 0),
      currency: settlement.currency,
      description: `Tax payable from settlement ${settlement.settlement_number}`,
    })
  }

  await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.id,
    action_type: 'owner_settlement_approved',
    target_table: 'owner_settlements',
    target_id: settlement.id,
    details: {
      owner_id: settlement.owner_id,
      broker_id: settlement.broker_id,
      invoice_id: invoiceId,
      settlement_number: settlement.settlement_number,
      net_payout_amount: settlement.net_payout_amount,
      currency: settlement.currency,
    },
  })

  revalidatePath('/admin/finance/owner-settlements')
}

export async function markOwnerSettlementPaidAction(formData: FormData) {
  const settlementId = parseRequiredString(
    formData.get('settlement_id'),
    'Settlement id'
  )
  const payoutMethod = parseRequiredString(
    formData.get('payout_method'),
    'Payout method'
  )
  const payoutReference = parseRequiredString(
    formData.get('payout_reference'),
    'Payout reference'
  )
  const payoutReceiptUrl = parseOptionalString(formData.get('payout_receipt_url'))

  const { supabase, admin } = await getAuthorizedFinanceContext()

  const settlement = await getAuthorizedSettlement({
    supabase,
    admin,
    settlementId,
  })

  if (settlement.status !== 'approved') {
    throw new Error('Only approved settlements can be marked as paid')
  }

  const payoutAccount = await getDefaultOwnerPayoutAccount({
    supabase,
    ownerId: settlement.owner_id,
    brokerId: settlement.broker_id,
  })

  if (!payoutAccount) {
    throw new Error(
      'Owner payout details are missing. Add active payout details before marking this settlement as paid.'
    )
  }

  assertPayoutAccountHasRequiredDetails(payoutAccount)

  if (payoutMethod !== payoutAccount.payout_method) {
    throw new Error(
      `Selected payout method does not match owner default payout method: ${payoutAccount.payout_method}`
    )
  }

  const payoutAccountSnapshot = {
    id: payoutAccount.id,
    owner_id: payoutAccount.owner_id,
    broker_id: payoutAccount.broker_id,
    payout_method: payoutAccount.payout_method,
    account_holder_name: payoutAccount.account_holder_name,
    phone_number: payoutAccount.phone_number,
    bank_name: payoutAccount.bank_name,
    bank_account_number: payoutAccount.bank_account_number,
    iban: payoutAccount.iban,
    wallet_number: payoutAccount.wallet_number,
    instapay_handle: payoutAccount.instapay_handle,
    is_default: payoutAccount.is_default,
    is_active: payoutAccount.is_active,
    notes: payoutAccount.notes || null,
    captured_at: new Date().toISOString(),
  }

  const nextMetadata: SettlementMetadata = {
    ...(settlement.metadata || {}),
    owner_id: settlement.owner_id,
    broker_id: settlement.broker_id,
    owner_payout_account_id: payoutAccount.id,
    owner_payout_method: payoutAccount.payout_method,
    owner_payout_details_snapshot: payoutAccountSnapshot,
  }

  const { error: updateSettlementError } = await supabase
    .from('owner_settlements')
    .update({
      status: 'paid',
      paid_by_admin_id: admin.id,
      paid_at: new Date().toISOString(),
      payout_method: payoutMethod,
      payout_reference: payoutReference,
      payout_receipt_url: payoutReceiptUrl,
      payout_account_id: payoutAccount.id,
      payout_account_snapshot: payoutAccountSnapshot,
      metadata: nextMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', settlement.id)

  if (updateSettlementError) {
    throw new Error(updateSettlementError.message)
  }

  const { error: updatePayablesError } = await supabase
    .from('owner_payables')
    .update({
      status: 'settled',
      updated_at: new Date().toISOString(),
    })
    .eq('settlement_id', settlement.id)
    .eq('owner_id', settlement.owner_id)
    .eq('broker_id', settlement.broker_id)
    .eq('status', 'settlement_draft')

  if (updatePayablesError) {
    throw new Error(updatePayablesError.message)
  }

  await createLedgerEntry({
    supabase,
    adminUserId: admin.id,
    brokerId: settlement.broker_id,
    ownerId: settlement.owner_id,
    settlementId: settlement.id,
    entryType: 'owner_payout',
    direction: 'debit',
    amount: Number(settlement.net_payout_amount || 0),
    currency: settlement.currency,
    description: `Owner payout paid for settlement ${settlement.settlement_number}`,
  })

  await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.id,
    action_type: 'owner_settlement_paid',
    target_table: 'owner_settlements',
    target_id: settlement.id,
    details: {
      owner_id: settlement.owner_id,
      broker_id: settlement.broker_id,
      settlement_number: settlement.settlement_number,
      net_payout_amount: settlement.net_payout_amount,
      currency: settlement.currency,
      payout_method: payoutMethod,
      payout_reference: payoutReference,
      payout_receipt_url: payoutReceiptUrl,
      owner_payout_account_id: payoutAccount.id,
      owner_payout_details_snapshot: payoutAccountSnapshot,
    },
  })

  revalidatePath('/admin/finance/owner-settlements')
}

export async function cancelOwnerSettlementAction(formData: FormData) {
  const settlementId = parseRequiredString(
    formData.get('settlement_id'),
    'Settlement id'
  )
  const cancelReason = parseOptionalString(formData.get('cancel_reason'))

  const { supabase, admin } = await getAuthorizedFinanceContext()

  const settlement = await getAuthorizedSettlement({
    supabase,
    admin,
    settlementId,
  })

  if (settlement.status !== 'draft') {
    throw new Error('Only draft settlements can be cancelled')
  }

  const { error: resetPayablesError } = await supabase
    .from('owner_payables')
    .update({
      status: 'unsettled',
      settlement_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('settlement_id', settlement.id)
    .eq('owner_id', settlement.owner_id)
    .eq('broker_id', settlement.broker_id)
    .eq('status', 'settlement_draft')

  if (resetPayablesError) {
    throw new Error(resetPayablesError.message)
  }

  const { error: updateSettlementError } = await supabase
    .from('owner_settlements')
    .update({
      status: 'cancelled',
      notes: cancelReason
        ? `${settlement.notes || ''}\n\nCancellation note: ${cancelReason}`.trim()
        : settlement.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', settlement.id)

  if (updateSettlementError) {
    throw new Error(updateSettlementError.message)
  }

  await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.id,
    action_type: 'owner_settlement_cancelled',
    target_table: 'owner_settlements',
    target_id: settlement.id,
    details: {
      owner_id: settlement.owner_id,
      broker_id: settlement.broker_id,
      settlement_number: settlement.settlement_number,
      reason: cancelReason,
    },
  })

  revalidatePath('/admin/finance/owner-settlements')
}