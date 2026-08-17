-- P0 phase 3: shared finance tables are server/admin-only.
-- Applied to production on 2026-08-17 via Supabase migration
-- `lock_shared_finance_tables_to_trusted_server_p0`.
-- The web admin and owner portals use the server-side service-role client for these domains.

alter table public.accounting_ledger_entries enable row level security;
alter table public.owner_payables enable row level security;
alter table public.owner_payout_accounts enable row level security;
alter table public.owner_payout_reports enable row level security;
alter table public.owner_settlement_items enable row level security;
alter table public.owner_settlements enable row level security;
alter table public.platform_expenses enable row level security;
alter table public.platform_finance_settings enable row level security;
alter table public.rent_collection_receipts enable row level security;

revoke all privileges on table public.accounting_ledger_entries from anon, authenticated;
revoke all privileges on table public.owner_payables from anon, authenticated;
revoke all privileges on table public.owner_payout_accounts from anon, authenticated;
revoke all privileges on table public.owner_payout_reports from anon, authenticated;
revoke all privileges on table public.owner_settlement_items from anon, authenticated;
revoke all privileges on table public.owner_settlements from anon, authenticated;
revoke all privileges on table public.platform_expenses from anon, authenticated;
revoke all privileges on table public.platform_finance_settings from anon, authenticated;
revoke all privileges on table public.rent_collection_receipts from anon, authenticated;

-- Trigger helpers are internal implementation details, not RPC endpoints.
revoke execute on function public.ensure_single_default_owner_payout_account() from public, anon, authenticated;
revoke execute on function public.touch_owner_payout_accounts_updated_at() from public, anon, authenticated;
grant execute on function public.ensure_single_default_owner_payout_account() to service_role;
grant execute on function public.touch_owner_payout_accounts_updated_at() to service_role;