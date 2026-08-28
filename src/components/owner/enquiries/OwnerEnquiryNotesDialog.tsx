import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { VenueEnquiry } from "@/types/venueEnquiries";

export function OwnerEnquiryNotesDialog({ enquiry, onClose, onSave, isSaving }: { enquiry: VenueEnquiry; onClose: () => void; onSave: (input: { ownerNotes: string | null; venueResponse: string | null }) => Promise<void>; isSaving: boolean }) {
  const [venueResponse, setVenueResponse] = useState(enquiry.venueResponse ?? "");
  const [ownerNotes, setOwnerNotes] = useState(enquiry.ownerNotes ?? "");

  return (
    <div className="fixed inset-0 z-[1700] grid place-items-center bg-stone-950/45 p-4">
      <form
        className="w-full max-w-xl rounded-xl bg-card p-5 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave({ ownerNotes, venueResponse });
        }}
      >
        <h2 className="text-2xl font-semibold">Enquiry notes</h2>
        <p className="mt-1 text-sm text-muted-foreground">These notes are visible to your venue account and Sheesha admins.</p>
        <label className="mt-5 block space-y-2"><span className="text-sm font-medium">Venue response</span><Textarea rows={4} value={venueResponse} onChange={(event) => setVenueResponse(event.target.value)} /></label>
        <label className="mt-4 block space-y-2"><span className="text-sm font-medium">Owner notes</span><Textarea rows={4} value={ownerNotes} onChange={(event) => setOwnerNotes(event.target.value)} /></label>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save notes"}</Button>
        </div>
      </form>
    </div>
  );
}
