# Nokta owner onboarding

## Goal

Give newly approved venue owners a clear path from claim approval to a useful live owner account.

## Owner journey

1. Owner discovers Nokta through `/for-venues`.
2. Owner claims an existing venue from the venue page, or suggests a missing venue from `/suggest`.
3. Admin reviews the claim request.
4. Once approved, the owner sees the venue in `/owner`.
5. The venue dashboard shows a launch checklist for profile setup, media, availability, test booking, notifications and pricing.

## Checklist tasks

- `claim_approved`: Claim approved by the Nokta team.
- `review_profile`: Check name, address, categories, tags and opening hours.
- `upload_photos`: Add original venue photos for review.
- `configure_availability`: Set bookable days, hours and party size rules.
- `test_booking`: Submit or review a test booking.
- `enable_notifications`: Confirm booking notifications reach the right inbox.
- `review_pricing`: Review available owner plans.

## Persistence

Checklist state is stored in `public.owner_onboarding_tasks`.

Run this migration before testing persistence in Supabase:

```sql
supabase/sprint-41-owner-onboarding.sql
```

Owners can read, create and update onboarding tasks only for venues claimed by their own user id. The owner dashboard also initialises missing checklist rows when a claimed owner opens a venue dashboard.

## Admin note

Claim approval attempts to initialise onboarding tasks after approving a venue. If RLS prevents admin-side insertion, the owner dashboard still creates the tasks when the approved owner first visits their dashboard.
