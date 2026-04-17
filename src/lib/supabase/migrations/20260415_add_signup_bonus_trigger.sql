-- 1) helper function to generate referral code
create or replace function public.generate_referral_code(input_user_id uuid)
returns text
language plpgsql
as $$
declare
  generated_code text;
begin
  generated_code := upper(substr(replace(input_user_id::text, '-', ''), 1, 8));
  return generated_code;
end;
$$;

-- 2) function to handle new auth user
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_bonus_amount numeric := 50; -- عدل القيمة هنا
  generated_referral_code text;
  balance_before_value numeric := 0;
  balance_after_value numeric := 0;
begin
  generated_referral_code := public.generate_referral_code(new.id);

  insert into public.user_profiles (
    id,
    full_name,
    phone,
    referral_code,
    created_at,
    updated_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    generated_referral_code,
    now(),
    now()
  )
  on conflict (id) do nothing;

  insert into public.user_wallets (
    user_id,
    balance,
    currency,
    is_active,
    created_at,
    updated_at
  )
  values (
    new.id,
    0,
    'EGP',
    true,
    now(),
    now()
  )
  on conflict (user_id) do nothing;

  if signup_bonus_amount > 0 then
    select balance
      into balance_before_value
    from public.user_wallets
    where user_id = new.id
    for update;

    balance_before_value := coalesce(balance_before_value, 0);
    balance_after_value := balance_before_value + signup_bonus_amount;

    update public.user_wallets
    set balance = balance_after_value,
        updated_at = now()
    where user_id = new.id;

    update public.user_profiles
    set wallet_cached_balance = balance_after_value,
        updated_at = now()
    where id = new.id;

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
      created_at
    )
    values (
      new.id,
      'credit',
      'signup_bonus',
      signup_bonus_amount,
      balance_before_value,
      balance_after_value,
      'user_profiles',
      new.id::text,
      'Signup bonus',
      now()
    );
  end if;

  return new;
end;
$$;

-- 3) trigger
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();