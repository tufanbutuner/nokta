import type { PriceLevel, VenueVibe } from "@/types/venue";
import type { VenuePrimaryCategory } from "@/types/venueCategories";

export type FeatureFilterKey = "indoor" | "outdoor" | "food" | "alcohol" | "halal" | "openLate";
export type DiscoverView = "list" | "map";

export interface VenueFilterState {
  query: string;
  country: string;
  city: string;
  area: string;
  primaryCategories: VenuePrimaryCategory[];
  priceLevel: PriceLevel | "all";
  openNow: boolean;
  minRating: 4 | "all";
  vibes: VenueVibe[];
  features: Record<FeatureFilterKey, boolean>;
}
