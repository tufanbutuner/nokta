import { useEffect, useState } from "react";
import { getVenueBySlug } from "@/services/venueService";
import type { Venue } from "@/types/venue";

interface UseVenueResult {
  venue: Venue | null;
  isLoading: boolean;
  error: string | null;
}

export function useVenue(slug?: string): UseVenueResult {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(slug));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setVenue(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const venueSlug = slug;

    async function loadVenue() {
      setIsLoading(true);
      setError(null);
      setVenue(null);

      try {
        const nextVenue = await getVenueBySlug(venueSlug);
        if (!cancelled) {
          setVenue(nextVenue);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setVenue(null);
          setError(caughtError instanceof Error ? caughtError.message : "Could not load venue.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadVenue();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { venue, isLoading, error };
}
