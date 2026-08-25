import { getVenueQuality, hasQuestionableCoordinates } from "@/lib/venueQuality";
import type { Venue } from "@/types/venue";

export interface CommercialEligibilityResult {
  eligible: boolean;
  reasons: string[];
}

export function getFeaturedEligibilityRecommendation(venue: Venue): CommercialEligibilityResult {
  const reasons: string[] = [];
  const quality = getVenueQuality(venue);

  if (venue.businessStatus !== "open") {
    reasons.push("Venue is not marked open");
  }

  if (venue.verificationStatus !== "verified" && venue.verificationStatus !== "partially-verified") {
    reasons.push("Venue is unverified");
  }

  if (hasQuestionableCoordinates(venue)) {
    reasons.push("Coordinates need checking");
  }

  if (!venue.images.length) {
    reasons.push("Missing venue media");
  }

  if (!venue.openingHours.some((item) => item.day.trim() && item.open.trim() && item.close.trim())) {
    reasons.push("Missing opening hours");
  }

  if (quality.level === "poor") {
    reasons.push("Poor data quality score");
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}
