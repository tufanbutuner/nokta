import { useEffect, useMemo, useState } from "react";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerNoVenuesState } from "@/components/owner/OwnerNoVenuesState";
import { OwnerVenueCard } from "@/components/owner/OwnerVenueCard";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import { getOwnerVenueAnalyticsSummary, type OwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";
import { getOwnerVenueCommercialSummary, type OwnerVenueCommercialSummary } from "@/services/ownerCommercialSummaryService";
import { getOwnerVenueEnquirySummary, type OwnerVenueEnquirySummary } from "@/services/ownerVenueEnquirySummaryService";
import { getOwnerVenueSubscriptions } from "@/services/ownerSubscriptionService";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

export function OwnerVenuesPage() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, OwnerVenueAnalyticsSummary>>({});
  const [enquiries, setEnquiries] = useState<Record<string, OwnerVenueEnquirySummary>>({});
  const [commercial, setCommercial] = useState<Record<string, OwnerVenueCommercialSummary>>({});
  const [subscriptions, setSubscriptions] = useState<Record<string, VenueSubscription>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const range = useMemo(last30Days, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getMyClaimedVenues(user.id)
      .then(async (nextVenues) => {
        if (cancelled) return;
        setVenues(nextVenues);
        const [nextSubscriptions, results] = await Promise.all([
          getOwnerVenueSubscriptions(user.id).catch(() => []),
          Promise.all(nextVenues.map(async (venue) => {
            const [venueAnalytics, venueEnquiries, venueCommercial] = await Promise.all([
              getOwnerVenueAnalyticsSummary({ userId: user.id, venueId: venue.id, from: range.from, to: range.to }).catch(() => null),
              getOwnerVenueEnquirySummary({ userId: user.id, venueId: venue.id }).catch(() => null),
              getOwnerVenueCommercialSummary({ userId: user.id, venueId: venue.id }).catch(() => null),
            ]);
            return { venue, venueAnalytics, venueEnquiries, venueCommercial };
          })),
        ]);
        if (cancelled) return;
        setAnalytics(Object.fromEntries(results.flatMap((item) => item.venueAnalytics ? [[item.venue.id, item.venueAnalytics]] : [])));
        setEnquiries(Object.fromEntries(results.flatMap((item) => item.venueEnquiries ? [[item.venue.id, item.venueEnquiries]] : [])));
        setCommercial(Object.fromEntries(results.flatMap((item) => item.venueCommercial ? [[item.venue.id, item.venueCommercial]] : [])));
        setSubscriptions(Object.fromEntries(nextSubscriptions.map((subscription) => [subscription.venueId, subscription])));
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load your venues.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, user]);

  return (
    <OwnerLayout>
      <PageMeta title="My venues | nokta" description="Manage the venues you have claimed on nokta." canonicalPath="/owner/venues" />
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="font-brand text-[23px] font-bold tracking-[-0.4px] text-nokta-ink">My venues</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Every venue you have claimed, with its plan and recent activity.</p>
        </div>
        {isLoading ? <LoadingState message="Loading your venues..." /> : error ? <ErrorState message={error} /> : !venues.length ? <OwnerNoVenuesState /> : (
          <div className="grid gap-4">
            {venues.map((venue) => <OwnerVenueCard key={venue.id} venue={venue} analytics={analytics[venue.id]} enquiries={enquiries[venue.id]} commercial={commercial[venue.id]} subscription={subscriptions[venue.id]} />)}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}

function last30Days() {
  return { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), to: new Date().toISOString() };
}
