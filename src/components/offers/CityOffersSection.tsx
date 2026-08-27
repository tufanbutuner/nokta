import { useEffect, useMemo, useState } from "react";
import { PromotedOfferCard } from "@/components/offers/PromotedOfferCard";
import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { getActiveCityOffers } from "@/services/promotedOfferService";
import type { PromotedOffer } from "@/types/promotedOffers";
import type { Venue } from "@/types/venue";

export function CityOffersSection({ city, venues }: { city: string; venues: Venue[] }) {
  const [offers, setOffers] = useState<PromotedOffer[]>([]);

  useEffect(() => {
    let cancelled = false;
    getActiveCityOffers(city)
      .then((nextOffers) => {
        if (!cancelled) setOffers(nextOffers);
      })
      .catch(() => {
        if (!cancelled) setOffers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [city]);

  const promoted = useMemo(() => joinOffersToVenues(offers, venues).slice(0, 6), [offers, venues]);

  useEffect(() => {
    promoted.forEach(({ offer, venue }) => {
      trackEvent("promoted_offer_viewed", { offerId: offer.id, venueId: venue.id, offerType: offer.offerType, city, area: offer.area ?? venue.area, surface: "city" });
      trackVenueAnalyticsEvent({
        venueId: venue.id,
        eventName: "promoted_offer_viewed",
        city,
        area: offer.area ?? venue.area,
        sourceSurface: "city_page",
        offerId: offer.id,
        metadata: { offerType: offer.offerType },
      });
    });
  }, [city, promoted]);

  if (!promoted.length) return null;

  return (
    <section className="mb-8">
      <div className="mb-4">
        <p className="text-sm text-clay-accent">Offers</p>
        <h2 className="mt-1 text-2xl font-semibold">Offers in {city}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {promoted.map(({ offer, venue }) => (
          <PromotedOfferCard
            key={offer.id}
            offer={offer}
            venue={venue}
            variant="city"
            onClick={() => {
              trackEvent("promoted_offer_clicked", { offerId: offer.id, venueId: venue.id, offerType: offer.offerType, city, area: offer.area ?? venue.area, surface: "city" });
              trackVenueAnalyticsEvent({ venueId: venue.id, eventName: "promoted_offer_clicked", city, area: offer.area ?? venue.area, sourceSurface: "city_page", offerId: offer.id, metadata: { offerType: offer.offerType } });
            }}
          />
        ))}
      </div>
    </section>
  );
}

function joinOffersToVenues(offers: PromotedOffer[], venues: Venue[]) {
  const venuesById = new Map(venues.map((venue) => [venue.id, venue]));
  return offers.flatMap((offer) => {
    const venue = venuesById.get(offer.venueId);
    return venue ? [{ offer, venue }] : [];
  });
}
