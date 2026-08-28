# Billing Test Plan

Use Stripe test mode before enabling live payments.

## Setup

1. Create Starter, Growth and Pro products in Stripe.
2. Create monthly recurring GBP prices for £29, £59 and £99.
3. Add the price IDs to Supabase Edge Function secrets.
4. Deploy all Sprint 30 Supabase Edge Functions.
5. Configure the Stripe webhook endpoint and copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## Success Path

1. Sign in as a venue owner.
2. Open `/owner/pricing`.
3. Select a claimed venue.
4. Choose Starter, Growth or Pro.
5. Pay with Stripe test card `4242 4242 4242 4242`.
6. Confirm `/owner/billing/success` loads.
7. Confirm `venue_subscriptions.billing_provider = 'stripe'`.
8. Confirm the selected plan unlocks gated features.

## Failed Payment

1. Use Stripe test card `4000 0000 0000 0341`.
2. Confirm checkout fails in Stripe.
3. For subscription payment failures, confirm webhook sets `status = 'past_due'`.

## Expired Checkout

1. Create a checkout session from `/owner/pricing`.
2. Expire the session in Stripe test tools.
3. Confirm `stripe_checkout_sessions.status = 'expired'`.

## Cancellation

1. Open `/owner/billing`.
2. Click `Manage billing`.
3. Cancel from the Stripe billing portal.
4. Confirm webhook updates `cancel_at_period_end` or `status = 'cancelled'`, depending on the Stripe action.

## Plan Changes

Plan changes should be handled in Stripe Billing Portal once portal configuration allows subscription updates. The webhook should sync the new price ID back to the Sheesha plan.
