'use server'

import { revalidatePath } from 'next/cache'
import { requireSuperAdminAccess } from '@/src/lib/admin-auth'
import { createAdminClient } from '@/src/lib/supabase/admin'

function str(v: FormDataEntryValue | null) {
  const s = String(v || '').trim()
  return s || null
}

function num(v: FormDataEntryValue | null) {
  const s = String(v || '').trim()
  if (!s) return null
  const n = Number(s)
  if (!Number.isFinite(n)) throw new Error('قيمة رقمية غير صحيحة')
  return n
}

export async function createPaymentReceiverAccountAction(formData: FormData) {
  await requireSuperAdminAccess()
  const admin = createAdminClient()

  const paymentMethodId = num(formData.get('payment_method_id'))
  const label = str(formData.get('label'))
  const accountName = str(formData.get('account_name'))
  const accountNumber = str(formData.get('account_number'))
  const maxReceiveAmount = num(formData.get('max_receive_amount'))
  const cooldownHours = num(formData.get('cooldown_hours'))

  if (!paymentMethodId) throw new Error('وسيلة الدفع غير صحيحة')
  if (!accountNumber) throw new Error('رقم التحويل مطلوب')

  const { error } = await admin.from('wallet_payment_method_accounts').insert({
    payment_method_id: paymentMethodId,
    label,
    account_name: accountName,
    account_number: accountNumber,
    max_receive_amount: maxReceiveAmount,
    cooldown_hours: cooldownHours ?? 24,
    is_active: true,
    is_visible: true,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/admin/finance/payment-method-accounts')
}

export async function togglePaymentReceiverAccountAction(formData: FormData) {
  await requireSuperAdminAccess()
  const admin = createAdminClient()

  const accountId = num(formData.get('account_id'))
  const nextIsActive = String(formData.get('next_is_active')) === 'true'

  if (!accountId) throw new Error('الحساب غير صحيح')

  const { error } = await admin
    .from('wallet_payment_method_accounts')
    .update({ is_active: nextIsActive })
    .eq('id', accountId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/finance/payment-method-accounts')
}

export async function setActivePaymentReceiverAccountAction(formData: FormData) {
  await requireSuperAdminAccess()
  const admin = createAdminClient()

  const paymentMethodId = num(formData.get('payment_method_id'))
  const accountId = num(formData.get('account_id'))

  if (!paymentMethodId || !accountId) throw new Error('بيانات غير صحيحة')

  const { error } = await admin
    .from('wallet_payment_methods')
    .update({
      active_account_id: accountId,
      active_account_started_at: new Date().toISOString(),
    })
    .eq('id', paymentMethodId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/finance/payment-method-accounts')
}