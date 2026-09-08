import type { OpeningHours } from "@/types/venue";
import type { BookingCalendarEvent } from "@/types/bookingCalendar";
import type { VenueBookingBlackoutDate } from "@/types/bookingAvailability";

/** One hour of calendar height, in px. Every block position derives from this. */
export const HOUR_HEIGHT_PX = 56;
export const CALENDAR_START_HOUR = 17;
export const CALENDAR_END_HOUR = 24;
export const DEFAULT_BOOKING_DURATION_HOURS = 2;

export const CALENDAR_HOURS = Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR }, (_, index) => CALENDAR_START_HOUR + index);
export const CALENDAR_BODY_HEIGHT_PX = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_HEIGHT_PX;

export interface CalendarBlockGeometry {
  top: number;
  height: number;
}

export function parseTimeToHours(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours + minutes / 60;
}

/**
 * Places an event in the day column. Events before the grid's first hour are
 * clamped to the top rather than dropped, so an out-of-hours request is still
 * visible and obviously unusual.
 */
export function getEventGeometry(input: { time: string; durationHours?: number }): CalendarBlockGeometry | null {
  const startHours = parseTimeToHours(input.time);
  if (startHours === null) return null;

  const duration = input.durationHours ?? DEFAULT_BOOKING_DURATION_HOURS;
  const clampedStart = Math.min(Math.max(startHours, CALENDAR_START_HOUR), CALENDAR_END_HOUR);
  const clampedEnd = Math.min(clampedStart + duration, CALENDAR_END_HOUR);

  return {
    top: (clampedStart - CALENDAR_START_HOUR) * HOUR_HEIGHT_PX,
    height: Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT_PX, 24),
  };
}

/**
 * The shaded band covering hours the venue is closed, drawn behind events.
 * Returns null when the venue is open across the whole visible range.
 */
export function getClosedBandGeometry(input: { openingHours: OpeningHours[]; date: string }): CalendarBlockGeometry | null {
  const hours = getOpeningHoursForDate({ openingHours: input.openingHours, date: input.date });
  if (!hours) return { top: 0, height: CALENDAR_BODY_HEIGHT_PX };

  const openHours = parseTimeToHours(hours.open);
  if (openHours === null || openHours <= CALENDAR_START_HOUR) return null;

  const bandEnd = Math.min(openHours, CALENDAR_END_HOUR);
  return { top: 0, height: (bandEnd - CALENDAR_START_HOUR) * HOUR_HEIGHT_PX };
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function getOpeningHoursForDate(input: { openingHours: OpeningHours[]; date: string }): OpeningHours | null {
  const dayName = DAY_NAMES[new Date(`${input.date}T00:00:00`).getDay()];
  return input.openingHours.find((entry) => entry.day.trim().toLowerCase().startsWith(dayName.slice(0, 3))) ?? null;
}

export function getClosureForDate(input: { closures: VenueBookingBlackoutDate[]; date: string }): VenueBookingBlackoutDate | null {
  return input.closures.find((closure) => closure.blackoutDate === input.date && closure.isFullDay) ?? null;
}

export function isEventAwaitingReply(event: BookingCalendarEvent): boolean {
  return event.status === "pending";
}

/** Whole days a request has been waiting, for the "Waiting 2d" pill. */
export function getWaitingDays(createdAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000)));
}

export function formatRelativeAge(createdAt: string): string {
  const hours = (Date.now() - new Date(createdAt).getTime()) / (60 * 60 * 1000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}
