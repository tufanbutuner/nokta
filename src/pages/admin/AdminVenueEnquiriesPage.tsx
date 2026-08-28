import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatAdminVenueEnquiryStatus, formatVenueEnquiryType } from "@/lib/venueEnquiryLabels";
import { cn } from "@/lib/utils";
import { getAdminVenueEnquiries, markVenueEnquiryContacted, markVenueEnquiryResolved, updateVenueEnquiryStatus } from "@/services/adminVenueEnquiryService";
import { useVenues } from "@/hooks/useVenues";
import type { Venue } from "@/types/venue";
import type { VenueEnquiry, VenueEnquiryStatus, VenueEnquiryType } from "@/types/venueEnquiries";

const STATUS_OPTIONS: ("all" | VenueEnquiryStatus)[] = ["all", "new", "contacted", "responded", "converted", "closed", "spam"];
const TYPE_OPTIONS: ("all" | VenueEnquiryType)[] = ["all", "general", "birthday", "group", "football", "late-night", "private-hire"];

export function AdminVenueEnquiriesPage() {
  const { venues, isLoading: isLoadingVenues, error: venuesError } = useVenues();
  const [enquiries, setEnquiries] = useState<VenueEnquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | VenueEnquiryStatus>("all");
  const [type, setType] = useState<"all" | VenueEnquiryType>("all");
  const [selected, setSelected] = useState<VenueEnquiry | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAdminVenueEnquiries()
      .then((next) => {
        if (!cancelled) setEnquiries(next);
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load enquiries.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const venuesById = useMemo<Record<string, Venue | undefined>>(() => Object.fromEntries(venues.map((venue) => [venue.id, venue])), [venues]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return enquiries.filter((enquiry) => {
      const venue = venuesById[enquiry.venueId];
      if (status !== "all" && enquiry.status !== status) return false;
      if (type !== "all" && enquiry.enquiryType !== type) return false;
      if (!normalized) return true;
      return [venue?.name, venue?.city, venue?.area, enquiry.customerName, enquiry.customerEmail, enquiry.customerPhone, enquiry.message, enquiry.venueId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [enquiries, query, status, type, venuesById]);

  async function updateEnquiry(enquiry: VenueEnquiry, nextStatus: VenueEnquiryStatus) {
    setActionError(null);
    try {
      const next =
        nextStatus === "contacted"
          ? await markVenueEnquiryContacted({ enquiryId: enquiry.id, adminNotes })
          : nextStatus === "converted" || nextStatus === "closed" || nextStatus === "spam"
            ? await markVenueEnquiryResolved({ enquiryId: enquiry.id, status: nextStatus, adminNotes })
            : await updateVenueEnquiryStatus({ enquiryId: enquiry.id, status: nextStatus, adminNotes });
      setEnquiries((current) => current.map((item) => (item.id === next.id ? next : item)));
      setSelected(next);
      setAdminNotes(next.adminNotes ?? "");
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not update enquiry.");
    }
  }

  return (
    <AdminPageShell activePath="/admin/enquiries">
      <PageMeta title="Venue Enquiries | Sheesha Admin" description="Manage booking and venue enquiry leads." />
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#8a7e72]">Admin</p>
            <h1 className="mt-1 font-brand text-3xl font-bold tracking-[-0.5px] text-sheesh-ink">Venue enquiries</h1>
          </div>
          <p className="text-sm text-[#8a7e72]">{filtered.length} enquiries</p>
        </div>
        <SummaryCards enquiries={enquiries} />
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search venue, customer, email or message" />
          <Select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} options={STATUS_OPTIONS.map((value) => ({ value, label: value === "all" ? "All statuses" : formatAdminVenueEnquiryStatus(value) }))} />
          <Select value={type} onChange={(event) => setType(event.target.value as typeof type)} options={TYPE_OPTIONS.map((value) => ({ value, label: value === "all" ? "All types" : formatVenueEnquiryType(value) }))} />
        </div>
        {actionError ? <Alert className="border-destructive/30 text-destructive">{actionError}</Alert> : null}
        {venuesError ? <Alert className="border-destructive/30 text-destructive">{venuesError}</Alert> : null}
        {isLoading || isLoadingVenues ? <LoadingState message="Loading enquiries..." /> : error ? <ErrorState message={error} /> : <EnquiryTable enquiries={filtered} venuesById={venuesById} onSelect={(enquiry) => { setSelected(enquiry); setAdminNotes(enquiry.adminNotes ?? ""); }} onStatus={updateEnquiry} />}
      </div>
      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-2xl font-semibold">Enquiry details</h2><p className="mt-1 text-sm text-muted-foreground">{selected.customerName} · {selected.customerEmail}</p></div>
              <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <p><strong>Type:</strong> {formatVenueEnquiryType(selected.enquiryType)}</p>
              <p><strong>Party/date:</strong> {formatPartyDate(selected)}</p>
              <p><strong>Phone:</strong> {selected.customerPhone ?? "Not provided"}</p>
              <p><strong>Message:</strong> {selected.message ?? "No message"}</p>
              <p><strong>Venue response:</strong> {selected.venueResponse ?? "Not recorded"}</p>
              <p><strong>Owner notes:</strong> {selected.ownerNotes ?? "Not recorded"}</p>
              <p><strong>Owner updated:</strong> {selected.ownerLastUpdatedAt ? new Date(selected.ownerLastUpdatedAt).toLocaleString("en-GB") : "Not recorded"}</p>
              <label className="block space-y-2"><span className="font-medium">Admin notes</span><Textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} /></label>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {(["contacted", "responded", "converted", "closed", "spam"] as VenueEnquiryStatus[]).map((nextStatus) => <Button key={nextStatus} variant="outline" onClick={() => updateEnquiry(selected, nextStatus)}>{formatAdminVenueEnquiryStatus(nextStatus)}</Button>)}
            </div>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}

function EnquiryTable({ enquiries, venuesById, onSelect, onStatus }: { enquiries: VenueEnquiry[]; venuesById: Record<string, Venue | undefined>; onSelect: (enquiry: VenueEnquiry) => void; onStatus: (enquiry: VenueEnquiry, status: VenueEnquiryStatus) => void }) {
  if (!enquiries.length) return <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">No enquiries match these filters.</div>;
  return (
    <div className="overflow-hidden rounded-xl border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-sm"><thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Venue</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Party/date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Owner handling</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y">{enquiries.map((enquiry) => { const venue = venuesById[enquiry.venueId]; return <tr key={enquiry.id}><td className="px-4 py-4"><div className="font-medium">{venue?.name ?? enquiry.venueId}</div><div className="mt-1 text-xs text-muted-foreground">{venue ? `${venue.city} · ${venue.area}` : enquiry.venueId}</div></td><td className="px-4 py-4"><div className="font-medium">{enquiry.customerName}</div><div className="mt-1 text-xs text-muted-foreground">{enquiry.customerEmail}</div>{enquiry.customerPhone ? <div className="mt-1 text-xs text-muted-foreground">{enquiry.customerPhone}</div> : null}</td><td className="px-4 py-4">{formatVenueEnquiryType(enquiry.enquiryType)}</td><td className="px-4 py-4 text-muted-foreground">{formatPartyDate(enquiry)}</td><td className="px-4 py-4"><StatusBadge status={enquiry.status} /></td><td className="px-4 py-4 text-xs text-muted-foreground">{formatOwnerHandling(enquiry)}</td><td className="px-4 py-4 text-muted-foreground">{formatDate(enquiry.createdAt)}</td><td className="px-4 py-4"><div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="outline" onClick={() => onSelect(enquiry)}>View details</Button><Button size="sm" variant="ghost" onClick={() => onStatus(enquiry, "contacted")}>Mark contacted</Button>{venue ? <Button asChild size="sm" variant="ghost"><Link to={`/venues/${venue.slug}`}>View venue</Link></Button> : null}</div></td></tr>; })}</tbody></table></div></div>
  );
}

function SummaryCards({ enquiries }: { enquiries: VenueEnquiry[] }) {
  const newCount = enquiries.filter((enquiry) => enquiry.status === "new").length;
  const convertedCount = enquiries.filter((enquiry) => enquiry.status === "converted").length;
  const contactedCount = enquiries.filter((enquiry) => enquiry.status === "contacted").length;
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Total enquiries" value={enquiries.length} /><Metric label="New" value={newCount} /><Metric label="Contacted" value={contactedCount} /><Metric label="Converted" value={convertedCount} /></div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>;
}

function StatusBadge({ status }: { status: VenueEnquiryStatus }) {
  return <span className={cn("inline-flex rounded-full border px-2 py-1 text-xs font-medium", status === "new" && "bg-purple-50 text-purple-950", status === "converted" && "bg-emerald-50 text-emerald-800")}>{formatAdminVenueEnquiryStatus(status)}</span>;
}

function formatOwnerHandling(enquiry: VenueEnquiry) {
  return [
    enquiry.ownerLastUpdatedAt ? `Updated ${formatDate(enquiry.ownerLastUpdatedAt)}` : null,
    enquiry.ownerNotes ? "Owner notes" : null,
    enquiry.venueResponse ? "Venue response" : null,
  ].filter(Boolean).join(" · ") || "No owner activity";
}

function formatPartyDate(enquiry: VenueEnquiry) {
  return [enquiry.partySize ? `${enquiry.partySize} people` : null, enquiry.preferredDate, enquiry.preferredTime].filter(Boolean).join(" · ") || "Flexible";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
