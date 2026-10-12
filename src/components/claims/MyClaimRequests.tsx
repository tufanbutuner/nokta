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
    <ul className="divide-y divide-nokta-divider">
      {claims.map((claim) => {
        const venue = venuesById[claim.venueId];

        return (
          <li key={claim.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div className="min-w-0">
              {venue ? (
                <Link to={`/venues/${venue.slug}`} className="font-semibold text-nokta-ink underline-offset-4 hover:underline">
                  {venue.name}
                </Link>
              ) : (
                <p className="font-semibold text-nokta-ink">Venue no longer listed</p>
              )}
              <p className="mt-1 text-sm text-nokta-ink-muted">
                Submitted {formatDate(claim.createdAt)}
                {claim.reviewedAt ? ` · Reviewed ${formatDate(claim.reviewedAt)}` : ""}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0">{STATUS_LABELS[claim.status]}</Badge>
          </li>
        );
      })}
    </ul>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
