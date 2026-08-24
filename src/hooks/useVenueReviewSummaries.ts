import { useEffect, useMemo, useState } from "react";
import { getVenueReviewSummaries } from "@/services/reviewService";
import type { VenueRatingSummary } from "@/types/reviews";

interface UseVenueReviewSummariesResult {
  summaries: Record<string, VenueRatingSummary>;
  isLoading: boolean;
  error: string | null;
}

export function useVenueReviewSummaries(venueIds: string[]): UseVenueReviewSummariesResult {
  const venueIdsKey = useMemo(() => Array.from(new Set(venueIds)).sort().join("|"), [venueIds]);
  const [summaries, setSummaries] = useState<Record<string, VenueRatingSummary>>({});
  const [isLoading, setIsLoading] = useState(Boolean(venueIds.length));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ids = venueIdsKey ? venueIdsKey.split("|") : [];

    if (!ids.length) {
      setSummaries({});
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function loadSummaries() {
      setIsLoading(true);
      setError(null);

      try {
        const nextSummaries = await getVenueReviewSummaries(ids);
        if (!cancelled) {
          setSummaries(nextSummaries);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setSummaries({});
          setError(caughtError instanceof Error ? caughtError.message : "Could not load review summaries.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSummaries();

    return () => {
      cancelled = true;
    };
  }, [venueIdsKey]);

  return { summaries, isLoading, error };
}
