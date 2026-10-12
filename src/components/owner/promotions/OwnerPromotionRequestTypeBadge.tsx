import { Badge } from "@/components/ui/badge";
import { formatOwnerPromotionRequestType } from "@/lib/ownerPromotionRequestLabels";
import type { OwnerPromotionRequestType } from "@/types/ownerPromotionRequests";

export function OwnerPromotionRequestTypeBadge({ type }: { type: OwnerPromotionRequestType }) {
  return (
    <Badge variant="outline" className="border-nokta-accent/25 bg-nokta-surface-alt text-nokta-ink">
      {formatOwnerPromotionRequestType(type)}
    </Badge>
  );
}
