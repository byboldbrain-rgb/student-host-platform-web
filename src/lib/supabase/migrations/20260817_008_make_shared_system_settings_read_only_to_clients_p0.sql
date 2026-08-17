-- P0 phase 8: clients may read public runtime settings, but only trusted server code may mutate them.
-- Applied to production on 2026-08-17 via Supabase migration
-- `make_shared_system_settings_read_only_to_clients_p0`.

revoke insert, update, delete, truncate, references, trigger on table public.system_settings from authenticated;
grant select on table public.system_settings to anon, authenticated, service_role;