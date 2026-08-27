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
