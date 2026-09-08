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
import { useVenues } from "@/hooks/useVenues";
import { getFeaturedEligibilityRecommendation } from "@/lib/commercialEligibility";
import { DEFAULT_CITY } from "@/lib/cities";
import { formatMonetisationStatus, formatPartnerTier } from "@/lib/monetisationLabels";
import { PLAN_CONFIG } from "@/lib/planConfig";
import { cn } from "@/lib/utils";
import { getAdminFeaturedPlacements } from "@/services/adminFeaturedPlacementService";
import { updateVenueMonetisationStatus } from "@/services/adminMonetisationService";
import { getAdminPromotedOffers } from "@/services/adminPromotedOfferService";
import { getAdminPromotionRequests } from "@/services/adminPromotionRequestService";
import { getAdminVenueSubscriptions } from "@/services/adminSubscriptionService";
import type { FeaturedPlacement } from "@/types/featuredPlacements";
import type { MonetisationStatus } from "@/types/monetisation";
import type { OwnerPromotionRequest } from "@/types/ownerPromotionRequests";
import type { PromotedOffer } from "@/types/promotedOffers";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

type CommercialView = "pipeline" | "subscriptions" | "placements";

const PIPELINE_STAGES: MonetisationStatus[] = ["not-contacted", "contacted", "interested", "trial", "paying"];
const ALL_STAGES: MonetisationStatus[] = [...PIPELINE_STAGES, "churned", "not-fit"];
const STAGE_OPTIONS = ALL_STAGES.map((value) => ({ value, label: formatMonetisationStatus(value) }));

