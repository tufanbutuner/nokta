# Transactional email notifications

Sprint 38 adds transactional email delivery for booking and enquiry notifications.

## Policy

Emails are operational only. They cover booking confirmations, booking status updates, owner booking alerts, customer alternative responses, and owner enquiry alerts.

Marketing emails, newsletters, sponsored placements, bulk campaigns, reminders, SMS, WhatsApp, push notifications, and calendar invites are out of scope.

## Provider

The first provider is Resend, called only from the Supabase Edge Function `send-notification-email`.

Required Supabase Edge Function secrets:

- `RESEND_API_KEY`
- `EMAIL_FROM_NAME`
- `EMAIL_FROM_ADDRESS`
- `APP_URL`

Use a verified sending domain before production.

## Flow

1. A booking or enquiry action creates a `notifications` row.
2. The database creates `notification_delivery_logs` rows for each channel.
3. Email logs are queued as `pending`.
4. The app invokes `send-notification-email` with a booking, enquiry, or notification id.
5. The Edge Function sends through Resend and marks the log `sent`, `failed`, or `skipped`.

Main booking and enquiry actions do not fail if email sending fails.

## Manual Retry

To retry one pending email, invoke `send-notification-email` with:

```json
{
  "deliveryLogId": "notification-delivery-log-id"
}
```

The function logs the target count, notification id, notification type, recipient type, and final send/skipped/failed state.

## Booking Emails

- Customer booking request confirmation
- Owner new booking request
- Customer booking accepted
- Customer booking declined
- Customer alternative proposed
- Owner customer accepted alternative
- Owner customer declined alternative

## Enquiry Emails

- Owner new enquiry

## Privacy

Customer status links may include the booking token inside the URL. The raw token is not shown elsewhere.

Analytics must not include recipient email, customer name, customer phone, booking tokens, email subject, email body, booking messages, owner responses, or enquiry messages.
