import type { VenuePlan } from "@/types/subscriptions";

export type PaidVenuePlan = Exclude<VenuePlan, "free">;

export const PAID_PLANS: PaidVenuePlan[] = ["starter", "growth", "pro"];

export function isPaidPlan(plan: VenuePlan): plan is PaidVenuePlan {
  return plan !== "free";
}
