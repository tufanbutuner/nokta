# QA Environment Setup

## Overview

The QA environment uses **Vercel Preview Deployments** with a **dedicated QA Supabase project**. Each PR/branch gets an isolated preview URL, and all database writes/edge functions come from QA.

The key constraints:
- Stripe mode is detected from request origin/referer via `STRIPE_TEST_ORIGINS` (comma-separated substrings). Set this in the QA Supabase project's edge function secrets.
- `middleware.ts` derives `SITE_URL` from env (falls back to prod). QA must set `APP_URL`/`VITE_APP_URL` to the QA URL(s).
- `VITE_VERCEL_ENV` isn't auto-injected to client; set `VITE_ANALYTICS_ENV=preview` on Preview scope so analytics events are tagged and excluded from reporting.

## Step 1: Create QA Supabase project

1. Create a new Supabase project (e.g. `nokta-qa`).
2. Link or set project ref. If you have Supabase CLI: `supabase link --project-ref <qa-ref>`.
3. Run migrations against QA:
   ```bash
   supabase db push --project-ref <qa-ref>
   ```
   (Migrations are in `supabase/migrations/`; see baseline notes below.)
4. Seed test data (optional): set QA env vars for your shell and run seed scripts against QA.

## Step 2: Configure QA Supabase edge function secrets

In the QA Supabase project (Dashboard → Edge Functions → Secrets), set these:

| Secret | Value |
|---|---|
| `STRIPE_TEST_SECRET_KEY` | `sk_test_*` |
| `STRIPE_TEST_WEBHOOK_SECRET` | `whsec_*` (from your Stripe test webhook endpoint) |
| `STRIPE_TEST_STARTER_PRICE_ID`, `STRIPE_TEST_GROWTH_PRICE_ID`, `STRIPE_TEST_PRO_PRICE_ID` | `price_test_*` |
| `STRIPE_TEST_ORIGINS` | Comma-separated substrings; e.g. `qa.nokta.uk,nokta-git-qa,.vercel.app` (broadens test mode to preview origins) |
| `TEST_APP_URL` | QA base URL (e.g. `https://qa.nokta.uk`) |
| `APP_URL` | QA base URL |
| `NOTIFICATION_DISPATCH_SECRET` | Same shared secret as Vercel Preview (`/api/send-notification-email` must match edge function) |
| `RESEND_API_KEY` | QA sandbox key (or leave unset to disable emails) |
| `EMAIL_FROM_NAME` | Nokta |
| `EMAIL_FROM_ADDRESS` | hello@nokta.uk |
| `SUPABASE_URL` | QA project URL (set automatically) |
| `SUPABASE_SERVICE_ROLE_KEY` | QA service role (set automatically) |

Leave live Stripe secrets unset in QA.

## Step 3: Configure Vercel Preview environment variables

In Vercel project → Settings → Environment Variables, add the following to **Preview** scope:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | QA Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | QA anon key |
| `VITE_ADMIN_EMAILS` | QA test admin emails |
| `VITE_APP_URL` | QA URL |
| `VITE_ANALYTICS_ENV` | `preview` |
| `VITE_POSTHOG_PROJECT_TOKEN`/`VITE_POSTHOG_HOST` | QA/dev PostHog (or leave) |
| `SUPABASE_URL` | QA Supabase URL |
| `NOTIFICATION_DISPATCH_SECRET` | Same as QA edge function secret |

**Do not** add `SUPABASE_SERVICE_ROLE_KEY` to Vercel.

Notes:
- `VITE_VERCEL_ENV` is not auto-injected to Vite client; setting `VITE_ANALYTICS_ENV=preview` is required so preview traffic is tagged correctly.
- `emailUrls.ts` falls back to `window.location.origin` when `VITE_APP_URL` is unset; setting it explicitly is fine.
- `middleware.ts` now reads `APP_URL`/`VITE_APP_URL`/`VERCEL_URL` to set `SITE_URL` (OG links). For QA, set `APP_URL` in the Edge runtime context? Edge middleware uses `process.env`; in Vercel, server env vars are available. Also `VITE_APP_URL` is exposed to client; the middleware can read both.

## Step 4: Auth redirects

In Supabase QA Auth → URL Configuration:
- Set **Site URL** to QA URL
- Add redirect URLs for QA and per-PR previews. For wildcard previews: `https://*.nokta.vercel.app/**` (if you use nokta-* project name). Alternatively use the stable `qa` alias.
- If you need password resets/email invites to work, include those domains.

## Step 5: Stripe test webhook

Create a Stripe test webhook pointing to the QA Supabase edge function: `https://<qa-project-ref>.supabase.co/functions/v1/stripe-webhook` and set `STRIPE_TEST_WEBHOOK_SECRET` to that endpoint's signing secret. Run test events via Stripe CLI (`stripe trigger checkout.session.completed` etc.) to verify.

## Step 6: Branching/aliasing

- **Per-PR QA**: Vercel builds each PR against Preview env → uses QA Supabase. No extra setup.
- **Stable QA**: Create a long-lived `qa` branch, or alias `qa.nokta.uk` to the latest preview deployment. Keep Preview env vars set.

## Migrations notes (important)

`schema.sql` is **stale/inconsistent** and shouldn't be treated as the authoritative baseline for a fresh prod-to-QA copy. The migration pipeline:
- `20260909000000_baseline_stale.sql` — a copy of `schema.sql` (includes up to ~sprint-30 + halal). It's stored for scaffolding; not guaranteed runnable standalone.
- `20260908150000_sprint-31-owner-promotion-requests.sql` onward — sprint deltas 31,33,35,39,41,42,43,44,45,47,47-fix,48,49,50. Sprint-46 (halal) was already in baseline. Sprint-32/34/36/37/38/40 (if any) were not included as separate deltas; their objects should be present if baseline+sprints cover full history. The sprint files are idempotent (`if not exists`, `drop policy if exists`, `create or replace`) which helps.

**Recommended baseline for new QA:** `supabase db pull` from production (Supabase CLI) and commit that single migration as the true baseline, then mark prod migrations as applied. The sprint deltas we created are useful history but may be redundant if you regenerate from prod.

## Local testing notes

- To test migrations locally: `supabase start` (if CLI available), then `supabase db reset` to apply migrations.
- Stripe mode defaults to test only for localhost and configured test origins. If you run against QA Supabase from localhost, add `localhost,127.0.0.1` to `STRIPE_TEST_ORIGINS` in QA? Probably not needed (defaults are localhost/127). Alternatively run against a local Supabase stack for fully offline QA.
- For the `/api/send-notification-email` proxy: on Preview, Vercel's route reads `SUPABASE_URL` and `NOTIFICATION_DISPATCH_SECRET` from Preview env; the edge function must have matching secret.
- Analytics: events in QA are tagged `environment=preview` (set via `VITE_ANALYTICS_ENV=preview`) and excluded from reporting (`isProductionAnalytics()` is false). This matches `sprint-48-analytics-environment.sql`.

## Quick checklist

- [ ] Create QA Supabase project
- [ ] Set edge function secrets with `STRIPE_TEST_ORIGINS` including preview domains
- [ ] Set Vercel Preview env vars (especially `VITE_ANALYTICS_ENV=preview`, `VITE_APP_URL`, `SUPABASE_URL`, `NOTIFICATION_DISPATCH_SECRET`)
- [ ] `supabase db push` to QA
- [ ] Configure Stripe test webhook + webhook secret
- [ ] Add QA/preview redirect URLs in Supabase Auth
- [ ] Open a test PR and verify preview builds with QA Supabase; try a test Stripe checkout; confirm emails don't go to real people (or use sandbox)
