create table if not exists public.property_booking_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  broker_id uuid references public.brokers(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,

  customer_name text not null,
  customer_phone text,
  customer_email text,
  customer_whatsapp text,

  preferred_start_date date,
  preferred_end_date date,
  message text,

  status text not null default 'new'
    check (status in ('new', 'contacted', 'in_progress', 'converted', 'cancelled')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_property_booking_requests_property_id
on public.property_booking_requests(property_id);

create index if not exists idx_property_booking_requests_broker_id
on public.property_booking_requests(broker_id);

create index if not exists idx_property_booking_requests_user_id
on public.property_booking_requests(user_id);

create index if not exists idx_property_booking_requests_status
on public.property_booking_requests(status);

create or replace function public.set_property_booking_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_property_booking_requests_updated_at
on public.property_booking_requests;

create trigger trg_property_booking_requests_updated_at
before update on public.property_booking_requests
for each row
execute function public.set_property_booking_requests_updated_at();

alter table public.property_booking_requests enable row level security;

drop policy if exists "Users can insert property booking requests"
on public.property_booking_requests;
create policy "Users can insert property booking requests"
on public.property_booking_requests
for insert
with check (
  user_id is null
  or auth.uid() = user_id
);

drop policy if exists "Users can view own property booking requests"
on public.property_booking_requests;
create policy "Users can view own property booking requests"
on public.property_booking_requests
for select
using (
  user_id is not null
  and auth.uid() = user_id
);