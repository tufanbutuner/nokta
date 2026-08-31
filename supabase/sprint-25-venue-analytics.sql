create table if not exists public.venue_analytics_events (
  id uuid primary key default gen_random_uuid(),
  venue_id text references public.venues(id) on delete cascade,
  event_name text not null,
  city text,
  area text,
  source_surface text,
  placement_id uuid references public.featured_placements(id) on delete set null,
  offer_id uuid references public.promoted_offers(id) on delete set null,
  enquiry_id uuid references public.venue_enquiries(id) on delete set null,
  anonymous_user_id text,
  session_id text,
  metadata jsonb not null default '{}',
  created_at timestamp with time zone not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'venue_analytics_events_event_name_check') then
    alter table public.venue_analytics_events
      add constraint venue_analytics_events_event_name_check
      check (
        event_name in (
          'venue_profile_viewed',
          'venue_directions_clicked',
          'venue_website_clicked',
          'venue_instagram_clicked',
          'venue_saved',
          'venue_unsaved',
          'venue_enquiry_cta_clicked',
          'venue_enquiry_submitted',
          'featured_placement_viewed',
          'featured_placement_clicked',
          'promoted_offer_viewed',
          'promoted_offer_clicked'
        )
      );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'venue_analytics_events_source_surface_check') then
    alter table public.venue_analytics_events
      add constraint venue_analytics_events_source_surface_check
      check (
        source_surface is null
        or source_surface in (
          'homepage',
          'city_page',
          'discover',
          'venue_page',
          'recommendations',
          'saved_venues',
          'account',
          'admin_preview'
        )
      );
  end if;
end $$;

create index if not exists venue_analytics_events_venue_id_idx on public.venue_analytics_events (venue_id);
create index if not exists venue_analytics_events_event_name_idx on public.venue_analytics_events (event_name);
create index if not exists venue_analytics_events_city_idx on public.venue_analytics_events (city);
create index if not exists venue_analytics_events_created_at_idx on public.venue_analytics_events (created_at desc);
create index if not exists venue_analytics_events_venue_date_idx on public.venue_analytics_events (venue_id, created_at desc);
create index if not exists venue_analytics_events_surface_idx on public.venue_analytics_events (source_surface);
create index if not exists venue_analytics_events_placement_id_idx on public.venue_analytics_events (placement_id);
create index if not exists venue_analytics_events_offer_id_idx on public.venue_analytics_events (offer_id);
create index if not exists venue_analytics_events_enquiry_id_idx on public.venue_analytics_events (enquiry_id);

alter table public.venue_analytics_events enable row level security;

drop policy if exists "Anyone can insert venue analytics events" on public.venue_analytics_events;
create policy "Anyone can insert venue analytics events"
on public.venue_analytics_events
for insert
with check (
  venue_id is not null
  and event_name is not null
  and event_name in (
    'venue_profile_viewed',
    'venue_directions_clicked',
    'venue_website_clicked',
    'venue_instagram_clicked',
    'venue_saved',
    'venue_unsaved',
    'venue_enquiry_cta_clicked',
    'venue_enquiry_submitted',
    'venue_booking_request_cta_clicked',
    'venue_booking_request_submitted',
    'venue_booking_status_viewed',
    'venue_booking_alternative_accepted',
    'venue_booking_alternative_declined',
    'venue_booking_confirmed',
    'venue_booking_request_declined',
    'venue_booking_alternative_proposed',
    'featured_placement_viewed',
    'featured_placement_clicked',
    'promoted_offer_viewed',
    'promoted_offer_clicked'
  )
);

drop policy if exists "Admins can read venue analytics events" on public.venue_analytics_events;
create policy "Admins can read venue analytics events"
on public.venue_analytics_events
for select
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Admins can delete venue analytics events" on public.venue_analytics_events;
create policy "Admins can delete venue analytics events"
on public.venue_analytics_events
for delete
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

create or replace view public.venue_analytics_daily
with (security_invoker = true) as
select
  venue_id,
  city,
  area,
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
group by venue_id, city, area, date_trunc('day', created_at)::date;
