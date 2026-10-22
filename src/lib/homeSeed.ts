import { DEFAULT_CITY, getCityByName } from "@/lib/cities";
import { calculateDistanceMiles } from "@/lib/location";
import type { Venue } from "@/types/venue";

/**
 * The homepage's opening view (London, no search, no saved location) is baked into
 * index.html at build time so the first cards can paint without waiting for the full
 * venue list. Only the card row reads it, and only until the live list arrives: it is
 * never put in the query cache, so nothing can edit or save from these trimmed rows.
 */
export const HOME_SEED_ELEMENT_ID = "home-seed";

/** Enough nearby venues that "Open now" still fills the card row most hours of the day. */
const HOME_SEED_LIMIT = 48;

export function selectHomeSeedVenues(venues: Venue[], limit = HOME_SEED_LIMIT): Venue[] {
  const city = getCityByName(DEFAULT_CITY);
  if (!city) return [];
  const centre = { latitude: city.latitude, longitude: city.longitude };

  return venues
    .filter((venue) => venue.city === DEFAULT_CITY && !venue.isTest && venue.businessStatus !== "permanently-closed")
    .filter((venue) => Number.isFinite(venue.latitude) && Number.isFinite(venue.longitude))
    .map((venue) => ({ venue, distance: calculateDistanceMiles(centre, venue) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ venue }) => ({
      ...venue,
      // The card shows one photo and none of the long-form or provenance fields.
      images: venue.images.slice(0, 1),
      description: "",
      dataSources: {},
      sourceNotes: null,
      monetisationNotes: null,
      featuredBlockedReason: null,
    }));
}

let cached: Venue[] | null = null;

export function readHomeSeed(): Venue[] {
  if (cached) return cached;
  cached = [];
  if (typeof document === "undefined") return cached;
  try {
    const parsed: unknown = JSON.parse(document.getElementById(HOME_SEED_ELEMENT_ID)?.textContent ?? "[]");
    if (Array.isArray(parsed)) cached = parsed as Venue[];
  } catch {
    // A malformed seed only costs the head start; the live list still loads.
  }
  return cached;
}
