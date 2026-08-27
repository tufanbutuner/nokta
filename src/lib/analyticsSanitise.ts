const BLOCKED_KEYS = new Set([
  "email",
  "phone",
  "name",
  "customerName",
  "customerEmail",
  "customerPhone",
  "message",
  "adminNotes",
  "notes",
  "lat",
  "lng",
  "latitude",
  "longitude",
]);

export function sanitiseAnalyticsMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => !BLOCKED_KEYS.has(key))
      .slice(0, 20),
  );
}
