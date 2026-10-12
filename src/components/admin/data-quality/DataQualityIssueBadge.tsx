import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VenueQualityIssue } from "@/lib/venueQuality";

const SEVERITY_CLASSES: Record<VenueQualityIssue["severity"], string> = {
  low: "border-nokta-divider bg-nokta-surface-alt text-nokta-ink-muted",
  medium: "border-nokta-warn-line bg-nokta-warn-tint text-nokta-warn-ink",
  high: "border-nokta-bad-line bg-nokta-bad-tint text-nokta-bad-ink",
};

export function DataQualityIssueBadge({ issue }: { issue: VenueQualityIssue }) {
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", SEVERITY_CLASSES[issue.severity])}>
      {issue.label}
    </Badge>
  );
}
