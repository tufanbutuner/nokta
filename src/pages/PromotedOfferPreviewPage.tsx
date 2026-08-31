import { PageContainer } from "@/components/layout/PageContainer";
import { PromotedOfferCard } from "@/components/offers/PromotedOfferCard";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { venues } from "@/data/venues";
import type { PromotedOffer } from "@/types/promotedOffers";
import { Link } from "react-router-dom";

const previewVenue = venues[0];

const previewOffers: PromotedOffer[] = [
  {
    id: "preview-birthday",
    venueId: previewVenue.id,
    title: "Birthday table package",
    description: "Reserved table, dessert platter and mocktail bundle for groups celebrating at the venue.",
    terms: "Subject to venue availability. Advance enquiry required.",
    offerType: "birthday",
    city: previewVenue.city,
    area: previewVenue.area,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    priority: 10,
    ctaLabel: "Enquire now",
    ctaUrl: null,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "preview-football",
    venueId: previewVenue.id,
    title: "Football night table package",
    description: "Group table package for selected match nights with food and soft drink options.",
    terms: "Minimum party size may apply. Confirm details directly with the venue.",
    offerType: "football",
    city: "London",
    area: null,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    priority: 6,
    ctaLabel: "View venue",
    ctaUrl: null,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "preview-student",
    venueId: previewVenue.id,
    title: "Student night package",
    description: "Weeknight package for student groups with table reservation and food bundle options.",
    terms: "Valid student ID required. Venue may change availability by date.",
    offerType: "student",
    city: "London",
    area: "Marylebone",
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    priority: 4,
    ctaLabel: "View offer",
    ctaUrl: "https://example.com",
    createdBy: null,
    updatedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function PromotedOfferPreviewPage() {
  return (
    <main>
      <PageMeta title="Promoted Offer Preview | nokta" description="Preview promoted offer cards." />
      <PageContainer className="space-y-10 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-clay-accent">Preview</p>
            <h1 className="mt-1 text-4xl font-semibold">Promoted offers</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Example cards using safe promoted-offer wording.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/admin/offers">Open admin offers</Link>
          </Button>
        </div>

        <section>
          <div className="mb-4">
            <p className="text-sm text-clay-accent">Homepage / city layout</p>
            <h2 className="mt-1 text-2xl font-semibold">Latest venue offers</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {previewOffers.map((offer) => (
              <PromotedOfferCard key={offer.id} offer={offer} venue={previewVenue} variant="homepage" />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <p className="text-sm text-clay-accent">Venue page layout</p>
            <h2 className="mt-1 text-2xl font-semibold">Current offers</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {previewOffers.slice(0, 2).map((offer) => (
              <PromotedOfferCard key={`${offer.id}-venue`} offer={offer} venue={previewVenue} variant="venue" />
            ))}
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
