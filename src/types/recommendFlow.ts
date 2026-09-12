import type { PriceLevel, Venue, VenueVibe } from "@/types/venue";
import type { RecommendationOccasion } from "@/types/recommendations";

export type RecommendFlowScreen = "entry" | "q" | "results" | "nomatch" | "saved" | "share";
export type RecommendBudget = PriceLevel | "any";
export type RecommendDistance = "walk" | "short" | "any";
export type RecommendPickRole = "safe" | "wildcard" | "closest";

/** The four answers, plus the wildcard cycle index. Everything else is derived. */
export interface RecommendAnswers {
  occasion: RecommendationOccasion | null;
  vibes: VenueVibe[];
  budget: RecommendBudget | null;
  distance: RecommendDistance | null;
}

/** A venue with its soft score, the reasons that fired, and its distance in miles. */
export interface ScoredVenue {
  venue: Venue;
  score: number;
  reasons: string[];
  miles: number | null;
}

export interface RecommendPick {
  role: RecommendPickRole;
  venue: Venue;
  /** "100% match", or "off your answers" for a wildcard drawn from outside the filter. */
  match: string;
  reason: string;
  miles: number | null;
}

export interface RelaxOption {
  /** "Drop rooftop", "Allow any budget and the distance". */
  label: string;
  /** How many venues the relaxation opens up. */
  gain: number;
  overrides: Partial<RecommendAnswers>;
}

export const MAX_VIBES = 3;

/** A saved shortlist: the answers plus the three picks frozen at save time. */
export interface RecommendShortlist {
  id: string;
  name: string;
  city: string;
  answers: RecommendAnswers;
  picks: SavedShortlistPick[];
  createdAt: string;
}

/** A pick as stored — the venue id plus the labels it carried when saved. */
export interface SavedShortlistPick {
  venueId: string;
  role: RecommendPickRole;
  matchLabel: string;
  reason: string;
}

export interface SaveShortlistInput {
  name: string;
  city: string;
  answers: RecommendAnswers;
  picks: SavedShortlistPick[];
}
