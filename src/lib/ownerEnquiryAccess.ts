import { hasPlanAccess } from "@/lib/planFeatureAccess";
import type { VenueSubscription } from "@/types/subscriptions";

export function canAccessOwnerEnquiryInbox(subscription: VenueSubscription | null): boolean {
  return hasPlanAccess({
    plan: subscription?.plan ?? "free",
    status: subscription?.status ?? "inactive",
    feature: "owner_enquiry_inbox",
  });
}

export function getOwnerEnquiryInboxRequiredPlan(): "growth" {
  return "growth";
}
