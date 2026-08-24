import { useEffect, useState } from "react";
import { StarRating } from "@/components/reviews/StarRating";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { validateReviewInput } from "@/lib/reviewValidation";
import type { ReviewRating, VenueReview, VenueReviewInput } from "@/types/reviews";

interface ReviewFormProps {
  venueId: string;
  existingReview?: VenueReview | null;
  isSubmitting?: boolean;
  onSubmit: (input: VenueReviewInput) => Promise<void>;
  onCancel?: () => void;
}

export function ReviewForm({ venueId, existingReview, isSubmitting = false, onSubmit, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState<ReviewRating | 0>(existingReview?.rating ?? 0);
  const [title, setTitle] = useState(existingReview?.title ?? "");
  const [body, setBody] = useState(existingReview?.body ?? "");
  const [visitDate, setVisitDate] = useState(existingReview?.visitDate ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setRating(existingReview?.rating ?? 0);
    setTitle(existingReview?.title ?? "");
    setBody(existingReview?.body ?? "");
    setVisitDate(existingReview?.visitDate ?? "");
    setErrors({});
  }, [existingReview]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input: VenueReviewInput = {
      venueId,
      rating: rating || 1,
      title,
      body,
      visitDate: visitDate || null,
    };
    const validation = validateReviewInput(input);

    if (!rating) {
      validation.errors.rating = "Choose a rating from 1 to 5.";
      validation.isValid = false;
    }

    setErrors(validation.errors);

    if (!validation.isValid) {
      return;
    }

    await onSubmit(input);
  }

  return (
    <Card className="p-5">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <div className="mb-2 block text-sm font-medium">Rating</div>
          <StarRating value={rating} onChange={setRating} size="lg" />
          {errors.rating ? <FieldError message={errors.rating} /> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="review-title">
            Title
          </label>
          <Input
            id="review-title"
            value={title}
            maxLength={80}
            placeholder="Optional headline"
            onChange={(event) => setTitle(event.target.value)}
          />
          {errors.title ? <FieldError message={errors.title} /> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="review-body">
            Review
          </label>
          <Textarea
            id="review-body"
            value={body}
            maxLength={1000}
            placeholder="What was the vibe, service, shisha and setting like?"
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="mt-2 flex justify-between gap-3 text-xs text-muted-foreground">
            <span>{errors.body ? errors.body : "Minimum 10 characters."}</span>
            <span>{body.length}/1000</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="review-visit-date">
            Visit date
          </label>
          <Input id="review-visit-date" type="date" value={visitDate} onChange={(event) => setVisitDate(event.target.value)} />
          {errors.visitDate ? <FieldError message={errors.visitDate} /> : null}
        </div>

        {Object.keys(errors).length > 0 ? <Alert className="border-destructive/30 text-destructive">Please fix the highlighted fields before submitting.</Alert> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : existingReview ? "Update review" : "Post review"}
          </Button>
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="mt-2 text-xs text-destructive">{message}</p>;
}
