'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/src/lib/admin-auth'
import { createClient } from '@/src/lib/supabase/server'

export type ChangePasswordState = {
  ok: boolean
  message: string
}

function parsePassword(value: FormDataEntryValue | null) {
  return String(value || '').trim()
}

export async function changeAdminPasswordAction(
  _previousState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const currentPassword = parsePassword(formData.get('current_password'))
  const newPassword = parsePassword(formData.get('new_password'))
  const confirmPassword = parsePassword(formData.get('confirm_password'))

  if (!currentPassword || !newPassword || !confirmPassword) {
    return {
      ok: false,
      message: 'Please fill in all password fields.',
    }
  }

  if (newPassword.length < 8) {
    return {
      ok: false,
      message: 'New password must be at least 8 characters.',
    }
  }

  if (newPassword !== confirmPassword) {
    return {
      ok: false,
      message: 'New password and confirmation do not match.',
    }
  }

  if (currentPassword === newPassword) {
    return {
      ok: false,
      message: 'New password must be different from current password.',
    }
  }

  const adminContext = await requireAdmin()
  const supabase = await createClient()

  const email = adminContext.user.email

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  })

  if (verifyError) {
    return {
      ok: false,
      message: 'Current password is incorrect.',
    }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) {
    return {
      ok: false,
      message: updateError.message,
    }
  }

  revalidatePath('/admin/change-password')

  return {
    ok: true,
    message: 'Password changed successfully.',
  }
}