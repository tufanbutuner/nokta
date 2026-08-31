import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { OwnerBookingCalendarLegend } from "@/components/owner/bookings/calendar/OwnerBookingCalendarLegend";
import { OwnerBookingCalendarToolbar, getStatusesForPreset, type BookingCalendarStatusPreset } from "@/components/owner/bookings/calendar/OwnerBookingCalendarToolbar";
import { OwnerBookingMonthView } from "@/components/owner/bookings/calendar/OwnerBookingMonthView";
import { OwnerBookingTodayView } from "@/components/owner/bookings/calendar/OwnerBookingTodayView";
import { OwnerBookingWeekView } from "@/components/owner/bookings/calendar/OwnerBookingWeekView";
import { OwnerBookingFilters, type OwnerBookingFilterState } from "@/components/owner/bookings/OwnerBookingFilters";
import { OwnerBookingRequestsTable } from "@/components/owner/bookings/OwnerBookingRequestsTable";
import { OwnerBookingSummaryCards } from "@/components/owner/bookings/OwnerBookingSummaryCards";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { PageMeta } from "@/components/seo/PageMeta";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { addCalendarPeriod, getBookingCalendarDateRange, toDateInputValue } from "@/lib/bookingCalendarDates";
import { formatBookingRequestDateTime } from "@/lib/bookingRequestLabels";
import { acceptBookingRequest, cancelBookingRequest, declineBookingRequest, getOwnerBookingRequests, markBookingCompleted, markBookingNoShow, proposeBookingAlternative } from "@/services/ownerBookingRequestService";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import type { BookingRequest, BookingRequestStatus } from "@/types/bookingRequests";
import type { BookingCalendarEvent, BookingCalendarView } from "@/types/bookingCalendar";
import type { Venue } from "@/types/venue";

