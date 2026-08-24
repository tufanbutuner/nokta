create table if not exists public.venues (
  id text primary key,
  slug text not null unique,

  name text not null,
  description text not null,

  area text not null,
  address text not null,
  postcode text not null,

  latitude double precision not null,
  longitude double precision not null,

  rating numeric,
  price_from integer not null,
  price_level integer not null check (price_level between 1 and 4),

  indoor boolean not null default false,
  outdoor boolean not null default false,
  food boolean not null default false,
  alcohol boolean not null default false,
  open_late boolean not null default false,

  vibes text[] not null default '{}',
  images text[] not null default '{}',
  opening_hours jsonb not null default '[]',

  website text,
  instagram text,
  phone text,

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.venues
alter column price_from drop not null;

alter table public.venues
add column if not exists business_status text not null default 'unknown',
add column if not exists verification_status text not null default 'unverified',
add column if not exists last_verified_at timestamp with time zone,
add column if not exists data_sources jsonb not null default '{}',
add column if not exists source_notes text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'venues_business_status_check'
  ) then
    alter table public.venues
    add constraint venues_business_status_check
    check (business_status in ('open', 'temporarily-closed', 'permanently-closed', 'unknown'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'venues_verification_status_check'
  ) then
    alter table public.venues
    add constraint venues_verification_status_check
    check (verification_status in ('unverified', 'partially-verified', 'verified'));
  end if;
end $$;

alter table public.venues enable row level security;

drop policy if exists "Allow public read access to venues" on public.venues;

create policy "Allow public read access to venues"
on public.venues
for select
using (true);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamp with time zone not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "Admin users can read their own admin record" on public.admin_users;

create policy "Admin users can read their own admin record"
on public.admin_users
for select
using (auth.uid() = user_id);

drop policy if exists "Admins can insert venues" on public.venues;
drop policy if exists "Admins can update venues" on public.venues;
drop policy if exists "Admins can delete venues" on public.venues;

create policy "Admins can insert venues"
on public.venues
for insert
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

create policy "Admins can update venues"
on public.venues
for update
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

create policy "Admins can delete venues"
on public.venues
for delete
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

create table if not exists public.user_saved_venues (
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id text not null references public.venues(id) on delete cascade,
  created_at timestamp with time zone not null default now(),

  primary key (user_id, venue_id)
);

alter table public.user_saved_venues enable row level security;

drop policy if exists "Users can read their own saved venues" on public.user_saved_venues;
drop policy if exists "Users can insert their own saved venues" on public.user_saved_venues;
drop policy if exists "Users can delete their own saved venues" on public.user_saved_venues;

create policy "Users can read their own saved venues"
on public.user_saved_venues
for select
using (auth.uid() = user_id);

create policy "Users can insert their own saved venues"
on public.user_saved_venues
for insert
with check (auth.uid() = user_id);

create policy "Users can delete their own saved venues"
on public.user_saved_venues
for delete
using (auth.uid() = user_id);

create table if not exists public.user_recently_viewed_venues (
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id text not null references public.venues(id) on delete cascade,
  viewed_at timestamp with time zone not null default now(),

  primary key (user_id, venue_id)
);

alter table public.user_recently_viewed_venues enable row level security;

drop policy if exists "Users can read their own recently viewed venues" on public.user_recently_viewed_venues;
drop policy if exists "Users can insert their own recently viewed venues" on public.user_recently_viewed_venues;
drop policy if exists "Users can update their own recently viewed venues" on public.user_recently_viewed_venues;
drop policy if exists "Users can delete their own recently viewed venues" on public.user_recently_viewed_venues;

create policy "Users can read their own recently viewed venues"
on public.user_recently_viewed_venues
for select
using (auth.uid() = user_id);

create policy "Users can insert their own recently viewed venues"
on public.user_recently_viewed_venues
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own recently viewed venues"
on public.user_recently_viewed_venues
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own recently viewed venues"
on public.user_recently_viewed_venues
for delete
using (auth.uid() = user_id);

create table if not exists public.venue_reviews (
  id uuid primary key default gen_random_uuid(),

  venue_id text not null references public.venues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  rating integer not null check (rating between 1 and 5),
  title text,
  body text not null,

  visit_date date,

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  unique (venue_id, user_id)
);

alter table public.venue_reviews
add column if not exists status text not null default 'published',
add column if not exists moderation_notes text,
add column if not exists hidden_at timestamp with time zone,
add column if not exists hidden_by uuid references auth.users(id),
add column if not exists deleted_at timestamp with time zone;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'venue_reviews_status_check'
  ) then
    alter table public.venue_reviews
    add constraint venue_reviews_status_check
    check (status in ('published', 'hidden', 'flagged', 'deleted'));
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_venue_reviews_updated_at on public.venue_reviews;

create trigger set_venue_reviews_updated_at
before update on public.venue_reviews
for each row
execute function public.set_updated_at();

alter table public.venue_reviews enable row level security;

drop policy if exists "Anyone can read venue reviews" on public.venue_reviews;
drop policy if exists "Anyone can read published venue reviews" on public.venue_reviews;
drop policy if exists "Users can read their own venue reviews" on public.venue_reviews;
drop policy if exists "Admins can read all venue reviews" on public.venue_reviews;
drop policy if exists "Users can create their own reviews" on public.venue_reviews;
drop policy if exists "Users can update their own reviews" on public.venue_reviews;
drop policy if exists "Users can delete their own reviews" on public.venue_reviews;
drop policy if exists "Admins can update venue reviews" on public.venue_reviews;

create policy "Anyone can read published venue reviews"
on public.venue_reviews
for select
using (
  status = 'published'
  and deleted_at is null
);

create policy "Users can read their own venue reviews"
on public.venue_reviews
for select
using (
  auth.uid() = user_id
  and deleted_at is null
);

create policy "Admins can read all venue reviews"
on public.venue_reviews
for select
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

create policy "Users can create their own reviews"
on public.venue_reviews
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own reviews"
on public.venue_reviews
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own reviews"
on public.venue_reviews
for delete
using (auth.uid() = user_id);

create policy "Admins can update venue reviews"
on public.venue_reviews
for update
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);
