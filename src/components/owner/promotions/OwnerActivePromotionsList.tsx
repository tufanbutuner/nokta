import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { OwnerVenueCommercialSummary } from "@/services/ownerCommercialSummaryService";
import type { Venue } from "@/types/venue";

export function OwnerActivePromotionsList({ venues, commercialByVenueId }: { venues: Venue[]; commercialByVenueId: Record<string, OwnerVenueCommercialSummary> }) {
  return (
    <div className="grid gap-3">
      {venues.map((venue) => {
        const commercial = commercialByVenueId[venue.id];
        return (
          <div key={venue.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-medium">{venue.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{venue.city} · {venue.area}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{commercial?.activePromotedOffers ?? 0} active offers</span>
              <span>{commercial?.activeFeaturedPlacements ?? 0} featured placements</span>
              <Button asChild size="sm" variant="outline"><Link to={`/owner/venues/${venue.slug}`}>Open venue</Link></Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
