import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { getVenues } from "@/services/venueService";
import type { Venue } from "@/types/venue";

interface UseVenuesResult {
  venues: Venue[];
  isLoading: boolean;
  error: string | null;
}

export function useVenues(): UseVenuesResult {
  const { isLoading: isLoadingAuth } = useAuth();
  const { isAdmin: canSeeTestVenues, isLoading: isLoadingAdmin } = useIsAdmin();
  const query = useQuery({
    queryKey: ["venues"],
    queryFn: getVenues,
    enabled: !isLoadingAuth,
  });

  const venues = canSeeTestVenues ? query.data ?? [] : (query.data ?? []).filter((venue) => !venue.isTest);
  const error = query.error instanceof Error ? query.error.message : query.error ? "Could not load venues." : null;

  return { venues, isLoading: isLoadingAuth || isLoadingAdmin || query.isPending, error };
}
