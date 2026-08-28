# Stripe Subscriptions

Sprint 30 adds Stripe Checkout for paid Sheesha venue plans.

Stripe is the billing source of truth. `public.venue_subscriptions` is the app access-control mirror used by feature gates.

## Environment

Frontend:

```env
VITE_APP_URL=https://your-domain.example
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_value
```

Supabase Edge Functions:

```env
APP_URL=https://your-domain.example
STRIPE_SECRET_KEY=sk_test_or_live_value
STRIPE_WEBHOOK_SECRET=whsec_value
STRIPE_STARTER_PRICE_ID=price_value
STRIPE_GROWTH_PRICE_ID=price_value
STRIPE_PRO_PRICE_ID=price_value
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role_value
```

Do not expose `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Flow

1. Owner selects a claimed venue and paid plan on `/owner/pricing`.
2. The frontend calls the `create-checkout-session` Supabase Edge Function.
3. Stripe Checkout handles payment.
4. Stripe redirects to `/owner/billing/success`.
5. The Stripe webhook updates `venue_subscriptions`.
6. App feature gates unlock from the synced `venue_subscriptions` row.

The success page never activates access by itself.

## Plans

Free has no Stripe subscription.

Paid plans map to Stripe recurring monthly price IDs:

1. Starter: `STRIPE_STARTER_PRICE_ID`
2. Growth: `STRIPE_GROWTH_PRICE_ID`
3. Pro: `STRIPE_PRO_PRICE_ID`

Manual subscriptions remain supported for test venues, grandfathered venues and admin corrections.

## Edge Functions

Deploy:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-billing-portal-session
supabase functions deploy stripe-webhook
```

Set Stripe webhook endpoint to:

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
