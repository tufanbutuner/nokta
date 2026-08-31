import { useEffect, useMemo, useState } from "react";
import { PromotedOfferCard } from "@/components/offers/PromotedOfferCard";
import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { getActiveHomepageOffers } from "@/services/promotedOfferService";
import type { PromotedOffer } from "@/types/promotedOffers";
import type { Venue } from "@/types/venue";

export function HomepageOffersSection({ venues }: { venues: Venue[] }) {
  const [offers, setOffers] = useState<PromotedOffer[]>([]);

  useEffect(() => {
    let cancelled = false;
    getActiveHomepageOffers()
      .then((nextOffers) => {
        if (!cancelled) setOffers(nextOffers);
      })
      .catch(() => {
        if (!cancelled) setOffers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const promoted = useMemo(() => joinOffersToVenues(offers, venues).slice(0, 3), [offers, venues]);

  useEffect(() => {
    promoted.forEach(({ offer, venue }) => trackOfferView(offer, venue, "homepage"));
  }, [promoted]);

  if (!promoted.length) return null;

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm text-clay-accent">Offers</p>
        <h2 className="mt-1 text-3xl font-semibold">Latest venue offers</h2>
        <p className="mt-2 text-sm text-muted-foreground">Promoted offers from venues on nokta.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {promoted.map(({ offer, venue }) => (
          <PromotedOfferCard key={offer.id} offer={offer} venue={venue} variant="homepage" onClick={() => trackOfferClick(offer, venue, "homepage")} />
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

function trackOfferView(offer: PromotedOffer, venue: Venue, surface: string) {
  trackEvent("promoted_offer_viewed", { offerId: offer.id, venueId: venue.id, offerType: offer.offerType, city: offer.city ?? venue.city, area: offer.area ?? venue.area, surface });
  trackVenueAnalyticsEvent({
    venueId: venue.id,
    eventName: "promoted_offer_viewed",
    city: offer.city ?? venue.city,
    area: offer.area ?? venue.area,
    sourceSurface: "homepage",
    offerId: offer.id,
    metadata: { offerType: offer.offerType },
  });
}

function trackOfferClick(offer: PromotedOffer, venue: Venue, surface: string) {
  trackEvent("promoted_offer_clicked", { offerId: offer.id, venueId: venue.id, offerType: offer.offerType, city: offer.city ?? venue.city, area: offer.area ?? venue.area, surface });
  trackVenueAnalyticsEvent({
    venueId: venue.id,
    eventName: "promoted_offer_clicked",
    city: offer.city ?? venue.city,
    area: offer.area ?? venue.area,
    sourceSurface: "homepage",
    offerId: offer.id,
    metadata: { offerType: offer.offerType },
  });
}
