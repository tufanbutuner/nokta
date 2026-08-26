import { mapVenueClaimRequestRowToClaimRequest } from "@/lib/venueClaimMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { VenueClaimRequestRow } from "@/types/database";
import type { VenueClaimRequest, VenueClaimRequestInput } from "@/types/venueClaims";

function ensureSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }

  return supabase;
}

export async function createVenueClaimRequest(input: {
  userId: string;
  claim: VenueClaimRequestInput;
}): Promise<VenueClaimRequest> {
  const existingRequest = await getMyClaimRequestForVenue({ userId: input.userId, venueId: input.claim.venueId });

  if (existingRequest?.status === "pending") {
    return existingRequest;
  }

  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_claim_requests")
    .insert({
      venue_id: input.claim.venueId,
      submitted_by: input.userId,
      claimant_name: input.claim.claimantName.trim(),
      claimant_email: input.claim.claimantEmail.trim(),
      claimant_phone: nullableText(input.claim.claimantPhone),
      claimant_role: input.claim.claimantRole,
      business_email: nullableText(input.claim.businessEmail),
      business_phone: nullableText(input.claim.businessPhone),
      proof_notes: nullableText(input.claim.proofNotes),
      proof_url: nullableText(input.claim.proofUrl),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not submit claim request: ${error.message}`);
  }

  return mapVenueClaimRequestRowToClaimRequest(data as VenueClaimRequestRow);
}

export async function getMyVenueClaimRequests(userId: string): Promise<VenueClaimRequest[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_claim_requests")
    .select("*")
    .eq("submitted_by", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load claim requests: ${error.message}`);
  }

  return ((data ?? []) as VenueClaimRequestRow[]).map(mapVenueClaimRequestRowToClaimRequest);
}

export async function getMyClaimRequestForVenue(input: {
  userId: string;
  venueId: string;
}): Promise<VenueClaimRequest | null> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_claim_requests")
    .select("*")
    .eq("submitted_by", input.userId)
    .eq("venue_id", input.venueId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load claim request: ${error.message}`);
  }

  return data ? mapVenueClaimRequestRowToClaimRequest(data as VenueClaimRequestRow) : null;
}

export async function cancelMyVenueClaimRequest(input: {
  claimRequestId: string;
}): Promise<VenueClaimRequest> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_claim_requests")
    .update({ status: "cancelled" })
    .eq("id", input.claimRequestId)
    .eq("status", "pending")
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not cancel claim request: ${error.message}`);
  }

  return mapVenueClaimRequestRowToClaimRequest(data as VenueClaimRequestRow);
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
