-- P0 phase 11: service category reference data may be read by clients, never mutated directly.
-- Applied to production on 2026-08-17 via Supabase migration
-- `make_service_categories_client_read_only_p0`.

revoke insert, update, delete, truncate, references, trigger on table public.service_categories from anon, authenticated;
grant select on table public.service_categories to anon, authenticated, service_role;