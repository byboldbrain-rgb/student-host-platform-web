-- Preserve current anonymous/authenticated public reads while enforcing RLS
-- and removing every non-SELECT client privilege on active catalog/reference
-- tables. Trusted server/service-role writes continue to bypass RLS.

do $$
declare
  v_table text;
  v_policy text;
begin
  foreach v_table in array array[
    'properties',
    'property_images',
    'property_amenities',
    'property_facilities',
    'property_bill_includes',
    'property_rooms',
    'property_sellable_options',
    'property_universities',
    'property_room_sellable_options',
    'property_room_types',
    'room_beds',
    'system_settings',
    'wallet_payment_methods',
    'service_categories'
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
