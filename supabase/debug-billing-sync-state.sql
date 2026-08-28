select
  venues.id as venue_id,
  venues.name,
  venues.partner_tier,
  venues.monetisation_status,
  venue_subscriptions.plan,
  venue_subscriptions.status as subscription_status,
  venue_subscriptions.billing_provider,
  venue_subscriptions.billing_customer_id,
  venue_subscriptions.billing_subscription_id,
  venue_subscriptions.stripe_mode as subscription_stripe_mode,
  venue_subscriptions.stripe_price_id,
  venue_subscriptions.cancel_at_period_end,
  venue_subscriptions.current_period_end,
  venue_subscriptions.cancelled_at,
  venue_subscriptions.last_stripe_event_id,
  venue_subscriptions.last_synced_at,
  venue_subscriptions.updated_at as subscription_updated_at,
  target_plan,
  stripe_checkout_session_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_checkout_sessions.stripe_mode as checkout_stripe_mode,
  stripe_checkout_sessions.status as checkout_status,
  stripe_checkout_sessions.created_at as checkout_created_at,
  stripe_checkout_sessions.completed_at as checkout_completed_at
from public.venues
left join public.venue_subscriptions
  on venue_subscriptions.venue_id = venues.id
left join public.stripe_checkout_sessions
  on stripe_checkout_sessions.venue_id = venues.id
where venues.id = 'sheesha-test-lounge'
order by stripe_checkout_sessions.created_at desc
limit 10;
