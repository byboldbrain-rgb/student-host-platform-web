-- `community_post_stats` is not consumed by the current web application and
-- previously executed with view-owner privileges for public clients. Keep it
-- available to trusted server code only rather than broadening direct access
-- to `community_posts` solely to preserve this unused aggregate surface.

revoke all privileges on table public.community_post_stats
  from public, anon, authenticated;

alter view public.community_post_stats
  set (security_invoker = true);

grant select on table public.community_post_stats
  to service_role;
