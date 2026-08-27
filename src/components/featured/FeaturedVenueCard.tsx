import { Link } from "react-router-dom";
import { FeaturedBadge } from "@/components/featured/FeaturedBadge";
import { VenuePrice } from "@/components/venues/VenuePrice";
import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { getVenueImage } from "@/lib/venueImages";
import type { FeaturedPlacement } from "@/types/featuredPlacements";
import type { Venue } from "@/types/venue";

export function FeaturedVenueCard({
  venue,
  placement,
  variant = "homepage",
}: {
  venue: Venue;
  placement: FeaturedPlacement;
  variant?: "homepage" | "discover" | "city";
}) {
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
      reloadDocument
      to={`/venues/${venue.slug}`}
      onClick={handleClick}
      className="group block overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-stone-950/5"
    >
      <div className="relative h-40 overflow-hidden bg-muted">
        <img src={getVenueImage(venue)} alt={`${venue.name} interior`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <FeaturedBadge className="absolute left-3 top-3 bg-purple-50/95 backdrop-blur" />
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold">{placement.title ?? venue.name}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{venue.area} · {venue.city}</p>
        {placement.description ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{placement.description}</p> : null}
        <div className="mt-4 text-sm text-muted-foreground">
          <VenuePrice level={venue.priceLevel} from={venue.priceFrom} />
        </div>
      </div>
    </Link>
  );
}

function getSourceSurface(variant: "homepage" | "discover" | "city") {
  if (variant === "city") return "city_page";
  if (variant === "discover") return "discover";
  return "homepage";
}
