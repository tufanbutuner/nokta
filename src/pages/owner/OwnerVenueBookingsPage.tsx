import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerVenueTabShell } from "@/components/owner/OwnerVenueTabShell";
import { VenueBookingListView, type VenueBookingListFilter } from "@/components/owner/venueBookings/VenueBookingListView";
import { VenueBookingDetailSheet } from "@/components/owner/venueBookings/VenueBookingDetailSheet";
import { VenueBookingMonthGrid } from "@/components/owner/venueBookings/VenueBookingMonthGrid";
import { VenueBookingSideRail } from "@/components/owner/venueBookings/VenueBookingSideRail";
import { VenueBookingToolbar } from "@/components/owner/venueBookings/VenueBookingToolbar";
import { VenueBookingWeekGrid } from "@/components/owner/venueBookings/VenueBookingWeekGrid";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { addCalendarPeriod, formatCalendarHeading, getBookingCalendarDateRange, toDateInputValue } from "@/lib/bookingCalendarDates";
import { validateVenueBookingClosureDate } from "@/lib/bookingAvailabilityValidation";
import { getWaitingDays, isEventAwaitingReply } from "@/lib/bookingCalendarGeometry";
import { createOwnerVenueBookingBlackoutDate, getOwnerVenueBookingAvailability } from "@/services/ownerBookingAvailabilityService";
import { getOwnerBookingCalendarEvents } from "@/services/ownerBookingCalendarService";
import { acceptBookingRequest, declineBookingRequest, getOwnerBookingRequest, proposeBookingAlternative } from "@/services/ownerBookingRequestService";
import { getMyClaimedVenue } from "@/services/ownerVenueService";
import type { VenueBookingAvailability } from "@/types/bookingAvailability";
import type { BookingRequest } from "@/types/bookingRequests";
import type { BookingCalendarEvent, BookingCalendarView } from "@/types/bookingCalendar";
import type { Venue } from "@/types/venue";

const VIEWS: BookingCalendarView[] = ["today", "week", "month", "list"];

