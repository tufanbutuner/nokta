import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { VenueSuggestion, VenueSuggestionStatus } from "@/types/venueSuggestions";

export type SuggestionAction = "approve" | "reject" | "converted" | "notes";

export function AdminSuggestionActions({
  suggestion,
  isPending,
  onAction,
}: {
  suggestion: VenueSuggestion;
  isPending?: boolean;
  onAction: (action: SuggestionAction, suggestion: VenueSuggestion) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestion.status !== "approved" ? (
        <ActionButton label="Approve" status="approved" disabled={isPending} onClick={() => onAction("approve", suggestion)} />
      ) : null}
      {suggestion.status !== "rejected" ? (
        <ActionButton label="Reject" status="rejected" disabled={isPending} onClick={() => onAction("reject", suggestion)} />
      ) : null}
      {suggestion.status !== "converted" ? (
        <ActionButton label="Mark converted" status="converted" disabled={isPending} onClick={() => onAction("converted", suggestion)} />
      ) : null}
      <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => onAction("notes", suggestion)}>
        Notes
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link to="/admin/venues/new">Create venue</Link>
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
  status: VenueSuggestionStatus;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant={status === "approved" ? "outline" : "ghost"} size="sm" disabled={disabled} onClick={onClick}>
      {label}
    </Button>
  );
}
