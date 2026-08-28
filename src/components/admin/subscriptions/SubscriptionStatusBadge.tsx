import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VenueSubscriptionStatus } from "@/types/subscriptions";

const STATUS_CLASSES: Record<VenueSubscriptionStatus, string> = {
  inactive: "bg-muted text-muted-foreground",
  trial: "border-amber-200 bg-amber-50 text-amber-900",
  active: "border-emerald-200 bg-emerald-50 text-emerald-900",
  past_due: "border-red-200 bg-red-50 text-red-900",
  cancelled: "border-border bg-background text-muted-foreground",
};

export function SubscriptionStatusBadge({ status }: { status: VenueSubscriptionStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", STATUS_CLASSES[status])}>
      {status.replace("_", " ")}
    </Badge>
  );
}