export function AdminCommercialPage() {
  const { venues, isLoading: venuesLoading, error: venuesError } = useVenues();
  const [params, setParams] = useSearchParams();
  const [subscriptions, setSubscriptions] = useState<VenueSubscription[]>([]);
  const [featured, setFeatured] = useState<FeaturedPlacement[]>([]);
  const [offers, setOffers] = useState<PromotedOffer[]>([]);
  const [requests, setRequests] = useState<OwnerPromotionRequest[]>([]);
  const [dashboardVenues, setDashboardVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingVenueId, setUpdatingVenueId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const city = params.get("city") ?? DEFAULT_CITY;
  const view = readView(params.get("view"));
  const stage = readStage(params.get("stage"));
  const search = params.get("q") ?? "";

  useEffect(() => { setDashboardVenues(venues); }, [venues]);
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([getAdminVenueSubscriptions(), getAdminFeaturedPlacements(), getAdminPromotedOffers(), getAdminPromotionRequests()])
      .then(([nextSubscriptions, nextFeatured, nextOffers, nextRequests]) => {
        if (!cancelled) {
          setSubscriptions(nextSubscriptions);
          setFeatured(nextFeatured);
          setOffers(nextOffers);
          setRequests(nextRequests);
        }
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load commercial data.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const subscriptionsByVenue = useMemo(() => Object.fromEntries(subscriptions.map((item) => [item.venueId, item])), [subscriptions]);
  const featuredByVenue = useMemo(() => groupByVenue(featured), [featured]);
  const offersByVenue = useMemo(() => groupByVenue(offers), [offers]);
  const requestsByVenue = useMemo(() => groupByVenue(requests), [requests]);
  const cityVenues = useMemo(() => dashboardVenues.filter((venue) => venue.city === city), [city, dashboardVenues]);
  const visibleVenues = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cityVenues.filter((venue) => (!stage || venue.monetisationStatus === stage) && (!term || [venue.name, venue.area, venue.partnerTier, venue.monetisationStatus].join(" ").toLowerCase().includes(term)));
  }, [cityVenues, search, stage]);
  const metrics = useMemo(() => getCommercialMetrics(cityVenues, subscriptionsByVenue), [cityVenues, subscriptionsByVenue]);

  function updateParams(next: Record<string, string | null>) {
    const copy = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) value === null ? copy.delete(key) : copy.set(key, value);
    setParams(copy, { replace: true });
  }

  async function handleStageChange(venue: Venue, nextStatus: MonetisationStatus) {
    const previous = venue.monetisationStatus;
    setUpdatingVenueId(venue.id);
    setError(null);
    setDashboardVenues((current) => current.map((item) => item.id === venue.id ? { ...item, monetisationStatus: nextStatus } : item));
    try {
      await updateVenueMonetisationStatus({ venueId: venue.id, status: nextStatus, notes: venue.monetisationNotes });
    } catch (caughtError) {
      setDashboardVenues((current) => current.map((item) => item.id === venue.id ? { ...item, monetisationStatus: previous } : item));
      setError(caughtError instanceof Error ? caughtError.message : "Could not update commercial stage.");
    } finally {
      setUpdatingVenueId(null);
    }
  }

  return (
    <AdminPageShell activePath="/admin/commercial">
      <PageMeta title="Commercial | nokta admin" description="Manage venue pipeline, subscriptions and placements." canonicalPath="/admin/commercial" />
      <div className="space-y-[14px] py-1">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="font-brand text-[25px] font-bold tracking-[-0.4px]">Commercial</h1><p className="mt-1 text-[12.5px] text-muted-foreground">One commercial record per venue, seen three ways.</p></div>
          <div className="flex flex-wrap gap-2"><div className="w-[150px]"><CitySelector value={city} onChange={(value) => updateParams({ city: value, stage: null })} /></div><Button variant="outline" className="h-[34px] text-[13px]" onClick={() => exportCommercialCsv(visibleVenues, subscriptionsByVenue)}>Export CSV</Button></div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="MRR" value={`£${metrics.mrr.toLocaleString("en-GB")}`} sub="active subscriptions" />
          <Metric label="Paying venues" value={String(metrics.paying)} sub={`of ${metrics.claimed} claimed`} />
          <Metric label="In trial" value={String(metrics.trials)} sub={`${metrics.trialsEndingSoon} end this week`} alert={metrics.trialsEndingSoon > 0} />
          <Metric label="Churned · 30d" value={String(metrics.churned30)} sub={metrics.churned30 ? "recent cancellations" : "no recent cancellations"} />
        </section>

        <section className="rounded-xl border bg-card p-[14px_16px]">
          <div><h2 className="text-[14px] font-semibold">Pipeline</h2><p className="text-[11.5px] text-muted-foreground">Click a stage to filter the table.</p></div>
          <div className="mt-3 grid gap-[7px] sm:grid-cols-2 xl:grid-cols-5">
            {PIPELINE_STAGES.map((value) => <button key={value} type="button" onClick={() => updateParams({ stage: stage === value ? null : value })} className={cn("rounded-[9px] border px-[11px] py-[10px] text-left", stage === value && "border-clay-accent", value === "trial" && "bg-[oklch(0.96_0.045_75)]", value === "paying" && "bg-[oklch(0.94_0.02_150)]", !["trial", "paying"].includes(value) && "bg-[oklch(0.96_0.02_55)]")}><span className="block text-[11px] text-muted-foreground">{formatMonetisationStatus(value)}</span><strong className="mt-0.5 block text-[17px] font-semibold">{cityVenues.filter((venue) => venue.monetisationStatus === value).length}</strong></button>)}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-[9px] bg-[oklch(0.93_0.02_55)] p-[3px]">{(["pipeline", "subscriptions", "placements"] as CommercialView[]).map((value) => <button key={value} type="button" onClick={() => updateParams({ view: value === "pipeline" ? null : value })} className={cn("rounded-md px-[11px] py-[5px] text-[12.5px] capitalize", view === value && "bg-card font-semibold shadow-sm")}>{value}</button>)}</div>
          <Input value={search} onChange={(event) => updateParams({ q: event.target.value || null })} placeholder="Search venue" className="h-[34px] w-full text-[12.5px] sm:w-[240px]" />
        </div>

        {error || venuesError ? <ErrorState message={error ?? venuesError ?? "Could not load commercial data."} /> : null}
        {isLoading || venuesLoading ? <LoadingState message="Loading commercial data..." /> : view === "pipeline" ? (
          <PipelineTable venues={visibleVenues} subscriptions={subscriptionsByVenue} featured={featuredByVenue} offers={offersByVenue} requests={requestsByVenue} updatingVenueId={updatingVenueId} onStageChange={handleStageChange} />
        ) : view === "subscriptions" ? (
          <SubscriptionsTable venues={visibleVenues} subscriptions={subscriptionsByVenue} />
        ) : (
          <PlacementsTable venues={visibleVenues} featured={featuredByVenue} offers={offersByVenue} requests={requestsByVenue} />
        )}
        <p className="text-[11.5px] text-muted-foreground">Promotion requests are approved in Review queue. Commercial shows the resulting record; it does not duplicate approval controls.</p>
      </div>
    </AdminPageShell>
  );
}

