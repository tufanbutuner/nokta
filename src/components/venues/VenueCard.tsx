import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { VenueBadge } from "@/components/venues/VenueBadge";
import { VenueDistance } from "@/components/venues/VenueDistance";
import { FavouriteButton } from "@/components/venues/FavouriteButton";
import { VenuePrice } from "@/components/venues/VenuePrice";
import { formatVenuePrimaryCategory } from "@/lib/venueCategoryLabels";
import { getVenueCurrentStatus } from "@/lib/openingHours";
import { VenueImage } from "@/components/venues/VenueImage";
import type { UserLocation } from "@/types/location";
import { Venue } from "@/types/venue";

/**
 * `showCity` adds the city to the location line. It is off by default because the city is
 * redundant while browsing one city, but a search spans the whole country and "Roath" alone
 * does not tell anyone the venue is in Cardiff.
 */
export function VenueCard({ venue, userLocation, showCity = false }: { venue: Venue; userLocation?: UserLocation | null; showCity?: boolean }) {
  const currentStatus = getVenueCurrentStatus(venue);
  const location = showCity && venue.city && venue.city !== venue.area ? `${venue.area}, ${venue.city}` : venue.area;

  return (
    <Card className="group rounded-2xl border-nokta-border bg-nokta-surface p-2 shadow-none transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-stone-950/5">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
        <Link to={`/venues/${venue.slug}`} className="block h-full">
          <VenueImage
            venue={venue}
            alt={`${venue.name} interior`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
        {venue.rating ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-nokta-ink shadow-sm">
            <Star className="h-3.5 w-3.5 fill-clay-accent text-clay-accent" />
            {venue.rating}
          </span>
        ) : null}
        <FavouriteButton venueId={venue.id} venueName={venue.name} venue={venue} className="absolute right-3 top-3 h-9 w-9" />
      </div>
      <CardContent className="space-y-3 px-2 pb-2 pt-3">
        <Link to={`/venues/${venue.slug}`} className="block">
          <div>
            <h3 className="truncate text-[15px] font-semibold leading-5 text-nokta-ink">{venue.name}</h3>
            <p className="mt-0.5 truncate text-[13px] font-normal leading-5 text-nokta-ink-muted">{location} · {formatVenuePrimaryCategory(venue.primaryCategory)}</p>
            <div className="mt-4 flex items-center justify-between gap-3 text-[13px] font-medium text-nokta-ink-muted">
              <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <VenuePrice level={venue.priceLevel} from={venue.priceFrom} />
              </span>
              <StatusPill status={currentStatus} />
            </div>
            <div className="mt-2 text-[13px] font-medium text-nokta-ink-muted">
              <VenueDistance venue={venue} userLocation={userLocation} />
            </div>
          </div>
        </Link>
        <div className="flex flex-wrap gap-1.5">
          {venue.vibes.slice(0, 3).map((vibe) => (
            <VenueBadge key={vibe} label={vibe} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusPill({ status }: { status: ReturnType<typeof getVenueCurrentStatus> }) {
  if (status === "open") {
    return <span className="rounded-full bg-nokta-accent-tint px-2.5 py-1 text-xs font-semibold text-nokta-accent-dark">Open</span>;
  }

  if (status === "closed") {
    return <span className="rounded-full bg-red-950/10 px-2.5 py-1 text-xs font-semibold text-red-700">Closed</span>;
  }

  return null;
}
