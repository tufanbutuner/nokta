import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_CONFIG } from "@/lib/planConfig";
import { isPaidPlan, type PaidVenuePlan } from "@/lib/stripePlanConfig";
import { cn } from "@/lib/utils";

const FEATURE_ROWS = [
  "Claimed venue badge",
  "Owner dashboard",
  "Basic analytics",
  "Profile update requests",
  "Update request tracking",
  "Enquiry summary",
  "Owner enquiry inbox",
  "Promoted offers",
  "Featured placements",
  "Advanced analytics",
  "Monthly performance summary",
  "Priority support",
];

const PLAN_FEATURES: Record<keyof typeof PLAN_CONFIG, string[]> = {
  free: ["Claimed venue badge", "Owner dashboard", "Basic analytics", "Enquiry summary"],
  starter: ["Claimed venue badge", "Owner dashboard", "Basic analytics", "Profile update requests", "Update request tracking", "Enquiry summary"],
  growth: ["Claimed venue badge", "Owner dashboard", "Basic analytics", "Profile update requests", "Update request tracking", "Enquiry summary", "Owner enquiry inbox", "Promoted offers", "Priority support"],
  pro: FEATURE_ROWS,
};

export function PricingPlansTable({ onChoosePlan, isChoosingPlan, disabled }: { onChoosePlan?: (plan: PaidVenuePlan) => void; isChoosingPlan?: PaidVenuePlan | null; disabled?: boolean }) {
  const plans = Object.values(PLAN_CONFIG);

  return (
    <section className="grid gap-4 lg:grid-cols-4">
      {plans.map((plan) => (
        <article key={plan.plan} className={cn("rounded-xl border bg-card p-5", plan.plan === "starter" ? "border-clay-400 shadow-sm" : "")}>
          <p className="font-brand text-xl font-bold tracking-[-0.5px]">{plan.name}</p>
          <div className="mt-3 flex items-end gap-1">
            <span className="text-3xl font-semibold">£{plan.monthlyPrice}</span>
            <span className="pb-1 text-sm text-muted-foreground">/month</span>
          </div>
          <p className="mt-3 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
          <Button
            variant={plan.plan === "starter" ? "default" : "outline"}
            className="mt-5 w-full"
            disabled={!isPaidPlan(plan.plan) || disabled || isChoosingPlan === plan.plan}
            onClick={() => {
              if (isPaidPlan(plan.plan)) onChoosePlan?.(plan.plan);
            }}
          >
            {plan.plan === "free" ? "Current free plan" : isChoosingPlan === plan.plan ? "Opening checkout..." : `Choose ${plan.name}`}
          </Button>
          <ul className="mt-5 space-y-2 text-sm">
            {FEATURE_ROWS.map((feature) => {
              const included = PLAN_FEATURES[plan.plan].includes(feature);
              return (
                <li key={feature} className={cn("flex items-start gap-2", included ? "text-sheesh-ink" : "text-muted-foreground/50")}>
                  <Check className={cn("mt-0.5 h-4 w-4", included ? "text-clay-500" : "text-transparent")} />
                  {feature}
                </li>
              );
            })}
          </ul>
        </article>
      ))}
    </section>
  );
}
