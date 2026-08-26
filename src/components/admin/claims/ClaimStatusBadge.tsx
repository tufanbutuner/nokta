import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VenueClaimRequestStatus } from "@/types/venueClaims";

const STATUS_LABELS: Record<VenueClaimRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<VenueClaimRequestStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  cancelled: "border-muted bg-muted text-muted-foreground",
};

export function ClaimStatusBadge({ status }: { status: VenueClaimRequestStatus }) {
  return (
    <Badge variant="outline" className={cn("w-fit", STATUS_CLASSES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
