import { Badge } from "@/components/ui/badge";
import { formatVibe } from "@/lib/venueFilters";

export function VenueBadge({ label }: { label: string }) {
  return (
    <Badge variant="outline" className="rounded-full border-transparent bg-nokta-accent-tint px-2.5 py-1 text-[12px] font-semibold text-nokta-accent-dark">
      {formatVibe(label)}
    </Badge>
  );
}
