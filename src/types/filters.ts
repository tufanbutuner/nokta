import type { PriceLevel, VenueVibe } from "@/types/venue";

export type FeatureFilterKey = "indoor" | "outdoor" | "food" | "alcohol" | "openLate";

export interface VenueFilterState {
  query: string;
  area: string;
  priceLevel: PriceLevel | "all";
  vibes: VenueVibe[];
  features: Record<FeatureFilterKey, boolean>;
}
