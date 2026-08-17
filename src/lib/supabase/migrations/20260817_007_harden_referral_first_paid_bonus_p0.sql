-- P0 phase 7: make first-paid referral reward server-only and concurrency safe.
-- Applied to production on 2026-08-17 via Supabase migration
-- `harden_referral_first_paid_bonus_p0`.

create or replace function public.award_referral_first_paid_bonus(
  p_invited_user_id uuid,
  p_source_reservation_id uuid,
  p_created_by_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_referral public.user_referrals%rowtype;
  v_reservation public.property_reservations%rowtype;
  v_inviter_bonus_amount numeric;
  v_invited_bonus_amount numeric;
  v_paid_reservations_count bigint;
begin
  if p_invited_user_id is null or p_source_reservation_id is null then
    raise exception using errcode = '22023', message = 'invalid_referral_reward_input';
  end if;

  if p_created_by_admin_id is not null then
    perform public.assert_rpc_admin_identity(p_created_by_admin_id);
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('first_paid_referral:' || p_invited_user_id::text, 0)
  );

  select r.*
    into v_referral
  from public.user_referrals r
  where r.invited_user_id = p_invited_user_id
  order by r.created_at desc
  limit 1
  for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'NO_REFERRAL_FOUND');
  end if;

  if v_referral.first_paid_bonus_rewarded_at is not null then
    return jsonb_build_object(
      'success', false,
      'reason', 'FIRST_PAID_BONUS_ALREADY_GRANTED',
      'referral_id', v_referral.id
    );
  end if;

  select pr.*
    into v_reservation
  from public.property_reservations pr
  where pr.id = p_source_reservation_id
    and pr.user_id = p_invited_user_id
  limit 1
  for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'RESERVATION_NOT_FOUND_FOR_USER');
  end if;

  if v_reservation.payment_status <> 'paid' then
    return jsonb_build_object('success', false, 'reason', 'RESERVATION_NOT_FULLY_PAID');
  end if;

  select count(*)
    into v_paid_reservations_count
  from public.property_reservations pr
  where pr.user_id = p_invited_user_id
    and pr.payment_status = 'paid';

  if v_paid_reservations_count = 0 then
    return jsonb_build_object('success', false, 'reason', 'NO_PAID_RESERVATIONS');
  end if;

  v_inviter_bonus_amount := public.get_system_setting_numeric(
    'referral_inviter_first_paid_bonus_amount',
    100
  );

  v_invited_bonus_amount := public.get_system_setting_numeric(
    'referral_invited_first_paid_bonus_amount',
    100
  );

  if v_inviter_bonus_amount > 0 then
    perform public.apply_wallet_transaction(
      v_referral.inviter_user_id,
      'credit',
      'referral_bonus',
      v_inviter_bonus_amount,
      'property_reservations',
      p_source_reservation_id::text,
      'Referral first paid booking reward for inviter',
      p_created_by_admin_id
    );
  end if;

  if v_invited_bonus_amount > 0 then
    perform public.apply_wallet_transaction(
      v_referral.invited_user_id,
      'credit',
      'referral_bonus',
      v_invited_bonus_amount,
      'property_reservations',
      p_source_reservation_id::text,
      'Referral first paid booking reward for invited user',
      p_created_by_admin_id
    );
  end if;

  update public.user_referrals
  set status = 'rewarded',
      qualified_at = coalesce(qualified_at, now()),
      rewarded_at = now(),
      source_reservation_id = p_source_reservation_id,
      inviter_first_paid_bonus_amount = v_inviter_bonus_amount,
      invited_first_paid_bonus_amount = v_invited_bonus_amount,
      first_paid_bonus_rewarded_at = now()
  where id = v_referral.id;

  update public.user_profiles
  set referral_reward_earned = true,
      updated_at = now()
  where id = p_invited_user_id;

  return jsonb_build_object(
    'success', true,
    'inviter_bonus_amount', v_inviter_bonus_amount,
    'invited_bonus_amount', v_invited_bonus_amount,
    'referral_id', v_referral.id
  );
end;
$$;

revoke execute on function public.award_referral_first_paid_bonus(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.award_referral_first_paid_bonus(uuid,uuid,uuid) to service_role;