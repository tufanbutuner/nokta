update public.venue_subscriptions
set
  cancel_at_period_end = true,
  last_synced_at = now(),
  updated_at = now()
where venue_id = 'sheesha-test-lounge'
and billing_provider = 'stripe'
and billing_subscription_id is not null
and status in ('active', 'trial', 'past_due');

notify pgrst, 'reload schema';
