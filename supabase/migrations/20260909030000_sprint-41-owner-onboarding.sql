create table if not exists public.owner_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  task_key text not null,
  status text not null default 'pending',
  completed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (venue_id, user_id, task_key)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'owner_onboarding_tasks_task_key_check'
  ) then
    alter table public.owner_onboarding_tasks
      add constraint owner_onboarding_tasks_task_key_check
      check (
        task_key in (
          'claim_approved',
          'review_profile',
          'upload_photos',
          'configure_availability',
          'test_booking',
          'enable_notifications',
          'review_pricing'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'owner_onboarding_tasks_status_check'
  ) then
    alter table public.owner_onboarding_tasks
      add constraint owner_onboarding_tasks_status_check
      check (status in ('pending', 'completed', 'skipped'));
  end if;
end $$;

create index if not exists owner_onboarding_tasks_venue_id_idx
on public.owner_onboarding_tasks (venue_id);

create index if not exists owner_onboarding_tasks_user_id_idx
on public.owner_onboarding_tasks (user_id);

create index if not exists owner_onboarding_tasks_status_idx
on public.owner_onboarding_tasks (status);

alter table public.owner_onboarding_tasks enable row level security;

drop policy if exists "Owners can read onboarding tasks for their claimed venues"
on public.owner_onboarding_tasks;

create policy "Owners can read onboarding tasks for their claimed venues"
on public.owner_onboarding_tasks
for select
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.venues
    where venues.id = owner_onboarding_tasks.venue_id
    and venues.claimed_by = auth.uid()
    and venues.is_claimed = true
  )
);

drop policy if exists "Owners can insert onboarding tasks for their claimed venues"
on public.owner_onboarding_tasks;

create policy "Owners can insert onboarding tasks for their claimed venues"
on public.owner_onboarding_tasks
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.venues
    where venues.id = owner_onboarding_tasks.venue_id
    and venues.claimed_by = auth.uid()
    and venues.is_claimed = true
  )
);

drop policy if exists "Owners can update onboarding tasks for their claimed venues"
on public.owner_onboarding_tasks;

create policy "Owners can update onboarding tasks for their claimed venues"
on public.owner_onboarding_tasks
for update
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.venues
    where venues.id = owner_onboarding_tasks.venue_id
    and venues.claimed_by = auth.uid()
    and venues.is_claimed = true
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.venues
    where venues.id = owner_onboarding_tasks.venue_id
    and venues.claimed_by = auth.uid()
    and venues.is_claimed = true
  )
);
