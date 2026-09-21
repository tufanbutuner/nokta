import { Link } from "react-router-dom";
import { FeaturedBadge } from "@/components/featured/FeaturedBadge";
import { VenuePrice } from "@/components/venues/VenuePrice";
import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { getVenueCurrentStatus } from "@/lib/openingHours";
import { formatVenuePrimaryCategory } from "@/lib/venueCategoryLabels";
import { Star } from "lucide-react";
import type { FeaturedPlacement } from "@/types/featuredPlacements";
import type { Venue } from "@/types/venue";
import { VenueImage } from "@/components/venues/VenueImage";

export function FeaturedVenueCard({
  venue,
  placement,
  variant = "homepage",
}: {
  venue: Venue;
  placement: FeaturedPlacement;
  variant?: "homepage" | "discover" | "city";
}) {
  const currentStatus = getVenueCurrentStatus(venue);

  function handleClick() {
    trackEvent("featured_placement_clicked", {
      placementId: placement.id,
      venueId: venue.id,
      placementType: placement.placementType,
      city: placement.city ?? venue.city,
      area: placement.area ?? venue.area,
      surface: variant,
    });
    trackVenueAnalyticsEvent({
      venueId: venue.id,
      eventName: "featured_placement_clicked",
      city: placement.city ?? venue.city,
      area: placement.area ?? venue.area,
      sourceSurface: getSourceSurface(variant),
      placementId: placement.id,
      metadata: { placementType: placement.placementType },
    });
  }

  return (
    <Link
      to={`/venues/${venue.slug}`}
      onClick={handleClick}
      className="group block rounded-2xl border border-nokta-border bg-nokta-surface p-2 shadow-none transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-stone-950/5"
    >
      <div className="relative h-40 overflow-hidden rounded-xl bg-muted">
        <VenueImage venue={venue} alt={`${venue.name} interior`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {venue.rating ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-nokta-ink shadow-sm">
            <Star className="h-3.5 w-3.5 fill-clay-accent text-clay-accent" />
            {venue.rating}
          </span>
        ) : null}
        <FeaturedBadge className="absolute right-3 top-3 bg-purple-50/95 backdrop-blur" />
      </div>
      <div className="px-2 pb-2 pt-3">
        <h3 className="truncate text-[15px] font-semibold leading-5 text-nokta-ink">{placement.title ?? venue.name}</h3>
        <p className="mt-0.5 truncate text-[13px] leading-5 text-nokta-ink-muted">{venue.area} · {formatVenuePrimaryCategory(venue.primaryCategory)}</p>
        {placement.description ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{placement.description}</p> : null}
        <div className="mt-4 flex items-center justify-between gap-3 text-[13px] font-medium text-nokta-ink-muted">
          <VenuePrice level={venue.priceLevel} from={venue.priceFrom} />
          <StatusPill status={currentStatus} />
        </div>
      </div>
    </Link>
  );
}

function StatusPill({ status }: { status: ReturnType<typeof getVenueCurrentStatus> }) {
  if (status === "open") return <span className="rounded-full bg-nokta-accent-tint px-2.5 py-1 text-xs font-semibold text-nokta-accent-dark">Open</span>;
  if (status === "closed") return <span className="rounded-full bg-red-950/10 px-2.5 py-1 text-xs font-semibold text-red-700">Closed</span>;
  return <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Hours TBC</span>;
}

function getSourceSurface(variant: "homepage" | "discover" | "city") {
  if (variant === "city") return "city_page";
  if (variant === "discover") return "discover";
  return "homepage";
}
