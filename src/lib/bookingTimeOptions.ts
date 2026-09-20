import type { VenueBookingAvailability } from "@/types/bookingAvailability";

/**
 * Shown when a venue has published no availability, or before it has loaded.
 * A booking request is a request either way, so offering the usual evening
 * slots keeps the field a list of times to pick from rather than a clock the
 * customer has to guess at.
 */
export const FALLBACK_TIME_OPTIONS = ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00"];

export function getBookingTimeOptions(input: { availability: VenueBookingAvailability; selectedDate: string; intervalMinutes?: number; now?: Date }): string[] {
  if (!input.selectedDate) return [];
  const interval = input.intervalMinutes ?? 30;
  const dayOfWeek = new Date(`${input.selectedDate}T00:00:00`).getDay();
  if (input.availability.blackoutDates.some((blackout) => blackout.isFullDay && blackout.blackoutDate === input.selectedDate)) return [];
  const minTime = (input.now ?? new Date()).getTime() + input.availability.settings.minNoticeMinutes * 60000;

  return input.availability.windows
    .filter((window) => window.isEnabled && window.dayOfWeek === dayOfWeek)
    .flatMap((window) => buildOptions(window.startTime, window.endTime, interval))
    .filter((time) => new Date(`${input.selectedDate}T${time}`).getTime() >= minTime)
    .filter((time) => !input.availability.bookedSlots.some((slot) => slot.requestedDate === input.selectedDate && normaliseTime(slot.requestedTime) === time))
    .filter((time, index, times) => times.indexOf(time) === index)
    .sort();
}

function normaliseTime(time: string) {
  return time.slice(0, 5);
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
