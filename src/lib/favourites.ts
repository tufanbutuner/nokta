import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";

const FAVOURITE_VENUE_IDS_KEY = "shisha-london:favourite-venue-ids:v1";

export function getFavouriteVenueIds(): string[] {
  return readJsonFromStorage<string[]>(FAVOURITE_VENUE_IDS_KEY, []);
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
