import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VenueQualityIssue } from "@/lib/venueQuality";

const SEVERITY_CLASSES: Record<VenueQualityIssue["severity"], string> = {
  low: "border-stone-200 bg-stone-50 text-stone-600",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-red-200 bg-red-50 text-red-800",
};

export function DataQualityIssueBadge({ issue }: { issue: VenueQualityIssue }) {
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", SEVERITY_CLASSES[issue.severity])}>
      {issue.label}
    </Badge>
  );
}
