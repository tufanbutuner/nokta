import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { PlanBadge } from "@/components/subscriptions/PlanBadge";
import { PricingPlansTable } from "@/components/subscriptions/PricingPlansTable";
import { PageMeta } from "@/components/seo/PageMeta";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { PLAN_CONFIG } from "@/lib/planConfig";
import { trackEvent } from "@/lib/analytics";
import { createOwnerBillingPortalSession, createOwnerCheckoutSession, refreshOwnerSubscription } from "@/services/ownerBillingService";
import { getOwnerVenueSubscriptions } from "@/services/ownerSubscriptionService";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import type { PaidVenuePlan } from "@/lib/stripePlanConfig";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

export function OwnerBillingPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, VenueSubscription>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [actionVenueId, setActionVenueId] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState(searchParams.get("venue") ?? "");
  const [choosingPlan, setChoosingPlan] = useState<PaidVenuePlan | null>(null);
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
      setSelectedVenueId((current) => current || nextVenues[0]?.id || "");
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

  const selectedSubscription = selectedVenueId ? subscriptions[selectedVenueId] : null;
  const venueOptions = useMemo(() => venues.map((venue) => ({ label: venue.name, value: venue.id })), [venues]);

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
      <PageMeta title="Plan & billing | nokta" description="Compare nokta venue plans and manage billing." canonicalPath="/owner/billing" />
      {isLoading ? <LoadingState message="Loading billing..." /> : error ? <ErrorState message={error} /> : (
        <div className="space-y-6">
          <div>
            <h1 className="font-brand text-[23px] font-bold tracking-[-0.4px] text-nokta-ink">Plan &amp; billing</h1>
            <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">Stripe is the payment source of truth. Plan access unlocks after Stripe confirms the subscription.</p>
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
                      <Button asChild variant="outline"><a href="#owner-plans" onClick={() => setSelectedVenueId(venue.id)}>Change plan</a></Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <section id="owner-plans" className="space-y-4 scroll-mt-6">
            <div>
              <h2 className="font-brand text-xl font-bold tracking-[-0.5px]">Compare plans</h2>
              <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">Choose a venue, start Stripe Checkout, and your plan unlocks automatically after Stripe confirms payment.</p>
            </div>
            {!venues.length ? (
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-brand text-xl font-bold tracking-[-0.5px]">Claim a venue before choosing a plan</h3>
                <p className="mt-2 text-sm text-muted-foreground">Paid owner tools attach to a claimed venue profile.</p>
                <Button asChild className="mt-4"><Link to="/discover">Find your venue</Link></Button>
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-5">
                <label htmlFor="owner-plan-venue" className="text-sm font-medium">Upgrade venue</label>
                <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(280px,420px)_1fr] lg:items-center">
                  <Select id="owner-plan-venue" value={selectedVenueId} onValueChange={setSelectedVenueId} options={venueOptions} />
                  <p className="text-sm text-muted-foreground">Current plan: {PLAN_CONFIG[selectedSubscription?.plan ?? "free"].name}{selectedSubscription?.billingProvider === "stripe" ? " • Stripe billing" : ""}</p>
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
          </section>
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
