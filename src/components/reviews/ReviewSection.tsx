import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { VenueRatingSummary } from "@/components/reviews/VenueRatingSummary";
import { InlineLoadingState } from "@/components/state/InlineLoadingState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useUserVenueReview } from "@/hooks/useUserVenueReview";
import { useVenueReviews } from "@/hooks/useVenueReviews";
import { trackEvent } from "@/lib/analytics";
import { createVenueReview, deleteVenueReview, getVenueRatingSummary, updateVenueReview } from "@/services/reviewService";
import type { VenueReview, VenueReviewInput } from "@/types/reviews";
import type { Venue } from "@/types/venue";

export function ReviewSection({ venue }: { venue: Venue }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { reviews, isLoading: reviewsLoading, error: reviewsError, refetch: refetchReviews } = useVenueReviews(venue.id);
  const {
    review: userReview,
    isLoading: userReviewLoading,
    error: userReviewError,
    refetch: refetchUserReview,
  } = useUserVenueReview(venue.id, user?.id);
  const [editingReview, setEditingReview] = useState<VenueReview | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const summary = useMemo(() => getVenueRatingSummary(reviews), [reviews]);
  const isLoading = reviewsLoading || isAuthLoading || userReviewLoading;
  const showForm = Boolean(user && !userReviewLoading && (!userReview || editingReview));

  async function refreshReviews() {
    await Promise.all([refetchReviews(), refetchUserReview()]);
  }

  async function handleSubmit(input: VenueReviewInput) {
    if (!user) {
      return;
    }

    setIsSubmitting(true);
    setMutationError(null);

    try {
      const existingReview = editingReview ?? userReview;

      if (existingReview) {
        await updateVenueReview(existingReview.id, input);
        trackEvent("review_updated", {
          venueId: venue.id,
          rating: input.rating,
        });
        setEditingReview(null);
      } else {
        await createVenueReview(user.id, input);
        trackEvent("review_created", {
          venueId: venue.id,
          rating: input.rating,
        });
      }

      await refreshReviews();
    } catch (caughtError) {
      setMutationError(caughtError instanceof Error ? caughtError.message : "Could not save review.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(review: VenueReview) {
    const confirmed = window.confirm("Delete your review?");

    if (!confirmed) {
      return;
    }

    setMutationError(null);

    try {
      await deleteVenueReview(review.id);
      setEditingReview(null);
      await refreshReviews();
    } catch (caughtError) {
      setMutationError(caughtError instanceof Error ? caughtError.message : "Could not delete review.");
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <VenueRatingSummary summary={summary} fallbackRating={venue.rating} />

      <div className="min-w-0 space-y-5">
        <div>
          <h2 className="text-2xl font-semibold">Reviews</h2>
          <p className="mt-2 text-sm text-muted-foreground">Real experiences from nokta users.</p>
        </div>

        {reviewsError ? <Alert className="border-destructive/30 text-destructive">{reviewsError}</Alert> : null}
        {userReviewError ? <Alert className="border-destructive/30 text-destructive">{userReviewError}</Alert> : null}
        {mutationError ? <Alert className="border-destructive/30 text-destructive">{mutationError}</Alert> : null}

        {!user && !isAuthLoading ? (
          <Card className="p-5">
            <h3 className="text-lg font-semibold">Want to leave a review?</h3>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to share your experience.</p>
            <Button asChild className="mt-4">
              <Link to="/sign-in">Sign in</Link>
            </Button>
          </Card>
        ) : null}

        {user && userReview && !editingReview ? (
          <Card className="p-5">
            <h3 className="text-lg font-semibold">You reviewed this venue</h3>
            <p className="mt-2 text-sm text-muted-foreground">You can edit your review or delete it from the list below.</p>
            <Button type="button" className="mt-4" onClick={() => setEditingReview(userReview)}>
              Edit your review
            </Button>
          </Card>
        ) : null}

        {showForm ? (
          <ReviewForm
            venueId={venue.id}
            existingReview={editingReview}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={editingReview ? () => setEditingReview(null) : undefined}
          />
        ) : null}

        {isLoading ? (
          <InlineLoadingState message="Loading reviews..." />
        ) : (
          <ReviewList
            reviews={reviews}
            currentUserId={user?.id}
            onEditReview={(review) => setEditingReview(review)}
            onDeleteReview={handleDelete}
          />
        )}
      </div>
    </section>
  );
}
