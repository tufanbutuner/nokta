-- Sprint 42: owner-managed menu sections and items.
--
-- Menu items, prices and menu links become owner-owned: they publish
-- immediately on every plan and no longer route through
-- venue_update_requests. Name, address, category, contact details and
-- opening hours still go through admin review.
--
-- Money is stored in pence as an integer, never a float.
-- venues.price_from stays in whole pounds because every public surface
-- renders it as "From £{price_from}"; publish converts.

create table if not exists public.venue_menu_sections (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues(id) on delete cascade,
  name text not null,
  slug text not null,
  is_shisha boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.venue_menu_items (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues(id) on delete cascade,
  section_id uuid not null references public.venue_menu_sections(id) on delete cascade,
  name text not null,
  note text,
  price_pence integer not null,
  is_live boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'venue_menu_sections_name_check') then
    alter table public.venue_menu_sections
    add constraint venue_menu_sections_name_check
    check (char_length(name) between 1 and 60);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'venue_menu_sections_slug_check') then
    alter table public.venue_menu_sections
    add constraint venue_menu_sections_slug_check
    check (slug ~ '^[a-z0-9_-]{1,60}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'venue_menu_items_name_check') then
    alter table public.venue_menu_items
    add constraint venue_menu_items_name_check
    check (char_length(name) between 1 and 80);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'venue_menu_items_note_check') then
    alter table public.venue_menu_items
    add constraint venue_menu_items_note_check
    check (note is null or char_length(note) <= 120);
  end if;

  -- Ceiling matches the £999 cap enforced in venueMenuItemValidation.ts.
  if not exists (select 1 from pg_constraint where conname = 'venue_menu_items_price_pence_check') then
    alter table public.venue_menu_items
    add constraint venue_menu_items_price_pence_check
    check (price_pence >= 0 and price_pence <= 99900);
  end if;
end $$;

-- One slug per venue, so a venue cannot hold two "Cocktails" sections.
create unique index if not exists venue_menu_sections_venue_slug_idx
on public.venue_menu_sections (venue_id, slug);

create index if not exists venue_menu_sections_venue_sort_idx
on public.venue_menu_sections (venue_id, sort_order);

create index if not exists venue_menu_items_venue_section_sort_idx
on public.venue_menu_items (venue_id, section_id, sort_order);

create index if not exists venue_menu_items_venue_live_idx
on public.venue_menu_items (venue_id, is_live);

drop trigger if exists set_venue_menu_sections_updated_at on public.venue_menu_sections;
create trigger set_venue_menu_sections_updated_at
before update on public.venue_menu_sections
for each row
execute function public.set_updated_at();

drop trigger if exists set_venue_menu_items_updated_at on public.venue_menu_items;
create trigger set_venue_menu_items_updated_at
before update on public.venue_menu_items
for each row
execute function public.set_updated_at();

alter table public.venue_menu_sections enable row level security;
alter table public.venue_menu_items enable row level security;

-- Public reads: sections are readable so a live item can be grouped under
-- its heading. Items are readable only while live.
drop policy if exists "Anyone can read venue menu sections" on public.venue_menu_sections;
create policy "Anyone can read venue menu sections"
on public.venue_menu_sections
for select
using (true);

drop policy if exists "Anyone can read live venue menu items" on public.venue_menu_items;
create policy "Anyone can read live venue menu items"
on public.venue_menu_items
for select
using (is_live = true);

drop policy if exists "Owners can read menu sections for claimed venues" on public.venue_menu_sections;
create policy "Owners can read menu sections for claimed venues"
on public.venue_menu_sections
for select
using (
  exists (
    select 1 from public.venues
    where venues.id = venue_menu_sections.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);

drop policy if exists "Owners can write menu sections for claimed venues" on public.venue_menu_sections;
create policy "Owners can write menu sections for claimed venues"
on public.venue_menu_sections
for all
using (
  exists (
    select 1 from public.venues
    where venues.id = venue_menu_sections.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.venues
    where venues.id = venue_menu_sections.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);

drop policy if exists "Owners can read menu items for claimed venues" on public.venue_menu_items;
create policy "Owners can read menu items for claimed venues"
on public.venue_menu_items
for select
using (
  exists (
    select 1 from public.venues
    where venues.id = venue_menu_items.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);

drop policy if exists "Owners can write menu items for claimed venues" on public.venue_menu_items;
create policy "Owners can write menu items for claimed venues"
on public.venue_menu_items
for all
using (
  exists (
    select 1 from public.venues
    where venues.id = venue_menu_items.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.venues
    where venues.id = venue_menu_items.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);

drop policy if exists "Admins can manage venue menu sections" on public.venue_menu_sections;
create policy "Admins can manage venue menu sections"
on public.venue_menu_sections
for all
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Admins can manage venue menu items" on public.venue_menu_items;
create policy "Admins can manage venue menu items"
on public.venue_menu_items
for all
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

-- Seed the two default sections for every venue that has none, so existing
-- venues open the editor with the sections the design assumes.
insert into public.venue_menu_sections (venue_id, name, slug, is_shisha, sort_order)
select v.id, 'Shisha', 'shisha', true, 0
from public.venues v
where not exists (
  select 1 from public.venue_menu_sections s
  where s.venue_id = v.id and s.slug = 'shisha'
);

insert into public.venue_menu_sections (venue_id, name, slug, is_shisha, sort_order)
select v.id, 'Food & drink', 'food_drink', false, 1
from public.venues v
where not exists (
  select 1 from public.venue_menu_sections s
  where s.venue_id = v.id and s.slug = 'food_drink'
);
