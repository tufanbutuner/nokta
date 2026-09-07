import { OwnerBookingCalendarEventCard } from "./OwnerBookingCalendarEventCard";
import type { BookingCalendarEvent } from "@/types/bookingCalendar";

export function OwnerBookingCalendarDayCell({ date, events, onEventClick }: { date: string; events: BookingCalendarEvent[]; onEventClick: (event: BookingCalendarEvent) => void }) {
  const label = new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return (
    <section className="min-h-44 min-w-0 rounded-xl border bg-card p-3">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2"><h3 className="truncate font-semibold">{label}</h3><span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{events.length}</span></div>
      <div className="grid min-w-0 gap-2">{events.length ? events.map((event) => <OwnerBookingCalendarEventCard key={event.id} event={event} onClick={() => onEventClick(event)} />) : <p className="text-xs text-muted-foreground">No requests.</p>}</div>
    </section>
  );
}
