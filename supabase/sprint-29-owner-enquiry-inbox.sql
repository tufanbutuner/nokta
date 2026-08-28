alter table public.venue_enquiries
add column if not exists owner_last_updated_by uuid references auth.users(id),
add column if not exists owner_last_updated_at timestamp with time zone,
add column if not exists owner_notes text;

create index if not exists venue_enquiries_owner_last_updated_by_idx
on public.venue_enquiries (owner_last_updated_by);

drop policy if exists "Growth and Pro owners can read enquiries for claimed venues" on public.venue_enquiries;
create policy "Growth and Pro owners can read enquiries for claimed venues"
on public.venue_enquiries
for select
using (
  exists (
    select 1
    from public.venues
    join public.venue_subscriptions
      on venue_subscriptions.venue_id = venues.id
    where venues.id = venue_enquiries.venue_id
      and venues.is_claimed = true
      and venues.claimed_by = auth.uid()
      and venue_subscriptions.plan in ('growth', 'pro')
      and venue_subscriptions.status in ('trial', 'active', 'past_due')
  )
);

drop policy if exists "Growth and Pro owners can update enquiries for claimed venues" on public.venue_enquiries;
create policy "Growth and Pro owners can update enquiries for claimed venues"
on public.venue_enquiries
for update
using (
  exists (
    select 1
    from public.venues
    join public.venue_subscriptions
      on venue_subscriptions.venue_id = venues.id
    where venues.id = venue_enquiries.venue_id
      and venues.is_claimed = true
      and venues.claimed_by = auth.uid()
      and venue_subscriptions.plan in ('growth', 'pro')
      and venue_subscriptions.status in ('trial', 'active', 'past_due')
  )
)
with check (
  exists (
    select 1
    from public.venues
    join public.venue_subscriptions
      on venue_subscriptions.venue_id = venues.id
    where venues.id = venue_enquiries.venue_id
      and venues.is_claimed = true
      and venues.claimed_by = auth.uid()
      and venue_subscriptions.plan in ('growth', 'pro')
      and venue_subscriptions.status in ('trial', 'active', 'past_due')
  )
);

alter table public.venue_analytics_events
drop constraint if exists venue_analytics_events_event_name_check;

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
    'venue_enquiry_converted',
    'featured_placement_viewed',
    'featured_placement_clicked',
    'promoted_offer_viewed',
    'promoted_offer_clicked'
  )
);
