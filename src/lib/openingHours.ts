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

export interface VenueOpeningBoundary {
  status: VenueCurrentStatus;
  /** "Open till 23:00" / "Opens 12:00" / "Closed today". Null when hours are unknown. */
  label: string | null;
}

export interface GroupedOpeningRow {
  /** "Mon – Wed" or "Thursday". */
  days: string;
  /** "12:00 – 23:00", or "Closed" when the day has no usable range. */
  hours: string;
}

/**
 * The live boundary shown in the header pill. "Open till 23:00" while open,
 * "Opens 12:00" when the venue opens again later today, "Closed today" otherwise.
 */
export function getVenueOpeningBoundary(venue: Venue, now = new Date()): VenueOpeningBoundary {
  const status = getVenueCurrentStatus(venue, now);
  if (status === "unknown") {
    return { status, label: null };
  }

  const londonNow = getLondonTimeParts(now);
  if (!londonNow) {
    return { status, label: null };
  }

  if (status === "open") {
    const closeMinutes = getActiveCloseMinutes(venue.openingHours, londonNow);
    return { status, label: closeMinutes === null ? "Open now" : `Open till ${formatMinutes(closeMinutes)}` };
  }

  const nextOpenMinutes = getTodayRanges(venue.openingHours, londonNow.dayIndex)
    .map((range) => range.openMinutes)
    .filter((openMinutes) => openMinutes > londonNow.minutes)
    .sort((a, b) => a - b)[0];

  return { status, label: nextOpenMinutes === undefined ? "Closed today" : `Opens ${formatMinutes(nextOpenMinutes)}` };
}

/** Today's hours as a single "12:00 – 23:00" string, or null when unknown. */
export function getTodayOpeningLabel(venue: Venue, now = new Date()): string | null {
  const londonNow = getLondonTimeParts(now);
  if (!londonNow) {
    return null;
  }

  return formatDayHours(getRowsForDay(venue.openingHours, londonNow.dayIndex));
}

/** The week with consecutive identical days collapsed into ranges ("Mon – Wed"). */
export function getGroupedOpeningHours(openingHours: OpeningHours[]): GroupedOpeningRow[] {
  if (!openingHours.length) {
    return [];
  }

  // Monday-first, matching how the week reads in the rail.
  const weekOrder = [1, 2, 3, 4, 5, 6, 0];
  const days = weekOrder.map((dayIndex) => ({ dayIndex, hours: formatDayHours(getRowsForDay(openingHours, dayIndex)) })).filter((day): day is { dayIndex: number; hours: string } => day.hours !== null);

  const groups: GroupedOpeningRow[] = [];
  let start = 0;

  for (let index = 0; index < days.length; index += 1) {
    const isLast = index === days.length - 1;
    const breaksRun = isLast || days[index + 1].hours !== days[start].hours;
    if (!breaksRun) continue;

    const startDay = DAY_NAMES[days[start].dayIndex];
    const endDay = DAY_NAMES[days[index].dayIndex];
    groups.push({ days: start === index ? startDay : `${startDay.slice(0, 3)} – ${endDay.slice(0, 3)}`, hours: days[start].hours });
    start = index + 1;
  }

  return groups;
}

function getTodayRanges(openingHours: OpeningHours[], dayIndex: number): TimeRange[] {
  return getRowsForDay(openingHours, dayIndex)
    .map(toTimeRange)
    .filter((range): range is TimeRange => range !== null);
}

/** Close time of whichever range the venue is currently inside, including one that ran over midnight. */
function getActiveCloseMinutes(openingHours: OpeningHours[], londonNow: { dayIndex: number; minutes: number }): number | null {
  const overnightFromYesterday = getTodayRanges(openingHours, (londonNow.dayIndex + 6) % 7).find((range) => range.closesNextDay && londonNow.minutes < range.closeMinutes);
  if (overnightFromYesterday) {
    return overnightFromYesterday.closeMinutes;
  }

  const activeToday = getTodayRanges(openingHours, londonNow.dayIndex).find((range) => (range.closesNextDay ? londonNow.minutes >= range.openMinutes : londonNow.minutes >= range.openMinutes && londonNow.minutes < range.closeMinutes));
  return activeToday?.closeMinutes ?? null;
}

/** "12:00 – 23:00" for a day's rows, "Closed" when rows exist but none parse, null when the day is absent. */
function formatDayHours(rows: OpeningHours[]): string | null {
  if (!rows.length) {
    return null;
  }

  const ranges = rows.map(toTimeRange).filter((range): range is TimeRange => range !== null);
  if (!ranges.length) {
    return "Closed";
  }

  return ranges.map((range) => `${formatMinutes(range.openMinutes)} – ${formatMinutes(range.closeMinutes)}`).join(", ");
}

function formatMinutes(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}
