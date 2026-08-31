import type { BookingCalendarDateRange, BookingCalendarView } from "@/types/bookingCalendar";

export function getBookingCalendarDateRange(input: { view: BookingCalendarView; anchorDate: Date }): BookingCalendarDateRange {
  if (input.view === "today") {
    return { dateFrom: toDateInputValue(input.anchorDate), dateTo: toDateInputValue(input.anchorDate) };
  }

  if (input.view === "month") {
    return { dateFrom: toDateInputValue(getStartOfMonth(input.anchorDate)), dateTo: toDateInputValue(getEndOfMonth(input.anchorDate)) };
  }

  if (input.view === "list") {
    const end = new Date(input.anchorDate);
    end.setDate(end.getDate() + 30);
    return { dateFrom: toDateInputValue(input.anchorDate), dateTo: toDateInputValue(end) };
  }

  return { dateFrom: toDateInputValue(getStartOfWeek(input.anchorDate)), dateTo: toDateInputValue(getEndOfWeek(input.anchorDate)) };
}

export function getStartOfWeek(date: Date): Date {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

export function getEndOfWeek(date: Date): Date {
  const next = getStartOfWeek(date);
  next.setDate(next.getDate() + 6);
  return next;
}

export function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addCalendarPeriod(input: { view: BookingCalendarView; anchorDate: Date; amount: number }): Date {
  const next = new Date(input.anchorDate);
  if (input.view === "today" || input.view === "list") next.setDate(next.getDate() + input.amount);
  if (input.view === "week") next.setDate(next.getDate() + input.amount * 7);
  if (input.view === "month") next.setMonth(next.getMonth() + input.amount);
  return next;
}

export function formatCalendarHeading(input: { view: BookingCalendarView; anchorDate: Date }): string {
  if (input.view === "today") {
    return input.anchorDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  if (input.view === "month") {
    return input.anchorDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }
  if (input.view === "list") return "Next 30 days";
  const start = getStartOfWeek(input.anchorDate);
  const end = getEndOfWeek(input.anchorDate);
  return `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDatesBetween(dateFrom: string, dateTo: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${dateFrom}T00:00:00`);
  const end = new Date(`${dateTo}T00:00:00`);
  while (cursor <= end) {
    dates.push(toDateInputValue(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
