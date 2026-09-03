---
target: src/pages/DiscoverPage.tsx
total_score: 25
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 1
target_identity: "file:/Users/tufanbutuner/Documents/GitHub/nokta/src/pages/DiscoverPage.tsx"
target_fingerprint: "sha256:7ce036b58b9c1e3490e50aa11e66d021487475f7af80b2f94c58b635470018a3"
target_path: /Users/tufanbutuner/Documents/GitHub/nokta/src/pages/DiscoverPage.tsx
timestamp: 2026-09-03T08-43-44Z
slug: src-pages-discoverpage-tsx
closed: true
---
Method: dual-agent (A: 01a0666d-cf6a-7881-9b34-c31441276fe7 · B: 01a0666d-f2b2-7812-bfe4-d5cb1d0b1304)

Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Result count, loading/error states, and open/closed signals exist; selected state could be calmer. |
| 2 | Match System / Real World | 3 | Venue concepts are clear, but More is too vague for filters. |
| 3 | User Control and Freedom | 3 | Filters can be cleared and toggled; active state hierarchy is visually noisy. |
| 4 | Consistency and Standards | 3 | Strong component reuse overall, but chip/filter styles blur into each other. |
| 5 | Error Prevention | 2 | Nearest sorting depends on location context, but fallback behavior is not explicit enough. |
| 6 | Recognition Rather Than Recall | 3 | Cards expose useful facts, but the control stack takes effort to parse. |
| 7 | Flexibility and Efficiency | 3 | Quick filters help repeat users; density slows casual browsing. |
| 8 | Aesthetic and Minimalist Design | 2 | Too many pills, borders, and nested control zones in the left panel. |
| 9 | Error Recovery | 3 | Error and empty states exist and are practical. |
| 10 | Help and Documentation | n/a | Discover should be self-explanatory rather than instructional. |
| **Total** | | **25/36** | **Good foundation, crowded execution** |

Design Specificity Verdict

LLM assessment: The Discover page has the right product shape for Nokta: a premium venue finder with list/map confidence and quick browse intent. It does not feel like a generic SaaS dashboard. The weaker part is authorship: the left panel still feels like filtering a database rather than choosing tonight's spot. Search, quick chips, active chips, advanced filters, featured venues, sort, and results all compete for attention in a narrow surface.

Deterministic scan: Impeccable detector returned 0 findings for src/pages/DiscoverPage.tsx. No false positives were reported.

Visual overlays: Skipped. Browser-control tools were not exposed in this session, and the detector sub-agent avoided Impeccable live tooling because it would create .impeccable/live/sessions state during its read-only pass. No user-visible overlay is available for this run.

Overall Impression

The page works and the IA is fundamentally right. The biggest opportunity is reducing the left-panel control noise so the venue results feel editorial and decisive rather than surrounded by utility chrome.

What's Working

1. The desktop split view is the correct mental model: venues on the left, spatial context on the right.
2. Mobile removing map-first behavior is the right product call; it keeps discovery focused.
3. Cards carry the right core information: image, venue name, location/distance, price level, rating, and open state.

Priority Issues

[P1] Filter hierarchy is over-busy
Why it matters: Users hit controls before they feel the results changing. That slows browsing and makes the page feel less premium.
Fix: Make search primary, keep one quiet row of high-value chips, and put the rest behind a clearer Filters button with a count.
Suggested command: /impeccable distill

[P2] Active filter chips duplicate quick filters
Why it matters: Two chip systems using similar visual language makes the state harder to understand.
Fix: Make active filters smaller, calmer summary tokens, or only show them when they communicate filters that are otherwise hidden.
Suggested command: /impeccable clarify

[P2] Selected venue card state is too loud
Why it matters: The tinted selected card competes with the venue content and feels more app-like than editorial.
Fix: Use a precise black border, slim marker, or map-pin indicator instead of a full accent-tint background.
Suggested command: /impeccable polish

[P3] Map open/closed pill feels orphaned
Why it matters: It is useful data, but floating it over the map disconnects it from the result controls.
Fix: Move it into the result header or make it a proper map legend.
Suggested command: /impeccable layout

[P3] Featured venues need clearer commercial treatment
Why it matters: If placements become paid inventory, they should look intentional and premium, not like an accidental sort result.
Fix: Give featured venues a labelled editorial placement such as Featured nearby, with restrained styling that still separates them from organic results.
Suggested command: /impeccable shape

Persona Red Flags

Jordan, first-time visitor: The opening decision is overloaded: search, category chips, rating, active filters, advanced filters, sort, featured results, and map all appear in quick succession. They can use it, but they have to work too hard to know where to start.

Maya, on mobile trying to book tonight: Removing the map is good, but the filter density still risks pushing actual venues down. The primary journey should be nearby/open/bookable faster than it is today.

Sam, venue owner considering paid placement: Featured placement is present but not persuasive. If Nokta sells visibility, the page should make featured treatment feel curated and valuable without looking like an ad block.

Minor Observations

1. Rename More to Filters.
2. Rating 4+ may be premature while review density is still thin.
3. Search placeholder could be warmer: Search by venue, area or vibe.
4. Results header would scan better as 24 venues near Bermondsey · Sort: Distance.

Questions to Consider

1. Should Discover feel more like filtering a database or choosing tonight's place?
2. Are the top quick filters really category-led, or should they be intent-led: Open now, Nearby, Takes bookings, Outdoor?
3. If featured placement is a revenue stream, what should make it feel worth paying for?
