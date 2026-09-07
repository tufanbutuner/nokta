import { useQuery } from "@tanstack/react-query";
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
  const query = useQuery({
    queryKey: ["venues"],
    queryFn: getVenues,
    enabled: !isLoadingAuth,
  });

  const venues = canSeeTestVenues ? query.data ?? [] : (query.data ?? []).filter((venue) => !venue.isTest);
  const error = query.error instanceof Error ? query.error.message : query.error ? "Could not load venues." : null;

  return { venues, isLoading: isLoadingAuth || query.isPending, error };
}
