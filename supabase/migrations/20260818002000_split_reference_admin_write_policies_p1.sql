-- Public reads on these reference tables are unconditional. Their previous
-- authenticated admin FOR ALL policy therefore duplicated SELECT evaluation.
-- Split that admin policy into write-only INSERT / UPDATE / DELETE policies
-- with the exact same admin predicate. Public/admin SELECT semantics remain
-- unchanged through the existing public-read policy.

do $$
declare
  v_table text;
  v_old_policy text;
  v_prefix text;
  v_admin_predicate text := '(exists (select 1 from public.admin_users au where au.id = (select auth.uid()) and au.is_active = true and (au.role = ''super_admin'' or au.department = ''properties'')))';
begin
  foreach v_table in array array[
    'cities',
    'property_areas',
    'universities',
    'university_property_areas'
  ]
  loop
    v_old_policy := v_table || '_properties_admin_write';
    v_prefix := v_table || '_properties_admin_';

    execute format(
      'drop policy if exists %I on public.%I',
      v_old_policy,
      v_table
    );

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (%s)',
      v_prefix || 'insert',
      v_table,
      v_admin_predicate
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using (%s) with check (%s)',
      v_prefix || 'update',
      v_table,
      v_admin_predicate,
      v_admin_predicate
    );

    execute format(
      'create policy %I on public.%I for delete to authenticated using (%s)',
      v_prefix || 'delete',
      v_table,
      v_admin_predicate
    );
  end loop;
end
$$;
