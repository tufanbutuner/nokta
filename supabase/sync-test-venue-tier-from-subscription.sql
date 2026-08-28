update public.venues
set
  partner_tier = case
    when venue_subscriptions.status in ('active', 'trial', 'past_due')
      and venue_subscriptions.plan in ('starter', 'growth', 'pro')
      then venue_subscriptions.plan
    else 'none'
  end,
  monetisation_status = case
    when venue_subscriptions.status in ('active', 'trial', 'past_due')
      and venue_subscriptions.billing_provider = 'stripe'
      then 'paying'
    when venue_subscriptions.status in ('active', 'trial', 'past_due')
      then 'trial'
    else 'not-contacted'
  end,
  updated_at = now()
from public.venue_subscriptions
where venues.id = venue_subscriptions.venue_id
and venues.id = 'sheesha-test-lounge';

notify pgrst, 'reload schema';
