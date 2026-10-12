-- Manual observation only: does not assign riders or mutate the order lifecycle.
create table if not exists now.manual_dispatch_decisions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references now.orders(id) on delete restrict,
  rider_name text not null check (char_length(btrim(rider_name)) between 2 and 100),
  reason text not null check (reason in (
    'same_area','same_store','available','customer_group',
    'fast_prep','next_trip','other'
  )),
  trip_slot text not null check (trip_slot in ('current','next')),
  trip_stage text not null check (trip_stage in (
    'before_pickup','collecting','to_hub','returning','unknown'
  )),
  note text check (note is null or char_length(note) <= 500),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists manual_dispatch_decisions_order_time_idx
  on now.manual_dispatch_decisions(order_id, created_at desc);
create index if not exists manual_dispatch_decisions_created_time_idx
  on now.manual_dispatch_decisions(created_at desc);
alter table now.manual_dispatch_decisions enable row level security;
revoke all on now.manual_dispatch_decisions from anon, authenticated;
grant select, insert on now.manual_dispatch_decisions to service_role;
comment on table now.manual_dispatch_decisions is
  'Append-only manual observation of pickup rider decisions; no automatic assignment or notifications.';
