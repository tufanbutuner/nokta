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

- prevent double-booking
- expose customer instant booking
- manage slots or capacity
- sync to external calendars
- take deposits or booking payments

## Privacy

Customer PII is shown to authorised venue owners in the dashboard, but it is not sent to analytics.

Allowed analytics properties are limited to view, date range, venue id, status filter and event status.
