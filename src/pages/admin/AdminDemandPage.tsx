import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CitySelector } from "@/components/search/CitySelector";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useVenues } from "@/hooks/useVenues";
import { formatBookingRequestStatus } from "@/lib/bookingRequestLabels";
import { DEFAULT_CITY } from "@/lib/cities";
import { formatPartnerTier } from "@/lib/monetisationLabels";
import { cn } from "@/lib/utils";
import { formatAdminVenueEnquiryStatus, formatVenueEnquiryType } from "@/lib/venueEnquiryLabels";
import { getAdminBookingRequests, markBookingRequestSpam, updateBookingRequestAdminNotes } from "@/services/adminBookingRequestService";
import { getAdminVenueEnquiries, markVenueEnquiryResolved, updateVenueEnquiryAdminNotes } from "@/services/adminVenueEnquiryService";
import type { BookingRequest } from "@/types/bookingRequests";
import type { Venue } from "@/types/venue";
import type { VenueEnquiry } from "@/types/venueEnquiries";

type DemandKind = "booking" | "enquiry";
type DemandState = "unanswered" | "all" | "spam";

interface DemandItem {
  id: string;
  kind: DemandKind;
  venueId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerDetail: string;
  message: string | null;
  reference: string | null;
  status: string;
  createdAt: string;
  ownerUpdatedAt: string | null;
  adminNotes: string | null;
  raw: BookingRequest | VenueEnquiry;
}

const RANGE_OPTIONS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
];

