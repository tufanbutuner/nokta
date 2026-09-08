export type VenuePlan = "free" | "starter" | "growth" | "pro";

export type VenueSubscriptionStatus = "inactive" | "trial" | "active" | "past_due" | "cancelled";

export type BillingProvider = "manual" | "stripe";

export interface VenueSubscription {
  id: string;
  venueId: string;
  plan: VenuePlan;
  status: VenueSubscriptionStatus;
  billingProvider: BillingProvider | null;
  billingCustomerId: string | null;
  billingSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeProductId: string | null;
  stripeMode: "test" | "live" | null;
  cancelAtPeriodEnd: boolean;
  lastStripeEventId: string | null;
  lastSyncedAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  cancelledAt: string | null;
  adminNotes: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueSubscriptionInput {
  venueId: string;
  plan: VenuePlan;
  status: VenueSubscriptionStatus;
  billingProvider?: BillingProvider | null;
  billingCustomerId?: string | null;
  billingSubscriptionId?: string | null;
  stripePriceId?: string | null;
  stripeProductId?: string | null;
  stripeMode?: "test" | "live" | null;
  cancelAtPeriodEnd?: boolean;
  lastStripeEventId?: string | null;
  lastSyncedAt?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  cancelledAt?: string | null;
  adminNotes?: string | null;
}

export interface BookingBandUsage {
  venueId: string;
  plan: VenuePlan;
  acceptedBookingsBand: number | null;
  acceptedBookings: number;
  periodStart: string;
  periodEnd: string;
}
