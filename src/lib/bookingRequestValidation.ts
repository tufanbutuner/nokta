import type { CreateBookingRequestInput } from "@/types/bookingRequests";

export interface BookingRequestValidationResult {
  errors: Record<string, string>;
  warnings: string[];
  isValid: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateCreateBookingRequestInput(input: CreateBookingRequestInput): BookingRequestValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];
  const today = startOfDay(new Date());
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 90);
  const requestedDate = input.requestedDate ? startOfDay(new Date(`${input.requestedDate}T00:00:00`)) : null;

  if (!input.venueId) errors.venueId = "Venue is required.";
  if (!input.customerName.trim()) errors.customerName = "Name is required.";
  if (input.customerName.trim().length > 120) errors.customerName = "Name must be 120 characters or fewer.";
  if (!input.customerEmail.trim()) errors.customerEmail = "Email is required.";
  if (input.customerEmail.trim().length > 254 || !EMAIL_PATTERN.test(input.customerEmail.trim())) errors.customerEmail = "Enter a valid email address.";
  if ((input.customerPhone ?? "").trim().length > 40) errors.customerPhone = "Phone must be 40 characters or fewer.";
  if (!Number.isInteger(input.partySize) || input.partySize < 1 || input.partySize > 100) errors.partySize = "Party size must be between 1 and 100.";
  if (!input.requestedDate) errors.requestedDate = "Date is required.";
  if (requestedDate && requestedDate < today) errors.requestedDate = "Date cannot be in the past.";
  if (requestedDate && requestedDate > maxDate) errors.requestedDate = "Choose a date within the next 90 days.";
  if (!input.requestedTime) errors.requestedTime = "Time is required.";
  if (input.requestedTime && !TIME_PATTERN.test(input.requestedTime)) errors.requestedTime = "Use HH:mm format.";
  if ((input.occasion ?? "").trim().length > 80) errors.occasion = "Occasion must be 80 characters or fewer.";
  if ((input.message ?? "").trim().length > 1000) errors.message = "Message must be 1000 characters or fewer.";

  return { errors, warnings, isValid: Object.keys(errors).length === 0 };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
