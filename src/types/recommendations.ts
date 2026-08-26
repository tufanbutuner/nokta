import type { UserLocation } from "@/types/location";
import type { PriceLevel, Venue, VenueVibe } from "@/types/venue";

export type RecommendationOccasion = "solo" | "date" | "small-group" | "big-group" | "football" | "late-night";
export type DistancePreference = "none" | "nearby" | "nearest";

export interface RecommendationPreferences {
  city: string;
  vibes: VenueVibe[];
  priceLevel: PriceLevel | "any";
  occasion: RecommendationOccasion | "any";
  features: {
    indoor: boolean;
    outdoor: boolean;
    food: boolean;
    alcohol: boolean;
    openLate: boolean;
  };
  distancePreference: DistancePreference;
}

export interface RecommendationOptions {
  userLocation?: UserLocation | null;
  favouriteVenueIds?: string[];
}

export interface RecommendedVenue {
  venue: Venue;
  score: number;
  matchPercentage: number;
  reasons: string[];
}