export function AdminDemandPage() {
  const { user } = useAuth();
  const { venues, isLoading: venuesLoading, error: venuesError } = useVenues();
  const [params, setParams] = useSearchParams();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [enquiries, setEnquiries] = useState<VenueEnquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const city = params.get("city") ?? DEFAULT_CITY;
  const rangeDays = readRange(params.get("range"));
  const state = readState(params.get("state"));
  const kind = readKind(params.get("kind"));
  const search = params.get("q") ?? "";
  const selectedId = params.get("item");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([getAdminBookingRequests(), getAdminVenueEnquiries()])
      .then(([nextBookings, nextEnquiries]) => {
        if (!cancelled) {
          setBookings(nextBookings);
          setEnquiries(nextEnquiries);
        }
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load demand.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const venuesById = useMemo<Record<string, Venue>>(() => Object.fromEntries(venues.map((venue) => [venue.id, venue])), [venues]);
  const allItems = useMemo(() => [...bookings.map(mapBooking), ...enquiries.map(mapEnquiry)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [bookings, enquiries]);
  const baseItems = useMemo(() => {
    const cutoff = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
    return allItems.filter((item) => {
      const venue = venuesById[item.venueId];
      return venue?.city === city && new Date(item.createdAt).getTime() >= cutoff;
    });
  }, [allItems, city, rangeDays, venuesById]);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return baseItems.filter((item) => {
      if (state === "unanswered" && !isUnanswered(item)) return false;
      if (state === "spam" && item.status !== "spam") return false;
      if (kind && item.kind !== kind) return false;
      if (!term) return true;
      const venue = venuesById[item.venueId];
      return [venue?.name, item.customerName, item.customerEmail, item.customerPhone, item.customerDetail, item.reference, item.message]
        .filter(Boolean).join(" ").toLowerCase().includes(term);
    });
  }, [baseItems, kind, search, state, venuesById]);

  const selected = visibleItems.find((item) => item.id === selectedId) ?? null;
  useEffect(() => { setAdminNotes(selected?.adminNotes ?? ""); }, [selected?.id, selected?.adminNotes]);

  const metrics = useMemo(() => getMetrics(baseItems, venuesById), [baseItems, venuesById]);
  const slowest = useMemo(() => getSlowestVenues(baseItems, venuesById), [baseItems, venuesById]);
  const outreach = useMemo(() => getOutreachRows(baseItems, venuesById), [baseItems, venuesById]);

  function updateParams(next: Record<string, string | null>) {
    const copy = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) value === null ? copy.delete(key) : copy.set(key, value);
    setParams(copy, { replace: true });
  }

  async function saveNotes(markSpam = false) {
    if (!user || !selected) return;
    try {
      setIsSaving(true);
      setError(null);
      if (selected.kind === "booking") {
        const booking = selected.raw as BookingRequest;
        const updated = markSpam
          ? await markBookingRequestSpam({ bookingRequestId: selected.id, adminUserId: user.id, adminNotes })
          : await updateBookingRequestAdminNotes({ bookingRequestId: selected.id, adminUserId: user.id, adminNotes });
        setBookings((current) => current.map((item) => item.id === updated.id ? updated : item));
      } else {
        const updated = markSpam
          ? await markVenueEnquiryResolved({ enquiryId: selected.id, status: "spam", adminNotes })
          : await updateVenueEnquiryAdminNotes({ enquiryId: selected.id, adminNotes });
        setEnquiries((current) => current.map((item) => item.id === updated.id ? updated : item));
      }
      if (markSpam) updateParams({ item: null });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not update demand item.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminPageShell activePath="/admin/demand">
      <PageMeta title="Demand | nokta admin" description="Track whether venues are answering customer demand." canonicalPath="/admin/demand" />
      <div className="space-y-[14px] py-1">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-brand text-[25px] font-bold tracking-[-0.4px] text-nokta-ink">Demand</h1>
            <p className="mt-1 text-[12.5px] text-muted-foreground">Is customer demand being answered, and where isn’t it?</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-[150px]"><CitySelector value={city} onChange={(value) => updateParams({ city: value, item: null })} /></div>
            <Select value={String(rangeDays)} onValueChange={(value) => updateParams({ range: value, item: null })} options={RANGE_OPTIONS} className="h-[34px] w-[140px]" />
            <Button variant="outline" className="h-[34px] text-[13px]" onClick={() => exportDemandCsv(baseItems, venuesById)}>Export CSV</Button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Sent to venues" value={String(baseItems.length)} sub={`${metrics.bookingCount} bookings · ${metrics.enquiryCount} enquiries`} />
          <Metric label="Answered by the venue" value={`${metrics.answeredRate}%`} sub={`${metrics.answeredCount} with owner activity`} />
          <Metric label="Median reply time" value={formatDuration(metrics.medianReplyMs)} sub="submitted → first owner update" />
          <Metric label="Unanswered over 48h" value={String(metrics.overdue.length)} sub={`at ${metrics.overdueVenueCount} venues · ${metrics.unclaimedVenueCount} unclaimed`} alert />
        </section>

        <div className="grid gap-[14px] xl:grid-cols-[minmax(0,1fr)_292px] xl:items-start">
          <section className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-[7px]">
              {(["unanswered", "all", "spam"] as DemandState[]).map((value) => (
                <FilterPill key={value} active={state === value} onClick={() => updateParams({ state: value === "unanswered" ? null : value, item: null })}>
                  {value === "unanswered" ? "Unanswered" : value === "all" ? "All" : "Spam"}
                  <span className={cn("ml-1.5 rounded-full px-1.5", state === value ? "bg-white/20" : "bg-black/5")}>{countState(baseItems, value)}</span>
                </FilterPill>
              ))}
              <span className="mx-1 h-5 w-px bg-border" />
              {(["booking", "enquiry"] as DemandKind[]).map((value) => <FilterPill key={value} active={kind === value} onClick={() => updateParams({ kind: kind === value ? null : value, item: null })}>{value === "booking" ? "Bookings" : "Enquiries"}</FilterPill>)}
              <Input value={search} onChange={(event) => updateParams({ q: event.target.value || null, item: null })} placeholder="Search venue, customer or reference" className="h-[34px] min-w-[220px] flex-1 text-[12.5px]" />
            </div>

            {error || venuesError ? <ErrorState message={error ?? venuesError ?? "Could not load demand."} /> : null}
            {isLoading || venuesLoading ? <LoadingState message="Loading demand..." /> : <DemandTable items={visibleItems} venuesById={venuesById} onOpen={(item) => updateParams({ item: item.id })} />}
          </section>

          <aside className="flex flex-col gap-3">
            <section className="rounded-xl bg-nokta-ink px-[15px] py-[14px] text-clay-50">
              <p className="text-[10px] font-semibold uppercase tracking-[1.6px] text-clay-200/75">Outreach list</p>
              <h2 className="mt-2 text-[15px] font-semibold">{outreach.length} unclaimed venues have demand</h2>
              <p className="mt-1.5 text-[11.5px] leading-[1.55] text-clay-50/65">{outreach.reduce((total, row) => total + row.count, 0)} requests nobody can answer until those venues are claimed.</p>
              <Button className="mt-3 h-[32px] text-[12px]" disabled={!outreach.length} onClick={() => exportOutreachCsv(outreach)}>Export leads</Button>
            </section>
            <InfoCard title="Slowest to reply">
              {slowest.length ? slowest.map((row) => <div key={row.venueId} className="flex justify-between gap-3 py-1"><span className="truncate">{row.name}</span><strong className={cn("flex-none font-semibold", row.averageMs > 24 * 60 * 60 * 1000 && "text-[oklch(0.48_0.11_75)]")}>{formatDuration(row.averageMs)}</strong></div>) : <p>No owner replies in this range.</p>}
              <p className="mt-2 border-t pt-2">Claimed venues only. Use this beside their plan in Commercial.</p>
            </InfoCard>
            <InfoCard title="You can’t reply from here">
              <p>Admin can add internal notes or mark spam. Customer replies stay with the venue, and customer PII is never sent to analytics.</p>
            </InfoCard>
          </aside>
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-[1600] grid place-items-center bg-stone-950/40 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4"><div><TypeChip kind={selected.kind} /><h2 className="mt-2 font-brand text-xl font-bold">{selected.customerName}</h2><p className="mt-1 text-[12.5px] text-muted-foreground">{venuesById[selected.venueId]?.name ?? selected.venueId} · {formatStatus(selected)}</p></div><Button variant="ghost" onClick={() => updateParams({ item: null })}>Close</Button></div>
            <dl className="mt-4 grid gap-3 rounded-xl border p-4 text-[13px] sm:grid-cols-2"><Detail label="Email" value={selected.customerEmail} /><Detail label="Phone" value={selected.customerPhone} /><Detail label="Request" value={selected.customerDetail} /><Detail label="Reference" value={selected.reference} /></dl>
            {selected.message ? <div className="mt-3 rounded-xl border p-4"><p className="text-[10.5px] font-semibold uppercase tracking-[1px] text-muted-foreground">Customer message</p><p className="mt-2 whitespace-pre-wrap text-[13px] leading-[1.6]">{selected.message}</p></div> : null}
            <label className="mt-3 block"><span className="text-[13px] font-semibold">Internal admin note</span><Textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} className="mt-2 min-h-20" /></label>
            <div className="mt-4 flex justify-end gap-2"><Button variant="outline" disabled={isSaving || selected.status === "spam"} onClick={() => saveNotes(true)}>Mark spam</Button><Button disabled={isSaving} onClick={() => saveNotes(false)}>{isSaving ? "Saving…" : "Save note"}</Button></div>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}

function DemandTable({ items, venuesById, onOpen }: { items: DemandItem[]; venuesById: Record<string, Venue>; onOpen: (item: DemandItem) => void }) {
  if (!items.length) return <div className="rounded-xl border bg-card p-8 text-center text-[13px] text-muted-foreground">No demand matches these filters.</div>;
  return <div className="overflow-hidden rounded-xl border bg-card"><div className="hidden grid-cols-[1.5fr_92px_1fr_96px_104px_62px] gap-3 border-b bg-[oklch(0.97_0.012_60)] px-4 py-[9px] text-[10.5px] font-semibold uppercase tracking-[0.5px] text-muted-foreground lg:grid"><span>Venue</span><span>Type</span><span>Customer</span><span>Sent</span><span>Status</span><span /></div>{items.map((item) => { const venue = venuesById[item.venueId]; const overdue = isUnanswered(item) && ageMs(item) > 48 * 60 * 60 * 1000; return <button key={`${item.kind}-${item.id}`} type="button" onClick={() => onOpen(item)} className={cn("grid w-full gap-2 border-b border-l-[3px] border-l-transparent px-4 py-3 text-left last:border-b-0 lg:grid-cols-[1.5fr_92px_1fr_96px_104px_62px] lg:items-center lg:gap-3", overdue && "border-l-[oklch(0.68_0.12_75)] bg-[oklch(0.99_0.015_75)]", item.status === "spam" && "opacity-[0.62]")}><div><div className="truncate text-[13px] font-medium">{venue?.name ?? item.venueId}</div><div className={cn("mt-0.5 text-[11px] text-muted-foreground", venue && !venue.isClaimed && "font-medium text-[oklch(0.42_0.09_25)]")}>{venue && !venue.isClaimed ? "Unclaimed · nobody can reply" : venue ? `${venue.area} · ${formatPartnerTier(venue.partnerTier)}` : "Venue unavailable"}</div></div><TypeChip kind={item.kind} /><div className="min-w-0"><div className="truncate text-[12.5px] font-medium">{item.customerName}</div><div className="truncate text-[11px] text-muted-foreground">{item.customerDetail}</div></div><span className="text-[11.5px] text-muted-foreground">{formatAge(item.createdAt)}</span><StatusChip item={item} /><span className="text-[12.5px] font-medium text-clay-accent">Open</span></button>; })}</div>;
}

function Metric({ label, value, sub, alert }: { label: string; value: string; sub: string; alert?: boolean }) { return <div className={cn("rounded-xl border bg-card px-4 py-[14px]", alert && "border-[oklch(0.87_0.08_75)] bg-[oklch(0.96_0.045_75)]")}><p className="text-[11.5px] text-muted-foreground">{label}</p><p className="mt-1 text-[22px] font-semibold">{value}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p></div>; }
function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={cn("h-[31px] rounded-full border px-3 text-[12.5px]", active ? "border-nokta-ink bg-nokta-ink text-white" : "bg-card text-muted-foreground")}>{children}</button>; }
function TypeChip({ kind }: { kind: DemandKind }) { return <span className={cn("inline-flex w-fit rounded-[5px] px-[7px] py-[3px] text-[10.5px] font-semibold uppercase", kind === "booking" ? "bg-clay-accent/12 text-[#a44a30]" : "bg-[oklch(0.93_0.03_250)] text-[oklch(0.36_0.08_250)]")}>{kind}</span>; }
function StatusChip({ item }: { item: DemandItem }) { return <span className={cn("w-fit rounded-full px-2 py-[3px] text-[11px] font-semibold", isUnanswered(item) ? "bg-[oklch(0.96_0.045_75)] text-[oklch(0.36_0.08_75)]" : item.status === "spam" ? "bg-muted text-muted-foreground" : "bg-[oklch(0.94_0.02_150)] text-[oklch(0.36_0.06_150)]")}>{formatStatus(item)}</span>; }
function InfoCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border bg-card px-[15px] py-[14px]"><h2 className="text-[13px] font-semibold">{title}</h2><div className="mt-1.5 text-[11.5px] leading-[1.55] text-muted-foreground">{children}</div></section>; }
function Detail({ label, value }: { label: string; value: string | null }) { return <div><dt className="text-[11px] text-muted-foreground">{label}</dt><dd className="mt-0.5 break-words font-medium">{value || "Not provided"}</dd></div>; }

