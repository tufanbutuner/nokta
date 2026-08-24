import { useCallback, useEffect, useState } from "react";
import { getVenueReviews } from "@/services/reviewService";
import type { VenueReview } from "@/types/reviews";

interface UseVenueReviewsResult {
  reviews: VenueReview[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVenueReviews(venueId: string): UseVenueReviewsResult {
  const [reviews, setReviews] = useState<VenueReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setReviews(await getVenueReviews(venueId));
    } catch (caughtError) {
      setReviews([]);
      setError(caughtError instanceof Error ? caughtError.message : "Could not load reviews.");
    } finally {
      setIsLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setIsLoading(true);
      setError(null);

      try {
        const nextReviews = await getVenueReviews(venueId);
        if (!cancelled) {
          setReviews(nextReviews);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setReviews([]);
          setError(caughtError instanceof Error ? caughtError.message : "Could not load reviews.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [venueId]);

  return { reviews, isLoading, error, refetch: loadReviews };
}
