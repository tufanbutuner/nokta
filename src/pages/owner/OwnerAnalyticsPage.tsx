import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, ArrowRight } from "lucide-react";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { OwnerNoVenuesState } from "@/components/owner/OwnerNoVenuesState";
import { OwnerAnalyticsDateRangeFilter } from "@/components/owner/analytics/OwnerAnalyticsDateRangeFilter";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import { getOwnerVenueAnalyticsSummary, type OwnerAnalyticsDateRange, type OwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";
import type { Venue } from "@/types/venue";

export function OwnerAnalyticsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<OwnerAnalyticsDateRange>("last_30_days");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [summaries, setSummaries] = useState<Record<string, OwnerVenueAnalyticsSummary>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getMyClaimedVenues(user.id)
      .then(async (nextVenues) => {
        const results = await Promise.all(
          nextVenues.map(async (venue) => ({
            venue,
            summary: await getOwnerVenueAnalyticsSummary({ userId: user.id, venueId: venue.id, dateRange }).catch(() => null),
          })),
        );

        if (cancelled) return;
        setVenues(nextVenues);
        setSummaries(Object.fromEntries(results.flatMap((result) => result.summary ? [[result.venue.id, result.summary]] : [])));
        trackEvent("owner_analytics_overview_viewed", { ownedVenueCount: nextVenues.length, dateRange });
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load owner analytics.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dateRange, user]);

  const totals = useMemo(() => {
    return venues.reduce(
      (acc, venue) => {
        const summary = summaries[venue.id];
        acc.profileViews += summary?.profileViews ?? 0;
        acc.bookingRequests += summary?.bookingRequests ?? 0;
        acc.enquiries += summary?.enquiries ?? 0;
        acc.customerActions += summary?.customerActions ?? 0;
        return acc;
      },
      { profileViews: 0, bookingRequests: 0, enquiries: 0, customerActions: 0 },
    );
  }, [summaries, venues]);

  return (
    <OwnerLayout>
      <PageMeta title="Owner analytics | nokta" description="Compare profile visibility, customer actions and booking demand across your claimed venues." canonicalPath="/owner/analytics" />
      <div className="space-y-6">
        <WorkspacePageHeader
          title="Performance"
          description="How nokta is creating visibility, customer actions and booking demand across your venues."
          actions={<OwnerAnalyticsDateRangeFilter value={dateRange} onChange={setDateRange} />}
        />

        {isLoading ? <LoadingState message="Loading owner analytics..." /> : error ? <ErrorState message={error} /> : !venues.length ? <OwnerNoVenuesState /> : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Profile views" value={totals.profileViews} />
              <Metric label="Booking requests" value={totals.bookingRequests} />
              <Metric label="Enquiries" value={totals.enquiries} />
              <Metric label="Customer actions" value={totals.customerActions} />
            </div>

            <section className="grid gap-4">
              {venues.map((venue) => (
                <VenueAnalyticsOverviewCard key={venue.id} venue={venue} summary={summaries[venue.id]} />
              ))}
            </section>
          </>
        )}
      </div>
    </OwnerLayout>
  );
}

function VenueAnalyticsOverviewCard({ venue, summary }: { venue: Venue; summary?: OwnerVenueAnalyticsSummary }) {
  return (
    <article className="rounded-2xl border bg-nokta-surface p-5 border-nokta-border">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-nokta-accent-solid/10 text-nokta-accent-dark">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{venue.name}</h2>
            <p className="mt-1 text-sm text-nokta-ink-muted">{venue.city} • {venue.area}</p>
          </div>
        </div>
        <Button asChild>
          <Link to={`/owner/venues/${venue.slug}/performance`}>
            View full analytics
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <MiniMetric label="Views" value={summary?.profileViews ?? 0} />
        <MiniMetric label="Bookings" value={summary?.bookingRequests ?? 0} />
        <MiniMetric label="Enquiries" value={summary?.enquiries ?? 0} />
        <MiniMetric label="Actions" value={summary?.customerActions ?? 0} />
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border bg-nokta-surface p-4 border-nokta-border"><p className="text-sm text-nokta-ink-muted">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>;
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border bg-nokta-surface-alt/60 p-3 border-nokta-border"><p className="text-xs text-nokta-ink-muted">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>;
}
