alter table public.property_reservations
add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_property_reservations_user_id
on public.property_reservations(user_id);