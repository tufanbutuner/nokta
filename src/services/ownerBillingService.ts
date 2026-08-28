import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { PaidVenuePlan } from "@/lib/stripePlanConfig";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

async function invokeBillingFunction<T>(functionName: string, body: Record<string, unknown>): Promise<T> {
  const client = ensureSupabase();
  const { data, error } = await client.functions.invoke<T>(functionName, { body });

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Billing service returned no data.");

  return data;
}

export async function createOwnerCheckoutSession(input: { venueId: string; plan: PaidVenuePlan }): Promise<{ url: string }> {
  return invokeBillingFunction("create-checkout-session", input);
}

export async function createOwnerBillingPortalSession(input: { venueId: string }): Promise<{ url: string }> {
  return invokeBillingFunction("create-billing-portal-session", input);
}
