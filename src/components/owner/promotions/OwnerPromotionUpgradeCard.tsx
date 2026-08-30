import { UpgradePrompt } from "@/components/subscriptions/UpgradePrompt";
import type { VenuePlan } from "@/types/subscriptions";
import type { VenuePlanFeature } from "@/lib/planFeatureAccess";

export function OwnerPromotionUpgradeCard({ feature, currentPlan, venueId }: { feature: VenuePlanFeature; currentPlan: VenuePlan; venueId?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <UpgradePrompt feature={feature} currentPlan={currentPlan} venueId={venueId} />
    </div>
  );
}
