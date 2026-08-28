select
  venues.id as venue_id,
  venues.name,
  venues.partner_tier,
  venues.monetisation_status,
  venue_subscriptions.plan,
  venue_subscriptions.status,
  venue_subscriptions.billing_provider,
  venue_subscriptions.billing_customer_id,
  venue_subscriptions.billing_subscription_id,
  venue_subscriptions.stripe_price_id,
  venue_subscriptions.stripe_mode,
  venue_subscriptions.current_period_start,
  venue_subscriptions.current_period_end,
  venue_subscriptions.last_stripe_event_id,
  venue_subscriptions.last_synced_at,
  venue_subscriptions.updated_at
from public.venues
left join public.venue_subscriptions
  on venue_subscriptions.venue_id = venues.id
where venues.id = 'sheesha-test-lounge';

select
  target_plan,
  stripe_checkout_session_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_mode,
  status,
  created_at,
  completed_at
from public.stripe_checkout_sessions
where venue_id = 'sheesha-test-lounge'
order by created_at desc
limit 5;
