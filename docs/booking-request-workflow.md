# Booking Request Workflow

Sprint 33 adds request-based booking for Sheesha venues.

## Product Model

- Customers request a booking with date, time and party size.
- The booking is not confirmed until the venue accepts it.
- Owners can accept, decline or propose another time.
- Sheesha is not doing live availability, instant confirmation, deposits or payments for bookings yet.
- Email notifications are not part of this sprint.

## Data And Privacy

- Booking requests include customer name, email, optional phone, date, time, party size, occasion and optional message.
- Customer PII must not be sent to PostHog or venue analytics.
- Analytics can use safe buckets only, such as party size bucket, requested date bucket, status, venue, city and source surface.

## Owner Rules

Owners can update status and owner response fields only.

Owners must not update customer name, customer email, customer phone, requested date, requested time, party size, message, venue id, submitted user id or admin notes.

## Current Statuses

- `pending`: customer submitted the request.
- `accepted`: venue accepted the requested date and time.
- `declined`: venue declined the request.
- `alternative_proposed`: venue suggested another date or time.
- `cancelled`: request was cancelled.
- `completed`: booking happened.
- `no_show`: customer did not attend.
- `spam`: admin marked the request as spam.
