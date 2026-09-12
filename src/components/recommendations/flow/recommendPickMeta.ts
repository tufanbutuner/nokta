import type { RecommendPickRole } from "@/types/recommendFlow";
import type { Venue } from "@/types/venue";

const ROLE_LABELS: Record<RecommendPickRole, string> = {
  safe: "The safe bet",
  wildcard: "The wildcard",
  closest: "The closest",
};

/**
 * "The closest" only means something once we know a distance. With location off
 * the third slot is still a real match, so it is labelled for what it is.
 */
export function roleLabel(role: RecommendPickRole, miles: number | null): string {
  if (role === "closest" && miles === null) return "Also worth it";
  return ROLE_LABELS[role];
}

export const ROLE_COLORS: Record<RecommendPickRole, string> = {
  safe: "#7ec488",
  wildcard: "#e0b05f",
  closest: "#7fa8d6",
};

/** "Knightsbridge · £35+ pp · 4.6 ★ · 3.1 mi" — each part dropped when unknown. */
export function formatPickMeta(venue: Venue, miles: number | null): string {
  return [venue.area, venue.priceFrom ? `£${venue.priceFrom}+ pp` : null, venue.rating ? `${venue.rating.toFixed(1)} ★` : null, miles !== null ? `${miles.toFixed(1)} mi` : null].filter(Boolean).join(" · ");
}

/** The short form used on the share card, where space is tight. */
export function formatPickShortMeta(venue: Venue): string {
  return [venue.area, venue.priceFrom ? `£${venue.priceFrom}+` : null].filter(Boolean).join(" · ");
}
