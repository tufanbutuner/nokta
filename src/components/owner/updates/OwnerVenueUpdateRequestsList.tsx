import { formatVenueUpdateRequestStatus } from "@/lib/venueUpdateRequestLabels";
import { getChangedFields } from "@/lib/venueUpdateRequestValidation";
import { Button } from "@/components/ui/button";
import type { VenueUpdateRequest } from "@/types/venueUpdateRequests";

export function OwnerVenueUpdateRequestsList({ requests, onCancel }: { requests: VenueUpdateRequest[]; onCancel?: (request: VenueUpdateRequest) => void }) {
  if (!requests.length) return <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">No profile update requests yet.</div>;
  return (
    <div className="grid gap-3">
      {requests.map((request) => (
        <article key={request.id} className="rounded-xl border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium">{formatVenueUpdateRequestStatus(request.status)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(request.createdAt).toLocaleDateString("en-GB")} · {getChangedFields({ original: request.originalSnapshot, requested: request.requestedChanges }).join(", ") || "No changed fields"}</p>
              {request.adminNotes ? <p className="mt-2 text-sm text-muted-foreground">Admin notes: {request.adminNotes}</p> : null}
            </div>
            {request.status === "pending" && onCancel ? <Button type="button" variant="outline" size="sm" onClick={() => onCancel(request)}>Cancel</Button> : null}
          </div>
        </article>
      ))}
    </div>
  );
}
