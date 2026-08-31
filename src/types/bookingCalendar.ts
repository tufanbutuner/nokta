import type { BookingRequestStatus } from "@/types/bookingRequests";

export type BookingCalendarView = "today" | "week" | "month" | "list";

export interface BookingCalendarEvent {
  id: string;
  bookingRequestId: string;
  venueId: string;
  venueName: string;
  customerName: string;
  partySize: number;
  date: string;
  time: string;
  startsAt: string;
  endsAt: string | null;
  status: BookingRequestStatus;
  occasion: string | null;
  sourceSurface: string | null;
  isActionRequired: boolean;
}

export interface BookingCalendarFilters {
  venueId?: string | null;
  statuses: BookingRequestStatus[];
  dateFrom: string;
  dateTo: string;
}

export interface BookingCalendarDateRange {
  dateFrom: string;
  dateTo: string;
}
