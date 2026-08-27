import type { VenueEnquiryInput } from "@/types/venueEnquiries";

export interface VenueEnquiryValidationResult {
  errors: Record<string, string>;
  isValid: boolean;
}

export function validateVenueEnquiryInput(input: VenueEnquiryInput): VenueEnquiryValidationResult {
  const errors: Record<string, string> = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!input.venueId) errors.venueId = "Venue is required.";
  if (!input.enquiryType) errors.enquiryType = "Choose an enquiry type.";
  if (!input.customerName.trim()) errors.customerName = "Enter your name.";
  if (input.customerName.length > 120) errors.customerName = "Name must be 120 characters or fewer.";
  if (!input.customerEmail.trim()) errors.customerEmail = "Enter your email.";
  if (input.customerEmail && !emailPattern.test(input.customerEmail)) errors.customerEmail = "Enter a valid email.";
  if (input.partySize != null && (input.partySize <= 0 || input.partySize > 100)) errors.partySize = "Party size must be between 1 and 100.";
  if (input.preferredDate && new Date(`${input.preferredDate}T23:59:59`).getTime() < Date.now()) errors.preferredDate = "Preferred date cannot be in the past.";
  if (input.preferredTime && !/^\d{2}:\d{2}$/.test(input.preferredTime)) errors.preferredTime = "Use HH:mm format.";
  if ((input.customerPhone?.length ?? 0) > 40) errors.customerPhone = "Phone must be 40 characters or fewer.";
  if ((input.message?.length ?? 0) > 1000) errors.message = "Message must be 1000 characters or fewer.";

  return { errors, isValid: Object.keys(errors).length === 0 };
}
