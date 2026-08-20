import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";

const RECENTLY_VIEWED_VENUE_IDS_KEY = "sheesha:recently-viewed-venue-ids:v1";
const LEGACY_RECENTLY_VIEWED_VENUE_IDS_KEY = "shisha-london:recently-viewed-venue-ids:v1";
const MAX_RECENTLY_VIEWED = 6;

export function getRecentlyViewedVenueIds(): string[] {
  const recentlyViewedVenueIds = readJsonFromStorage<string[]>(RECENTLY_VIEWED_VENUE_IDS_KEY, []);

  if (recentlyViewedVenueIds.length > 0) {
    return recentlyViewedVenueIds;
  }

  const legacyRecentlyViewedVenueIds = readJsonFromStorage<string[]>(LEGACY_RECENTLY_VIEWED_VENUE_IDS_KEY, []);
  if (legacyRecentlyViewedVenueIds.length > 0) {
    saveRecentlyViewedVenueIds(legacyRecentlyViewedVenueIds);
  }

  return legacyRecentlyViewedVenueIds;
}

export function saveRecentlyViewedVenueIds(ids: string[]): void {
  writeJsonToStorage(RECENTLY_VIEWED_VENUE_IDS_KEY, ids);
}

export function addRecentlyViewedVenueId(venueId: string, currentIds: string[]): string[] {
  const withoutDuplicate = currentIds.filter((id) => id !== venueId);
  return [venueId, ...withoutDuplicate].slice(0, MAX_RECENTLY_VIEWED);
}
