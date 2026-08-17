-- P0 defense-in-depth for legacy/dormant modules that were still exposed
-- through the Data API with RLS disabled and historical client CRUD grants.
--
-- Safety invariant: this migration refuses to change ANY table unless every
-- listed module table is exactly empty at execution time. This prevents stale
-- planner statistics from causing a populated domain to be locked by mistake.
-- Current web/mobile code had no references to these legacy module surfaces at
-- the time of lockdown. Trusted service-role/server access remains available.

do $$
declare
  v_table text;
  v_count bigint;
  v_tables text[] := array[
    'bed_reservations',
    'career_applications',
    'career_categories',
    'career_opportunities',
    'career_opportunity_assets',
    'city_delivery_areas',
    'coworking_booking_request_logs',
    'coworking_booking_requests',
    'coworking_space_images',
    'coworking_space_unit_images',
    'coworking_space_units',
    'coworking_space_universities',
    'coworking_spaces',
    'health_doctor_specialties',
    'health_doctors',
    'lost_categories',
    'lost_claim_requests',
    'lost_found_items',
    'lost_item_images',
    'lost_items',
    'loyalty_offers',
    'platform_sections',
    'provider_business_hours',
    'provider_delivery_area_fees',
    'provider_delivery_area_overrides',
    'restaurant_delivery_zones',
    'restaurant_menu_item_variants',
    'restaurant_order_items',
    'restaurant_orders',
    'service_orders',
    'service_provider_assets',
    'service_provider_subcategories',
    'service_provider_universities',
    'service_providers',
    'service_subcategories',
    'student_activities',
    'student_activity_form_questions',
    'student_activity_heads',
    'student_activity_join_forms',
    'student_activity_join_request_answers',
    'student_activity_join_requests',
    'student_activity_posts',
    'user_activity_logs',
    'user_favorites',
    'user_loyalty_points',
    'user_loyalty_redemptions'
  ];
begin
  foreach v_table in array v_tables
  loop
    execute format(
      'select count(*) from public.%I',
      v_table
    ) into v_count;

    if v_count <> 0 then
      raise exception
        'Refusing dormant-module lockdown: public.% contains % row(s)',
        v_table,
        v_count;
    end if;
  end loop;

  foreach v_table in array v_tables
  loop
    execute format(
      'alter table public.%I enable row level security',
      v_table
    );

    execute format(
      'revoke all privileges on table public.%I from anon, authenticated',
      v_table
    );
  end loop;
end
$$;
