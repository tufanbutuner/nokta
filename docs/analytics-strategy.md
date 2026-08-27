# Sheesha Analytics Strategy

Sheesha uses three analytics layers:

- Vercel Analytics is for basic site-level traffic and page overview.
- PostHog is for product analytics, route views, funnels, user journeys, feature flags and session-level product insight.
- Supabase is the source of truth for venue commercial analytics.

Venue reporting uses Supabase because it needs to be queryable by venue, city and date range, controlled by Sheesha, safe to expose later to venue owners, and useful for monetisation reporting.

Privacy rules:

- Do not store customer names, emails, phone numbers, enquiry text, admin notes, IP addresses or precise user locations in analytics events.
- Do not track precise latitude or longitude in analytics metadata.
- Do not expose raw analytics events publicly.
- Public users may insert venue analytics events, but only admins can read raw events.
- Venue owner analytics dashboards can be added later from the same safe event foundation.
