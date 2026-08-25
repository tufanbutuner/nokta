import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FavouriteButton } from "@/components/venues/FavouriteButton";
import { formatPriceLevel } from "@/lib/venueFilters";
import type { Venue } from "@/types/venue";

export function VenueMapPopup({ venue }: { venue: Venue }) {
  return (
    <div className="min-w-44 space-y-3 p-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{venue.name}</h3>
          <p className="text-sm text-muted-foreground">{venue.area}</p>
        </div>
        <FavouriteButton venueId={venue.id} venueName={venue.name} venue={venue} className="h-8 w-8 border" />
      </div>
      <p className="text-sm text-muted-foreground">
        {formatPriceLevel(venue.priceLevel)}
        {venue.rating ? ` · ★ ${venue.rating}` : null}
      </p>
      <Button asChild size="sm" className="w-full">
        <Link reloadDocument to={`/venues/${venue.slug}`}>
          View venue
        </Link>
      </Button>
    </div>
  );
}
