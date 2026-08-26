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

drop trigger if exists set_venue_claim_requests_updated_at
on public.venue_claim_requests;

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

notify pgrst, 'reload schema';
