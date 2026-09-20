-- Remove the dormant booking state.
--
-- A venue that had been slow to answer its last few requests was classified
-- dormant, and the venue page then refused to take a booking and told the
-- customer to phone instead. That turns a venue's past slowness into a dead end
-- for the customer in front of us: the request they came to make is the thing
-- we stop them doing.
--
-- Responsiveness is still computed and still published on the view, so it stays
-- available for ranking, owner nudges and admin reporting. It just no longer
-- decides whether a booking can be requested. Only the two states that reflect
-- what a venue can actually receive remain: unclaimed, and booking requests
-- switched off.

create or replace view public.public_venue_booking_states
with (security_invoker = false)
as
select
  v.id as venue_id,
  v.is_claimed,
  coalesce(vbs.booking_requests_enabled, false) as booking_requests_enabled,
  public.is_venue_booking_responsive(v.id) as responsive,
  case
    when not v.is_claimed then 'unclaimed'
    when not coalesce(vbs.booking_requests_enabled, false) then 'disabled'
    else 'live'
  end as state
from public.venues v
left join public.venue_booking_settings vbs on vbs.venue_id = v.id;

grant select on public.public_venue_booking_states to anon, authenticated;
