import { useEffect, useMemo, useState } from "react";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerNoVenuesState } from "@/components/owner/OwnerNoVenuesState";
import { OwnerVenueCard } from "@/components/owner/OwnerVenueCard";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import { getOwnerVenueAnalyticsSummary, type OwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";
import { getOwnerVenueCommercialSummary, type OwnerVenueCommercialSummary } from "@/services/ownerCommercialSummaryService";
import { getOwnerVenueEnquirySummary, type OwnerVenueEnquirySummary } from "@/services/ownerVenueEnquirySummaryService";
import type { Venue } from "@/types/venue";

export function OwnerDashboardPage() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, OwnerVenueAnalyticsSummary>>({});
  const [enquiries, setEnquiries] = useState<Record<string, OwnerVenueEnquirySummary>>({});
  const [commercial, setCommercial] = useState<Record<string, OwnerVenueCommercialSummary>>({});
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
        trackEvent("owner_dashboard_viewed", { ownedVenueCount: nextVenues.length });
        const results = await Promise.all(nextVenues.map(async (venue) => {
          const [venueAnalytics, venueEnquiries, venueCommercial] = await Promise.all([
            getOwnerVenueAnalyticsSummary({ userId: user.id, venueId: venue.id, from: range.from, to: range.to }).catch(() => null),
            getOwnerVenueEnquirySummary({ userId: user.id, venueId: venue.id }).catch(() => null),
            getOwnerVenueCommercialSummary({ userId: user.id, venueId: venue.id }).catch(() => null),
          ]);
          return { venue, venueAnalytics, venueEnquiries, venueCommercial };
        }));
        if (cancelled) return;
        setAnalytics(Object.fromEntries(results.flatMap((item) => item.venueAnalytics ? [[item.venue.id, item.venueAnalytics]] : [])));
        setEnquiries(Object.fromEntries(results.flatMap((item) => item.venueEnquiries ? [[item.venue.id, item.venueEnquiries]] : [])));
        setCommercial(Object.fromEntries(results.flatMap((item) => item.venueCommercial ? [[item.venue.id, item.venueCommercial]] : [])));
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load owner dashboard.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, user]);

  const totals = venues.reduce((acc, venue) => {
    acc.profileViews += analytics[venue.id]?.profileViews ?? 0;
    acc.enquiries += enquiries[venue.id]?.totalEnquiries ?? 0;
    acc.directionsClicks += analytics[venue.id]?.directionsClicks ?? 0;
    acc.activeOffers += commercial[venue.id]?.activePromotedOffers ?? 0;
    acc.activeFeatured += commercial[venue.id]?.activeFeaturedPlacements ?? 0;
    return acc;
  }, { profileViews: 0, enquiries: 0, directionsClicks: 0, activeOffers: 0, activeFeatured: 0 });

  return (
    <OwnerLayout>
      <PageMeta title="Owner dashboard | Sheesha" description="View your claimed venues, profile performance and enquiry activity." canonicalPath="/owner" />
      <div className="space-y-6">
        <div>
          <p className="text-sm text-clay-accent">Owner dashboard</p>
          <h1 className="mt-1 font-brand text-4xl font-bold tracking-[-0.5px]">Owner dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">View your claimed venues, profile performance and enquiry activity.</p>
        </div>
        {isLoading ? <LoadingState message="Loading owner dashboard..." /> : error ? <ErrorState message={error} /> : !venues.length ? <OwnerNoVenuesState /> : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <Metric label="Claimed venues" value={venues.length} />
              <Metric label="Profile views" value={totals.profileViews} />
              <Metric label="Enquiries" value={totals.enquiries} />
              <Metric label="Directions" value={totals.directionsClicks} />
              <Metric label="Active promotions" value={totals.activeOffers + totals.activeFeatured} />
            </div>
            <div className="grid gap-4">
              {venues.map((venue) => <OwnerVenueCard key={venue.id} venue={venue} analytics={analytics[venue.id]} enquiries={enquiries[venue.id]} commercial={commercial[venue.id]} />)}
            </div>
          </>
        )}
      </div>
    </OwnerLayout>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>;
}

function last30Days() {
  return { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), to: new Date().toISOString() };
}
