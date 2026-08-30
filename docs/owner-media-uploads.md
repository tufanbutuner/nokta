# Owner Media Uploads

Claimed venue owners can upload original venue photos for admin review.

- Storage bucket: `venue-media`.
- Storage path: `{venueId}/owner-uploads/{userId}/{timestamp}-{safeFileName}`.
- Accepted types: JPEG, PNG, WebP.
- Max file size: 8 MB.
- Hard minimum dimensions: 400 x 300.
- Recommended dimensions: 800 x 600 or larger.
- Owner uploads create `venue_media` rows with `review_status = pending`.
- Owners can view approved, pending, and rejected media for venues they manage.
- Owners can edit pending or rejected alt text and captions.
- Owners can delete pending uploads.
- Public venue pages only show approved media and fall back to legacy `venues.images`.