export function OwnerBookingsPage() {
  const { venueId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [selected, setSelected] = useState<BookingRequest | null>(null);
  const [declineTarget, setDeclineTarget] = useState<BookingRequest | null>(null);
  const [proposeTarget, setProposeTarget] = useState<BookingRequest | null>(null);
  const [filters, setFilters] = useState<OwnerBookingFilterState>({ venueId: venueId ?? "all", status: "pending", date: "30d" });
  const [view, setView] = useState<BookingCalendarView>(() => getInitialView(searchParams.get("view")));
  const [anchorDate, setAnchorDate] = useState(() => getInitialDate(searchParams.get("date")));
  const [statusPreset, setStatusPreset] = useState<BookingCalendarStatusPreset>("all_active");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    Promise.all([getMyClaimedVenues(user.id), getOwnerBookingRequests({ ownerUserId: user.id, venueId })])
      .then(([nextVenues, nextBookings]) => {
        if (cancelled) return;
        setVenues(nextVenues);
        setBookings(nextBookings);
        trackEvent("owner_bookings_viewed", { venueId: venueId ?? null });
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load booking requests.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [user, venueId]);

  const venuesById = useMemo(() => Object.fromEntries(venues.map((venue) => [venue.id, venue])), [venues]);
  const filtered = useMemo(() => filterBookings(bookings, filters), [bookings, filters]);
  const calendarRange = useMemo(() => getBookingCalendarDateRange({ view, anchorDate }), [anchorDate, view]);
  const calendarStatuses = useMemo(() => getStatusesForPreset(statusPreset), [statusPreset]);
  const calendarEvents = useMemo(() => bookings
    .filter((booking) => booking.requestedDate >= calendarRange.dateFrom && booking.requestedDate <= calendarRange.dateTo)
    .filter((booking) => filters.venueId === "all" || booking.venueId === filters.venueId)
    .filter((booking) => !calendarStatuses.length || calendarStatuses.includes(booking.status))
    .map((booking) => mapBookingToCalendarEvent(booking, venuesById[booking.venueId]?.name ?? booking.venueId))
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)), [bookings, calendarRange.dateFrom, calendarRange.dateTo, calendarStatuses, filters.venueId, venuesById]);

  function updateUrl(nextView: BookingCalendarView, nextDate: Date) {
    setSearchParams({ view: nextView, date: toDateInputValue(nextDate), ...(filters.venueId !== "all" ? { venueId: filters.venueId } : {}) });
  }

  function handleViewChange(nextView: BookingCalendarView) {
    setView(nextView);
    updateUrl(nextView, anchorDate);
    trackEvent("owner_booking_calendar_view_changed", { view: nextView, dateRange: `${calendarRange.dateFrom}:${calendarRange.dateTo}` });
  }

  function handleAnchorDateChange(nextDate: Date) {
    setAnchorDate(nextDate);
    updateUrl(view, nextDate);
    trackEvent("owner_booking_calendar_date_changed", { view, dateRange: `${calendarRange.dateFrom}:${calendarRange.dateTo}` });
  }

  function handleVenueChange(nextVenueId: string) {
    setFilters((current) => ({ ...current, venueId: nextVenueId }));
    trackEvent("owner_booking_calendar_filter_changed", { view, venueId: nextVenueId });
  }

  function handleEventClick(event: BookingCalendarEvent) {
    const booking = bookings.find((item) => item.id === event.bookingRequestId);
    if (!booking) return;
    setSelected(booking);
    trackEvent("owner_booking_calendar_event_opened", { view, eventStatus: event.status, venueId: event.venueId });
  }

  async function handleStatus(booking: BookingRequest, status: BookingRequestStatus) {
    if (!user) return;
    try {
      const updated =
        status === "accepted" ? await acceptBookingRequest({ ownerUserId: user.id, bookingRequestId: booking.id }) :
        status === "completed" ? await markBookingCompleted({ ownerUserId: user.id, bookingRequestId: booking.id }) :
        status === "no_show" ? await markBookingNoShow({ ownerUserId: user.id, bookingRequestId: booking.id }) :
        status === "cancelled" ? await cancelBookingRequest({ ownerUserId: user.id, bookingRequestId: booking.id }) :
        booking;
      setBookings((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not update booking request.");
    }
  }

  async function handleDecline(message: string | null) {
    if (!user || !declineTarget) return;
    const updated = await declineBookingRequest({ ownerUserId: user.id, bookingRequestId: declineTarget.id, responseMessage: message });
    setBookings((current) => current.map((item) => item.id === updated.id ? updated : item));
    setDeclineTarget(null);
  }

  async function handlePropose(input: { proposedDate: string; proposedTime: string; proposedMessage: string | null }) {
    if (!user || !proposeTarget) return;
    const updated = await proposeBookingAlternative({ ownerUserId: user.id, bookingRequestId: proposeTarget.id, ...input });
    setBookings((current) => current.map((item) => item.id === updated.id ? updated : item));
    setProposeTarget(null);
  }

  return (
    <OwnerLayout>
      <PageMeta title="Booking requests | Sheesha" description="Manage booking requests for your claimed venues." canonicalPath="/owner/bookings" />
      <div className="space-y-6">
        <div><p className="text-sm text-clay-accent">Owner workflow</p><h1 className="mt-1 font-brand text-4xl font-bold tracking-[-0.5px]">Booking requests</h1><p className="mt-2 text-sm text-muted-foreground">Accept, decline or propose another time. Requests are not confirmed until accepted.</p></div>
        {error ? <Alert className="border-destructive/30 text-destructive">{error}</Alert> : null}
        {isLoading ? <p className="text-sm text-muted-foreground">Loading booking requests...</p> : (
          <>
            <OwnerBookingSummaryCards bookings={bookings} />
            <OwnerBookingCalendarToolbar
              view={view}
              anchorDate={anchorDate}
              venues={venues}
              venueId={filters.venueId}
              statusPreset={statusPreset}
              onViewChange={handleViewChange}
              onVenueChange={handleVenueChange}
              onStatusPresetChange={setStatusPreset}
              onPrevious={() => handleAnchorDateChange(addCalendarPeriod({ view, anchorDate, amount: -1 }))}
              onNext={() => handleAnchorDateChange(addCalendarPeriod({ view, anchorDate, amount: 1 }))}
              onToday={() => handleAnchorDateChange(new Date())}
            />
            <OwnerBookingCalendarLegend />
            {view === "today" ? <OwnerBookingTodayView events={calendarEvents} onEventClick={handleEventClick} /> : null}
            {view === "week" ? <OwnerBookingWeekView range={calendarRange} events={calendarEvents} onEventClick={handleEventClick} /> : null}
            {view === "month" ? <OwnerBookingMonthView anchorDate={anchorDate} events={calendarEvents} onEventClick={handleEventClick} onDateClick={(date) => { const nextDate = new Date(`${date}T00:00:00`); setView("today"); handleAnchorDateChange(nextDate); }} /> : null}
            {view === "list" ? (
              <>
                <OwnerBookingFilters venues={venues} value={filters} onChange={setFilters} lockVenue={Boolean(venueId)} />
                <OwnerBookingRequestsTable bookings={filtered} venuesById={venuesById} onView={setSelected} onStatus={handleStatus} onDecline={setDeclineTarget} onPropose={setProposeTarget} />
              </>
            ) : null}
          </>
        )}
      </div>
      {selected ? <BookingDetails booking={selected} venue={venuesById[selected.venueId]} onClose={() => setSelected(null)} /> : null}
      {declineTarget ? <DeclineDialog booking={declineTarget} onClose={() => setDeclineTarget(null)} onSave={handleDecline} /> : null}
      {proposeTarget ? <ProposeDialog booking={proposeTarget} onClose={() => setProposeTarget(null)} onSave={handlePropose} /> : null}
    </OwnerLayout>
  );
}

function getInitialView(value: string | null): BookingCalendarView {
  return value === "today" || value === "month" || value === "list" ? value : "week";
}

function getInitialDate(value: string | null) {
  if (!value) return new Date();
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function mapBookingToCalendarEvent(booking: BookingRequest, venueName: string): BookingCalendarEvent {
  const startsAt = `${booking.requestedDate}T${booking.requestedTime}`;
  return {
    id: booking.id,
    bookingRequestId: booking.id,
    venueId: booking.venueId,
    venueName,
    customerName: booking.customerName,
    partySize: booking.partySize,
    date: booking.requestedDate,
    time: booking.requestedTime,
    startsAt,
    endsAt: null,
    status: booking.status,
    occasion: booking.occasion,
    sourceSurface: booking.sourceSurface,
    isActionRequired: booking.status === "pending" || booking.status === "customer_accepted_alternative",
  };
}

function filterBookings(bookings: BookingRequest[], filters: OwnerBookingFilterState) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const cutoff = filters.date === "7d" ? now.getTime() - 7 * 86400000 : filters.date === "30d" ? now.getTime() - 30 * 86400000 : filters.date === "month" ? monthStart : 0;
  return bookings.filter((booking) => {
    if (filters.venueId !== "all" && booking.venueId !== filters.venueId) return false;
    if (filters.status !== "all" && booking.status !== filters.status) return false;
    if (cutoff && new Date(booking.createdAt).getTime() < cutoff) return false;
    return true;
  });
}

function BookingDetails({ booking, venue, onClose }: { booking: BookingRequest; venue?: Venue; onClose: () => void }) {
  return <Modal title="Booking request" onClose={onClose}><div className="space-y-2 text-sm"><p><strong>Venue:</strong> {venue?.name ?? booking.venueId}</p><p><strong>Reference:</strong> {booking.confirmationReference ?? "Not generated"}</p><p><strong>Customer:</strong> {booking.customerName} • {booking.customerEmail}</p><p><strong>Phone:</strong> {booking.customerPhone ?? "Not provided"}</p><p><strong>Request:</strong> {booking.partySize} people • {formatBookingRequestDateTime(booking.requestedDate, booking.requestedTime)}</p><p><strong>Occasion:</strong> {booking.occasion ?? "General"}</p>{booking.confirmedAt ? <p><strong>Confirmed:</strong> {new Date(booking.confirmedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p> : null}{booking.message ? <p className="whitespace-pre-line"><strong>Message:</strong> {booking.message}</p> : null}{booking.ownerResponseMessage ? <p className="whitespace-pre-line"><strong>Owner response:</strong> {booking.ownerResponseMessage}</p> : null}{booking.proposedDate ? <p><strong>Alternative:</strong> {formatBookingRequestDateTime(booking.proposedDate, booking.proposedTime ?? "")}</p> : null}{booking.customerAlternativeResponseMessage ? <p className="whitespace-pre-line"><strong>Customer response:</strong> {booking.customerAlternativeResponseMessage}</p> : null}</div></Modal>;
}

function DeclineDialog({ booking, onClose, onSave }: { booking: BookingRequest; onClose: () => void; onSave: (message: string | null) => void }) {
  const [message, setMessage] = useState("");
  return <Modal title="Decline booking request" onClose={onClose}><div className="space-y-4"><p className="text-sm text-muted-foreground">{booking.customerName} requested {formatBookingRequestDateTime(booking.requestedDate, booking.requestedTime)}.</p><Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Optional response message" /><Button onClick={() => onSave(message)}>Decline request</Button></div></Modal>;
}

function ProposeDialog({ booking, onClose, onSave }: { booking: BookingRequest; onClose: () => void; onSave: (input: { proposedDate: string; proposedTime: string; proposedMessage: string | null }) => void }) {
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [proposedMessage, setProposedMessage] = useState("");
  return <Modal title="Propose another time" onClose={onClose}><div className="space-y-4"><p className="text-sm text-muted-foreground">Original request: {formatBookingRequestDateTime(booking.requestedDate, booking.requestedTime)}.</p><Input type="date" value={proposedDate} onChange={(event) => setProposedDate(event.target.value)} /><Input type="time" value={proposedTime} onChange={(event) => setProposedTime(event.target.value)} /><Textarea value={proposedMessage} onChange={(event) => setProposedMessage(event.target.value)} placeholder="Optional message" /><Button disabled={!proposedDate || !proposedTime} onClick={() => onSave({ proposedDate, proposedTime, proposedMessage })}>Send alternative</Button></div></Modal>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[1500] grid place-items-center bg-stone-950/40 p-4"><div className="w-full max-w-lg rounded-xl border bg-card p-5 shadow-xl"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{title}</h2><Button variant="ghost" size="sm" onClick={onClose}>Close</Button></div>{children}</div></div>;
}
