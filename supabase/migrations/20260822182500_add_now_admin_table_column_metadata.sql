-- Additive admin-only column metadata for employee-friendly Navienty Now forms.
-- Used only by authenticated Now admins to render the correct form control type.

create or replace function now.get_admin_table_columns(p_table_name text)
returns table (
  column_name text,
  data_type text,
  udt_name text,
  is_nullable boolean,
  column_default text,
  ordinal_position integer
)
language plpgsql
stable
security definer
set search_path to pg_catalog, information_schema, now, public, auth, pg_temp
as $$
begin
  perform now.get_admin_access_context();

  if p_table_name is null or p_table_name = '' then
    raise exception 'table_name_required';
  end if;

  return query
  select
    cols.column_name::text,
    cols.data_type::text,
    cols.udt_name::text,
    (cols.is_nullable = 'YES') as is_nullable,
    cols.column_default::text,
    cols.ordinal_position::integer
  from information_schema.columns as cols
  where cols.table_schema = 'now'
    and cols.table_name = p_table_name
  order by cols.ordinal_position;
end;
$$;

revoke all on function now.get_admin_table_columns(text) from public;
revoke all on function now.get_admin_table_columns(text) from anon;
grant execute on function now.get_admin_table_columns(text) to authenticated;
