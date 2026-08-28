create table if not exists public.venue_update_requests (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues(id) on delete cascade,
  submitted_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  requested_changes jsonb not null default '{}',
  original_snapshot jsonb not null default '{}',
  request_notes text,
  admin_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamp with time zone,
  applied_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'venue_update_requests_status_check') then
    alter table public.venue_update_requests
      add constraint venue_update_requests_status_check
      check (status in ('pending', 'approved', 'rejected', 'cancelled', 'applied'));
  end if;
end $$;

create index if not exists venue_update_requests_venue_id_idx on public.venue_update_requests (venue_id);
create index if not exists venue_update_requests_submitted_by_idx on public.venue_update_requests (submitted_by);
create index if not exists venue_update_requests_status_idx on public.venue_update_requests (status);
create index if not exists venue_update_requests_created_at_idx on public.venue_update_requests (created_at desc);

drop trigger if exists set_venue_update_requests_updated_at on public.venue_update_requests;
create trigger set_venue_update_requests_updated_at
before update on public.venue_update_requests
for each row
execute function public.set_updated_at();

alter table public.venue_update_requests enable row level security;

drop policy if exists "Owners can create update requests for claimed venues" on public.venue_update_requests;
create policy "Owners can create update requests for claimed venues"
on public.venue_update_requests
for insert
with check (
  submitted_by = auth.uid()
  and exists (
    select 1 from public.venues
    where venues.id = venue_update_requests.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
    and venues.partner_tier in ('starter', 'growth', 'pro')
  )
);

drop policy if exists "Owners can read their own update requests" on public.venue_update_requests;
create policy "Owners can read their own update requests"
on public.venue_update_requests
for select
using (
  submitted_by = auth.uid()
  and exists (
    select 1 from public.venues
    where venues.id = venue_update_requests.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);

drop policy if exists "Owners can cancel their pending update requests" on public.venue_update_requests;
create policy "Owners can cancel their pending update requests"
on public.venue_update_requests
for update
using (
  submitted_by = auth.uid()
  and status = 'pending'
  and exists (
    select 1 from public.venues
    where venues.id = venue_update_requests.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
)
with check (submitted_by = auth.uid() and status = 'cancelled');

drop policy if exists "Admins can read all venue update requests" on public.venue_update_requests;
create policy "Admins can read all venue update requests"
on public.venue_update_requests
for select
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Admins can update venue update requests" on public.venue_update_requests;
create policy "Admins can update venue update requests"
on public.venue_update_requests
for update
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));
