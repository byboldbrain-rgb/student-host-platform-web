-- Additive admin-only schema introspection for Navienty Now.
-- This keeps the Admin Control Center aware of future tables added to the `now` schema
-- without exposing information_schema/pg_catalog directly to clients.

create or replace function now.get_admin_schema_catalog()
returns table (
  table_name text,
  primary_key_columns text[],
  column_names text[]
)
language plpgsql
stable
security definer
set search_path to pg_catalog, now, public, auth, pg_temp
as $$
begin
  -- Reuse the existing Navienty Now admin membership check. This raises when the
  -- caller is not an active platform admin / Now admin.
  perform now.get_admin_access_context();

  return query
  select
    cls.relname::text as table_name,
    coalesce(
      (
        select array_agg(att.attname::text order by key_columns.ordinality)
        from pg_constraint as con
        cross join lateral unnest(con.conkey)
          with ordinality as key_columns(attnum, ordinality)
        join pg_attribute as att
          on att.attrelid = cls.oid
         and att.attnum = key_columns.attnum
        where con.conrelid = cls.oid
          and con.contype = 'p'
      ),
      array[]::text[]
    ) as primary_key_columns,
    coalesce(
      (
        select array_agg(att.attname::text order by att.attnum)
        from pg_attribute as att
        where att.attrelid = cls.oid
          and att.attnum > 0
          and not att.attisdropped
      ),
      array[]::text[]
    ) as column_names
  from pg_class as cls
  join pg_namespace as ns
    on ns.oid = cls.relnamespace
  where ns.nspname = 'now'
    and cls.relkind in ('r', 'p')
  order by cls.relname;
end;
$$;

revoke all on function now.get_admin_schema_catalog() from public;
revoke all on function now.get_admin_schema_catalog() from anon;
grant execute on function now.get_admin_schema_catalog() to authenticated;
