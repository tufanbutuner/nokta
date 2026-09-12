-- Sprint 47 fix: break the RLS recursion between shortlists and share codes.
--
-- The original policies referenced each other's tables:
--
--   recommend_share_codes (write)  -> subquery on recommend_shortlists
--   recommend_shortlists  (select) -> subquery on recommend_share_codes
--
-- Each subquery re-entered the other table's policy, so any insert into
-- recommend_share_codes failed with 42P17 "infinite recursion detected in
-- policy". Sharing was broken outright.
--
-- The standard remedy is to move the cross-table checks into security definer
-- functions. These run with the definer's rights, so the inner read does not
-- re-enter the caller's policies and the cycle is cut. Both are intentionally
-- narrow: one answers "does this user own this shortlist?", the other answers
-- "is this shortlist shared at all?". Neither returns row data.

create or replace function public.owns_recommend_shortlist(shortlist uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.recommend_shortlists
    where id = shortlist and user_id = auth.uid()
  );
$$;

create or replace function public.recommend_shortlist_is_shared(shortlist uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.recommend_share_codes
    where shortlist_id = shortlist
  );
$$;

revoke all on function public.owns_recommend_shortlist(uuid) from public;
revoke all on function public.recommend_shortlist_is_shared(uuid) from public;
grant execute on function public.owns_recommend_shortlist(uuid) to anon, authenticated;
grant execute on function public.recommend_shortlist_is_shared(uuid) to anon, authenticated;

-- Owner writes: unchanged in intent, but the ownership check no longer
-- re-enters the shortlists policies.
drop policy if exists "Users can manage share codes for their own shortlists" on public.recommend_share_codes;
create policy "Users can manage share codes for their own shortlists"
on public.recommend_share_codes
for all
using (created_by = auth.uid())
with check (created_by = auth.uid() and public.owns_recommend_shortlist(shortlist_id));

-- Public reads of a shared shortlist and its picks, via the same indirection.
drop policy if exists "Anyone can read shared shortlists" on public.recommend_shortlists;
create policy "Anyone can read shared shortlists"
on public.recommend_shortlists
for select
using (public.recommend_shortlist_is_shared(id));

drop policy if exists "Anyone can read picks on shared shortlists" on public.recommend_shortlist_picks;
create policy "Anyone can read picks on shared shortlists"
on public.recommend_shortlist_picks
for select
using (public.recommend_shortlist_is_shared(shortlist_id));

-- Picks on an owned shortlist, likewise without re-entering the parent policy.
drop policy if exists "Users can manage picks on their own shortlists" on public.recommend_shortlist_picks;
create policy "Users can manage picks on their own shortlists"
on public.recommend_shortlist_picks
for all
using (public.owns_recommend_shortlist(shortlist_id))
with check (public.owns_recommend_shortlist(shortlist_id));
