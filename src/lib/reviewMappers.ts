import type { VenueReviewRow } from "@/types/database";
import type { VenueReview } from "@/types/reviews";

export function mapReviewRowToReview(row: VenueReviewRow): VenueReview {
  return {
    id: row.id,
    venueId: row.venue_id,
    userId: row.user_id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    visitDate: row.visit_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
