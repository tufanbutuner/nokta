# Stripe Subscriptions

Sprint 30 adds Stripe Checkout for paid Nokta venue plans.

Stripe is the billing source of truth. `public.venue_subscriptions` is the app access-control mirror used by feature gates.

## Environment

Frontend:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_value
```

Supabase Edge Functions:

```env
APP_URL=https://nokta.uk
LIVE_APP_URL=https://nokta.uk
TEST_APP_URL=http://127.0.0.1:5173

STRIPE_LIVE_SECRET_KEY=sk_live_value
STRIPE_LIVE_WEBHOOK_SECRET=whsec_live_value
STRIPE_LIVE_STARTER_PRICE_ID=price_live_value
STRIPE_LIVE_GROWTH_PRICE_ID=price_live_value
STRIPE_LIVE_PRO_PRICE_ID=price_live_value

STRIPE_TEST_SECRET_KEY=sk_test_value
STRIPE_TEST_WEBHOOK_SECRET=whsec_test_value
STRIPE_TEST_STARTER_PRICE_ID=price_test_value
STRIPE_TEST_GROWTH_PRICE_ID=price_test_value
STRIPE_TEST_PRO_PRICE_ID=price_test_value

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role_value
```

Legacy live names are still supported for compatibility: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_GROWTH_PRICE_ID` and `STRIPE_PRO_PRICE_ID`.

Do not expose Stripe secret keys, webhook secrets or `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Flow

1. Owner selects a claimed venue and paid plan on `/owner/pricing`.
2. The frontend calls the `create-checkout-session` Supabase Edge Function.
3. Stripe Checkout handles payment.
4. Stripe redirects to `/owner/billing/success`.
5. The Stripe webhook updates `venue_subscriptions`.
6. App feature gates unlock from the synced `venue_subscriptions` row.

The success page never activates access by itself.

When a user returns from Stripe Billing Portal, `/owner/billing` calls the authenticated `refresh-owner-subscription` function. This pulls the latest subscription directly from Stripe so cancellation copy updates immediately even if the webhook is still processing.

## Plans

Free has no Stripe subscription.

Paid plans map to Stripe recurring monthly price IDs:

1. Starter: `STRIPE_TEST_STARTER_PRICE_ID` locally, `STRIPE_LIVE_STARTER_PRICE_ID` in production.
2. Growth: `STRIPE_TEST_GROWTH_PRICE_ID` locally, `STRIPE_LIVE_GROWTH_PRICE_ID` in production.
3. Pro: `STRIPE_TEST_PRO_PRICE_ID` locally, `STRIPE_LIVE_PRO_PRICE_ID` in production.

Checkout mode is selected by request origin:

```txt
localhost / 127.0.0.1 -> test Stripe
production domain -> live Stripe
```

`venue_subscriptions.stripe_mode` records whether a synced subscription came from `test` or `live` Stripe.

Manual subscriptions remain supported for test venues, grandfathered venues and admin corrections.

## Edge Functions

Deploy:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-billing-portal-session
supabase functions deploy refresh-owner-subscription
supabase functions deploy stripe-webhook
```

Set both a test-mode and live-mode Stripe webhook endpoint to the same Supabase URL:

```txt
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

Subscribe to:

```txt
checkout.session.completed
checkout.session.expired
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_failed
```
