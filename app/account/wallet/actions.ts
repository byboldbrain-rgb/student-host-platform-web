'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { createClient } from '@/src/lib/supabase/server'
import { sendNewDepositRequestNotificationToARAdmins } from '@/src/lib/push-notifications'

const WALLET_RECEIPTS_BUCKET = 'wallet-receipts'

type WalletDepositMethod =
  | 'instapay'
  | 'vodafone_cash'
  | 'orange_cash'
  | 'etisalat_cash'
  | 'bank_transfer'

function slugifyFileName(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf('.')
  const name = lastDotIndex >= 0 ? fileName.slice(0, lastDotIndex) : fileName
  const extension =
    lastDotIndex >= 0 ? fileName.slice(lastDotIndex + 1).toLowerCase() : ''

  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return extension ? `${safeName || 'receipt'}.${extension}` : safeName || 'receipt'
}

function parseAmount(value: FormDataEntryValue | null) {
  const str = String(value || '').trim()
  if (!str) return null

  const num = Number(str)
  if (!Number.isFinite(num) || num <= 0) return null

  return num
}

function parseOptionalString(value: FormDataEntryValue | null) {
  const str = String(value || '').trim()
  return str || null
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const str = String(value || '').trim()
  if (!str) return null

  const num = Number(str)
  if (!Number.isFinite(num)) return null

  return num
}

function parsePaymentMethod(value: FormDataEntryValue | null): WalletDepositMethod {
  const parsed = String(value || '').trim()

  if (
    parsed === 'instapay' ||
    parsed === 'vodafone_cash' ||
    parsed === 'orange_cash' ||
    parsed === 'etisalat_cash' ||
    parsed === 'bank_transfer'
  ) {
    return parsed
  }

  throw new Error('وسيلة الدفع غير صحيحة')
}

export async function getWalletDepositMethodsWithAccountsAction() {
  const supabase = await createClient()

  const { data: methods, error: methodsError } = await supabase
    .from('wallet_payment_methods')
    .select('id, code, name_ar, name_en, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })

  if (methodsError) {
    throw new Error(methodsError.message)
  }

  const result = await Promise.all(
    (methods || []).map(async (method) => {
      const { data: activeAccountRows, error: activeAccountError } =
        await supabase.rpc('get_active_wallet_payment_account', {
          p_method_code: method.code,
        })

      if (activeAccountError) {
        throw new Error(activeAccountError.message)
      }

      const row = Array.isArray(activeAccountRows) ? activeAccountRows[0] : null

      return {
        id: method.id,
        code: method.code,
        name_ar: method.name_ar,
        name_en: method.name_en,
        instructions_ar: row?.instructions_ar ?? null,
        instructions_en: row?.instructions_en ?? null,
        active_account: row
          ? {
              id: row.account_id as number,
              label: row.account_label as string | null,
              account_name: row.account_name as string | null,
              account_number: row.account_number as string | null,
              iban: row.account_iban as string | null,
              qr_image_url: row.account_qr_image_url as string | null,
            }
          : null,
      }
    })
  )

  return result
}

export async function createWalletDepositRequestWithUploadAction(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('يجب تسجيل الدخول أولًا')
  }

  const amount = parseAmount(formData.get('amount'))
  const paymentMethod = parsePaymentMethod(formData.get('payment_method'))
  const paymentMethodAccountId = parseOptionalNumber(
    formData.get('payment_method_account_id')
  )
  const senderName = parseOptionalString(formData.get('sender_name'))
  const senderPhone = parseOptionalString(formData.get('sender_phone'))
  const transactionReference = parseOptionalString(
    formData.get('transaction_reference')
  )
  const receiptFile = formData.get('receipt_file')

  if (!amount) {
    throw new Error('المبلغ غير صحيح')
  }

  if (!paymentMethodAccountId) {
    throw new Error('اختر وسيلة الدفع وانتظر ظهور بيانات التحويل')
  }

  if (!(receiptFile instanceof File) || receiptFile.size <= 0) {
    throw new Error('صورة الإيصال مطلوبة')
  }

  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedMimeTypes.includes(receiptFile.type)) {
    throw new Error('نوع الملف غير مدعوم. ارفع صورة JPG أو PNG أو WEBP')
  }

  const { data: methodRow, error: methodError } = await admin
    .from('wallet_payment_methods')
    .select('id, code, name_ar, name_en, is_active')
    .eq('code', paymentMethod)
    .eq('is_active', true)
    .single()

  if (methodError || !methodRow) {
    throw new Error('وسيلة الدفع غير متاحة حاليًا')
  }

  const { data: accountRow, error: accountError } = await admin
    .from('wallet_payment_method_accounts')
    .select(
      'id, payment_method_id, label, account_name, account_number, iban, qr_image_url, is_active, is_visible'
    )
    .eq('id', paymentMethodAccountId)
    .eq('payment_method_id', methodRow.id)
    .eq('is_active', true)
    .eq('is_visible', true)
    .single()

  if (accountError || !accountRow) {
    throw new Error('بيانات الاستلام غير متاحة حاليًا، أعد اختيار وسيلة الدفع')
  }

  const safeFileName = slugifyFileName(receiptFile.name)
  const filePath = `wallet-deposits/${user.id}/${Date.now()}-${safeFileName}`

  const { error: uploadError } = await admin.storage
    .from(WALLET_RECEIPTS_BUCKET)
    .upload(filePath, receiptFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: receiptFile.type || undefined,
    })

  if (uploadError) {
    throw new Error(`فشل رفع صورة الإيصال: ${uploadError.message}`)
  }

  const { data: publicUrlData } = admin.storage
    .from(WALLET_RECEIPTS_BUCKET)
    .getPublicUrl(filePath)

  const receiptImageUrl = publicUrlData.publicUrl

  const receiverAccountSnapshot = {
    method_code: methodRow.code,
    method_name_ar: methodRow.name_ar,
    method_name_en: methodRow.name_en,
    account_id: accountRow.id,
    label: accountRow.label,
    account_name: accountRow.account_name,
    account_number: accountRow.account_number,
    iban: accountRow.iban,
    qr_image_url: accountRow.qr_image_url,
    shown_at: new Date().toISOString(),
  }

  const { data: insertedRequest, error: insertError } = await admin
    .from('wallet_deposit_requests')
    .insert({
      user_id: user.id,
      amount,
      payment_method: paymentMethod,
      payment_method_id: methodRow.id,
      payment_method_account_id: accountRow.id,
      receiver_account_snapshot: receiverAccountSnapshot,
      receipt_image_url: receiptImageUrl,
      sender_name: senderName,
      sender_phone: senderPhone,
      transaction_reference: transactionReference,
    })
    .select('id, amount, payment_method, sender_name')
    .single()

  if (insertError || !insertedRequest) {
    await admin.storage.from(WALLET_RECEIPTS_BUCKET).remove([filePath])
    throw new Error(insertError?.message || 'Failed to create deposit request')
  }

  await sendNewDepositRequestNotificationToARAdmins({
    depositRequestId: insertedRequest.id,
    amount: Number(insertedRequest.amount),
    paymentMethod: insertedRequest.payment_method,
    senderName: insertedRequest.sender_name,
  })

  revalidatePath('/account/wallet')
  revalidatePath('/admin/finance/deposit-requests')
}