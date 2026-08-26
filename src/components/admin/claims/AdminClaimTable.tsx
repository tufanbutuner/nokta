import { AdminClaimActions, type ClaimAction } from "@/components/admin/claims/AdminClaimActions";
import { ClaimStatusBadge } from "@/components/admin/claims/ClaimStatusBadge";
import type { Venue } from "@/types/venue";
import type { VenueClaimRequest } from "@/types/venueClaims";

export function AdminClaimTable({
  claims,
  venuesById,
  pendingClaimId,
  onAction,
}: {
  claims: VenueClaimRequest[];
  venuesById: Record<string, Venue | undefined>;
  pendingClaimId: string | null;
  onAction: (action: ClaimAction, claim: VenueClaimRequest) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Venue</th>
              <th className="px-4 py-3 font-medium">Claimant</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">Reviewed</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {claims.map((claim) => {
              const venue = venuesById[claim.venueId];

              return (
                <tr key={claim.id}>
                  <td className="px-4 py-4">
                    <div className="font-medium">{venue?.name ?? claim.venueId}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{venue ? `${venue.city} · ${venue.area}` : claim.venueId}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium">{claim.claimantName}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{claim.claimantEmail}</div>
                    {claim.claimantPhone ? <div className="mt-1 text-xs text-muted-foreground">{claim.claimantPhone}</div> : null}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{formatRole(claim.claimantRole)}</td>
                  <td className="px-4 py-4">
                    <ClaimStatusBadge status={claim.status} />
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{formatDate(claim.createdAt)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{claim.reviewedAt ? formatDate(claim.reviewedAt) : "Not reviewed"}</td>
                  <td className="px-4 py-4 text-right">
                    <AdminClaimActions claim={claim} venue={venue} disabled={pendingClaimId === claim.id} onAction={onAction} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatRole(role: string) {
  if (role === "marketing") return "Marketing / agency";
  return `${role[0]?.toUpperCase()}${role.slice(1)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
