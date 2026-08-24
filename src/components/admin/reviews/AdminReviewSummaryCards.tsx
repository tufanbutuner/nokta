import { Card, CardContent } from "@/components/ui/card";
import type { ReviewStatus, VenueReview } from "@/types/reviews";

const STATUS_ORDER: ReviewStatus[] = ["published", "hidden", "flagged", "deleted"];

export function AdminReviewSummaryCards({ reviews }: { reviews: VenueReview[] }) {
  const counts = reviews.reduce<Record<ReviewStatus, number>>(
    (nextCounts, review) => ({
      ...nextCounts,
      [review.status]: nextCounts[review.status] + 1,
    }),
    { published: 0, hidden: 0, flagged: 0, deleted: 0 },
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <MetricCard label="Total reviews" value={reviews.length} />
      {STATUS_ORDER.map((status) => (
        <MetricCard key={status} label={`${status[0].toUpperCase()}${status.slice(1)} reviews`} value={counts[status]} />
      ))}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
