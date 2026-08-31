import type { VenueBookingAvailability } from "@/types/bookingAvailability";

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
    .filter((time, index, times) => times.indexOf(time) === index)
    .sort();
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
