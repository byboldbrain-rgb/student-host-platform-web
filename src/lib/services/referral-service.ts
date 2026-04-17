import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'

type RewardReferralInput = {
  invitedUserId: string
  sourceReservationId: string
  adminUserId?: string | null
}

type SignupBonusInput = {
  userId: string
}

type SupabaseLikeClient = {
  from: (table: string) => any
}

async function getSettingNumber(
  supabase: SupabaseLikeClient,
  key: string,
  fallback = 0
) {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()

  if (error) throw error

  const parsed = Number(data?.value ?? fallback)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback
  }

  return parsed
}

export async function getReferralConstants() {
  const supabase = await createClient()

  const [
    signupBonusAmount,
    inviterBonusAmount,
    invitedSignupBonusAmount,
    invitedFirstPaidBonusAmount,
  ] = await Promise.all([
    getSettingNumber(supabase, 'signup_bonus_amount', 100),
    getSettingNumber(supabase, 'referral_inviter_bonus', 100),
    getSettingNumber(supabase, 'referral_invited_signup_bonus', 100),
    getSettingNumber(supabase, 'referral_invited_first_paid_bonus', 100),
  ])

  return {
    signupBonusAmount,
    inviterBonusAmount,
    invitedSignupBonusAmount,
    invitedFirstPaidBonusAmount,
  }
}

export async function getMyReferralInfo() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error('UNAUTHORIZED')

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select(
      'id, full_name, referral_code, referred_by_user_id, referral_reward_earned, wallet_cached_balance'
    )
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError

  const { data: referrals, error: referralsError } = await supabase
    .from('user_referrals')
    .select('*')
    .or(`inviter_user_id.eq.${user.id},invited_user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (referralsError) throw referralsError

  return {
    profile,
    referrals: referrals ?? [],
    constants: await getReferralConstants(),
  }
}

export async function validateReferralCode(referralCode: string) {
  const supabase = await createClient()

  const code = referralCode.trim().toUpperCase()

  if (!code) {
    throw new Error('REFERRAL_CODE_REQUIRED')
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, referral_code')
    .ilike('referral_code', code)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    return {
      valid: false,
      inviterUserId: null,
      inviterName: null,
      referralCode: code,
    }
  }

  return {
    valid: true,
    inviterUserId: data.id,
    inviterName: data.full_name,
    referralCode: data.referral_code,
  }
}

export async function applyReferralCodeForCurrentUser(referralCode: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error('UNAUTHORIZED')

  const code = referralCode.trim().toUpperCase()

  if (!code) {
    throw new Error('REFERRAL_CODE_REQUIRED')
  }

  const { data: myProfile, error: myProfileError } = await supabase
    .from('user_profiles')
    .select('id, referral_code, referred_by_user_id')
    .eq('id', user.id)
    .single()

  if (myProfileError) throw myProfileError

  if (myProfile.referred_by_user_id) {
    throw new Error('REFERRAL_ALREADY_USED')
  }

  const { data: inviterProfile, error: inviterError } = await supabase
    .from('user_profiles')
    .select('id, referral_code, full_name')
    .ilike('referral_code', code)
    .maybeSingle()

  if (inviterError) throw inviterError
  if (!inviterProfile) throw new Error('INVALID_REFERRAL_CODE')

  if (inviterProfile.id === user.id) {
    throw new Error('SELF_REFERRAL_NOT_ALLOWED')
  }

  const now = new Date().toISOString()

  const { error: profileUpdateError } = await supabase
    .from('user_profiles')
    .update({
      referred_by_user_id: inviterProfile.id,
      updated_at: now,
    })
    .eq('id', user.id)
    .is('referred_by_user_id', null)

  if (profileUpdateError) throw profileUpdateError

  const { error: referralInsertError } = await supabase
    .from('user_referrals')
    .insert({
      inviter_user_id: inviterProfile.id,
      invited_user_id: user.id,
      referral_code: inviterProfile.referral_code,
      status: 'pending',
      inviter_reward_amount: 0,
      invited_reward_amount: 0,
    })

  if (referralInsertError) {
    await supabase
      .from('user_profiles')
      .update({
        referred_by_user_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    throw referralInsertError
  }

  const { error: signupReferralBonusError } = await supabase.rpc(
    'award_referral_signup_bonus',
    {
      p_invited_user_id: user.id,
    }
  )

  if (signupReferralBonusError) throw signupReferralBonusError

  return {
    success: true,
    inviterUserId: inviterProfile.id,
    inviterName: inviterProfile.full_name,
    referralCode: inviterProfile.referral_code,
    constants: await getReferralConstants(),
  }
}

export async function awardSignupBonusToUser(input: SignupBonusInput) {
  const admin = createAdminClient()

  const { error } = await admin.rpc('award_signup_bonus', {
    p_user_id: input.userId,
  })

  if (error) throw error

  const constants = await getReferralConstants()

  return {
    awarded: true,
    amount: constants.signupBonusAmount,
  }
}

export async function rewardReferralAfterQualifiedReservation(
  input: RewardReferralInput
) {
  const admin = createAdminClient()

  const { error } = await admin.rpc('award_referral_first_paid_bonus', {
    p_invited_user_id: input.invitedUserId,
    p_source_reservation_id: input.sourceReservationId,
    p_admin_user_id: input.adminUserId ?? null,
  })

  if (error) throw error

  const constants = await getReferralConstants()

  return {
    rewarded: true,
    inviterRewardAmount: constants.inviterBonusAmount,
    invitedRewardAmount: constants.invitedFirstPaidBonusAmount,
  }
}