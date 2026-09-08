import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { OwnerInboxDetail } from "@/components/owner/inbox/OwnerInboxDetail";
import { OwnerInboxList } from "@/components/owner/inbox/OwnerInboxList";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { filterOwnerInboxItems, getOwnerInboxName, getOwnerInboxPreview, getOwnerInboxStatus } from "@/lib/ownerInbox";
import { cn } from "@/lib/utils";
import { acceptBookingRequest, declineBookingRequest, getOwnerBookingRequests, proposeBookingAlternative, replyToBookingRequest } from "@/services/ownerBookingRequestService";
import { getOwnerInboxEnquiries } from "@/services/ownerInboxService";
import { getOwnerVenueSubscriptions } from "@/services/ownerSubscriptionService";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import { updateOwnerVenueEnquiryStatus } from "@/services/ownerVenueEnquiryService";
import type { BookingRequestStatus } from "@/types/bookingRequests";
import type { OwnerInboxFilter, OwnerInboxItem, OwnerInboxTypeFilter } from "@/types/ownerInbox";
import type { VenueSubscription } from "@/types/subscriptions";
import type { VenueEnquiryStatus } from "@/types/venueEnquiries";
import type { Venue } from "@/types/venue";

export function OwnerEnquiriesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [subscriptions, setSubscriptions] = useState<VenueSubscription[]>([]);
  const [items, setItems] = useState<OwnerInboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = parseStatus(searchParams.get("filter"));
  const type = parseType(searchParams.get("type"));
  const venueParam = searchParams.get("venue") ?? "all";
  const selectedId = searchParams.get("item");

  const loadInbox = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [nextVenues, bookings, enquiries, nextSubscriptions] = await Promise.all([
        getMyClaimedVenues(user.id),
        getOwnerBookingRequests({ ownerUserId: user.id }),
        getOwnerInboxEnquiries(user.id),
        getOwnerVenueSubscriptions(user.id),
      ]);
      setVenues(nextVenues);
      setSubscriptions(nextSubscriptions);
      setItems([
        ...bookings.map((booking): OwnerInboxItem => ({ id: booking.id, type: "booking", venueId: booking.venueId, createdAt: booking.createdAt, booking })),
        ...enquiries.map((enquiry): OwnerInboxItem => ({ id: enquiry.id, type: "enquiry", venueId: enquiry.venueId, createdAt: enquiry.createdAt, enquiry })),
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not load the inbox.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { void loadInbox(); }, [loadInbox]);

  const venuesById = useMemo(() => Object.fromEntries(venues.map((venue) => [venue.id, venue])), [venues]);
  const selectedVenueId = useMemo(() => venues.find((venue) => venue.id === venueParam || venue.slug === venueParam)?.id ?? "all", [venueParam, venues]);
  const filtered = useMemo(() => filterOwnerInboxItems(items, { status, type, venueId: selectedVenueId }), [items, selectedVenueId, status, type]);
  const selected = useMemo(() => filtered.find((item) => item.id === selectedId) ?? null, [filtered, selectedId]);
  const counts = useMemo(() => ({
    needsReply: filterOwnerInboxItems(items, { status: "needs-reply", type: "all", venueId: "all" }).length,
    open: filterOwnerInboxItems(items, { status: "open", type: "all", venueId: "all" }).length,
    closed: filterOwnerInboxItems(items, { status: "closed", type: "all", venueId: "all" }).length,
  }), [items]);

  useEffect(() => {
    if (!isDesktop || isLoading || selected || !filtered.length || selectedId) return;
    updateQuery({ item: filtered[0].id }, true);
  }, [filtered, isDesktop, isLoading, selected, selectedId]);

  function updateQuery(updates: Record<string, string | null>, replace = false) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(updates).forEach(([key, value]) => value && value !== "all" ? next.set(key, value) : next.delete(key));
      return next;
    }, { replace });
  }

  function chooseFilter(nextStatus: OwnerInboxFilter) {
    updateQuery({ filter: nextStatus === "needs-reply" ? null : nextStatus, item: null });
  }

  async function handleBookingStatus(item: OwnerInboxItem, nextStatus: BookingRequestStatus, response?: string) {
    if (!user || item.type !== "booking") return;
    const previous = item.booking;
    optimisticallyUpdate(item.id, (current) => current.type === "booking" ? { ...current, booking: { ...current.booking, status: nextStatus, ownerResponseMessage: response ?? current.booking.ownerResponseMessage } } : current);
    setIsSaving(true);
    try {
      const updated = nextStatus === "accepted"
        ? await acceptBookingRequest({ ownerUserId: user.id, bookingRequestId: item.id, responseMessage: response })
        : await declineBookingRequest({ ownerUserId: user.id, bookingRequestId: item.id, responseMessage: response });
      replaceBooking(updated.id, updated);
      window.dispatchEvent(new Event("owner-inbox-updated"));
    } catch (caughtError) {
      replaceBooking(previous.id, previous);
      setError(caughtError instanceof Error ? caughtError.message : "Could not update booking request.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSuggestTime(item: OwnerInboxItem) {
    if (!user || item.type !== "booking") return;
    const proposedDate = window.prompt("Suggest a date (YYYY-MM-DD)", item.booking.requestedDate);
    if (!proposedDate) return;
    const proposedTime = window.prompt("Suggest a time (HH:MM)", item.booking.requestedTime);
    if (!proposedTime) return;
    const previous = item.booking;
    optimisticallyUpdate(item.id, (current) => current.type === "booking" ? { ...current, booking: { ...current.booking, status: "alternative_proposed", proposedDate, proposedTime } } : current);
    setIsSaving(true);
    try {
      const updated = await proposeBookingAlternative({ ownerUserId: user.id, bookingRequestId: item.id, proposedDate, proposedTime });
      replaceBooking(updated.id, updated);
      window.dispatchEvent(new Event("owner-inbox-updated"));
    } catch (caughtError) {
      replaceBooking(previous.id, previous);
      setError(caughtError instanceof Error ? caughtError.message : "Could not suggest another time.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleBookingReply(item: OwnerInboxItem, response: string) {
    if (!user || item.type !== "booking") return;
    if (item.booking.status === "pending") return handleBookingStatus(item, "accepted", response);
    const previous = item.booking;
    optimisticallyUpdate(item.id, (current) => current.type === "booking" ? { ...current, booking: { ...current.booking, ownerResponseMessage: response } } : current);
    setIsSaving(true);
    try {
      const updated = await replyToBookingRequest({ ownerUserId: user.id, bookingRequestId: item.id, responseMessage: response });
      replaceBooking(updated.id, updated);
    } catch (caughtError) {
      replaceBooking(previous.id, previous);
      setError(caughtError instanceof Error ? caughtError.message : "Could not send reply.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEnquiryStatus(item: OwnerInboxItem, nextStatus: VenueEnquiryStatus, response?: string) {
    if (!user || item.type !== "enquiry" || !item.enquiry.hasFullAccess) return;
    const previous = item.enquiry;
    optimisticallyUpdate(item.id, (current) => current.type === "enquiry" ? { ...current, enquiry: { ...current.enquiry, status: nextStatus, venueResponse: response ?? current.enquiry.venueResponse } } : current);
    setIsSaving(true);
    try {
      const updated = await updateOwnerVenueEnquiryStatus({ userId: user.id, enquiryId: item.id, status: nextStatus, venueResponse: response });
      setItems((current) => current.map((candidate) => candidate.id === item.id && candidate.type === "enquiry" ? { ...candidate, enquiry: { ...candidate.enquiry, status: updated.status, venueResponse: updated.venueResponse, updatedAt: updated.updatedAt } } : candidate));
      window.dispatchEvent(new Event("owner-inbox-updated"));
    } catch (caughtError) {
      setItems((current) => current.map((candidate) => candidate.id === item.id && candidate.type === "enquiry" ? { ...candidate, enquiry: previous } : candidate));
      setError(caughtError instanceof Error ? caughtError.message : "Could not update enquiry.");
    } finally {
      setIsSaving(false);
    }
  }

  function optimisticallyUpdate(id: string, updater: (item: OwnerInboxItem) => OwnerInboxItem) {
    setItems((current) => current.map((item) => item.id === id ? updater(item) : item));
  }

  function replaceBooking(id: string, booking: Extract<OwnerInboxItem, { type: "booking" }>["booking"]) {
    setItems((current) => current.map((item) => item.id === id && item.type === "booking" ? { ...item, booking } : item));
  }

  function exportCsv() {
    const rows = [["Type", "Customer", "Venue", "Status", "Received", "Preview"], ...filtered.map((item) => [item.type, getOwnerInboxName(item), venuesById[item.venueId]?.name ?? "", getOwnerInboxStatus(item), item.createdAt, getOwnerInboxPreview(item)])];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `nokta-inbox-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const selectedSubscription = selected ? subscriptions.find((subscription) => subscription.venueId === selected.venueId) : null;

  return (
    <OwnerLayout>
      <PageMeta title="Inbox | nokta" description="Manage booking requests and enquiries for your venues." canonicalPath="/owner/inbox" />
      <div className="-mx-4 -my-5 sm:-mx-6 lg:-mx-8">
        <header className="border-b bg-background px-4 pb-[14px] pt-4 sm:px-6 lg:px-[26px]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h1 className="font-brand text-[25px] font-bold">Inbox</h1><p className="mt-1 text-[12.5px] text-muted-foreground">Booking requests and enquiries, {venues.length === 1 ? venues[0]?.name : "all venues"}</p></div>
            <Button variant="outline" className="h-[34px] px-[13px] text-[13px]" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
          </div>
          <div className="mt-[14px] flex flex-wrap items-center gap-[7px]">
            <FilterPill active={status === "needs-reply"} onClick={() => chooseFilter("needs-reply")}>Needs reply <Count value={counts.needsReply} active={status === "needs-reply"} /></FilterPill>
            <FilterPill active={status === "open"} onClick={() => chooseFilter("open")}>All open <Count value={counts.open} active={status === "open"} /></FilterPill>
            <FilterPill active={status === "closed"} onClick={() => chooseFilter("closed")}>Closed <Count value={counts.closed} active={status === "closed"} /></FilterPill>
            <span className="mx-1 h-5 w-px bg-border" />
            <FilterPill active={type === "booking"} onClick={() => updateQuery({ type: type === "booking" ? null : "booking", item: null })}>Bookings</FilterPill>
            <FilterPill active={type === "enquiry"} onClick={() => updateQuery({ type: type === "enquiry" ? null : "enquiry", item: null })}>Enquiries</FilterPill>
            {venues.length > 1 ? <select aria-label="Filter by venue" value={selectedVenueId} onChange={(event) => updateQuery({ venue: event.target.value === "all" ? null : venuesById[event.target.value]?.slug ?? event.target.value, item: null })} className="h-[31px] rounded-full border bg-card px-3 text-[12.5px]"><option value="all">All venues</option>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}</select> : null}
          </div>
        </header>

        {error ? <div className="p-4"><ErrorState message={error} /></div> : null}
        <div className="grid min-h-[calc(100vh-190px)] lg:grid-cols-[400px_1fr]">
          <aside className={cn("overflow-y-auto border-r bg-[oklch(0.975_0.008_60)]", selected && "hidden lg:block")}>
            {isLoading ? <div className="p-4"><LoadingState message="Loading inbox…" /></div> : <OwnerInboxList items={filtered} selectedId={selected?.id ?? null} venuesById={venuesById} onSelect={(item) => updateQuery({ item: item.id })} emptyState={status === "needs-reply" ? <span>Nothing needs a reply. <button type="button" className="font-medium text-clay-accent hover:underline" onClick={() => chooseFilter("open")}>View all open</button></span> : undefined} />}
          </aside>
          <main className={cn("min-w-0 bg-nokta-page-bg", !selected && "hidden lg:block")}>
            {selected ? (
              <OwnerInboxDetail
                item={selected}
                venue={venuesById[selected.venueId]}
                currentPlan={selectedSubscription?.plan ?? "free"}
                isSaving={isSaving}
                onBack={() => updateQuery({ item: null })}
                onBookingStatus={(nextStatus, response) => handleBookingStatus(selected, nextStatus, response)}
                onSuggestTime={() => handleSuggestTime(selected)}
                onEnquiryStatus={(nextStatus) => handleEnquiryStatus(selected, nextStatus)}
                onSendReply={(message) => selected.type === "booking" ? handleBookingReply(selected, message) : handleEnquiryStatus(selected, "responded", message)}
              />
            ) : <div className="flex min-h-[360px] items-center justify-center p-8 text-[13px] text-muted-foreground">Select a request to see its details.</div>}
          </main>
        </div>
      </div>
    </OwnerLayout>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("flex h-[31px] items-center gap-1.5 rounded-full border bg-card px-3 text-[12.5px]", active && "border-nokta-ink bg-nokta-ink font-medium text-white")}>{children}</button>;
}

function Count({ value, active }: { value: number; active: boolean }) {
  return <span className={cn("rounded-full bg-black/5 px-1.5 text-[10.5px]", active && "bg-white/20")}>{value}</span>;
}

function parseStatus(value: string | null): OwnerInboxFilter {
  return value === "open" || value === "closed" ? value : "needs-reply";
}

function parseType(value: string | null): OwnerInboxTypeFilter {
  return value === "booking" || value === "enquiry" ? value : "all";
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
