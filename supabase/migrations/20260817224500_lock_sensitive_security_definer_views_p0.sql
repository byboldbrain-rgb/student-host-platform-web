-- P0: sensitive SECURITY DEFINER views were directly readable by anon and
-- authenticated roles, bypassing the protections on their underlying tables.
-- Keep server/service-role access while removing public client access and make
-- the views SECURITY INVOKER for defense in depth.

do $$
declare
  v_view text;
begin
  foreach v_view in array array[
    'finance_owner_payables_summary',
    'finance_platform_revenue_summary',
    'finance_unsettled_owner_payables',
    'property_owner_finance_summary',
    'property_waiting_list_requests_with_details',
    'v_admin_assignments',
    'active_property_reservation_allocations',
    'finance_trial_balance_v',
    'finance_manual_transactions_v',
    'finance_monthly_summary_v',
    'wallet_payment_method_accounts_analytics'
  ]
  loop
    execute format(
      'revoke all privileges on table public.%I from public, anon, authenticated',
      v_view
    );

    execute format(
      'alter view public.%I set (security_invoker = true)',
      v_view
    );

    execute format(
      'grant select on table public.%I to service_role',
      v_view
    );
  end loop;
end
$$;
