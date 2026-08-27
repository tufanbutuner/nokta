create table if not exists public.promoted_offers (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues(id) on delete cascade,
  title text not null,
  description text,
  terms text,
  offer_type text not null,
  city text,
  area text,
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone not null,
  status text not null default 'draft',
  priority integer not null default 0,
  cta_label text,
  cta_url text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'promoted_offers_type_check'
  ) then
    alter table public.promoted_offers
      add constraint promoted_offers_type_check
      check (offer_type in ('food', 'drink', 'birthday', 'group', 'football', 'student', 'private-hire', 'event', 'other'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'promoted_offers_status_check'
  ) then
    alter table public.promoted_offers
      add constraint promoted_offers_status_check
      check (status in ('draft', 'active', 'paused', 'expired', 'cancelled'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'promoted_offers_date_check'
  ) then
    alter table public.promoted_offers
      add constraint promoted_offers_date_check
      check (ends_at > starts_at);
  end if;
end $$;

create index if not exists promoted_offers_venue_id_idx on public.promoted_offers (venue_id);
create index if not exists promoted_offers_status_idx on public.promoted_offers (status);
create index if not exists promoted_offers_city_idx on public.promoted_offers (city);
create index if not exists promoted_offers_area_idx on public.promoted_offers (area);
create index if not exists promoted_offers_type_status_dates_idx on public.promoted_offers (offer_type, status, starts_at, ends_at);

drop trigger if exists set_promoted_offers_updated_at on public.promoted_offers;
create trigger set_promoted_offers_updated_at
before update on public.promoted_offers
for each row
execute function public.set_updated_at();

alter table public.promoted_offers enable row level security;

drop policy if exists "Anyone can read active promoted offers" on public.promoted_offers;
create policy "Anyone can read active promoted offers"
on public.promoted_offers
for select
using (status = 'active' and starts_at <= now() and ends_at >= now());

drop policy if exists "Admins can read all promoted offers" on public.promoted_offers;
create policy "Admins can read all promoted offers"
on public.promoted_offers
for select
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Admins can insert promoted offers" on public.promoted_offers;
create policy "Admins can insert promoted offers"
on public.promoted_offers
for insert
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Admins can update promoted offers" on public.promoted_offers;
create policy "Admins can update promoted offers"
on public.promoted_offers
for update
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Admins can delete promoted offers" on public.promoted_offers;
create policy "Admins can delete promoted offers"
on public.promoted_offers
for delete
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));
