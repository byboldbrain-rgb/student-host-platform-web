begin;

-- =========================================================
-- 1) USER PROFILE EXTENSIONS
-- =========================================================

alter table public.user_profiles
add column if not exists referral_code text unique,
add column if not exists referred_by_user_id uuid references auth.users(id),
add column if not exists referral_reward_earned boolean not null default false,
add column if not exists wallet_cached_balance numeric not null default 0;

create index if not exists idx_user_profiles_referred_by_user_id
  on public.user_profiles (referred_by_user_id);

create index if not exists idx_user_profiles_referral_code
  on public.user_profiles (referral_code);


-- =========================================================
-- 2) USER WALLETS
-- =========================================================

create table if not exists public.user_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric not null default 0 check (balance >= 0),
  currency text not null default 'EGP',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_wallets_is_active
  on public.user_wallets (is_active);


-- =========================================================
-- 3) WALLET TRANSACTIONS
-- =========================================================

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_direction text not null
    check (wallet_direction in ('credit', 'debit')),
  transaction_type text not null
    check (
      transaction_type in (
        'signup_bonus',
        'referral_bonus',
        'deposit_approved',
        'manual_adjustment',
        'booking_payment',
        'rent_auto_deduction',
        'refund',
        'discount_applied'
      )
    ),
  amount numeric not null check (amount > 0),
  balance_before numeric not null default 0,
  balance_after numeric not null default 0,
  reference_table text,
  reference_id text,
  notes text,
  created_by_admin_id uuid references public.admin_users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_wallet_transactions_user_id
  on public.wallet_transactions (user_id);

create index if not exists idx_wallet_transactions_type
  on public.wallet_transactions (transaction_type);

create index if not exists idx_wallet_transactions_created_at
  on public.wallet_transactions (created_at desc);


-- =========================================================
-- 4) WALLET DEPOSIT REQUESTS
-- =========================================================

create table if not exists public.wallet_deposit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  payment_method text not null
    check (
      payment_method in (
        'instapay',
        'vodafone_cash',
        'orange_cash',
        'etisalat_cash',
        'bank_transfer'
      )
    ),
  receipt_image_url text not null,
  sender_name text,
  sender_phone text,
  transaction_reference text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_by_admin_id uuid references public.admin_users(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_wallet_deposit_requests_user_id
  on public.wallet_deposit_requests (user_id);

create index if not exists idx_wallet_deposit_requests_status
  on public.wallet_deposit_requests (status);

create index if not exists idx_wallet_deposit_requests_created_at
  on public.wallet_deposit_requests (created_at desc);


-- =========================================================
-- 5) WALLET PAYMENT METHODS
-- =========================================================

create table if not exists public.wallet_payment_methods (
  id bigint generated always as identity primary key,
  code text not null unique,
  name_en text not null,
  name_ar text not null,
  account_name text,
  account_number text,
  iban text,
  qr_image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_wallet_payment_methods_is_active
  on public.wallet_payment_methods (is_active, sort_order);


-- =========================================================
-- 6) USER REFERRALS
-- =========================================================

create table if not exists public.user_referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  invited_user_id uuid not null unique references auth.users(id) on delete cascade,
  referral_code text not null,
  status text not null default 'pending'
    check (status in ('pending', 'qualified', 'rewarded', 'cancelled')),
  qualified_at timestamptz,
  rewarded_at timestamptz,
  inviter_reward_amount numeric not null default 0 check (inviter_reward_amount >= 0),
  invited_reward_amount numeric not null default 0 check (invited_reward_amount >= 0),
  source_reservation_id uuid references public.property_reservations(id),
  created_at timestamptz not null default now(),
  constraint user_referrals_no_self_referral check (inviter_user_id <> invited_user_id)
);

create index if not exists idx_user_referrals_inviter_user_id
  on public.user_referrals (inviter_user_id);

create index if not exists idx_user_referrals_status
  on public.user_referrals (status);

create index if not exists idx_user_referrals_created_at
  on public.user_referrals (created_at desc);


