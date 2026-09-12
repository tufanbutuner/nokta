import { getVenueDistanceMiles } from "@/lib/location";
import { getOccasionVibes } from "@/lib/occasionVibes";
import { formatVibe } from "@/lib/venueFilters";
import type { UserLocation } from "@/types/location";
import type { RecommendationOccasion } from "@/types/recommendations";
import type { RecommendAnswers, RecommendBudget, RecommendDistance, RecommendPick, RelaxOption, ScoredVenue } from "@/types/recommendFlow";
import type { Venue, VenueVibe } from "@/types/venue";

/** Hard filter radii. Deliberately looser than the option copy so a 1.4 mi venue still counts as a walk. */
const WALK_LIMIT_MILES = 1.5;
const SHORT_TRIP_LIMIT_MILES = 3.5;
const MIN_MATCH_PERCENTAGE = 40;

const OCCASION_LABELS: Record<RecommendationOccasion, string> = {
  solo: "just you",
  date: "a date",
  "small-group": "a small group",
  "big-group": "a big group",
  football: "the match",
  "late-night": "a late one",
};

const BUDGET_LABELS: Record<string, string> = {
  1: "under £20",
  2: "£20–30",
  3: "£30–40",
  4: "£40+",
  any: "any budget",
};

const DISTANCE_LABELS: Record<RecommendDistance, string> = {
  walk: "walking distance",
  short: "a short trip",
  any: "anywhere in London",
};

export const EMPTY_ANSWERS: RecommendAnswers = { occasion: null, vibes: [], budget: null, distance: null };

export function formatOccasion(occasion: RecommendationOccasion): string {
  return OCCASION_LABELS[occasion];
}

export function formatBudget(budget: RecommendBudget): string {
  return BUDGET_LABELS[String(budget)] ?? "any budget";
}

export function formatDistance(distance: RecommendDistance): string {
  return DISTANCE_LABELS[distance];
}

/** Miles from the user, or null when we have no location to measure from. */
function milesFrom(venue: Venue, userLocation: UserLocation | null): number | null {
  return userLocation ? getVenueDistanceMiles(venue, userLocation) : null;
}

function roundMiles(miles: number): string {
  return miles.toFixed(1);
}

/**
 * The hard filter. Used for the live counter, the results/no-match branch, and the
 * relax-chip counts. A venue with no known distance is never dropped on distance —
 * we would rather show it than silently hide it because geolocation is off.
 */
export function strictMatches(venues: Venue[], answers: RecommendAnswers, userLocation: UserLocation | null, overrides: Partial<RecommendAnswers> = {}): Venue[] {
  const active: RecommendAnswers = { ...answers, ...overrides };

  return venues.filter((venue) => {
    if (active.budget && active.budget !== "any" && Math.abs(venue.priceLevel - active.budget) > 1) return false;

    const miles = milesFrom(venue, userLocation);
    if (miles !== null) {
      if (active.distance === "walk" && miles > WALK_LIMIT_MILES) return false;
      if (active.distance === "short" && miles > SHORT_TRIP_LIMIT_MILES) return false;
    }

    if (active.vibes.length && !active.vibes.some((vibe) => venue.vibes.includes(vibe))) return false;
    return true;
  });
}

/**
 * The soft ranking over every venue. Unlike the strict filter this never drops
 * anything — it only orders.
 */
