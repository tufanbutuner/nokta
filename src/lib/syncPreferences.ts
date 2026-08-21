import { getFavouriteVenueIds, saveFavouriteVenueIds } from "@/lib/favourites";
import { getRecentlyViewedVenueIds, saveRecentlyViewedVenueIds } from "@/lib/recentlyViewed";
import { addUserRecentlyViewedVenue, addUserSavedVenue, getExistingVenueIds } from "@/services/userPreferencesService";

export async function syncLocalPreferencesToUser(userId: string): Promise<void> {
  const localFavouriteVenueIds = Array.from(new Set(getFavouriteVenueIds()));
  const localRecentlyViewedVenueIds = Array.from(new Set(getRecentlyViewedVenueIds())).slice(0, 6);
  const existingVenueIds = new Set(await getExistingVenueIds([...localFavouriteVenueIds, ...localRecentlyViewedVenueIds]));
  const favouriteVenueIds = localFavouriteVenueIds.filter((venueId) => existingVenueIds.has(venueId));
  const recentlyViewedVenueIds = localRecentlyViewedVenueIds.filter((venueId) => existingVenueIds.has(venueId));

  saveFavouriteVenueIds(favouriteVenueIds);
  saveRecentlyViewedVenueIds(recentlyViewedVenueIds);

  await Promise.all(favouriteVenueIds.map((venueId) => addUserSavedVenue(userId, venueId)));

  for (const venueId of [...recentlyViewedVenueIds].reverse()) {
    await addUserRecentlyViewedVenue(userId, venueId);
  }
}
