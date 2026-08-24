import { useCallback, useEffect, useState } from "react";
import { getUserReviewForVenue } from "@/services/reviewService";
import type { VenueReview } from "@/types/reviews";

interface UseUserVenueReviewResult {
  review: VenueReview | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserVenueReview(venueId: string, userId?: string | null): UseUserVenueReviewResult {
  const [review, setReview] = useState<VenueReview | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const loadReview = useCallback(async () => {
    if (!userId) {
      setReview(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setReview(await getUserReviewForVenue(venueId, userId));
    } catch (caughtError) {
      setReview(null);
      setError(caughtError instanceof Error ? caughtError.message : "Could not load your review.");
    } finally {
      setIsLoading(false);
    }
  }, [userId, venueId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!userId) {
        setReview(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const nextReview = await getUserReviewForVenue(venueId, userId);
        if (!cancelled) {
          setReview(nextReview);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setReview(null);
          setError(caughtError instanceof Error ? caughtError.message : "Could not load your review.");
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
  }, [userId, venueId]);

  return { review, isLoading, error, refetch: loadReview };
}
