-- Pin the search_path for the exact public functions reported by the Supabase
-- Security Advisor. This changes function configuration only; function bodies
-- and application contracts are unchanged.
--
-- pg_catalog is first to avoid shadowing built-ins. public/auth/extensions are
-- retained because these legacy functions reference objects/functions there.

do $$
declare
  r record;
  v_names text[] := array[
    'set_updated_at_property_room_types',
    'generate_referral_code',
    'set_updated_at',
    'set_current_timestamp_updated_at',
    'generate_finance_number',
    'update_messenger_bot_sessions_updated_at',
    'get_service_scope_code_by_category_id',
    'get_career_scope_code_by_category_id',
    'sync_room_status',
    'sync_property_summary',
    'handle_room_beds_change',
    'handle_property_rooms_change',
    'handle_bed_reservations_change',
    'prevent_owner_settlement_financial_edits',
    'prevent_platform_invoice_financial_edits',
    'ensure_single_default_owner_payout_account',
    'touch_owner_payout_accounts_updated_at',
    'set_property_alert_requests_updated_at',
    'set_property_booking_requests_updated_at',
    'set_user_profiles_updated_at',
    'finance_generate_number',
    'finance_prevent_posted_entry_mutation',
    'generate_property_reservation_confirmation_code',
    'finance_refresh_journal_totals',
    'finance_refresh_journal_totals_trigger',
    'finance_assert_entry_is_editable',
    'set_updated_at_now',
    'recalc_property_room_status',
    'recalc_property_status',
    'assign_admin_role',
    'deactivate_admin_role',
    'finance_validate_journal_entry',
    'finance_refresh_reservation_payment_status',
    'get_admin_role_id',
    'get_admin_scope_id'
  ];
begin
  for r in
    select p.oid::regprocedure as fn
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(v_names)
      and p.proconfig is null
  loop
    execute format(
      'alter function %s set search_path = pg_catalog, public, auth, extensions',
      r.fn
    );
  end loop;
end
$$;
