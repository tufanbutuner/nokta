import { countBookingsAtSlot } from "@/lib/bookingSlot";
import type { VenueBookingAvailability } from "@/types/bookingAvailability";

/**
 * Shown only when a venue has published no booking hours at all — no settings
 * row, or windows never configured — and while availability is still loading.
 * A booking request is a request either way, so offering the usual evening
 * slots keeps the field a list of times to pick from rather than a clock the
 * customer has to guess at.
 *
 * A venue with published hours never sees this: a fully booked or closed date
 * returns an empty list, and the caller explains why (see explainEmptyTimeOptions).
 */
export const FALLBACK_TIME_OPTIONS = ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00"];

export interface BookingTimeOptionsInput {
  availability: VenueBookingAvailability;
  selectedDate: string;
  intervalMinutes?: number;
  now?: Date;
}

export function getBookingTimeOptions(input: BookingTimeOptionsInput): string[] {
  if (!input.selectedDate) return [];
  const { settings, windows, blackoutDates, bookedSlots } = input.availability;
  const now = input.now ?? new Date();
  if (!settings.bookingRequestsEnabled) return [];

  // Outside the advance-booking window the form would only reject it on submit.
  const maxAdvance = new Date(now);
  maxAdvance.setDate(maxAdvance.getDate() + settings.maxAdvanceDays);
  const requestedAt = new Date(`${input.selectedDate}T23:59`);
  if (!Number.isNaN(requestedAt.getTime()) && requestedAt > maxAdvance) return [];

  if (blackoutDates.some((blackout) => blackout.isFullDay && blackout.blackoutDate === input.selectedDate)) return [];

  const interval = input.intervalMinutes ?? 30;
  const dayOfWeek = new Date(`${input.selectedDate}T00:00:00`).getDay();
  const minTime = now.getTime() + settings.minNoticeMinutes * 60000;
  const partialBlackouts = blackoutDates.filter((blackout) => !blackout.isFullDay && blackout.blackoutDate === input.selectedDate && blackout.startTime && blackout.endTime);

  return windows
    .filter((window) => window.isEnabled && window.dayOfWeek === dayOfWeek)
    .flatMap((window) => buildOptions(window.startTime, window.endTime, interval))
    .filter((time, index, times) => times.indexOf(time) === index)
    .filter((time) => new Date(`${input.selectedDate}T${time}`).getTime() >= minTime)
    .filter((time) => new Date(`${input.selectedDate}T${time}`).getTime() <= maxAdvance.getTime())
    .filter((time) => !partialBlackouts.some((blackout) => isWithinBlackout(time, blackout.startTime!, blackout.endTime!)))
    // Capacity, not equality: a slot only disappears once the venue's accepted
    // bookings for that time reach the configured per-slot capacity.
    .filter((time) => countBookingsAtSlot(bookedSlots, input.selectedDate, time) < Math.max(1, settings.slotCapacity))
    .sort();
}

/**
 * Why the picker came back empty for this date — shown instead of silently
 * offering a list of times that will be rejected on submit.
 */
export function explainEmptyTimeOptions(input: BookingTimeOptionsInput): string | null {
  const { availability, selectedDate } = input;
  if (!selectedDate) return null;
  const { settings, windows, blackoutDates } = availability;
  const now = input.now ?? new Date();

  if (!settings.bookingRequestsEnabled) return "This venue isn't taking booking requests right now.";
  if (blackoutDates.some((blackout) => blackout.isFullDay && blackout.blackoutDate === selectedDate)) return "This venue is closed on that date.";
  if (blackoutDates.some((blackout) => !blackout.isFullDay && blackout.blackoutDate === selectedDate && blackout.startTime && blackout.endTime)) return "That date has a closure covering the usual booking times.";

  const dayOfWeek = new Date(`${selectedDate}T00:00:00`).getDay();
  if (!windows.some((window) => window.isEnabled && window.dayOfWeek === dayOfWeek)) return "The venue doesn't take booking requests on that weekday.";

  const maxAdvance = new Date(now);
  maxAdvance.setDate(maxAdvance.getDate() + settings.maxAdvanceDays);
  const endOfDay = new Date(`${selectedDate}T23:59`);
  if (!Number.isNaN(endOfDay.getTime()) && endOfDay > maxAdvance) return `Bookings open up to ${settings.maxAdvanceDays} days ahead — that date is too far away.`;

  const minTime = now.getTime() + settings.minNoticeMinutes * 60000;
  const firstSlot = new Date(`${selectedDate}T00:00`).getTime();
  if (firstSlot < minTime) return "There isn't enough notice left on that date — try a later one.";

  return "Every time on that date is booked. Try another date.";
}

function isWithinBlackout(time: string, startTime: string, endTime: string): boolean {
  const value = toMinutes(time);
  return value >= toMinutes(startTime) && value < toMinutes(endTime);
}

function buildOptions(startTime: string, endTime: string, intervalMinutes: number) {
  const options: string[] = [];
  let cursor = toMinutes(startTime);
  const end = toMinutes(endTime);
  while (cursor <= end) {
    options.push(fromMinutes(cursor));
    cursor += intervalMinutes;
  }
  return options;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
