import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerNextStepsCard, OwnerVenueAnalyticsCards, OwnerVenueCommercialSummary as OwnerVenueCommercialSummarySection, OwnerVenueEnquiryInboxCta, OwnerVenueEnquirySummary as OwnerVenueEnquirySummarySection, OwnerVenueHeader, OwnerVenueMediaSummary, OwnerVenueProfilePreview, OwnerVenueStatusCards } from "@/components/owner/OwnerVenueSections";
import { OwnerLaunchChecklist } from "@/components/owner/onboarding/OwnerLaunchChecklist";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { getMyClaimedVenue } from "@/services/ownerVenueService";
import { getOwnerVenueAnalyticsSummary, type OwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";
import { getOwnerVenueCommercialSummary, type OwnerVenueCommercialSummary as OwnerVenueCommercialSummaryData } from "@/services/ownerCommercialSummaryService";
import { getOwnerVenueEnquirySummary, type OwnerVenueEnquirySummary as OwnerVenueEnquirySummaryData } from "@/services/ownerVenueEnquirySummaryService";
import { getOwnerVenueMedia } from "@/services/ownerVenueMediaService";
import { getOwnerVenueSubscription } from "@/services/ownerSubscriptionService";
import { initialiseOwnerOnboardingTasks, markOwnerOnboardingTaskCompleted } from "@/services/ownerOnboardingService";
import type { VenueSubscription } from "@/types/subscriptions";
import type { OwnerOnboardingTask, OwnerOnboardingTaskKey } from "@/types/ownerOnboarding";
import type { Venue } from "@/types/venue";
import type { VenueMedia } from "@/types/venueMedia";

export function OwnerVenueDashboardPage() {
  const { venueId = "" } = useParams();
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [analytics, setAnalytics] = useState<OwnerVenueAnalyticsSummary | null>(null);
  const [enquiries, setEnquiries] = useState<OwnerVenueEnquirySummaryData | null>(null);
  const [commercial, setCommercial] = useState<OwnerVenueCommercialSummaryData | null>(null);
  const [subscription, setSubscription] = useState<VenueSubscription | null>(null);
  const [media, setMedia] = useState<VenueMedia[]>([]);
  const [onboardingTasks, setOnboardingTasks] = useState<OwnerOnboardingTask[]>([]);
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
        const [nextAnalytics, nextEnquiries, nextCommercial, nextSubscription, nextMedia, nextOnboardingTasks] = await Promise.all([
          getOwnerVenueAnalyticsSummary({ userId: user.id, venueId: nextVenue.id, from: range.from, to: range.to }),
          getOwnerVenueEnquirySummary({ userId: user.id, venueId: nextVenue.id }),
          getOwnerVenueCommercialSummary({ userId: user.id, venueId: nextVenue.id }),
          getOwnerVenueSubscription({ userId: user.id, venueId: nextVenue.id }),
          getOwnerVenueMedia({ userId: user.id, venueId: nextVenue.id }).catch(() => []),
          initialiseOwnerOnboardingTasks({ userId: user.id, venueId: nextVenue.id }).catch(() => []),
        ]);
        if (cancelled) return;
        setAnalytics(nextAnalytics);
        setEnquiries(nextEnquiries);
        setCommercial(nextCommercial);
        setSubscription(nextSubscription);
        setMedia(nextMedia);
        setOnboardingTasks(nextOnboardingTasks);
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

  async function handleCompleteTask(taskKey: OwnerOnboardingTaskKey) {
    if (!user || !venue) return;
    await markOwnerOnboardingTaskCompleted({ userId: user.id, venueId: venue.id, taskKey });
    setOnboardingTasks((tasks) => tasks.map((task) => task.taskKey === taskKey ? { ...task, status: "completed", completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : task));
  }

  return (
    <OwnerLayout>
      <PageMeta title={venue ? `${venue.name} owner dashboard | nokta` : "Owner venue dashboard | nokta"} description="View read-only venue performance and commercial activity." />
      {isLoading ? <LoadingState message="Loading venue dashboard..." /> : error || !venue || !analytics || !enquiries || !commercial ? <ErrorState title="Venue dashboard not found" message={error ?? "You do not have access to this venue dashboard."} /> : (
        <div className="space-y-6">
          <OwnerVenueHeader venue={venue} />
          {onboardingTasks.length ? <OwnerLaunchChecklist venue={venue} tasks={onboardingTasks} onComplete={handleCompleteTask} /> : null}
          <OwnerVenueStatusCards venue={venue} subscription={subscription} />
          <OwnerVenueMediaSummary venue={venue} media={media} />
          <OwnerVenueAnalyticsCards analytics={analytics} />
          <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Analytics and value reporting</h2>
              <p className="mt-1 text-sm text-muted-foreground">See profile views, customer actions, booking requests, trends and practical improvement ideas.</p>
            </div>
            <Button asChild>
              <Link to={`/owner/venues/${venue.slug}/analytics`}>View analytics</Link>
            </Button>
          </section>
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
