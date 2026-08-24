import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewEmptyState } from "@/components/reviews/ReviewEmptyState";
import type { VenueReview } from "@/types/reviews";

interface ReviewListProps {
  reviews: VenueReview[];
  currentUserId?: string | null;
  onEditReview?: (review: VenueReview) => void;
  onDeleteReview?: (review: VenueReview) => void;
}

export function ReviewList({ reviews, currentUserId, onEditReview, onDeleteReview }: ReviewListProps) {
  if (!reviews.length) {
    return <ReviewEmptyState signedIn={Boolean(currentUserId)} />;
  }

  const orderedReviews = [...reviews].sort((first, second) => {
    const firstIsOwner = first.userId === currentUserId;
    const secondIsOwner = second.userId === currentUserId;

    if (firstIsOwner !== secondIsOwner) {
      return firstIsOwner ? -1 : 1;
    }

    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
  });

  return (
    <div className="space-y-4">
      {orderedReviews.map((review) => {
        const isOwner = review.userId === currentUserId;

        return (
          <ReviewCard
            key={review.id}
            review={review}
            isOwner={isOwner}
            onEdit={isOwner ? () => onEditReview?.(review) : undefined}
            onDelete={isOwner ? () => onDeleteReview?.(review) : undefined}
          />
        );
      })}
    </div>
  );
}
