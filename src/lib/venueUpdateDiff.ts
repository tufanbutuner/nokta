export interface VenueUpdateDiffItem {
  field: string;
  label: string;
  before: unknown;
  after: unknown;
  changed: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  description: "Description",
  phone: "Phone",
  website: "Website",
  instagram: "Instagram",
  priceFrom: "Price from",
  openingHours: "Opening hours",
  features: "Features",
  vibes: "Vibes",
  menuUrl: "Menu URL",
  bookingUrl: "Booking URL",
  contactUrl: "Contact URL",
};

export function getVenueUpdateDiff(input: { original: object; requested: object }): VenueUpdateDiffItem[] {
  const original = input.original as Record<string, unknown>;
  const requested = input.requested as Record<string, unknown>;
  const fields = Array.from(new Set([...Object.keys(original), ...Object.keys(requested)]));
  return fields.map((field) => {
    const before = original[field];
    const after = requested[field];
    return { field, label: FIELD_LABELS[field] ?? field, before, after, changed: JSON.stringify(before ?? null) !== JSON.stringify(after ?? null) };
  }).filter((item) => item.changed);
}

export function getVenueUpdateDiffLabels(input: { originalSnapshot: object; requestedChanges: object }): string[] {
  return getVenueUpdateDiff({ original: input.originalSnapshot, requested: input.requestedChanges }).map((item) => item.label);
}

export function formatDiffValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not set";
  if (Array.isArray(value)) return value.join(", ") || "Not set";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
