'use server'

import { createAdminClient } from '@/src/lib/supabase/admin'

type SignupInput = {
  fullName: string
  phone?: string
  email: string
  password: string
  referralCode?: string
}

function normalizeReferralCode(code?: string) {
  return String(code || '').trim().toUpperCase()
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function signUpUserAction(input: SignupInput) {
  const supabase = createAdminClient()

  const fullName = String(input.fullName || '').trim()
  const phone = String(input.phone || '').trim()
  const email = String(input.email || '').trim().toLowerCase()
  const password = String(input.password || '')
  const referralCode = normalizeReferralCode(input.referralCode)

  if (!fullName) {
    throw new Error('الاسم الكامل مطلوب')
  }

  if (!email) {
    throw new Error('البريد الإلكتروني مطلوب')
  }

  if (!password || password.length < 6) {
    throw new Error('كلمة المرور يجب ألا تقل عن 6 أحرف')
  }

  const { data: createdUserData, error: createUserError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
      },
    })

  if (createUserError) {
    throw new Error(createUserError.message)
  }

  const user = createdUserData.user

  if (!user) {
    throw new Error('تعذر إنشاء المستخدم')
  }

  let profileExists = false

  for (let attempt = 0; attempt < 10; attempt++) {
    const { data: createdProfile, error: createdProfileError } = await supabase
      .from('user_profiles')
      .select('id, referral_code, referred_by_user_id')
      .eq('id', user.id)
      .maybeSingle()

    if (createdProfileError) {
      throw new Error(createdProfileError.message)
    }

    if (createdProfile) {
      profileExists = true
      break
    }

    await wait(200)
  }

  if (!profileExists) {
    throw new Error('تعذر تجهيز ملف المستخدم بعد إنشاء الحساب')
  }

  if (referralCode) {
    const now = new Date().toISOString()

    const { data: inviterProfile, error: inviterError } = await supabase
      .from('user_profiles')
      .select('id, full_name, referral_code')
      .ilike('referral_code', referralCode)
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
        inviter_reward_amount: 0,
        invited_reward_amount: 0,
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

    const { error: referralSignupBonusError } = await supabase.rpc(
      'award_referral_signup_bonus',
      {
        p_invited_user_id: user.id,
      }
    )

    if (referralSignupBonusError) {
      throw new Error(referralSignupBonusError.message)
    }
  }

  const { error: signupBonusError } = await supabase.rpc('award_signup_bonus', {
    p_user_id: user.id,
  })

  if (signupBonusError) {
    throw new Error(signupBonusError.message)
  }

  return {
    success: true,
    userId: user.id,
  }
}