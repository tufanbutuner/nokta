import type { VenueSuggestionInput } from "@/types/venueSuggestions";

export interface VenueSuggestionValidationResult {
  errors: Record<string, string>;
  isValid: boolean;
}

export function validateVenueSuggestionInput(input: VenueSuggestionInput): VenueSuggestionValidationResult {
  const errors: Record<string, string> = {};
  const venueName = input.venueName.trim();

  if (!venueName) {
    errors.venueName = "Venue name is required.";
  } else if (venueName.length > 120) {
    errors.venueName = "Venue name must be 120 characters or fewer.";
  }

  if (!input.country.trim()) {
    errors.country = "Country is required.";
  }

  if (!input.city.trim()) {
    errors.city = "City is required.";
  }

  validateMaxLength(errors, "country", input.country, 80, "Country");
  validateMaxLength(errors, "city", input.city, 80, "City");
  validateMaxLength(errors, "area", input.area, 80, "Area");
  validateMaxLength(errors, "address", input.address, 200, "Address");
  validateMaxLength(errors, "postcode", input.postcode, 20, "Postcode");
  validateMaxLength(errors, "notes", input.notes, 1000, "Notes");

  if (input.website && !isValidUrl(input.website)) {
    errors.website = "Website must be a valid URL.";
  }

  if (input.instagram && !isValidUrl(input.instagram)) {
    errors.instagram = "Instagram must be a valid URL.";
  }

  const phone = input.phone?.trim();
  if (phone && (phone.length < 6 || phone.length > 30)) {
    errors.phone = "Phone number length looks off.";
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

function validateMaxLength(errors: Record<string, string>, key: string, value: string | null | undefined, maxLength: number, label: string) {
  if ((value?.trim().length ?? 0) > maxLength) {
    errors[key] = `${label} must be ${maxLength} characters or fewer.`;
  }
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
