import { getFeaturedEligibility } from "@/lib/featuredEligibility";
import type { FeaturedPlacementInput } from "@/types/featuredPlacements";
import type { Venue } from "@/types/venue";

export interface FeaturedPlacementValidationResult {
  errors: Record<string, string>;
  warnings: string[];
  isValid: boolean;
}

export function validateFeaturedPlacementInput(input: FeaturedPlacementInput, venue?: Venue): FeaturedPlacementValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];
  const startsAt = Date.parse(input.startsAt);
  const endsAt = Date.parse(input.endsAt);
  const priority = input.priority ?? 0;

  if (!input.venueId) errors.venueId = "Choose a venue.";
  if (!input.placementType) errors.placementType = "Choose a placement type.";
  if (!input.startsAt || Number.isNaN(startsAt)) errors.startsAt = "Enter a valid start date.";
  if (!input.endsAt || Number.isNaN(endsAt)) errors.endsAt = "Enter a valid end date.";
  if (!input.status) errors.status = "Choose a status.";
  if (!Number.isNaN(startsAt) && !Number.isNaN(endsAt) && endsAt <= startsAt) errors.endsAt = "End date must be after start date.";
  if (input.status === "active" && !Number.isNaN(endsAt) && endsAt < Date.now()) errors.endsAt = "Active placements cannot end in the past.";
  if (input.placementType === "city" && !input.city?.trim()) errors.city = "City placements require a city.";
  if (input.placementType === "area" && !input.city?.trim()) errors.city = "Area placements require a city.";
  if (input.placementType === "area" && !input.area?.trim()) errors.area = "Area placements require an area.";
  if ((input.title?.length ?? 0) > 120) errors.title = "Title must be 120 characters or fewer.";
  if ((input.description?.length ?? 0) > 240) errors.description = "Description must be 240 characters or fewer.";
  if (!Number.isFinite(priority)) errors.priority = "Priority must be a number.";
  if (priority < 0) errors.priority = "Priority should be 0 or higher.";

  if (venue) {
    const eligibility = getFeaturedEligibility(venue);
    warnings.push(...eligibility.warnings, ...eligibility.blockingReasons);
    if (input.status === "active" && !eligibility.eligible) {
      errors.status = "Only eligible, open and verified venues can be activated.";
    }
  }

  return { errors, warnings, isValid: Object.keys(errors).length === 0 };
}
