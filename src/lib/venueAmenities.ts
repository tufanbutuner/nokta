import { getGroupedOpeningHours } from "@/lib/openingHours";
import type { Venue } from "@/types/venue";

const MINUTES_IN_DAY = 1440;

export type VenueAmenityIcon = "awning" | "utensils" | "clock" | "users" | "sofa" | "glass";

export interface VenueAmenity {
  label: string;
  icon: VenueAmenityIcon | null;
  /** Unknowns render last, borderless and muted, so the row still reads as complete. */
  isUnknown: boolean;
}

/**
 * Amenity chips for the Overview tab. Each chip carries the specific fact rather than the
 * flag name ("Covered terrace", not "Outdoor seating"), and anything we do not know about
 * is stated as unknown rather than dropped, so the row reads as a complete answer.
 */
export function getVenueAmenities(venue: Venue): VenueAmenity[] {
  const known: VenueAmenity[] = [];

  if (venue.outdoor) known.push({ label: "Covered terrace", icon: "awning", isUnknown: false });
  if (venue.food) known.push({ label: venue.halal ? "Halal food served" : "Food served", icon: "utensils", isUnknown: false });

  const lateLabel = venue.openLate ? getLateOpeningLabel(venue) : null;
  if (lateLabel) known.push({ label: lateLabel, icon: "clock", isUnknown: false });

  if (venue.vibes.includes("groups")) known.push({ label: "Group friendly", icon: "users", isUnknown: false });
  if (venue.indoor) known.push({ label: "Indoor seating", icon: "sofa", isUnknown: false });
  if (venue.alcohol) known.push({ label: "Alcohol served", icon: "glass", isUnknown: false });

  const unknown: VenueAmenity[] = [];
  if (!venue.alcohol) unknown.push({ label: "No alcohol listed", icon: null, isUnknown: true });
  if (!venue.food) unknown.push({ label: "No food listed", icon: null, isUnknown: true });

  return [...known, ...unknown];
}

/**
 * "Open till 01:00 Fri & Sat" — the latest closing time and the days it applies to.
 * Only a genuinely late close earns the chip; a venue shutting at or before midnight
 * gets the plain "Open late" label rather than a precise time that reads as ordinary.
 */
function getLateOpeningLabel(venue: Venue): string | null {
  const groups = getGroupedOpeningHours(venue.openingHours);
  const latest = groups
    .map((group) => ({ group, closeMinutes: getLatestCloseMinutes(group.hours) }))
    .filter((entry): entry is { group: (typeof groups)[number]; closeMinutes: number } => entry.closeMinutes !== null)
    .sort((a, b) => b.closeMinutes - a.closeMinutes)[0];

  // Past midnight only; MINUTES_IN_DAY marks a 00:00 close, which is not a late-night claim.
  if (!latest || latest.closeMinutes <= MINUTES_IN_DAY) {
    return "Open late";
  }

  const closeLabel = latest.group.hours.split(" – ").pop()?.trim();
  if (!closeLabel) {
    return "Open late";
  }

  // Name the days only when the late close is the exception rather than the whole week.
  const isEveryDay = groups.length === 1;
  return isEveryDay ? `Open till ${closeLabel}` : `Open till ${closeLabel} ${formatDaysSuffix(latest.group.days)}`;
}

/** Closing minute of a formatted range, shifted past midnight so overnight sorts as latest. */
function getLatestCloseMinutes(hours: string): number | null {
  const [openLabel, closeLabel] = hours.split(" – ").map((part) => part.trim());
  const openMinutes = parseLabelMinutes(openLabel);
  const closeMinutes = parseLabelMinutes(closeLabel);
  if (openMinutes === null || closeMinutes === null) {
    return null;
  }

  return closeMinutes <= openMinutes ? closeMinutes + MINUTES_IN_DAY : closeMinutes;
}

function parseLabelMinutes(value?: string): number | null {
  const match = value?.match(/^(\d{2}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** "Fri – Sat" reads better as "Fri & Sat" in a chip. */
function formatDaysSuffix(days: string): string {
  return days.replace(" – ", " & ");
}
