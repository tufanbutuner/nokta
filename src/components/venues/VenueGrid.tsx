import { VenueCard } from "@/components/venues/VenueCard";
import type { UserLocation } from "@/types/location";
import { Venue } from "@/types/venue";

export function VenueGrid({ venues, userLocation, showCity = false }: { venues: Venue[]; userLocation?: UserLocation | null; showCity?: boolean }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {venues.map((venue) => (
        <VenueCard key={venue.id} venue={venue} userLocation={userLocation} showCity={showCity} />
      ))}
    </div>
  );
}
