import { getDatesBetween } from "@/lib/bookingCalendarDates";
import { OwnerBookingCalendarEmptyState } from "./OwnerBookingCalendarEmptyState";
import { OwnerBookingCalendarDayCell } from "./OwnerBookingCalendarDayCell";
import type { BookingCalendarDateRange, BookingCalendarEvent } from "@/types/bookingCalendar";

export function OwnerBookingWeekView({ range, events, onEventClick }: { range: BookingCalendarDateRange; events: BookingCalendarEvent[]; onEventClick: (event: BookingCalendarEvent) => void }) {
  const dates = getDatesBetween(range.dateFrom, range.dateTo);
  if (!events.length) return <OwnerBookingCalendarEmptyState message="No booking requests this week." />;
  return <div className="grid min-w-0 gap-3 xl:grid-cols-7">{dates.map((date) => <OwnerBookingCalendarDayCell key={date} date={date} events={events.filter((event) => event.date === date)} onEventClick={onEventClick} />)}</div>;
}
