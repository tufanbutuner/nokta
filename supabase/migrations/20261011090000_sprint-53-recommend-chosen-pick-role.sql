-- Sprint 53: allow hand-picked shortlist picks.
--
-- /plan ("Plan a night") saves shortlists the person built by hand, not ones
-- the recommend quiz scored, so its picks use a fourth role, `chosen`. The
-- role check from sprint 47 only allowed the quiz's three roles, so every
-- "Send to group" insert from /plan failed the constraint.
--
-- Additive: existing rows and the recommend flow are unaffected.

alter table public.recommend_shortlist_picks
  drop constraint if exists recommend_shortlist_picks_role_check;

alter table public.recommend_shortlist_picks
  add constraint recommend_shortlist_picks_role_check
  check (role in ('safe', 'wildcard', 'closest', 'chosen'));
