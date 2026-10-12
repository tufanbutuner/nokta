import { Star } from "lucide-react";
import type { VenueReview } from "@/types/reviews";

export function ReviewSubmittedBand({ review }: { review: VenueReview }) {
  return (
    <article className="overflow-hidden rounded-xl border bg-nokta-surface border-nokta-border">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-nokta-hover px-4 py-3 border-nokta-border">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-nokta-ink-muted">Submitted review</div>
          <h3 className="mt-1 text-sm font-semibold text-nokta-ink">{review.title || "Untitled review"}</h3>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-nokta-warn-tint px-2.5 py-1 text-[13px] font-semibold text-nokta-warn-ink" aria-label={`${review.rating} out of 5 stars`}>
          <Star className="h-3.5 w-3.5 fill-current" /> {review.rating}/5
        </div>
      </header>
      <div className="px-4 py-4">
        <p className="whitespace-pre-wrap text-sm leading-[1.65] text-nokta-ink">{review.body}</p>
        <dl className="mt-4 grid gap-3 border-t pt-3 text-[13px] sm:grid-cols-2 border-nokta-border">
          <div><dt className="text-nokta-ink-muted">Visit date</dt><dd className="mt-0.5 font-medium text-nokta-ink">{review.visitDate ? formatDate(review.visitDate) : "Not provided"}</dd></div>
          <div><dt className="text-nokta-ink-muted">Review reference</dt><dd className="mt-0.5 font-mono text-xs text-nokta-ink">{review.id}</dd></div>
        </dl>
      </div>
    </article>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}
