import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerVenueTabShell } from "@/components/owner/OwnerVenueTabShell";
import { VenueBookingListView, type VenueBookingListFilter } from "@/components/owner/venueBookings/VenueBookingListView";
import { VenueBookingDetailSheet, type SuggestedAlternative } from "@/components/owner/venueBookings/VenueBookingDetailSheet";
import { VenueBookingMonthGrid } from "@/components/owner/venueBookings/VenueBookingMonthGrid";
import { VenueBookingSideRail } from "@/components/owner/venueBookings/VenueBookingSideRail";
import { VenueBookingToolbar } from "@/components/owner/venueBookings/VenueBookingToolbar";
import { VenueBookingWeekGrid } from "@/components/owner/venueBookings/VenueBookingWeekGrid";
import { VenueClosureSheet, type ClosureInput } from "@/components/owner/venueBookings/VenueClosureSheet";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { addCalendarPeriod, formatCalendarHeading, getBookingCalendarDateRange, toDateInputValue } from "@/lib/bookingCalendarDates";
import { mapBookingRequestToCalendarEvent } from "@/lib/bookingCalendarMappers";
import { getWaitingDays, isEventAwaitingReply } from "@/lib/bookingCalendarGeometry";
import { getEffectiveBookingSlot, OCCUPYING_BOOKING_STATUSES } from "@/lib/bookingSlot";
import { createOwnerVenueBookingBlackoutDate, getOwnerVenueBookingAvailability } from "@/services/ownerBookingAvailabilityService";
import { acceptBookingRequest, declineBookingRequest, getOwnerBookingRequest, getOwnerBookingRequests, proposeBookingAlternative } from "@/services/ownerBookingRequestService";
import { getMyClaimedVenue } from "@/services/ownerVenueService";
import type { VenueBookingAvailability } from "@/types/bookingAvailability";
import type { BookingRequest } from "@/types/bookingRequests";
import type { BookingCalendarEvent, BookingCalendarView } from "@/types/bookingCalendar";
import type { Venue } from "@/types/venue";

const VIEWS: BookingCalendarView[] = ["today", "week", "month", "list"];

/** The forward-looking reply queue: today through the next 30 days. */
const QUEUE_DAYS = 30;

