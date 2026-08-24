import { Link } from "react-router-dom";
import { AdminReviewActions, type ModerationAction } from "@/components/admin/reviews/AdminReviewActions";
import { ReviewStatusBadge } from "@/components/admin/reviews/ReviewStatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import type { VenueReview } from "@/types/reviews";
import type { Venue } from "@/types/venue";

export function AdminReviewTable({
  reviews,
  venuesById,
  pendingReviewId,
  onAction,
}: {
  reviews: VenueReview[];
  venuesById: Record<string, Venue>;
  pendingReviewId?: string | null;
  onAction: (action: ModerationAction, review: VenueReview) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Review</th>
                <th className="px-4 py-3 font-medium">Venue</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => {
                const venue = venuesById[review.venueId];

                return (
                  <tr key={review.id} className="border-t align-top">
                    <td className="max-w-md px-4 py-4">
                      <div className="font-medium">{review.title || "Untitled review"}</div>
                      <p className="mt-1 line-clamp-2 text-muted-foreground">{review.body}</p>
                      <p className="mt-2 text-xs text-muted-foreground">User {shortenId(review.userId)}</p>
                      {review.moderationNotes ? (
                        <p className="mt-2 rounded-lg bg-background/70 p-2 text-xs text-muted-foreground">Note: {review.moderationNotes}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      {venue ? (
                        <Link className="font-medium hover:underline" to={`/venues/${venue.slug}`}>
                          {venue.name}
                        </Link>
                      ) : (
                        <span className="font-medium">{review.venueId}</span>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground">{review.venueId}</div>
                    </td>
                    <td className="px-4 py-4 font-semibold">{review.rating} / 5</td>
                    <td className="px-4 py-4">
                      <ReviewStatusBadge status={review.status} />
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{formatDate(review.createdAt)}</td>
                    <td className="px-4 py-4">
                      <AdminReviewActions review={review} isPending={pendingReviewId === review.id} onAction={onAction} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function shortenId(value: string) {
  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
