import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
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
import { formatBookingRequestDateTime } from "@/lib/bookingRequestLabels";
import { acceptBookingRequest, cancelBookingRequest, declineBookingRequest, getOwnerBookingRequests, markBookingCompleted, markBookingNoShow, proposeBookingAlternative } from "@/services/ownerBookingRequestService";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import type { BookingRequest, BookingRequestStatus } from "@/types/bookingRequests";
import type { Venue } from "@/types/venue";

export function OwnerBookingsPage() {
  const { venueId } = useParams();
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [selected, setSelected] = useState<BookingRequest | null>(null);
  const [declineTarget, setDeclineTarget] = useState<BookingRequest | null>(null);
  const [proposeTarget, setProposeTarget] = useState<BookingRequest | null>(null);
  const [filters, setFilters] = useState<OwnerBookingFilterState>({ venueId: venueId ?? "all", status: "pending", date: "30d" });
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
            <OwnerBookingFilters venues={venues} value={filters} onChange={setFilters} lockVenue={Boolean(venueId)} />
            <OwnerBookingRequestsTable bookings={filtered} venuesById={venuesById} onView={setSelected} onStatus={handleStatus} onDecline={setDeclineTarget} onPropose={setProposeTarget} />
          </>
        )}
      </div>
      {selected ? <BookingDetails booking={selected} venue={venuesById[selected.venueId]} onClose={() => setSelected(null)} /> : null}
      {declineTarget ? <DeclineDialog booking={declineTarget} onClose={() => setDeclineTarget(null)} onSave={handleDecline} /> : null}
      {proposeTarget ? <ProposeDialog booking={proposeTarget} onClose={() => setProposeTarget(null)} onSave={handlePropose} /> : null}
    </OwnerLayout>
  );
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
  return <Modal title="Booking request" onClose={onClose}><div className="space-y-2 text-sm"><p><strong>Venue:</strong> {venue?.name ?? booking.venueId}</p><p><strong>Customer:</strong> {booking.customerName} • {booking.customerEmail}</p><p><strong>Phone:</strong> {booking.customerPhone ?? "Not provided"}</p><p><strong>Request:</strong> {booking.partySize} people • {formatBookingRequestDateTime(booking.requestedDate, booking.requestedTime)}</p><p><strong>Occasion:</strong> {booking.occasion ?? "General"}</p>{booking.message ? <p className="whitespace-pre-line"><strong>Message:</strong> {booking.message}</p> : null}{booking.proposedDate ? <p><strong>Alternative:</strong> {formatBookingRequestDateTime(booking.proposedDate, booking.proposedTime ?? "")}</p> : null}</div></Modal>;
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
