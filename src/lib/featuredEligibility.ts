import { getVenueQuality } from "@/lib/venueQuality";
import type { Venue } from "@/types/venue";

export interface FeaturedEligibilityResult {
  eligible: boolean;
  blockingReasons: string[];
  warnings: string[];
}

export function getFeaturedEligibility(venue: Venue): FeaturedEligibilityResult {
  const quality = getVenueQuality(venue);
  const blockingReasons: string[] = [];
  const warnings: string[] = [];

  if (!venue.featuredEligible) blockingReasons.push("Venue is not marked featured eligible.");
  if (venue.businessStatus !== "open") blockingReasons.push("Venue business status is not open.");
  if (venue.verificationStatus === "unverified") blockingReasons.push("Venue is unverified.");
  if (quality.level === "poor") blockingReasons.push("Venue has poor data quality.");
  if (!Number.isFinite(venue.latitude) || !Number.isFinite(venue.longitude)) blockingReasons.push("Venue has invalid coordinates.");

  if (!venue.isClaimed) warnings.push("Venue is not claimed.");
  if (!venue.images.length) warnings.push("Venue has no media.");
  if (!venue.openingHours.length) warnings.push("Venue has missing opening hours.");
  if (!venue.website && !venue.instagram) warnings.push("Venue has missing official source.");
  if (!venue.phone && !venue.website) warnings.push("Venue has no phone or website.");

  return { eligible: blockingReasons.length === 0, blockingReasons, warnings };
}
