import type { BookingCalendarEvent } from "@/types/bookingCalendar";
import type { BookingRequest } from "@/types/bookingRequests";

const ACTION_REQUIRED_STATUSES = new Set(["pending", "customer_accepted_alternative"]);

export function mapBookingRequestToCalendarEvent(input: { bookingRequest: BookingRequest; venueName: string }): BookingCalendarEvent {
  const startsAt = `${input.bookingRequest.requestedDate}T${input.bookingRequest.requestedTime}`;
  const startDate = new Date(startsAt);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 2);

  return {
    id: input.bookingRequest.id,
    bookingRequestId: input.bookingRequest.id,
    venueId: input.bookingRequest.venueId,
    venueName: input.venueName,
    customerName: input.bookingRequest.customerName,
    partySize: input.bookingRequest.partySize,
    date: input.bookingRequest.requestedDate,
    time: input.bookingRequest.requestedTime,
    startsAt,
    endsAt: Number.isNaN(endDate.getTime()) ? null : endDate.toISOString(),
    status: input.bookingRequest.status,
    occasion: input.bookingRequest.occasion,
    sourceSurface: input.bookingRequest.sourceSurface,
    isActionRequired: ACTION_REQUIRED_STATUSES.has(input.bookingRequest.status),
  };
}