export function scoreVenue(venue: Venue, answers: RecommendAnswers, userLocation: UserLocation | null): ScoredVenue {
  let score = 0;
  const reasons: string[] = [];

  for (const vibe of answers.vibes) {
    if (venue.vibes.includes(vibe)) {
      score += 20;
      reasons.push(`${formatVibe(vibe).toLowerCase()} room`);
    }
  }

  if (answers.occasion) {
    for (const vibe of getOccasionVibes(answers.occasion)) {
      if (venue.vibes.includes(vibe)) {
        score += 15;
        reasons.push(`works for ${formatOccasion(answers.occasion)}`);
      }
    }
  }

  if (answers.budget && answers.budget !== "any") {
    const difference = Math.abs(venue.priceLevel - answers.budget);
    if (difference === 0) {
      score += 15;
      reasons.push("right in your budget");
    } else if (difference === 1) {
      score += 8;
      reasons.push("just over your budget");
    }
  }

  if (venue.rating) {
    score += Math.min(10, venue.rating * 2);
    if (venue.rating >= 4.5) reasons.push(`rated ${venue.rating.toFixed(1)}`);
  }

  const miles = milesFrom(venue, userLocation);
  if (miles !== null) {
    if (answers.distance === "walk") {
      if (miles < 1) {
        score += 25;
        reasons.push("a walk away");
      } else if (miles <= 3) {
        score += 10;
      }
    } else if (answers.distance === "short") {
      if (miles <= 3) {
        score += 15;
        reasons.push(`${roundMiles(miles)} miles out`);
      } else if (miles <= 5) {
        score += 6;
      }
    }
  }

  return { venue, score, reasons: Array.from(new Set(reasons)), miles };
}

/** Every venue, best first. Ties break on rating. */
export function rankVenues(venues: Venue[], answers: RecommendAnswers, userLocation: UserLocation | null): ScoredVenue[] {
  return venues
    .map((venue) => scoreVenue(venue, answers, userLocation))
    .sort((a, b) => b.score - a.score || (b.venue.rating ?? 0) - (a.venue.rating ?? 0));
}

/** Reasons are deduplicated upstream; the first two become one sentence. */
function toReasonSentence(reasons: string[]): string {
  const sentence = reasons.slice(0, 2).join(", ") || "a balanced match";
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
}

/** What a wildcard breaks, phrased against the active constraints. */
function describeBreaks(scored: ScoredVenue, answers: RecommendAnswers): string {
  const breaks: string[] = [];
  const { venue, miles } = scored;

  if (answers.budget && answers.budget !== "any" && Math.abs(venue.priceLevel - answers.budget) > 1) {
    breaks.push(venue.priceFrom ? `£${venue.priceFrom}+ a head` : "a different budget");
  }

  if (miles !== null) {
    if (answers.distance === "walk" && miles > WALK_LIMIT_MILES) breaks.push(`${roundMiles(miles)} miles out`);
    else if (answers.distance === "short" && miles > SHORT_TRIP_LIMIT_MILES) breaks.push(`${roundMiles(miles)} miles out`);
  }

  if (answers.vibes.length && !answers.vibes.some((vibe) => venue.vibes.includes(vibe))) {
    breaks.push(`not ${answers.vibes.map((vibe) => formatVibe(vibe).toLowerCase()).join(" or ")}`);
  }

  return breaks.length ? breaks.join(" and ") : "a different kind of room";
}

/**
 * The three picks, all derived from one ordering so the percentages stay consistent.
 * Fewer than three qualifying venues renders fewer cards — we never pad.
 */
