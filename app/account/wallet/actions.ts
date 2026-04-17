'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { createClient } from '@/src/lib/supabase/server'

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
  const senderName = parseOptionalString(formData.get('sender_name'))
  const senderPhone = parseOptionalString(formData.get('sender_phone'))
  const transactionReference = parseOptionalString(formData.get('transaction_reference'))

  const receiptFile = formData.get('receipt_file')

  if (!amount) {
    throw new Error('المبلغ غير صحيح')
  }

  if (!(receiptFile instanceof File) || receiptFile.size <= 0) {
    throw new Error('صورة الإيصال مطلوبة')
  }

  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedMimeTypes.includes(receiptFile.type)) {
    throw new Error('نوع الملف غير مدعوم. ارفع صورة JPG أو PNG أو WEBP')
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

  const { error: insertError } = await supabase.from('wallet_deposit_requests').insert({
    user_id: user.id,
    amount,
    payment_method: paymentMethod,
    receipt_image_url: receiptImageUrl,
    sender_name: senderName,
    sender_phone: senderPhone,
    transaction_reference: transactionReference,
  })

  if (insertError) {
    await admin.storage.from(WALLET_RECEIPTS_BUCKET).remove([filePath])
    throw new Error(insertError.message)
  }

  revalidatePath('/account/wallet')
}