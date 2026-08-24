import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewRating } from "@/types/reviews";

interface StarRatingProps {
  value: number;
  onChange?: (value: ReviewRating) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export function StarRating({ value, onChange, readOnly = false, size = "md" }: StarRatingProps) {
  return (
    <div className="inline-flex items-center gap-1" role={readOnly ? "img" : "radiogroup"} aria-label={`${value || 0} out of 5 stars`}>
      {([1, 2, 3, 4, 5] as ReviewRating[]).map((rating) => {
        const filled = value >= rating;
        const className = cn(sizeClasses[size], filled ? "fill-clay-accent text-clay-accent" : "text-muted-foreground/35");

        if (readOnly || !onChange) {
          return <Star key={rating} className={className} aria-hidden="true" />;
        }

        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={value === rating}
            aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
            className="rounded-full p-0.5 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onChange(rating)}
          >
            <Star className={className} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