-- =========================================================
-- 7) RESERVATION PAYMENT EXTENSIONS
-- =========================================================

alter table public.property_reservations
add column if not exists wallet_amount_used numeric not null default 0,
add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'partial', 'paid', 'refunded'));

create index if not exists idx_property_reservations_payment_status
  on public.property_reservations (payment_status);


-- =========================================================
-- 8) RESERVATION PAYMENTS
-- =========================================================

create table if not exists public.reservation_payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.property_reservations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_method text not null
    check (payment_method in ('wallet', 'manual_transfer', 'cash', 'mixed')),
  amount numeric not null check (amount > 0),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'failed', 'refunded')),
  wallet_transaction_id uuid references public.wallet_transactions(id),
  deposit_request_id uuid references public.wallet_deposit_requests(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_reservation_payments_reservation_id
  on public.reservation_payments (reservation_id);

create index if not exists idx_reservation_payments_user_id
  on public.reservation_payments (user_id);

create index if not exists idx_reservation_payments_status
  on public.reservation_payments (status);


-- =========================================================
-- 9) BILLING CYCLES FOR MONTHLY RENT DEDUCTION
-- =========================================================

create table if not exists public.reservation_billing_cycles (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.property_reservations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  amount_due numeric not null check (amount_due > 0),
  due_date date not null,
  billing_period_start date,
  billing_period_end date,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled')),
  paid_at timestamptz,
  wallet_transaction_id uuid references public.wallet_transactions(id),
  attempt_count integer not null default 0,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reservation_billing_cycles_due_date
  on public.reservation_billing_cycles (due_date);

create index if not exists idx_reservation_billing_cycles_status
  on public.reservation_billing_cycles (status);

create index if not exists idx_reservation_billing_cycles_user_id
  on public.reservation_billing_cycles (user_id);

create index if not exists idx_reservation_billing_cycles_reservation_id
  on public.reservation_billing_cycles (reservation_id);


-- =========================================================
-- 10) UPDATED_AT HELPER
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_wallets_set_updated_at on public.user_wallets;
create trigger trg_user_wallets_set_updated_at
before update on public.user_wallets
for each row
execute function public.set_updated_at();

drop trigger if exists trg_wallet_deposit_requests_set_updated_at on public.wallet_deposit_requests;
create trigger trg_wallet_deposit_requests_set_updated_at
before update on public.wallet_deposit_requests
for each row
execute function public.set_updated_at();

drop trigger if exists trg_reservation_billing_cycles_set_updated_at on public.reservation_billing_cycles;
create trigger trg_reservation_billing_cycles_set_updated_at
before update on public.reservation_billing_cycles
for each row
execute function public.set_updated_at();


-- =========================================================
-- 11) REFERRAL CODE GENERATOR
-- =========================================================

create or replace function public.generate_referral_code(p_user_id uuid, p_full_name text default null)
returns text
language plpgsql
as $$
declare
  v_base text;
  v_candidate text;
  v_exists text;
begin
  v_base := upper(regexp_replace(coalesce(p_full_name, 'USER'), '[^A-Za-z0-9]+', '', 'g'));
  v_base := left(v_base, 4);

  if v_base is null or v_base = '' then
    v_base := 'USER';
  end if;

  loop
    v_candidate := v_base || right(replace(p_user_id::text, '-', ''), 6) || upper(substr(md5(random()::text), 1, 2));

    select referral_code
      into v_exists
    from public.user_profiles
    where referral_code = v_candidate
    limit 1;

    if v_exists is null then
      return v_candidate;
    end if;
  end loop;
end;
$$;


-- =========================================================
-- 12) CREATE WALLET / PROFILE HELPERS ON USER CREATION
-- =========================================================

create or replace function public.handle_new_user_wallet_and_referral()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_referral_code text;
begin
  insert into public.user_wallets (user_id, balance, currency, is_active)
  values (new.id, 0, 'EGP', true)
  on conflict (user_id) do nothing;

  select full_name
    into v_full_name
  from public.user_profiles
  where id = new.id;

  if exists (
    select 1
    from public.user_profiles
    where id = new.id
      and (referral_code is null or referral_code = '')
  ) then
    v_referral_code := public.generate_referral_code(new.id, v_full_name);

    update public.user_profiles
    set referral_code = v_referral_code,
        updated_at = now()
    where id = new.id
      and (referral_code is null or referral_code = '');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_auth_users_create_wallet_and_referral on auth.users;
