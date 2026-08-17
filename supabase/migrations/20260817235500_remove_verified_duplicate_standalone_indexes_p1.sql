-- Remove only standalone indexes that were verified to be exact duplicates of
-- another retained index. The migration re-validates structural equivalence
-- and refuses to proceed if any candidate has a non-internal dependency.
-- Duplicate UNIQUE constraints are intentionally not handled here because
-- they are schema-contract changes and require separate review.

do $$
declare
  r record;
  v_candidate_oid oid;
  v_keep_oid oid;
  v_equivalent boolean;
  v_has_dependents boolean;
begin
  for r in
    select * from (values
      ('admin_push_subscriptions_endpoint_unique_idx', 'admin_push_subscriptions_endpoint_key'),
      ('owner_payout_accounts_one_default_per_broker_idx', 'owner_payout_accounts_one_default_active_per_broker_idx'),
      ('idx_property_booking_requests_requested_option_code', 'property_booking_requests_requested_option_code_idx'),
      ('idx_property_reservations_room_sellable_option_id', 'property_reservations_room_sellable_option_id_idx'),
      ('idx_property_universities_property_id', 'property_universities_property_idx'),
      ('idx_property_universities_university_id', 'property_universities_university_idx'),
      ('uq_provider_delivery_area_overrides_provider_area', 'provider_delivery_area_overrides_provider_id_area_id_key'),
      ('push_subscriptions_endpoint_unique_idx', 'push_subscriptions_endpoint_key'),
      ('idx_whatsapp_messages_meta_message_id', 'whatsapp_messages_meta_message_id_idx'),
      ('idx_whatsapp_messages_wamid', 'whatsapp_messages_wamid_idx')
    ) as pairs(candidate_name, keep_name)
  loop
    select ci.oid, ki.oid,
           (
             cix.indrelid = kix.indrelid
             and cix.indisunique = kix.indisunique
             and cix.indkey = kix.indkey
             and cix.indclass = kix.indclass
             and cix.indcollation = kix.indcollation
             and cix.indoption = kix.indoption
             and coalesce(pg_get_expr(cix.indexprs, cix.indrelid), '') = coalesce(pg_get_expr(kix.indexprs, kix.indrelid), '')
             and coalesce(pg_get_expr(cix.indpred, cix.indrelid), '') = coalesce(pg_get_expr(kix.indpred, kix.indrelid), '')
           )
      into v_candidate_oid, v_keep_oid, v_equivalent
    from pg_class ci
    join pg_namespace cin on cin.oid = ci.relnamespace and cin.nspname = 'public'
    join pg_index cix on cix.indexrelid = ci.oid
    join pg_class ki on ki.relname = r.keep_name and ki.relkind = 'i'
    join pg_namespace kin on kin.oid = ki.relnamespace and kin.nspname = 'public'
    join pg_index kix on kix.indexrelid = ki.oid
    where ci.relname = r.candidate_name
      and ci.relkind = 'i';

    if v_candidate_oid is null or v_keep_oid is null or v_equivalent is not true then
      raise exception
        'Refusing duplicate-index cleanup: % is not verified equivalent to %',
        r.candidate_name,
        r.keep_name;
    end if;

    select exists(
      select 1
      from pg_depend d
      where d.refobjid = v_candidate_oid
        and d.deptype not in ('i','a')
    ) into v_has_dependents;

    if v_has_dependents then
      raise exception
        'Refusing duplicate-index cleanup: % has dependent objects',
        r.candidate_name;
    end if;

    execute format(
      'drop index public.%I',
      r.candidate_name
    );
  end loop;
end
$$;
