create table if not exists public.venue_suggestions (
  id uuid primary key default gen_random_uuid(),

  submitted_by uuid references auth.users(id) on delete set null,

  venue_name text not null,
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
