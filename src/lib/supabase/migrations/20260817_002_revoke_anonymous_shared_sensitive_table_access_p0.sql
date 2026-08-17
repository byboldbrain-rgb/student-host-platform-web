-- P0 phase 2: remove anonymous access from private shared-domain tables
-- and remove anonymous mutations from public catalog/property tables.
-- Applied to production on 2026-08-17 via Supabase migration
-- `revoke_anonymous_shared_sensitive_table_access_p0`.

-- Finance/admin/order data is never a public anonymous API surface.
revoke all privileges on table public.accounting_ledger_entries from anon;
revoke all privileges on table public.admin_audit_logs from anon;
revoke all privileges on table public.admin_permissions from anon;
revoke all privileges on table public.admin_role_permissions from anon;
revoke all privileges on table public.owner_payables from anon;
revoke all privileges on table public.owner_payout_accounts from anon;
revoke all privileges on table public.owner_payout_reports from anon;
revoke all privileges on table public.owner_settlement_items from anon;
revoke all privileges on table public.owner_settlements from anon;
revoke all privileges on table public.platform_expenses from anon;
revoke all privileges on table public.platform_finance_settings from anon;
revoke all privileges on table public.rent_collection_receipts from anon;
revoke all privileges on table public.restaurant_orders from anon;
revoke all privileges on table public.restaurant_order_items from anon;
revoke all privileges on table public.service_orders from anon;

-- Global settings are server/admin managed. Anonymous clients must not mutate them.
revoke insert, update, delete, truncate, references, trigger on table public.system_settings from anon;

-- Property/catalog data remains anonymously readable for the live public website,
-- but anonymous mutation is never valid.
revoke insert, update, delete, truncate, references, trigger on table public.properties from anon;
revoke insert, update, delete, truncate, references, trigger on table public.property_images from anon;
revoke insert, update, delete, truncate, references, trigger on table public.property_rooms from anon;
revoke insert, update, delete, truncate, references, trigger on table public.room_beds from anon;
revoke insert, update, delete, truncate, references, trigger on table public.property_reservation_allocations from anon;