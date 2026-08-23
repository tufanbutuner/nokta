import type { OpeningHours, Venue } from "@/types/venue";

export type VenueCurrentStatus = "open" | "closed" | "unknown";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function getVenueCurrentStatus(venue: Venue, now = new Date()): VenueCurrentStatus {
  if (venue.businessStatus === "temporarily-closed" || venue.businessStatus === "permanently-closed") {
    return "closed";
  }

  if (!venue.openingHours.length) {
    return "unknown";
  }

  return getOpeningHoursStatus(venue.openingHours, now);
}

export function isVenueOpenNow(venue: Venue, now = new Date()): boolean {
  return getVenueCurrentStatus(venue, now) === "open";
}

export function getOpeningHoursStatus(openingHours: OpeningHours[], now = new Date()): VenueCurrentStatus {
  const londonNow = getLondonTimeParts(now);
  if (!londonNow) {
    return "unknown";
  }

  const todayRows = getRowsForDay(openingHours, londonNow.dayIndex);
  const previousRows = getRowsForDay(openingHours, (londonNow.dayIndex + 6) % 7);
  const previousOvernightRows = previousRows
    .map(toTimeRange)
    .filter((range): range is TimeRange => range !== null && range.closesNextDay);

  if (previousOvernightRows.some((range) => londonNow.minutes < range.closeMinutes)) {
    return "open";
  }

  const todayRanges = todayRows.map(toTimeRange).filter((range): range is TimeRange => range !== null);
  if (!todayRanges.length && !previousOvernightRows.length) {
    return "unknown";
  }

  if (
    todayRanges.some((range) => {
      if (range.closesNextDay) {
        return londonNow.minutes >= range.openMinutes;
      }

      return londonNow.minutes >= range.openMinutes && londonNow.minutes < range.closeMinutes;
    })
  ) {
    return "open";
  }

  return "closed";
}

function getRowsForDay(openingHours: OpeningHours[], dayIndex: number) {
  return openingHours.filter((item) => getDayIndex(item.day) === dayIndex);
}

function getDayIndex(day: string): number {
  const normalizedDay = day.trim().toLowerCase();
  return DAY_NAMES.findIndex((dayName) => dayName.toLowerCase() === normalizedDay || dayName.slice(0, 3).toLowerCase() === normalizedDay.slice(0, 3));
}

interface TimeRange {
  openMinutes: number;
  closeMinutes: number;
  closesNextDay: boolean;
}

function toTimeRange(item: OpeningHours): TimeRange | null {
  const openMinutes = parseTimeToMinutes(item.open);
  const closeMinutes = parseTimeToMinutes(item.close);

  if (openMinutes === null || closeMinutes === null) {
    return null;
  }

  return {
    openMinutes,
    closeMinutes,
    closesNextDay: closeMinutes <= openMinutes,
  };
}

function parseTimeToMinutes(value: string): number | null {
  const normalizedValue = value.trim().toLowerCase();
  if (!normalizedValue || normalizedValue === "closed") {
    return null;
  }

  const twentyFourHourMatch = normalizedValue.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (twentyFourHourMatch) {
    return toMinutes(Number(twentyFourHourMatch[1]), Number(twentyFourHourMatch[2]));
  }

  const meridiemMatch = normalizedValue.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (!meridiemMatch) {
    return null;
  }

  let hour = Number(meridiemMatch[1]);
  const minute = meridiemMatch[2] ? Number(meridiemMatch[2]) : 0;
  const meridiem = meridiemMatch[3];

  if (hour < 1 || hour > 12) {
    return null;
  }

  if (meridiem === "am") {
    hour = hour === 12 ? 0 : hour;
  } else {
    hour = hour === 12 ? 12 : hour + 12;
  }

  return toMinutes(hour, minute);
}

function toMinutes(hour: number, minute: number): number | null {
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}

function getLondonTimeParts(now: Date): { dayIndex: number; minutes: number } | null {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);

  if (!weekday || !Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  const dayIndex = getDayIndex(weekday);
  if (dayIndex === -1) {
    return null;
  }

  return {
    dayIndex,
    minutes: hour * 60 + minute,
  };
}
