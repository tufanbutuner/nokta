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
  const { isAdmin: canSeeHiddenVenues, isLoading: isLoadingAdmin } = useIsAdmin();
  const query = useQuery({
    queryKey: ["venue", slug],
    queryFn: () => getVenueBySlug(slug ?? ""),
    enabled: !isLoadingAuth && Boolean(slug),
  });

  // Permanently-closed venues are kept in the database for reference, but showing
  // one to a user is misleading: the listing implies somewhere they can still go.
  // Admins keep seeing them so the records stay manageable.
  const isHiddenFromUsers = query.data?.isTest || query.data?.businessStatus === "permanently-closed";
  const venue = isHiddenFromUsers && !canSeeHiddenVenues ? null : query.data ?? null;
  const error = query.error instanceof Error ? query.error.message : query.error ? "Could not load venue." : null;

  return { venue, isLoading: isLoadingAuth || isLoadingAdmin || (Boolean(slug) && query.isPending), error };
}
