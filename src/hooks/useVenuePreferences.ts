import { useCallback, useEffect, useState } from "react";
import { getFavouriteVenueIds, isFavouriteVenue, saveFavouriteVenueIds, toggleFavouriteVenueId } from "@/lib/favourites";
import { addRecentlyViewedVenueId, getRecentlyViewedVenueIds, saveRecentlyViewedVenueIds } from "@/lib/recentlyViewed";

export interface UseVenuePreferencesResult {
  favouriteVenueIds: string[];
  recentlyViewedVenueIds: string[];
  toggleFavourite: (venueId: string) => void;
  isFavourite: (venueId: string) => boolean;
  addRecentlyViewed: (venueId: string) => void;
}

export function useVenuePreferencesState(): UseVenuePreferencesResult {
  const [favouriteVenueIds, setFavouriteVenueIds] = useState<string[]>(() => getFavouriteVenueIds());
  const [recentlyViewedVenueIds, setRecentlyViewedVenueIds] = useState<string[]>(() => getRecentlyViewedVenueIds());

  useEffect(() => {
    saveFavouriteVenueIds(favouriteVenueIds);
  }, [favouriteVenueIds]);

  useEffect(() => {
    saveRecentlyViewedVenueIds(recentlyViewedVenueIds);
  }, [recentlyViewedVenueIds]);

  const toggleFavourite = useCallback((venueId: string) => {
    setFavouriteVenueIds((currentIds) => toggleFavouriteVenueId(venueId, currentIds));
  }, []);

  const isFavourite = useCallback((venueId: string) => isFavouriteVenue(venueId, favouriteVenueIds), [favouriteVenueIds]);

  const addRecentlyViewed = useCallback((venueId: string) => {
    setRecentlyViewedVenueIds((currentIds) => addRecentlyViewedVenueId(venueId, currentIds));
  }, []);

  return {
    favouriteVenueIds,
    recentlyViewedVenueIds,
    toggleFavourite,
    isFavourite,
    addRecentlyViewed,
  };
}
