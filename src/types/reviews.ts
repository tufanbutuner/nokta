export type ReviewRating = 1 | 2 | 3 | 4 | 5;
export type ReviewStatus = "published" | "hidden" | "flagged" | "deleted";

export interface VenueReview {
  id: string;
  venueId: string;
  userId: string;
  rating: ReviewRating;
  title?: string | null;
  body: string;
  visitDate?: string | null;
  status: ReviewStatus;
  moderationNotes?: string | null;
  hiddenAt?: string | null;
  hiddenBy?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueReviewInput {
  venueId: string;
  rating: ReviewRating;
  title?: string | null;
  body: string;
  visitDate?: string | null;
}

export interface VenueRatingSummary {
  averageRating: number | null;
  reviewCount: number;
}
