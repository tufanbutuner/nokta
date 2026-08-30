import { subscriptionHasPlanAccess } from "@/lib/planFeatureAccess";
import type { VenueSubscription } from "@/types/subscriptions";

export function canRequestPromotedOffer(subscription: VenueSubscription | null): boolean {
  return subscriptionHasPlanAccess(subscription, "promoted_offers");
}

export function canRequestFeaturedPlacement(subscription: VenueSubscription | null): boolean {
  return subscriptionHasPlanAccess(subscription, "featured_placements");
}
