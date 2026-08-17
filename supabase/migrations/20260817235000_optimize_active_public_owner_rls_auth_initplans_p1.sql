-- Preserve existing ownership checks while evaluating auth.uid() through a
-- statement init-plan rather than once per candidate row.

alter policy admin_role_assignments_select_own
  on public.admin_role_assignments
  using (admin_user_id = (select auth.uid()));

alter policy admin_users_select_own_record
  on public.admin_users
  using (id = (select auth.uid()));

alter policy "Authenticated users can insert own property booking requests"
  on public.property_booking_requests
  with check (user_id = (select auth.uid()));

alter policy "Users can view own property booking requests"
  on public.property_booking_requests
  using (user_id = (select auth.uid()));

alter policy "Users can create their own reservations"
  on public.property_reservations
  with check (user_id = (select auth.uid()));

alter policy "Users can view their own reservations"
  on public.property_reservations
  using (user_id = (select auth.uid()));

alter policy "users can view own billing cycles"
  on public.reservation_billing_cycles
  using (user_id = (select auth.uid()));

alter policy "users can view own reservation payments"
  on public.reservation_payments
  using (user_id = (select auth.uid()));

alter policy "users can view own referrals as inviter or invited"
  on public.user_referrals
  using (((select auth.uid()) = inviter_user_id) or ((select auth.uid()) = invited_user_id));

alter policy "users can view own wallet"
  on public.user_wallets
  using (user_id = (select auth.uid()));

alter policy "users can create own deposit requests"
  on public.wallet_deposit_requests
  with check (user_id = (select auth.uid()));

alter policy "users can view own deposit requests"
  on public.wallet_deposit_requests
  using (user_id = (select auth.uid()));

alter policy "users can view own wallet transactions"
  on public.wallet_transactions
  using (user_id = (select auth.uid()));
