import { Button } from "@/components/ui/button";
import type { ReviewStatus, VenueReview } from "@/types/reviews";

export type ModerationAction = "publish" | "hide" | "flag" | "delete" | "notes";

export function AdminReviewActions({
  review,
  isPending,
  onAction,
}: {
  review: VenueReview;
  isPending?: boolean;
  onAction: (action: ModerationAction, review: VenueReview) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {review.status !== "published" ? (
        <ActionButton disabled={isPending} label="Publish" status="published" onClick={() => onAction("publish", review)} />
      ) : null}
      {review.status !== "hidden" ? (
        <ActionButton disabled={isPending} label="Hide" status="hidden" onClick={() => onAction("hide", review)} />
      ) : null}
      {review.status !== "flagged" ? (
        <ActionButton disabled={isPending} label="Flag" status="flagged" onClick={() => onAction("flag", review)} />
      ) : null}
      {review.status !== "deleted" ? (
        <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => onAction("delete", review)}>
          Soft delete
        </Button>
      ) : null}
      <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => onAction("notes", review)}>
        Notes
      </Button>
    </div>
  );
}

function ActionButton({
  label,
  status,
  disabled,
  onClick,
}: {
  label: string;
  status: ReviewStatus;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant={status === "published" ? "outline" : "ghost"} size="sm" disabled={disabled} onClick={onClick}>
      {label}
    </Button>
  );
}