function mapBooking(item: BookingRequest): DemandItem { return { id: item.id, kind: "booking", venueId: item.venueId, customerName: item.customerName, customerEmail: item.customerEmail, customerPhone: item.customerPhone, customerDetail: `${item.partySize} people · ${item.requestedDate} ${item.requestedTime}`, message: item.message, reference: item.confirmationReference, status: item.status, createdAt: item.createdAt, ownerUpdatedAt: item.ownerLastUpdatedAt, adminNotes: item.adminNotes, raw: item }; }
function mapEnquiry(item: VenueEnquiry): DemandItem { return { id: item.id, kind: "enquiry", venueId: item.venueId, customerName: item.customerName, customerEmail: item.customerEmail, customerPhone: item.customerPhone, customerDetail: [formatVenueEnquiryType(item.enquiryType), item.partySize ? `${item.partySize} people` : null].filter(Boolean).join(" · "), message: item.message, reference: null, status: item.status, createdAt: item.createdAt, ownerUpdatedAt: item.ownerLastUpdatedAt, adminNotes: item.adminNotes, raw: item }; }
function isUnanswered(item: DemandItem) { return item.kind === "booking" ? item.status === "pending" : item.status === "new"; }
function ageMs(item: DemandItem) { return Date.now() - new Date(item.createdAt).getTime(); }
function formatStatus(item: DemandItem) { return item.kind === "booking" ? formatBookingRequestStatus(item.status as BookingRequest["status"]) : formatAdminVenueEnquiryStatus(item.status as VenueEnquiry["status"]); }
function formatAge(value: string) { const hours = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000)); return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`; }
function formatDuration(ms: number | null) { if (ms === null) return "—"; const minutes = Math.round(ms / 60_000); if (minutes < 60) return `${minutes}m`; return `${Math.floor(minutes / 60)}h ${minutes % 60}m`; }
function readRange(value: string | null) { const parsed = Number(value); return [7, 30, 90].includes(parsed) ? parsed : 30; }
function readState(value: string | null): DemandState { return value === "all" || value === "spam" ? value : "unanswered"; }
function readKind(value: string | null): DemandKind | null { return value === "booking" || value === "enquiry" ? value : null; }
function countState(items: DemandItem[], state: DemandState) { return state === "all" ? items.length : state === "spam" ? items.filter((item) => item.status === "spam").length : items.filter(isUnanswered).length; }

function getMetrics(items: DemandItem[], venues: Record<string, Venue>) {
  const valid = items.filter((item) => item.status !== "spam");
  const answered = valid.filter((item) => item.ownerUpdatedAt);
  const replyTimes = answered.map((item) => new Date(item.ownerUpdatedAt!).getTime() - new Date(item.createdAt).getTime()).filter((value) => value >= 0).sort((a, b) => a - b);
  const overdue = valid.filter((item) => isUnanswered(item) && ageMs(item) > 48 * 60 * 60 * 1000);
  const overdueVenues = new Set(overdue.map((item) => item.venueId));
  return { bookingCount: items.filter((item) => item.kind === "booking").length, enquiryCount: items.filter((item) => item.kind === "enquiry").length, answeredCount: answered.length, answeredRate: valid.length ? Math.round(answered.length / valid.length * 100) : 0, medianReplyMs: replyTimes.length ? replyTimes[Math.floor(replyTimes.length / 2)] : null, overdue, overdueVenueCount: overdueVenues.size, unclaimedVenueCount: [...overdueVenues].filter((id) => !venues[id]?.isClaimed).length };
}

function getSlowestVenues(items: DemandItem[], venues: Record<string, Venue>) { const groups = new Map<string, number[]>(); for (const item of items) { const venue = venues[item.venueId]; if (!venue?.isClaimed || !item.ownerUpdatedAt) continue; const duration = new Date(item.ownerUpdatedAt).getTime() - new Date(item.createdAt).getTime(); if (duration >= 0) groups.set(item.venueId, [...(groups.get(item.venueId) ?? []), duration]); } return [...groups].map(([venueId, durations]) => ({ venueId, name: venues[venueId].name, averageMs: durations.reduce((sum, value) => sum + value, 0) / durations.length })).sort((a, b) => b.averageMs - a.averageMs).slice(0, 3); }
function getOutreachRows(items: DemandItem[], venues: Record<string, Venue>) { const counts = new Map<string, number>(); for (const item of items) if (venues[item.venueId] && !venues[item.venueId].isClaimed && item.status !== "spam") counts.set(item.venueId, (counts.get(item.venueId) ?? 0) + 1); return [...counts].map(([venueId, count]) => ({ venueId, name: venues[venueId].name, city: venues[venueId].city, area: venues[venueId].area, count })).sort((a, b) => b.count - a.count); }

function exportDemandCsv(items: DemandItem[], venues: Record<string, Venue>) { downloadCsv("nokta-demand.csv", [["Venue", "Type", "Customer", "Email", "Phone", "Status", "Submitted", "Reference"], ...items.map((item) => [venues[item.venueId]?.name ?? item.venueId, item.kind, item.customerName, item.customerEmail, item.customerPhone ?? "", formatStatus(item), item.createdAt, item.reference ?? ""])]); }
function exportOutreachCsv(rows: ReturnType<typeof getOutreachRows>) { downloadCsv("nokta-unclaimed-demand-leads.csv", [["Venue", "City", "Area", "Requests"], ...rows.map((row) => [row.name, row.city, row.area, String(row.count)])]); }
function downloadCsv(filename: string, rows: string[][]) { const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }
