import { getFavouriteVenueIds } from "@/lib/favourites";
import { getRecentlyViewedVenueIds } from "@/lib/recentlyViewed";
import { addUserRecentlyViewedVenue, addUserSavedVenue } from "@/services/userPreferencesService";

export async function syncLocalPreferencesToUser(userId: string): Promise<void> {
  const favouriteVenueIds = Array.from(new Set(getFavouriteVenueIds()));
  const recentlyViewedVenueIds = Array.from(new Set(getRecentlyViewedVenueIds())).slice(0, 6);

  await Promise.all(favouriteVenueIds.map((venueId) => addUserSavedVenue(userId, venueId)));

  for (const venueId of [...recentlyViewedVenueIds].reverse()) {
    await addUserRecentlyViewedVenue(userId, venueId);
  }
}
