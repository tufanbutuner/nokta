import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useVenues } from "@/hooks/useVenues";
import {
  enrichVenueAnalyticsSummaries,
  getAdminAnalyticsDashboardSummary,
  getAdminVenueAnalyticsSummaries,
  type AdminAnalyticsDashboardSummary,
  type AdminAnalyticsFilters,
  type AnalyticsMetric,
} from "@/services/adminVenueAnalyticsService";
import type { VenueAnalyticsSummary } from "@/types/analytics";

type RangeOption = "7d" | "30d" | "this-month" | "last-month" | "custom";

const METRIC_OPTIONS: { label: string; value: AnalyticsMetric }[] = [
  { label: "Profile views", value: "profileViews" },
  { label: "Directions", value: "directionsClicks" },
  { label: "Enquiries", value: "enquirySubmissions" },
  { label: "Featured clicks", value: "featuredClicks" },
  { label: "Offer clicks", value: "offerClicks" },
];

export function AdminVenueAnalyticsPage() {
  const { venues, isLoading: isLoadingVenues } = useVenues();
  const [range, setRange] = useState<RangeOption>("30d");
  const [customFrom, setCustomFrom] = useState(toDateInput(daysAgo(30)));
  const [customTo, setCustomTo] = useState(toDateInput(new Date()));
  const [city, setCity] = useState("all");
  const [venueId, setVenueId] = useState("all");
  const [topMetric, setTopMetric] = useState<AnalyticsMetric>("profileViews");
  const [summary, setSummary] = useState<AdminAnalyticsDashboardSummary | null>(null);
  const [venueSummaries, setVenueSummaries] = useState<VenueAnalyticsSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateRange = useMemo(() => getDateRange(range, customFrom, customTo), [customFrom, customTo, range]);
  const filters = useMemo<AdminAnalyticsFilters>(() => ({ from: dateRange.from, to: dateRange.to, city: city === "all" ? null : city, venueId: venueId === "all" ? null : venueId }), [city, dateRange, venueId]);
  const cityOptions = useMemo(() => Array.from(new Set(venues.map((venue) => venue.city))).sort(), [venues]);
  const filteredVenueOptions = useMemo(() => venues.filter((venue) => city === "all" || venue.city === city), [city, venues]);
  const enrichedSummaries = useMemo(() => enrichVenueAnalyticsSummaries(venueSummaries, venues), [venueSummaries, venues]);
  const topVenues = useMemo(() => [...enrichedSummaries].sort((a, b) => b[topMetric] - a[topMetric]).slice(0, 10), [enrichedSummaries, topMetric]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    Promise.all([getAdminAnalyticsDashboardSummary(filters), getAdminVenueAnalyticsSummaries(filters)])
      .then(([nextSummary, nextVenueSummaries]) => {
        if (cancelled) return;
        setSummary(nextSummary);
        setVenueSummaries(nextVenueSummaries);
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load venue analytics.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  return (
    <AdminPageShell activePath="/admin/analytics">
      <PageMeta title="Venue Analytics | Sheesha Admin" description="Review venue traffic, clicks and enquiries." />
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#8a7e72]">Admin</p>
            <h1 className="mt-1 font-brand text-3xl font-bold tracking-[-0.5px] text-sheesh-ink">Venue analytics</h1>
            <p className="mt-2 text-sm text-[#8a7e72]">Commercial reporting for venue views, clicks, enquiries and promotions.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/admin/monetisation">Open monetisation</Link>
          </Button>
        </div>

        <section className="grid gap-3 rounded-xl border bg-card p-4 lg:grid-cols-[180px_1fr_1fr_1fr]">
          <Select value={range} onChange={(event) => setRange(event.target.value as RangeOption)} options={[
            { label: "Last 7 days", value: "7d" },
            { label: "Last 30 days", value: "30d" },
            { label: "This month", value: "this-month" },
            { label: "Last month", value: "last-month" },
            { label: "Custom", value: "custom" },
          ]} />
          <Select value={city} onChange={(event) => { setCity(event.target.value); setVenueId("all"); }} options={[{ label: "All cities", value: "all" }, ...cityOptions.map((option) => ({ label: option, value: option }))]} />
          <Select value={venueId} onChange={(event) => setVenueId(event.target.value)} disabled={isLoadingVenues} options={[{ label: "All venues", value: "all" }, ...filteredVenueOptions.map((venue) => ({ label: `${venue.name} · ${venue.city}`, value: venue.id }))]} />
          <Select value={topMetric} onChange={(event) => setTopMetric(event.target.value as AnalyticsMetric)} options={METRIC_OPTIONS} />
          {range === "custom" ? (
            <>
              <Input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
              <Input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
            </>
          ) : null}
        </section>

        {isLoading ? (
          <LoadingState message="Loading venue analytics..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : summary ? (
          <>
            <SummaryCards summary={summary} />
            <CommercialCards summary={summary} />
            <AnalyticsTable title={`Top venues by ${METRIC_OPTIONS.find((option) => option.value === topMetric)?.label.toLowerCase()}`} summaries={topVenues} />
            <AnalyticsTable title="Per-venue analytics" summaries={enrichedSummaries} />
          </>
        ) : null}
      </div>
    </AdminPageShell>
  );
}

function SummaryCards({ summary }: { summary: AdminAnalyticsDashboardSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard label="Profile views" value={summary.profileViews} />
      <MetricCard label="Directions" value={summary.directionsClicks} />
      <MetricCard label="Website clicks" value={summary.websiteClicks} />
      <MetricCard label="Instagram clicks" value={summary.instagramClicks} />
      <MetricCard label="Enquiries" value={summary.enquirySubmissions} />
      <MetricCard label="Featured clicks" value={summary.featuredClicks} />
      <MetricCard label="Offer clicks" value={summary.offerClicks} />
      <MetricCard label="Saves" value={summary.saves} />
      <MetricCard label="Unsaves" value={summary.unsaves} />
      <MetricCard label="Total events" value={summary.totalEvents} />
    </div>
  );
}

function CommercialCards({ summary }: { summary: AdminAnalyticsDashboardSummary }) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <MetricCard label="Enquiry conversion" value={rate(summary.enquirySubmissions, summary.profileViews)} suffix="%" />
      <MetricCard label="Directions rate" value={rate(summary.directionsClicks, summary.profileViews)} suffix="%" />
      <MetricCard label="Website rate" value={rate(summary.websiteClicks, summary.profileViews)} suffix="%" />
      <MetricCard label="Featured CTR" value={rate(summary.featuredClicks, summary.featuredViews)} suffix="%" />
      <MetricCard label="Offer CTR" value={rate(summary.offerClicks, summary.offerViews)} suffix="%" />
    </div>
  );
}

function AnalyticsTable({ title, summaries }: { title: string; summaries: VenueAnalyticsSummary[] }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Venue</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Directions</th>
              <th className="px-4 py-3">Website</th>
              <th className="px-4 py-3">Instagram</th>
              <th className="px-4 py-3">Saves</th>
              <th className="px-4 py-3">Enquiries</th>
              <th className="px-4 py-3">Featured clicks</th>
              <th className="px-4 py-3">Offer clicks</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {summaries.length ? summaries.map((summary) => (
              <tr key={summary.venueId}>
                <td className="px-4 py-4 font-medium">{summary.venueName ?? summary.venueId}</td>
                <td className="px-4 py-4 text-muted-foreground">{summary.city ?? "Unknown"}</td>
                <td className="px-4 py-4 text-muted-foreground">{summary.area ?? "Unknown"}</td>
                <td className="px-4 py-4">{summary.profileViews}</td>
                <td className="px-4 py-4">{summary.directionsClicks}</td>
                <td className="px-4 py-4">{summary.websiteClicks}</td>
                <td className="px-4 py-4">{summary.instagramClicks}</td>
                <td className="px-4 py-4">{summary.saves}</td>
                <td className="px-4 py-4">{summary.enquirySubmissions}</td>
                <td className="px-4 py-4">{summary.featuredClicks}</td>
                <td className="px-4 py-4">{summary.offerClicks}</td>
                <td className="px-4 py-4">{summary.totalEvents}</td>
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-8 text-muted-foreground" colSpan={12}>No analytics events match these filters yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MetricCard({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}{suffix}</p></div>;
}

function rate(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}

function getDateRange(range: RangeOption, customFrom: string, customTo: string) {
  const now = new Date();
  if (range === "7d") return { from: daysAgo(7).toISOString(), to: now.toISOString() };
  if (range === "30d") return { from: daysAgo(30).toISOString(), to: now.toISOString() };
  if (range === "this-month") return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to: now.toISOString() };
  if (range === "last-month") return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(), to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString() };
  return { from: new Date(`${customFrom}T00:00:00`).toISOString(), to: new Date(`${customTo}T23:59:59`).toISOString() };
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}