export function OwnerVenueBookingsPage() {
  const { user } = useAuth();
  const { venueId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [availability, setAvailability] = useState<VenueBookingAvailability | null>(null);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<BookingCalendarEvent | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClosureOpen, setIsClosureOpen] = useState(false);
  const [isSavingClosure, setIsSavingClosure] = useState(false);
  const [closureError, setClosureError] = useState<string | null>(null);

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

  const refreshRequests = useCallback(async (targetVenueId: string) => {
    if (!user) return;
    const nextRequests = await getOwnerBookingRequests({ ownerUserId: user.id, venueId: targetVenueId });
    setRequests(nextRequests);
  }, [user]);

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
          refreshRequests(nextVenue.id),
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
    // `view` is intentionally excluded: it only shapes which slice of `requests` renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, venueId, refreshRequests]);

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    setSearchParams(params, { replace: true });
  }

  /**
   * Requests are loaded once; every view is a slice of them, so stepping
   * through weeks costs no refetch — only the URL changes.
   */
  const events = useMemo(() => requests
    .map((request) => ({ request, slot: getEffectiveBookingSlot(request) }))
    .filter(({ slot }) => slot.date >= range.dateFrom && slot.date <= range.dateTo)
    .map(({ request }) => mapBookingRequestToCalendarEvent({ bookingRequest: request, venueName: venue?.name ?? request.venueId }))
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),
  [requests, range.dateFrom, range.dateTo, venue?.name]);

  /** The reply queue, independent of which period is on screen. */
  const waitingQueue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const horizon = shiftDate(today, QUEUE_DAYS);
    return requests
      .filter((request) => request.status === "pending")
      .map((request) => ({ request, slot: getEffectiveBookingSlot(request) }))
      .filter(({ slot }) => slot.date >= today && slot.date <= horizon)
      .sort((a, b) => `${a.slot.date}T${a.slot.time}`.localeCompare(`${b.slot.date}T${b.slot.time}`));
  }, [requests]);

  const waitingEvents = events.filter(isEventAwaitingReply);
  const confirmedEvents = events.filter((event) => OCCUPYING_BOOKING_STATUSES.includes(event.status));
  const oldestWaitingDays = waitingQueue.length ? Math.max(...waitingQueue.map(({ request }) => getWaitingDays(request.createdAt))) : null;
  const listEvents = events.filter((event) => (listFilter === "waiting" ? isEventAwaitingReply(event) : listFilter === "confirmed" ? OCCUPYING_BOOKING_STATUSES.includes(event.status) : true));
  const durationMinutes = availability?.settings.defaultBookingDurationMinutes ?? 120;

  async function handleConfirm(event: BookingCalendarEvent) {
    if (!user || !venue) return;
    const previousRequests = requests;
    try {
      setConfirmingId(event.id);
      // Optimistic: flip the block now, roll back if the write fails (a full
      // slot or a lost race lands here and restores the true state).
      setRequests((current) => current.map((item) => (item.id === event.bookingRequestId ? { ...item, status: "accepted", acceptedAt: new Date().toISOString() } : item)));
      await acceptBookingRequest({ bookingRequestId: event.bookingRequestId, ownerUserId: user.id });
      await refreshRequests(venue.id);
      setSelectedEvent((current) => current?.id === event.id ? { ...current, status: "accepted", isActionRequired: false } : current);
    } catch (caughtError) {
      setRequests(previousRequests);
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
    const previousRequests = requests;
    try {
      setConfirmingId(selectedEvent.id);
      setRequests((current) => current.map((item) => (item.id === selectedEvent.bookingRequestId ? { ...item, status: "declined", declinedAt: new Date().toISOString() } : item)));
      await declineBookingRequest({ bookingRequestId: selectedEvent.bookingRequestId, ownerUserId: user.id });
      await refreshRequests(venue.id);
      setSelectedEvent((current) => current ? { ...current, status: "declined", isActionRequired: false } : current);
    } catch (caughtError) {
      setRequests(previousRequests);
      setError(caughtError instanceof Error ? caughtError.message : "Could not decline that request.");
    } finally {
      setConfirmingId(null);
    }
  }

  async function handleSuggestSelected(alternative: SuggestedAlternative) {
    if (!user || !venue || !selectedEvent) return;
    try {
      setConfirmingId(selectedEvent.id);
      await proposeBookingAlternative({
        bookingRequestId: selectedEvent.bookingRequestId,
        ownerUserId: user.id,
        proposedDate: alternative.proposedDate,
        proposedTime: alternative.proposedTime,
        proposedMessage: alternative.proposedMessage,
      });
      await refreshRequests(venue.id);
      setSelectedEvent((current) => current ? { ...current, status: "alternative_proposed", isActionRequired: false } : current);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not suggest another time.");
    } finally {
      setConfirmingId(null);
    }
  }

  async function handleAddClosure(closure: ClosureInput) {
    if (!user || !venue) return;
    try {
      setClosureError(null);
      setIsSavingClosure(true);
      await createOwnerVenueBookingBlackoutDate({
        ownerUserId: user.id,
        venueId: venue.id,
        blackoutDate: { blackoutDate: closure.blackoutDate, reason: closure.reason, isFullDay: true },
      });
      const nextAvailability = await getOwnerVenueBookingAvailability({ ownerUserId: user.id, venueId: venue.id });
      setAvailability(nextAvailability);
      setIsClosureOpen(false);
    } catch (caughtError) {
      setClosureError(caughtError instanceof Error ? caughtError.message : "Could not add that closure.");
    } finally {
      setIsSavingClosure(false);
    }
  }

  const firstWaiting = waitingQueue[0];

  return (
    <OwnerLayout>
      <PageMeta title="Bookings | nokta" description="See requested bookings and set when you take them." canonicalPath={`/owner/venues/${venueId}/bookings`} />
      {isLoading ? <LoadingState message="Loading bookings..." /> : !venue || !availability ? <ErrorState message={error ?? "Could not load bookings."} /> : (
        <OwnerVenueTabShell
          venue={venue}
          title="Bookings"
          actions={
            <>
              <Button asChild variant="outline" className="h-[34px] text-[13px]">
                <Link to={`/owner/venues/${venue.slug}/bookings/rules`}>Booking rules</Link>
              </Button>
              <Button type="button" onClick={() => setIsClosureOpen(true)} className="h-[34px] text-[13px]">Add a closure</Button>
            </>
          }
        >
          <div className="grid gap-[18px] lg:grid-cols-[1fr_274px] lg:items-start">
            <div className="flex min-w-0 flex-col gap-[13px]">
              {error ? <ErrorState message={error} /> : null}

              {waitingQueue.length && firstWaiting ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[oklch(0.87_0.08_75)] bg-[oklch(0.96_0.045_75)] px-4 py-[13px]">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-nokta-ink">
                      {waitingQueue.length} request{waitingQueue.length === 1 ? "" : "s"} waiting for a reply
                    </p>
                    <p className="mt-0.5 text-[12px] leading-[1.5] text-muted-foreground">
                      {oldestWaitingDays && oldestWaitingDays >= 1 ? `Oldest sent ${oldestWaitingDays} day${oldestWaitingDays === 1 ? "" : "s"} ago. ` : ""}
                      Next up: {firstWaiting.slot.date} at {firstWaiting.slot.time}. Customers see “awaiting the venue” until you answer.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateParams({ view: "list", filter: "waiting", date: null, past: null })}
                      className="flex h-8 items-center rounded-lg bg-clay-accent px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-clay-accent/90"
                    >
                      Review waiting
                    </button>
                    <Link to="/owner/inbox?status=needs-reply&type=booking" className="flex h-8 items-center rounded-lg border bg-card px-3 text-[12.5px] font-medium text-nokta-ink transition-colors hover:bg-muted">
                      Open in Inbox
                    </Link>
                  </div>
                </div>
              ) : null}

              <VenueBookingToolbar
                view={view}
                heading={view === "list" ? (isPast ? "Past 30 days" : "Next 30 days") : formatCalendarHeading({ view, anchorDate })}
                subheading={
                  view === "month"
                    ? `${events.length} request${events.length === 1 ? "" : "s"} · ${waitingEvents.length} waiting`
                    : view === "list"
                      ? `${range.dateFrom} – ${range.dateTo}`
                      : `${confirmedEvents.length} confirmed · ${waitingEvents.length} waiting`
                }
                onChangeView={(nextView) => updateParams({ view: nextView })}
                onStep={(amount) => updateParams({ date: toDateInputValue(addCalendarPeriod({ view, anchorDate, amount })) })}
              />

              {view === "list" ? (
                <VenueBookingListView
                  events={listEvents}
                  closures={availability.blackoutDates}
                  filter={listFilter}
                  counts={{ waiting: waitingEvents.length, confirmed: confirmedEvents.length, all: events.length }}
                  isPast={isPast}
                  confirmingId={confirmingId}
                  durationMinutes={durationMinutes}
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
                    durationMinutes={durationMinutes}
                    onEventClick={handleEventClick}
                  />
                  {!events.length ? (
                    <div className="rounded-xl border bg-card px-4 py-5 text-center">
                      <p className="text-[13px] text-muted-foreground">No requests {view === "today" ? "today" : "this week"}.</p>
                      <p className="mt-1 text-[12px] text-muted-foreground/80">
                        Requests appear here the moment customers send them —{" "}
                        <button type="button" className="font-medium text-clay-accent hover:underline" onClick={() => updateParams({ view: "list", filter: "all" })}>
                          see the next 30 days
                        </button>
                        .
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <VenueBookingSideRail
              venueSlug={venue.slug}
              openingHours={venue.openingHours}
              availability={availability}
            />
          </div>
          <VenueBookingDetailSheet
            event={selectedEvent}
            request={selectedRequest}
            isSaving={confirmingId === selectedEvent?.id}
            durationMinutes={durationMinutes}
            onClose={() => { setSelectedEvent(null); setSelectedRequest(null); }}
            onConfirm={() => { if (selectedEvent) void handleConfirm(selectedEvent); }}
            onDecline={() => void handleDeclineSelected()}
            onSuggestTime={(alternative) => void handleSuggestSelected(alternative)}
          />
          <VenueClosureSheet
            open={isClosureOpen}
            isSaving={isSavingClosure}
            error={closureError}
            onOpenChange={setIsClosureOpen}
            onSubmit={handleAddClosure}
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

function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
