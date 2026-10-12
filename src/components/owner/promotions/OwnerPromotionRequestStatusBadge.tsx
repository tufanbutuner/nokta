import { Badge } from "@/components/ui/badge";
import { formatOwnerPromotionRequestStatus } from "@/lib/ownerPromotionRequestLabels";
import { cn } from "@/lib/utils";
import type { OwnerPromotionRequestStatus } from "@/types/ownerPromotionRequests";

const STATUS_CLASS: Record<OwnerPromotionRequestStatus, string> = {
  pending: "border-nokta-warn-line bg-nokta-warn-tint text-nokta-warn-ink",
  approved: "border-nokta-info-line bg-nokta-info-tint text-nokta-info-ink",
  rejected: "border-nokta-bad-line bg-nokta-bad-tint text-nokta-bad-ink",
  cancelled: "border-border bg-nokta-track text-nokta-ink-muted",
  converted: "border-nokta-ok-line bg-nokta-ok-tint text-nokta-ok-ink",
};

export function OwnerPromotionRequestStatusBadge({ status }: { status: OwnerPromotionRequestStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", STATUS_CLASS[status])}>
      {formatOwnerPromotionRequestStatus(status)}
    </Badge>
  );
}
