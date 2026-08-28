import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { createOwnerBillingPortalSession } from "@/services/ownerBillingService";
import { getOwnerVenueSubscriptions } from "@/services/ownerSubscriptionService";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

export function OwnerBillingPage() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, VenueSubscription>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [actionVenueId, setActionVenueId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setIsLoading(true);
    Promise.all([getMyClaimedVenues(user.id), getOwnerVenueSubscriptions(user.id)])
      .then(([nextVenues, nextSubscriptions]) => {
        if (cancelled) return;
        setVenues(nextVenues);
        setSubscriptions(Object.fromEntries(nextSubscriptions.map((subscription) => [subscription.venueId, subscription])));
        trackEvent("owner_billing_page_viewed");
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load billing.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

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
      <PageMeta title="Billing | Sheesha" description="Manage Sheesha venue billing and subscription plans." canonicalPath="/owner/billing" />
      {isLoading ? <LoadingState message="Loading billing..." /> : error ? <ErrorState message={error} /> : (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-clay-accent">Billing</p>
            <h1 className="mt-1 font-brand text-4xl font-bold tracking-[-0.5px]">Venue billing</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Stripe is the payment source of truth. Plan access unlocks after Stripe confirms the subscription.</p>
          </div>
          <div className="grid gap-3">
            {venues.map((venue) => {
              const subscription = subscriptions[venue.id];
              return (
                <article key={venue.id} className="rounded-xl border bg-card p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="font-brand text-xl font-bold tracking-[-0.5px]">{venue.name}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <PlanBadge plan={subscription?.plan ?? "free"} status={subscription?.status ?? "inactive"} />
                        <span className="text-sm capitalize text-muted-foreground">{subscription?.billingProvider === "stripe" ? "Stripe billing" : "Managed manually by Sheesha"}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {subscription?.currentPeriodEnd ? `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB")}` : `Current plan: ${PLAN_CONFIG[subscription?.plan ?? "free"].name}`}
                        {subscription?.cancelAtPeriodEnd ? " • Cancels at period end" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {subscription?.billingProvider === "stripe" && subscription.billingCustomerId ? (
                        <Button onClick={() => handleManageBilling(venue.id)} disabled={actionVenueId === venue.id}>
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
