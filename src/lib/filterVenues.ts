import type { Venue } from "@/types/venue";
import type { VenueFilterState } from "@/types/filters";
import { isVenueOpenNow } from "@/lib/openingHours";

export function filterVenues(venues: Venue[], filters: VenueFilterState): Venue[] {
  return venues.filter((venue) => {
    const query = filters.query.trim().toLowerCase();
    const searchableVibes = venue.vibes.map((vibe) => vibe.replace("-", " ")).join(" ");
    const haystack = `${venue.name} ${venue.city} ${venue.area} ${venue.description} ${searchableVibes}`.toLowerCase();

    const matchesCountry = venue.country === filters.country;
    const matchesCity = venue.city === filters.city;
    const matchesQuery = !query || haystack.includes(query);
    const matchesArea = filters.area === "all" || venue.area === filters.area;
    const matchesCategory =
      filters.primaryCategories.length === 0 ||
      filters.primaryCategories.some((category) => venue.primaryCategory === category || venue.secondaryCategories.includes(getSecondaryCategoryMatch(category)));
    const matchesPrice = filters.priceLevel === "all" || venue.priceLevel === filters.priceLevel;
    const matchesOpenNow = !filters.openNow || isVenueOpenNow(venue);
    const matchesRating = filters.minRating === "all" || (venue.rating ?? 0) >= filters.minRating;
    const matchesVibes = filters.vibes.length === 0 || filters.vibes.every((vibe) => venue.vibes.includes(vibe));
    const matchesFeatures =
      (!filters.features.indoor || venue.indoor) &&
      (!filters.features.outdoor || venue.outdoor) &&
      (!filters.features.food || venue.food) &&
      (!filters.features.alcohol || venue.alcohol) &&
      (!filters.features.halal || venue.halal) &&
      (!filters.features.openLate || venue.openLate);

    return matchesCountry && matchesCity && matchesArea && matchesCategory && matchesQuery && matchesPrice && matchesOpenNow && matchesRating && matchesVibes && matchesFeatures;
  });
}

function getSecondaryCategoryMatch(category: VenueFilterState["primaryCategories"][number]) {
  const secondaryCategoryByPrimary = {
    shisha_lounge: "shisha",
    restaurant: "food",
    bar: "cocktails",
    cafe: "coffee",
    dessert: "dessert",
    lounge: "groups",
    late_night: "late_night",
    private_hire: "private_hire",
    other: "events",
  } as const;

  return secondaryCategoryByPrimary[category];
}
