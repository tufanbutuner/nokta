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

alter table public.venue_reviews enable row level security;

drop policy if exists "Anyone can read venue reviews" on public.venue_reviews;
drop policy if exists "Anyone can read published venue reviews" on public.venue_reviews;
drop policy if exists "Users can read their own venue reviews" on public.venue_reviews;
drop policy if exists "Admins can read all venue reviews" on public.venue_reviews;
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
