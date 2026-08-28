import type { VenueProfileUpdateChanges, VenueUpdateRequestInput } from "@/types/venueUpdateRequests";

export const OWNER_EDITABLE_VENUE_FIELDS = ["description", "phone", "website", "instagram", "priceFrom", "openingHours", "features", "vibes", "menuUrl", "bookingUrl", "contactUrl"] as const;
type OwnerEditableField = (typeof OWNER_EDITABLE_VENUE_FIELDS)[number];

export interface VenueUpdateRequestValidationResult {
  errors: Record<string, string>;
  warnings: string[];
  isValid: boolean;
}

export function validateVenueUpdateRequestInput(input: VenueUpdateRequestInput): VenueUpdateRequestValidationResult {
  const errors: Record<string, string> = {};
  const requestedChanges = filterOwnerEditableVenueChanges(input.requestedChanges);
  const originalSnapshot = filterOwnerEditableVenueChanges(input.originalSnapshot);

  if (!input.venueId) errors.venueId = "Missing venue.";
  if (!Object.keys(requestedChanges).length) errors.requestedChanges = "Add at least one requested change.";
  if (!getChangedFields({ original: originalSnapshot, requested: requestedChanges }).length) errors.requestedChanges = "Change at least one field before submitting.";
  if ((requestedChanges.description ?? "").length > 800) errors.description = "Description must be under 800 characters.";
  if ((requestedChanges.phone ?? "").length > 40) errors.phone = "Phone must be under 40 characters.";
  if (requestedChanges.website && !isValidUrl(requestedChanges.website)) errors.website = "Website must be a valid URL.";
  if ((requestedChanges.instagram ?? "").length > 120) errors.instagram = "Instagram must be under 120 characters.";
  if (requestedChanges.instagram && requestedChanges.instagram.startsWith("http") && !isValidUrl(requestedChanges.instagram)) errors.instagram = "Instagram must be a valid URL or handle.";
  if (requestedChanges.priceFrom !== null && requestedChanges.priceFrom !== undefined && (Number(requestedChanges.priceFrom) < 0 || Number(requestedChanges.priceFrom) > 100)) errors.priceFrom = "Price must be between 0 and 100.";
  if ((requestedChanges.features?.length ?? 0) > 30) errors.features = "Choose fewer features.";
  if ((requestedChanges.vibes?.length ?? 0) > 30) errors.vibes = "Choose fewer vibes.";
  if (requestedChanges.menuUrl && !isValidUrl(requestedChanges.menuUrl)) errors.menuUrl = "Menu URL must be valid.";
  if (requestedChanges.bookingUrl && !isValidUrl(requestedChanges.bookingUrl)) errors.bookingUrl = "Booking URL must be valid.";
  if (requestedChanges.contactUrl && !isValidUrl(requestedChanges.contactUrl)) errors.contactUrl = "Contact URL must be valid.";
  if ((input.requestNotes ?? "").length > 1000) errors.requestNotes = "Notes must be under 1000 characters.";

  return { errors, warnings: [], isValid: Object.keys(errors).length === 0 };
}

export function getChangedFields(input: { original: VenueProfileUpdateChanges; requested: VenueProfileUpdateChanges }): string[] {
  return OWNER_EDITABLE_VENUE_FIELDS.filter((field) => JSON.stringify(input.original[field] ?? null) !== JSON.stringify(input.requested[field] ?? null));
}

export function filterOwnerEditableVenueChanges(input: VenueProfileUpdateChanges): VenueProfileUpdateChanges {
  return Object.fromEntries(
    OWNER_EDITABLE_VENUE_FIELDS
      .filter((field) => input[field] !== undefined)
      .map((field) => [field, input[field as OwnerEditableField]]),
  ) as VenueProfileUpdateChanges;
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
