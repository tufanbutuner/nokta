import { useEffect, useState } from "react";
import { PromotedOfferCard } from "@/components/offers/PromotedOfferCard";
import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { getActiveVenueOffers } from "@/services/promotedOfferService";
import type { PromotedOffer } from "@/types/promotedOffers";
import type { Venue } from "@/types/venue";

export function VenueOffersSection({ venue }: { venue: Venue }) {
  const [offers, setOffers] = useState<PromotedOffer[]>([]);

  useEffect(() => {
    let cancelled = false;
    getActiveVenueOffers(venue.id)
      .then((nextOffers) => {
        if (!cancelled) setOffers(nextOffers);
      })
      .catch(() => {
        if (!cancelled) setOffers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [venue.id]);

  useEffect(() => {
    offers.forEach((offer) => {
      trackEvent("promoted_offer_viewed", { offerId: offer.id, venueId: venue.id, offerType: offer.offerType, city: offer.city ?? venue.city, area: offer.area ?? venue.area, surface: "venue" });
      trackVenueAnalyticsEvent({
        venueId: venue.id,
        eventName: "promoted_offer_viewed",
        city: offer.city ?? venue.city,
        area: offer.area ?? venue.area,
        sourceSurface: "venue_page",
        offerId: offer.id,
        metadata: { offerType: offer.offerType },
      });
    });
  }, [offers, venue]);

  if (!offers.length) return null;

  return (
    <section className="mt-6">
      <div className="mb-4">
        <p className="text-sm text-clay-accent">Offers</p>
        <h2 className="mt-1 text-2xl font-semibold">Current offers</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <PromotedOfferCard
            key={offer.id}
            offer={offer}
            venue={venue}
            variant="venue"
            onClick={() => {
              trackEvent("promoted_offer_clicked", { offerId: offer.id, venueId: venue.id, offerType: offer.offerType, city: offer.city ?? venue.city, area: offer.area ?? venue.area, surface: "venue" });
              trackVenueAnalyticsEvent({ venueId: venue.id, eventName: "promoted_offer_clicked", city: offer.city ?? venue.city, area: offer.area ?? venue.area, sourceSurface: "venue_page", offerId: offer.id, metadata: { offerType: offer.offerType } });
            }}
          />
        ))}
      </div>
    </section>
  );
}
