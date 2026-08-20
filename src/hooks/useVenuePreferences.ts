import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getFavouriteVenueIds, isFavouriteVenue, saveFavouriteVenueIds, toggleFavouriteVenueId } from "@/lib/favourites";
import { addRecentlyViewedVenueId, getRecentlyViewedVenueIds, saveRecentlyViewedVenueIds } from "@/lib/recentlyViewed";
import { syncLocalPreferencesToUser } from "@/lib/syncPreferences";
import {
  addUserRecentlyViewedVenue,
  addUserSavedVenue,
  getUserRecentlyViewedVenueIds,
  getUserSavedVenueIds,
  removeUserSavedVenue,
} from "@/services/userPreferencesService";

export interface UseVenuePreferencesResult {
  favouriteVenueIds: string[];
  recentlyViewedVenueIds: string[];
  isLoading: boolean;
  error: string | null;
  toggleFavourite: (venueId: string) => Promise<void> | void;
  isFavourite: (venueId: string) => boolean;
  addRecentlyViewed: (venueId: string) => Promise<void> | void;
}

export function useVenuePreferencesState(): UseVenuePreferencesResult {
  const { user, isLoading: authLoading } = useAuth();
  const [favouriteVenueIds, setFavouriteVenueIds] = useState<string[]>(() => getFavouriteVenueIds());
  const [recentlyViewedVenueIds, setRecentlyViewedVenueIds] = useState<string[]>(() => getRecentlyViewedVenueIds());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncedUserIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      return;
    }

    saveFavouriteVenueIds(favouriteVenueIds);
  }, [favouriteVenueIds, user]);

  useEffect(() => {
    if (user) {
      return;
    }

    saveRecentlyViewedVenueIds(recentlyViewedVenueIds);
  }, [recentlyViewedVenueIds, user]);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (!user) {
      setFavouriteVenueIds(getFavouriteVenueIds());
      setRecentlyViewedVenueIds(getRecentlyViewedVenueIds());
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const authUser = user;

    async function loadUserPreferences() {
      setIsLoading(true);
      setError(null);

      try {
        if (!syncedUserIds.current.has(authUser.id)) {
          await syncLocalPreferencesToUser(authUser.id);
          syncedUserIds.current.add(authUser.id);
        }

        const [nextFavouriteVenueIds, nextRecentlyViewedVenueIds] = await Promise.all([
          getUserSavedVenueIds(authUser.id),
          getUserRecentlyViewedVenueIds(authUser.id),
        ]);

        if (!cancelled) {
          setFavouriteVenueIds(nextFavouriteVenueIds);
          setRecentlyViewedVenueIds(nextRecentlyViewedVenueIds);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Something went wrong. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadUserPreferences();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const toggleFavourite = useCallback(
    async (venueId: string) => {
      setError(null);

      if (!user) {
        setFavouriteVenueIds((currentIds) => toggleFavouriteVenueId(venueId, currentIds));
        return;
      }

      const wasFavourite = favouriteVenueIds.includes(venueId);
      const previousIds = favouriteVenueIds;
      const nextIds = toggleFavouriteVenueId(venueId, favouriteVenueIds);
      setFavouriteVenueIds(nextIds);

      try {
        if (wasFavourite) {
          await removeUserSavedVenue(user.id, venueId);
        } else {
          await addUserSavedVenue(user.id, venueId);
        }
      } catch (caughtError) {
        setFavouriteVenueIds(previousIds);
        setError(caughtError instanceof Error ? caughtError.message : "Something went wrong. Please try again.");
      }
    },
    [favouriteVenueIds, user],
  );

  const isFavourite = useCallback((venueId: string) => isFavouriteVenue(venueId, favouriteVenueIds), [favouriteVenueIds]);

  const addRecentlyViewed = useCallback(
    async (venueId: string) => {
      setRecentlyViewedVenueIds((currentIds) => addRecentlyViewedVenueId(venueId, currentIds));

      if (!user) {
        return;
      }

      try {
        await addUserRecentlyViewedVenue(user.id, venueId);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Something went wrong. Please try again.");
      }
    },
    [user],
  );

  return {
    favouriteVenueIds,
    recentlyViewedVenueIds,
    isLoading,
    error,
    toggleFavourite,
    isFavourite,
    addRecentlyViewed,
  };
}
