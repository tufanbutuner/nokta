import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { OwnerPromotionRequestStatusBadge } from "@/components/owner/promotions/OwnerPromotionRequestStatusBadge";
import { OwnerPromotionRequestTypeBadge } from "@/components/owner/promotions/OwnerPromotionRequestTypeBadge";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { formatOwnerPromotionRequestType } from "@/lib/ownerPromotionRequestLabels";
import { approvePromotionRequest, convertPromotionRequest, getAdminPromotionRequests, rejectPromotionRequest } from "@/services/adminPromotionRequestService";
import { useVenues } from "@/hooks/useVenues";
import type { OwnerPromotionRequest, OwnerPromotionRequestStatus, OwnerPromotionRequestType } from "@/types/ownerPromotionRequests";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "converted", label: "Live" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "promoted_offer", label: "Promoted offer" },
  { value: "featured_placement", label: "Featured placement" },
];

const CITY_OPTIONS = [
  { value: "all", label: "All cities" },
  { value: "London", label: "London" },
  { value: "Birmingham", label: "Birmingham" },
  { value: "Manchester", label: "Manchester" },
  { value: "Leicester", label: "Leicester" },
];

export function AdminPromotionRequestsPage() {
  const { user } = useAuth();
  const { venues } = useVenues();
  const [requests, setRequests] = useState<OwnerPromotionRequest[]>([]);
  const [selected, setSelected] = useState<OwnerPromotionRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getAdminPromotionRequests()
      .then((nextRequests) => {
        if (!cancelled) setRequests(nextRequests);
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load promotion requests.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = requests.filter((request) => {
    const venue = venuesById.get(request.venueId);
    if (statusFilter !== "all" && request.status !== statusFilter) return false;
    if (typeFilter !== "all" && request.requestType !== typeFilter) return false;
    if (cityFilter !== "all" && (request.requestedCity ?? venue?.city) !== cityFilter) return false;
    const haystack = [request.title, request.description, request.ownerNotes, venue?.name, venue?.city, venue?.area].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  async function runAction(request: OwnerPromotionRequest, action: "approve" | "reject" | "convert") {
    if (!user) return;
    setActionError(null);
    try {
      const updated =
        action === "approve"
          ? await approvePromotionRequest({ requestId: request.id, adminUserId: user.id, adminNotes })
          : action === "reject"
            ? await rejectPromotionRequest({ requestId: request.id, adminUserId: user.id, adminNotes })
            : await convertPromotionRequest({ requestId: request.id, adminUserId: user.id });
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelected(updated);
      if (action === "approve") trackEvent("admin_promotion_request_approved", { venueId: request.venueId, requestType: request.requestType, status: updated.status });
      if (action === "reject") trackEvent("admin_promotion_request_rejected", { venueId: request.venueId, requestType: request.requestType, status: updated.status });
      if (action === "convert") trackEvent("admin_promotion_request_converted", { venueId: request.venueId, requestType: request.requestType, status: updated.status });
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not update promotion request.");
    }
  }

  return (
    <AdminPageShell activePath="/admin/promotion-requests">
      <PageMeta title="Promotion Requests | nokta Admin" description="Review owner promotion requests." />
      <div className="space-y-6">
        <div>
          <p className="text-sm text-clay-accent">Admin</p>
          <h1 className="mt-1 font-brand text-3xl font-bold tracking-[-0.5px] text-nokta-ink">Promotion requests</h1>
          <p className="mt-2 text-sm text-[#8a7e72]">Approve, reject, and convert owner requests into draft campaigns.</p>
        </div>
        <SummaryCards requests={requests} />
        <div className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm lg:grid-cols-[1fr_180px_180px_180px]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search venue or request" />
          <Select value={statusFilter} onValueChange={setStatusFilter} options={STATUS_OPTIONS} />
          <Select value={typeFilter} onValueChange={setTypeFilter} options={TYPE_OPTIONS} />
          <Select value={cityFilter} onValueChange={setCityFilter} options={CITY_OPTIONS} />
        </div>
        {actionError ? <ErrorState message={actionError} /> : null}
        {isLoading ? <LoadingState message="Loading promotion requests..." /> : error ? <ErrorState message={error} /> : <RequestTable requests={filtered} venuesById={venuesById} onSelect={(request) => { setSelected(request); setAdminNotes(request.adminNotes ?? ""); }} />}
        {selected ? (
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <OwnerPromotionRequestTypeBadge type={selected.requestType} />
                  <OwnerPromotionRequestStatusBadge status={selected.status} />
                </div>
                <h2 className="mt-3 text-xl font-semibold">{selected.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{venuesById.get(selected.venueId)?.name ?? selected.venueId}</p>
              </div>
              <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            </div>
            <dl className="mt-5 grid gap-4 text-sm lg:grid-cols-2">
              <Detail label="Description" value={selected.description} />
              <Detail label="Terms" value={selected.terms} />
              <Detail label="Placement / offer" value={selected.offerType ?? selected.placementType} />
              <Detail label="Location" value={[selected.requestedCity, selected.requestedArea].filter(Boolean).join(" · ") || null} />
              <Detail label="Requested dates" value={`${formatDate(selected.requestedStartsAt)} to ${formatDate(selected.requestedEndsAt)}`} />
              <Detail label="CTA" value={[selected.ctaLabel, selected.ctaUrl].filter(Boolean).join(" · ") || null} />
              <Detail label="Owner notes" value={selected.ownerNotes} />
              <Detail label="Created record" value={selected.createdOfferId ?? selected.createdFeaturedPlacementId} />
            </dl>
            <label className="mt-5 block">
              <span className="text-sm font-medium">Admin notes</span>
              <Textarea className="mt-2" value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} />
            </label>
            <div className="mt-5 flex flex-wrap gap-2">
              {selected.status === "pending" ? <Button onClick={() => runAction(selected, "approve")}>Approve</Button> : null}
              {selected.status === "pending" ? <Button variant="outline" onClick={() => runAction(selected, "reject")}>Reject</Button> : null}
              {selected.status === "approved" ? <Button onClick={() => runAction(selected, "convert")}>Convert to draft</Button> : null}
              <Button asChild variant="outline"><Link to={`/venues/${venuesById.get(selected.venueId)?.slug ?? selected.venueId}`}>View venue</Link></Button>
            </div>
          </div>
        ) : null}
      </div>
    </AdminPageShell>
  );
}

function RequestTable({ requests, venuesById, onSelect }: { requests: OwnerPromotionRequest[]; venuesById: Map<string, { name: string; city: string; area: string }>; onSelect: (request: OwnerPromotionRequest) => void }) {
  if (!requests.length) return <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">No promotion requests match these filters.</div>;
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <tr><th className="px-4 py-3">Venue</th><th className="px-4 py-3">Request</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Actions</th></tr>
        </thead>
        <tbody className="divide-y">
          {requests.map((request) => {
            const venue = venuesById.get(request.venueId);
            return (
              <tr key={request.id}>
                <td className="px-4 py-4"><div className="font-medium">{venue?.name ?? request.venueId}</div><div className="text-xs text-muted-foreground">{[venue?.city, venue?.area].filter(Boolean).join(" · ")}</div></td>
                <td className="px-4 py-4"><div className="font-medium">{request.title}</div><div className="max-w-xs truncate text-xs text-muted-foreground">{request.description}</div></td>
                <td className="px-4 py-4"><OwnerPromotionRequestTypeBadge type={request.requestType} /></td>
                <td className="px-4 py-4"><OwnerPromotionRequestStatusBadge status={request.status} /></td>
                <td className="px-4 py-4 text-muted-foreground">{formatDate(request.requestedStartsAt)}<br />to {formatDate(request.requestedEndsAt)}</td>
                <td className="px-4 py-4 text-muted-foreground">{formatDate(request.createdAt)}</td>
                <td className="px-4 py-4"><Button size="sm" variant="outline" onClick={() => onSelect(request)}>View details</Button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SummaryCards({ requests }: { requests: OwnerPromotionRequest[] }) {
  const metrics = [
    ["Total requests", requests.length],
    ["Pending", requests.filter((request) => request.status === "pending").length],
    ["Approved", requests.filter((request) => request.status === "approved").length],
    ["Converted", requests.filter((request) => request.status === "converted").length],
    ["Offers", requests.filter((request) => request.requestType === "promoted_offer").length],
    ["Featured", requests.filter((request) => request.requestType === "featured_placement").length],
  ];
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{metrics.map(([label, value]) => <div key={label} className="rounded-xl border bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}</div>;
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value || "Not provided"}</dd></div>;
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
