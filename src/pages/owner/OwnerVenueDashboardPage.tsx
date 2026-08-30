import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerNextStepsCard, OwnerVenueAnalyticsCards, OwnerVenueCommercialSummary as OwnerVenueCommercialSummarySection, OwnerVenueEnquiryInboxCta, OwnerVenueEnquirySummary as OwnerVenueEnquirySummarySection, OwnerVenueHeader, OwnerVenueProfilePreview, OwnerVenueStatusCards } from "@/components/owner/OwnerVenueSections";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { getMyClaimedVenue } from "@/services/ownerVenueService";
import { getOwnerVenueAnalyticsSummary, type OwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";
import { getOwnerVenueCommercialSummary, type OwnerVenueCommercialSummary as OwnerVenueCommercialSummaryData } from "@/services/ownerCommercialSummaryService";
import { getOwnerVenueEnquirySummary, type OwnerVenueEnquirySummary as OwnerVenueEnquirySummaryData } from "@/services/ownerVenueEnquirySummaryService";
import { getOwnerVenueSubscription } from "@/services/ownerSubscriptionService";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

export function OwnerVenueDashboardPage() {
  const { venueId = "" } = useParams();
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [analytics, setAnalytics] = useState<OwnerVenueAnalyticsSummary | null>(null);
  const [enquiries, setEnquiries] = useState<OwnerVenueEnquirySummaryData | null>(null);
  const [commercial, setCommercial] = useState<OwnerVenueCommercialSummaryData | null>(null);
  const [subscription, setSubscription] = useState<VenueSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const range = useMemo(last30Days, []);

  useEffect(() => {
    if (!user || !venueId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getMyClaimedVenue({ userId: user.id, venueId })
      .then(async (nextVenue) => {
        if (!nextVenue) throw new Error("Venue dashboard not found.");
        if (cancelled) return;
        setVenue(nextVenue);
        trackEvent("owner_venue_dashboard_viewed", { venueId: nextVenue.id, city: nextVenue.city, area: nextVenue.area, partnerTier: nextVenue.partnerTier });
        const [nextAnalytics, nextEnquiries, nextCommercial, nextSubscription] = await Promise.all([
          getOwnerVenueAnalyticsSummary({ userId: user.id, venueId: nextVenue.id, from: range.from, to: range.to }),
          getOwnerVenueEnquirySummary({ userId: user.id, venueId: nextVenue.id }),
          getOwnerVenueCommercialSummary({ userId: user.id, venueId: nextVenue.id }),
          getOwnerVenueSubscription({ userId: user.id, venueId: nextVenue.id }),
        ]);
        if (cancelled) return;
        setAnalytics(nextAnalytics);
        setEnquiries(nextEnquiries);
        setCommercial(nextCommercial);
        setSubscription(nextSubscription);
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Venue dashboard not found.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, user, venueId]);

  return (
    <OwnerLayout>
      <PageMeta title={venue ? `${venue.name} owner dashboard | Sheesha` : "Owner venue dashboard | Sheesha"} description="View read-only venue performance and commercial activity." />
      {isLoading ? <LoadingState message="Loading venue dashboard..." /> : error || !venue || !analytics || !enquiries || !commercial ? <ErrorState title="Venue dashboard not found" message={error ?? "You do not have access to this venue dashboard."} /> : (
        <div className="space-y-6">
          <OwnerVenueHeader venue={venue} />
          <OwnerVenueStatusCards venue={venue} subscription={subscription} />
          <OwnerVenueAnalyticsCards analytics={analytics} />
          <OwnerVenueEnquirySummarySection enquiries={enquiries} />
          <OwnerVenueEnquiryInboxCta venue={venue} subscription={subscription} />
          <OwnerVenueCommercialSummarySection commercial={commercial} venue={venue} subscription={subscription} />
          <div className="grid gap-6 lg:grid-cols-2">
            <OwnerVenueProfilePreview venue={venue} subscription={subscription} />
            <OwnerNextStepsCard venue={venue} commercial={commercial} enquiries={enquiries} />
          </div>
        </div>
      )}
    </OwnerLayout>
  );
}

function last30Days() {
  return { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), to: new Date().toISOString() };
}
