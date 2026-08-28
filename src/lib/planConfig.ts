import type { VenuePlan } from "@/types/subscriptions";

export interface PlanConfig {
  plan: VenuePlan;
  name: string;
  monthlyPrice: number;
  description: string;
  features: string[];
}

export const PLAN_CONFIG: Record<VenuePlan, PlanConfig> = {
  free: {
    plan: "free",
    name: "Free Claimed Profile",
    monthlyPrice: 0,
    description: "Claim your profile and view basic performance.",
    features: ["Claimed badge", "Owner dashboard", "Public venue profile", "Limited analytics", "Enquiry summary"],
  },
  starter: {
    plan: "starter",
    name: "Starter",
    monthlyPrice: 29,
    description: "Manage your profile from your owner dashboard.",
    features: ["Everything in Free", "Structured profile update requests", "Opening hours updates", "Contact and social link updates", "Update request tracking"],
  },
  growth: {
    plan: "growth",
    name: "Growth",
    monthlyPrice: 59,
    description: "Get more from enquiries and offers.",
    features: ["Everything in Starter", "Owner enquiry inbox", "Promoted offers", "Improved analytics", "Priority profile support"],
  },
  pro: {
    plan: "pro",
    name: "Pro",
    monthlyPrice: 99,
    description: "Maximise your visibility and reporting.",
    features: ["Everything in Growth", "Featured placements", "Advanced venue analytics", "Offer performance reporting", "Monthly performance summary"],
  },
};

export const PLAN_OPTIONS = Object.values(PLAN_CONFIG).map((plan) => ({ label: plan.name, value: plan.plan }));