function PipelineTable({ venues, subscriptions, featured, offers, requests, updatingVenueId, onStageChange }: { venues: Venue[]; subscriptions: Record<string, VenueSubscription>; featured: Record<string, FeaturedPlacement[]>; offers: Record<string, PromotedOffer[]>; requests: Record<string, OwnerPromotionRequest[]>; updatingVenueId: string | null; onStageChange: (venue: Venue, status: MonetisationStatus) => void }) {
  return <TableShell headers={["Venue", "Plan", "Stage", "MRR", "Placements", "Renews"]}>{venues.map((venue) => { const subscription = subscriptions[venue.id]; return <div key={venue.id} className={rowClass(venue)}><VenueCell venue={venue} /><span className="text-[12.5px] font-medium">{formatPartnerTier(venue.partnerTier)}</span><Select value={venue.monetisationStatus} onValueChange={(value) => onStageChange(venue, value as MonetisationStatus)} options={STAGE_OPTIONS} disabled={updatingVenueId === venue.id} className="h-[32px] min-w-[116px] text-[12px]" /><span className="text-[12.5px] font-semibold">£{getSubscriptionMrr(subscription)}</span><PlacementSummary venue={venue} featured={featured[venue.id] ?? []} offers={offers[venue.id] ?? []} requests={requests[venue.id] ?? []} /><span className={cn("text-[11.5px]", isInsideDays(subscription?.currentPeriodEnd, 7) ? "font-semibold text-[oklch(0.48_0.11_75)]" : "text-muted-foreground")}>{formatDate(subscription?.currentPeriodEnd)}</span></div>; })}</TableShell>;
}

function SubscriptionsTable({ venues, subscriptions }: { venues: Venue[]; subscriptions: Record<string, VenueSubscription> }) { return <TableShell headers={["Venue", "Plan", "Status", "Provider", "Current period", "Last Stripe sync"]}>{venues.map((venue) => { const item = subscriptions[venue.id]; return <div key={venue.id} className={rowClass(venue)}><VenueCell venue={venue} /><span className="text-[12.5px] font-medium">{item ? PLAN_CONFIG[item.plan].name : formatPartnerTier(venue.partnerTier)}</span><StatusPill value={item?.status ?? "inactive"} /><span className="text-[12px] text-muted-foreground">{item?.billingProvider ?? "—"}{item?.cancelAtPeriodEnd ? " · cancels" : ""}</span><span className="text-[11.5px] text-muted-foreground">{formatDate(item?.currentPeriodStart)} – {formatDate(item?.currentPeriodEnd)}</span><span className="text-[11.5px] text-muted-foreground">{formatDateTime(item?.lastSyncedAt)}</span></div>; })}</TableShell>; }

function PlacementsTable({ venues, featured, offers, requests }: { venues: Venue[]; featured: Record<string, FeaturedPlacement[]>; offers: Record<string, PromotedOffer[]>; requests: Record<string, OwnerPromotionRequest[]> }) { return <TableShell headers={["Venue", "Plan", "Slot / offer", "Market", "Window", "State"]}>{venues.map((venue) => { const records = [...(featured[venue.id] ?? []).map((item) => ({ label: formatValue(item.placementType), market: [item.area, item.city].filter(Boolean).join(", "), start: item.startsAt, end: item.endsAt, status: item.status })), ...(offers[venue.id] ?? []).map((item) => ({ label: item.title, market: [item.area, item.city].filter(Boolean).join(", "), start: item.startsAt, end: item.endsAt, status: item.status }))]; const record = records[0]; const pending = (requests[venue.id] ?? []).filter((item) => item.status === "pending").length; return <div key={venue.id} className={rowClass(venue)}><VenueCell venue={venue} /><span className="text-[12.5px] font-medium">{formatPartnerTier(venue.partnerTier)}</span><span className="truncate text-[12.5px] font-medium">{record?.label ?? (pending ? `${pending} requested` : "No placement")}</span><span className="text-[11.5px] text-muted-foreground">{record?.market || venue.city}</span><span className="text-[11.5px] text-muted-foreground">{record ? `${formatDate(record.start)} – ${formatDate(record.end)}` : "—"}</span><StatusPill value={record?.status ?? (pending ? "requested" : "none")} /></div>; })}</TableShell>; }

