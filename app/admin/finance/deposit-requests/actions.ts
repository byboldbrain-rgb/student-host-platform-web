'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { requireDepositRequestsAccess } from '@/src/lib/admin-auth'
import {
  approveDepositRequestByAdmin,
  rejectDepositRequestByAdmin,
} from '@/src/lib/services/wallet-service'

function parseDepositRequestId(formData: FormData) {
  const depositRequestId = String(formData.get('deposit_request_id') || '').trim()

  if (!depositRequestId) {
    throw new Error('Deposit request id is required')
  }

  return depositRequestId
}

function parseOptionalString(value: FormDataEntryValue | null) {
  const parsed = String(value || '').trim()
  return parsed || null
}

function parseRequiredString(value: FormDataEntryValue | null, message: string) {
  const parsed = String(value || '').trim()

  if (!parsed) {
    throw new Error(message)
  }

  return parsed
}

export async function approveDepositRequestAction(formData: FormData) {
  const depositRequestId = parseDepositRequestId(formData)
  const reviewNotes = parseOptionalString(formData.get('review_notes'))
  const transactionReference = parseRequiredString(
    formData.get('transaction_reference'),
    'Transaction reference is required'
  )

  const adminContext = await requireDepositRequestsAccess()
  const admin = createAdminClient()

  const { error: updateReferenceError } = await admin
    .from('wallet_deposit_requests')
    .update({
      transaction_reference: transactionReference,
      updated_at: new Date().toISOString(),
    })
    .eq('id', depositRequestId)
    .eq('status', 'pending')

  if (updateReferenceError) {
    throw new Error(updateReferenceError.message)
  }

  const approvePayload = {
    depositRequestId,
    adminUserId: adminContext.admin.id,
    reviewNotes,
    transactionReference,
  }

  await approveDepositRequestByAdmin(approvePayload)

  revalidatePath('/admin/finance/deposit-requests')
  revalidatePath('/account/wallet')
}

export async function rejectDepositRequestAction(formData: FormData) {
  const depositRequestId = parseDepositRequestId(formData)
  const reviewNotes =
    parseOptionalString(formData.get('review_notes')) || 'Rejected by admin'

  const adminContext = await requireDepositRequestsAccess()

  await rejectDepositRequestByAdmin({
    depositRequestId,
    adminUserId: adminContext.admin.id,
    reviewNotes,
  })

  revalidatePath('/admin/finance/deposit-requests')
  revalidatePath('/account/wallet')
}