# Analytics

Two systems run side by side, on purpose. They answer different questions and
are not expected to agree on totals.

## Which system answers what

| | PostHog | `venue_analytics_events` (Supabase) |
|---|---|---|
| Answers | How the product is used: funnels, retention, where people drop out | What a venue earned: profile views, directions, enquiries |
| Audience | Us | Venue owners, via their dashboard, and admin reporting |
| Shape | Event stream with user identity and session recording | Rows we own, queryable with SQL and joinable to venues |
| Retention | Whatever the plan allows | Ours, indefinitely |

The overlap is deliberate. Owner-facing numbers must not depend on a third party
that can change pricing, sampling or retention, so they live in our own database.
Product questions are far easier to answer in PostHog than in SQL, so they live
there. `trackEvent` writes to both, and `trackVenueAnalyticsEvent` writes only to
Supabase.

**Do not treat one as the source of truth for the other's questions.** Totals will
differ — ad blockers stop PostHog but not our own insert, and the two apply
different session and identity rules. If a number is shown to a venue owner, it
comes from Supabase.

## Environment separation

Both systems distinguish real traffic from ours, using the same helper,
`getAnalyticsEnvironment()` in `src/lib/analyticsEnvironment.ts`.

The environment is **derived, not configured**: anything that is not a production
build counts as non-production. That direction matters — a missing variable means
real traffic goes uncounted, never that test traffic is counted as real.
`VITE_ANALYTICS_ENV` overrides it, which is what preview deployments set.

The two systems act on it differently, on purpose:

- **Supabase** records everything and tags it. `venue_analytics_events.environment`
  is stamped on write, and reads filter to `production` by default in
  `getAdminVenueAnalyticsEvents`, which every admin and owner read funnels
  through. Test events stay in the table and can be inspected.
- **PostHog** is not initialised at all outside production. Tagging and filtering
  in the UI would work, but not sending is better: test sessions stop consuming
  event and recording quota, and every chart is right by default rather than right
  only when someone remembers the filter. `environment` is also registered as a
  super property, so the two systems agree if a non-production key is ever used.

To verify the PostHog integration from a local build, set
`VITE_ANALYTICS_ENV=production` in `.env.local` temporarily. Remember to remove it.

### Why the backfill says `development`

Before this split, local browsing wrote into the same rows as real visitors —
1,267 events from 22 distinct anonymous ids across 43 sessions, 696 of them on a
single day of front-end work. `supabase/sprint-48-analytics-environment.sql`
marked all pre-existing rows `development` rather than deleting them, so they stay
inspectable and the change is reversible. Production counts start from zero.

## User identity

`AuthContext` calls `identifyPostHogUser` when a session resolves and
`resetPostHogUser` on sign-out, so the anonymous history leading up to a signup is
stitched to the account.

Two details worth keeping:

- Identity is driven by the **resolved session**, not the `signIn` callback, so a
  user returning with a stored session is identified too.
- Reset fires only on a real sign-out — a transition from identified to not.
  Calling it whenever there is no user would discard the anonymous id of every
  signed-out visitor on each page load, which is exactly the history `identify()`
  exists to connect.

Only the account id and email are sent. Nothing else about a user belongs in an
analytics profile.

## Known gap

Admin and owner analytics under-count past 1,000 events. PostgREST caps responses
at 1,000 rows regardless of the `.limit(5000)` in `getAdminVenueAnalyticsEvents`,
and the summaries reduce over that truncated array. Currently masked because
production counts are zero, but it will misreport once real traffic accumulates.
The fix is to aggregate database-side — `venue_analytics_daily` already has the
right shape.