function TableShell({ headers, children }: { headers: string[]; children: React.ReactNode }) { return <div className="overflow-x-auto rounded-xl border bg-card"><div className="min-w-[900px]"><div className="grid grid-cols-[1.6fr_100px_140px_92px_1fr_120px] gap-3 border-b bg-[oklch(0.97_0.012_60)] px-4 py-[9px] text-[10.5px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">{headers.map((header) => <span key={header}>{header}</span>)}</div>{children}</div></div>; }
function VenueCell({ venue }: { venue: Venue }) { return <div className="min-w-0"><div className="truncate text-[13px] font-medium">{venue.name}</div><div className="text-[11px] text-muted-foreground">{venue.area} · {venue.isClaimed ? "claimed" : "unclaimed"}</div></div>; }
function rowClass(venue: Venue) { return cn("grid grid-cols-[1.6fr_100px_140px_92px_1fr_120px] items-center gap-3 border-b border-l-[3px] border-l-transparent px-4 py-3 last:border-b-0", venue.monetisationStatus === "trial" && "border-l-[oklch(0.68_0.12_75)] bg-[oklch(0.99_0.015_75)]", venue.monetisationStatus === "churned" && "opacity-[0.62]"); }
function Metric({ label, value, sub, alert }: { label: string; value: string; sub: string; alert?: boolean }) { return <div className={cn("rounded-xl border bg-card px-4 py-[14px]", alert && "border-[oklch(0.87_0.08_75)] bg-[oklch(0.96_0.045_75)]")}><p className="text-[11.5px] text-muted-foreground">{label}</p><p className="mt-1 text-[22px] font-semibold">{value}</p><p className="text-[11px] text-muted-foreground">{sub}</p></div>; }
function StatusPill({ value }: { value: string }) { const good = ["active", "paying", "live"].includes(value); const alert = ["trial", "past_due", "requested"].includes(value); return <span className={cn("w-fit rounded-full bg-muted px-2 py-[3px] text-[11px] font-semibold capitalize text-muted-foreground", good && "bg-[oklch(0.94_0.02_150)] text-[oklch(0.36_0.06_150)]", alert && "bg-[oklch(0.96_0.045_75)] text-[oklch(0.36_0.08_75)]")}>{formatValue(value)}</span>; }
function PlacementSummary({ venue, featured, offers, requests }: { venue: Venue; featured: FeaturedPlacement[]; offers: PromotedOffer[]; requests: OwnerPromotionRequest[] }) { const liveFeatured = featured.find((item) => item.status === "active"); const liveOffer = offers.find((item) => item.status === "active"); const pending = requests.find((item) => item.status === "pending"); let label = liveFeatured ? `Featured · ${liveFeatured.city ?? venue.city}` : liveOffer ? "Offer live" : pending ? "Promotion requested" : getFeaturedEligibilityRecommendation(venue).eligible ? "Eligible for Featured" : getFeaturedEligibilityRecommendation(venue).reasons[0] ?? "Needs work"; return <span className="truncate text-[11.5px] text-muted-foreground">{label}</span>; }

function getCommercialMetrics(venues: Venue[], subscriptions: Record<string, VenueSubscription>) { const items = venues.map((venue) => subscriptions[venue.id]).filter(Boolean); const now = Date.now(); return { mrr: items.filter((item) => item.status === "active").reduce((sum, item) => sum + PLAN_CONFIG[item.plan].monthlyPrice, 0), paying: venues.filter((venue) => venue.monetisationStatus === "paying").length, claimed: venues.filter((venue) => venue.isClaimed).length, trials: items.filter((item) => item.status === "trial").length, trialsEndingSoon: items.filter((item) => item.status === "trial" && isInsideDays(item.trialEndsAt, 7)).length, churned30: items.filter((item) => item.cancelledAt && now - new Date(item.cancelledAt).getTime() <= 30 * 86_400_000).length }; }
function getSubscriptionMrr(item?: VenueSubscription) { return item?.status === "active" ? PLAN_CONFIG[item.plan].monthlyPrice : 0; }
function groupByVenue<T extends { venueId: string }>(items: T[]) { return items.reduce<Record<string, T[]>>((groups, item) => { groups[item.venueId] = [...(groups[item.venueId] ?? []), item]; return groups; }, {}); }
function readView(value: string | null): CommercialView { return value === "subscriptions" || value === "placements" ? value : "pipeline"; }
function readStage(value: string | null): MonetisationStatus | null { return ALL_STAGES.includes(value as MonetisationStatus) ? value as MonetisationStatus : null; }
function formatValue(value: string) { return value.split(/[_-]/).map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(" "); }
function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(value)) : "—"; }
function formatDateTime(value?: string | null) { return value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "—"; }
function isInsideDays(value: string | null | undefined, days: number) { if (!value) return false; const diff = new Date(value).getTime() - Date.now(); return diff >= 0 && diff <= days * 86_400_000; }
function exportCommercialCsv(venues: Venue[], subscriptions: Record<string, VenueSubscription>) { const rows = [["Venue", "City", "Area", "Claimed", "Plan", "Stage", "Subscription status", "MRR"], ...venues.map((venue) => { const item = subscriptions[venue.id]; return [venue.name, venue.city, venue.area, venue.isClaimed ? "Yes" : "No", formatPartnerTier(venue.partnerTier), formatMonetisationStatus(venue.monetisationStatus), item?.status ?? "inactive", String(getSubscriptionMrr(item))]; })]; const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")).join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "nokta-commercial.csv"; anchor.click(); URL.revokeObjectURL(url); }
