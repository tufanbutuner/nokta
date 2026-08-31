import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Select } from "@/components/ui/select";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { PricingPlansTable } from "@/components/subscriptions/PricingPlansTable";
import { PageMeta } from "@/components/seo/PageMeta";
import { trackEvent } from "@/lib/analytics";
import { createOwnerCheckoutSession } from "@/services/ownerBillingService";
import { getOwnerVenueSubscriptions } from "@/services/ownerSubscriptionService";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import { useAuth } from "@/context/AuthContext";
import { PLAN_CONFIG } from "@/lib/planConfig";
import type { PaidVenuePlan } from "@/lib/stripePlanConfig";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

export function OwnerPricingPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, VenueSubscription>>({});
  const [selectedVenueId, setSelectedVenueId] = useState(searchParams.get("venue") ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [choosingPlan, setChoosingPlan] = useState<PaidVenuePlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("owner_pricing_viewed");
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setIsLoading(true);
    Promise.all([getMyClaimedVenues(user.id), getOwnerVenueSubscriptions(user.id)])
      .then(([nextVenues, nextSubscriptions]) => {
        if (cancelled) return;
        setVenues(nextVenues);
        setSubscriptions(Object.fromEntries(nextSubscriptions.map((subscription) => [subscription.venueId, subscription])));
        setSelectedVenueId((current) => current || nextVenues[0]?.id || "");
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load pricing.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const selectedSubscription = selectedVenueId ? subscriptions[selectedVenueId] : null;
  const venueOptions = useMemo(() => venues.map((venue) => ({ label: venue.name, value: venue.id })), [venues]);

  async function handleChoosePlan(plan: PaidVenuePlan) {
    if (!selectedVenueId) return;

    try {
      setError(null);
      setChoosingPlan(plan);
      trackEvent("owner_checkout_started", { venueId: selectedVenueId, plan });
      const { url } = await createOwnerCheckoutSession({ venueId: selectedVenueId, plan });
      trackEvent("owner_checkout_redirected", { venueId: selectedVenueId, plan });
      window.location.href = url;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not start checkout.");
      setChoosingPlan(null);
    }
  }

  return (
    <OwnerLayout>
      <PageMeta title="Venue plans | nokta" description="Compare nokta venue owner plans." canonicalPath="/owner/pricing" />
      <div className="space-y-6">
        <div>
          <p className="text-sm text-clay-accent">Venue plans</p>
          <h1 className="mt-1 font-brand text-4xl font-bold tracking-[-0.5px]">Manage and grow your venue profile</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Choose a venue, start Stripe Checkout, and your plan unlocks automatically after Stripe confirms payment.</p>
        </div>
        {isLoading ? <LoadingState message="Loading plans..." /> : error ? <ErrorState message={error} /> : (
          <>
            {!venues.length ? (
              <div className="rounded-xl border bg-card p-6">
                <h2 className="font-brand text-xl font-bold tracking-[-0.5px]">Claim a venue before choosing a plan</h2>
                <p className="mt-2 text-sm text-muted-foreground">Paid owner tools attach to a claimed venue profile.</p>
                <Button asChild className="mt-4"><Link to="/discover">Find your venue</Link></Button>
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-5">
                <label htmlFor="owner-pricing-venue" className="text-sm font-medium">Upgrade venue</label>
                <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(280px,420px)_1fr_auto] lg:items-center">
                  <Select id="owner-pricing-venue" value={selectedVenueId} onValueChange={setSelectedVenueId} options={venueOptions} />
                  <p className="text-sm text-muted-foreground">
                    Current plan: {PLAN_CONFIG[selectedSubscription?.plan ?? "free"].name}
                    {selectedSubscription?.billingProvider === "stripe" ? " • Stripe billing" : ""}
                  </p>
                  {selectedSubscription?.billingProvider === "stripe" ? <Button asChild variant="outline"><Link to="/owner/billing">Manage billing</Link></Button> : null}
                </div>
              </div>
            )}
            <PricingPlansTable
              onChoosePlan={handleChoosePlan}
              isChoosingPlan={choosingPlan}
              disabled={!selectedVenueId || !venues.length}
              currentPlan={selectedSubscription?.plan ?? "free"}
              currentStatus={selectedSubscription?.status ?? "inactive"}
            />
          </>
        )}
      </div>
    </OwnerLayout>
  );
}
