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
