import type { VenueProfileUpdateChanges } from "@/types/venueUpdateRequests";

export const FEATURE_CHIPS: { value: string; label: string }[] = [
  { value: "food", label: "Food" },
  { value: "alcohol", label: "Alcohol" },
  { value: "halal", label: "Halal" },
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
  { value: "openLate", label: "Open late" },
];

export const VIBE_CHIPS: { value: string; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "luxury", label: "Luxury" },
  { value: "date-night", label: "Date night" },
  { value: "groups", label: "Groups" },
  { value: "football", label: "Football" },
  { value: "late-night", label: "Late night" },
  { value: "quiet", label: "Quiet" },
  { value: "party", label: "Party" },
  { value: "rooftop", label: "Rooftop" },
  { value: "outdoor", label: "Outdoor seating" },
];

export interface ProfileDiffRow {
  field: string;
  label: string;
  before: string;
  after: string;
}

const TEXT_FIELDS: { field: keyof VenueProfileUpdateChanges; label: string }[] = [
  { field: "description", label: "Description" },
  { field: "phone", label: "Phone" },
  { field: "website", label: "Website" },
  { field: "instagram", label: "Instagram" },
  { field: "bookingUrl", label: "Booking link" },
  { field: "contactUrl", label: "Contact link" },
];

function labelFor(value: string, options: { value: string; label: string }[]) {
  return options.find((option) => option.value === value)?.label ?? value;
}

/** Order-insensitive, so reordering chips is not a change. */
function sameSet(a: string[] = [], b: string[] = []) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

function formatList(values: string[] = [], options: { value: string; label: string }[]) {
  return values.map((value) => labelFor(value, options)).join(", ") || "None";
}

/**
 * Changed fields between the snapshot taken on load and the working copy.
 * Backs both the sticky bar's count and the expanded review panel.
 */
export function getProfileDiff(snapshot: VenueProfileUpdateChanges, changes: VenueProfileUpdateChanges): ProfileDiffRow[] {
  const rows: ProfileDiffRow[] = [];

  for (const { field, label } of TEXT_FIELDS) {
    const before = ((snapshot[field] as string | null | undefined) ?? "").trim();
    const after = ((changes[field] as string | null | undefined) ?? "").trim();
    if (before === after) continue;
    rows.push({ field, label, before: before || "Not set", after: after || "Removed" });
  }

  if (!sameSet(snapshot.features, changes.features)) {
    rows.push({ field: "features", label: "Features", before: formatList(snapshot.features, FEATURE_CHIPS), after: formatList(changes.features, FEATURE_CHIPS) });
  }

  if (!sameSet(snapshot.vibes, changes.vibes)) {
    rows.push({ field: "vibes", label: "Vibes", before: formatList(snapshot.vibes, VIBE_CHIPS), after: formatList(changes.vibes, VIBE_CHIPS) });
  }

  return rows;
}
