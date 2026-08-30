import { Badge } from "@/components/ui/badge";
import { formatOwnerPromotionRequestType } from "@/lib/ownerPromotionRequestLabels";
import type { OwnerPromotionRequestType } from "@/types/ownerPromotionRequests";

export function OwnerPromotionRequestTypeBadge({ type }: { type: OwnerPromotionRequestType }) {
  return (
    <Badge variant="outline" className="border-clay-400/25 bg-clay-50 text-sheesh-ink">
      {formatOwnerPromotionRequestType(type)}
    </Badge>
  );
}
