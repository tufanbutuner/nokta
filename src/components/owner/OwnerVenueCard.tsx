import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ClaimedVenueBadge } from "@/components/venues/ClaimedVenueBadge";
import { Button } from "@/components/ui/button";
import type { OwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";
import type { OwnerVenueCommercialSummary } from "@/services/ownerCommercialSummaryService";
import type { OwnerVenueEnquirySummary } from "@/services/ownerVenueEnquirySummaryService";
import type { Venue } from "@/types/venue";

export function OwnerVenueCard({ venue, analytics, enquiries, commercial }: { venue: Venue; analytics?: OwnerVenueAnalyticsSummary; enquiries?: OwnerVenueEnquirySummary; commercial?: OwnerVenueCommercialSummary }) {
  return (
    <article className="rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold">{venue.name}</h3>
            <ClaimedVenueBadge compact />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{venue.city} · {venue.area}</p>
          <p className="mt-2 text-xs text-muted-foreground">Partner tier: {venue.partnerTier}</p>
        </div>
        <Button asChild>
          <Link to={`/owner/venues/${venue.id}`}>View dashboard<ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <MiniMetric label="Profile views" value={analytics?.profileViews ?? 0} />
        <MiniMetric label="Enquiries" value={enquiries?.totalEnquiries ?? 0} />
        <MiniMetric label="Active offers" value={commercial?.activePromotedOffers ?? 0} />
        <MiniMetric label="Featured" value={commercial?.activeFeaturedPlacements ?? 0} />
      </div>
      <Button asChild variant="outline" className="mt-4">
        <Link to={`/venues/${venue.slug}`}>View public page</Link>
      </Button>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border bg-background/60 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>;
}
