import { Badge } from "@/components/ui/badge";
import { PLAN_CONFIG } from "@/lib/planConfig";
import { cn } from "@/lib/utils";
import type { VenuePlan, VenueSubscriptionStatus } from "@/types/subscriptions";

const PLAN_CLASSES: Record<VenuePlan, string> = {
  free: "border-border bg-muted text-muted-foreground",
  starter: "border-amber-200 bg-amber-50 text-amber-900",
  growth: "border-violet-200 bg-violet-50 text-violet-900",
  pro: "border-nokta-ink bg-nokta-ink text-clay-50",
};

export function PlanBadge({ plan, status = "active", compact = false }: { plan: VenuePlan; status?: VenueSubscriptionStatus; compact?: boolean }) {
  const planLabel = plan === "free" ? "Free" : PLAN_CONFIG[plan].name;
  const label = status === "active" || (plan === "free" && status === "inactive") ? planLabel : `${planLabel} ${status.replace("_", " ")}`;

  return (
    <Badge variant="outline" className={cn("capitalize", PLAN_CLASSES[plan], compact ? "px-2 py-0 text-[11px]" : "")}>
      {label}
    </Badge>
  );
}
