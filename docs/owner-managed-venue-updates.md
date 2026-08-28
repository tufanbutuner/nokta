# Owner-Managed Venue Updates

Sprint 27 adds approval-based profile update requests.

Owners can submit structured requests for safe profile fields, but they do not directly edit live venue data. Admin approval is required before anything appears on the public venue profile.

Allowed owner-editable fields:

- Description
- Phone
- Website
- Instagram
- Price from
- Opening hours
- Features
- Vibes
- Menu URL
- Booking URL
- Contact URL

Restricted fields:

- Venue name
- Address
- Postcode
- City and area
- Coordinates
- Business status
- Verification status
- Data quality sources and notes
- Partner tier
- Monetisation status
- Claimed ownership fields

Option B is active for Sprint 27. Only claimed venues with `partner_tier` of `starter`, `growth`, or `pro` can submit update requests. Venues on `none` see an upgrade prompt.

Admins can approve, reject, or apply update requests. Applying a request filters requested changes to the allowed field list before updating the live venue profile.

This is designed as the future Starter-plan feature: keep your venue profile accurate and up to date.