export function OwnerVenueBookingsPage() {
  const { user } = useAuth();
  const { venueId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [availability, setAvailability] = useState<VenueBookingAvailability | null>(null);
  const [events, setEvents] = useState<BookingCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<BookingCalendarEvent | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Below lg the week grid is unreadable, so List is the small-screen default.
  const defaultView: BookingCalendarView = typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches ? "list" : "week";
  const view = readView(searchParams.get("view")) ?? defaultView;
  const anchorDate = useMemo(() => readDate(searchParams.get("date")), [searchParams]);
  const listFilter = (searchParams.get("filter") as VenueBookingListFilter | null) ?? "waiting";
  const isPast = searchParams.get("past") === "1";

  const range = useMemo(() => {
    if (view !== "list") return getBookingCalendarDateRange({ view, anchorDate });
    // "Past requests" flips the 30-day window backwards from the anchor.
    const start = new Date(anchorDate);
    if (isPast) start.setDate(start.getDate() - 30);
    const end = new Date(start);
    end.setDate(end.getDate() + 30);
    return { dateFrom: toDateInputValue(start), dateTo: toDateInputValue(end) };
  }, [view, anchorDate, isPast]);

  const loadEvents = useCallback(async (targetVenueId: string) => {
    if (!user) return;
    const nextEvents = await getOwnerBookingCalendarEvents({
      ownerUserId: user.id,
      filters: { venueId: targetVenueId, statuses: [], dateFrom: range.dateFrom, dateTo: range.dateTo },
    });
    setEvents(nextEvents);
  }, [range.dateFrom, range.dateTo, user]);

  useEffect(() => {
    if (!user || !venueId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getMyClaimedVenue({ userId: user.id, venueId })
      .then(async (nextVenue) => {
        if (!nextVenue) throw new Error("We could not find that venue.");
        const [nextAvailability] = await Promise.all([
          getOwnerVenueBookingAvailability({ ownerUserId: user.id, venueId: nextVenue.id }),
          loadEvents(nextVenue.id),
        ]);
        if (cancelled) return;
        setVenue(nextVenue);
        setAvailability(nextAvailability);
        trackEvent("owner_venue_bookings_viewed", { venueId: nextVenue.id, view });
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load bookings.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `view` is intentionally excluded: changing it re-runs loadEvents via range.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, venueId, loadEvents]);

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    setSearchParams(params, { replace: true });
  }

  async function handleConfirm(event: BookingCalendarEvent) {
    if (!user || !venue) return;
    const previous = events;
    try {
      setConfirmingId(event.id);
      // Optimistic: flip the block now, roll back if the write fails.
      setEvents((current) => current.map((item) => (item.id === event.id ? { ...item, status: "accepted", isActionRequired: false } : item)));
      await acceptBookingRequest({ bookingRequestId: event.bookingRequestId, ownerUserId: user.id });
      await loadEvents(venue.id);
      setSelectedEvent((current) => current?.id === event.id ? { ...current, status: "accepted", isActionRequired: false } : current);
    } catch (caughtError) {
      setEvents(previous);
      setError(caughtError instanceof Error ? caughtError.message : "Could not confirm that request.");
    } finally {
      setConfirmingId(null);
    }
  }

  function handleEventClick(event: BookingCalendarEvent) {
    setSelectedEvent(event);
    setSelectedRequest(null);
    if (!user || !venue) return;
    getOwnerBookingRequest({ ownerUserId: user.id, venueId: venue.id, bookingRequestId: event.bookingRequestId })
      .then((request) => setSelectedRequest(request))
      .catch((caughtError) => setError(caughtError instanceof Error ? caughtError.message : "Could not load that booking."));
  }

  async function handleDeclineSelected() {
    if (!user || !venue || !selectedEvent) return;
    const previous = events;
    try {
      setConfirmingId(selectedEvent.id);
      setEvents((current) => current.map((item) => item.id === selectedEvent.id ? { ...item, status: "declined", isActionRequired: false } : item));
      await declineBookingRequest({ bookingRequestId: selectedEvent.bookingRequestId, ownerUserId: user.id });
      await loadEvents(venue.id);
      setSelectedEvent((current) => current ? { ...current, status: "declined", isActionRequired: false } : current);
    } catch (caughtError) {
      setEvents(previous);
      setError(caughtError instanceof Error ? caughtError.message : "Could not decline that request.");
    } finally { setConfirmingId(null); }
  }

  async function handleSuggestSelected() {
    if (!user || !venue || !selectedEvent) return;
    const proposedDate = window.prompt("Alternative date (YYYY-MM-DD)", selectedEvent.date);
    if (!proposedDate) return;
    const proposedTime = window.prompt("Alternative time (HH:MM)", selectedEvent.time.slice(0, 5));
    if (!proposedTime) return;
    const proposedMessage = window.prompt("Message to the customer", "We can offer this alternative time.") ?? undefined;
    try {
      setConfirmingId(selectedEvent.id);
      await proposeBookingAlternative({ bookingRequestId: selectedEvent.bookingRequestId, ownerUserId: user.id, proposedDate, proposedTime, proposedMessage });
      await loadEvents(venue.id);
      setSelectedEvent((current) => current ? { ...current, status: "alternative_proposed", isActionRequired: false } : current);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not suggest another time.");
    } finally { setConfirmingId(null); }
  }

  async function handleAddClosure() {
    if (!user || !venue) return;
    const date = window.prompt("Closure date (YYYY-MM-DD)", toDateInputValue(new Date()));
    if (!date) return;
    const dateError = validateVenueBookingClosureDate(date);
    if (dateError) {
      setError(dateError);
      return;
    }
    const reason = window.prompt("Reason (shown on your calendar)", "private hire") ?? null;
    try {
      setError(null);
      await createOwnerVenueBookingBlackoutDate({ ownerUserId: user.id, venueId: venue.id, blackoutDate: { blackoutDate: date, reason, isFullDay: true } });
      const nextAvailability = await getOwnerVenueBookingAvailability({ ownerUserId: user.id, venueId: venue.id });
      setAvailability(nextAvailability);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not add that closure.");
    }
  }

  const waitingEvents = events.filter(isEventAwaitingReply);
  const oldestWaitingDays = waitingEvents.length ? Math.max(...waitingEvents.map((event) => getWaitingDays(event.startsAt))) : null;
  const listEvents = events.filter((event) => (listFilter === "waiting" ? isEventAwaitingReply(event) : listFilter === "confirmed" ? event.status === "accepted" : true));

  return (
    <OwnerLayout>
      <PageMeta title="Hours & bookings | nokta" description="See requested bookings and set when you take them." canonicalPath={`/owner/venues/${venueId}/bookings`} />
      {isLoading ? <LoadingState message="Loading bookings..." /> : !venue || !availability ? <ErrorState message={error ?? "Could not load bookings."} /> : (
        <OwnerVenueTabShell
          venue={venue}
          title="Hours & bookings"
          actions={
            <>
              <Button asChild variant="outline" className="h-[34px] text-[13px]">
                <Link to={`/owner/venues/${venue.slug}/bookings/rules`}>Booking rules</Link>
              </Button>
              <Button type="button" onClick={handleAddClosure} className="h-[34px] text-[13px]">Add a closure</Button>
            </>
          }
        >
          <div className="grid gap-[18px] lg:grid-cols-[1fr_274px] lg:items-start">
            <div className="flex min-w-0 flex-col gap-[13px]">
              {error ? <ErrorState message={error} /> : null}

              <VenueBookingToolbar
                view={view}
                heading={view === "list" ? (isPast ? "Past 30 days" : "Next 30 days") : formatCalendarHeading({ view, anchorDate })}
                subheading={view === "month" ? `${events.length} request${events.length === 1 ? "" : "s"} · ${waitingEvents.length} waiting` : view === "list" ? `${range.dateFrom} – ${range.dateTo}` : undefined}
                onChangeView={(nextView) => updateParams({ view: nextView })}
                onStep={(amount) => updateParams({ date: toDateInputValue(addCalendarPeriod({ view, anchorDate, amount })) })}
              />

              {view === "list" ? (
                <VenueBookingListView
                  events={listEvents}
                  closures={availability.blackoutDates}
                  filter={listFilter}
                  counts={{ waiting: waitingEvents.length, confirmed: events.filter((event) => event.status === "accepted").length, all: events.length }}
                  isPast={isPast}
                  confirmingId={confirmingId}
                  onChangeFilter={(filter) => updateParams({ filter })}
                  onTogglePast={() => updateParams({ past: isPast ? null : "1" })}
                  onConfirm={handleConfirm}
                  onOpen={handleEventClick}
                />
              ) : view === "month" ? (
                <VenueBookingMonthGrid
                  anchorDate={anchorDate}
                  events={events}
                  closures={availability.blackoutDates}
                  onEventClick={handleEventClick}
                  onOpenDayInWeek={(date) => updateParams({ view: "week", date })}
                />
              ) : (
                <>
                  <VenueBookingWeekGrid
                    dateFrom={range.dateFrom}
                    dateTo={range.dateTo}
                    events={events}
                    openingHours={venue.openingHours}
                    closures={availability.blackoutDates}
                    onEventClick={handleEventClick}
                  />
                  {!events.length ? <p className="text-[13px] text-muted-foreground">No requests {view === "today" ? "today" : "this week"}.</p> : null}
                </>
              )}
            </div>

            <VenueBookingSideRail
              venueSlug={venue.slug}
              waitingCount={waitingEvents.length}
              oldestWaitingDays={oldestWaitingDays}
              openingHours={venue.openingHours}
              availability={availability}
            />
          </div>
          <VenueBookingDetailSheet
            event={selectedEvent}
            request={selectedRequest}
            isSaving={confirmingId === selectedEvent?.id}
            onClose={() => { setSelectedEvent(null); setSelectedRequest(null); }}
            onConfirm={() => { if (selectedEvent) void handleConfirm(selectedEvent); }}
            onDecline={() => void handleDeclineSelected()}
            onSuggestTime={() => void handleSuggestSelected()}
          />
        </OwnerVenueTabShell>
      )}
    </OwnerLayout>
  );
}

function readView(value: string | null): BookingCalendarView | null {
  return value && (VIEWS as string[]).includes(value) ? (value as BookingCalendarView) : null;
}

function readDate(value: string | null): Date {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}
