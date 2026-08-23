import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VenuePrice } from "@/components/venues/VenuePrice";
import { formatDistanceMiles, getVenueDistanceMiles } from "@/lib/location";
import { getVenueCurrentStatus } from "@/lib/openingHours";
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
        const distanceLabel = userLocation ? formatDistanceMiles(getVenueDistanceMiles(venue, userLocation)).replace(" away", "") : null;

        return (
          <Card
            key={venue.id}
            className={cn(
              "cursor-pointer overflow-hidden rounded-xl transition hover:border-clay-accent/40 hover:shadow-lg hover:shadow-stone-950/5",
              selected && "border-clay-accent shadow-lg shadow-clay-accent/10",
            )}
          >
            <div
              role="button"
              tabIndex={0}
              className="grid w-full cursor-pointer grid-cols-[88px_1fr] text-left"
              onClick={() => onSelectVenue(venue)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectVenue(venue);
                }
              }}
            >
              <img src={getVenueImage(venue)} alt={`${venue.name} interior`} className="h-full min-h-28 w-full object-cover" />
              <div className="min-w-0 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold">{venue.name}</h3>
                    <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="truncate text-sm text-muted-foreground">
                        {venue.area}
                        {distanceLabel ? <span> • {distanceLabel}</span> : null}
                      </p>
                      <CurrentStatusBadge status={getVenueCurrentStatus(venue)} />
                    </div>
                  </div>
                  {venue.rating ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-clay-accent text-clay-accent" />
                      {venue.rating}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <VenuePrice level={venue.priceLevel} from={venue.priceFrom} />
                </div>
                <div className="mt-3">
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

function CurrentStatusBadge({ status }: { status: ReturnType<typeof getVenueCurrentStatus> }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-medium",
        status === "open" && "bg-emerald-950/10 text-emerald-700",
        status === "closed" && "bg-red-950/10 text-red-700",
        status === "unknown" && "bg-foreground/5 text-muted-foreground",
      )}
    >
      {getCurrentStatusLabel(status)}
    </span>
  );
}

function getCurrentStatusLabel(status: ReturnType<typeof getVenueCurrentStatus>) {
  if (status === "open") {
    return "Open";
  }

  if (status === "closed") {
    return "Closed";
  }

  return "Hours TBC";
}
