import type { VenuePlan, VenueSubscription, VenueSubscriptionStatus } from "@/types/subscriptions";

export type VenuePlanFeature =
  | "owner_dashboard"
  | "basic_analytics"
  | "profile_update_requests"
  | "enquiry_summary"
  | "owner_enquiry_inbox"
  | "promoted_offers"
  | "improved_analytics"
  | "featured_placements"
  | "advanced_analytics"
  | "monthly_performance_summary";

const PLAN_RANK: Record<VenuePlan, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  pro: 3,
};

const FEATURE_MIN_PLAN: Record<VenuePlanFeature, VenuePlan> = {
  owner_dashboard: "free",
  basic_analytics: "free",
  profile_update_requests: "starter",
  enquiry_summary: "free",
  owner_enquiry_inbox: "growth",
  promoted_offers: "growth",
  improved_analytics: "growth",
  featured_placements: "pro",
  advanced_analytics: "pro",
  monthly_performance_summary: "pro",
};

const ACTIVE_STATUSES: VenueSubscriptionStatus[] = ["trial", "active", "past_due"];

export function hasPlanAccess(input: { plan: VenuePlan; status: VenueSubscriptionStatus; feature: VenuePlanFeature }): boolean {
  const requiredPlan = FEATURE_MIN_PLAN[input.feature];

  if (requiredPlan === "free") return true;
  if (!ACTIVE_STATUSES.includes(input.status)) return false;

  return PLAN_RANK[input.plan] >= PLAN_RANK[requiredPlan];
}

export function subscriptionHasPlanAccess(subscription: VenueSubscription | null, feature: VenuePlanFeature): boolean {
  return hasPlanAccess({ plan: subscription?.plan ?? "free", status: subscription?.status ?? "inactive", feature });
}

export function getRequiredPlanForFeature(feature: VenuePlanFeature): VenuePlan {
  return FEATURE_MIN_PLAN[feature];
}
