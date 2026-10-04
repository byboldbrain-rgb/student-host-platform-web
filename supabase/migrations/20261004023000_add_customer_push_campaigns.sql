-- Navienty Now: allow the Admin Dashboard to enqueue customer push campaigns
-- through the existing customer notification outbox/worker pipeline.

alter table now.customer_notification_outbox
  drop constraint if exists customer_notification_outbox_resource_type_check;

alter table now.customer_notification_outbox
  add constraint customer_notification_outbox_resource_type_check
  check (resource_type = any (array['order'::text, 'service_booking'::text, 'campaign'::text]));

create or replace function now.enqueue_admin_customer_campaign(
  p_title text,
  p_body text,
  p_url text default '/',
  p_category text default 'general',
  p_platform text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, now
as $$
declare
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := btrim(coalesce(p_body, ''));
  v_url text := btrim(coalesce(p_url, '/'));
  v_category text := lower(btrim(coalesce(p_category, 'general')));
  v_platform text := nullif(lower(btrim(coalesce(p_platform, ''))), '');
  v_campaign_id uuid := gen_random_uuid();
  v_queued integer := 0;
  v_channel_id text;
begin
  if char_length(v_title) < 1 or char_length(v_title) > 100 then
    raise exception 'invalid_notification_title';
  end if;

  if char_length(v_body) < 1 or char_length(v_body) > 220 then
    raise exception 'invalid_notification_body';
  end if;

  if v_category not in ('general', 'offers') then
    raise exception 'invalid_notification_category';
  end if;

  if v_platform is not null and v_platform not in ('ios', 'android') then
    raise exception 'invalid_notification_platform';
  end if;

  if v_url not in (
    '/',
    '/category/restaurants',
    '/category/supermarket',
    '/category/bookstore',
    '/category/personal-care',
    '/category/laundry',
    '/category/request-anything',
    '/orders',
    '/account'
  ) then
    raise exception 'invalid_notification_url';
  end if;

  v_channel_id := case when v_category = 'offers' then 'offers' else 'general' end;

  insert into now.customer_notification_outbox (
    user_id,
    resource_type,
    resource_id,
    event_key,
    title,
    body,
    data,
    status,
    attempt_count,
    next_attempt_at,
    channel_id,
    notification_category,
    campaign_id,
    template_key
  )
  select
    targets.user_id,
    'campaign',
    gen_random_uuid(),
    'admin_manual_campaign',
    v_title,
    v_body,
    jsonb_build_object(
      'type', 'navigation',
      'url', v_url,
      'source', 'admin_dashboard',
      'campaignId', v_campaign_id::text
    ),
    'pending',
    0,
    now(),
    v_channel_id,
    v_category,
    v_campaign_id::text,
    'admin_manual_campaign'
  from (
    select distinct cps.user_id
    from now.customer_push_subscriptions as cps
    where cps.is_active = true
      and (v_platform is null or cps.platform = v_platform)
  ) as targets;

  get diagnostics v_queued = row_count;

  return jsonb_build_object(
    'campaign_id', v_campaign_id::text,
    'queued_count', v_queued,
    'category', v_category,
    'platform', coalesce(v_platform, 'all'),
    'url', v_url
  );
end;
$$;

revoke all on function now.enqueue_admin_customer_campaign(text, text, text, text, text)
  from public, anon, authenticated;

grant execute on function now.enqueue_admin_customer_campaign(text, text, text, text, text)
  to service_role;

comment on function now.enqueue_admin_customer_campaign(text, text, text, text, text) is
  'Server-only fan-out for Admin-created customer push campaigns. Enqueues one outbox row per reachable customer and uses the existing Expo worker.';
