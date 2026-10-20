# Unit tests

Use Node 24 and install dependencies with `npm ci`.

- `npm test` runs the unit suite once.
- `npm run test:watch` reruns tests as files change.
- `npx tsc --noEmit` checks strict TypeScript, including test files.

Put pure logic tests next to their source in `src`, named `*.test.ts` (or
`*.test.tsx`). Import test helpers explicitly from `vitest`. The runner uses
the existing Vite React plugin and `@/` alias, with Node as the default test
environment. These unit tests need no Supabase connection or environment secrets.

`src/lib/bookingSlot.test.ts` covers counting bookings by date and minute,
including database times containing seconds. No coverage floor is configured.