create trigger trg_auth_users_create_wallet_and_referral
after insert on auth.users
for each row
execute function public.handle_new_user_wallet_and_referral();


-- =========================================================
-- 13) APPLY WALLET TRANSACTION
-- =========================================================

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
set search_path = public
as $$
declare
  v_wallet public.user_wallets%rowtype;
  v_before numeric;
  v_after numeric;
  v_tx_id uuid;
begin
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
  )
  values (
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


-- =========================================================
-- 14) APPROVE DEPOSIT REQUEST
-- =========================================================

create or replace function public.approve_wallet_deposit_request(
  p_deposit_request_id uuid,
  p_admin_user_id uuid,
  p_review_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.wallet_deposit_requests%rowtype;
  v_tx_id uuid;
begin
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

  return v_tx_id;
end;
$$;


-- =========================================================
-- 15) REJECT DEPOSIT REQUEST
-- =========================================================

create or replace function public.reject_wallet_deposit_request(
  p_deposit_request_id uuid,
  p_admin_user_id uuid,
  p_review_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.wallet_deposit_requests%rowtype;
begin
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


-- =========================================================
-- 16) BASIC RLS ENABLE
-- =========================================================

alter table public.user_wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.wallet_deposit_requests enable row level security;
alter table public.user_referrals enable row level security;
alter table public.reservation_payments enable row level security;
alter table public.reservation_billing_cycles enable row level security;

-- user_wallets
drop policy if exists "users can view own wallet" on public.user_wallets;
create policy "users can view own wallet"
on public.user_wallets
for select
to authenticated
using (auth.uid() = user_id);

-- wallet_transactions
drop policy if exists "users can view own wallet transactions" on public.wallet_transactions;
create policy "users can view own wallet transactions"
on public.wallet_transactions
for select
to authenticated
using (auth.uid() = user_id);

-- wallet_deposit_requests
drop policy if exists "users can view own deposit requests" on public.wallet_deposit_requests;
create policy "users can view own deposit requests"
on public.wallet_deposit_requests
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can create own deposit requests" on public.wallet_deposit_requests;
create policy "users can create own deposit requests"
on public.wallet_deposit_requests
for insert
to authenticated
with check (auth.uid() = user_id);

-- user_referrals
drop policy if exists "users can view own referrals as inviter or invited" on public.user_referrals;
create policy "users can view own referrals as inviter or invited"
on public.user_referrals
for select
to authenticated
using (auth.uid() = inviter_user_id or auth.uid() = invited_user_id);

-- reservation_payments
drop policy if exists "users can view own reservation payments" on public.reservation_payments;
create policy "users can view own reservation payments"
on public.reservation_payments
for select
to authenticated
using (auth.uid() = user_id);

-- reservation_billing_cycles
drop policy if exists "users can view own billing cycles" on public.reservation_billing_cycles;
create policy "users can view own billing cycles"
on public.reservation_billing_cycles
for select
to authenticated
using (auth.uid() = user_id);


-- =========================================================
-- 17) OPTIONAL SEED PAYMENT METHODS
-- =========================================================

insert into public.wallet_payment_methods (
  code, name_en, name_ar, account_name, account_number, is_active, sort_order
)
values
  ('instapay', 'InstaPay', 'انستا باي', null, null, true, 1),
  ('vodafone_cash', 'Vodafone Cash', 'فودافون كاش', null, null, true, 2),
  ('orange_cash', 'Orange Cash', 'أورنج كاش', null, null, true, 3),
  ('etisalat_cash', 'Etisalat Cash', 'اتصالات كاش', null, null, true, 4),
  ('bank_transfer', 'Bank Transfer', 'تحويل بنكي', null, null, true, 5)
on conflict (code) do nothing;

commit;