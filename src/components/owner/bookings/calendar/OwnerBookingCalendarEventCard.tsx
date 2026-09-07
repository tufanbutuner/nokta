import { getBookingCalendarEventLabel, getBookingCalendarStatusTone } from "@/lib/bookingCalendarLabels";
import { cn } from "@/lib/utils";
import type { BookingCalendarEvent } from "@/types/bookingCalendar";

export function OwnerBookingCalendarEventCard({ event, onClick, showVenue = true }: { event: BookingCalendarEvent; onClick: () => void; showVenue?: boolean }) {
  const tone = getBookingCalendarStatusTone(event.status);
  return (
    <button
      type="button"
      className={cn(
        "block min-w-0 max-w-full overflow-hidden rounded-lg border p-3 text-left text-xs shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        tone === "pending" && "border-amber-200 bg-amber-100 text-amber-950",
        tone === "alternative" && "border-sky-200 bg-sky-100 text-sky-950",
        tone === "success" && "border-emerald-200 bg-emerald-100 text-emerald-950",
        tone === "destructive" && "border-rose-200 bg-rose-100 text-rose-950",
        tone === "muted" && "border-stone-200 bg-stone-100 text-neutral-950",
        tone === "default" && "bg-card",
      )}
      onClick={onClick}
    >
      <div className="truncate font-medium">{getBookingCalendarEventLabel({ time: event.time, partySize: event.partySize, status: event.status })}</div>
      {showVenue ? <div className="mt-1 truncate text-[11px] opacity-75">{event.venueName}</div> : null}
      {event.occasion ? <div className="mt-1 truncate text-[11px] opacity-75">{event.occasion}</div> : null}
    </button>
  );
}
