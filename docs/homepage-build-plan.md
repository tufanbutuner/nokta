# Nokta Homepage — Build Plan

Break the homepage redesign into a sequence of short sprints and tickets we can work through slowly.
Prototypes live in `prototypes/`; the deliverable is a single self-contained page at `nokta-search.html`.
This plan is how we port that direction into the real app (`src/pages/HomePage.tsx`).

---

## North star

A **category-neutral, discovery-first homepage** that carries the *nokta* (dot / place) philosophy as a
quiet signature — not the structure.

- **Discoverable**: finding a place should "make sense" and "feel familiar but new".
- **Neutral**: restaurants, cafés and shisha lounges are equal citizens. Nothing is shisha-shaped.
- **London-first**: confident about London, honest about everywhere else.
- **Smart search** and a **dynamic, scalable filter system**.
- **Category-neutral by configuration** — a new category is added in data, not by rebuilding the UI.

### Principles / guardrails

- Reuse before we invent: `useVenues()`, `filterVenues`, `sortVenues`, `getVenueAmenities`,
  `venueCategories`, `SUPPORTED_CITIES`. No parallel data layer.
- The **URL is the source of truth** for filter state (`parseVenueFilters` / `filtersToSearchParams`).
- **Featured placements must be labelled "Featured"** (`docs/featured-placements-policy.md`).
- Mobile-first; test at 360 / 430 / 768 / 1024 / 1440.
- Every new surface must survive `restaurant` / `cafe` being switched on in `venueCategories.ts`.

---

## Key decision to record first: Homepage vs Discover split

**Recommendation:** the homepage is a *light browse* surface (hero + search + popular categories +
curated rails). The *full filtered list* lives at `/discover` (the existing `DiscoverPage`).

Why:

- It keeps the homepage fast, calm and "familiar but new".
- `/discover` already owns filters, sort, map and URL-state — no duplicate system.
- The homepage search **submits into `/discover?q=…`**, which is the natural hand-off.
- Featured/curated content gets room to breathe on the homepage without competing with filters.

This mirrors the prototype: search + categories up top, results list below. On the homepage the
"results list" region becomes curated rails; the Booking-style results list *is* `DiscoverPage`.

