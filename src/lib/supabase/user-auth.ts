import { createClient } from '@/src/lib/supabase/client'

export type UserSignUpPayload = {
  email: string
  password: string
  fullName: string
  phone?: string
  referralCode?: string
}

export type UserLoginPayload = {
  email: string
  password: string
}

const REFERRAL_INVITER_BONUS_AMOUNT = 200
const REFERRAL_INVITED_BONUS_AMOUNT = 100

function normalizeReferralCode(code?: string) {
  return String(code || '').trim().toUpperCase()
}

export async function signUpUser(payload: UserSignUpPayload) {
  const supabase = createClient()

  const normalizedReferralCode = normalizeReferralCode(payload.referralCode)

  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.fullName,
        phone: payload.phone ?? '',
      },
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  const user = data.user

  if (!user) {
    throw new Error('تعذر إنشاء المستخدم')
  }

  const now = new Date().toISOString()

  const { error: profileError } = await supabase.from('user_profiles').upsert(
    {
      id: user.id,
      full_name: payload.fullName,
      phone: payload.phone?.trim() || null,
      updated_at: now,
    },
    {
      onConflict: 'id',
    }
  )

  if (profileError) {
    throw new Error(profileError.message)
  }

  if (normalizedReferralCode) {
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('user_profiles')
      .select('id, referred_by_user_id, referral_code')
      .eq('id', user.id)
      .single()

    if (currentProfileError) {
      throw new Error(currentProfileError.message)
    }

    if (currentProfile.referred_by_user_id) {
      throw new Error('تم استخدام كود إحالة مسبقًا لهذا الحساب')
    }

    const { data: inviterProfile, error: inviterError } = await supabase
      .from('user_profiles')
      .select('id, full_name, referral_code')
      .eq('referral_code', normalizedReferralCode)
      .maybeSingle()

    if (inviterError) {
      throw new Error(inviterError.message)
    }

    if (!inviterProfile) {
      throw new Error('كود الإحالة غير صحيح')
    }

    if (inviterProfile.id === user.id) {
      throw new Error('لا يمكن استخدام كود الإحالة الخاص بك')
    }

    const { error: updateReferralError } = await supabase
      .from('user_profiles')
      .update({
        referred_by_user_id: inviterProfile.id,
        updated_at: now,
      })
      .eq('id', user.id)
      .is('referred_by_user_id', null)

    if (updateReferralError) {
      throw new Error(updateReferralError.message)
    }

    const { error: insertReferralError } = await supabase
      .from('user_referrals')
      .insert({
        inviter_user_id: inviterProfile.id,
        invited_user_id: user.id,
        referral_code: inviterProfile.referral_code,
        status: 'pending',
        inviter_reward_amount: REFERRAL_INVITER_BONUS_AMOUNT,
        invited_reward_amount: REFERRAL_INVITED_BONUS_AMOUNT,
      })

    if (insertReferralError) {
      await supabase
        .from('user_profiles')
        .update({
          referred_by_user_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      throw new Error(insertReferralError.message)
    }
  }

  return data
}

export async function signInUser(payload: UserLoginPayload) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signOutUser() {
  const supabase = createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}

export async function getCurrentUser() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()

  if (error) {
    throw new Error(error.message)
  }

  return data.user
}

export async function getCurrentSession() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw new Error(error.message)
  }

  return data.session
}