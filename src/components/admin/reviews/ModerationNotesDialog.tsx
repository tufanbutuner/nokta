import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ModerationAction } from "@/components/admin/reviews/AdminReviewActions";
import type { VenueReview } from "@/types/reviews";

export function ModerationNotesDialog({
  open,
  action,
  review,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  action: ModerationAction | null;
  review: VenueReview | null;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (notes: string) => void;
}) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setNotes(review?.moderationNotes ?? "");
  }, [review]);

  if (!open || !review || !action) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-stone-950/45 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl border bg-card p-5 shadow-2xl shadow-stone-950/20">
        <h2 className="text-xl font-semibold">{getDialogTitle(action)}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{getDialogBody(action)}</p>
        <Textarea
          className="mt-4 min-h-32"
          value={notes}
          placeholder="Optional moderation note"
          onChange={(event) => setNotes(event.target.value)}
        />
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onSubmit(notes)} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getDialogTitle(action: ModerationAction) {
  if (action === "delete") return "Soft delete review?";
  if (action === "hide") return "Hide review?";
  if (action === "flag") return "Flag review?";
  if (action === "publish") return "Publish review?";
  return "Edit moderation notes";
}

function getDialogBody(action: ModerationAction) {
  if (action === "delete") return "This will hide the review from public pages but keep it in the database.";
  if (action === "hide") return "This will hide the review from public venue pages.";
  if (action === "flag") return "This will mark the review for attention.";
  if (action === "publish") return "This will make the review visible on public venue pages.";
  return "Update internal notes for this review.";
}
