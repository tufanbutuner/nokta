import { useEffect, useMemo, useState } from "react";
import { FeaturedVenueCard } from "@/components/featured/FeaturedVenueCard";
import { trackEvent } from "@/lib/analytics";
import { getActiveCityPlacements } from "@/services/featuredPlacementService";
import type { FeaturedPlacement } from "@/types/featuredPlacements";
import type { Venue } from "@/types/venue";

export function CityFeaturedVenues({ city, venues }: { city: string; venues: Venue[] }) {
  const [placements, setPlacements] = useState<FeaturedPlacement[]>([]);

  useEffect(() => {
    let cancelled = false;
    getActiveCityPlacements(city)
      .then((nextPlacements) => {
        if (!cancelled) setPlacements(nextPlacements);
      })
      .catch(() => {
        if (!cancelled) setPlacements([]);
      });
    return () => {
      cancelled = true;
    };
  }, [city]);

  const featured = useMemo(() => joinPlacementsToVenues(placements, venues).slice(0, 3), [placements, venues]);

  useEffect(() => {
    featured.forEach(({ placement, venue }) => {
      trackEvent("featured_placement_viewed", {
        placementId: placement.id,
        venueId: venue.id,
        placementType: placement.placementType,
        city,
        area: placement.area ?? venue.area,
        surface: "city",
      });
    });
  }, [city, featured]);

  if (!featured.length) return null;

  return (
    <section className="mb-8">
      <div className="mb-4">
        <p className="text-sm text-clay-accent">Featured</p>
        <h2 className="mt-1 text-2xl font-semibold">Featured in {city}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {featured.map(({ placement, venue }) => (
          <FeaturedVenueCard key={placement.id} placement={placement} venue={venue} variant="city" />
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
