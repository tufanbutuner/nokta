# Nokta beta smoke test script

## Public discovery

1. Open `/`.
2. Search for a venue, area or vibe.
3. Confirm it lands on `/discover` with the query applied.
4. On mobile width, tap a venue card and confirm it opens the venue page.
5. On desktop width, select a venue card and confirm the map focuses the venue.

## Booking request

1. Open a public venue page.
2. Use the booking card to pick date, time and party size.
3. Confirm `/request-booking` opens with those values filled.
4. Submit a valid booking request.
5. Confirm the success state shows a booking reference and status link.

## Owner workflow

1. Open `/owner/bookings`.
2. Open a booking from the list or calendar.
3. Accept one request and confirm the customer status page updates.
4. Decline one request and confirm the customer status page updates.
5. Propose an alternative time and confirm the customer can accept or decline.

## Admin workflow

1. Open `/admin/venues`.
2. Confirm venue list and edit pages load.
3. Open `/admin/media-review` and confirm approve/reject actions provide feedback.
4. Open `/admin/reviews` and confirm moderation controls load.
5. Open `/admin/analytics` and confirm the page renders without leaking private customer data.

## Email and notifications

1. Submit a booking request as a signed-out customer.
2. Confirm owner and customer in-app notifications are created.
3. Trigger pending email delivery.
4. Confirm Resend marks the email sent.
5. Confirm email links use production Nokta URLs.
