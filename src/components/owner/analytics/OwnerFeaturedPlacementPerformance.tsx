import type { OwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";

export function OwnerFeaturedPlacementPerformance({ summary }: { summary: OwnerVenueAnalyticsSummary }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Featured placement performance</h2>
      <p className="mt-1 text-sm text-muted-foreground">Placement views, clicks and click-through rate.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Views" value={summary.featuredPlacementViews} />
        <Metric label="Clicks" value={summary.featuredPlacementClicks} />
        <Metric label="CTR" value={`${summary.featuredClickRate}%`} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-lg border bg-background/60 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>;
}
