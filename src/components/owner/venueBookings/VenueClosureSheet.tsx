import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { validateVenueBookingClosureDate } from "@/lib/bookingAvailabilityValidation";
import { toDateInputValue } from "@/lib/bookingCalendarDates";

export interface ClosureInput {
  blackoutDate: string;
  reason: string | null;
}

/**
 * "Add a closure" used to be a window.prompt pair — invisible to design, easy
 * to typo, and impossible to review before sending. Same fields, in a sheet.
 */
export function VenueClosureSheet({ open, isSaving, error, onOpenChange, onSubmit }: {
  open: boolean;
  isSaving: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (closure: ClosureInput) => Promise<void>;
}) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDate(toDateInputValue(new Date()));
      setReason("");
      setLocalError(null);
    }
  }, [open]);

  async function handleSubmit() {
    const dateError = validateVenueBookingClosureDate(date);
    if (dateError) {
      setLocalError(dateError);
      return;
    }
    setLocalError(null);
    await onSubmit({ blackoutDate: date, reason: reason.trim() || null });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader>
        <SheetTitle>Add a closure</SheetTitle>
        <SheetClose onClick={() => onOpenChange(false)} />
      </SheetHeader>
      <p className="text-[13px] leading-[1.55] text-muted-foreground">
        A closed date takes the request form off your public page for that day. Bookings already accepted stay on your calendar.
      </p>
      <div className="mt-4 grid gap-3">
        <label className="block">
          <span className="text-[11.5px] text-muted-foreground">Date</span>
          <Input type="date" className="mt-1" value={date} min={toDateInputValue(new Date())} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label className="block">
          <span className="text-[11.5px] text-muted-foreground">Reason (shown on your calendar)</span>
          <Input className="mt-1" value={reason} placeholder="private hire" onChange={(event) => setReason(event.target.value)} />
        </label>
      </div>
      {localError ?? error ? <p className="mt-3 text-xs text-destructive">{localError ?? error}</p> : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button type="button" disabled={isSaving || !date} onClick={() => void handleSubmit()}>
          {isSaving ? "Adding..." : "Close this date"}
        </Button>
        <Button type="button" variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)}>Cancel</Button>
      </div>
    </Sheet>
  );
}
