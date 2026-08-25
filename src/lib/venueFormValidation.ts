import { hasOfficialSource, hasQuestionableCoordinates, hasShishaSpecificSource } from "@/lib/venueQuality";
import type { Venue } from "@/types/venue";
import type { VenueFormValues } from "@/types/venueForm";

export interface VenueFormValidationResult {
  errors: Record<string, string>;
  warnings: string[];
  isValid: boolean;
}

export function validateVenueForm(values: VenueFormValues): VenueFormValidationResult {
  const errors: Record<string, string> = {};

  requireValue(errors, "id", values.id, "ID is required.");
  requireValue(errors, "slug", values.slug, "Slug is required.");
  requireValue(errors, "name", values.name, "Name is required.");
  requireValue(errors, "description", values.description, "Description is required.");
  requireValue(errors, "area", values.area, "Area is required.");
  requireValue(errors, "address", values.address, "Address is required.");
  requireValue(errors, "postcode", values.postcode, "Postcode is required.");

  if (values.latitude === "" || !Number.isFinite(Number(values.latitude))) {
    errors.latitude = "Latitude must be a number.";
  } else if (Number(values.latitude) < 51.25 || Number(values.latitude) > 51.75) {
    errors.latitude = "Latitude should be within the London area.";
  }

  if (values.longitude === "" || !Number.isFinite(Number(values.longitude))) {
    errors.longitude = "Longitude must be a number.";
  } else if (Number(values.longitude) < -0.55 || Number(values.longitude) > 0.35) {
    errors.longitude = "Longitude should be within the London area.";
  }

  if (![1, 2, 3, 4].includes(values.priceLevel)) {
    errors.priceLevel = "Price level must be between 1 and 4.";
  }

  if (values.rating != null && (values.rating < 0 || values.rating > 5)) {
    errors.rating = "Rating must be between 0 and 5.";
  }

  if (values.website && !isValidUrl(values.website)) {
    errors.website = "Website must be a valid URL.";
  }

  if (values.instagram && !isValidUrl(values.instagram)) {
    errors.instagram = "Instagram must be a valid URL.";
  }

  Object.entries(values.dataSources).forEach(([key, value]) => {
    if (value.trim() && !isValidUrl(value)) {
      errors[`dataSources.${key}`] = `${formatFieldLabel(key)} must be a valid URL.`;
    }
  });

  const validationVenue = mapValuesToValidationVenue(values);
  const warnings = [
    !hasOfficialSource(validationVenue) && "Missing official source",
    !hasShishaSpecificSource(validationVenue) && "Missing shisha-specific source",
    values.openingHours.some((item) => item.open.trim() && item.close.trim()) ? false : "Missing opening hours",
    values.priceFrom == null && "Missing shisha price",
    !values.phone?.trim() && "Missing phone",
    hasQuestionableCoordinates(validationVenue) && "Coordinates need checking",
  ].filter((warning): warning is string => Boolean(warning));

  return {
    errors,
    warnings,
    isValid: Object.keys(errors).length === 0,
  };
}

function requireValue(errors: Record<string, string>, key: string, value: string, message: string) {
  if (!value.trim()) {
    errors[key] = message;
  }
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatFieldLabel(value: string): string {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function mapValuesToValidationVenue(values: VenueFormValues): Venue {
  return {
    id: values.id,
    slug: values.slug,
    name: values.name,
    description: values.description,
    area: values.area,
    address: values.address,
    postcode: values.postcode,
    latitude: values.latitude === "" ? 0 : Number(values.latitude),
    longitude: values.longitude === "" ? 0 : Number(values.longitude),
    rating: values.rating,
    priceFrom: values.priceFrom,
    priceLevel: values.priceLevel,
    indoor: values.indoor,
    outdoor: values.outdoor,
    food: values.food,
    alcohol: values.alcohol,
    openLate: values.openLate,
    vibes: values.vibes,
    images: values.images,
    openingHours: values.openingHours,
    website: values.website,
    instagram: values.instagram,
    phone: values.phone,
    businessStatus: values.businessStatus,
    verificationStatus: values.verificationStatus,
    lastVerifiedAt: values.lastVerifiedAt,
    dataSources: values.dataSources,
    sourceNotes: values.sourceNotes,
    isClaimed: values.isClaimed,
    claimedBy: values.claimedBy,
    claimedAt: values.claimedAt,
    partnerTier: values.partnerTier,
    monetisationStatus: values.monetisationStatus,
    monetisationNotes: values.monetisationNotes,
    featuredEligible: values.featuredEligible,
    featuredBlockedReason: values.featuredBlockedReason,
    createdAt: null,
    updatedAt: null,
  };
}