> **Open question for sign-off** — see [Open decisions](#open-decisions).

---

## Where things live (touchpoints)

| Concern | File |
| --- | --- |
| Homepage | `src/pages/HomePage.tsx` |
| Results / filters | `src/pages/DiscoverPage.tsx` |
| Search input | `src/components/search/VenueSearch.tsx` |
| Filter panel | `src/components/search/VenueFilters.tsx` |
| Category config | `src/data/venueCategories.ts` (`isActive` gates a category) |
| Cities | `src/data/supportedCities.ts`, `src/lib/cities.ts` |
| Filter engine | `src/lib/venueFilters.ts`, `src/lib/filterVenues.ts`, `src/lib/sortVenues.ts` |
| Amenity chips | `src/lib/venueAmenities.ts` |
| Featured | `src/components/featured/*`, `src/services/featuredPlacementService.ts` |
| Cards | `src/components/venues/VenueCard.tsx`, `VenueGrid.tsx` |
| Featured policy | `docs/featured-placements-policy.md` |

---

## Sprint 0 — Foundations

Small, unblocks everything else.

- **H0.1 — Record the IA decision (ADR).** Homepage = browse; `/discover` = full list. Write it down
  so the split is intentional.
- **H0.2 — Design contract.** Freeze tokens (cream, clay `#c45d3e`, Outfit/Onest), spacing scale,
  radius, and the **dot rules** (where the clay dot may appear and where it must not — no dot soup).
- **H0.3 — Component map.** Table mapping each prototype element to an existing component/token, with
  gaps called out (e.g. the new search bar, the category rail, the redesigned card).
- **H0.4 — Rollout safety.** Feature flag or branch strategy so the new homepage can ship behind a
  toggle and be reverted cleanly.

**Done when:** the ADR, design contract and component map exist; nothing user-facing ships yet.

---

## Sprint 1 — Homepage shell & hero

The frame the rest hangs off.

- **H1.1 — Hero shell.** Rebuild the top of `HomePage.tsx` around `PageContainer`: calm hero, clear
  hierarchy, room for the search.
- **H1.2 — Hero copy + dot signature.** Headline ("Find your next spot") and a single, deliberate dot.
  **No "Discover somewhere worth going" eyebrow** (removed by decision).
- **H1.3 — Compact top-centre search bar.** New `HomeSearchBar`: centred, compact, never the
  Airbnb segmented Where/When/Who pill. Placeholder, submit arrow, keyboard (Enter) support.
- **H1.4 — Popular categories rail.** Directly beneath the search. Driven by `venueCategories` +
  live counts. On mobile it is a **single swipeable line** (no wrapping into rows) with hidden
  scrollbar and scroll-snap — the exact fix validated in the prototype.
- **H1.5 — Mobile QA.** 360/430: no horizontal overflow, search stays compact (~53px), rail scrolls.

**Done when:** a visitor sees hero → search → popular categories, and submitting the search lands on
`/discover` with results. Categories reflect what is actually active.

---

## Sprint 2 — A search that is actually smart

Split deliberately: UX first, intelligence second, so we can ship value early.

- **H2.1 — Search UX.** Submit-to-`/discover`, recent searches (local), clear button, sensible
  placeholder, loading and zero-result states.
- **H2.2 — Matching engine v1.** Upgrade `filterVenues`: search across name, area, city, description,
  vibes **and** `secondaryCategories`, with **ranking** (exact name > area > partial) rather than
  plain substring-reject.
- **H2.3 — Tolerant matching.** Typo tolerance ("shisha loungs"), postcode support, and synonyms
  (e.g. "hookah" → shisha). Guard against false positives.
- **H2.4 — Typeahead / suggestions.** Debounced suggestions for **venues, areas, vibes and
  categories** — one dropdown, mixed results. Reuse the same matching engine so results agree.
- **H2.5 — "Near me".** Geolocation + nearest-first, using `sortVenues(..., "nearest")` and the
  existing location helper.
- **H2.6 — Search telemetry.** Log queries and **zero-result queries** so the vocabulary learns what
  people actually type (feeds H2.3 and the category config).

**Done when:** common real queries return sensible results on the first try, and we can see what
people searched that found nothing.

---

## Sprint 3 — Dynamic & scalable filtering

The Booking-style results list with a left filter rail, powered by one extensible model.

- **H3.1 — URL as single source of truth.** All filters round-trip through the URL
  (`parseVenueFilters` / `filtersToSearchParams`) so any view is shareable and back/forward works.
- **H3.2 — Config-driven facets.** Derive facets from config (categories, vibes, features, amenities)
  instead of hand-coded buttons, so a new category or attribute registers itself.
- **H3.3 — Live facet counts.** Show result counts per option ("Outdoor (24)") computed against the
  current result set — the thing that makes filtering feel smart rather than static.
- **H3.4 — Smart defaults & progressive disclosure.** Sensible default city; advanced filters
  collapsed; active filters surfaced as removable chips.
- **H3.5 — Results list + filter rail.**** Port the list card and left rail from
  `prototypes/booking/` onto `DiscoverPage`, wired to real data.
- **H3.6 — Empty state & recovery.** Clear guidance, "clear filters", and a route to `/recommend`.
- **H3.7 — Performance.** Memoised filtering, stable keys, and virtualization if the list grows.

**Done when:** filters are shareable via URL, every option shows a live count, adding a category
requires no UI changes, and the list stays smooth.

---

## Sprint 4 — Cards, rails & featured

- **H4.1 — VenueCard redesign.** Star rating inline (`★ 4.8 · N reviews`), price band (`£`/`££` +
  "Usually £X–Y"), venue-natural CTAs (Reserve / Book a table / See details), and a clay-dot
  signature line — no score box, no "hotel-y" pricing. Must read naturally for a lounge, a
  restaurant or a café.
- **H4.2 — Curated rails.** Featured (clearly labelled **"Featured"**), "Popular in London",
  "By area", "New".
- **H4.3 — Category-neutral check.** Switch on `restaurant` and `cafe` in data and confirm every
  surface still reads correctly.
- **H4.4 — Loading & empty skeletons.** No layout shift, no bare spinners where a card shape works.

**Done when:** no card looks wrong for a restaurant or café, and featured content is unambiguously
labelled.

---

## Sprint 5 — Polish, accessibility, launch

- **H5.1 — Accessibility.** Keyboard paths, focus rings, `aria` on chips/filters/typeahead, contrast.
- **H5.2 — Responsive QA.** Sweep 360 → 1440, including the results list and rails.
- **H5.3 — Performance budgets.** LCP, image sizing/laziness, bundle impact of the new search.
- **H5.4 — SEO / meta.** `PageMeta`, titles, structured data for the homepage.
- **H5.5 — Analytics.** Events for search, filter use, category taps, featured views (reuse
  `trackEvent`).
- **H5.6 — Copy pass.** London-first, honest, no overclaiming.

**Done when:** the homepage is shippable: accessible, fast, measured, and on-brand.

---

## Open decisions

1. **Homepage vs Discover split** — confirm the recommendation (browse vs full filtered list), or
   decide to keep the filtered list on the homepage too.
2. **Search intelligence location** — client-side matching to start (fast, cheap, current scale), or
   move to Postgres full-text / trigram when volume demands it? Proposal: start client-side behind
   the same interface so it can be swapped later.
3. **Category rollout timing** — when `restaurant` / `cafe` flip `isActive`, which surfaces change?

---

## Suggested first pass

**Sprint 0 + Sprint 1**, then stop and review before touching search and filters. That gives a real
homepage shell to react to, with search and filtering landing on `/discover` afterwards.
