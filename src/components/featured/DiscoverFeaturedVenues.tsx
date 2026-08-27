import { useEffect, useMemo, useState } from "react";
import { FeaturedVenueCard } from "@/components/featured/FeaturedVenueCard";
import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { getActiveDiscoverPlacements } from "@/services/featuredPlacementService";
import type { FeaturedPlacement } from "@/types/featuredPlacements";
import type { Venue } from "@/types/venue";

export function DiscoverFeaturedVenues({ city, area, venues }: { city?: string | null; area?: string | null; venues: Venue[] }) {
  const [placements, setPlacements] = useState<FeaturedPlacement[]>([]);

  useEffect(() => {
    let cancelled = false;
    getActiveDiscoverPlacements({ city, area })
      .then((nextPlacements) => {
        if (!cancelled) setPlacements(nextPlacements);
      })
      .catch(() => {
        if (!cancelled) setPlacements([]);
      });
    return () => {
      cancelled = true;
    };
  }, [area, city]);

  const featured = useMemo(() => joinPlacementsToVenues(placements, venues).slice(0, 2), [placements, venues]);

  useEffect(() => {
    featured.forEach(({ placement, venue }) => {
      trackEvent("featured_placement_viewed", {
        placementId: placement.id,
        venueId: venue.id,
        placementType: placement.placementType,
        city: placement.city ?? venue.city,
        area: placement.area ?? venue.area,
        surface: "discover",
      });
      trackVenueAnalyticsEvent({
        venueId: venue.id,
        eventName: "featured_placement_viewed",
        city: placement.city ?? venue.city,
        area: placement.area ?? venue.area,
        sourceSurface: "discover",
        placementId: placement.id,
        metadata: { placementType: placement.placementType },
      });
    });
  }, [featured]);

  if (!featured.length) return null;

  return (
    <section className="mb-3 rounded-xl border bg-purple-50/35 p-3">
      <div className="mb-3">
        <p className="text-sm font-semibold text-purple-950">Featured venues</p>
      </div>
      <div className="grid gap-3">
        {featured.map(({ placement, venue }) => (
          <FeaturedVenueCard key={placement.id} placement={placement} venue={venue} variant="discover" />
        ))}
      </div>
    </section>
  );
}

function joinPlacementsToVenues(placements: FeaturedPlacement[], venues: Venue[]) {
  const venuesById = new Map(venues.map((venue) => [venue.id, venue]));
  return placements.flatMap((placement) => {
    const venue = venuesById.get(placement.venueId);
    return venue ? [{ placement, venue }] : [];
  });
}
