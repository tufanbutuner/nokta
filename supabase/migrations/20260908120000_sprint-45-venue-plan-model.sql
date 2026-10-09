-- Soft booking bands and the public booking-readiness gate.
-- Bands are display-only: never use them to block booking requests.

create table if not exists public.plan_booking_bands (
  plan text primary key,
  accepted_bookings_band integer,
  updated_at timestamptz not null default now(),
  constraint plan_booking_bands_plan_check check (plan in ('free', 'starter', 'growth', 'pro')),
  constraint plan_booking_bands_value_check check (accepted_bookings_band is null or accepted_bookings_band > 0)
);

insert into public.plan_booking_bands (plan, accepted_bookings_band)
values ('free', 10), ('starter', 40), ('growth', 80), ('pro', null)
on conflict (plan) do nothing;

alter table public.plan_booking_bands enable row level security;

drop policy if exists "Anyone can read plan booking bands" on public.plan_booking_bands;
create policy "Anyone can read plan booking bands"
on public.plan_booking_bands for select
using (true);

drop policy if exists "Admins can manage plan booking bands" on public.plan_booking_bands;
create policy "Admins can manage plan booking bands"
on public.plan_booking_bands for all
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

grant select on public.plan_booking_bands to anon, authenticated;

create or replace view public.owner_booking_band_usage
with (security_invoker = true)
as
select
  v.id as venue_id,
  coalesce(vs.plan, 'free') as plan,
  pbb.accepted_bookings_band,
  periods.period_start,
  periods.period_end,
  count(br.id)::integer as accepted_bookings
from public.venues v
left join public.venue_subscriptions vs on vs.venue_id = v.id
join public.plan_booking_bands pbb on pbb.plan = coalesce(vs.plan, 'free')
cross join lateral (
  select
    coalesce(vs.current_period_start, date_trunc('month', now())) as period_start,
    coalesce(vs.current_period_end, date_trunc('month', now()) + interval '1 month') as period_end
) periods
left join public.booking_requests br
  on br.venue_id = v.id
  and coalesce(br.accepted_at, br.confirmed_at) >= periods.period_start
  and coalesce(br.accepted_at, br.confirmed_at) < periods.period_end
  and br.status in ('accepted', 'customer_accepted_alternative', 'completed')
where v.is_claimed = true
  and (
    v.claimed_by = auth.uid()
    or exists (select 1 from public.admin_users where admin_users.user_id = auth.uid())
  )
group by v.id, vs.plan, pbb.accepted_bookings_band, periods.period_start, periods.period_end;

grant select on public.owner_booking_band_usage to authenticated;

create or replace function public.is_venue_booking_responsive(target_venue_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with recent as (
    select created_at, owner_last_updated_at
    from public.booking_requests
    where venue_id = target_venue_id
    order by created_at desc
    limit 3
  )
  select case
    when count(*) = 0 then true
    when bool_or(owner_last_updated_at is not null and owner_last_updated_at <= created_at + interval '48 hours') then true
    when bool_and(created_at > now() - interval '48 hours') then true
    else false
  end
  from recent;
$$;

revoke all on function public.is_venue_booking_responsive(text) from public;
grant execute on function public.is_venue_booking_responsive(text) to anon, authenticated;

create or replace view public.public_venue_booking_states
with (security_invoker = false)
as
select
  v.id as venue_id,
  v.is_claimed,
  coalesce(vbs.booking_requests_enabled, false) as booking_requests_enabled,
  public.is_venue_booking_responsive(v.id) as responsive,
  case
    when not v.is_claimed then 'unclaimed'
    when not coalesce(vbs.booking_requests_enabled, false) then 'disabled'
    when not public.is_venue_booking_responsive(v.id) then 'dormant'
    else 'live'
  end as state
from public.venues v
left join public.venue_booking_settings vbs on vbs.venue_id = v.id;

grant select on public.public_venue_booking_states to anon, authenticated;

create or replace function public.can_venue_receive_booking_requests(target_venue_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.public_venue_booking_states
    where venue_id = target_venue_id and state = 'live'
  );
$$;

revoke all on function public.can_venue_receive_booking_requests(text) from public;
grant execute on function public.can_venue_receive_booking_requests(text) to anon, authenticated;

drop policy if exists "Anyone can create booking requests" on public.booking_requests;
create policy "Anyone can create booking requests"
on public.booking_requests for insert
with check (status = 'pending' and public.can_venue_receive_booking_requests(venue_id));

drop policy if exists "Owners can create update requests for claimed venues" on public.venue_update_requests;
create policy "Owners can create update requests for claimed venues"
on public.venue_update_requests for insert
with check (
  submitted_by = auth.uid()
  and exists (
    select 1 from public.venues
    where venues.id = venue_update_requests.venue_id
      and venues.is_claimed = true
      and venues.claimed_by = auth.uid()
  )
);

notify pgrst, 'reload schema';
