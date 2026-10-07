import { Link } from "react-router-dom";
import { VenueGrid } from "@/components/venues/VenueGrid";
import { Button } from "@/components/ui/button";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import type { Venue } from "@/types/venue";

export function RecentlyViewedVenues({ venues }: { venues: Venue[] }) {
  const { recentlyViewedVenueIds } = useVenuePreferences();
  const recentlyViewedVenues = recentlyViewedVenueIds
    .map((id) => venues.find((venue) => venue.id === id))
    .filter((venue): venue is Venue => Boolean(venue));

  if (recentlyViewedVenues.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Recently viewed</p>
          <h2 className="text-3xl font-semibold">Pick up where you left off</h2>
        </div>
        <Button asChild variant="outline">
          <Link to="/discover">
            Discover more
          </Link>
        </Button>
      </div>
      <VenueGrid venues={recentlyViewedVenues} showCity />
    </section>
  );
}
