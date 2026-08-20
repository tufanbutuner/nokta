import { Badge } from "@/components/ui/badge";
import { formatVibe } from "@/lib/venueFilters";

export function VenueBadge({ label }: { label: string }) {
  return (
    <Badge variant="outline" className="bg-card/70 text-[11px] text-muted-foreground">
      {formatVibe(label)}
    </Badge>
  );
}
