import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerPromotedOfferRequestForm } from "@/components/owner/promotions/OwnerPromotedOfferRequestForm";
import { OwnerPromotionUpgradeCard } from "@/components/owner/promotions/OwnerPromotionUpgradeCard";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { canRequestPromotedOffer } from "@/lib/ownerPromotionAccess";
import { createOwnerPromotionRequest } from "@/services/ownerPromotionRequestService";
import { getOwnerVenueSubscription } from "@/services/ownerSubscriptionService";
import { getMyClaimedVenue } from "@/services/ownerVenueService";
import type { OwnerPromotionRequestInput } from "@/types/ownerPromotionRequests";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

export function OwnerRequestPromotedOfferPage() {
  const { user } = useAuth();
  const { venueId = "" } = useParams();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [subscription, setSubscription] = useState<VenueSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user || !venueId) return;
    let cancelled = false;
    setIsLoading(true);
    Promise.all([getMyClaimedVenue({ userId: user.id, venueId }), getOwnerVenueSubscription({ userId: user.id, venueId })])
      .then(([nextVenue, nextSubscription]) => {
        if (!nextVenue) throw new Error("Venue not found.");
        if (cancelled) return;
        setVenue(nextVenue);
        setSubscription(nextSubscription);
        trackEvent("owner_promotion_request_started", { venueId: nextVenue.id, requestType: "promoted_offer", plan: nextSubscription?.plan ?? "free" });
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load venue.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, venueId]);

  async function handleSubmit(request: OwnerPromotionRequestInput) {
    if (!user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createOwnerPromotionRequest({ userId: user.id, request });
      setSuccess(true);
      trackEvent("owner_promotion_request_submitted", { venueId: request.venueId, requestType: request.requestType, plan: subscription?.plan ?? "free" });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not submit promotion request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <OwnerLayout>
      <PageMeta title="Request promoted offer | nokta" description="Request a promoted offer for your venue." />
      {isLoading ? <LoadingState message="Loading request form..." /> : error && !venue ? <ErrorState message={error} /> : venue ? (
        <div className="max-w-3xl space-y-6">
          <div>
            <p className="text-sm text-clay-accent">Promotions</p>
            <h1 className="mt-1 font-brand text-4xl font-bold tracking-[-0.5px]">Request promoted offer</h1>
            <p className="mt-2 text-sm text-muted-foreground">{venue.name}</p>
          </div>
          {success ? (
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Request submitted</h2>
              <p className="mt-2 text-sm text-muted-foreground">nokta will review it before it goes live.</p>
              <Button asChild className="mt-5"><Link to="/owner/promotions">Back to promotions</Link></Button>
            </div>
          ) : canRequestPromotedOffer(subscription) ? (
            <>
              {error ? <ErrorState message={error} /> : null}
              <OwnerPromotedOfferRequestForm venue={venue} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </>
          ) : (
            <OwnerPromotionUpgradeCard feature="promoted_offers" currentPlan={subscription?.plan ?? "free"} venueId={venue.id} />
          )}
        </div>
      ) : null}
    </OwnerLayout>
  );
}
