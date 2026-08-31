# Notifications

Sprint 37 adds in-app notifications and an email delivery foundation.

## Channels

- In-app notifications are active.
- Email delivery logs are created, but email is marked `skipped` until a provider such as Resend or Postmark is wired in.
- SMS, WhatsApp, push notifications, and complex preferences are out of scope for now.

## Booking Events

Owners receive notifications when a new booking request arrives and when a customer accepts or declines an alternative time.

Customers receive notifications when a booking is accepted, declined, cancelled, or when a venue proposes an alternative time.

## Enquiry Events

Owners receive an in-app notification when a new venue enquiry is submitted for a claimed venue.

## Delivery Logs

Every notification creates delivery log rows for its configured channels. `in_app` is marked delivered immediately. `email` is skipped while no email provider is configured.

## Preferences

`notification_preferences` stores simple booking, enquiry, and marketing preferences. The default is booking/enquiry in-app and email on, marketing email off.

## Privacy

Analytics must not include recipient email, customer name, customer phone, booking tokens, notification body text, or owner/customer messages.

## Setup

Run `supabase/sprint-37-notifications.sql` in Supabase before testing notifications in production.
