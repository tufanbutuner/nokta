import { OwnerBookingCalendarEmptyState } from "./OwnerBookingCalendarEmptyState";
import { OwnerBookingCalendarEventCard } from "./OwnerBookingCalendarEventCard";
import type { BookingCalendarEvent } from "@/types/bookingCalendar";

export function OwnerBookingTodayView({ events, onEventClick }: { events: BookingCalendarEvent[]; onEventClick: (event: BookingCalendarEvent) => void }) {
  if (!events.length) return <OwnerBookingCalendarEmptyState message="No booking requests for this day." />;

  const actionNeeded = events.filter((event) => event.isActionRequired);
  const accepted = events.filter((event) => event.status === "accepted" || event.status === "customer_accepted_alternative");
  const other = events.filter((event) => !actionNeeded.includes(event) && !accepted.includes(event));

  return <div className="grid gap-4 lg:grid-cols-3"><Section title="Action needed" events={actionNeeded} onEventClick={onEventClick} /><Section title="Accepted" events={accepted} onEventClick={onEventClick} /><Section title="Other" events={other} onEventClick={onEventClick} /></div>;
}

function Section({ title, events, onEventClick }: { title: string; events: BookingCalendarEvent[]; onEventClick: (event: BookingCalendarEvent) => void }) {
  return <section className="rounded-xl border bg-card p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{title}</h3><span className="text-xs text-muted-foreground">{events.length}</span></div><div className="grid gap-2">{events.length ? events.map((event) => <OwnerBookingCalendarEventCard key={event.id} event={event} onClick={() => onEventClick(event)} />) : <p className="text-sm text-muted-foreground">Nothing here.</p>}</div></section>;
}
