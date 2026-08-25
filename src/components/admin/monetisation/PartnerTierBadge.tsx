import { Badge } from "@/components/ui/badge";
import { formatPartnerTier } from "@/lib/monetisationLabels";
import { cn } from "@/lib/utils";
import type { PartnerTier } from "@/types/monetisation";

const TIER_CLASSES: Record<PartnerTier, string> = {
  none: "border-transparent bg-clay-100 text-[#8a7e72]",
  starter: "border-transparent bg-clay-100 text-[#8a7e72]",
  growth: "border-transparent bg-clay-400/10 text-clay-400",
  pro: "border-transparent bg-clay-400/10 text-clay-400",
};

export function PartnerTierBadge({ tier }: { tier: PartnerTier }) {
  return (
    <Badge variant="outline" className={cn("w-fit rounded px-2 py-0.5 text-[10px] font-semibold", TIER_CLASSES[tier])}>
      {formatPartnerTier(tier)}
    </Badge>
  );
}
