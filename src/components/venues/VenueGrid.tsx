import { VenueCard } from "@/components/venues/VenueCard";
import { Venue } from "@/types/venue";

export function VenueGrid({ venues }: { venues: Venue[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {venues.map((venue) => (
        <VenueCard key={venue.id} venue={venue} />
      ))}
    </div>
  );
}
