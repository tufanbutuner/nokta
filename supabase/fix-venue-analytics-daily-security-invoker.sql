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

notify pgrst, 'reload schema';
