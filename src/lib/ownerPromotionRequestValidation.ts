import { checkPromotedOfferSafety } from "@/lib/promotedOfferSafety";
import type { OwnerPromotionRequestInput } from "@/types/ownerPromotionRequests";

export interface OwnerPromotionRequestValidationResult {
  errors: Record<string, string>;
  warnings: string[];
  isValid: boolean;
}

export function validateOwnerPromotionRequestInput(input: OwnerPromotionRequestInput): OwnerPromotionRequestValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  if (!input.venueId) errors.venueId = "Choose a venue.";
  if (!input.requestType) errors.requestType = "Choose a request type.";
  if (!input.title?.trim()) errors.title = "Add a title.";
  if (input.title && input.title.length > 120) errors.title = "Keep the title under 120 characters.";
  if (input.description && input.description.length > 300) errors.description = "Keep the description under 300 characters.";
  if (input.terms && input.terms.length > 500) errors.terms = "Keep the terms under 500 characters.";
  if (input.ownerNotes && input.ownerNotes.length > 1000) errors.ownerNotes = "Keep owner notes under 1000 characters.";
  if (input.ctaLabel && input.ctaLabel.length > 40) errors.ctaLabel = "Keep the CTA label under 40 characters.";
  if (input.ctaUrl && !isValidUrl(input.ctaUrl)) errors.ctaUrl = "Add a valid URL.";
  if ((input.requestedPriority ?? 0) < 0) errors.requestedPriority = "Priority must be 0 or higher.";

  if (input.requestedStartsAt && input.requestedEndsAt && new Date(input.requestedEndsAt) <= new Date(input.requestedStartsAt)) {
    errors.requestedEndsAt = "End date must be after start date.";
  }
  if (input.requestedStartsAt && new Date(input.requestedStartsAt) < new Date(Date.now() - 60 * 1000)) {
    warnings.push("Requested start date is in the past.");
  }
  if (!input.requestedStartsAt || !input.requestedEndsAt) warnings.push("Add a requested date range so admins can schedule the campaign.");

  if (input.requestType === "promoted_offer") {
    if (!input.offerType) errors.offerType = "Choose an offer type.";
    if (!input.description?.trim()) warnings.push("Add a short description to help admins assess the offer.");
    if (!input.terms?.trim()) warnings.push("Add terms so customers understand the offer.");
    if (!input.ctaUrl?.trim()) warnings.push("Add a CTA URL if there is a booking or enquiry page.");
  }

  if (input.requestType === "featured_placement") {
    if (!input.placementType) errors.placementType = "Choose a placement type.";
    if (["city", "area", "discover"].includes(input.placementType ?? "") && !input.requestedCity?.trim()) {
      errors.requestedCity = "Add the requested city.";
    }
    if (input.placementType === "area" && !input.requestedArea?.trim()) errors.requestedArea = "Add the requested area.";
  }

  const safety = checkPromotedOfferSafety({ title: input.title, description: input.description, terms: input.terms });
  warnings.push(...safety.warnings);

  return { errors, warnings, isValid: Object.keys(errors).length === 0 };
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
