import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClaimedVenueBadge } from "@/components/venues/ClaimedVenueBadge";
import { formatPriceLevel } from "@/lib/venueFilters";
import type { OwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";
import type { OwnerVenueCommercialSummary } from "@/services/ownerCommercialSummaryService";
import type { OwnerVenueEnquirySummary } from "@/services/ownerVenueEnquirySummaryService";
import type { Venue } from "@/types/venue";

export function OwnerVenueHeader({ venue }: { venue: Venue }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm text-clay-accent">Owner dashboard</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="font-brand text-4xl font-bold tracking-[-0.5px]">{venue.name} dashboard</h1>
          <ClaimedVenueBadge compact />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{venue.city} · {venue.area} · {venue.verificationStatus} · {venue.businessStatus}</p>
      </div>
      <Button asChild variant="outline"><Link to={`/venues/${venue.slug}`}>View public page</Link></Button>
    </div>
  );
}

export function OwnerVenueStatusCards({ venue }: { venue: Venue }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Claimed status" value={venue.isClaimed ? "Claimed" : "Not claimed"} />
      <Metric label="Verification" value={venue.verificationStatus} />
      <Metric label="Partner tier" value={venue.partnerTier} />
      <Metric label="Profile health" value={getProfileHealth(venue)} />
    </div>
  );
}

export function OwnerVenueAnalyticsCards({ analytics }: { analytics: OwnerVenueAnalyticsSummary }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="text-xl font-semibold">Performance</h2>
      <p className="mt-1 text-sm text-muted-foreground">These numbers show activity from Sheesha over the selected period.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Profile views" value={analytics.profileViews} />
        <Metric label="Directions clicks" value={analytics.directionsClicks} />
        <Metric label="Website clicks" value={analytics.websiteClicks} />
        <Metric label="Instagram clicks" value={analytics.instagramClicks} />
        <Metric label="Saves" value={analytics.saves} />
        <Metric label="Enquiries" value={analytics.enquirySubmissions} />
        <Metric label="Featured clicks" value={analytics.featuredClicks} />
        <Metric label="Offer clicks" value={analytics.offerClicks} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Directions rate" value={`${analytics.directionsClickRate}%`} />
        <Metric label="Enquiry conversion" value={`${analytics.enquiryConversionRate}%`} />
        <Metric label="Offer click rate" value={`${analytics.offerClickRate}%`} />
      </div>
    </section>
  );
}

export function OwnerVenueEnquirySummary({ enquiries }: { enquiries: OwnerVenueEnquirySummary }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="text-xl font-semibold">Enquiries</h2>
      <p className="mt-1 text-sm text-muted-foreground">Enquiry details and direct replies are coming soon. For now, this summary shows enquiry activity for your venue.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Total" value={enquiries.totalEnquiries} />
        <Metric label="New" value={enquiries.newEnquiries} />
        <Metric label="Contacted" value={enquiries.contactedEnquiries} />
        <Metric label="Responded" value={enquiries.respondedEnquiries} />
        <Metric label="Converted" value={enquiries.convertedEnquiries} />
        <Metric label="Closed" value={enquiries.closedEnquiries} />
      </div>
    </section>
  );
}

export function OwnerVenueCommercialSummary({ commercial }: { commercial: OwnerVenueCommercialSummary }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="text-xl font-semibold">Commercial status</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Partner tier" value={commercial.partnerTier} />
        <Metric label="Monetisation" value={commercial.monetisationStatus} />
        <Metric label="Active featured" value={commercial.activeFeaturedPlacements} />
        <Metric label="Active offers" value={commercial.activePromotedOffers} />
      </div>
      {!commercial.hasActiveFeaturedPlacement ? <p className="mt-4 text-sm text-muted-foreground">You do not currently have any active featured placements.</p> : null}
      {!commercial.hasActivePromotedOffer ? <p className="mt-2 text-sm text-muted-foreground">You do not currently have any active promoted offers.</p> : null}
      <Button asChild variant="outline" className="mt-5"><Link to="/account">Contact Sheesha about promotion</Link></Button>
    </section>
  );
}

export function OwnerVenueProfilePreview({ venue }: { venue: Venue }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="text-xl font-semibold">Profile preview</h2>
      <p className="mt-1 text-sm text-muted-foreground">Profile editing is coming soon. Contact Sheesha if something needs changing.</p>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <Detail label="Address" value={`${venue.address}, ${venue.postcode}`} />
        <Detail label="City / area" value={`${venue.city} · ${venue.area}`} />
        <Detail label="Phone" value={venue.phone ?? "Not listed"} />
        <Detail label="Website" value={venue.website ?? "Not listed"} />
        <Detail label="Instagram" value={venue.instagram ?? "Not listed"} />
        <Detail label="Price" value={venue.priceFrom ? `From £${venue.priceFrom} · ${formatPriceLevel(venue.priceLevel)}` : formatPriceLevel(venue.priceLevel)} />
        <Detail label="Features" value={[venue.food && "Food", venue.indoor && "Indoor", venue.outdoor && "Outdoor", venue.alcohol && "Alcohol", venue.openLate && "Open late"].filter(Boolean).join(", ") || "Not listed"} />
        <Detail label="Vibes" value={venue.vibes.join(", ")} />
      </dl>
      <Button asChild variant="outline" className="mt-5"><Link to="/account">Request a profile update</Link></Button>
    </section>
  );
}

export function OwnerNextStepsCard({ venue, commercial, enquiries }: { venue: Venue; commercial: OwnerVenueCommercialSummary; enquiries: OwnerVenueEnquirySummary }) {
  const steps = [
    !venue.website && "Add an official website link",
    !commercial.hasActivePromotedOffer && "Create a promoted offer",
    !commercial.hasActiveFeaturedPlacement && "Promote your venue in your city",
    enquiries.totalEnquiries === 0 && "Improve your profile and add more photos",
  ].filter(Boolean);

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="text-xl font-semibold">Next steps</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        {(steps.length ? steps : ["Your profile is in good shape."]).map((step) => <li key={String(step)}>{step}</li>)}
      </ul>
      <Button asChild variant="outline" className="mt-5"><Link to="/account">Contact Sheesha</Link></Button>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border bg-background/60 p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold capitalize">{value}</p></div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>;
}

function getProfileHealth(venue: Venue) {
  if (!venue.website || !venue.phone || !venue.images.length) return "Needs attention";
  if (venue.verificationStatus === "unverified") return "Incomplete";
  return "Good";
}
