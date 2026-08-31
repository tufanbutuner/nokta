# Venue Availability Settings

Sprint 35 adds rule-based venue availability for booking requests.

Availability settings decide whether a customer can send a booking request. They do not confirm the booking automatically.

Owners can configure:

- booking requests enabled or paused
- minimum and maximum party size
- minimum notice period
- maximum days in advance
- default display duration
- weekly booking windows
- blackout dates
- public booking instructions

The public booking request form validates against these settings before submit, and `bookingRequestService` checks again before inserting the request.

Out of scope:

- instant booking
- live slot inventory
- table capacity
- double-booking prevention
- deposits or booking payments
- email or SMS notifications
