# Recommend Flow

Sprint 47 replaces the single-page recommendation quiz at `/recommend` with a
guided four-question flow that ends on three named picks.

## Scope

- Four questions, one screen each: occasion, vibes, budget, distance.
- Three picks with stated reasons: **the safe bet**, **the wildcard**, **the closest**.
- Shortlists can be saved to the user's account and shared as a public link.

Nine states in all: entry, four questions, results, no-match, saved, share.

## Why two scoring passes

`strictMatches` is a hard filter. It backs the live match counter on every
question, the results/no-match branch, and the relax-chip counts — anywhere the
question "how many venues actually qualify?" is being answered.

`rankVenues` is a soft ordering over *every* venue and never drops anything. It
decides which venue fills each of the three slots and produces the reason
strings.

Keeping them separate is what lets the wildcard sit outside the filter while the
percentages stay internally consistent: all three cards derive from one ordering,
scored against the safe bet's score.

## Picking the three

1. **Safe bet** — highest-scoring venue that passes the strict filter.
2. **Closest** — of the remaining venues that pass, the nearest. Never drawn from
   outside the filter set.
3. **Wildcard** — drawn from venues *outside* the filter set, indexed by a `swap`
   counter so the Swap button cycles the pool. Shows `off your answers` rather
   than a percentage, and its reason names what it breaks.

Fewer than three qualifying venues renders fewer cards. We never pad.

## Distance is optional

Every distance calculation depends on the user having set a location. With
location off, `miles` is `null` throughout and:

- the strict filter does **not** drop venues on distance — hiding venues for a
  constraint we cannot evaluate would be worse than showing them;
- the third slot falls back to the next best match rather than collapsing the
  page to two cards;
- that slot is labelled "Also worth it" instead of "The closest", because
  "closest" is a claim we cannot support without a distance.

## Never dead-end

When nothing clears all four constraints, the no-match screen names the conflict
in the user's own terms and offers up to three relaxations, each with a real
count of what it opens up.

Candidates are every single constraint and every pair. A candidate that is a
superset of a smaller one with an equal-or-better gain is discarded — there is no
point offering "drop A and B" when "drop A" opens the same number. A single
selected vibe is named outright ("Drop rooftop") rather than "Drop the vibe
filter".

## Shortlists and sharing

`recommend_shortlists` stores the four answers; `recommend_shortlist_picks`
stores the three picks **frozen at save time**, including the match label and
reason. Reopening a shortlist next week therefore shows the same three venues
even if the scoring or the venue set has since moved on.

`recommend_share_codes` is a separate table because share codes are publicly
readable: anyone holding the link can read the shortlist behind it without being
signed in. Revoking a share is a delete there and never touches the owner's saved
shortlist. Sharing an unsaved result saves it first, and sharing twice returns
the existing code rather than minting a second.

The shared view at `/s/{code}` deliberately omits distance — the sender's
location is never part of what gets shared.

## URL as state

The flow's whole position lives in the query string (`?screen=q&step=2&…`), so
browser Back works, a results page is linkable, and "Edit" can return to the
questions with the answers intact.

## Not in scope

- Voting on a shared shortlist. The share copy mentions it; the interaction is
  not built.
- A generated OG image for shared links. The share preview card is designed to be
  its source, but the image itself is not yet produced.