export function pickThree(venues: Venue[], answers: RecommendAnswers, userLocation: UserLocation | null, swap = 0): RecommendPick[] {
  if (!venues.length) return [];

  const allowedIds = new Set(strictMatches(venues, answers, userLocation).map((venue) => venue.id));
  const ranked = rankVenues(venues, answers, userLocation);
  const inSet = ranked.filter((scored) => allowedIds.has(scored.venue.id));
  const outSet = ranked.filter((scored) => !allowedIds.has(scored.venue.id));

  const safe = inSet[0] ?? ranked[0];
  if (!safe) return [];

  // The closest is only ever drawn from inside the filter set. Without a location
  // nothing has a distance, so the slot falls back to the next best match rather
  // than collapsing the page to two cards whenever geolocation is off.
  const closestCandidates = inSet.filter((scored) => scored.venue.id !== safe.venue.id);
  const withDistance = closestCandidates.filter((scored) => scored.miles !== null);
  const closest = withDistance.length ? withDistance.sort((a, b) => (a.miles ?? 0) - (b.miles ?? 0))[0] : closestCandidates[0];

  const taken = new Set([safe.venue.id, closest?.venue.id].filter(Boolean) as string[]);
  const wildcardPool = (outSet.length ? outSet : inSet).filter((scored) => !taken.has(scored.venue.id));
  const wildcard = wildcardPool.length ? wildcardPool[swap % wildcardPool.length] : undefined;

  const matchLabel = (scored: ScoredVenue) => {
    if (allowedIds.size && !allowedIds.has(scored.venue.id)) return "off your answers";
    const percentage = Math.round((scored.score / Math.max(1, safe.score)) * 100);
    return `${Math.min(100, Math.max(MIN_MATCH_PERCENTAGE, percentage))}% match`;
  };

  const picks: RecommendPick[] = [{ role: "safe", venue: safe.venue, match: matchLabel(safe), reason: toReasonSentence(safe.reasons), miles: safe.miles }];

  if (wildcard) {
    const preface = allowedIds.has(wildcard.venue.id) ? "Different from your answers on purpose. " : `Outside your answers on purpose — ${describeBreaks(wildcard, answers)}. `;
    picks.push({ role: "wildcard", venue: wildcard.venue, match: matchLabel(wildcard), reason: `${preface}${toReasonSentence(wildcard.reasons)}`, miles: wildcard.miles });
  }

  if (closest) {
    picks.push({
      role: "closest",
      venue: closest.venue,
      match: matchLabel(closest),
      // Area is free text and sometimes holds a street address, so the no-distance
      // fallback states the match rather than trying to read as a place name.
      reason: closest.miles === null ? `Also clears all of your answers. ${toReasonSentence(closest.reasons)}` : `Nearest of your matches, ${roundMiles(closest.miles)} miles from you.`,
      miles: closest.miles,
    });
  }

  return picks;
}

/**
 * What to offer dropping when nothing clears all four. Candidates are every single
 * constraint and every pair; a candidate that is a superset of a smaller one with an
 * equal-or-better gain is discarded, since there is no point offering "drop A and B"
 * when "drop A" opens the same number.
 */
export function getRelaxOptions(venues: Venue[], answers: RecommendAnswers, userLocation: UserLocation | null): RelaxOption[] {
  const keys = (["vibes", "budget", "distance"] as const).filter((key) => {
    if (key === "vibes") return answers.vibes.length > 0;
    if (key === "budget") return answers.budget !== null && answers.budget !== "any";
    return answers.distance !== null && answers.distance !== "any";
  });

  const overrideFor: Record<(typeof keys)[number], Partial<RecommendAnswers>> = {
    vibes: { vibes: [] },
    budget: { budget: "any" },
    distance: { distance: "any" },
  };

  // A single selected vibe is named outright — "Drop rooftop" beats "Drop the vibe filter".
  const vibeLabel = answers.vibes.length === 1 ? `Drop ${formatVibe(answers.vibes[0]).toLowerCase()}` : "Drop the vibe filter";
  const fullLabels: Record<(typeof keys)[number], string> = { vibes: vibeLabel, budget: "Allow any budget", distance: "Open up the distance" };
  const shortLabels: Record<(typeof keys)[number], string> = { vibes: "the vibe filter", budget: "the budget", distance: "the distance" };

  const candidates: { label: string; overrides: Partial<RecommendAnswers>; keys: string[] }[] = [];

  for (const key of keys) {
    candidates.push({ label: fullLabels[key], overrides: overrideFor[key], keys: [key] });
  }

  for (let i = 0; i < keys.length; i += 1) {
    for (let j = i + 1; j < keys.length; j += 1) {
      const [first, second] = [keys[i], keys[j]];
      candidates.push({
        label: `${fullLabels[first]} and ${shortLabels[second]}`,
        overrides: { ...overrideFor[first], ...overrideFor[second] },
        keys: [first, second],
      });
    }
  }

  const scored = candidates
    .map((candidate) => ({ ...candidate, gain: strictMatches(venues, answers, userLocation, candidate.overrides).length }))
    .filter((candidate) => candidate.gain > 0);

  const useful = scored.filter(
    (candidate) => !scored.some((other) => other !== candidate && other.keys.length < candidate.keys.length && other.gain >= candidate.gain && other.keys.every((key) => candidate.keys.includes(key))),
  );

  return useful
    .sort((a, b) => b.gain - a.gain || a.keys.length - b.keys.length)
    .slice(0, 3)
    .map(({ label, gain, overrides }) => ({ label, gain, overrides }));
}

