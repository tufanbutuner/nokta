# Customer booking status

Sprint 36 adds tokenised status links for booking requests.

## Flow

1. A customer submits a booking request.
2. The app creates a private `customer_access_token`, a 30-day expiry, and a readable `SH-` confirmation reference.
3. The success screen links to `/booking-status/:token`.
4. The status page loads a safe payload through Supabase RPCs rather than selecting directly from `booking_requests`.
5. If the venue proposes another time, the customer can accept or decline from the status page.

## Security

The customer status RPCs return only customer-safe fields. They do not expose email, phone, submitted user IDs, admin notes, owner user IDs, or the raw token.

Run `supabase/sprint-36-customer-booking-status.sql` in Supabase before testing this in production.

## Status Rules

- `accepted` and `customer_accepted_alternative` set `confirmed_at`.
- `alternative_proposed`, `declined`, `customer_declined_alternative`, and `cancelled` are not confirmed.
- Accepting an alternative updates the requested date/time to the proposed date/time.
- Declining an alternative keeps the original request visible but marks the status as declined by the customer.
