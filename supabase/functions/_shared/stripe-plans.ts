export type PaidVenuePlan = "starter" | "growth" | "pro";
export type SheeshaSubscriptionStatus = "inactive" | "trial" | "active" | "past_due" | "cancelled";

export function isPaidVenuePlan(plan: string): plan is PaidVenuePlan {
  return plan === "starter" || plan === "growth" || plan === "pro";
}

export function getStripePriceIdForPlan(plan: PaidVenuePlan) {
  const envName = {
    starter: "STRIPE_STARTER_PRICE_ID",
    growth: "STRIPE_GROWTH_PRICE_ID",
    pro: "STRIPE_PRO_PRICE_ID",
  }[plan];

  return Deno.env.get(envName) ?? null;
}

export function getPlanFromStripePriceId(priceId: string | null | undefined): PaidVenuePlan | null {
  if (!priceId) return null;
  if (priceId === Deno.env.get("STRIPE_STARTER_PRICE_ID")) return "starter";
  if (priceId === Deno.env.get("STRIPE_GROWTH_PRICE_ID")) return "growth";
  if (priceId === Deno.env.get("STRIPE_PRO_PRICE_ID")) return "pro";
  return null;
}

export function mapStripeSubscriptionStatusToSheeshaStatus(status: string): SheeshaSubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trial";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "cancelled";
    default:
      return "inactive";
  }
}

export function unixToIso(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}
