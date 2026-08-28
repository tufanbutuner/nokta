alter table public.venue_subscriptions
add column if not exists stripe_price_id text,
add column if not exists stripe_product_id text,
add column if not exists stripe_mode text,
add column if not exists cancel_at_period_end boolean not null default false,
add column if not exists last_stripe_event_id text,
add column if not exists last_synced_at timestamp with time zone;

create index if not exists venue_subscriptions_billing_customer_id_idx on public.venue_subscriptions (billing_customer_id);
create index if not exists venue_subscriptions_billing_subscription_id_idx on public.venue_subscriptions (billing_subscription_id);
create index if not exists venue_subscriptions_stripe_price_id_idx on public.venue_subscriptions (stripe_price_id);
create index if not exists venue_subscriptions_stripe_mode_idx on public.venue_subscriptions (stripe_mode);

create table if not exists public.stripe_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  target_plan text not null,
  stripe_checkout_session_id text not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_mode text,
  status text not null default 'created',
  created_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone
);

alter table public.stripe_checkout_sessions
add column if not exists stripe_mode text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'stripe_checkout_sessions_target_plan_check'
  ) then
    alter table public.stripe_checkout_sessions
    add constraint stripe_checkout_sessions_target_plan_check
    check (target_plan in ('starter', 'growth', 'pro'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'stripe_checkout_sessions_status_check'
  ) then
    alter table public.stripe_checkout_sessions
    add constraint stripe_checkout_sessions_status_check
    check (status in ('created', 'completed', 'expired', 'failed'));
  end if;
end $$;

create index if not exists stripe_checkout_sessions_venue_id_idx on public.stripe_checkout_sessions (venue_id);
create index if not exists stripe_checkout_sessions_user_id_idx on public.stripe_checkout_sessions (user_id);
create index if not exists stripe_checkout_sessions_stripe_customer_id_idx on public.stripe_checkout_sessions (stripe_customer_id);
create index if not exists stripe_checkout_sessions_stripe_subscription_id_idx on public.stripe_checkout_sessions (stripe_subscription_id);
create index if not exists stripe_checkout_sessions_stripe_mode_idx on public.stripe_checkout_sessions (stripe_mode);

alter table public.stripe_checkout_sessions enable row level security;

drop policy if exists "Owners can read their own checkout sessions" on public.stripe_checkout_sessions;
create policy "Owners can read their own checkout sessions"
on public.stripe_checkout_sessions
for select
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.venues
    where venues.id = stripe_checkout_sessions.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);

drop policy if exists "Admins can read all checkout sessions" on public.stripe_checkout_sessions;
create policy "Admins can read all checkout sessions"
on public.stripe_checkout_sessions
for select
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
