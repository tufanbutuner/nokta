import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SuggestionAction } from "@/components/admin/suggestions/AdminSuggestionActions";
import type { VenueSuggestion } from "@/types/venueSuggestions";

export function AdminSuggestionNotesDialog({
  open,
  action,
  suggestion,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  action: SuggestionAction | null;
  suggestion: VenueSuggestion | null;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (notes: string) => void;
}) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setNotes(suggestion?.adminNotes ?? "");
  }, [suggestion]);

  if (!open || !action || !suggestion) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-stone-950/45 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl border bg-card p-5 shadow-2xl shadow-stone-950/20">
        <h2 className="text-xl font-semibold">{getTitle(action)}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{getBody(action)}</p>
        <Textarea className="mt-4 min-h-32" value={notes} placeholder="Optional admin note" onChange={(event) => setNotes(event.target.value)} />
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

function getTitle(action: SuggestionAction) {
  if (action === "approve") return "Approve suggestion?";
  if (action === "reject") return "Reject suggestion?";
  if (action === "converted") return "Mark as converted?";
  return "Edit admin notes";
}

function getBody(action: SuggestionAction) {
  if (action === "approve") return "This marks the suggestion as valid, but does not create a venue automatically.";
  if (action === "reject") return "This marks the suggestion as not accepted.";
  if (action === "converted") return "Use this after creating the venue manually from the suggestion details.";
  return "Update internal notes for this suggestion.";
}
