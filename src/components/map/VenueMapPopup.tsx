import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FavouriteButton } from "@/components/venues/FavouriteButton";
import { VenuePrice } from "@/components/venues/VenuePrice";
import { formatVenuePrimaryCategory } from "@/lib/venueCategoryLabels";
import { getVenueImage } from "@/lib/venueImages";
import type { Venue } from "@/types/venue";

/** A compact VenueCard: same tokens, type scale and meta line, sized for a map popup. */
export function VenueMapPopup({ venue }: { venue: Venue }) {
  return (
    <div className="w-[224px] p-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
        <Link to={`/venues/${venue.slug}`} className="block h-full">
          <img src={getVenueImage(venue)} alt={`${venue.name} interior`} className="h-full w-full object-cover" />
        </Link>
        {venue.rating ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-nokta-ink shadow-sm">
            <Star className="h-3 w-3 fill-clay-accent text-clay-accent" />
            {venue.rating}
          </span>
        ) : null}
        <FavouriteButton venueId={venue.id} venueName={venue.name} venue={venue} className="absolute right-2 top-2 h-8 w-8" />
      </div>

      <div className="px-1 pb-1 pt-2.5">
        <Link to={`/venues/${venue.slug}`} className="block">
          <h3 className="truncate text-[15px] font-semibold leading-5 text-nokta-ink">{venue.name}</h3>
          <p className="mt-0.5 truncate text-[13px] leading-5 text-nokta-ink-muted">
            {venue.area} · {formatVenuePrimaryCategory(venue.primaryCategory)}
          </p>
          <div className="mt-2 text-[13px] font-medium text-nokta-ink-muted">
            <VenuePrice level={venue.priceLevel} from={venue.priceFrom} />
          </div>
        </Link>

        <Button asChild className="mt-3 h-9 w-full rounded-lg bg-clay-accent text-[13px] font-semibold text-white hover:bg-clay-accent-hover">
          <Link to={`/venues/${venue.slug}`}>View venue</Link>
        </Button>
      </div>
    </div>
  );
}
