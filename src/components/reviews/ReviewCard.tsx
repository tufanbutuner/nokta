import { Pencil, Trash2 } from "lucide-react";
import { StarRating } from "@/components/reviews/StarRating";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { VenueReview } from "@/types/reviews";

interface ReviewCardProps {
  review: VenueReview;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ReviewCard({ review, isOwner = false, onEdit, onDelete }: ReviewCardProps) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <StarRating value={review.rating} readOnly size="sm" />
          <p className="mt-2 text-sm font-medium">Sheesha user</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
        </div>
        {isOwner ? (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        ) : null}
      </div>

      {review.title ? <h3 className="mt-4 text-lg font-semibold">{review.title}</h3> : null}
      <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">{review.body}</p>
      {review.visitDate ? <p className="mt-4 text-xs text-muted-foreground">Visited {formatDate(review.visitDate)}</p> : null}
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
