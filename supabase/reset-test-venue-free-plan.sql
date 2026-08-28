update public.venues
set
  partner_tier = 'none',
  monetisation_status = 'not-contacted',
  featured_eligible = true,
  is_test = true,
  updated_at = now()
where id = 'sheesha-test-lounge';

update public.venue_subscriptions
set
  plan = 'free',
  status = 'inactive',
  billing_provider = 'manual',
  billing_customer_id = null,
  billing_subscription_id = null,
  stripe_price_id = null,
  stripe_product_id = null,
  cancel_at_period_end = false,
  current_period_start = null,
  current_period_end = null,
  trial_started_at = null,
  trial_ends_at = null,
  cancelled_at = null,
  last_stripe_event_id = null,
  last_synced_at = null,
  admin_notes = 'Reset to Free for Stripe upgrade testing.',
  updated_at = now()
where venue_id = 'sheesha-test-lounge';

notify pgrst, 'reload schema';
