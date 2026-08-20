import type { RecommendationOccasion } from "@/types/recommendations";
import type { VenueVibe } from "@/types/venue";

export function getOccasionVibes(occasion: RecommendationOccasion | "any"): VenueVibe[] {
  switch (occasion) {
    case "date":
      return ["date-night", "luxury", "quiet"];
    case "small-group":
      return ["casual", "groups"];
    case "big-group":
      return ["groups", "party", "outdoor"];
    case "football":
      return ["football", "groups", "casual"];
    case "late-night":
      return ["late-night", "party"];
    case "solo":
      return ["quiet", "casual"];
    case "any":
    default:
      return [];
  }
}
