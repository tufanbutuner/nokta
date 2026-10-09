-- Sprint 48: separate test traffic from real traffic in venue analytics.
--
-- venue_analytics_events had no notion of environment, so local development and
-- QA browsing wrote into the same rows as live visitors. The reported numbers
-- looked like traffic but were mostly us: at the time of writing, 1,267 events
-- came from 22 distinct anonymous ids across 43 sessions, with 696 of them
-- logged on a single day of front-end work.
--
-- Every event now carries the environment it came from, stamped client-side from
-- a build-time variable. Reporting filters to 'production', so a developer
-- clicking around can never move a venue's numbers again.
--
-- This is deliberately not a second database. One project stays simpler to keep
-- in schema sync; the trade-off is that this column is the only thing separating
-- the two, so the default below matters.

alter table public.venue_analytics_events
add column if not exists environment text not null default 'production';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'venue_analytics_events_environment_check') then
    alter table public.venue_analytics_events
    add constraint venue_analytics_events_environment_check
    check (environment in ('production', 'development', 'preview'));
  end if;
end $$;

-- Reporting always filters on environment, and usually on a date range too.
create index if not exists venue_analytics_events_environment_created_idx
on public.venue_analytics_events (environment, created_at desc);

-- Backfill: everything recorded before this migration predates the split and is
-- overwhelmingly test traffic. Marked rather than deleted, so it stays available
-- for inspection and the change is reversible.
update public.venue_analytics_events
set environment = 'development'
where created_at < now();

-- The daily rollup gains the column so callers can group or filter by it.
--
-- Dropped and recreated rather than replaced: CREATE OR REPLACE VIEW can only
-- append columns, so inserting `environment` ahead of `event_date` reads to
-- Postgres as renaming the fourth column and fails with 42P16. Nothing selects
-- from this view yet, so dropping it is safe and keeps the column order
-- grouped with the other dimensions.
--
-- security_invoker stays on: the view must not widen who can read these rows.
drop view if exists public.venue_analytics_daily;

create view public.venue_analytics_daily
with (security_invoker = true) as
select
  venue_id,
  city,
  area,
  environment,
  date_trunc('day', created_at)::date as event_date,
  count(*) filter (where event_name = 'venue_profile_viewed') as profile_views,
  count(*) filter (where event_name = 'venue_directions_clicked') as directions_clicks,
  count(*) filter (where event_name = 'venue_website_clicked') as website_clicks,
  count(*) filter (where event_name = 'venue_instagram_clicked') as instagram_clicks,
  count(*) filter (where event_name = 'venue_saved') as saves,
  count(*) filter (where event_name = 'venue_unsaved') as unsaves,
  count(*) filter (where event_name = 'venue_enquiry_cta_clicked') as enquiry_cta_clicks,
  count(*) filter (where event_name = 'venue_enquiry_submitted') as enquiry_submissions,
  count(*) filter (where event_name = 'featured_placement_viewed') as featured_views,
  count(*) filter (where event_name = 'featured_placement_clicked') as featured_clicks,
  count(*) filter (where event_name = 'promoted_offer_viewed') as offer_views,
  count(*) filter (where event_name = 'promoted_offer_clicked') as offer_clicks,
  count(*) as total_events
from public.venue_analytics_events
group by venue_id, city, area, environment, date_trunc('day', created_at)::date;

notify pgrst, 'reload schema';
