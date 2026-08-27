import { checkPromotedOfferSafety } from "@/lib/promotedOfferSafety";
import type { PromotedOfferInput } from "@/types/promotedOffers";
import type { Venue } from "@/types/venue";

export interface PromotedOfferValidationResult {
  errors: Record<string, string>;
  warnings: string[];
  isValid: boolean;
}

export function validatePromotedOfferInput(input: PromotedOfferInput, venue?: Venue | null): PromotedOfferValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  if (!input.venueId) errors.venueId = "Choose a venue.";
  if (!input.title.trim()) errors.title = "Add an offer title.";
  if (!input.offerType) errors.offerType = "Choose an offer type.";
  if (!input.startsAt) errors.startsAt = "Choose a start date.";
  if (!input.endsAt) errors.endsAt = "Choose an end date.";
  if (!input.status) errors.status = "Choose a status.";

  if (input.title.length > 120) errors.title = "Keep the title under 120 characters.";
  if ((input.description ?? "").length > 300) errors.description = "Keep the description under 300 characters.";
  if ((input.terms ?? "").length > 500) errors.terms = "Keep the terms under 500 characters.";
  if ((input.ctaLabel ?? "").length > 40) errors.ctaLabel = "Keep the CTA label under 40 characters.";
  if (input.ctaUrl?.trim() && !isValidUrl(input.ctaUrl)) errors.ctaUrl = "Use a valid URL.";

  const startsAt = input.startsAt ? new Date(input.startsAt) : null;
  const endsAt = input.endsAt ? new Date(input.endsAt) : null;
  if (startsAt && endsAt && endsAt <= startsAt) errors.endsAt = "End date must be after start date.";
  if (input.status === "active" && endsAt && endsAt < new Date()) errors.endsAt = "Active offers cannot end in the past.";

  if (input.priority !== undefined && Number.isNaN(Number(input.priority))) errors.priority = "Priority must be a number.";
  if ((input.priority ?? 0) < 0) warnings.push("Priority should be 0 or higher.");

  const safety = checkPromotedOfferSafety(input);
  warnings.push(...safety.warnings, ...safety.blockingReasons);
  if (input.status === "active" && safety.blockingReasons.length) errors.title = safety.blockingReasons[0];

  if (venue) {
    if (!venue.isClaimed) warnings.push("Venue is not claimed.");
    if (venue.businessStatus !== "open") {
      const message = "Venue business status is not open.";
      input.status === "active" ? (errors.venueId = message) : warnings.push(message);
    }
    if (venue.verificationStatus === "unverified") {
      const message = "Venue is unverified.";
      input.status === "active" ? (errors.venueId = message) : warnings.push(message);
    }
    if (!venue.featuredEligible) warnings.push("Venue is not featured eligible.");
  }

  if (!input.terms?.trim()) warnings.push("Missing terms.");
  if (!input.ctaUrl?.trim()) warnings.push("Missing CTA URL.");

  return { errors, warnings: Array.from(new Set(warnings)), isValid: Object.keys(errors).length === 0 };
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
