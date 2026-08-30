import { Button } from "@/components/ui/button";
import { OwnerPromotionRequestStatusBadge } from "@/components/owner/promotions/OwnerPromotionRequestStatusBadge";
import { OwnerPromotionRequestTypeBadge } from "@/components/owner/promotions/OwnerPromotionRequestTypeBadge";
import type { OwnerPromotionRequest } from "@/types/ownerPromotionRequests";
import type { Venue } from "@/types/venue";

export function OwnerPromotionRequestsList({ requests, venuesById, onCancel }: { requests: OwnerPromotionRequest[]; venuesById: Map<string, Venue>; onCancel?: (request: OwnerPromotionRequest) => void }) {
  if (!requests.length) {
    return <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">No promotion requests yet.</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="divide-y">
        {requests.map((request) => {
          const venue = venuesById.get(request.venueId);
          return (
            <div key={request.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_180px_140px] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <OwnerPromotionRequestTypeBadge type={request.requestType} />
                  <OwnerPromotionRequestStatusBadge status={request.status} />
                </div>
                <h3 className="mt-2 font-medium">{request.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{venue?.name ?? request.venueId}</p>
                {request.adminNotes && request.status === "rejected" ? <p className="mt-2 text-sm text-red-700">Admin notes: {request.adminNotes}</p> : null}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{formatDate(request.requestedStartsAt)} to {formatDate(request.requestedEndsAt)}</p>
                <p className="mt-1">Submitted {formatDate(request.createdAt)}</p>
              </div>
              <div className="flex justify-start lg:justify-end">
                {request.status === "pending" && onCancel ? <Button variant="outline" size="sm" onClick={() => onCancel(request)}>Cancel</Button> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
