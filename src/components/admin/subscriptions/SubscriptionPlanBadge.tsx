import { PlanBadge } from "@/components/subscriptions/PlanBadge";
import type { VenuePlan, VenueSubscriptionStatus } from "@/types/subscriptions";

export function SubscriptionPlanBadge({ plan, status }: { plan: VenuePlan; status?: VenueSubscriptionStatus }) {
  return <PlanBadge plan={plan} status={status} compact />;
}
