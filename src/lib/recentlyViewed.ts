import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";

const RECENTLY_VIEWED_VENUE_IDS_KEY = "shisha-london:recently-viewed-venue-ids:v1";
const MAX_RECENTLY_VIEWED = 6;

export function getRecentlyViewedVenueIds(): string[] {
  return readJsonFromStorage<string[]>(RECENTLY_VIEWED_VENUE_IDS_KEY, []);
}

export function saveRecentlyViewedVenueIds(ids: string[]): void {
  writeJsonToStorage(RECENTLY_VIEWED_VENUE_IDS_KEY, ids);
}

export function addRecentlyViewedVenueId(venueId: string, currentIds: string[]): string[] {
  const withoutDuplicate = currentIds.filter((id) => id !== venueId);
  return [venueId, ...withoutDuplicate].slice(0, MAX_RECENTLY_VIEWED);
}
