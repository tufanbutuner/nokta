import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { OwnerBookingStatusBadge } from "@/components/owner/bookings/OwnerBookingStatusBadge";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useVenues } from "@/hooks/useVenues";
import { trackEvent } from "@/lib/analytics";
import { formatBookingRequestDateTime, formatBookingRequestStatus } from "@/lib/bookingRequestLabels";
import { getAdminBookingRequests, markBookingRequestSpam, updateBookingRequestAdminNotes } from "@/services/adminBookingRequestService";
import type { BookingRequest, BookingRequestStatus } from "@/types/bookingRequests";

const STATUSES: (BookingRequestStatus | "all")[] = ["all", "pending", "accepted", "alternative_proposed", "declined", "cancelled", "completed", "no_show", "spam"];

export function AdminBookingRequestsPage() {
  const { user } = useAuth();
  const { venues } = useVenues();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [status, setStatus] = useState<BookingRequestStatus | "all">("all");
  const [venueId, setVenueId] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<BookingRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminBookingRequests()
      .then((next) => {
        if (!cancelled) {
          setBookings(next);
          trackEvent("admin_bookings_viewed", { status: "all" });
        }
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load booking requests.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const venuesById = useMemo(() => Object.fromEntries(venues.map((venue) => [venue.id, venue])), [venues]);
  const filtered = bookings.filter((booking) => {
    const venue = venuesById[booking.venueId];
    if (status !== "all" && booking.status !== status) return false;
    if (venueId !== "all" && booking.venueId !== venueId) return false;
    if (!query) return true;
    const haystack = [booking.customerName, booking.customerEmail, booking.customerPhone, booking.occasion, booking.confirmationReference, venue?.name, venue?.city, venue?.area].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  async function handleSpam(booking: BookingRequest) {
    if (!user) return;
    const updated = await markBookingRequestSpam({ bookingRequestId: booking.id, adminUserId: user.id, adminNotes: booking.adminNotes });
    setBookings((current) => current.map((item) => item.id === updated.id ? updated : item));
  }

  async function handleNotes() {
    if (!user || !selected) return;
    const updated = await updateBookingRequestAdminNotes({ bookingRequestId: selected.id, adminUserId: user.id, adminNotes });
    setBookings((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelected(updated);
  }

  return (
    <AdminPageShell activePath="/admin/bookings">
      <PageMeta title="Booking Requests | nokta Admin" description="Review booking request workflow activity." />
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-clay-accent">Operations</p><h1 className="mt-1 font-brand text-3xl font-bold tracking-[-0.5px] text-nokta-ink">Booking requests</h1></div><p className="text-sm text-[#8a7e72]">{filtered.length} requests</p></div>
        <section className="grid gap-3 rounded-xl border bg-card p-4 lg:grid-cols-4"><Input placeholder="Search requests" value={query} onChange={(event) => setQuery(event.target.value)} /><Select value={venueId} onValueChange={setVenueId} options={[{ label: "All venues", value: "all" }, ...venues.map((venue) => ({ label: venue.name, value: venue.id }))]} /><Select value={status} onValueChange={(next) => setStatus(next as typeof status)} options={STATUSES.map((item) => ({ label: item === "all" ? "All statuses" : formatBookingRequestStatus(item), value: item }))} /></section>
        {error ? <Alert className="border-destructive/30 text-destructive">{error}</Alert> : null}
        {isLoading ? <p className="text-sm text-muted-foreground">Loading booking requests...</p> : error ? <ErrorState message={error} /> : <AdminBookingTable bookings={filtered} venuesById={venuesById} onSelect={(booking) => { setSelected(booking); setAdminNotes(booking.adminNotes ?? ""); }} onSpam={handleSpam} />}
      </div>
      {selected ? <div className="fixed inset-0 z-[1500] grid place-items-center bg-stone-950/40 p-4"><div className="w-full max-w-lg rounded-xl border bg-card p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">Booking request</h2><Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button></div><div className="space-y-2 text-sm"><p><strong>Reference:</strong> {selected.confirmationReference ?? "Not generated"}</p><p><strong>Customer:</strong> {selected.customerName} • {selected.customerEmail}</p><p><strong>Request:</strong> {selected.partySize} people • {formatBookingRequestDateTime(selected.requestedDate, selected.requestedTime)}</p><p><strong>Status:</strong> {formatBookingRequestStatus(selected.status)}</p><p><strong>Status link:</strong> {selected.customerAccessToken ? `Token set, expires ${selected.customerAccessTokenExpiresAt ? new Date(selected.customerAccessTokenExpiresAt).toLocaleDateString("en-GB") : "unknown"}` : "No token"}</p>{selected.confirmedAt ? <p><strong>Confirmed:</strong> {new Date(selected.confirmedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p> : null}{selected.customerAlternativeResponseMessage ? <p className="whitespace-pre-line"><strong>Customer response:</strong> {selected.customerAlternativeResponseMessage}</p> : null}{selected.message ? <p className="whitespace-pre-line"><strong>Message:</strong> {selected.message}</p> : null}</div><Textarea className="mt-4" value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} placeholder="Admin notes" /><Button className="mt-3" onClick={handleNotes}>Save notes</Button></div></div> : null}
    </AdminPageShell>
  );
}

function AdminBookingTable({ bookings, venuesById, onSelect, onSpam }: { bookings: BookingRequest[]; venuesById: Record<string, { name: string; slug: string; city: string; area: string } | undefined>; onSelect: (booking: BookingRequest) => void; onSpam: (booking: BookingRequest) => void }) {
  if (!bookings.length) return <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">No booking requests match these filters.</div>;
  return <div className="overflow-hidden rounded-xl border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-sm"><thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Venue</th><th className="px-4 py-3">Party/date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Confirmed</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y">{bookings.map((booking) => { const venue = venuesById[booking.venueId]; return <tr key={booking.id}><td className="px-4 py-4"><button className="font-medium hover:text-clay-accent" onClick={() => onSelect(booking)}>{booking.customerName}</button><div className="mt-1 text-xs text-muted-foreground">{booking.customerEmail}</div></td><td className="px-4 py-4 text-muted-foreground">{booking.confirmationReference ?? "Not generated"}</td><td className="px-4 py-4"><div>{venue?.name ?? booking.venueId}</div><div className="mt-1 text-xs text-muted-foreground">{venue ? `${venue.city} • ${venue.area}` : booking.venueId}</div></td><td className="px-4 py-4 text-muted-foreground">{booking.partySize} • {formatBookingRequestDateTime(booking.requestedDate, booking.requestedTime)}</td><td className="px-4 py-4"><OwnerBookingStatusBadge status={booking.status} /></td><td className="px-4 py-4 text-muted-foreground">{booking.confirmedAt ? new Date(booking.confirmedAt).toLocaleDateString("en-GB") : "No"}</td><td className="px-4 py-4 text-muted-foreground">{new Date(booking.createdAt).toLocaleDateString("en-GB")}</td><td className="px-4 py-4"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => onSelect(booking)}>View</Button>{venue ? <Button asChild size="sm" variant="ghost"><Link to={`/venues/${venue.slug}`}>Venue</Link></Button> : null}<Button size="sm" variant="ghost" onClick={() => onSpam(booking)}>Spam</Button></div></td></tr>; })}</tbody></table></div></div>;
}
