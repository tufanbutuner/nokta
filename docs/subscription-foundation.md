# Subscription Foundation

Sprint 28 adds Nokta's manual billing and subscription foundation. Stripe checkout is not implemented yet.

## Plans

- Free Claimed Profile: claimed badge, owner dashboard, public profile, limited analytics and enquiry summary.
- Starter: unlocks structured profile update requests and update status tracking.
- Growth: reserved for owner enquiry inbox, promoted offers, improved analytics and priority profile support.
- Pro: reserved for featured placements, advanced analytics, offer reporting and monthly performance summaries.

## Access Control

Venue subscriptions are stored in `public.venue_subscriptions`. Owners can read subscriptions for their claimed venues, but they cannot create, update or delete subscription records.

Admins can manually assign plans, start trials, update statuses and cancel subscriptions from `/admin/subscriptions`.

## Current Gating

The `profile_update_requests` feature requires Starter, Growth or Pro with `active`, `trial` or `past_due` status.

Owners on Free, inactive or cancelled subscriptions see an upgrade prompt instead of the profile update form.

## Revenue Reporting

`/admin/monetisation` shows estimated manual MRR based on manual subscription records. This is not payment-verified until Stripe is implemented.
