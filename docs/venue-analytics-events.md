# Venue Analytics Events

Allowed venue commercial analytics events:

- `venue_profile_viewed`: venue detail page viewed.
- `venue_directions_clicked`: directions CTA clicked.
- `venue_website_clicked`: venue website clicked.
- `venue_instagram_clicked`: venue Instagram clicked.
- `venue_saved`: venue saved by a user.
- `venue_unsaved`: venue removed from saved venues.
- `venue_enquiry_cta_clicked`: enquiry CTA clicked.
- `venue_enquiry_submitted`: enquiry successfully submitted.
- `featured_placement_viewed`: featured placement rendered.
- `featured_placement_clicked`: featured placement clicked.
- `promoted_offer_viewed`: promoted offer rendered.
- `promoted_offer_clicked`: promoted offer CTA clicked.

Allowed metadata must be non-personal. Useful examples include `placementType`, `offerType`, `enquiryType`, `partySize`, `hasPreferredDate`, `hasPreferredTime`, `hasPhone` and `hasMessage`.

Blocked metadata includes customer name, email, phone, message text, admin notes, free-form notes and precise latitude/longitude.
