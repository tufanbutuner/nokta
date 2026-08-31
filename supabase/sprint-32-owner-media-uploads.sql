create table if not exists public.venue_media (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues(id) on delete cascade,
  url text not null,
  alt_text text,
  caption text,
  media_type text not null default 'image',
  source_type text not null default 'manual',
  source_url text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  verification_status text not null default 'unverified',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.venue_media
add column if not exists uploaded_by uuid references auth.users(id),
add column if not exists uploaded_by_role text,
add column if not exists review_status text not null default 'approved',
add column if not exists reviewed_by uuid references auth.users(id),
add column if not exists reviewed_at timestamp with time zone,
add column if not exists review_notes text,
add column if not exists storage_path text,
add column if not exists file_name text,
add column if not exists file_size_bytes integer,
add column if not exists mime_type text,
add column if not exists width integer,
add column if not exists height integer;

alter table public.venue_media drop constraint if exists venue_media_uploaded_by_role_check;
alter table public.venue_media
add constraint venue_media_uploaded_by_role_check
check (uploaded_by_role is null or uploaded_by_role in ('admin', 'owner'));

alter table public.venue_media drop constraint if exists venue_media_review_status_check;
alter table public.venue_media
add constraint venue_media_review_status_check
check (review_status in ('pending', 'approved', 'rejected'));

alter table public.venue_media drop constraint if exists venue_media_source_type_check;
alter table public.venue_media
add constraint venue_media_source_type_check
check (source_type in ('manual', 'venue-owned', 'stock', 'admin-uploaded', 'owner-uploaded'));

alter table public.venue_media drop constraint if exists venue_media_media_type_check;
alter table public.venue_media
add constraint venue_media_media_type_check
check (media_type in ('image'));

create index if not exists venue_media_review_status_idx on public.venue_media (review_status);
create index if not exists venue_media_uploaded_by_idx on public.venue_media (uploaded_by);
create index if not exists venue_media_storage_path_idx on public.venue_media (storage_path);
create index if not exists venue_media_venue_review_status_idx on public.venue_media (venue_id, review_status);
create index if not exists venue_media_created_at_idx on public.venue_media (created_at desc);

drop trigger if exists set_venue_media_updated_at on public.venue_media;
create trigger set_venue_media_updated_at
before update on public.venue_media
for each row
execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('venue-media', 'venue-media', true)
on conflict (id) do update set public = excluded.public;

alter table public.venue_media enable row level security;

drop policy if exists "Anyone can read venue media" on public.venue_media;
drop policy if exists "Anyone can read approved venue media" on public.venue_media;
create policy "Anyone can read approved venue media"
on public.venue_media
for select
using (review_status = 'approved');

drop policy if exists "Owners can read media for claimed venues" on public.venue_media;
create policy "Owners can read media for claimed venues"
on public.venue_media
for select
using (
  exists (
    select 1 from public.venues
    where venues.id = venue_media.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);

drop policy if exists "Owners can insert pending media for claimed venues" on public.venue_media;
create policy "Owners can insert pending media for claimed venues"
on public.venue_media
for insert
with check (
  uploaded_by = auth.uid()
  and uploaded_by_role = 'owner'
  and source_type = 'owner-uploaded'
  and review_status = 'pending'
  and exists (
    select 1 from public.venues
    where venues.id = venue_media.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);

drop policy if exists "Owners can update own pending media metadata" on public.venue_media;
create policy "Owners can update own pending media metadata"
on public.venue_media
for update
using (
  uploaded_by = auth.uid()
  and uploaded_by_role = 'owner'
  and review_status in ('pending', 'rejected')
  and exists (
    select 1 from public.venues
    where venues.id = venue_media.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
)
with check (
  uploaded_by = auth.uid()
  and uploaded_by_role = 'owner'
  and review_status in ('pending', 'rejected')
);

drop policy if exists "Owners can delete own pending media" on public.venue_media;
create policy "Owners can delete own pending media"
on public.venue_media
for delete
using (
  uploaded_by = auth.uid()
  and uploaded_by_role = 'owner'
  and review_status = 'pending'
  and exists (
    select 1 from public.venues
    where venues.id = venue_media.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);

drop policy if exists "Admins can read all venue media" on public.venue_media;
create policy "Admins can read all venue media"
on public.venue_media
for select
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Admins can update venue media" on public.venue_media;
create policy "Admins can update venue media"
on public.venue_media
for update
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Admins can delete venue media" on public.venue_media;
create policy "Admins can delete venue media"
on public.venue_media
for delete
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Owners can upload venue media files" on storage.objects;
create policy "Owners can upload venue media files"
on storage.objects
for insert
with check (
  bucket_id = 'venue-media'
  and auth.role() = 'authenticated'
  and exists (
    select 1 from public.venues
    where venues.id = split_part(storage.objects.name, '/', 1)
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);

drop policy if exists "Anyone can read venue media files" on storage.objects;

drop policy if exists "Owners can delete own pending venue media files" on storage.objects;
create policy "Owners can delete own pending venue media files"
on storage.objects
for delete
using (
  bucket_id = 'venue-media'
  and auth.role() = 'authenticated'
  and exists (
    select 1 from public.venue_media
    join public.venues on venues.id = venue_media.venue_id
    where venue_media.storage_path = storage.objects.name
    and venue_media.review_status = 'pending'
    and venue_media.uploaded_by = auth.uid()
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);
