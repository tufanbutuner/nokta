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
    name: "Claimed",
    monthlyPrice: 0,
    description: "Be found, look right and take booking requests.",
    features: ["Claimed badge", "Owner dashboard", "Profile and photo updates", "Booking requests and enquiries", "Last 30 days of analytics"],
  },
  starter: {
    plan: "starter",
    name: "Starter (legacy)",
    monthlyPrice: 29,
    description: "Manage your profile from your owner dashboard.",
    features: ["Everything in Free", "Structured profile update requests", "Opening hours updates", "Contact and social link updates", "Update request tracking"],
  },
  growth: {
    plan: "growth",
    name: "Growth",
    monthlyPrice: 49,
    description: "Handle demand without living in your inbox.",
    features: ["Everything in Claimed", "Full history and demand insights", "Monthly reporting", "Saved replies", "Priority profile support"],
  },
  pro: {
    plan: "pro",
    name: "Pro",
    monthlyPrice: 99,
    description: "Manage multiple venues and add visibility when you want it.",
    features: ["Everything in Growth", "Up to 3 venues", "Promoted offers", "Advanced venue analytics", "Quarterly performance call"],
  },
};

export const PLAN_OPTIONS = [PLAN_CONFIG.free, PLAN_CONFIG.growth, PLAN_CONFIG.pro].map((plan) => ({ label: plan.name, value: plan.plan }));
export const LEGACY_STARTER_PLAN_OPTION = { label: PLAN_CONFIG.starter.name, value: PLAN_CONFIG.starter.plan };
