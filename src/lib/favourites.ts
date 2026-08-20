import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";

const FAVOURITE_VENUE_IDS_KEY = "sheesha:favourite-venue-ids:v1";
const LEGACY_FAVOURITE_VENUE_IDS_KEY = "shisha-london:favourite-venue-ids:v1";

export function getFavouriteVenueIds(): string[] {
  const favouriteVenueIds = readJsonFromStorage<string[]>(FAVOURITE_VENUE_IDS_KEY, []);

  if (favouriteVenueIds.length > 0) {
    return favouriteVenueIds;
  }

  const legacyFavouriteVenueIds = readJsonFromStorage<string[]>(LEGACY_FAVOURITE_VENUE_IDS_KEY, []);
  if (legacyFavouriteVenueIds.length > 0) {
    saveFavouriteVenueIds(legacyFavouriteVenueIds);
  }

  return legacyFavouriteVenueIds;
}

export function saveFavouriteVenueIds(ids: string[]): void {
  writeJsonToStorage(FAVOURITE_VENUE_IDS_KEY, ids);
}

export function isFavouriteVenue(venueId: string, favouriteIds: string[]): boolean {
  return favouriteIds.includes(venueId);
}

export function toggleFavouriteVenueId(venueId: string, favouriteIds: string[]): string[] {
  if (favouriteIds.includes(venueId)) {
    return favouriteIds.filter((id) => id !== venueId);
  }

  return [...favouriteIds, venueId];
}
