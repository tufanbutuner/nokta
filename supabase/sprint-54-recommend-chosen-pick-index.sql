begin;

drop index if exists public.recommend_shortlist_picks_role_idx;

create unique index recommend_shortlist_picks_role_idx
on public.recommend_shortlist_picks (shortlist_id, role)
where role <> 'chosen';

commit;
