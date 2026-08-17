-- P0 phase 4: harden the shared admin authorization model.
-- Applied to production on 2026-08-17 via Supabase migration
-- `harden_shared_admin_authorization_surface_p0`.

alter table public.admin_audit_logs enable row level security;
alter table public.admin_permissions enable row level security;
alter table public.admin_role_permissions enable row level security;

revoke all privileges on table public.admin_audit_logs from anon, authenticated;
revoke all privileges on table public.admin_permissions from anon, authenticated;
revoke all privileges on table public.admin_role_permissions from anon, authenticated;

revoke all privileges on table public.admin_users from anon;
revoke insert, update, delete, truncate, references, trigger on table public.admin_users from authenticated;
grant select on table public.admin_users to authenticated;

revoke all privileges on table public.admin_role_assignments from anon;
revoke insert, update, delete, truncate, references, trigger on table public.admin_role_assignments from authenticated;
grant select on table public.admin_role_assignments to authenticated;

revoke all privileges on table public.admin_roles from anon;
revoke insert, update, delete, truncate, references, trigger on table public.admin_roles from authenticated;
grant select on table public.admin_roles to authenticated;

revoke all privileges on table public.admin_scopes from anon;
revoke insert, update, delete, truncate, references, trigger on table public.admin_scopes from authenticated;
grant select on table public.admin_scopes to authenticated;

revoke execute on function public.assign_admin_role(uuid,text,text,uuid) from public, anon, authenticated;
revoke execute on function public.deactivate_admin_role(uuid,text,text,uuid) from public, anon, authenticated;
grant execute on function public.assign_admin_role(uuid,text,text,uuid) to service_role;
grant execute on function public.deactivate_admin_role(uuid,text,text,uuid) to service_role;

create or replace function public.admin_has_permission(
  p_admin_user_id uuid,
  p_permission_code text,
  p_scope_code text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  v_result boolean;
begin
  if p_admin_user_id is null then
    return false;
  end if;

  if v_jwt_role <> 'service_role'
     and (auth.uid() is null or auth.uid() <> p_admin_user_id)
  then
    return false;
  end if;

  with recursive scope_tree as (
    select id, code, parent_scope_id
      from public.admin_scopes
     where code = p_scope_code

    union all

    select parent.id, parent.code, parent.parent_scope_id
      from public.admin_scopes parent
      join scope_tree child on child.parent_scope_id = parent.id
  )
  select exists (
    select 1
      from scope_tree st
      join public.admin_role_assignments ara
        on ara.scope_id = st.id
       and ara.admin_user_id = p_admin_user_id
       and ara.is_active = true
      join public.admin_users au
        on au.id = ara.admin_user_id
       and au.is_active = true
      join public.admin_role_permissions arp
        on arp.role_id = ara.role_id
      join public.admin_permissions ap
        on ap.id = arp.permission_id
     where ap.code = p_permission_code
  ) into v_result;

  return coalesce(v_result, false);
end;
$$;

create or replace function public.admin_has_exact_role(
  p_admin_user_id uuid,
  p_role_code text,
  p_scope_code text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  v_result boolean;
begin
  if p_admin_user_id is null then
    return false;
  end if;

  if v_jwt_role <> 'service_role'
     and (auth.uid() is null or auth.uid() <> p_admin_user_id)
  then
    return false;
  end if;

  select exists (
    select 1
      from public.admin_role_assignments ara
      join public.admin_roles ar on ar.id = ara.role_id
      join public.admin_scopes s on s.id = ara.scope_id
      join public.admin_users au on au.id = ara.admin_user_id
     where ara.admin_user_id = p_admin_user_id
       and ara.is_active = true
       and au.is_active = true
       and ar.code = p_role_code
       and s.code = p_scope_code
  ) into v_result;

  return coalesce(v_result, false);
end;
$$;

create or replace function public.admin_has_role_in_scope_tree(
  p_admin_user_id uuid,
  p_role_code text,
  p_scope_code text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  v_result boolean;
begin
  if p_admin_user_id is null then
    return false;
  end if;

  if v_jwt_role <> 'service_role'
     and (auth.uid() is null or auth.uid() <> p_admin_user_id)
  then
    return false;
  end if;

  with recursive scope_tree as (
    select id, code, parent_scope_id
      from public.admin_scopes
     where code = p_scope_code

    union all

    select parent.id, parent.code, parent.parent_scope_id
      from public.admin_scopes parent
      join scope_tree child on child.parent_scope_id = parent.id
  )
  select exists (
    select 1
      from scope_tree st
      join public.admin_role_assignments ara
        on ara.scope_id = st.id
       and ara.admin_user_id = p_admin_user_id
       and ara.is_active = true
      join public.admin_roles ar on ar.id = ara.role_id
      join public.admin_users au
        on au.id = ara.admin_user_id
       and au.is_active = true
     where ar.code = p_role_code
  ) into v_result;

  return coalesce(v_result, false);
end;
$$;

revoke execute on function public.admin_has_permission(uuid,text,text) from public, anon;
revoke execute on function public.admin_has_exact_role(uuid,text,text) from public, anon;
revoke execute on function public.admin_has_role_in_scope_tree(uuid,text,text) from public, anon;
grant execute on function public.admin_has_permission(uuid,text,text) to authenticated, service_role;
grant execute on function public.admin_has_exact_role(uuid,text,text) to authenticated, service_role;
grant execute on function public.admin_has_role_in_scope_tree(uuid,text,text) to authenticated, service_role;

revoke execute on function public.get_admin_role_id(text) from public, anon;
revoke execute on function public.get_admin_scope_id(text) from public, anon;
grant execute on function public.get_admin_role_id(text) to authenticated, service_role;
grant execute on function public.get_admin_scope_id(text) to authenticated, service_role;