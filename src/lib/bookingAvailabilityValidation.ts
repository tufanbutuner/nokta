import { formatAdvanceBookingWindow, formatDayOfWeek, formatNoticePeriod } from "@/lib/bookingAvailabilityLabels";
import { countBookingsAtSlot, normaliseSlotTime } from "@/lib/bookingSlot";
import type { BookingAvailabilityCheckInput, BookingAvailabilityCheckResult, VenueBookingSettings, VenueBookingWindow } from "@/types/bookingAvailability";

const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export function validateVenueBookingSettings(settings: Partial<VenueBookingSettings>): { errors: Record<string, string>; isValid: boolean } {
  const errors: Record<string, string> = {};
  if (settings.minPartySize !== undefined && settings.minPartySize < 1) errors.minPartySize = "Minimum party size must be at least 1.";
  if (settings.maxPartySize !== undefined && settings.maxPartySize > 200) errors.maxPartySize = "Maximum party size must be 200 or fewer.";
  if (settings.minPartySize !== undefined && settings.maxPartySize !== undefined && settings.maxPartySize < settings.minPartySize) errors.maxPartySize = "Maximum party size must be greater than minimum.";
  if (settings.minNoticeMinutes !== undefined && (settings.minNoticeMinutes < 0 || settings.minNoticeMinutes > 43200)) errors.minNoticeMinutes = "Notice period must be between 0 minutes and 30 days.";
  if (settings.maxAdvanceDays !== undefined && (settings.maxAdvanceDays < 1 || settings.maxAdvanceDays > 365)) errors.maxAdvanceDays = "Advance booking window must be between 1 and 365 days.";
  if (settings.defaultBookingDurationMinutes !== undefined && (settings.defaultBookingDurationMinutes < 30 || settings.defaultBookingDurationMinutes > 480)) errors.defaultBookingDurationMinutes = "Duration must be between 30 minutes and 8 hours.";
  if (settings.slotCapacity !== undefined && (settings.slotCapacity < 1 || settings.slotCapacity > 50)) errors.slotCapacity = "Bookings per time slot must be between 1 and 50.";
  // Shown above the public request form, so it has to stay short.
  if (settings.bookingInstructions && settings.bookingInstructions.length > 140) errors.bookingInstructions = "Keep this under 140 characters.";
  return { errors, isValid: Object.keys(errors).length === 0 };
}

export function validateVenueBookingWindow(window: Partial<VenueBookingWindow>): { errors: Record<string, string>; isValid: boolean } {
  const errors: Record<string, string> = {};
  if (window.dayOfWeek === undefined || window.dayOfWeek < 0 || window.dayOfWeek > 6) errors.dayOfWeek = "Choose a valid day.";
  if (!window.startTime || !TIME_PATTERN.test(window.startTime)) errors.startTime = "Use HH:mm format.";
  if (!window.endTime || !TIME_PATTERN.test(window.endTime)) errors.endTime = "Use HH:mm format.";
  if (window.startTime && window.endTime && window.endTime <= window.startTime) errors.endTime = "End time must be after start time.";
  return { errors, isValid: Object.keys(errors).length === 0 };
}

export function validateVenueBookingClosureDate(date: string, now = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Use the YYYY-MM-DD format.";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "That is not a real date.";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (parsed < today) return "Closure dates cannot be in the past.";
  return null;
}

export function checkBookingAvailability(input: BookingAvailabilityCheckInput): BookingAvailabilityCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { settings } = input.availability;
  const requestedAt = new Date(`${input.requestedDate}T${input.requestedTime}`);
  const now = input.now ?? new Date();
  const maxAdvance = new Date(now);
  maxAdvance.setDate(maxAdvance.getDate() + settings.maxAdvanceDays);

  if (!settings.bookingRequestsEnabled) errors.push("Booking requests are currently unavailable for this venue.");
  if (input.partySize < settings.minPartySize) errors.push(`This venue accepts booking requests from ${settings.minPartySize} people.`);
  if (input.partySize > settings.maxPartySize) errors.push(`This venue accepts booking requests up to ${settings.maxPartySize} people.`);
  if (Number.isNaN(requestedAt.getTime())) errors.push("Choose a valid date and time.");
  if (!Number.isNaN(requestedAt.getTime()) && requestedAt.getTime() < now.getTime() + settings.minNoticeMinutes * 60000) errors.push(`This venue needs at least ${formatNoticePeriod(settings.minNoticeMinutes)} notice for booking requests.`);
  if (!Number.isNaN(requestedAt.getTime()) && requestedAt > maxAdvance) errors.push(`This venue accepts booking requests up to ${formatAdvanceBookingWindow(settings.maxAdvanceDays)}.`);

  const dayOfWeek = new Date(`${input.requestedDate}T00:00:00`).getDay();
  const partialBlackout = input.availability.blackoutDates.find((blackout) => !blackout.isFullDay && blackout.blackoutDate === input.requestedDate && blackout.startTime && blackout.endTime);
  if (partialBlackout) {
    const requestedMinutes = toMinutes(normaliseSlotTime(input.requestedTime));
    if (requestedMinutes >= toMinutes(partialBlackout.startTime!) && requestedMinutes < toMinutes(partialBlackout.endTime!)) {
      errors.push(`This venue is closed for bookings from ${partialBlackout.startTime!.slice(0, 5)} to ${partialBlackout.endTime!.slice(0, 5)} on this date.`);
    }
  } else if (input.availability.blackoutDates.some((blackout) => blackout.isFullDay && blackout.blackoutDate === input.requestedDate)) {
    errors.push("This venue is not accepting booking requests on this date.");
  }

  const enabledWindows = input.availability.windows.filter((window) => window.isEnabled && window.dayOfWeek === dayOfWeek);
  if (!enabledWindows.length) errors.push(`This venue is not accepting booking requests on ${formatDayOfWeek(dayOfWeek)}.`);
  if (enabledWindows.length && !enabledWindows.some((window) => input.requestedTime >= window.startTime && input.requestedTime <= window.endTime)) errors.push("Please choose a time within this venue's booking request hours.");

  // Capacity, not equality: the slot only fills once accepted bookings reach it.
  const capacity = Math.max(1, settings.slotCapacity);
  const taken = countBookingsAtSlot(input.availability.bookedSlots, input.requestedDate, input.requestedTime);
  if (taken >= capacity) {
    errors.push(capacity === 1 ? "This time has already been booked. Please choose another time." : `All ${capacity} bookings for this time have been taken. Please choose another time.`);
  }

  return { isAvailable: errors.length === 0, errors, warnings };
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
