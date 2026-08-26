import type { PriceLevel, VenueVibe } from "@/types/venue";

export type FeatureFilterKey = "indoor" | "outdoor" | "food" | "alcohol" | "openLate";
export type DiscoverView = "list" | "map";

export interface VenueFilterState {
  query: string;
  country: string;
  city: string;
  area: string;
  priceLevel: PriceLevel | "all";
  openNow: boolean;
  minRating: 4 | "all";
  vibes: VenueVibe[];
  features: Record<FeatureFilterKey, boolean>;
}
