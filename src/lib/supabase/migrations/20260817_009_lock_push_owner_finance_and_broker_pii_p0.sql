-- P0 phase 9: close remaining high-value PII/financial/token tables.
-- Applied to production on 2026-08-17 via Supabase migration
-- `lock_push_owner_finance_and_broker_pii_p0`.

alter table public.community_push_subscriptions enable row level security;
revoke all privileges on table public.community_push_subscriptions from anon, authenticated;

alter table public.owner_properties enable row level security;
alter table public.platform_fee_invoices enable row level security;
alter table public.platform_fee_invoice_items enable row level security;
revoke all privileges on table public.owner_properties from anon, authenticated;
revoke all privileges on table public.platform_fee_invoices from anon, authenticated;
revoke all privileges on table public.platform_fee_invoice_items from anon, authenticated;

alter table public.brokers enable row level security;
alter table public.broker_universities enable row level security;

revoke all privileges on table public.brokers from anon, authenticated;
revoke all privileges on table public.broker_universities from anon, authenticated;
grant select, insert, update, delete on table public.brokers to authenticated;
grant select, insert, update, delete on table public.broker_universities to authenticated;

drop policy if exists brokers_super_admin_all on public.brokers;
create policy brokers_super_admin_all
on public.brokers
for all
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.id = (select auth.uid())
      and au.is_active = true
      and au.role = 'super_admin'
  )
)
with check (
  exists (
    select 1
    from public.admin_users au
    where au.id = (select auth.uid())
      and au.is_active = true
      and au.role = 'super_admin'
  )
);

drop policy if exists broker_universities_super_admin_all on public.broker_universities;
create policy broker_universities_super_admin_all
on public.broker_universities
for all
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.id = (select auth.uid())
      and au.is_active = true
      and au.role = 'super_admin'
  )
)
with check (
  exists (
    select 1
    from public.admin_users au
    where au.id = (select auth.uid())
      and au.is_active = true
      and au.role = 'super_admin'
  )
);