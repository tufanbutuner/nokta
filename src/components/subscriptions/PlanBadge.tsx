import { Badge } from "@/components/ui/badge";
import { PLAN_CONFIG } from "@/lib/planConfig";
import { cn } from "@/lib/utils";
import type { VenuePlan, VenueSubscriptionStatus } from "@/types/subscriptions";

const PLAN_CLASSES: Record<VenuePlan, string> = {
  free: "border-border bg-nokta-track text-nokta-ink-muted",
  starter: "border-nokta-warn-line bg-nokta-warn-tint text-nokta-warn-ink",
  growth: "border-nokta-info-line bg-nokta-info-tint text-nokta-info-ink",
  pro: "border-nokta-accent bg-nokta-accent-tint text-nokta-accent-dark",
};

export function PlanBadge({ plan, status = "active", compact = false }: { plan: VenuePlan; status?: VenueSubscriptionStatus; compact?: boolean }) {
  const planLabel = plan === "free" ? "Free" : PLAN_CONFIG[plan].name;
  const label = status === "active" || (plan === "free" && status === "inactive") ? planLabel : `${planLabel} ${status.replace("_", " ")}`;

  return (
    <Badge variant="outline" className={cn("capitalize", PLAN_CLASSES[plan], compact ? "px-2 py-0 text-xs" : "")}>
      {label}
    </Badge>
  );
}
