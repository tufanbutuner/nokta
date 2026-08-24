import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/reviews/StarRating";
import type { VenueRatingSummary as VenueRatingSummaryValue } from "@/types/reviews";

export function VenueRatingSummary({ summary, fallbackRating }: { summary: VenueRatingSummaryValue; fallbackRating?: number | null }) {
  const displayRating = summary.averageRating ?? fallbackRating ?? null;
  const label =
    summary.reviewCount > 0
      ? `${summary.reviewCount} user review${summary.reviewCount === 1 ? "" : "s"}`
      : fallbackRating
        ? "No user reviews yet"
        : "No ratings yet";

  return (
    <Card className="h-fit p-5">
      <p className="text-sm text-muted-foreground">User rating</p>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-5xl font-semibold">{displayRating ?? "-"}</span>
        <span className="pb-1 text-muted-foreground">/ 5</span>
      </div>
      <div className="mt-4">
        <StarRating value={displayRating ?? 0} readOnly size="md" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}
