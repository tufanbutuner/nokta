import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { supabase } from "@/lib/supabase";
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
  const [cancelTarget, setCancelTarget] = useState<BookingRequest | null>(null);
  const [filters, setFilters] = useState<OwnerBookingFilterState>({ venueId: venueId ?? "all", status: "pending", date: "30d" });
  const [view, setView] = useState<BookingCalendarView>(() => getInitialView(searchParams.get("view")));
  const [anchorDate, setAnchorDate] = useState(() => getInitialDate(searchParams.get("date")));
  const [statusPreset, setStatusPreset] = useState<BookingCalendarStatusPreset>("all_active");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const closingBookingIdRef = useRef<string | null>(null);
  const selectedBookingId = searchParams.get("booking");
  const ownerVenueIds = useMemo(() => new Set(venues.map((venue) => venue.id)), [venues]);

  const loadBookings = useCallback(async (options?: { showLoading?: boolean }) => {
    if (!user) return;
    if (options?.showLoading) setIsLoading(true);
    try {
      const [nextVenues, nextBookings] = await Promise.all([getMyClaimedVenues(user.id), getOwnerBookingRequests({ ownerUserId: user.id, venueId })]);
      setVenues(nextVenues);
      setBookings(nextBookings);
      setSelected((current) => current ? nextBookings.find((booking) => booking.id === current.id) ?? current : current);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not load booking requests.");
    } finally {
      if (options?.showLoading) setIsLoading(false);
    }
  }, [user, venueId]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    loadBookings()
      .then(() => {
        if (cancelled) return;
        trackEvent("owner_bookings_viewed", { venueId: venueId ?? null });
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load booking requests.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [loadBookings, user, venueId]);

  useEffect(() => {
    if (!user) return;
    function refreshOnFocus() {
      void loadBookings();
    }
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [loadBookings, user]);

  useEffect(() => {
    if (!user || !supabase || venues.length === 0) return;
    const client = supabase;
    const channel = client
      .channel(`owner-booking-requests-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "booking_requests" }, (payload: { new: unknown; old: unknown }) => {
        const row = (payload.new ?? payload.old) as { venue_id?: string } | null;
        if (venueId || (row?.venue_id && ownerVenueIds.has(row.venue_id))) void loadBookings();
      })
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [loadBookings, ownerVenueIds, user, venueId, venues.length]);

  useEffect(() => {
    if (!selectedBookingId) {
      closingBookingIdRef.current = null;
      return;
    }
    if (closingBookingIdRef.current === selectedBookingId) return;
    if (!selectedBookingId || !bookings.length || selected?.id === selectedBookingId) return;
    const booking = bookings.find((item) => item.id === selectedBookingId);
    if (booking) setSelected(booking);
  }, [bookings, selected?.id, selectedBookingId]);

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
    closingBookingIdRef.current = null;
    setSelected(booking);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("booking", booking.id);
      return next;
    });
    trackEvent("owner_booking_calendar_event_opened", { view, eventStatus: event.status, venueId: event.venueId });
  }

  function handleSelectBooking(booking: BookingRequest) {
    closingBookingIdRef.current = null;
    setSelected(booking);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("booking", booking.id);
      return next;
    });
  }

  function handleCloseBooking() {
    closingBookingIdRef.current = selected?.id ?? selectedBookingId;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("booking");
      return next;
    });
    setSelected(null);
    setDeclineTarget(null);
    setProposeTarget(null);
    setCancelTarget(null);
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
      setSelected((current) => current?.id === updated.id ? updated : current);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not update booking request.");
    }
  }

  async function handleDecline(message: string | null) {
    if (!user || !declineTarget) return;
    const updated = await declineBookingRequest({ ownerUserId: user.id, bookingRequestId: declineTarget.id, responseMessage: message });
    setBookings((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelected((current) => current?.id === updated.id ? updated : current);
    setDeclineTarget(null);
  }

  async function handlePropose(input: { proposedDate: string; proposedTime: string; proposedMessage: string | null }) {
    if (!user || !proposeTarget) return;
    const updated = await proposeBookingAlternative({ ownerUserId: user.id, bookingRequestId: proposeTarget.id, ...input });
    setBookings((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelected((current) => current?.id === updated.id ? updated : current);
    setProposeTarget(null);
  }

  async function handleCancelConfirmed() {
    if (!user || !cancelTarget) return;
    await handleStatus(cancelTarget, "cancelled");
    setCancelTarget(null);
  }

  return (
    <OwnerLayout>
      <PageMeta title="Booking requests | nokta" description="Manage booking requests for your claimed venues." canonicalPath="/owner/bookings" />
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
                <OwnerBookingRequestsTable bookings={filtered} venuesById={venuesById} onView={handleSelectBooking} onStatus={handleStatus} onDecline={setDeclineTarget} onPropose={setProposeTarget} onCancel={setCancelTarget} />
              </>
            ) : null}
          </>
        )}
      </div>
      {selected ? <BookingDetails booking={selected} venue={venuesById[selected.venueId]} onClose={handleCloseBooking} onStatus={handleStatus} onDecline={setDeclineTarget} onPropose={setProposeTarget} onCancel={setCancelTarget} /> : null}
      {declineTarget ? <DeclineDialog booking={declineTarget} onClose={() => setDeclineTarget(null)} onSave={handleDecline} /> : null}
      {proposeTarget ? <ProposeDialog booking={proposeTarget} onClose={() => setProposeTarget(null)} onSave={handlePropose} /> : null}
      {cancelTarget ? <CancelDialog booking={cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancelConfirmed} /> : null}
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

function BookingDetails({ booking, venue, onClose, onStatus, onDecline, onPropose, onCancel }: { booking: BookingRequest; venue?: Venue; onClose: () => void; onStatus: (booking: BookingRequest, status: BookingRequestStatus) => void; onDecline: (booking: BookingRequest) => void; onPropose: (booking: BookingRequest) => void; onCancel: (booking: BookingRequest) => void }) {
  return (
    <Modal title="Booking request" onClose={onClose}>
      <div className="space-y-5">
        <div className="space-y-2 text-sm">
          <p><strong>Venue:</strong> {venue?.name ?? booking.venueId}</p>
          <p><strong>Reference:</strong> {booking.confirmationReference ?? "Not generated"}</p>
          <p><strong>Customer:</strong> {booking.customerName} • {booking.customerEmail}</p>
          <p><strong>Phone:</strong> {booking.customerPhone ?? "Not provided"}</p>
          <p><strong>Request:</strong> {booking.partySize} people • {formatBookingRequestDateTime(booking.requestedDate, booking.requestedTime)}</p>
          <p><strong>Occasion:</strong> {booking.occasion ?? "General"}</p>
          {booking.confirmedAt ? <p><strong>Confirmed:</strong> {new Date(booking.confirmedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p> : null}
          {booking.message ? <p className="whitespace-pre-line"><strong>Message:</strong> {booking.message}</p> : null}
          {booking.ownerResponseMessage ? <p className="whitespace-pre-line"><strong>Owner response:</strong> {booking.ownerResponseMessage}</p> : null}
          {booking.proposedDate ? <p><strong>Alternative:</strong> {formatBookingRequestDateTime(booking.proposedDate, booking.proposedTime ?? "")}</p> : null}
          {booking.customerAlternativeResponseMessage ? <p className="whitespace-pre-line"><strong>Customer response:</strong> {booking.customerAlternativeResponseMessage}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2 border-t pt-4">
          {booking.status === "pending" ? <Button onClick={() => onStatus(booking, "accepted")}>Accept</Button> : null}
          {booking.status === "pending" ? <Button variant="outline" onClick={() => onDecline(booking)}>Decline</Button> : null}
          {booking.status === "pending" ? <Button variant="outline" onClick={() => onPropose(booking)}>Propose alternative</Button> : null}
          {booking.status === "accepted" || booking.status === "customer_accepted_alternative" ? <Button variant="outline" onClick={() => onStatus(booking, "completed")}>Mark completed</Button> : null}
          {booking.status === "accepted" || booking.status === "customer_accepted_alternative" ? <Button variant="outline" onClick={() => onStatus(booking, "no_show")}>Mark no-show</Button> : null}
          {["accepted", "alternative_proposed", "customer_accepted_alternative"].includes(booking.status) ? <Button variant="outline" onClick={() => onCancel(booking)}>Cancel</Button> : null}
        </div>
      </div>
    </Modal>
  );
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

function CancelDialog({ booking, onClose, onConfirm }: { booking: BookingRequest; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal title="Cancel booking" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Cancel {booking.customerName}'s booking for {formatBookingRequestDateTime(booking.requestedDate, booking.requestedTime)}? This will update the booking status and notify the customer.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>Keep booking</Button>
          <Button className="bg-red-700 text-white hover:bg-red-800" onClick={onConfirm}>Cancel booking</Button>
        </div>
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[1500] grid place-items-center bg-stone-950/40 p-4"><div className="w-full max-w-lg rounded-xl border bg-card p-5 shadow-xl"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{title}</h2><Button variant="ghost" size="sm" onClick={onClose}>Close</Button></div>{children}</div></div>;
}
