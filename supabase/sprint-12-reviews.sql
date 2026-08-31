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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
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
drop policy if exists "Users can create their own reviews" on public.venue_reviews;
drop policy if exists "Users can update their own reviews" on public.venue_reviews;
drop policy if exists "Users can delete their own reviews" on public.venue_reviews;

create policy "Anyone can read venue reviews"
on public.venue_reviews
for select
using (true);

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
