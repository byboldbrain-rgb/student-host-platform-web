-- P0 phase 5: separate public property reads from trusted-server catalog writes,
-- and remove direct client access to owner/operational data.
-- Applied to production on 2026-08-17 via Supabase migration
-- `harden_shared_property_catalog_and_owner_data_p0`.

alter table public.property_owners enable row level security;
alter table public.property_owner_service_areas enable row level security;
revoke all privileges on table public.property_owners from anon, authenticated;
revoke all privileges on table public.property_owner_service_areas from anon, authenticated;

alter table public.property_reservation_allocations enable row level security;
revoke all privileges on table public.property_reservation_allocations from anon, authenticated;

alter table public.property_waiting_list_notification_logs enable row level security;
alter table public.property_waiting_list_push_subscriptions enable row level security;
revoke all privileges on table public.property_waiting_list_notification_logs from anon, authenticated;
revoke all privileges on table public.property_waiting_list_push_subscriptions from anon, authenticated;

revoke insert, update, delete, truncate, references, trigger on table public.properties from authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.property_amenities from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.property_areas from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.property_bill_includes from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.property_facilities from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.property_images from authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.property_option_seasonal_prices from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.property_pricing_seasons from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.property_room_sellable_options from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.property_room_types from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.property_rooms from authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.property_sellable_options from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.property_universities from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.property_videos from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.room_beds from authenticated;

drop policy if exists "Allow insert for authenticated users" on public.properties;
drop policy if exists "Anyone can delete properties" on public.properties;
drop policy if exists "Anyone can insert properties" on public.properties;