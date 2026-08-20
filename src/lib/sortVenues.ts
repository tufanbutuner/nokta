import { getVenueDistanceMiles } from "@/lib/location";
import type { UserLocation } from "@/types/location";
import type { VenueSortOption } from "@/types/sort";
import type { Venue } from "@/types/venue";

export function sortVenues(venues: Venue[], sortOption: VenueSortOption, userLocation?: UserLocation | null): Venue[] {
  const venuesCopy = [...venues];

  switch (sortOption) {
    case "rating":
      return venuesCopy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    case "price-asc":
      return venuesCopy.sort((a, b) => a.priceLevel - b.priceLevel || (a.priceFrom ?? Number.MAX_SAFE_INTEGER) - (b.priceFrom ?? Number.MAX_SAFE_INTEGER));

    case "price-desc":
      return venuesCopy.sort((a, b) => b.priceLevel - a.priceLevel || (b.priceFrom ?? 0) - (a.priceFrom ?? 0));

    case "nearest":
      if (!userLocation) {
        return venuesCopy;
      }

      return venuesCopy.sort((a, b) => getVenueDistanceMiles(a, userLocation) - getVenueDistanceMiles(b, userLocation));

    case "recommended":
    default:
      return venuesCopy;
  }
}
