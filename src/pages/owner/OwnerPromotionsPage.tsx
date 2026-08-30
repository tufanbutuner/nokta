import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerNoVenuesState } from "@/components/owner/OwnerNoVenuesState";
import { OwnerActivePromotionsList } from "@/components/owner/promotions/OwnerActivePromotionsList";
import { OwnerPromotionRequestsList } from "@/components/owner/promotions/OwnerPromotionRequestsList";
import { OwnerPromotionSummaryCards } from "@/components/owner/promotions/OwnerPromotionSummaryCards";
import { OwnerPromotionUpgradeCard } from "@/components/owner/promotions/OwnerPromotionUpgradeCard";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { PlanBadge } from "@/components/subscriptions/PlanBadge";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { canRequestFeaturedPlacement, canRequestPromotedOffer } from "@/lib/ownerPromotionAccess";
import { cancelOwnerPromotionRequest, getMyPromotionRequests } from "@/services/ownerPromotionRequestService";
import { getOwnerVenueCommercialSummary, type OwnerVenueCommercialSummary } from "@/services/ownerCommercialSummaryService";
import { getOwnerVenueSubscriptions } from "@/services/ownerSubscriptionService";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import type { OwnerPromotionRequest } from "@/types/ownerPromotionRequests";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

export function OwnerPromotionsPage() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [requests, setRequests] = useState<OwnerPromotionRequest[]>([]);
  const [commercial, setCommercial] = useState<Record<string, OwnerVenueCommercialSummary>>({});
  const [subscriptions, setSubscriptions] = useState<Record<string, VenueSubscription>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    Promise.all([getMyClaimedVenues(user.id), getMyPromotionRequests(user.id), getOwnerVenueSubscriptions(user.id)])
      .then(async ([nextVenues, nextRequests, nextSubscriptions]) => {
        const summaries = await Promise.all(nextVenues.map((venue) => getOwnerVenueCommercialSummary({ userId: user.id, venueId: venue.id }).catch(() => null)));
        if (cancelled) return;
        setVenues(nextVenues);
        setRequests(nextRequests);
        setSubscriptions(Object.fromEntries(nextSubscriptions.map((subscription) => [subscription.venueId, subscription])));
        setCommercial(Object.fromEntries(summaries.flatMap((summary) => summary ? [[summary.venueId, summary]] : [])));
        trackEvent("owner_promotions_viewed", { ownedVenueCount: nextVenues.length });
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load promotions.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleCancel(request: OwnerPromotionRequest) {
    if (!user) return;
    const updated = await cancelOwnerPromotionRequest({ userId: user.id, requestId: request.id });
    setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
    trackEvent("owner_promotion_request_cancelled", { venueId: request.venueId, requestType: request.requestType, status: updated.status });
  }

  const activeOffers = Object.values(commercial).reduce((sum, item) => sum + item.activePromotedOffers, 0);
  const activeFeatured = Object.values(commercial).reduce((sum, item) => sum + item.activeFeaturedPlacements, 0);

  return (
    <OwnerLayout>
      <PageMeta title="Promotions | Sheesha" description="Request promoted offers and featured placements for your venue." canonicalPath="/owner/promotions" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-clay-accent">Owner dashboard</p>
            <h1 className="mt-1 font-brand text-4xl font-bold tracking-[-0.5px]">Promotions</h1>
            <p className="mt-2 text-sm text-muted-foreground">Request promoted offers and featured placements. Admin approval is required before anything goes live.</p>
          </div>
        </div>
        {isLoading ? <LoadingState message="Loading promotions..." /> : error ? <ErrorState message={error} /> : !venues.length ? <OwnerNoVenuesState /> : (
          <>
            <OwnerPromotionSummaryCards activeOffers={activeOffers} activeFeatured={activeFeatured} requests={requests} />
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Request a campaign</h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {venues.map((venue) => {
                  const subscription = subscriptions[venue.id] ?? null;
                  const canOffer = canRequestPromotedOffer(subscription);
                  const canFeatured = canRequestFeaturedPlacement(subscription);
                  return (
                    <div key={venue.id} className="rounded-xl border bg-background/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-medium">{venue.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{venue.city} · {venue.area}</p>
                        </div>
                        <PlanBadge plan={subscription?.plan ?? "free"} status={subscription?.status ?? "inactive"} />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {canOffer ? <Button asChild size="sm"><Link to={`/owner/venues/${venue.slug}/promotions/offers/new`}>Request offer</Link></Button> : null}
                        {canFeatured ? <Button asChild size="sm" variant="outline"><Link to={`/owner/venues/${venue.slug}/promotions/featured/new`}>Request featured</Link></Button> : null}
                      </div>
                      {!canOffer ? <div className="mt-4"><OwnerPromotionUpgradeCard feature="promoted_offers" currentPlan={subscription?.plan ?? "free"} venueId={venue.id} /></div> : null}
                      {canOffer && !canFeatured ? <div className="mt-4"><OwnerPromotionUpgradeCard feature="featured_placements" currentPlan={subscription?.plan ?? "free"} venueId={venue.id} /></div> : null}
                    </div>
                  );
                })}
              </div>
            </section>
            <section>
              <h2 className="text-xl font-semibold">Active promotions</h2>
              <div className="mt-4"><OwnerActivePromotionsList venues={venues} commercialByVenueId={commercial} /></div>
            </section>
            <section>
              <h2 className="text-xl font-semibold">Request history</h2>
              <div className="mt-4"><OwnerPromotionRequestsList requests={requests} venuesById={venuesById} onCancel={handleCancel} /></div>
            </section>
          </>
        )}
      </div>
    </OwnerLayout>
  );
}
