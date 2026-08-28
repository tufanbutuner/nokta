import { useEffect } from "react";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { PricingPlansTable } from "@/components/subscriptions/PricingPlansTable";
import { PageMeta } from "@/components/seo/PageMeta";
import { trackEvent } from "@/lib/analytics";

export function OwnerPricingPage() {
  useEffect(() => {
    trackEvent("owner_pricing_viewed");
  }, []);

  return (
    <OwnerLayout>
      <PageMeta title="Venue plans | Sheesha" description="Compare Sheesha venue owner plans." canonicalPath="/owner/pricing" />
      <div className="space-y-6">
        <div>
          <p className="text-sm text-clay-accent">Venue plans</p>
          <h1 className="mt-1 font-brand text-4xl font-bold tracking-[-0.5px]">Manage and grow your venue profile</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Plans are manual for now. Contact Sheesha to upgrade a claimed venue before Stripe checkout is added.</p>
        </div>
        <PricingPlansTable />
      </div>
    </OwnerLayout>
  );
}
