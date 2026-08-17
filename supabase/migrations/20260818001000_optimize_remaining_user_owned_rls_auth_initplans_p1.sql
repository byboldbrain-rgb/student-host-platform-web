-- Preserve existing user-ownership semantics while evaluating auth.uid() once
-- per statement instead of once per candidate row.

alter policy "Users can delete their own comments"
  on public.community_post_comments
  using ((select auth.uid()) = user_id);

alter policy "Users can create comments"
  on public.community_post_comments
  with check ((select auth.uid()) = user_id);

alter policy "Users can update their own comments"
  on public.community_post_comments
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can unlike their own likes"
  on public.community_post_likes
  using ((select auth.uid()) = user_id);

alter policy "Users can like posts"
  on public.community_post_likes
  with check ((select auth.uid()) = user_id);

alter policy "Users can create shares"
  on public.community_post_shares
  with check ((select auth.uid()) = user_id);

alter policy "Users can view their own waiting list matches"
  on public.property_waiting_list_matches
  using ((select auth.uid()) = user_id);

alter policy "Users can update their own waiting list matches"
  on public.property_waiting_list_matches
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can create their own waiting list requests"
  on public.property_waiting_list_requests
  with check ((select auth.uid()) = user_id);

alter policy "Users can view their own waiting list requests"
  on public.property_waiting_list_requests
  using ((select auth.uid()) = user_id);

alter policy "Users can update their own waiting list requests"
  on public.property_waiting_list_requests
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can view their own notifications"
  on public.user_notifications
  using ((select auth.uid()) = user_id);

alter policy "Users can update their own notifications"
  on public.user_notifications
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
