-- Preserve intended public reads on reference catalogs while denying all
-- client-side mutation privileges. Remove anonymous access to helper RPCs that
-- require a signed-in user context, and make the public SEO view security
-- invoker now that its source tables have explicit public-read RLS policies.

do $$
declare
  v_table text;
  v_policy text;
begin
  foreach v_table in array array[
    'amenities',
    'facilities',
    'bill_types',
    'colleges',
    'currencies'
  ]
  loop
    execute format(
      'alter table public.%I enable row level security',
      v_table
    );

    execute format(
      'revoke all privileges on table public.%I from anon, authenticated',
      v_table
    );

    execute format(
      'grant select on table public.%I to anon, authenticated',
      v_table
    );

    v_policy := 'client_read_' || v_table;

    execute format(
      'drop policy if exists %I on public.%I',
      v_policy,
      v_table
    );

    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      v_policy,
      v_table
    );
  end loop;
end
$$;

revoke execute on function public.get_active_wallet_payment_account(text)
  from public, anon;
grant execute on function public.get_active_wallet_payment_account(text)
  to authenticated, service_role;

revoke execute on function public.is_whatsapp_admin()
  from public, anon;
grant execute on function public.is_whatsapp_admin()
  to authenticated, service_role;

alter view public.sakan_seo_pages
  set (security_invoker = true);
