drop policy if exists "Anyone can create booking requests" on public.booking_requests;

create policy "Anyone can create booking requests"
on public.booking_requests
for insert
to anon, authenticated
with check (
  status = 'pending'
  and (
    submitted_by is null
    or submitted_by = auth.uid()
  )
);

notify pgrst, 'reload schema';
