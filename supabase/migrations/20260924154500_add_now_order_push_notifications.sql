-- Navienty Now: opt-in Web Push notifications for newly created orders.
-- Additive only: existing admin push channels keep their current behavior.

alter table public.admin_push_subscriptions
  add column if not exists now_orders_enabled boolean not null default false;

create index if not exists admin_push_subscriptions_now_orders_enabled_idx
  on public.admin_push_subscriptions (admin_user_id)
  where is_active = true and now_orders_enabled = true;

comment on column public.admin_push_subscriptions.now_orders_enabled is
  'Whether this admin browser subscription should receive Navienty Now new-order push notifications.';

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'notify_new_now_order_webhook'
      and tgrelid = 'now.orders'::regclass
      and not tgisinternal
  ) then
    create trigger notify_new_now_order_webhook
      after insert on now.orders
      for each row
      execute function supabase_functions.http_request(
        'https://www.navienty.com/api/admin/now/orders/new-order-push',
        'POST',
        '{"Content-Type":"application/json"}',
        '{}',
        '3000'
      );
  end if;
end
$$;
