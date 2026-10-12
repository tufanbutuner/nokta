import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { WorkspacePageHeader, workspaceSecondaryActionClass } from "@/components/workspace/WorkspacePageHeader";
import { DataQualityIssueBadge } from "@/components/admin/data-quality/DataQualityIssueBadge";
import { CitySelector } from "@/components/search/CitySelector";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { DEFAULT_CITY } from "@/lib/cities";
import { cn } from "@/lib/utils";
import { filterVenuesByQualityIssue, getVenueQuality, getVenueQualitySummary, type DataQualityFilter } from "@/lib/venueQuality";
import { getAdminBookingRequests } from "@/services/adminBookingRequestService";
import { getAdminVenueEnquiries } from "@/services/adminVenueEnquiryService";
import { enrichVenueAnalyticsSummaries, getAdminAnalyticsDashboardSummary, getAdminVenueAnalyticsSummaries, getAdminVenueIdsWithMenuItems, type AdminAnalyticsDashboardSummary } from "@/services/adminVenueAnalyticsService";
import { useVenues } from "@/hooks/useVenues";
import type { VenueAnalyticsSummary } from "@/types/analytics";
import type { BookingRequest } from "@/types/bookingRequests";
import type { VenueEnquiry } from "@/types/venueEnquiries";
import type { Venue } from "@/types/venue";

type View = "performance" | "data-quality";
type Sort = "profileViews" | "directionsClicks" | "enquirySubmissions" | "answered";
type QualityFilter = DataQualityFilter | "no-menu-items" | "fewer-than-3-photos";

