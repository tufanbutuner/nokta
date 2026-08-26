import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { Venue } from "@/types/venue";
import type { VenueClaimRequest } from "@/types/venueClaims";

export type ClaimAction = "approve" | "reject" | "notes";

export function AdminClaimActions({
  claim,
  venue,
  disabled,
  onAction,
}: {
  claim: VenueClaimRequest;
  venue?: Venue;
  disabled: boolean;
  onAction: (action: ClaimAction, claim: VenueClaimRequest) => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {claim.status === "pending" ? (
        <>
          <Button size="sm" disabled={disabled} onClick={() => onAction("approve", claim)}>
            Approve
          </Button>
          <Button size="sm" variant="outline" disabled={disabled} onClick={() => onAction("reject", claim)}>
            Reject
          </Button>
        </>
      ) : null}
      <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onAction("notes", claim)}>
        Edit notes
      </Button>
      {venue ? (
        <>
          <Button asChild size="sm" variant="ghost">
            <Link to={`/venues/${venue.slug}`}>View venue</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={`/admin/venues/${venue.id}/edit`}>Edit venue</Link>
          </Button>
        </>
      ) : null}
    </div>
  );
}
