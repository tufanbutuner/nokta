import { trackEvent } from "@/lib/analytics";
import { mapVenueSubscriptionRowToSubscription } from "@/lib/subscriptionMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { VenueSubscriptionRow } from "@/types/database";
import type { VenuePlan, VenueSubscription, VenueSubscriptionInput, VenueSubscriptionStatus } from "@/types/subscriptions";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getAdminVenueSubscriptions(): Promise<VenueSubscription[]> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_subscriptions").select("*").order("updated_at", { ascending: false });

  if (error) throw new Error(`Could not load venue subscriptions: ${error.message}`);
  return ((data ?? []) as VenueSubscriptionRow[]).map(mapVenueSubscriptionRowToSubscription);
}

export async function upsertVenueSubscription(input: { subscription: VenueSubscriptionInput; adminUserId: string }): Promise<VenueSubscription> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_subscriptions")
    .upsert(toRowInput(input.subscription, input.adminUserId), { onConflict: "venue_id" })
    .select()
    .single();

  if (error) throw new Error(`Could not save venue subscription: ${error.message}`);
  await syncVenuePartnerTier({ venueId: input.subscription.venueId, plan: input.subscription.plan });
  return mapVenueSubscriptionRowToSubscription(data as VenueSubscriptionRow);
}

export async function updateVenueSubscriptionPlan(input: {
  venueId: string;
  plan: VenuePlan;
  status: VenueSubscriptionStatus;
  adminUserId: string;
  adminNotes?: string | null;
}): Promise<VenueSubscription> {
  const subscription = await upsertVenueSubscription({
    subscription: {
      venueId: input.venueId,
      plan: input.plan,
      status: input.status,
      billingProvider: "manual",
      adminNotes: input.adminNotes,
      cancelledAt: input.status === "cancelled" ? new Date().toISOString() : null,
    },
    adminUserId: input.adminUserId,
  });
  trackEvent("admin_subscription_plan_updated", { venueId: input.venueId, targetPlan: input.plan, status: input.status });
  return subscription;
}

export async function startVenueSubscriptionTrial(input: {
  venueId: string;
  plan: Exclude<VenuePlan, "free">;
  trialDays: number;
  adminUserId: string;
  adminNotes?: string | null;
}): Promise<VenueSubscription> {
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + input.trialDays * 24 * 60 * 60 * 1000);
  const subscription = await upsertVenueSubscription({
    subscription: {
      venueId: input.venueId,
      plan: input.plan,
      status: "trial",
      billingProvider: "manual",
      trialStartedAt: now.toISOString(),
      trialEndsAt: trialEndsAt.toISOString(),
      adminNotes: input.adminNotes,
    },
    adminUserId: input.adminUserId,
  });
  trackEvent("admin_subscription_trial_started", { venueId: input.venueId, targetPlan: input.plan, status: "trial" });
  return subscription;
}

export async function cancelVenueSubscription(input: { venueId: string; adminUserId: string; adminNotes?: string | null }): Promise<VenueSubscription> {
  const subscription = await upsertVenueSubscription({
    subscription: {
      venueId: input.venueId,
      plan: "free",
      status: "cancelled",
      billingProvider: "manual",
      cancelledAt: new Date().toISOString(),
      adminNotes: input.adminNotes,
    },
    adminUserId: input.adminUserId,
  });
  trackEvent("admin_subscription_cancelled", { venueId: input.venueId, targetPlan: "free", status: "cancelled" });
  return subscription;
}

function toRowInput(subscription: VenueSubscriptionInput, adminUserId: string) {
  return {
    venue_id: subscription.venueId,
    plan: subscription.plan,
    status: subscription.status,
    billing_provider: subscription.billingProvider ?? "manual",
    current_period_start: subscription.currentPeriodStart ?? null,
    current_period_end: subscription.currentPeriodEnd ?? null,
    trial_started_at: subscription.trialStartedAt ?? null,
    trial_ends_at: subscription.trialEndsAt ?? null,
    cancelled_at: subscription.cancelledAt ?? null,
    admin_notes: subscription.adminNotes?.trim() || null,
    updated_by: adminUserId,
    created_by: adminUserId,
  };
}

async function syncVenuePartnerTier(input: { venueId: string; plan: VenuePlan }) {
  const client = ensureSupabase();
  const { error } = await client
    .from("venues")
    .update({ partner_tier: input.plan === "free" ? "none" : input.plan, updated_at: new Date().toISOString() })
    .eq("id", input.venueId);

  if (error) throw new Error(`Could not sync venue partner tier: ${error.message}`);
}
