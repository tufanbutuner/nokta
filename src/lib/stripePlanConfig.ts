import type { VenuePlan } from "@/types/subscriptions";

export type PaidVenuePlan = Extract<VenuePlan, "growth" | "pro">;

export const PAID_PLANS: PaidVenuePlan[] = ["growth", "pro"];

export function isPaidPlan(plan: VenuePlan): plan is PaidVenuePlan {
  return plan === "growth" || plan === "pro";
}
