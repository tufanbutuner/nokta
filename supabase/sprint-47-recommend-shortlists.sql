-- Sprint 47: saved shortlists and share codes for the recommend flow.
--
-- The flow ends on three named picks. A shortlist is that set of picks frozen
-- at save time, together with the answers that produced them, so reopening it
-- next week shows the same three venues even if scoring or the venue set has
-- since moved on. Ordering is stored per pick because the roles (safe bet,
-- wildcard, closest) are positional and must survive a round trip.
--
-- Share codes are a separate, public-readable record: anyone holding the link
-- can read the shortlist behind it, which is why the share code lives in its
-- own table rather than as a nullable column on the shortlist. Revoking a
-- share is a delete here, and never touches the owner's saved shortlist.

create table if not exists public.recommend_shortlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  city text not null,
  -- The four answers, stored as given so the summary line and "Run it again" are exact.
  occasion text,
  vibes text[] not null default '{}',
  budget text,
  distance text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.recommend_shortlist_picks (
  id uuid primary key default gen_random_uuid(),
  shortlist_id uuid not null references public.recommend_shortlists(id) on delete cascade,
  venue_id text not null references public.venues(id) on delete cascade,
  role text not null,
  -- Frozen at save time: "100% match" / "off your answers" and the stated reason.
  match_label text not null,
  reason text not null,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.recommend_share_codes (
  code text primary key,
  shortlist_id uuid not null references public.recommend_shortlists(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'recommend_shortlists_name_check') then
    alter table public.recommend_shortlists
    add constraint recommend_shortlists_name_check
    check (char_length(name) between 1 and 80);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'recommend_shortlists_occasion_check') then
    alter table public.recommend_shortlists
    add constraint recommend_shortlists_occasion_check
    check (occasion is null or occasion in ('solo', 'date', 'small-group', 'big-group', 'football', 'late-night'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'recommend_shortlists_budget_check') then
    alter table public.recommend_shortlists
    add constraint recommend_shortlists_budget_check
    check (budget is null or budget in ('1', '2', '3', '4', 'any'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'recommend_shortlists_distance_check') then
    alter table public.recommend_shortlists
    add constraint recommend_shortlists_distance_check
    check (distance is null or distance in ('walk', 'short', 'any'));
  end if;

  -- Three vibes is the cap the question enforces; the constraint keeps a direct
  -- insert from storing more than the UI can ever render back.
  if not exists (select 1 from pg_constraint where conname = 'recommend_shortlists_vibes_check') then
    alter table public.recommend_shortlists
    add constraint recommend_shortlists_vibes_check
    check (array_length(vibes, 1) is null or array_length(vibes, 1) <= 3);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'recommend_shortlist_picks_role_check') then
    alter table public.recommend_shortlist_picks
    add constraint recommend_shortlist_picks_role_check
    check (role in ('safe', 'wildcard', 'closest'));
  end if;

  -- Codes are generated client-side from a URL-safe alphabet; keep junk out.
  if not exists (select 1 from pg_constraint where conname = 'recommend_share_codes_code_check') then
    alter table public.recommend_share_codes
    add constraint recommend_share_codes_code_check
    check (code ~ '^[a-z0-9]{6,16}$');
  end if;
end $$;

-- One row per role per shortlist: a shortlist cannot hold two "safe bet" picks.
create unique index if not exists recommend_shortlist_picks_role_idx
on public.recommend_shortlist_picks (shortlist_id, role);

create index if not exists recommend_shortlists_user_created_idx
on public.recommend_shortlists (user_id, created_at desc);

create index if not exists recommend_shortlist_picks_shortlist_sort_idx
on public.recommend_shortlist_picks (shortlist_id, sort_order);

create index if not exists recommend_share_codes_shortlist_idx
on public.recommend_share_codes (shortlist_id);

drop trigger if exists set_recommend_shortlists_updated_at on public.recommend_shortlists;
create trigger set_recommend_shortlists_updated_at
before update on public.recommend_shortlists
for each row
execute function public.set_updated_at();

alter table public.recommend_shortlists enable row level security;
alter table public.recommend_shortlist_picks enable row level security;
alter table public.recommend_share_codes enable row level security;

-- Owners manage their own shortlists.
drop policy if exists "Users can manage their own shortlists" on public.recommend_shortlists;
create policy "Users can manage their own shortlists"
on public.recommend_shortlists
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can manage picks on their own shortlists" on public.recommend_shortlist_picks;
create policy "Users can manage picks on their own shortlists"
on public.recommend_shortlist_picks
for all
using (
  exists (
    select 1 from public.recommend_shortlists
    where recommend_shortlists.id = recommend_shortlist_picks.shortlist_id
    and recommend_shortlists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.recommend_shortlists
    where recommend_shortlists.id = recommend_shortlist_picks.shortlist_id
    and recommend_shortlists.user_id = auth.uid()
  )
);

-- Anyone holding a share code can read it, and through it the shortlist and its
-- picks. This is the whole point of sharing: the recipient is not signed in.
-- Only the shortlist owner can create or revoke a code.
drop policy if exists "Anyone can read share codes" on public.recommend_share_codes;
create policy "Anyone can read share codes"
on public.recommend_share_codes
for select
using (true);

drop policy if exists "Users can manage share codes for their own shortlists" on public.recommend_share_codes;
create policy "Users can manage share codes for their own shortlists"
on public.recommend_share_codes
for all
using (created_by = auth.uid())
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.recommend_shortlists
    where recommend_shortlists.id = recommend_share_codes.shortlist_id
    and recommend_shortlists.user_id = auth.uid()
  )
);

drop policy if exists "Anyone can read shared shortlists" on public.recommend_shortlists;
create policy "Anyone can read shared shortlists"
on public.recommend_shortlists
for select
using (
  exists (
    select 1 from public.recommend_share_codes
    where recommend_share_codes.shortlist_id = recommend_shortlists.id
  )
);

drop policy if exists "Anyone can read picks on shared shortlists" on public.recommend_shortlist_picks;
create policy "Anyone can read picks on shared shortlists"
on public.recommend_shortlist_picks
for select
using (
  exists (
    select 1 from public.recommend_share_codes
    where recommend_share_codes.shortlist_id = recommend_shortlist_picks.shortlist_id
  )
);
