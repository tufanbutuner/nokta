import type { Venue } from "@/types/venue";
import type { VenueFilterState } from "@/types/filters";

export function filterVenues(venues: Venue[], filters: VenueFilterState): Venue[] {
  return venues.filter((venue) => {
    const query = filters.query.trim().toLowerCase();
    const searchableVibes = venue.vibes.map((vibe) => vibe.replace("-", " ")).join(" ");
    const haystack = `${venue.name} ${venue.area} ${venue.description} ${searchableVibes}`.toLowerCase();

    const matchesQuery = !query || haystack.includes(query);
    const matchesArea = filters.area === "all" || venue.area === filters.area;
    const matchesPrice = filters.priceLevel === "all" || venue.priceLevel === filters.priceLevel;
    const matchesOpenNow = !filters.openNow || venue.businessStatus === "open" || venue.businessStatus === "unknown";
    const matchesRating = filters.minRating === "all" || (venue.rating ?? 0) >= filters.minRating;
    const matchesVibes = filters.vibes.length === 0 || filters.vibes.every((vibe) => venue.vibes.includes(vibe));
    const matchesFeatures =
      (!filters.features.indoor || venue.indoor) &&
      (!filters.features.outdoor || venue.outdoor) &&
      (!filters.features.food || venue.food) &&
      (!filters.features.alcohol || venue.alcohol) &&
      (!filters.features.openLate || venue.openLate);

    return matchesQuery && matchesArea && matchesPrice && matchesOpenNow && matchesRating && matchesVibes && matchesFeatures;
  });
}
