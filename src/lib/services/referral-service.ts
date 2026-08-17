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

type ReferralValidationRpcResult = {
  valid?: boolean
  reason?: string | null
  inviter_user_id?: string | null
  inviter_name?: string | null
  referral_code?: string | null
}

type ApplyReferralRpcResult = {
  success?: boolean
  referral_id?: string | null
  inviter_user_id?: string | null
  inviter_name?: string | null
  referral_code?: string | null
  signup_bonus?: unknown
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
    getSettingNumber(
      supabase,
      'referral_inviter_first_paid_bonus_amount',
      100
    ),
    getSettingNumber(supabase, 'referral_invited_signup_bonus_amount', 100),
    getSettingNumber(
      supabase,
      'referral_invited_first_paid_bonus_amount',
      100
    ),
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

  const {
    data,
    error,
  } = await supabase.rpc('validate_referral_code_for_current_user', {
    p_referral_code: code,
  })

  if (error) throw error

  const result = (data ?? {}) as ReferralValidationRpcResult

  return {
    valid: result.valid === true,
    inviterUserId: result.inviter_user_id ?? null,
    inviterName: result.inviter_name ?? null,
    referralCode: result.referral_code ?? code,
    reason: result.reason ?? null,
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

  const { data, error } = await supabase.rpc(
    'apply_referral_code_for_current_user',
    {
      p_referral_code: code,
    }
  )

  if (error) throw error

  const result = (data ?? {}) as ApplyReferralRpcResult

  if (result.success !== true) {
    throw new Error('REFERRAL_APPLICATION_FAILED')
  }

  return {
    success: true,
    inviterUserId: result.inviter_user_id ?? null,
    inviterName: result.inviter_name ?? null,
    referralCode: result.referral_code ?? code,
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
    p_created_by_admin_id: input.adminUserId ?? null,
  })

  if (error) throw error

  const constants = await getReferralConstants()

  return {
    rewarded: true,
    inviterRewardAmount: constants.inviterBonusAmount,
    invitedRewardAmount: constants.invitedFirstPaidBonusAmount,
  }
}