export function AdminInsightsPage() {
  const { venues, isLoading: venuesLoading, error: venuesError } = useVenues();
  const [params, setParams] = useSearchParams();
  const [summary, setSummary] = useState<AdminAnalyticsDashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<VenueAnalyticsSummary[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [enquiries, setEnquiries] = useState<VenueEnquiry[]>([]);
  const [menuVenueIds, setMenuVenueIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const city = params.get("city") ?? DEFAULT_CITY;
  const view: View = params.get("view") === "data-quality" ? "data-quality" : "performance";
  const range = params.get("range") === "7d" ? "7d" : "30d";
  const sort = readSort(params.get("sort"));
  const qualityFilter = readQualityFilter(params.get("issue"));
  const cityVenues = useMemo(() => venues.filter((venue) => venue.city === city), [city, venues]);
  const dates = useMemo(() => ({ from: new Date(Date.now() - (range === "7d" ? 7 : 30) * 86400000).toISOString(), to: new Date().toISOString() }), [range]);

  useEffect(() => {
    if (venuesLoading) return;
    let cancelled = false;
    setLoading(true); setError(null);
    const filters = { ...dates, city, venueId: null };
    Promise.all([getAdminAnalyticsDashboardSummary(filters), getAdminVenueAnalyticsSummaries(filters), getAdminBookingRequests(), getAdminVenueEnquiries(), getAdminVenueIdsWithMenuItems(cityVenues.map((venue) => venue.id))])
      .then(([nextSummary, nextAnalytics, nextBookings, nextEnquiries, nextMenuIds]) => {
        if (cancelled) return;
        setSummary(nextSummary); setAnalytics(nextAnalytics); setBookings(nextBookings); setEnquiries(nextEnquiries); setMenuVenueIds(nextMenuIds);
      })
      .catch((caught) => { if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load insights."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [city, cityVenues, dates, venuesLoading]);

  const analyticsRows = useMemo(() => {
    const byId = new Map(enrichVenueAnalyticsSummaries(analytics, venues).map((row) => [row.venueId, row]));
    return cityVenues.map((venue) => ({ venue, analytics: byId.get(venue.id) ?? emptyAnalytics(venue), answered: answeredRate(venue.id, bookings, enquiries) }))
      .sort((a, b) => sort === "answered" ? b.answered - a.answered : b.analytics[sort] - a.analytics[sort]);
  }, [analytics, bookings, cityVenues, enquiries, sort, venues]);
  const quality = useMemo(() => getVenueQualitySummary(cityVenues), [cityVenues]);
  const issueCounts = useMemo(() => ({
    "no-menu-items": cityVenues.filter((venue) => !menuVenueIds.has(venue.id)).length,
    "missing-opening-hours": quality.missingOpeningHoursCount,
    "fewer-than-3-photos": cityVenues.filter((venue) => venue.images.length < 3).length,
    "missing-official-source": quality.missingOfficialSourceCount,
    "questionable-coordinates": quality.questionableCoordinatesCount,
  }), [cityVenues, menuVenueIds, quality]);
  const totalIssues = Object.values(issueCounts).reduce((total, count) => total + count, 0);
  const qualityRows = useMemo(() => cityVenues.filter((venue) => matchesIssue(venue, qualityFilter, menuVenueIds)), [cityVenues, menuVenueIds, qualityFilter]);
  const outreach = analyticsRows.find((row) => !row.venue.isClaimed && row.answered === 0 && row.analytics.profileViews > 0);

  const updateParam = (key: string, value: string | null) => setParams((current) => { const next = new URLSearchParams(current); value ? next.set(key, value) : next.delete(key); return next; });
  const openQualityIssue = (issue: string) => setParams((current) => { const next = new URLSearchParams(current); next.set("view", "data-quality"); next.set("issue", issue); return next; });
  if (venuesLoading || loading) return <AdminPageShell activePath="/admin/insights"><LoadingState message="Loading insights..." /></AdminPageShell>;
  if (venuesError || error) return <AdminPageShell activePath="/admin/insights"><ErrorState message={venuesError ?? error ?? "Could not load insights."} /></AdminPageShell>;

  return <AdminPageShell activePath="/admin/insights">
    <PageMeta title="Insights | nokta Admin" description="Directory performance and data quality." />
    <div className="space-y-6 pb-8">
      <WorkspacePageHeader
        title="Insights"
        description="See how the directory performs and what needs fixing."
        actions={<>
          <div className="w-40"><CitySelector id="insights-city" value={city} onChange={(value) => updateParam("city", value)} /></div>
          <select aria-label="Date range" className="h-10 rounded-full border border-nokta-border bg-nokta-surface px-4 text-sm font-medium text-nokta-ink" value={range} onChange={(event) => updateParam("range", event.target.value)}><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select>
          <button type="button" className={workspaceSecondaryActionClass} onClick={() => exportCsv(view === "performance" ? performanceCsv(analyticsRows) : qualityCsv(qualityRows))}>Export CSV</button>
        </>}
      />
      <div className="flex gap-1"><Tab active={view === "performance"} onClick={() => updateParam("view", null)}>Performance</Tab><Tab active={view === "data-quality"} onClick={() => updateParam("view", "data-quality")}>Data quality <span className="text-nokta-bad-ink">{totalIssues}</span></Tab></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Profile views" value={summary?.profileViews ?? 0} /><Metric label="Directions" value={summary?.directionsClicks ?? 0} /><Metric label="Requests sent" value={summary?.enquirySubmissions ?? 0} /><Metric label="Saves" value={summary?.saves ?? 0} /><Metric label="View → request" value={`${rate(summary?.enquirySubmissions ?? 0, summary?.profileViews ?? 0)}%`} /></div>
      <div className="grid gap-[14px] xl:grid-cols-[minmax(0,1fr)_320px]">
        {view === "performance" ? <PerformanceTable rows={analyticsRows} sort={sort} onSort={(value) => updateParam("sort", value)} /> : <QualityTable venues={qualityRows} menuVenueIds={menuVenueIds} filters={issueCounts} active={qualityFilter} onFilter={(value) => updateParam("issue", value === "all" ? null : value)} />}
        <aside className="space-y-[14px]"><RailCard title="Data quality">{Object.entries(issueCounts).map(([key, count]) => <button key={key} className="flex w-full justify-between py-1.5 text-left text-[13px]" onClick={() => openQualityIssue(key)}><span>{issueLabel(key)}</span><b>{count}</b></button>)}</RailCard><div className="rounded-xl bg-nokta-ink p-4 text-nokta-surface"><h2 className="text-sm font-semibold">Worth a look</h2><p className="mt-2 text-[13px] text-clay-50/70">{outreach ? `${outreach.venue.name} has ${outreach.analytics.profileViews} views, is unclaimed and has 0% answered.` : "No high-traffic unanswered outreach signal in this range."}</p></div><RailCard title="One list, two lenses"><p className="text-[13px] text-nokta-ink-muted">Performance and quality use the same city-filtered venue list, so fixes stay tied to outcomes.</p></RailCard></aside>
      </div>
    </div>
  </AdminPageShell>;
}

function PerformanceTable({ rows, sort, onSort }: { rows: ReturnType<typeof performanceRows>; sort: Sort; onSort: (sort: Sort) => void }) { return <section className="overflow-hidden rounded-xl border bg-nokta-surface border-nokta-border"><div className="flex items-center justify-between border-b px-4 py-3 border-nokta-border"><h2 className="text-sm font-semibold">Venues by profile views</h2><span className="text-[13px] text-nokta-accent-dark">All {rows.length} venues</span></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead className="bg-nokta-track/40 text-left text-xs uppercase text-nokta-ink-muted"><tr><th className="px-4 py-3">Venue</th>{[["profileViews","Views"],["directionsClicks","Directions"],["enquirySubmissions","Requests"],["answered","Answered"]].map(([key,label]) => <th key={key} className="px-3 py-3 text-right"><button className={cn(sort === key && "text-nokta-ink")} onClick={() => onSort(key as Sort)}>{label}</button></th>)}</tr></thead><tbody className="divide-y">{rows.map(({ venue, analytics, answered }) => <tr key={venue.id}><td className="px-4 py-3"><div className="font-medium">{venue.name}</div><div className={cn("text-xs text-nokta-ink-muted", !venue.isClaimed && "text-nokta-bad-ink")}>{venue.area} · {venue.partnerTier}{!venue.isClaimed ? " · unclaimed" : ""}</div></td><td className="px-3 py-3 text-right">{analytics.profileViews}</td><td className="px-3 py-3 text-right">{analytics.directionsClicks}</td><td className="px-3 py-3 text-right">{analytics.enquirySubmissions}</td><td className={cn("px-3 py-3 text-right font-medium", answered >= 70 ? "text-nokta-ok-ink" : answered === 0 ? "text-nokta-bad-ink" : "text-nokta-warn-ink")}>{answered}%</td></tr>)}</tbody></table></div></section>; }
function QualityTable({ venues, menuVenueIds, filters, active, onFilter }: { venues: Venue[]; menuVenueIds: Set<string>; filters: Record<string, number>; active: QualityFilter; onFilter: (filter: QualityFilter) => void }) { return <section className="overflow-hidden rounded-xl border bg-nokta-surface border-nokta-border"><div className="flex flex-wrap gap-2 border-b p-3 border-nokta-border"><button className={chip(active === "all")} onClick={() => onFilter("all")}>All</button>{Object.entries(filters).map(([key,count]) => <button key={key} className={chip(active === key)} onClick={() => onFilter(key as QualityFilter)}>{issueLabel(key)} {count}</button>)}</div><div className="divide-y">{venues.length ? venues.map((venue) => { const issues = getVenueQuality(venue).issues.slice(0,3); return <div key={venue.id} className="flex items-start justify-between gap-4 p-4"><div><div className="font-medium">{venue.name}</div><div className="mt-2 flex flex-wrap gap-1.5">{!menuVenueIds.has(venue.id) ? <span className="rounded-full bg-nokta-bad-tint px-2 py-1 text-xs text-nokta-bad-ink">No menu items</span> : null}{issues.map((issue) => <DataQualityIssueBadge key={issue.key} issue={issue} />)}</div></div><Link className="text-[13px] font-medium text-nokta-accent-dark" to={`/admin/venues/${venue.id}/edit`}>Fix →</Link></div>; }) : <p className="p-8 text-sm text-nokta-ink-muted">No venues match this issue.</p>}</div></section>; }
function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button className={cn("rounded-lg px-3 py-2 text-sm", active ? "border bg-nokta-surface font-semibold border-nokta-border" : "text-nokta-ink-muted")} onClick={onClick}>{children}</button>; }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border bg-nokta-surface p-4 border-nokta-border"><p className="text-xs text-nokta-ink-muted">{label}</p><p className="mt-1 text-[22px] font-semibold">{typeof value === "number" ? value.toLocaleString() : value}</p></div>; }
function RailCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border bg-nokta-surface p-4 border-nokta-border"><h2 className="mb-2 text-sm font-semibold">{title}</h2>{children}</section>; }
function emptyAnalytics(venue: Venue): VenueAnalyticsSummary { return { venueId: venue.id, venueName: venue.name, city: venue.city, area: venue.area, profileViews: 0, directionsClicks: 0, websiteClicks: 0, instagramClicks: 0, saves: 0, unsaves: 0, enquiryCtaClicks: 0, enquirySubmissions: 0, featuredViews: 0, featuredClicks: 0, offerViews: 0, offerClicks: 0, totalEvents: 0 }; }
function answeredRate(venueId: string, bookings: BookingRequest[], enquiries: VenueEnquiry[]) { const venueBookings = bookings.filter((item) => item.venueId === venueId && item.status !== "spam"); const venueEnquiries = enquiries.filter((item) => item.venueId === venueId && item.status !== "spam"); const total = venueBookings.length + venueEnquiries.length; const answered = venueBookings.filter((item) => item.status !== "pending").length + venueEnquiries.filter((item) => item.status !== "new").length; return rate(answered, total); }
function rate(value: number, total: number) { return total ? Math.round(value / total * 100) : 0; }
function readSort(value: string | null): Sort { return value === "directionsClicks" || value === "enquirySubmissions" || value === "answered" ? value : "profileViews"; }
function readQualityFilter(value: string | null): QualityFilter { return value === "no-menu-items" || value === "fewer-than-3-photos" || value === "missing-opening-hours" || value === "missing-official-source" || value === "questionable-coordinates" ? value : "all"; }
function matchesIssue(venue: Venue, filter: QualityFilter, menuIds: Set<string>) { if (filter === "all") return true; if (filter === "no-menu-items") return !menuIds.has(venue.id); if (filter === "fewer-than-3-photos") return venue.images.length < 3; return filterVenuesByQualityIssue([venue], filter as DataQualityFilter).length > 0; }
function issueLabel(key: string) { return ({ "no-menu-items": "No menu items", "missing-opening-hours": "Missing opening hours", "fewer-than-3-photos": "Fewer than 3 photos", "missing-official-source": "Weak source", "questionable-coordinates": "Coordinates unverified" } as Record<string,string>)[key] ?? key; }
function chip(active: boolean) { return cn("rounded-full border px-2.5 py-1 text-xs border-nokta-border", active ? "border-nokta-ink bg-nokta-ink text-nokta-surface" : "bg-nokta-surface-alt"); }
function performanceRows() { return [] as { venue: Venue; analytics: VenueAnalyticsSummary; answered: number }[]; }
function performanceCsv(rows: ReturnType<typeof performanceRows>) { return [["Venue","Area","Views","Directions","Requests","Answered"], ...rows.map(({venue,analytics,answered}) => [venue.name,venue.area,analytics.profileViews,analytics.directionsClicks,analytics.enquirySubmissions,`${answered}%`])]; }
function qualityCsv(venues: Venue[]) { return [["Venue","City","Area","Quality","Issues"], ...venues.map((venue) => { const quality = getVenueQuality(venue); return [venue.name,venue.city,venue.area,quality.score,quality.issues.map((issue) => issue.label).join("; ")]; })]; }
function exportCsv(rows: (string | number)[][]) { const csv = rows.map((row) => row.map((cell) => `"${String(cell).split('"').join('""')}"`).join(",")).join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "admin-insights.csv"; link.click(); URL.revokeObjectURL(url); }
