import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { VenueBadge } from "@/components/venues/VenueBadge";
import { VenueDistance } from "@/components/venues/VenueDistance";
import { FavouriteButton } from "@/components/venues/FavouriteButton";
import { VenuePrice } from "@/components/venues/VenuePrice";
import { getVenueImage } from "@/lib/venueImages";
import type { UserLocation } from "@/types/location";
import { Venue } from "@/types/venue";

export function VenueCard({ venue, userLocation }: { venue: Venue; userLocation?: UserLocation | null }) {
  return (
    <Card className="group overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-stone-950/5">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Link reloadDocument to={`/venues/${venue.slug}`} className="block h-full">
          <img
            src={getVenueImage(venue)}
            alt={`${venue.name} interior`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
        <FavouriteButton venueId={venue.id} venueName={venue.name} venue={venue} className="absolute right-3 top-3 h-9 w-9" />
      </div>
      <CardContent className="space-y-4">
        <Link reloadDocument to={`/venues/${venue.slug}`} className="block">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{venue.name}</h3>
                <p className="text-sm text-muted-foreground">{venue.area}</p>
              </div>
              {venue.rating ? (
                <span className="inline-flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-foreground" />
                  {venue.rating}
                </span>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <VenuePrice level={venue.priceLevel} from={venue.priceFrom} />
              <VenueDistance venue={venue} userLocation={userLocation} />
            </div>
          </div>
        </Link>
          <div className="flex flex-wrap gap-2">
            {venue.vibes.slice(0, 3).map((vibe) => (
              <VenueBadge key={vibe} label={vibe} />
            ))}
          </div>
      </CardContent>
    </Card>
  );
}
