import { useQuery } from "@tanstack/react-query";
import { getVenueBookingGate } from "@/services/bookingAvailabilityService";
import type { VenueBookingGate } from "@/types/bookingAvailability";
import type { Venue } from "@/types/venue";

export function useVenueBookingGate(venue?: Venue | null) {
  const unclaimedGate: VenueBookingGate | null = venue && !venue.isClaimed ? { venueId: venue.id, isClaimed: false, bookingRequestsEnabled: false, responsive: false, state: "unclaimed" } : null;
  const query = useQuery({
    queryKey: ["venue-booking-gate", venue?.id],
    queryFn: () => getVenueBookingGate(venue?.id ?? ""),
    enabled: Boolean(venue?.id && venue.isClaimed),
  });
  return {
    gate: unclaimedGate ?? query.data ?? null,
    isLoading: Boolean(venue?.isClaimed) && query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
  };
}
