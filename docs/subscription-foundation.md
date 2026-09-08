# Venue plans and booking bands

Nokta has three public venue plans. `starter` remains in the database only so existing subscriptions and Stripe events can still be read safely; it is not offered to new venues.

## Plans

- Claimed (£0): public profile, original photos, profile updates, basic analytics and up to 10 accepted bookings in the monthly soft band.
- Growth (£49/month): owner enquiry inbox, improved analytics, promoted offers and an 80-accepted-booking monthly soft band.
- Pro (£99/month): up to three venues, featured placement tools, advanced reporting and no booking band.

The app reads access from `public.venue_subscriptions`. Owners can read subscriptions for venues they own. Only admins and the Stripe sync functions can mutate subscription records.

## Soft booking bands

`public.plan_booking_bands` stores each plan's band as data. `public.owner_booking_band_usage` derives usage for the current billing period, falling back to the calendar month when no Stripe period exists.

Only accepted bookings count. Declines, cancellations, no-shows and enquiries do not count. A band is a reporting signal: it must never block a request, an acceptance, or a notification. Owner Home shows the signal from 80% onward and keeps accepting requests after the band is passed.

## Booking readiness

A venue receives public booking requests only when it is claimed, has booking requests enabled, and has answered at least one of its last three requests within 48 hours. New venues with no request history are responsive by default.

`public.public_venue_booking_states` exposes only the aggregate state (`unclaimed`, `disabled`, `dormant`, or `live`). The booking insert policy calls `public.can_venue_receive_booking_requests`; the client performs the same check to replace the form with direct-contact actions.

Run `supabase/sprint-45-venue-plan-model.sql` before testing bands or booking readiness against Supabase.
