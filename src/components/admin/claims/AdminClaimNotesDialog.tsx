import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ClaimAction } from "@/components/admin/claims/AdminClaimActions";
import type { VenueClaimRequest } from "@/types/venueClaims";

export function AdminClaimNotesDialog({
  open,
  action,
  claim,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  action: ClaimAction | null;
  claim: VenueClaimRequest | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (adminNotes: string) => void;
}) {
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    setAdminNotes(claim?.adminNotes ?? "");
  }, [claim]);

  if (!open || !claim || !action) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl">
        <h2 className="text-2xl font-semibold">{getTitle(action)}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{getDescription(action)}</p>
        <label className="mt-5 block space-y-2">
          <span className="text-sm font-medium">Admin notes</span>
          <Textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} />
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(adminNotes)} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getTitle(action: ClaimAction) {
  if (action === "approve") return "Approve claim request?";
  if (action === "reject") return "Reject claim request?";
  return "Edit claim notes";
}

function getDescription(action: ClaimAction) {
  if (action === "approve") return "This will mark the venue as claimed and assign it to this user.";
  if (action === "reject") return "The user will not be given claim access.";
  return "Update internal admin notes for this claim request.";
}
