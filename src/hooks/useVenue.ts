import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { getVenueBySlug } from "@/services/venueService";
import type { Venue } from "@/types/venue";

interface UseVenueResult {
  venue: Venue | null;
  isLoading: boolean;
  error: string | null;
}

export function useVenue(slug?: string): UseVenueResult {
  const { isLoading: isLoadingAuth } = useAuth();
  const { isAdmin: canSeeTestVenues, isLoading: isLoadingAdmin } = useIsAdmin();
  const query = useQuery({
    queryKey: ["venue", slug],
    queryFn: () => getVenueBySlug(slug ?? ""),
    enabled: !isLoadingAuth && Boolean(slug),
  });

  const venue = query.data?.isTest && !canSeeTestVenues ? null : query.data ?? null;
  const error = query.error instanceof Error ? query.error.message : query.error ? "Could not load venue." : null;

  return { venue, isLoading: isLoadingAuth || isLoadingAdmin || (Boolean(slug) && query.isPending), error };
}
