# Venue Availability Settings

Sprint 35 adds rule-based venue availability for booking requests.

Availability settings decide whether a customer can send a booking request. They do not confirm the booking automatically.

Owners can configure:

- booking requests enabled or paused
- minimum and maximum party size
- minimum notice period
- maximum days in advance
- default display duration
- bookings per time slot (`slot_capacity`, sprint 51)
- weekly booking windows
- blackout dates (full day or partial, blocking the covered times)
- public booking instructions

The public booking request form validates against these settings before submit, and `bookingRequestService` checks again before inserting the request.

## Slot capacity (sprint 51)

- Each venue has `slot_capacity`: how many accepted bookings may hold the same
  date+time slot (default 1). The picker drops a time only once accepted
  bookings for it reach the capacity, and `checkBookingAvailability` rejects
  submits past it.
- Only `accepted` and `customer_accepted_alternative` occupy a slot; pending
  requests never hold capacity.
- An agreed alternative occupies its **proposed** date/time, not the originally
  requested one (`src/lib/bookingSlot.ts`, mirrored by the SQL function
  `public.effective_booking_slot`).
- The database trigger `enforce_booking_slot_capacity` re-checks capacity at
  write time, serialised per venue, so concurrent confirms cannot exceed it.
  It raises `SLOT_CAPACITY_REACHED`, which the owner UI maps to a friendly error.

Out of scope:

- instant booking
- live slot inventory
- table capacity / seat maps
- deposits or booking payments
- email or SMS notifications
