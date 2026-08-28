create table if not exists public.venue_subscriptions (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'inactive',
  billing_provider text,
  billing_customer_id text,
  billing_subscription_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  trial_started_at timestamp with time zone,
  trial_ends_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  admin_notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (venue_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'venue_subscriptions_plan_check'
  ) then
    alter table public.venue_subscriptions
    add constraint venue_subscriptions_plan_check
    check (plan in ('free', 'starter', 'growth', 'pro'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'venue_subscriptions_status_check'
  ) then
    alter table public.venue_subscriptions
    add constraint venue_subscriptions_status_check
    check (status in ('inactive', 'trial', 'active', 'past_due', 'cancelled'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'venue_subscriptions_billing_provider_check'
  ) then
    alter table public.venue_subscriptions
    add constraint venue_subscriptions_billing_provider_check
    check (billing_provider is null or billing_provider in ('manual', 'stripe'));
  end if;
end $$;

create index if not exists venue_subscriptions_venue_id_idx on public.venue_subscriptions (venue_id);
create index if not exists venue_subscriptions_plan_idx on public.venue_subscriptions (plan);
create index if not exists venue_subscriptions_status_idx on public.venue_subscriptions (status);
create index if not exists venue_subscriptions_current_period_end_idx on public.venue_subscriptions (current_period_end);

drop trigger if exists set_venue_subscriptions_updated_at on public.venue_subscriptions;
create trigger set_venue_subscriptions_updated_at
before update on public.venue_subscriptions
for each row
execute function public.set_updated_at();

alter table public.venue_subscriptions enable row level security;

drop policy if exists "Owners can read subscriptions for claimed venues" on public.venue_subscriptions;
create policy "Owners can read subscriptions for claimed venues"
on public.venue_subscriptions
for select
using (
  exists (
    select 1
    from public.venues
    where venues.id = venue_subscriptions.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);

drop policy if exists "Admins can read all venue subscriptions" on public.venue_subscriptions;
create policy "Admins can read all venue subscriptions"
on public.venue_subscriptions
for select
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Admins can insert venue subscriptions" on public.venue_subscriptions;
create policy "Admins can insert venue subscriptions"
on public.venue_subscriptions
for insert
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Admins can update venue subscriptions" on public.venue_subscriptions;
create policy "Admins can update venue subscriptions"
on public.venue_subscriptions
for update
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Admins can delete venue subscriptions" on public.venue_subscriptions;
create policy "Admins can delete venue subscriptions"
on public.venue_subscriptions
for delete
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

insert into public.venue_subscriptions (venue_id, plan, status, billing_provider)
select id, 'free', 'inactive', 'manual'
from public.venues
where is_claimed = true
on conflict (venue_id) do nothing;

drop policy if exists "Owners can create update requests for claimed venues" on public.venue_update_requests;
create policy "Owners can create update requests for claimed venues"
on public.venue_update_requests
for insert
with check (
  submitted_by = auth.uid()
  and exists (
    select 1
    from public.venues
    join public.venue_subscriptions
      on venue_subscriptions.venue_id = venues.id
    where venues.id = venue_update_requests.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
    and venue_subscriptions.plan in ('starter', 'growth', 'pro')
    and venue_subscriptions.status in ('trial', 'active', 'past_due')
  )
);
