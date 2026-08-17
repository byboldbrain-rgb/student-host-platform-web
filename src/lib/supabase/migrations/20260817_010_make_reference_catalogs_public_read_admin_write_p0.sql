-- P0 phase 10: public reference catalogs are readable by clients,
-- but only authenticated property admins may mutate location catalogs.
-- Other reference catalogs are trusted-server write only.
-- Applied to production on 2026-08-17 via Supabase migration
-- `make_reference_catalogs_public_read_admin_write_p0`.

alter table public.cities enable row level security;
alter table public.property_areas enable row level security;
alter table public.universities enable row level security;
alter table public.university_property_areas enable row level security;

revoke all privileges on table public.cities from anon, authenticated;
revoke all privileges on table public.property_areas from anon, authenticated;
revoke all privileges on table public.universities from anon, authenticated;
revoke all privileges on table public.university_property_areas from anon, authenticated;

grant select on table public.cities to anon, authenticated;
grant select on table public.property_areas to anon, authenticated;
grant select on table public.universities to anon, authenticated;
grant select on table public.university_property_areas to anon, authenticated;
grant insert, update, delete on table public.cities to authenticated;
grant insert, update, delete on table public.property_areas to authenticated;
grant insert, update, delete on table public.universities to authenticated;
grant insert, update, delete on table public.university_property_areas to authenticated;

drop policy if exists cities_public_read on public.cities;
create policy cities_public_read on public.cities for select to anon, authenticated using (true);
drop policy if exists property_areas_public_read on public.property_areas;
create policy property_areas_public_read on public.property_areas for select to anon, authenticated using (true);
drop policy if exists universities_public_read on public.universities;
create policy universities_public_read on public.universities for select to anon, authenticated using (true);
drop policy if exists university_property_areas_public_read on public.university_property_areas;
create policy university_property_areas_public_read on public.university_property_areas for select to anon, authenticated using (true);

drop policy if exists cities_properties_admin_write on public.cities;
create policy cities_properties_admin_write on public.cities for all to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.id = (select auth.uid()) and au.is_active = true
      and (au.role = 'super_admin' or au.department = 'properties')
  )
)
with check (
  exists (
    select 1 from public.admin_users au
    where au.id = (select auth.uid()) and au.is_active = true
      and (au.role = 'super_admin' or au.department = 'properties')
  )
);

drop policy if exists property_areas_properties_admin_write on public.property_areas;
create policy property_areas_properties_admin_write on public.property_areas for all to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.id = (select auth.uid()) and au.is_active = true
      and (au.role = 'super_admin' or au.department = 'properties')
  )
)
with check (
  exists (
    select 1 from public.admin_users au
    where au.id = (select auth.uid()) and au.is_active = true
      and (au.role = 'super_admin' or au.department = 'properties')
  )
);

drop policy if exists universities_properties_admin_write on public.universities;
create policy universities_properties_admin_write on public.universities for all to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.id = (select auth.uid()) and au.is_active = true
      and (au.role = 'super_admin' or au.department = 'properties')
  )
)
with check (
  exists (
    select 1 from public.admin_users au
    where au.id = (select auth.uid()) and au.is_active = true
      and (au.role = 'super_admin' or au.department = 'properties')
  )
);

drop policy if exists university_property_areas_properties_admin_write on public.university_property_areas;
create policy university_property_areas_properties_admin_write on public.university_property_areas for all to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.id = (select auth.uid()) and au.is_active = true
      and (au.role = 'super_admin' or au.department = 'properties')
  )
)
with check (
  exists (
    select 1 from public.admin_users au
    where au.id = (select auth.uid()) and au.is_active = true
      and (au.role = 'super_admin' or au.department = 'properties')
  )
);

revoke insert, update, delete, truncate, references, trigger on table public.amenities from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.bill_types from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.wallet_payment_methods from anon, authenticated;
grant select on table public.amenities to anon, authenticated;
grant select on table public.bill_types to anon, authenticated;
grant select on table public.wallet_payment_methods to anon, authenticated;