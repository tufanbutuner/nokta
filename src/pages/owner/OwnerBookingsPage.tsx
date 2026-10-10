import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { VenueBookingListView, type VenueBookingListFilter } from "@/components/owner/venueBookings/VenueBookingListView";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { getEffectiveBookingSlot, OCCUPYING_BOOKING_STATUSES } from "@/lib/bookingSlot";
import { mapBookingRequestToCalendarEvent } from "@/lib/bookingCalendarMappers";
import { getWaitingDays } from "@/lib/bookingCalendarGeometry";
import { acceptBookingRequest, getOwnerBookingRequests } from "@/services/ownerBookingRequestService";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import type { BookingRequest } from "@/types/bookingRequests";
import type { Venue } from "@/types/venue";

const RANGE_DAYS = 30;
const CONFIRMED_WINDOW_DAYS = 7;

/**
 * The owner's bookings home: every request across every claimed venue, one list.
 * Per-venue calendars stay where they belong — this page's job is the queue.
 */
export function OwnerBookingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<VenueBookingListFilter>("waiting");
  const [venueFilter, setVenueFilter] = useState("all");
  const [isPast, setIsPast] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    if (!user) return;
    const [nextVenues, nextRequests] = await Promise.all([
      getMyClaimedVenues(user.id),
      getOwnerBookingRequests({ ownerUserId: user.id }),
    ]);
    setVenues(nextVenues);
    setRequests(nextRequests);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    load()
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load bookings.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const venueById = useMemo(() => Object.fromEntries(venues.map((venue) => [venue.id, venue])), [venues]);

  const inRange = useMemo(() => {
    const from = shiftDate(today, isPast ? -RANGE_DAYS : 0);
    const to = shiftDate(today, isPast ? -1 : RANGE_DAYS);
    return requests.filter((request) => {
      if (venueFilter !== "all" && request.venueId !== venueFilter) return false;
      const slot = getEffectiveBookingSlot(request);
      return slot.date >= from && slot.date <= to;
    });
  }, [requests, venueFilter, isPast, today]);

  const events = useMemo(
    () => inRange
      .map((request) => mapBookingRequestToCalendarEvent({ bookingRequest: request, venueName: venueById[request.venueId]?.name ?? request.venueId }))
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),
    [inRange, venueById],
  );

  const counts = useMemo(() => ({
    waiting: events.filter((event) => event.status === "pending").length,
    confirmed: events.filter((event) => OCCUPYING_BOOKING_STATUSES.includes(event.status)).length,
    all: events.length,
  }), [events]);

  const listEvents = events.filter((event) => (filter === "waiting" ? event.status === "pending" : filter === "confirmed" ? OCCUPYING_BOOKING_STATUSES.includes(event.status) : true));

  /** Future queue across the whole account, independent of the list window. */
  const waitingQueue = useMemo(
    () => requests
      .filter((request) => request.status === "pending" && (venueFilter === "all" || request.venueId === venueFilter))
      .map((request) => ({ request, slot: getEffectiveBookingSlot(request) }))
      .filter(({ slot }) => slot.date >= today)
      .sort((a, b) => `${a.slot.date}T${a.slot.time}`.localeCompare(`${b.slot.date}T${b.slot.time}`)),
    [requests, venueFilter, today],
  );

  const confirmedAhead = useMemo(
    () => requests.filter((request) => {
      if (!OCCUPYING_BOOKING_STATUSES.includes(request.status)) return false;
      if (venueFilter !== "all" && request.venueId !== venueFilter) return false;
      const slot = getEffectiveBookingSlot(request);
      return slot.date >= today && slot.date <= shiftDate(today, CONFIRMED_WINDOW_DAYS);
    }).length,
    [requests, venueFilter, today],
  );

  async function handleConfirm(eventId: string, bookingRequestId: string) {
    if (!user) return;
    try {
      setConfirmingId(eventId);
      await acceptBookingRequest({ bookingRequestId, ownerUserId: user.id });
      await load();
      window.dispatchEvent(new Event("owner-inbox-updated"));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not confirm that request.");
    } finally {
      setConfirmingId(null);
    }
  }

  function handleOpen(event: { venueId: string; date: string }) {
    const venue = venueById[event.venueId];
    if (!venue) return;
    navigate(`/owner/venues/${venue.slug}/bookings?view=list&date=${event.date}&filter=all`);
  }

  const venueOptions = [{ label: "All venues", value: "all" }, ...venues.map((venue) => ({ label: venue.name, value: venue.id }))];

  return (
    <OwnerLayout>
      <PageMeta title="Bookings | nokta" description="Every booking request across your venues, in one list." canonicalPath="/owner/bookings" />
      {isLoading ? (
        <LoadingState message="Loading bookings..." />
      ) : (
        <div className="flex flex-col gap-[18px]">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-brand text-[25px] font-bold tracking-[-0.4px] text-nokta-ink">Bookings</h1>
              <p className="mt-1 text-[13px] text-nokta-ink-muted">
                {venues.length ? `Requests across ${venues.length} venue${venues.length === 1 ? "" : "s"} — confirm, decline, or open a venue's calendar.` : "No claimed venues yet."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {venues.length === 1 ? (
                <Button asChild variant="outline" className="h-[34px] text-[13px]">
                  <Link to={`/owner/venues/${venues[0].slug}/bookings`}>Calendar &amp; hours</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="h-[34px] text-[13px]">
                  <Link to="/owner/venues">Manage venues</Link>
                </Button>
              )}
            </div>
          </div>

          {error ? <ErrorState message={error} /> : null}

          {!venues.length ? (
            <div className="rounded-xl border bg-card px-5 py-8 text-center">
              <p className="text-[13.5px] text-muted-foreground">Claim a venue to start taking booking requests.</p>
              <Button asChild className="mt-3 h-[34px] text-[13px]">
                <Link to="/owner/venues">Go to My venues</Link>
              </Button>
            </div>
          ) : (
            <>
              {waitingQueue.length ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[oklch(0.87_0.08_75)] bg-[oklch(0.96_0.045_75)] px-[16px] py-[13px]">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-nokta-ink">
                      {waitingQueue.length} request{waitingQueue.length === 1 ? "" : "s"} waiting for a reply
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {(() => {
                        const oldest = waitingQueue[0];
                        const days = oldest ? getWaitingDays(oldest.request.createdAt) : 0;
                        const when = oldest ? `${oldest.slot.date} at ${oldest.slot.time}` : "";
                        return `${when}${days >= 1 ? ` · sent ${days} day${days === 1 ? "" : "s"} ago` : ""} · customers see “awaiting the venue” until you answer.`;
                      })()}
                    </p>
                  </div>
                  <Button type="button" className="h-[32px] shrink-0 text-[12.5px]" onClick={() => { setIsPast(false); setFilter("waiting"); }}>
                    Review them
                  </Button>
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  Nothing waiting. {confirmedAhead} booking{confirmedAhead === 1 ? "" : "s"} confirmed for the next {CONFIRMED_WINDOW_DAYS} days.
                </p>
              )}

              {venues.length > 1 ? (
                <div className="flex justify-end">
                  <div className="w-full max-w-[260px]">
                    <Select value={venueFilter} aria-label="Filter by venue" placeholder="All venues" options={venueOptions} onValueChange={setVenueFilter} />
                  </div>
                </div>
              ) : null}

              <VenueBookingListView
                events={listEvents}
                closures={[]}
                filter={filter}
                counts={counts}
                isPast={isPast}
                confirmingId={confirmingId}
                onChangeFilter={setFilter}
                onTogglePast={() => setIsPast((current) => !current)}
                onConfirm={(event) => void handleConfirm(event.id, event.bookingRequestId)}
                onOpen={(event) => handleOpen(event)}
              />
            </>
          )}
        </div>
      )}
    </OwnerLayout>
  );
}

function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
