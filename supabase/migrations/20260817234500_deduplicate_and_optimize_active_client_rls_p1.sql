-- Remove confirmed redundant permissive policies and evaluate auth.uid() once
-- per statement rather than once per row. Existing client access semantics are
-- preserved.

drop policy if exists client_read_properties
  on public.properties;

drop policy if exists "Users can read their own property alert requests"
  on public.property_alert_requests;

alter policy "Users can view their own property alert requests"
  on public.property_alert_requests
  using ((select auth.uid()) = user_id);

alter policy "Anyone can create property alert requests"
  on public.property_alert_requests
  with check (((user_id = (select auth.uid())) or (user_id is null)));

drop policy if exists "Users can view their own push subscriptions"
  on public.push_subscriptions;

alter policy "Anyone can view matching push subscriptions"
  on public.push_subscriptions
  using (((user_id = (select auth.uid())) or (user_id is null)));

alter policy "Anyone can create push subscriptions"
  on public.push_subscriptions
  with check (((user_id = (select auth.uid())) or (user_id is null)));

alter policy "Anyone can update push subscriptions"
  on public.push_subscriptions
  using (((user_id = (select auth.uid())) or (user_id is null)))
  with check (((user_id = (select auth.uid())) or (user_id is null)));

drop policy if exists "Users can view their own profile"
  on public.user_profiles;

drop policy if exists "Users can update their own profile"
  on public.user_profiles;

alter policy "Users can view own profile"
  on public.user_profiles
  using ((select auth.uid()) = id);

alter policy "Users can insert own profile"
  on public.user_profiles
  with check ((select auth.uid()) = id);

alter policy "Users can update own profile"
  on public.user_profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
