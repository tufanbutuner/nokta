import { getDatesBetween, getEndOfMonth, getStartOfMonth, toDateInputValue } from "@/lib/bookingCalendarDates";
import { getBookingCalendarStatusTone } from "@/lib/bookingCalendarLabels";
import { cn } from "@/lib/utils";
import type { BookingCalendarEvent } from "@/types/bookingCalendar";

export function OwnerBookingMonthView({ anchorDate, events, onEventClick, onDateClick }: { anchorDate: Date; events: BookingCalendarEvent[]; onEventClick: (event: BookingCalendarEvent) => void; onDateClick: (date: string) => void }) {
  const dates = getDatesBetween(toDateInputValue(getStartOfMonth(anchorDate)), toDateInputValue(getEndOfMonth(anchorDate)));
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
      {dates.map((date) => {
        const dayEvents = events.filter((event) => event.date === date);
        return (
          <section key={date} className="min-h-32 rounded-xl border bg-card p-3">
            <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => onDateClick(date)}>
              <span className="font-semibold">{new Date(`${date}T00:00:00`).getDate()}</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{dayEvents.length}</span>
            </button>
            <div className="mt-3 grid gap-1.5">
              {dayEvents.slice(0, 3).map((event) => <MonthChip key={event.id} event={event} onClick={() => onEventClick(event)} />)}
              {dayEvents.length > 3 ? <button type="button" className="text-left text-xs text-muted-foreground" onClick={() => onDateClick(date)}>+{dayEvents.length - 3} more</button> : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MonthChip({ event, onClick }: { event: BookingCalendarEvent; onClick: () => void }) {
  const tone = getBookingCalendarStatusTone(event.status);
  return (
    <button
      type="button"
      className={cn(
        "truncate rounded-md border px-2 py-1 text-left text-xs font-medium shadow-sm",
        tone === "pending" && "border-amber-200 bg-amber-100 text-amber-950",
        tone === "alternative" && "border-sky-200 bg-sky-100 text-sky-950",
        tone === "success" && "border-emerald-200 bg-emerald-100 text-emerald-950",
        tone === "destructive" && "border-rose-200 bg-rose-100 text-rose-950",
        tone === "muted" && "border-stone-200 bg-stone-100 text-neutral-950",
      )}
      onClick={onClick}
    >
      {event.time} • {event.partySize}
    </button>
  );
}
