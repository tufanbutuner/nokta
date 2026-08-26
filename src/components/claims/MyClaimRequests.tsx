import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import type { Venue } from "@/types/venue";
import type { VenueClaimRequest, VenueClaimRequestStatus } from "@/types/venueClaims";

const STATUS_LABELS: Record<VenueClaimRequestStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function MyClaimRequests({ claims, venuesById }: { claims: VenueClaimRequest[]; venuesById: Record<string, Venue | undefined> }) {
  if (!claims.length) {
    return <p className="text-sm text-muted-foreground">No venue claim requests yet.</p>;
  }

  return (
    <div className="space-y-3">
      {claims.map((claim) => {
        const venue = venuesById[claim.venueId];

        return (
          <div key={claim.id} className="rounded-lg border bg-background/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link to={venue ? `/venues/${venue.slug}` : "#"} className="font-medium hover:text-clay-accent">
                  {venue?.name ?? claim.venueId}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">Submitted {formatDate(claim.createdAt)}</p>
                {claim.reviewedAt ? <p className="mt-1 text-sm text-muted-foreground">Reviewed {formatDate(claim.reviewedAt)}</p> : null}
              </div>
              <Badge variant="outline">{STATUS_LABELS[claim.status]}</Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
