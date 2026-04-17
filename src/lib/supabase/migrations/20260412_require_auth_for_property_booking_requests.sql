drop policy if exists "Users can insert property booking requests"
on public.property_booking_requests;

create policy "Authenticated users can insert own property booking requests"
on public.property_booking_requests
for insert
with check (
  auth.uid() is not null
  and auth.uid() = user_id
);