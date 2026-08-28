import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { isAdminUser } from "@/lib/admin";
import { getVenues } from "@/services/venueService";
import type { Venue } from "@/types/venue";

interface UseVenuesResult {
  venues: Venue[];
  isLoading: boolean;
  error: string | null;
}

export function useVenues(): UseVenuesResult {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const canSeeTestVenues = isAdminUser(user);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadVenues() {
      setIsLoading(true);
      setError(null);

      try {
        const nextVenues = await getVenues();
        if (!cancelled) {
          setVenues(canSeeTestVenues ? nextVenues : nextVenues.filter((venue) => !venue.isTest));
        }
      } catch (caughtError) {
        if (!cancelled) {
          setVenues([]);
          setError(caughtError instanceof Error ? caughtError.message : "Could not load venues.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (!isLoadingAuth) void loadVenues();

    return () => {
      cancelled = true;
    };
  }, [canSeeTestVenues, isLoadingAuth]);

  return { venues, isLoading, error };
}
