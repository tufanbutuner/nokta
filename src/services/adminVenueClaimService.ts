import { trackEvent } from "@/lib/analytics";
import { mapVenueClaimRequestRowToClaimRequest } from "@/lib/venueClaimMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { VenueClaimRequestRow } from "@/types/database";
import type { VenueClaimRequest, VenueClaimRequestStatus } from "@/types/venueClaims";

function ensureSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }

  return supabase;
}

export async function getAdminVenueClaimRequests(): Promise<VenueClaimRequest[]> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_claim_requests").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load venue claim requests: ${error.message}`);
  }

  return ((data ?? []) as VenueClaimRequestRow[]).map(mapVenueClaimRequestRowToClaimRequest);
}

export async function getAdminVenueClaimRequestsByStatus(status: VenueClaimRequestStatus): Promise<VenueClaimRequest[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_claim_requests")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load ${status} venue claim requests: ${error.message}`);
  }

  return ((data ?? []) as VenueClaimRequestRow[]).map(mapVenueClaimRequestRowToClaimRequest);
}

export async function updateVenueClaimRequestStatus(input: {
  claimRequestId: string;
  status: VenueClaimRequestStatus;
  adminUserId: string;
  adminNotes?: string | null;
}): Promise<VenueClaimRequest> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_claim_requests")
    .update({
      status: input.status,
      admin_notes: nullableText(input.adminNotes),
      reviewed_by: input.adminUserId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.claimRequestId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not update claim request: ${error.message}`);
  }

  return mapVenueClaimRequestRowToClaimRequest(data as VenueClaimRequestRow);
}

export async function approveVenueClaimRequest(input: {
  claimRequestId: string;
  venueId: string;
  submittedBy: string;
  adminUserId: string;
  adminNotes?: string | null;
}): Promise<VenueClaimRequest> {
  const client = ensureSupabase();
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("venue_claim_requests")
    .update({
      status: "approved",
      admin_notes: nullableText(input.adminNotes),
      reviewed_by: input.adminUserId,
      reviewed_at: now,
    })
    .eq("id", input.claimRequestId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not approve claim request: ${error.message}`);
  }

  const { error: venueError } = await client
    .from("venues")
    .update({
      is_claimed: true,
      claimed_by: input.submittedBy,
      claimed_at: now,
      monetisation_status: "interested",
    })
    .eq("id", input.venueId);

  if (venueError) {
    throw new Error(`Claim approved, but venue could not be marked claimed: ${venueError.message}`);
  }

  trackEvent("venue_claim_approved", { venueId: input.venueId });
  return mapVenueClaimRequestRowToClaimRequest(data as VenueClaimRequestRow);
}

export async function rejectVenueClaimRequest(input: {
  claimRequestId: string;
  adminUserId: string;
  adminNotes?: string | null;
}): Promise<VenueClaimRequest> {
  const claim = await updateVenueClaimRequestStatus({
    claimRequestId: input.claimRequestId,
    status: "rejected",
    adminUserId: input.adminUserId,
    adminNotes: input.adminNotes,
  });
  trackEvent("venue_claim_rejected", { venueId: claim.venueId });
  return claim;
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
