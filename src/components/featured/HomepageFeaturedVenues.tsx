import { useEffect, useMemo, useState } from "react";
import { FeaturedVenueCard } from "@/components/featured/FeaturedVenueCard";
import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { getActiveHomepagePlacements } from "@/services/featuredPlacementService";
import type { FeaturedPlacement } from "@/types/featuredPlacements";
import type { Venue } from "@/types/venue";

export function HomepageFeaturedVenues({ venues }: { venues: Venue[] }) {
  const [placements, setPlacements] = useState<FeaturedPlacement[]>([]);

  useEffect(() => {
    let cancelled = false;
    getActiveHomepagePlacements()
      .then((nextPlacements) => {
        if (!cancelled) setPlacements(nextPlacements);
      })
      .catch(() => {
        if (!cancelled) setPlacements([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = useMemo(() => joinPlacementsToVenues(placements, venues).slice(0, 3), [placements, venues]);

  useEffect(() => {
    featured.forEach(({ placement, venue }) => {
      trackEvent("featured_placement_viewed", {
        placementId: placement.id,
        venueId: venue.id,
        placementType: placement.placementType,
        city: placement.city ?? venue.city,
        area: placement.area ?? venue.area,
        surface: "homepage",
      });
      trackVenueAnalyticsEvent({
        venueId: venue.id,
        eventName: "featured_placement_viewed",
        city: placement.city ?? venue.city,
        area: placement.area ?? venue.area,
        sourceSurface: "homepage",
        placementId: placement.id,
        metadata: { placementType: placement.placementType },
      });
    });
  }, [featured]);

  if (!featured.length) return null;

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm text-clay-accent">Featured</p>
        <h2 className="mt-1 text-3xl font-semibold">Featured venues</h2>
        <p className="mt-2 text-sm text-muted-foreground">Promoted venues from across Sheesha.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {featured.map(({ placement, venue }) => (
          <FeaturedVenueCard key={placement.id} placement={placement} venue={venue} variant="homepage" />
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
