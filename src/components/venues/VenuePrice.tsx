import { formatPriceLevel } from "@/lib/venueFilters";
import { PriceLevel } from "@/types/venue";

export function VenuePrice({ level, from }: { level: PriceLevel; from?: number | null }) {
  return (
    <span className="text-sm text-muted-foreground">
      {formatPriceLevel(level)}
      {from ? ` · Shisha £${from}+` : " · Price TBC"}
    </span>
  );
}
