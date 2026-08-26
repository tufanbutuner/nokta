import type { VenueClaimRequestInput } from "@/types/venueClaims";

export interface VenueClaimValidationResult {
  errors: Record<string, string>;
  isValid: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateVenueClaimRequestInput(input: VenueClaimRequestInput): VenueClaimValidationResult {
  const errors: Record<string, string> = {};

  requireValue(errors, "venueId", input.venueId, "Venue is required.");
  requireValue(errors, "claimantName", input.claimantName, "Your name is required.");
  requireValue(errors, "claimantEmail", input.claimantEmail, "Your email is required.");
  requireValue(errors, "claimantRole", input.claimantRole, "Your role is required.");

  validateMaxLength(errors, "claimantName", input.claimantName, 120, "Your name");
  validateMaxLength(errors, "claimantPhone", input.claimantPhone, 40, "Your phone");
  validateMaxLength(errors, "businessPhone", input.businessPhone, 40, "Business phone");
  validateMaxLength(errors, "proofNotes", input.proofNotes, 1000, "Proof notes");

  validateEmail(errors, "claimantEmail", input.claimantEmail, "Your email");
  validateEmail(errors, "businessEmail", input.businessEmail, "Business email");
  validateUrl(errors, "proofUrl", input.proofUrl, "Proof URL");

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

function requireValue(errors: Record<string, string>, key: string, value: string | null | undefined, message: string) {
  if (!value?.trim()) {
    errors[key] = message;
  }
}

function validateMaxLength(errors: Record<string, string>, key: string, value: string | null | undefined, maxLength: number, label: string) {
  if (value && value.length > maxLength) {
    errors[key] = `${label} must be ${maxLength} characters or fewer.`;
  }
}

function validateEmail(errors: Record<string, string>, key: string, value: string | null | undefined, label: string) {
  if (value?.trim() && !EMAIL_PATTERN.test(value.trim())) {
    errors[key] = `${label} must be a valid email address.`;
  }
}

function validateUrl(errors: Record<string, string>, key: string, value: string | null | undefined, label: string) {
  if (!value?.trim()) {
    return;
  }

  try {
    new URL(value.trim());
  } catch {
    errors[key] = `${label} must be a valid URL.`;
  }
}
