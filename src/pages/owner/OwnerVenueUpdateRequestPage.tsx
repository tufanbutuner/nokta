import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerVenueTabShell } from "@/components/owner/OwnerVenueTabShell";
import { ProfileCompletenessCard } from "@/components/owner/analytics/ProfileCompletenessCard";
import { OwnerVenueUpdateForm } from "@/components/owner/updates/OwnerVenueUpdateForm";
import { OwnerVenueUpdateRequestsList } from "@/components/owner/updates/OwnerVenueUpdateRequestsList";
import { PageMeta } from "@/components/seo/PageMeta";
import { UpgradePrompt } from "@/components/subscriptions/UpgradePrompt";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { subscriptionHasPlanAccess } from "@/lib/planFeatureAccess";
import { getOwnerVenueSubscription } from "@/services/ownerSubscriptionService";
import { getMyClaimedVenue } from "@/services/ownerVenueService";
import { createOwnerVenueUpdateRequest, getMyVenueUpdateRequestsForVenue, cancelOwnerVenueUpdateRequest } from "@/services/ownerVenueUpdateRequestService";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";
import type { VenueUpdateRequest, VenueUpdateRequestInput } from "@/types/venueUpdateRequests";

export function OwnerVenueUpdateRequestPage() {
  const { venueId = "" } = useParams();
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [subscription, setSubscription] = useState<VenueSubscription | null>(null);
  const [requests, setRequests] = useState<VenueUpdateRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user || !venueId) return;
    let cancelled = false;
    getMyClaimedVenue({ userId: user.id, venueId })
      .then(async (nextVenue) => {
        if (!nextVenue) throw new Error("Venue dashboard not found.");
        const [nextRequests, nextSubscription] = await Promise.all([
          getMyVenueUpdateRequestsForVenue({ userId: user.id, venueId: nextVenue.id }),
          getOwnerVenueSubscription({ userId: user.id, venueId: nextVenue.id }),
        ]);
        return { nextVenue, nextRequests, nextSubscription };
      })
      .then(({ nextVenue, nextRequests, nextSubscription }) => {
        if (cancelled) return;
        setVenue(nextVenue);
        setRequests(nextRequests);
        setSubscription(nextSubscription);
        trackEvent("owner_profile_update_started", { venueId: nextVenue.id, city: nextVenue.city, area: nextVenue.area, partnerTier: nextVenue.partnerTier });
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load update request page.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, venueId]);

  async function handleSubmit(input: VenueUpdateRequestInput) {
    if (!user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const request = await createOwnerVenueUpdateRequest({ userId: user.id, request: input });
      setRequests((current) => [request, ...current]);
      setSuccess(true);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not submit update request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(request: VenueUpdateRequest) {
    if (!user) return;
    const updated = await cancelOwnerVenueUpdateRequest({ userId: user.id, requestId: request.id });
    setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
  }

  return (
    <OwnerLayout>
      <PageMeta title={venue ? `${venue.name} profile | nokta` : "Venue profile | nokta"} description="Review venue profile details and submit approved-field changes." canonicalPath={venue ? `/owner/venues/${venue.slug}/profile` : undefined} />
      {isLoading ? <LoadingState message="Loading update request..." /> : error && !venue ? <ErrorState message={error} /> : venue ? (
        <OwnerVenueTabShell
          venue={venue}
          title={venue.name}
          actions={<Button asChild variant="outline" className="h-[34px] text-[13px]"><Link to={`/venues/${venue.slug}`}>Preview public page</Link></Button>}
        >
        <div className="space-y-5">
          <ProfileCompletenessCard venue={venue} subscription={subscription} />
          {!subscriptionHasPlanAccess(subscription, "profile_update_requests") ? (
            <UpgradePrompt feature="profile_update_requests" requiredPlan="starter" currentPlan={subscription?.plan ?? "free"} venueId={venue.id} />
          ) : success ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">Your update request has been submitted for admin review.</Alert>
          ) : (
            <OwnerVenueUpdateForm venue={venue} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          )}
          {error ? <Alert className="border-destructive/30 text-destructive">{error}</Alert> : null}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Latest update requests</h2>
            <OwnerVenueUpdateRequestsList requests={requests} onCancel={handleCancel} />
          </section>
        </div>
        </OwnerVenueTabShell>
      ) : null}
    </OwnerLayout>
  );
}
