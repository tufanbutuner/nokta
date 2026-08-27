create table if not exists public.venues (
  id text primary key,
  slug text not null unique,

  name text not null,
  description text not null,

  country text not null default 'United Kingdom',
  city text not null default 'London',
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
add column if not exists country text not null default 'United Kingdom',
add column if not exists city text not null default 'London',
add column if not exists verification_status text not null default 'unverified',
add column if not exists last_verified_at timestamp with time zone,
add column if not exists data_sources jsonb not null default '{}',
add column if not exists source_notes text,
add column if not exists is_claimed boolean not null default false,
add column if not exists claimed_by uuid references auth.users(id),
add column if not exists claimed_at timestamp with time zone,
add column if not exists partner_tier text not null default 'none',
add column if not exists monetisation_status text not null default 'not-contacted',
add column if not exists monetisation_notes text,
add column if not exists featured_eligible boolean not null default false,
add column if not exists featured_blocked_reason text;

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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'venues_partner_tier_check'
  ) then
    alter table public.venues
    add constraint venues_partner_tier_check
    check (partner_tier in ('none', 'starter', 'growth', 'pro'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'venues_monetisation_status_check'
  ) then
    alter table public.venues
    add constraint venues_monetisation_status_check
    check (monetisation_status in ('not-contacted', 'contacted', 'interested', 'trial', 'paying', 'churned', 'not-fit'));
  end if;
end $$;

create index if not exists venues_country_idx on public.venues (country);
create index if not exists venues_city_idx on public.venues (city);
create index if not exists venues_country_city_idx on public.venues (country, city);

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

create table if not exists public.venue_enquiries (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues(id) on delete cascade,
  submitted_by uuid references auth.users(id) on delete set null,
  enquiry_type text not null,
  party_size integer,
  preferred_date date,
  preferred_time text,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  message text,
  status text not null default 'new',
  admin_notes text,
  assigned_to uuid references auth.users(id),
  contacted_venue_at timestamp with time zone,
  venue_response text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'venue_enquiries_type_check') then
    alter table public.venue_enquiries
    add constraint venue_enquiries_type_check
    check (enquiry_type in ('general', 'birthday', 'group', 'football', 'late-night', 'private-hire'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'venue_enquiries_status_check') then
    alter table public.venue_enquiries
    add constraint venue_enquiries_status_check
    check (status in ('new', 'contacted', 'responded', 'converted', 'closed', 'spam'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'venue_enquiries_party_size_check') then
    alter table public.venue_enquiries
    add constraint venue_enquiries_party_size_check
    check (party_size is null or party_size > 0);
  end if;
end $$;

drop trigger if exists set_venue_enquiries_updated_at on public.venue_enquiries;

create trigger set_venue_enquiries_updated_at
before update on public.venue_enquiries
for each row
execute function public.set_updated_at();

create index if not exists venue_enquiries_venue_id_idx on public.venue_enquiries (venue_id);
create index if not exists venue_enquiries_submitted_by_idx on public.venue_enquiries (submitted_by);
create index if not exists venue_enquiries_status_idx on public.venue_enquiries (status);
create index if not exists venue_enquiries_type_idx on public.venue_enquiries (enquiry_type);
create index if not exists venue_enquiries_created_at_idx on public.venue_enquiries (created_at desc);

alter table public.venue_enquiries enable row level security;

drop policy if exists "Signed in users can create venue enquiries" on public.venue_enquiries;
drop policy if exists "Users can read their own venue enquiries" on public.venue_enquiries;
drop policy if exists "Admins can read all venue enquiries" on public.venue_enquiries;
drop policy if exists "Admins can update venue enquiries" on public.venue_enquiries;

create policy "Signed in users can create venue enquiries"
on public.venue_enquiries
for insert
with check (auth.uid() = submitted_by);

create policy "Users can read their own venue enquiries"
on public.venue_enquiries
for select
using (auth.uid() = submitted_by);

create policy "Admins can read all venue enquiries"
on public.venue_enquiries
for select
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

create policy "Admins can update venue enquiries"
on public.venue_enquiries
for update
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

notify pgrst, 'reload schema';

create table if not exists public.featured_placements (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues(id) on delete cascade,
  placement_type text not null,
  city text,
  area text,
  title text,
  description text,
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone not null,
  status text not null default 'draft',
  priority integer not null default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'featured_placements_type_check') then
    alter table public.featured_placements
    add constraint featured_placements_type_check
    check (placement_type in ('homepage', 'city', 'area', 'discover', 'recommendation'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'featured_placements_status_check') then
    alter table public.featured_placements
    add constraint featured_placements_status_check
    check (status in ('draft', 'active', 'paused', 'expired', 'cancelled'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'featured_placements_date_check') then
    alter table public.featured_placements
    add constraint featured_placements_date_check
    check (ends_at > starts_at);
  end if;
end $$;

create index if not exists featured_placements_venue_id_idx on public.featured_placements (venue_id);
create index if not exists featured_placements_status_idx on public.featured_placements (status);
create index if not exists featured_placements_city_idx on public.featured_placements (city);
create index if not exists featured_placements_area_idx on public.featured_placements (area);
create index if not exists featured_placements_type_status_dates_idx on public.featured_placements (placement_type, status, starts_at, ends_at);

drop trigger if exists set_featured_placements_updated_at on public.featured_placements;

create trigger set_featured_placements_updated_at
before update on public.featured_placements
for each row
execute function public.set_updated_at();

alter table public.featured_placements enable row level security;

drop policy if exists "Anyone can read active featured placements" on public.featured_placements;
drop policy if exists "Admins can read all featured placements" on public.featured_placements;
drop policy if exists "Admins can insert featured placements" on public.featured_placements;
drop policy if exists "Admins can update featured placements" on public.featured_placements;
drop policy if exists "Admins can delete featured placements" on public.featured_placements;

create policy "Anyone can read active featured placements"
on public.featured_placements
for select
using (status = 'active' and starts_at <= now() and ends_at >= now());

create policy "Admins can read all featured placements"
on public.featured_placements
for select
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

create policy "Admins can insert featured placements"
on public.featured_placements
for insert
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

create policy "Admins can update featured placements"
on public.featured_placements
for update
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

create policy "Admins can delete featured placements"
on public.featured_placements
for delete
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

notify pgrst, 'reload schema';

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

create table if not exists public.venue_suggestions (
  id uuid primary key default gen_random_uuid(),

  submitted_by uuid references auth.users(id) on delete set null,

  venue_name text not null,
  country text not null default 'United Kingdom',
  city text not null default 'London',
  area text,
  address text,
  postcode text,

  website text,
  instagram text,
  phone text,

  notes text,

  status text not null default 'pending',
  admin_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamp with time zone,

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'venue_suggestions_status_check'
  ) then
    alter table public.venue_suggestions
    add constraint venue_suggestions_status_check
    check (status in ('pending', 'approved', 'rejected', 'converted'));
  end if;
end $$;

create index if not exists venue_suggestions_country_idx on public.venue_suggestions (country);
create index if not exists venue_suggestions_city_idx on public.venue_suggestions (city);

drop trigger if exists set_venue_suggestions_updated_at on public.venue_suggestions;

create trigger set_venue_suggestions_updated_at
before update on public.venue_suggestions
for each row
execute function public.set_updated_at();

alter table public.venue_suggestions enable row level security;

drop policy if exists "Signed in users can create venue suggestions" on public.venue_suggestions;
drop policy if exists "Users can read their own venue suggestions" on public.venue_suggestions;
drop policy if exists "Admins can read all venue suggestions" on public.venue_suggestions;
drop policy if exists "Admins can update venue suggestions" on public.venue_suggestions;

create policy "Signed in users can create venue suggestions"
on public.venue_suggestions
for insert
with check (auth.uid() = submitted_by);

create policy "Users can read their own venue suggestions"
on public.venue_suggestions
for select
using (auth.uid() = submitted_by);

create policy "Admins can read all venue suggestions"
on public.venue_suggestions
for select
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

create policy "Admins can update venue suggestions"
on public.venue_suggestions
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

create table if not exists public.venue_claim_requests (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues(id) on delete cascade,
  submitted_by uuid not null references auth.users(id) on delete cascade,
  claimant_name text not null,
  claimant_email text not null,
  claimant_phone text,
  claimant_role text not null,
  business_email text,
  business_phone text,
  proof_notes text,
  proof_url text,
  status text not null default 'pending',
  admin_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (venue_id, submitted_by)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'venue_claim_requests_status_check'
  ) then
    alter table public.venue_claim_requests
    add constraint venue_claim_requests_status_check
    check (status in ('pending', 'approved', 'rejected', 'cancelled'));
  end if;
end $$;

drop trigger if exists set_venue_claim_requests_updated_at on public.venue_claim_requests;

create trigger set_venue_claim_requests_updated_at
before update on public.venue_claim_requests
for each row
execute function public.set_updated_at();

alter table public.venue_claim_requests enable row level security;

drop policy if exists "Users can create their own venue claim requests" on public.venue_claim_requests;
drop policy if exists "Users can read their own venue claim requests" on public.venue_claim_requests;
drop policy if exists "Users can cancel their own pending claim requests" on public.venue_claim_requests;
drop policy if exists "Admins can read all venue claim requests" on public.venue_claim_requests;
drop policy if exists "Admins can update venue claim requests" on public.venue_claim_requests;

create policy "Users can create their own venue claim requests"
on public.venue_claim_requests
for insert
with check (auth.uid() = submitted_by);

create policy "Users can read their own venue claim requests"
on public.venue_claim_requests
for select
using (auth.uid() = submitted_by);

create policy "Users can cancel their own pending claim requests"
on public.venue_claim_requests
for update
using (
  auth.uid() = submitted_by
  and status = 'pending'
)
with check (
  auth.uid() = submitted_by
  and status = 'cancelled'
);

create policy "Admins can read all venue claim requests"
on public.venue_claim_requests
for select
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

create policy "Admins can update venue claim requests"
on public.venue_claim_requests
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
