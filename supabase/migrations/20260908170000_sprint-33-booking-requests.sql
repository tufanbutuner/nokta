create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues(id) on delete cascade,
  submitted_by uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  party_size integer not null,
  requested_date date not null,
  requested_time text not null,
  occasion text,
  message text,
  status text not null default 'pending',
  owner_response_message text,
  proposed_date date,
  proposed_time text,
  proposed_message text,
  accepted_at timestamp with time zone,
  declined_at timestamp with time zone,
  proposed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  owner_last_updated_by uuid references auth.users(id),
  owner_last_updated_at timestamp with time zone,
  admin_notes text,
  source_surface text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'booking_requests_party_size_check') then
    alter table public.booking_requests
    add constraint booking_requests_party_size_check
    check (party_size > 0 and party_size <= 100);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'booking_requests_status_check') then
    alter table public.booking_requests
    add constraint booking_requests_status_check
    check (status in ('pending', 'accepted', 'declined', 'alternative_proposed', 'customer_accepted_alternative', 'customer_declined_alternative', 'cancelled', 'completed', 'no_show', 'spam'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'booking_requests_source_surface_check') then
    alter table public.booking_requests
    add constraint booking_requests_source_surface_check
    check (source_surface is null or source_surface in ('venue_page', 'discover', 'city_page', 'saved_venues', 'recommendations', 'owner_preview', 'admin_preview'));
  end if;
end $$;

create index if not exists booking_requests_venue_id_idx on public.booking_requests (venue_id);
create index if not exists booking_requests_submitted_by_idx on public.booking_requests (submitted_by);
create index if not exists booking_requests_status_idx on public.booking_requests (status);
create index if not exists booking_requests_requested_date_idx on public.booking_requests (requested_date);
create index if not exists booking_requests_created_at_idx on public.booking_requests (created_at desc);
create index if not exists booking_requests_venue_status_idx on public.booking_requests (venue_id, status);
create index if not exists booking_requests_venue_requested_date_idx on public.booking_requests (venue_id, requested_date);

drop trigger if exists set_booking_requests_updated_at on public.booking_requests;
create trigger set_booking_requests_updated_at
before update on public.booking_requests
for each row
execute function public.set_updated_at();

alter table public.booking_requests enable row level security;

drop policy if exists "Anyone can create booking requests" on public.booking_requests;
create policy "Anyone can create booking requests"
on public.booking_requests
for insert
with check (status = 'pending');

drop policy if exists "Customers can read their own booking requests" on public.booking_requests;
create policy "Customers can read their own booking requests"
on public.booking_requests
for select
using (submitted_by = auth.uid());

drop policy if exists "Owners can read booking requests for claimed venues" on public.booking_requests;
create policy "Owners can read booking requests for claimed venues"
on public.booking_requests
for select
using (
  exists (
    select 1 from public.venues
    where venues.id = booking_requests.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);

drop policy if exists "Owners can update booking requests for claimed venues" on public.booking_requests;
create policy "Owners can update booking requests for claimed venues"
on public.booking_requests
for update
using (
  exists (
    select 1 from public.venues
    where venues.id = booking_requests.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.venues
    where venues.id = booking_requests.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);

drop policy if exists "Admins can read all booking requests" on public.booking_requests;
create policy "Admins can read all booking requests"
on public.booking_requests
for select
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Admins can update booking requests" on public.booking_requests;
create policy "Admins can update booking requests"
on public.booking_requests
for update
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));