/** "a date · quiet and luxury · £30–40 · a short trip" */
export function summariseAnswers(answers: RecommendAnswers): string {
  const parts: string[] = [];
  if (answers.occasion) parts.push(formatOccasion(answers.occasion));
  if (answers.vibes.length) parts.push(answers.vibes.map((vibe) => formatVibe(vibe).toLowerCase()).join(" and "));
  if (answers.budget) parts.push(formatBudget(answers.budget));
  if (answers.distance) parts.push(formatDistance(answers.distance));
  return parts.length ? parts.join(" · ") : "No answers yet";
}

/** The no-match headline, composed from whichever constraints are actually active. */
export function describeConflict(answers: RecommendAnswers, city: string): string {
  const parts: string[] = [];
  if (answers.vibes.length) parts.push(`a ${answers.vibes.map((vibe) => formatVibe(vibe).toLowerCase()).join(" and ")} room`);
  if (answers.budget && answers.budget !== "any") parts.push(formatBudget(answers.budget));
  if (answers.distance === "walk") parts.push("a walk away");
  else if (answers.distance === "short") parts.push("a short trip out");

  if (!parts.length) return `Nothing in ${city} matches yet.`;
  const last = parts.pop() as string;
  const joined = parts.length ? `${parts.join(", ")} and ${last}` : last;
  return `No lounge in ${city} is ${joined}.`;
}

/** Auto-generated shortlist name from the answers, e.g. "Quiet date, £30–40". */
export function buildShortlistName(answers: RecommendAnswers): string {
  const lead = [answers.vibes[0] ? formatVibe(answers.vibes[0]) : null, answers.occasion ? formatOccasion(answers.occasion) : null].filter(Boolean).join(" ");
  const budget = answers.budget && answers.budget !== "any" ? formatBudget(answers.budget) : null;
  const name = [lead || "Tonight", budget].filter(Boolean).join(", ");
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

/** Answers survive a round trip through the URL so results and shares are linkable. */
export function answersToSearchParams(answers: RecommendAnswers): URLSearchParams {
  const params = new URLSearchParams();
  if (answers.occasion) params.set("occasion", answers.occasion);
  if (answers.vibes.length) params.set("vibes", answers.vibes.join(","));
  if (answers.budget !== null) params.set("budget", String(answers.budget));
  if (answers.distance) params.set("distance", answers.distance);
  return params;
}

export function answersFromSearchParams(params: URLSearchParams): RecommendAnswers {
  const occasion = params.get("occasion");
  const budget = params.get("budget");
  const distance = params.get("distance");
  const validOccasions: RecommendationOccasion[] = ["solo", "date", "small-group", "big-group", "football", "late-night"];
  const validDistances: RecommendDistance[] = ["walk", "short", "any"];

  return {
    occasion: validOccasions.includes(occasion as RecommendationOccasion) ? (occasion as RecommendationOccasion) : null,
    vibes: (params.get("vibes")?.split(",").filter(Boolean) ?? []) as VenueVibe[],
    budget: budget === "any" ? "any" : budget && ["1", "2", "3", "4"].includes(budget) ? (Number(budget) as RecommendBudget) : null,
    distance: validDistances.includes(distance as RecommendDistance) ? (distance as RecommendDistance) : null,
  };
}
