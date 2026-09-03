import { Link } from "react-router-dom";
import { FeaturedBadge } from "@/components/featured/FeaturedBadge";
import { ClaimedVenueBadge } from "@/components/venues/ClaimedVenueBadge";
import { Button } from "@/components/ui/button";
import { getFeaturedEligibility } from "@/lib/featuredEligibility";
import type { FeaturedPlacement, FeaturedPlacementStatus, FeaturedPlacementType } from "@/types/featuredPlacements";
import type { Venue } from "@/types/venue";

export function AdminFeaturedPlacementTable({
  placements,
  venuesById,
  onEdit,
  onStatus,
  onDelete,
}: {
  placements: FeaturedPlacement[];
  venuesById: Map<string, Venue>;
  onEdit: (placement: FeaturedPlacement) => void;
  onStatus: (placement: FeaturedPlacement, status: FeaturedPlacementStatus) => void;
  onDelete: (placement: FeaturedPlacement) => void;
}) {
  if (!placements.length) {
    return <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">No featured placements match these filters.</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Venue</th>
              <th className="px-4 py-3">Placement</th>
              <th className="px-4 py-3">City/Area</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {placements.map((placement) => {
              const venue = venuesById.get(placement.venueId);
              const eligibility = venue ? getFeaturedEligibility(venue) : null;
              return (
                <tr key={placement.id}>
                  <td className="px-4 py-4">
                    <div className="font-medium">{venue?.name ?? placement.venueId}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {venue ? <span>{venue.city} · {venue.area}</span> : null}
                      {venue?.isClaimed ? <ClaimedVenueBadge compact /> : null}
                      {eligibility && !eligibility.eligible ? <span className="text-red-700">Not eligible</span> : null}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2"><TypeBadge type={placement.placementType} /><FeaturedBadge compact /></div>
                    {placement.title ? <div className="mt-2 font-medium">{placement.title}</div> : null}
                    {placement.description ? <div className="mt-1 max-w-xs truncate text-xs text-muted-foreground">{placement.description}</div> : null}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{[placement.city, placement.area].filter(Boolean).join(" · ") || "Global"}</td>
                  <td className="px-4 py-4"><StatusBadge status={placement.status} /></td>
                  <td className="px-4 py-4 text-muted-foreground">{formatDate(placement.startsAt)}<br />to {formatDate(placement.endsAt)}</td>
                  <td className="px-4 py-4">{placement.priority}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(placement)}>Edit</Button>
                      {placement.status !== "active" ? <Button size="sm" onClick={() => onStatus(placement, "active")}>Activate</Button> : <Button size="sm" variant="outline" onClick={() => onStatus(placement, "paused")}>Pause</Button>}
                      <Button size="sm" variant="ghost" onClick={() => onStatus(placement, "cancelled")}>Cancel</Button>
                      {placement.status === "draft" ? <Button size="sm" variant="ghost" onClick={() => onDelete(placement)}>Delete</Button> : null}
                      {venue ? <Button asChild size="sm" variant="ghost"><Link to={`/venues/${venue.slug}`}>View</Link></Button> : null}
                    </div>
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

function StatusBadge({ status }: { status: FeaturedPlacementStatus }) {
  return <span className="inline-flex rounded-full border bg-background px-2 py-1 text-xs font-medium capitalize">{status}</span>;
}

function TypeBadge({ type }: { type: FeaturedPlacementType }) {
  return <span className="inline-flex rounded-full border bg-background px-2 py-1 text-xs font-medium capitalize">{type}</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
