import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PLAN_CONFIG } from "@/lib/planConfig";
import { getRequiredPlanForFeature, type VenuePlanFeature } from "@/lib/planFeatureAccess";
import { trackEvent } from "@/lib/analytics";
import type { VenuePlan } from "@/types/subscriptions";

const FEATURE_COPY: Partial<Record<VenuePlanFeature, string>> = {
  profile_update_requests: "Structured profile updates are part of the Starter plan.",
  owner_enquiry_inbox: "Owner enquiry inbox is available on Growth.",
  promoted_offers: "Promoted offers are available on Growth.",
  featured_placements: "Featured placements are available on Pro.",
  advanced_analytics: "Advanced analytics are available on Pro.",
  monthly_performance_summary: "Monthly performance summaries are available on Pro.",
};

export function UpgradePrompt({ feature, requiredPlan, currentPlan, venueId }: { feature: VenuePlanFeature; requiredPlan?: VenuePlan; currentPlan: VenuePlan; venueId?: string }) {
  const targetPlan = requiredPlan ?? getRequiredPlanForFeature(feature);
  const targetConfig = PLAN_CONFIG[targetPlan];

  return (
    <Alert className="border-clay-400/20 bg-clay-50 text-nokta-ink">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <strong>Unlock this feature with {targetConfig.name}.</strong>
          <span className="mt-1 block text-muted-foreground">{FEATURE_COPY[feature] ?? targetConfig.description}</span>
          <span className="mt-1 block text-xs text-muted-foreground">Current plan: {PLAN_CONFIG[currentPlan].name}</span>
        </div>
        <Button
          asChild
          variant="outline"
          onClick={() => trackEvent("owner_upgrade_prompt_clicked", { venueId, currentPlan, targetPlan, feature })}
        >
          <Link to="/owner/pricing">
            View plans <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Alert>
  );
}
