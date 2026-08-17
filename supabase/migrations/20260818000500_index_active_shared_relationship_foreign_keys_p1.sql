-- Add covering indexes only for active/shared foreign-key relationships that
-- grow with real product usage or support common joins/cleanup paths. Dormant
-- zero-row legacy modules and low-value created_by/updated_by audit columns are
-- intentionally excluded.

create index if not exists property_option_seasonal_prices_property_id_idx
  on public.property_option_seasonal_prices(property_id);

create index if not exists property_option_seasonal_prices_season_id_idx
  on public.property_option_seasonal_prices(season_id);

create index if not exists property_alert_notifications_property_id_idx
  on public.property_alert_notifications(property_id);

create index if not exists property_alert_notifications_user_id_idx
  on public.property_alert_notifications(user_id);

create index if not exists property_owner_service_areas_university_id_idx
  on public.property_owner_service_areas(university_id);

create index if not exists property_alert_requests_user_id_idx
  on public.property_alert_requests(user_id);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions(user_id);

create index if not exists property_booking_requests_requested_season_id_idx
  on public.property_booking_requests(requested_season_id);

create index if not exists property_reservations_season_id_idx
  on public.property_reservations(season_id);

create index if not exists user_profiles_city_id_idx
  on public.user_profiles(city_id);

create index if not exists user_profiles_university_id_idx
  on public.user_profiles(university_id);

create index if not exists user_profiles_college_id_idx
  on public.user_profiles(college_id);

create index if not exists whatsapp_click_intents_linked_booking_request_id_idx
  on public.whatsapp_click_intents(linked_booking_request_id);

create index if not exists whatsapp_click_intents_linked_conversation_id_idx
  on public.whatsapp_click_intents(linked_conversation_id);

create index if not exists whatsapp_conversations_related_booking_request_id_idx
  on public.whatsapp_conversations(related_booking_request_id);

create index if not exists whatsapp_conversations_related_reservation_id_idx
  on public.whatsapp_conversations(related_reservation_id);

create index if not exists whatsapp_contacts_broker_id_idx
  on public.whatsapp_contacts(broker_id);
