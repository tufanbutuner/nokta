# Nokta

Nokta is a mobile-first web app for discovering social venues across the UK,
starting with shisha lounges and a London-first focus. Visitors can browse venues,
save and share shortlists, get recommendations, and send booking requests or
enquiries. Venue owners manage their listings and requests in `/owner`.

A booking request is not instant confirmation: the venue accepts, declines, or
suggests another time. See [PRODUCT.md](PRODUCT.md) for the product direction.

## Local setup

Use **Node.js 24** (see [.nvmrc](.nvmrc)) and npm. You need access to the project's
QA Supabase environment for data-backed features.

1. Clone the repository and install dependencies:

   ```sh
   git clone https://github.com/tufanbutuner/nokta.git
   cd nokta
   nvm use # If you use nvm; otherwise select Node 24 with your version manager.
   npm ci
   ```

2. Create your local configuration:

   ```sh
   cp .env.example .env.local
   ```

   Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the **QA** project's
   URL and public key. If using `VITE_SUPABASE_PUBLISHABLE_KEY` instead, remove
   the example `VITE_SUPABASE_ANON_KEY` entry so it does not take precedence.
   Set `VITE_APP_URL` and `APP_URL` to `http://127.0.0.1:5173` for local links;
   allow that local URL in QA Supabase's Auth redirect configuration when testing
   authentication. Restart Vite after changing environment variables.

3. Start the frontend:

   ```sh
   npm run dev
   ```

   Open <http://127.0.0.1:5173>. The port is strict: if it is occupied, stop the
   other server or use `PORT=5174 npm run dev` and adjust your local URLs.

The Vite server serves the frontend. Vercel API routes, edge middleware, and
Supabase Edge Functions need their respective runtimes; use the configured QA
deployment to verify complete email and payment flows. Follow the
[QA environment guide](docs/qa-environment.md) for backend setup. Its migration
notes explain why the historical baseline is not a reliable fresh database setup.

`.env.example` also lists optional analytics and server-side configuration.
Anything prefixed with `VITE_` is exposed to the browser: never put service-role
keys or other secrets there. Keep local secrets in ignored environment files.
The service-role key is for seed scripts, not the frontend or Vercel email proxy.

## Development checks

```sh
npm test                 # Run Vitest once; no Supabase credentials needed.
npm run test:watch       # Watch unit tests during development.
npx tsc --noEmit         # Strict TypeScript check, including tests.
npm run check:seo        # Metadata parity and crawler HTML checks.
```

Tests live beside source files as `src/**/*.test.{ts,tsx}` and use a Node
environment. See [unit testing](docs/unit-testing.md) for conventions. There is
currently no configured lint command or automated Playwright suite. Integration
and end-to-end checks must use QA Supabase, never production; the
[beta smoke test script](docs/beta-smoke-test-script.md) covers manual flows.

## Build and preview

```sh
npm run build
npm run preview
```

The build runs TypeScript, generates `public/sitemap.xml`, and writes the Vite
bundle to `dist/`. Sitemap generation reads venue slugs from the configured
Supabase project and requires a public key, connectivity, and eligible venue
rows. It intentionally fails if no slugs are returned. Review generated sitemap
changes before committing.

Preview serves the built frontend at <http://127.0.0.1:4173>; it does not emulate
Vercel API routes or Supabase Edge Functions. To check frontend bundling without
database access, run `npx tsc --noEmit && npx vite build`; this skips sitemap
generation and does not replace the full release build.

## Stack and structure

The app uses React 19, TypeScript, React Router 7, Vite 8, Tailwind CSS 4,
TanStack Query, and Radix UI. Supabase provides Postgres, authentication, storage,
and Edge Functions; maps use Leaflet/MapLibre, and payments use Stripe.

```text
src/pages/          Route-level screens
src/components/     UI grouped by feature
src/services/       Database access and service operations
src/lib/            Shared helpers, validation, and mapping
src/types/          Shared TypeScript types
src/data/           Category, city, and other app configuration
api/                Vercel server endpoints
middleware.ts       Vercel edge handling and crawler metadata
supabase/           SQL migrations, SQL editor copies, and Edge Functions
scripts/            Sitemap, SEO, venue discovery, and seed utilities
docs/               Feature plans, policies, and operational guides
```

## Contributing

Keep the layers `pages → components/<feature> → services → lib/types`. Put
database access in services and pure mapping or validation in `src/lib`. Use
strict types without `any` or casual casts. Services wrap failures with useful
`Could not <action>: <cause>` errors for the UI to handle.

Work on a feature branch and use Conventional Commit messages, such as
`docs: add project README`. Changes go through `qa` for QA deployment before
promotion to `main` for production. Add tests for changed behavior and run the
checks above before requesting review.

Schema changes need a timestamped file in `supabase/migrations/` plus a matching
`sprint-N` or `fix-*` SQL copy at the `supabase/` root for the SQL editor. Record
decisions and feature plans in `docs/`. Venue seeding writes database records;
read the [London seeding guide](docs/london-venue-seeding.md) and verify the target
environment before running seed commands.
