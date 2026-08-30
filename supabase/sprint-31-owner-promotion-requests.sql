create table if not exists public.owner_promotion_requests (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues(id) on delete cascade,
  submitted_by uuid not null references auth.users(id) on delete cascade,
  request_type text not null,
  status text not null default 'pending',
  title text not null,
  description text,
  terms text,
  offer_type text,
  placement_type text,
  requested_city text,
  requested_area text,
  requested_starts_at timestamp with time zone,
  requested_ends_at timestamp with time zone,
  requested_priority integer not null default 0,
  cta_label text,
  cta_url text,
  owner_notes text,
  admin_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamp with time zone,
  created_offer_id uuid references public.promoted_offers(id) on delete set null,
  created_featured_placement_id uuid references public.featured_placements(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'owner_promotion_requests_request_type_check') then
    alter table public.owner_promotion_requests
      add constraint owner_promotion_requests_request_type_check
      check (request_type in ('promoted_offer', 'featured_placement'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'owner_promotion_requests_status_check') then
    alter table public.owner_promotion_requests
      add constraint owner_promotion_requests_status_check
      check (status in ('pending', 'approved', 'rejected', 'cancelled', 'converted'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'owner_promotion_requests_offer_type_check') then
    alter table public.owner_promotion_requests
      add constraint owner_promotion_requests_offer_type_check
      check (offer_type is null or offer_type in ('food', 'drink', 'birthday', 'group', 'football', 'student', 'private-hire', 'event', 'other'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'owner_promotion_requests_placement_type_check') then
    alter table public.owner_promotion_requests
      add constraint owner_promotion_requests_placement_type_check
      check (placement_type is null or placement_type in ('homepage', 'city', 'area', 'discover', 'recommendation'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'owner_promotion_requests_date_check') then
    alter table public.owner_promotion_requests
      add constraint owner_promotion_requests_date_check
      check (requested_starts_at is null or requested_ends_at is null or requested_ends_at > requested_starts_at);
  end if;
end $$;

create index if not exists owner_promotion_requests_venue_id_idx on public.owner_promotion_requests (venue_id);
create index if not exists owner_promotion_requests_submitted_by_idx on public.owner_promotion_requests (submitted_by);
create index if not exists owner_promotion_requests_request_type_idx on public.owner_promotion_requests (request_type);
create index if not exists owner_promotion_requests_status_idx on public.owner_promotion_requests (status);
create index if not exists owner_promotion_requests_requested_city_idx on public.owner_promotion_requests (requested_city);
create index if not exists owner_promotion_requests_created_at_idx on public.owner_promotion_requests (created_at desc);

drop trigger if exists set_owner_promotion_requests_updated_at on public.owner_promotion_requests;
create trigger set_owner_promotion_requests_updated_at
before update on public.owner_promotion_requests
for each row
execute function public.set_updated_at();

alter table public.owner_promotion_requests enable row level security;

drop policy if exists "Owners can create promotion requests for claimed venues" on public.owner_promotion_requests;
create policy "Owners can create promotion requests for claimed venues"
on public.owner_promotion_requests
for insert
with check (
  submitted_by = auth.uid()
  and exists (
    select 1 from public.venues
    where venues.id = owner_promotion_requests.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);

drop policy if exists "Owners can read their own promotion requests" on public.owner_promotion_requests;
create policy "Owners can read their own promotion requests"
on public.owner_promotion_requests
for select
using (
  submitted_by = auth.uid()
  and exists (
    select 1 from public.venues
    where venues.id = owner_promotion_requests.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);

drop policy if exists "Owners can cancel pending promotion requests" on public.owner_promotion_requests;
create policy "Owners can cancel pending promotion requests"
on public.owner_promotion_requests
for update
using (
  submitted_by = auth.uid()
  and status = 'pending'
  and exists (
    select 1 from public.venues
    where venues.id = owner_promotion_requests.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
)
with check (
  submitted_by = auth.uid()
  and status = 'cancelled'
);

drop policy if exists "Admins can read all owner promotion requests" on public.owner_promotion_requests;
create policy "Admins can read all owner promotion requests"
on public.owner_promotion_requests
for select
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Admins can update owner promotion requests" on public.owner_promotion_requests;
create policy "Admins can update owner promotion requests"
on public.owner_promotion_requests
for update
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));
