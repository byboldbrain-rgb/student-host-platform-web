-- P0 phase 6: make referral validation/application a single authenticated-safe DB boundary.
-- Applied to production on 2026-08-17 via Supabase migration
-- `make_referral_application_atomic_and_authenticated_p0`.

create or replace function public.validate_referral_code_for_current_user(p_referral_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_code text := upper(btrim(coalesce(p_referral_code, '')));
  v_inviter public.user_profiles%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if v_code = '' then
    raise exception using errcode = '22023', message = 'referral_code_required';
  end if;

  select p.*
    into v_inviter
  from public.user_profiles p
  where upper(p.referral_code) = v_code
  limit 1;

  if not found then
    return jsonb_build_object(
      'valid', false,
      'inviter_user_id', null,
      'inviter_name', null,
      'referral_code', v_code
    );
  end if;

  if v_inviter.id = v_user_id then
    return jsonb_build_object(
      'valid', false,
      'reason', 'SELF_REFERRAL_NOT_ALLOWED',
      'inviter_user_id', null,
      'inviter_name', null,
      'referral_code', v_code
    );
  end if;

  return jsonb_build_object(
    'valid', true,
    'inviter_user_id', v_inviter.id,
    'inviter_name', v_inviter.full_name,
    'referral_code', v_inviter.referral_code
  );
end;
$$;

revoke execute on function public.validate_referral_code_for_current_user(text) from public, anon;
grant execute on function public.validate_referral_code_for_current_user(text) to authenticated, service_role;

create or replace function public.apply_referral_code_for_current_user(p_referral_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_code text := upper(btrim(coalesce(p_referral_code, '')));
  v_my_profile public.user_profiles%rowtype;
  v_inviter public.user_profiles%rowtype;
  v_referral public.user_referrals%rowtype;
  v_bonus_result jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if v_code = '' then
    raise exception using errcode = '22023', message = 'referral_code_required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('apply_referral:' || v_user_id::text, 0)
  );

  select p.*
    into v_my_profile
  from public.user_profiles p
  where p.id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'user_profile_not_found';
  end if;

  if v_my_profile.referred_by_user_id is not null
     or exists (
       select 1
       from public.user_referrals r
       where r.invited_user_id = v_user_id
     )
  then
    raise exception using errcode = 'P0001', message = 'referral_already_used';
  end if;

  select p.*
    into v_inviter
  from public.user_profiles p
  where upper(p.referral_code) = v_code
  limit 1;

  if not found then
    raise exception using errcode = '22023', message = 'invalid_referral_code';
  end if;

  if v_inviter.id = v_user_id then
    raise exception using errcode = '22023', message = 'self_referral_not_allowed';
  end if;

  update public.user_profiles
  set referred_by_user_id = v_inviter.id,
      updated_at = now()
  where id = v_user_id;

  insert into public.user_referrals (
    inviter_user_id,
    invited_user_id,
    referral_code,
    status,
    inviter_reward_amount,
    invited_reward_amount,
    invited_signup_bonus_amount,
    inviter_first_paid_bonus_amount,
    invited_first_paid_bonus_amount
  ) values (
    v_inviter.id,
    v_user_id,
    v_inviter.referral_code,
    'pending',
    0,
    0,
    0,
    0,
    0
  )
  returning * into v_referral;

  v_bonus_result := public.award_referral_signup_bonus(v_user_id, null::uuid);

  return jsonb_build_object(
    'success', true,
    'referral_id', v_referral.id,
    'inviter_user_id', v_inviter.id,
    'inviter_name', v_inviter.full_name,
    'referral_code', v_inviter.referral_code,
    'signup_bonus', v_bonus_result
  );
end;
$$;

revoke execute on function public.apply_referral_code_for_current_user(text) from public, anon;
grant execute on function public.apply_referral_code_for_current_user(text) to authenticated, service_role;

revoke execute on function public.award_referral_signup_bonus(uuid,uuid) from public, anon, authenticated;
grant execute on function public.award_referral_signup_bonus(uuid,uuid) to service_role;