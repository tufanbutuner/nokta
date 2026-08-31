import { getBookingCalendarEventLabel, getBookingCalendarStatusTone } from "@/lib/bookingCalendarLabels";
import { cn } from "@/lib/utils";
import type { BookingCalendarEvent } from "@/types/bookingCalendar";

export function OwnerBookingCalendarEventCard({ event, onClick, showVenue = true }: { event: BookingCalendarEvent; onClick: () => void; showVenue?: boolean }) {
  const tone = getBookingCalendarStatusTone(event.status);
  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-lg border-l-4 p-3 text-left text-xs shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        tone === "pending" && "border-amber-500 bg-amber-100 text-amber-950",
        tone === "alternative" && "border-sky-500 bg-sky-100 text-sky-950",
        tone === "success" && "border-emerald-600 bg-emerald-100 text-emerald-950",
        tone === "destructive" && "border-rose-500 bg-rose-100 text-rose-950",
        tone === "muted" && "border-stone-500 bg-stone-100 text-stone-800",
        tone === "default" && "bg-card",
      )}
      onClick={onClick}
    >
      <div className="font-medium">{getBookingCalendarEventLabel({ time: event.time, partySize: event.partySize, status: event.status })}</div>
      {showVenue ? <div className="mt-1 truncate text-[11px] opacity-75">{event.venueName}</div> : null}
      {event.occasion ? <div className="mt-1 truncate text-[11px] opacity-75">{event.occasion}</div> : null}
    </button>
  );
}
