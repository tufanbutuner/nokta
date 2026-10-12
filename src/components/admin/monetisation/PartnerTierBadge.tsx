import { Badge } from "@/components/ui/badge";
import { formatPartnerTier } from "@/lib/monetisationLabels";
import { cn } from "@/lib/utils";
import type { PartnerTier } from "@/types/monetisation";

const TIER_CLASSES: Record<PartnerTier, string> = {
  none: "border-transparent bg-nokta-track text-nokta-ink-muted",
  starter: "border-transparent bg-nokta-track text-nokta-ink-muted",
  growth: "border-transparent bg-nokta-accent-solid/10 text-nokta-accent-dark",
  pro: "border-transparent bg-nokta-accent-solid/10 text-nokta-accent-dark",
};

export function PartnerTierBadge({ tier }: { tier: PartnerTier }) {
  return (
    <Badge variant="outline" className={cn("w-fit rounded px-2 py-0.5 text-[11px] font-semibold", TIER_CLASSES[tier])}>
      {formatPartnerTier(tier)}
    </Badge>
  );
}
