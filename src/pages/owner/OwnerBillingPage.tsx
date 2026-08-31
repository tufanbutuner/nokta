import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { PlanBadge } from "@/components/subscriptions/PlanBadge";
import { PageMeta } from "@/components/seo/PageMeta";
import { useAuth } from "@/context/AuthContext";
import { PLAN_CONFIG } from "@/lib/planConfig";
import { trackEvent } from "@/lib/analytics";
import { createOwnerBillingPortalSession, refreshOwnerSubscription } from "@/services/ownerBillingService";
import { getOwnerVenueSubscriptions } from "@/services/ownerSubscriptionService";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

export function OwnerBillingPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, VenueSubscription>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [actionVenueId, setActionVenueId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPortalReturn = searchParams.get("portal_return") === "1";

  const loadBilling = useCallback(async (input: { showLoading?: boolean; refreshStripe?: boolean } = {}) => {
    if (!user) return;

    if (input.showLoading ?? true) setIsLoading(true);
    try {
      const [nextVenues, nextSubscriptions] = await Promise.all([getMyClaimedVenues(user.id), getOwnerVenueSubscriptions(user.id)]);
      if (input.refreshStripe) {
        await Promise.all(
          nextSubscriptions
            .filter((subscription) => subscription.billingProvider === "stripe" && subscription.billingSubscriptionId)
            .map((subscription) => refreshOwnerSubscription({ venueId: subscription.venueId }).catch(() => null)),
        );
      }
      const refreshedSubscriptions = input.refreshStripe ? await getOwnerVenueSubscriptions(user.id) : nextSubscriptions;
      setVenues(nextVenues);
      setSubscriptions(Object.fromEntries(refreshedSubscriptions.map((subscription) => [subscription.venueId, subscription])));
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not load billing.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadBilling({ refreshStripe: isPortalReturn });
    trackEvent("owner_billing_page_viewed", { portalReturn: isPortalReturn });
  }, [isPortalReturn, loadBilling]);

  useEffect(() => {
    if (!isPortalReturn) return;
    const timers = [1500, 4000, 8000].map((delay) => window.setTimeout(() => void loadBilling({ showLoading: false, refreshStripe: true }), delay));
    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [isPortalReturn, loadBilling]);

  async function handleManageBilling(venueId: string) {
    try {
      setActionVenueId(venueId);
      const { url } = await createOwnerBillingPortalSession({ venueId });
      trackEvent("owner_billing_portal_opened", { venueId });
      window.location.href = url;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not open billing portal.");
      setActionVenueId(null);
    }
  }

  return (
    <OwnerLayout>
      <PageMeta title="Billing | nokta" description="Manage nokta venue billing and subscription plans." canonicalPath="/owner/billing" />
      {isLoading ? <LoadingState message="Loading billing..." /> : error ? <ErrorState message={error} /> : (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-clay-accent">Billing</p>
            <h1 className="mt-1 font-brand text-4xl font-bold tracking-[-0.5px]">Venue billing</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Stripe is the payment source of truth. Plan access unlocks after Stripe confirms the subscription.</p>
            {isPortalReturn ? <p className="mt-2 text-sm text-muted-foreground">Just returned from Stripe. We are refreshing your billing status while Stripe confirms the latest change.</p> : null}
          </div>
          <div className="grid gap-3">
            {venues.map((venue) => {
              const subscription = subscriptions[venue.id];
              const isStripeSubscription = subscription?.billingProvider === "stripe";
              const canManageBilling = isStripeSubscription && Boolean(subscription.billingCustomerId);
              return (
                <article key={venue.id} className="rounded-xl border bg-card p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="font-brand text-xl font-bold tracking-[-0.5px]">{venue.name}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <PlanBadge plan={subscription?.plan ?? "free"} status={subscription?.status ?? "inactive"} />
                        <span className="text-sm capitalize text-muted-foreground">{isStripeSubscription ? "Stripe billing" : "Managed manually by nokta"}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatBillingPeriod(subscription)}
                      </p>
                      {isStripeSubscription && !subscription.billingCustomerId ? (
                        <p className="mt-2 text-xs text-muted-foreground">Stripe is still syncing this subscription. Billing management will appear after the webhook stores the customer ID.</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isStripeSubscription ? (
                        <Button onClick={() => handleManageBilling(venue.id)} disabled={!canManageBilling || actionVenueId === venue.id}>
                          {actionVenueId === venue.id ? "Opening..." : "Manage billing"} <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button asChild variant="outline"><Link to={`/owner/pricing?venue=${venue.id}`}>Change plan</Link></Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </OwnerLayout>
  );
}

function formatBillingPeriod(subscription?: VenueSubscription) {
  if (!subscription) return `Current plan: ${PLAN_CONFIG.free.name}`;
  if (subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd) return `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB")}`;
  if (subscription.cancelAtPeriodEnd) return "Cancels at period end";
  if (subscription.currentPeriodEnd) return `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB")}`;
  if (subscription.cancelledAt) return `Cancelled ${new Date(subscription.cancelledAt).toLocaleDateString("en-GB")}`;
  return `Current plan: ${PLAN_CONFIG[subscription.plan].name}`;
}
