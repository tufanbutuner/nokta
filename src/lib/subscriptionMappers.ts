import type { VenueSubscriptionRow } from "@/types/database";
import type { VenueSubscription } from "@/types/subscriptions";

export function mapVenueSubscriptionRowToSubscription(row: VenueSubscriptionRow): VenueSubscription {
  return {
    id: row.id,
    venueId: row.venue_id,
    plan: row.plan,
    status: row.status,
    billingProvider: row.billing_provider,
    billingCustomerId: row.billing_customer_id,
    billingSubscriptionId: row.billing_subscription_id,
    stripePriceId: row.stripe_price_id,
    stripeProductId: row.stripe_product_id,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    lastStripeEventId: row.last_stripe_event_id,
    lastSyncedAt: row.last_synced_at,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    trialStartedAt: row.trial_started_at,
    trialEndsAt: row.trial_ends_at,
    cancelledAt: row.cancelled_at,
    adminNotes: row.admin_notes,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createFreeSubscriptionFallback(input: { venueId: string; now?: string }): VenueSubscription {
  const now = input.now ?? new Date().toISOString();

  return {
    id: `free:${input.venueId}`,
    venueId: input.venueId,
    plan: "free",
    status: "inactive",
    billingProvider: "manual",
    billingCustomerId: null,
    billingSubscriptionId: null,
    stripePriceId: null,
    stripeProductId: null,
    cancelAtPeriodEnd: false,
    lastStripeEventId: null,
    lastSyncedAt: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    trialStartedAt: null,
    trialEndsAt: null,
    cancelledAt: null,
    adminNotes: null,
    createdBy: null,
    updatedBy: null,
    createdAt: now,
    updatedAt: now,
  };
}
