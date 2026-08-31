import { mapBookingRequestToCalendarEvent } from "@/lib/bookingCalendarMappers";
import { getOwnerBookingRequests } from "@/services/ownerBookingRequestService";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import type { BookingCalendarEvent, BookingCalendarFilters } from "@/types/bookingCalendar";

export async function getOwnerBookingCalendarEvents(input: { ownerUserId: string; filters: BookingCalendarFilters }): Promise<BookingCalendarEvent[]> {
  const [venues, requests] = await Promise.all([
    getMyClaimedVenues(input.ownerUserId),
    getOwnerBookingRequests({
      ownerUserId: input.ownerUserId,
      venueId: input.filters.venueId ?? undefined,
    }),
  ]);
  const venuesById = Object.fromEntries(venues.map((venue) => [venue.id, venue]));

  return requests
    .filter((request) => request.requestedDate >= input.filters.dateFrom && request.requestedDate <= input.filters.dateTo)
    .filter((request) => !input.filters.statuses.length || input.filters.statuses.includes(request.status))
    .map((bookingRequest) => mapBookingRequestToCalendarEvent({ bookingRequest, venueName: venuesById[bookingRequest.venueId]?.name ?? bookingRequest.venueId }))
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
}
