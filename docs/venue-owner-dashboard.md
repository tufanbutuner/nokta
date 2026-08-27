# Venue Owner Dashboard

The owner dashboard is for signed-in users with one or more claimed venues.

Access rules:

- Owner access is based on `venues.is_claimed = true` and `venues.claimed_by = auth.uid()`.
- Claim request history does not grant dashboard access.
- Owners can only see analytics and summaries for their own claimed venues.

Sprint 26 is mostly read-only:

- Owners can see their claimed venues.
- Owners can see venue analytics for their own venues.
- Owners can see enquiry counts only.
- Owners can see active promoted offers and featured placements.
- Owners can see public profile information.

Owners cannot yet:

- Edit venue profiles.
- Upload or manage photos.
- Create or edit offers.
- Create or edit featured placements.
- See customer names, emails, phone numbers or enquiry message text.
- Update enquiry statuses or reply to customers.

Owner-managed profile updates are planned for Sprint 27.

Owner enquiry inbox is planned for Sprint 28.
