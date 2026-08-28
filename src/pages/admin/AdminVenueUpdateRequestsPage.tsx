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
import { useAuth } from "@/context/AuthContext";
import { useVenues } from "@/hooks/useVenues";
import { formatDiffValue, getVenueUpdateDiff } from "@/lib/venueUpdateDiff";
import { formatVenueUpdateRequestStatus } from "@/lib/venueUpdateRequestLabels";
import { approveVenueUpdateRequest, applyVenueUpdateRequest, getAdminVenueUpdateRequests, rejectVenueUpdateRequest } from "@/services/adminVenueUpdateRequestService";
import type { VenueUpdateRequest, VenueUpdateRequestStatus } from "@/types/venueUpdateRequests";

type StatusFilter = "all" | VenueUpdateRequestStatus;

export function AdminVenueUpdateRequestsPage() {
  const { user } = useAuth();
  const { venues } = useVenues();
  const [requests, setRequests] = useState<VenueUpdateRequest[]>([]);
  const [selected, setSelected] = useState<VenueUpdateRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);

  useEffect(() => {
    let cancelled = false;
    getAdminVenueUpdateRequests()
      .then((nextRequests) => { if (!cancelled) setRequests(nextRequests); })
      .catch((caughtError) => { if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load update requests."); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return requests.filter((request) => {
      const venue = venuesById.get(request.venueId);
      if (statusFilter !== "all" && request.status !== statusFilter) return false;
      if (!normalized) return true;
      return [venue?.name, venue?.city, venue?.area, request.submittedBy, Object.keys(request.requestedChanges).join(" ")].filter(Boolean).join(" ").toLowerCase().includes(normalized);
    });
  }, [query, requests, statusFilter, venuesById]);

  async function handleAction(action: "approve" | "reject" | "apply" | "approveApply", request: VenueUpdateRequest) {
    if (!user) return;
    setActionError(null);
    try {
      const updated = action === "approve"
        ? await approveVenueUpdateRequest({ requestId: request.id, adminUserId: user.id, adminNotes })
        : action === "reject"
          ? await rejectVenueUpdateRequest({ requestId: request.id, adminUserId: user.id, adminNotes })
          : action === "approveApply"
            ? await applyVenueUpdateRequest({ requestId: (await approveVenueUpdateRequest({ requestId: request.id, adminUserId: user.id, adminNotes })).id, adminUserId: user.id })
            : await applyVenueUpdateRequest({ requestId: request.id, adminUserId: user.id });
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelected(updated);
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not update request.");
    }
  }

  return (
    <AdminPageShell activePath="/admin/venue-updates">
      <PageMeta title="Venue Updates | Sheesha Admin" description="Review owner-submitted venue profile update requests." />
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-[#8a7e72]">Admin</p>
          <h1 className="mt-1 font-brand text-3xl font-bold tracking-[-0.5px] text-sheesh-ink">Venue updates</h1>
          <p className="mt-2 text-sm text-[#8a7e72]">Review, approve and apply owner profile update requests.</p>
        </div>
        <SummaryCards requests={requests} />
        {actionError ? <Alert className="border-destructive/30 text-destructive">{actionError}</Alert> : null}
        <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search venue, owner or changed fields" />
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} options={[
            { label: "All statuses", value: "all" },
            { label: "Pending", value: "pending" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
            { label: "Cancelled", value: "cancelled" },
            { label: "Applied", value: "applied" },
          ]} />
        </div>
        {isLoading ? <LoadingState message="Loading venue update requests..." /> : error ? <ErrorState message={error} /> : <RequestsTable requests={filtered} venuesById={venuesById} onSelect={(request) => { setSelected(request); setAdminNotes(request.adminNotes ?? ""); }} />}
      </div>
      {selected ? (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-stone-950/45 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-card p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{venuesById.get(selected.venueId)?.name ?? selected.venueId}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{formatVenueUpdateRequestStatus(selected.status)}</p>
              </div>
              <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            </div>
            <div className="mt-5">
              <DiffTable request={selected} />
            </div>
            {selected.requestNotes ? <p className="mt-4 text-sm text-muted-foreground">Owner notes: {selected.requestNotes}</p> : null}
            <label className="mt-4 block space-y-2"><span className="text-sm font-medium">Admin notes</span><Textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} /></label>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => handleAction("approve", selected)}>Approve</Button>
              <Button variant="outline" onClick={() => handleAction("reject", selected)}>Reject</Button>
              <Button onClick={() => handleAction("apply", selected)} disabled={selected.status !== "approved" && selected.status !== "pending"}>Apply</Button>
              <Button onClick={() => handleAction("approveApply", selected)} disabled={selected.status !== "pending"}>Approve and apply</Button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}

function SummaryCards({ requests }: { requests: VenueUpdateRequest[] }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">{(["pending", "approved", "rejected", "cancelled", "applied"] as VenueUpdateRequestStatus[]).map((status) => <Metric key={status} label={formatVenueUpdateRequestStatus(status)} value={requests.filter((request) => request.status === status).length} />)}<Metric label="Total" value={requests.length} /></div>;
}

function RequestsTable({ requests, venuesById, onSelect }: { requests: VenueUpdateRequest[]; venuesById: Map<string, { name: string; city: string; area: string; slug: string }>; onSelect: (request: VenueUpdateRequest) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[920px] text-sm"><thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Venue</th><th className="px-4 py-3">Submitted by</th><th className="px-4 py-3">Changed fields</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y">{requests.map((request) => { const venue = venuesById.get(request.venueId); return <tr key={request.id}><td className="px-4 py-4"><div className="font-medium">{venue?.name ?? request.venueId}</div><div className="mt-1 text-xs text-muted-foreground">{venue ? `${venue.city} · ${venue.area}` : request.venueId}</div></td><td className="px-4 py-4 text-muted-foreground">{request.submittedBy}</td><td className="px-4 py-4">{Object.keys(request.requestedChanges).join(", ")}</td><td className="px-4 py-4">{formatVenueUpdateRequestStatus(request.status)}</td><td className="px-4 py-4 text-muted-foreground">{new Date(request.createdAt).toLocaleDateString("en-GB")}</td><td className="px-4 py-4"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => onSelect(request)}>View diff</Button>{venue ? <Button asChild size="sm" variant="ghost"><Link to={`/venues/${venue.slug}`}>Public</Link></Button> : null}</div></td></tr>; })}</tbody></table></div></div>
  );
}

function DiffTable({ request }: { request: VenueUpdateRequest }) {
  const diff = getVenueUpdateDiff({ original: request.originalSnapshot, requested: request.requestedChanges });
  return <div className="overflow-hidden rounded-lg border"><table className="w-full text-sm"><thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Field</th><th className="px-3 py-2">Current</th><th className="px-3 py-2">Requested</th></tr></thead><tbody className="divide-y">{diff.map((item) => <tr key={item.field}><td className="px-3 py-3 font-medium">{item.label}</td><td className="px-3 py-3 text-muted-foreground">{formatDiffValue(item.before)}</td><td className="px-3 py-3">{formatDiffValue(item.after)}</td></tr>)}</tbody></table></div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>;
}
