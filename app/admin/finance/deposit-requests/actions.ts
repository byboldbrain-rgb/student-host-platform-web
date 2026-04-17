'use server'

import { revalidatePath } from 'next/cache'
import { requireSuperAdminAccess } from '@/src/lib/admin-auth'
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

export async function approveDepositRequestAction(formData: FormData) {
  const depositRequestId = parseDepositRequestId(formData)
  const reviewNotes = parseOptionalString(formData.get('review_notes'))

  const adminContext = await requireSuperAdminAccess()

  await approveDepositRequestByAdmin({
    depositRequestId,
    adminUserId: adminContext.admin.id,
    reviewNotes,
  })

  revalidatePath('/admin/finance/deposit-requests')
  revalidatePath('/account/wallet')
}

export async function rejectDepositRequestAction(formData: FormData) {
  const depositRequestId = parseDepositRequestId(formData)
  const reviewNotes = parseOptionalString(formData.get('review_notes'))

  const adminContext = await requireSuperAdminAccess()

  await rejectDepositRequestByAdmin({
    depositRequestId,
    adminUserId: adminContext.admin.id,
    reviewNotes,
  })

  revalidatePath('/admin/finance/deposit-requests')
  revalidatePath('/account/wallet')
}