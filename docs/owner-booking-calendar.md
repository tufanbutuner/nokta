# Owner Booking Calendar

Sprint 34 adds an owner-facing calendar for booking requests.

## Scope

- The calendar visualises records from `booking_requests`.
- Week view is the default because it is the most useful operational view.
- Owners can switch between Today, Week, Month and List.
- Owners can click calendar events and manage the booking request from the existing action flow.
- Booking durations are display-only and default to two hours where needed.

## Not Availability

The calendar is not a live availability engine.

It does not:

- expose customer instant booking
- sync to external calendars
- take deposits or booking payments

Capacity itself is enforced one layer down: `venue_booking_settings.slot_capacity`
caps accepted bookings per date+time slot, checked both in the app
(`checkBookingAvailability`) and at write time by the
`enforce_booking_slot_capacity` trigger (sprint 51). Pending requests show on
the calendar but never hold a slot.

## Privacy

Customer PII is shown to authorised venue owners in the dashboard, but it is not sent to analytics.

Allowed analytics properties are limited to view, date range, venue id, status filter and event status.
