import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnalyticsUpgradePrompt } from "@/components/owner/analytics/AnalyticsUpgradePrompt";
import { OwnerAnalyticsDateRangeFilter } from "@/components/owner/analytics/OwnerAnalyticsDateRangeFilter";
import { OwnerAnalyticsEmptyState } from "@/components/owner/analytics/OwnerAnalyticsEmptyState";
import { OwnerAnalyticsSummaryCards } from "@/components/owner/analytics/OwnerAnalyticsSummaryCards";
import { OwnerAnalyticsTrendChart } from "@/components/owner/analytics/OwnerAnalyticsTrendChart";
import { OwnerFeaturedPlacementPerformance } from "@/components/owner/analytics/OwnerFeaturedPlacementPerformance";
import { OwnerMonthlyValueSummary } from "@/components/owner/analytics/OwnerMonthlyValueSummary";
import { OwnerPromotedOfferPerformance } from "@/components/owner/analytics/OwnerPromotedOfferPerformance";
import { OwnerValueInsightsPanel } from "@/components/owner/analytics/OwnerValueInsightsPanel";
import { OwnerVenueFunnel } from "@/components/owner/analytics/OwnerVenueFunnel";
import { ProfileCompletenessCard } from "@/components/owner/analytics/ProfileCompletenessCard";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerVenueTabShell } from "@/components/owner/OwnerVenueTabShell";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { subscriptionHasPlanAccess } from "@/lib/planFeatureAccess";
import { getOwnerVenueSubscription } from "@/services/ownerSubscriptionService";
import { getMyClaimedVenue } from "@/services/ownerVenueService";
import { getOwnerVenueAnalyticsSummary, type OwnerAnalyticsDateRange, type OwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

export function OwnerVenueAnalyticsPage() {
  const { venueId = "" } = useParams();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<OwnerAnalyticsDateRange>("last_30_days");
  const [venue, setVenue] = useState<Venue | null>(null);
  const [subscription, setSubscription] = useState<VenueSubscription | null>(null);
  const [summary, setSummary] = useState<OwnerVenueAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !venueId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getMyClaimedVenue({ userId: user.id, venueId }),
      getOwnerVenueSubscription({ userId: user.id, venueId }).catch(() => null),
      getOwnerVenueAnalyticsSummary({ userId: user.id, venueId, dateRange }),
    ])
      .then(([nextVenue, nextSubscription, nextSummary]) => {
        if (cancelled) return;
        if (!nextVenue) throw new Error("Venue analytics not found.");
        setVenue(nextVenue);
        setSubscription(nextSubscription);
        setSummary(nextSummary);
        trackEvent("owner_venue_analytics_viewed", { venueId: nextVenue.id, dateRange });
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
  }, [dateRange, user, venueId]);

  const canSeeTrend = subscriptionHasPlanAccess(subscription, "basic_analytics") && (subscription?.plan ?? "free") !== "free";
  const canSeeFunnel = subscriptionHasPlanAccess(subscription, "improved_analytics");
  const canSeeAdvanced = subscriptionHasPlanAccess(subscription, "advanced_analytics");
  const hasActivity = Boolean(summary?.totalEvents);

  return (
    <OwnerLayout>
      <PageMeta title={venue ? `${venue.name} performance | nokta` : "Venue performance | nokta"} description="See how Nokta is helping your venue get discovered and receive customer interest." canonicalPath={venue ? `/owner/venues/${venue.slug}/performance` : undefined} />
      {isLoading ? <LoadingState message="Loading venue analytics..." /> : error || !venue || !summary ? <ErrorState title="Could not load analytics" message={error ?? "You do not have access to this venue analytics page."} /> : (
        <OwnerVenueTabShell venue={venue} title="Performance" actions={<OwnerAnalyticsDateRangeFilter value={dateRange} onChange={setDateRange} />}>
        <div className="space-y-5">
          <p className="max-w-2xl text-[13px] leading-6 text-muted-foreground">See how Nokta is helping your venue get discovered, trusted and booked.</p>

          <OwnerAnalyticsSummaryCards summary={summary} />
          {!hasActivity ? <OwnerAnalyticsEmptyState venue={venue} /> : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              {canSeeTrend ? (
                <OwnerAnalyticsTrendChart daily={summary.daily} />
              ) : (
                <AnalyticsUpgradePrompt title="Unlock trend insights" description="See how customer interest changes over time with daily profile views, booking requests and enquiries." />
              )}
              {canSeeFunnel ? (
                <OwnerVenueFunnel summary={summary} />
              ) : (
                <AnalyticsUpgradePrompt title="Unlock conversion insights" description="See how profile views turn into booking clicks and completed booking requests." />
              )}
              {canSeeAdvanced ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <OwnerPromotedOfferPerformance summary={summary} />
                  <OwnerFeaturedPlacementPerformance summary={summary} />
                </div>
              ) : (
                <AnalyticsUpgradePrompt title="Unlock promotion reporting" description="Track promoted offer and featured placement performance when your venue is ready to grow visibility." />
              )}
            </div>
            <aside className="space-y-6">
              <ProfileCompletenessCard venue={venue} subscription={subscription} />
              <OwnerValueInsightsPanel summary={summary} />
              <OwnerMonthlyValueSummary summary={summary} isPro={canSeeAdvanced} />
            </aside>
          </div>
        </div>
        </OwnerVenueTabShell>
      )}
    </OwnerLayout>
  );
}
