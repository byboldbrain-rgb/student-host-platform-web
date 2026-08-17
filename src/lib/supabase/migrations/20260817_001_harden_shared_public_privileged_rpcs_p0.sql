-- P0 hardening for privileged RPCs in the shared public schema.
-- Applied to production on 2026-08-17 via Supabase migration
-- `harden_shared_public_privileged_rpcs_p0`.
-- Preserve trusted server/admin flows while removing direct anonymous access.

create or replace function public.assert_rpc_admin_identity(p_admin_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
begin
  if p_admin_user_id is null then
    raise exception using errcode = '42501', message = 'admin_identity_required';
  end if;

  if not exists (
    select 1
    from public.admin_users au
    where au.id = p_admin_user_id
      and au.is_active = true
  ) then
    raise exception using errcode = '42501', message = 'active_admin_required';
  end if;

  if v_jwt_role <> 'service_role'
     and (auth.uid() is null or auth.uid() <> p_admin_user_id)
  then
    raise exception using errcode = '42501', message = 'admin_identity_mismatch';
  end if;
end;
$$;

revoke execute on function public.assert_rpc_admin_identity(uuid) from public, anon, authenticated;
grant execute on function public.assert_rpc_admin_identity(uuid) to service_role;

create or replace function public.apply_wallet_transaction(
  p_user_id uuid,
  p_direction text,
  p_type text,
  p_amount numeric,
  p_reference_table text default null,
  p_reference_id text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  return public.apply_wallet_transaction(
    p_user_id,
    p_direction,
    p_type,
    p_amount,
    p_reference_table,
    p_reference_id,
    p_notes,
    null::uuid
  );
end;
$$;

create or replace function public.apply_wallet_transaction(
  p_user_id uuid,
  p_direction text,
  p_type text,
  p_amount numeric,
  p_reference_table text default null,
  p_reference_id text default null,
  p_notes text default null,
  p_created_by_admin_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wallet public.user_wallets%rowtype;
  v_before numeric;
  v_after numeric;
  v_tx_id uuid;
begin
  if p_user_id is null then
    raise exception 'INVALID_USER_ID';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  if p_direction not in ('credit', 'debit') then
    raise exception 'INVALID_DIRECTION';
  end if;

  select *
    into v_wallet
  from public.user_wallets
  where user_id = p_user_id
  for update;

  if not found then
    insert into public.user_wallets (user_id, balance, currency, is_active)
    values (p_user_id, 0, 'EGP', true)
    returning * into v_wallet;
  end if;

  if v_wallet.is_active is not true then
    raise exception 'WALLET_INACTIVE';
  end if;

  v_before := coalesce(v_wallet.balance, 0);

  if p_direction = 'credit' then
    v_after := v_before + p_amount;
  else
    if v_before < p_amount then
      raise exception 'INSUFFICIENT_WALLET_BALANCE';
    end if;
    v_after := v_before - p_amount;
  end if;

  insert into public.wallet_transactions (
    user_id,
    wallet_direction,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    reference_table,
    reference_id,
    notes,
    created_by_admin_id
  ) values (
    p_user_id,
    p_direction,
    p_type,
    p_amount,
    v_before,
    v_after,
    p_reference_table,
    p_reference_id,
    p_notes,
    p_created_by_admin_id
  )
  returning id into v_tx_id;

  update public.user_wallets
  set balance = v_after,
      updated_at = now()
  where user_id = p_user_id;

  update public.user_profiles
  set wallet_cached_balance = v_after,
      updated_at = now()
  where id = p_user_id;

  return v_tx_id;
end;
$$;

revoke execute on function public.apply_wallet_transaction(uuid,text,text,numeric,text,text,text) from public, anon, authenticated;
revoke execute on function public.apply_wallet_transaction(uuid,text,text,numeric,text,text,text,uuid) from public, anon, authenticated;
grant execute on function public.apply_wallet_transaction(uuid,text,text,numeric,text,text,text) to service_role;
grant execute on function public.apply_wallet_transaction(uuid,text,text,numeric,text,text,text,uuid) to service_role;

create or replace function public.approve_wallet_deposit_request(
  p_deposit_request_id uuid,
  p_admin_user_id uuid,
  p_review_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.wallet_deposit_requests%rowtype;
  v_tx_id uuid;
begin
  perform public.assert_rpc_admin_identity(p_admin_user_id);

  select *
    into v_request
  from public.wallet_deposit_requests
  where id = p_deposit_request_id
  for update;

  if not found then
    raise exception 'DEPOSIT_REQUEST_NOT_FOUND';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'DEPOSIT_REQUEST_ALREADY_PROCESSED';
  end if;

  v_tx_id := public.apply_wallet_transaction(
    v_request.user_id,
    'credit',
    'deposit_approved',
    v_request.amount,
    'wallet_deposit_requests',
    v_request.id::text,
    coalesce(p_review_notes, 'Deposit request approved'),
    p_admin_user_id
  );

  update public.wallet_deposit_requests
  set status = 'approved',
      reviewed_by_admin_id = p_admin_user_id,
      reviewed_at = now(),
      review_notes = p_review_notes,
      updated_at = now()
  where id = p_deposit_request_id;

  perform public.apply_wallet_deposit_to_receiver_account(p_deposit_request_id);

  return v_tx_id;
end;
$$;

create or replace function public.reject_wallet_deposit_request(
  p_deposit_request_id uuid,
  p_admin_user_id uuid,
  p_review_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.wallet_deposit_requests%rowtype;
begin
  perform public.assert_rpc_admin_identity(p_admin_user_id);

  select *
    into v_request
  from public.wallet_deposit_requests
  where id = p_deposit_request_id
  for update;

  if not found then
    raise exception 'DEPOSIT_REQUEST_NOT_FOUND';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'DEPOSIT_REQUEST_ALREADY_PROCESSED';
  end if;

  update public.wallet_deposit_requests
  set status = 'rejected',
      reviewed_by_admin_id = p_admin_user_id,
      reviewed_at = now(),
      review_notes = p_review_notes,
      updated_at = now()
  where id = p_deposit_request_id;
end;
$$;

revoke execute on function public.approve_wallet_deposit_request(uuid,uuid,text) from public, anon, authenticated;
revoke execute on function public.reject_wallet_deposit_request(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.approve_wallet_deposit_request(uuid,uuid,text) to authenticated, service_role;
grant execute on function public.reject_wallet_deposit_request(uuid,uuid,text) to authenticated, service_role;

create or replace function public.award_signup_bonus(
  p_user_id uuid,
  p_created_by_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  signup_bonus_amount numeric;
  existing_tx_id uuid;
begin
  if p_user_id is null then
    raise exception 'INVALID_USER_ID';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('signup_bonus:' || p_user_id::text, 0)
  );

  signup_bonus_amount := public.get_system_setting_numeric('signup_bonus_amount', 100);

  if signup_bonus_amount <= 0 then
    return jsonb_build_object('success', false, 'reason', 'SIGNUP_BONUS_DISABLED');
  end if;

  select id
    into existing_tx_id
  from public.wallet_transactions
  where user_id = p_user_id
    and transaction_type = 'signup_bonus'
  limit 1;

  if existing_tx_id is not null then
    return jsonb_build_object('success', false, 'reason', 'SIGNUP_BONUS_ALREADY_GRANTED');
  end if;

  perform public.apply_wallet_transaction(
    p_user_id,
    'credit',
    'signup_bonus',
    signup_bonus_amount,
    'user_profiles',
    p_user_id::text,
    'Signup bonus',
    p_created_by_admin_id
  );

  return jsonb_build_object('success', true, 'amount', signup_bonus_amount);
end;
$$;

create or replace function public.award_referral_signup_bonus(
  p_invited_user_id uuid,
  p_created_by_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  referral_row public.user_referrals%rowtype;
  bonus_amount numeric;
begin
  if p_invited_user_id is null then
    raise exception 'INVALID_USER_ID';
  end if;

  select *
    into referral_row
  from public.user_referrals
  where invited_user_id = p_invited_user_id
  limit 1
  for update;

  if referral_row.id is null then
    return jsonb_build_object('success', false, 'reason', 'NO_REFERRAL_FOUND');
  end if;

  if referral_row.invited_signup_bonus_rewarded_at is not null then
    return jsonb_build_object('success', false, 'reason', 'INVITED_SIGNUP_BONUS_ALREADY_GRANTED');
  end if;

  bonus_amount := public.get_system_setting_numeric('referral_invited_signup_bonus_amount', 100);

  if bonus_amount <= 0 then
    return jsonb_build_object('success', false, 'reason', 'REFERRAL_INVITED_SIGNUP_BONUS_DISABLED');
  end if;

  perform public.apply_wallet_transaction(
    referral_row.invited_user_id,
    'credit',
    'referral_bonus',
    bonus_amount,
    'user_referrals',
    referral_row.id::text,
    'Referral signup bonus for invited user',
    p_created_by_admin_id
  );

  update public.user_referrals
  set invited_signup_bonus_amount = bonus_amount,
      invited_signup_bonus_rewarded_at = now()
  where id = referral_row.id;

  return jsonb_build_object(
    'success', true,
    'amount', bonus_amount,
    'referral_id', referral_row.id
  );
end;
$$;

revoke execute on function public.award_signup_bonus(uuid,uuid) from public, anon, authenticated;
revoke execute on function public.award_referral_signup_bonus(uuid,uuid) from public, anon, authenticated;
grant execute on function public.award_signup_bonus(uuid,uuid) to service_role;
grant execute on function public.award_referral_signup_bonus(uuid,uuid) to service_role;

create or replace function public.cancel_property_reservation_by_broker(
  p_reservation_id uuid,
  p_admin_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_broker_id uuid;
  v_property_id uuid;
  v_current_status text;
  v_room_id uuid;
  v_bed_id uuid;
begin
  perform public.assert_rpc_admin_identity(p_admin_user_id);

  select broker_id
    into v_broker_id
  from public.admin_users
  where id = p_admin_user_id
    and is_active = true;

  if v_broker_id is null then
    raise exception 'Access denied: broker admin required';
  end if;

  select pr.property_id, pr.status
    into v_property_id, v_current_status
  from public.property_reservations pr
  join public.properties p on p.id = pr.property_id
  where pr.id = p_reservation_id
    and p.broker_id = v_broker_id;

  if v_property_id is null then
    raise exception 'Reservation not found or access denied';
  end if;

  if v_current_status in ('cancelled', 'completed') then
    raise exception 'Reservation cannot be cancelled in its current status';
  end if;

  update public.property_reservations
  set status = 'cancelled',
      updated_at = now(),
      updated_by_admin_id = p_admin_user_id
  where id = p_reservation_id;

  for v_bed_id in
    select distinct pra.bed_id
    from public.property_reservation_allocations pra
    where pra.reservation_id = p_reservation_id
      and pra.bed_id is not null
  loop
    update public.room_beds b
    set status = case
      when b.is_active = false then 'inactive'
      when exists (
        select 1
        from public.property_reservation_allocations pra2
        join public.property_reservations pr2 on pr2.id = pra2.reservation_id
        where pra2.bed_id = b.id
          and pr2.status in ('pending', 'reserved', 'checked_in')
      ) then 'reserved'
      else 'available'
    end,
    updated_at = now()
    where b.id = v_bed_id;
  end loop;

  for v_room_id in
    select distinct coalesce(
      pra.room_id,
      (select rb.room_id from public.room_beds rb where rb.id = pra.bed_id)
    ) as affected_room_id
    from public.property_reservation_allocations pra
    where pra.reservation_id = p_reservation_id
  loop
    if v_room_id is not null then
      perform public.recalc_property_room_status(v_room_id);
    end if;
  end loop;

  perform public.recalc_property_status(v_property_id);

  insert into public.admin_audit_logs (
    admin_user_id, action_type, target_table, target_id, details
  ) values (
    p_admin_user_id,
    'cancel_property_reservation',
    'property_reservations',
    p_reservation_id::text,
    jsonb_build_object(
      'property_id', v_property_id,
      'old_status', v_current_status,
      'new_status', 'cancelled'
    )
  );
end;
$$;

revoke execute on function public.cancel_property_reservation_by_broker(uuid,uuid) from public, anon, authenticated;
grant execute on function public.cancel_property_reservation_by_broker(uuid,uuid) to authenticated, service_role;

revoke execute on function public.apply_wallet_deposit_to_receiver_account(uuid) from public, anon, authenticated;
revoke execute on function public.reactivate_cooled_wallet_accounts(bigint) from public, anon, authenticated;
revoke execute on function public.recalc_property_room_status(uuid) from public, anon, authenticated;
revoke execute on function public.recalc_property_status(uuid) from public, anon, authenticated;
revoke execute on function public.notify_property_waiting_list_for_property(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_user_wallet_and_referral() from public, anon, authenticated;
revoke execute on function public.trigger_property_waiting_list_matching() from public, anon, authenticated;

grant execute on function public.apply_wallet_deposit_to_receiver_account(uuid) to service_role;
grant execute on function public.reactivate_cooled_wallet_accounts(bigint) to service_role;
grant execute on function public.recalc_property_room_status(uuid) to service_role;
grant execute on function public.recalc_property_status(uuid) to service_role;
grant execute on function public.notify_property_waiting_list_for_property(uuid) to service_role;
grant execute on function public.handle_new_auth_user() to service_role;
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.handle_new_user_wallet_and_referral() to service_role;
grant execute on function public.trigger_property_waiting_list_matching() to service_role;