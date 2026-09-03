import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDistanceMiles, getVenueDistanceMiles } from "@/lib/location";
import { getVenueCurrentStatus } from "@/lib/openingHours";
import { cn } from "@/lib/utils";
import { formatPriceLevel } from "@/lib/venueFilters";
import { getVenueImage } from "@/lib/venueImages";
import { Link } from "react-router-dom";
import type { UserLocation } from "@/types/location";
import type { VenueRatingSummary } from "@/types/reviews";
import type { Venue } from "@/types/venue";

export function VenueMapResultList({
  venues,
  selectedVenueId,
  userLocation,
  reviewSummaries = {},
  onSelectVenue,
}: {
  venues: Venue[];
  selectedVenueId?: string;
  userLocation?: UserLocation | null;
  reviewSummaries?: Record<string, VenueRatingSummary>;
  onSelectVenue: (venue: Venue) => void;
}) {
  return (
    <div className="space-y-2">
      {venues.map((venue) => {
        const selected = venue.id === selectedVenueId;
        const distanceLabel = userLocation ? formatDistanceMiles(getVenueDistanceMiles(venue, userLocation)).replace(" away", "") : null;
        const reviewSummary = reviewSummaries[venue.id];
        const rating = reviewSummary?.averageRating ?? venue.rating ?? null;

        return (
          <Card
            key={venue.id}
            className={cn(
              "cursor-pointer rounded-xl border-nokta-border bg-white p-2 shadow-none ring-1 ring-transparent transition hover:border-nokta-ink/25 hover:ring-nokta-ink/10",
              selected && "border-nokta-ink ring-nokta-ink/15",
            )}
          >
            <div
              role="button"
              tabIndex={0}
              className="grid w-full cursor-pointer grid-cols-[88px_minmax(0,1fr)] gap-3 text-left"
              onClick={() => onSelectVenue(venue)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectVenue(venue);
                }
              }}
            >
              <img src={getVenueImage(venue)} alt={`${venue.name} interior`} className="h-[72px] w-[88px] rounded-lg object-cover" />
              <div className="min-w-0">
                <Link to={`/venues/${venue.slug}`} className="block truncate text-sm font-semibold leading-5 text-nokta-ink hover:text-nokta-accent" onClick={(event) => event.stopPropagation()}>
                  {venue.name}
                </Link>
                <p className="mt-0.5 truncate text-xs leading-4 text-nokta-ink-muted">
                  {venue.area}
                  {distanceLabel ? <span> • {distanceLabel}</span> : null}
                  <span> • {formatPriceLevel(venue.priceLevel)}</span>
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {rating ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-nokta-ink">
                      <Star className="h-3 w-3 fill-nokta-ink text-nokta-ink" />
                      {rating}
                    </span>
                  ) : null}
                  <CurrentStatusBadge status={getVenueCurrentStatus(venue)} />
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
        "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-semibold",
        status === "open" && "bg-nokta-accent-tint text-nokta-accent-dark",
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
