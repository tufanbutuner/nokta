import { Badge } from "@/components/ui/badge";
import { formatOwnerPromotionRequestStatus } from "@/lib/ownerPromotionRequestLabels";
import { cn } from "@/lib/utils";
import type { OwnerPromotionRequestStatus } from "@/types/ownerPromotionRequests";

const STATUS_CLASS: Record<OwnerPromotionRequestStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  approved: "border-blue-200 bg-blue-50 text-blue-900",
  rejected: "border-red-200 bg-red-50 text-red-900",
  cancelled: "border-border bg-muted text-muted-foreground",
  converted: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

export function OwnerPromotionRequestStatusBadge({ status }: { status: OwnerPromotionRequestStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", STATUS_CLASS[status])}>
      {formatOwnerPromotionRequestStatus(status)}
    </Badge>
  );
}
