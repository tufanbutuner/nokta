import { getVenueDistanceMiles } from "@/lib/location";
import { getOccasionVibes } from "@/lib/occasionVibes";
import { formatVibe } from "@/lib/venueFilters";
import type { RecommendationOptions, RecommendationPreferences, RecommendedVenue } from "@/types/recommendations";
import type { Venue } from "@/types/venue";

const FEATURE_REASONS = {
  indoor: "Indoor seating available",
  outdoor: "Outdoor seating available",
  food: "Food available",
  alcohol: "Alcohol available",
  openLate: "Open late",
} as const;

export function getRecommendedVenues(
  venues: Venue[],
  preferences: RecommendationPreferences,
  options: RecommendationOptions = {},
): RecommendedVenue[] {
  const cityVenues = venues.filter((venue) => venue.city === preferences.city);
  const recommended = cityVenues.map((venue) => scoreVenue(venue, preferences, options));
  const topScore = Math.max(...recommended.map((item) => item.score), 1);

  return recommended
    .map((item) => ({
      ...item,
      matchPercentage: Math.max(1, Math.round((item.score / topScore) * 100)),
    }))
    .sort((a, b) => b.score - a.score || (b.venue.rating ?? 0) - (a.venue.rating ?? 0));
}

function scoreVenue(venue: Venue, preferences: RecommendationPreferences, options: RecommendationOptions): RecommendedVenue {
  let score = 0;
  const reasons: string[] = [];

  for (const vibe of preferences.vibes) {
    if (venue.vibes.includes(vibe)) {
      score += 20;
      reasons.push(`${formatVibe(vibe)} vibe`);
    }
  }

  for (const vibe of getOccasionVibes(preferences.occasion)) {
    if (venue.vibes.includes(vibe)) {
      score += 15;
      reasons.push(`Good for ${formatVibe(vibe).toLowerCase()}`);
    }
  }

  for (const [feature, selected] of Object.entries(preferences.features)) {
    if (selected && venue[feature as keyof typeof FEATURE_REASONS]) {
      score += 12;
      reasons.push(FEATURE_REASONS[feature as keyof typeof FEATURE_REASONS]);
    }
  }

  if (preferences.priceLevel !== "any") {
    const priceDifference = Math.abs(venue.priceLevel - preferences.priceLevel);
    if (priceDifference === 0) {
      score += 15;
      reasons.push("Matches your budget");
    } else if (priceDifference === 1) {
      score += 8;
      reasons.push("Close to your budget");
    }
  }

  if (venue.rating) {
    score += Math.min(10, venue.rating * 2);
    if (venue.rating >= 4.5) {
      reasons.push("Highly rated");
    }
  }

  if (options.favouriteVenueIds?.includes(venue.id)) {
    score += 5;
    reasons.push("Already in your saved venues");
  }

  if (options.userLocation && preferences.distancePreference !== "none") {
    const distance = getVenueDistanceMiles(venue, options.userLocation);
    const nearest = preferences.distancePreference === "nearest";

    if (distance < 1) {
      score += nearest ? 25 : 15;
      reasons.push("Close to you");
    } else if (distance <= 3) {
      score += nearest ? 15 : 10;
      reasons.push("Nearby option");
    } else if (distance <= 5) {
      score += nearest ? 8 : 5;
      reasons.push("Within a short trip");
    }
  }

  return {
    venue,
    score,
    matchPercentage: 0,
    reasons: Array.from(new Set(reasons)),
  };
}
