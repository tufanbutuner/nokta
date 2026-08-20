import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VenueDistance } from "@/components/venues/VenueDistance";
import { VenuePrice } from "@/components/venues/VenuePrice";
import { cn } from "@/lib/utils";
import { getVenueImage } from "@/lib/venueImages";
import type { UserLocation } from "@/types/location";
import type { Venue } from "@/types/venue";

export function VenueMapResultList({
  venues,
  selectedVenueId,
  userLocation,
  onSelectVenue,
}: {
  venues: Venue[];
  selectedVenueId?: string;
  userLocation?: UserLocation | null;
  onSelectVenue: (venue: Venue) => void;
}) {
  return (
    <div className="space-y-3">
      {venues.map((venue) => {
        const selected = venue.id === selectedVenueId;

        return (
          <Card
            key={venue.id}
            className={cn(
              "cursor-pointer overflow-hidden transition hover:border-foreground/30 hover:shadow-lg hover:shadow-stone-950/5",
              selected && "border-foreground shadow-lg shadow-stone-950/5",
            )}
          >
            <div
              role="button"
              tabIndex={0}
              className="grid w-full cursor-pointer grid-cols-[104px_1fr] text-left"
              onClick={() => onSelectVenue(venue)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectVenue(venue);
                }
              }}
            >
              <img src={getVenueImage(venue)} alt={`${venue.name} interior`} className="h-full min-h-32 w-full object-cover" />
              <div className="min-w-0 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold">{venue.name}</h3>
                    <p className="text-sm text-muted-foreground">{venue.area}</p>
                  </div>
                  {venue.rating ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-foreground" />
                      {venue.rating}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <VenuePrice level={venue.priceLevel} from={venue.priceFrom} />
                  <VenueDistance venue={venue} userLocation={userLocation} />
                </div>
                <div className="mt-4">
                  <Button asChild size="sm" variant="outline" onClick={(event) => event.stopPropagation()}>
                    <a href={`/venues/${venue.slug}`}>View venue</a>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
