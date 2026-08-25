import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { MonetisationStatus, PartnerTier } from "@/types/monetisation";

function ensureSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }

  return supabase;
}

export async function updateVenueMonetisationStatus(input: {
  venueId: string;
  status: MonetisationStatus;
  notes?: string | null;
}): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client
    .from("venues")
    .update({
      monetisation_status: input.status,
      monetisation_notes: nullableText(input.notes),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.venueId);

  if (error) {
    throw new Error(`Could not update monetisation status: ${error.message}`);
  }
}

export async function updateVenuePartnerTier(input: { venueId: string; partnerTier: PartnerTier }): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client
    .from("venues")
    .update({
      partner_tier: input.partnerTier,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.venueId);

  if (error) {
    throw new Error(`Could not update partner tier: ${error.message}`);
  }
}

export async function updateVenueClaimStatus(input: {
  venueId: string;
  isClaimed: boolean;
  claimedBy?: string | null;
}): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client
    .from("venues")
    .update({
      is_claimed: input.isClaimed,
      claimed_by: input.isClaimed ? nullableText(input.claimedBy) : null,
      claimed_at: input.isClaimed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.venueId);

  if (error) {
    throw new Error(`Could not update claim status: ${error.message}`);
  }
}

export async function updateVenueFeaturedEligibility(input: {
  venueId: string;
  featuredEligible: boolean;
  blockedReason?: string | null;
}): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client
    .from("venues")
    .update({
      featured_eligible: input.featuredEligible,
      featured_blocked_reason: input.featuredEligible ? null : nullableText(input.blockedReason),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.venueId);

  if (error) {
    throw new Error(`Could not update featured eligibility: ${error.message}`);
  }
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
