import { trackEvent } from "@/lib/analytics";
import { getVenueUpdateDiffLabels } from "@/lib/venueUpdateDiff";
import { filterOwnerEditableVenueChanges, validateVenueUpdateRequestInput } from "@/lib/venueUpdateRequestValidation";
import { mapVenueUpdateRequestRowToRequest } from "@/lib/venueUpdateRequestMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import { ownerVenueHasFeatureAccess } from "@/services/ownerSubscriptionService";
import type { VenueUpdateRequestRow } from "@/types/database";
import type { VenueUpdateRequest, VenueUpdateRequestInput } from "@/types/venueUpdateRequests";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function createOwnerVenueUpdateRequest(input: { userId: string; request: VenueUpdateRequestInput }): Promise<VenueUpdateRequest> {
  const validation = validateVenueUpdateRequestInput(input.request);
  if (!validation.isValid) throw new Error(Object.values(validation.errors)[0] ?? "Could not create update request.");
  const hasAccess = await ownerVenueHasFeatureAccess({ userId: input.userId, venueId: input.request.venueId, feature: "profile_update_requests" });
  if (!hasAccess) throw new Error("Profile update requests are available on the Starter plan.");

  const client = ensureSupabase();
  const requestedChanges = filterOwnerEditableVenueChanges(input.request.requestedChanges);
  const originalSnapshot = filterOwnerEditableVenueChanges(input.request.originalSnapshot);
  const { data, error } = await client
    .from("venue_update_requests")
    .insert({
      venue_id: input.request.venueId,
      submitted_by: input.userId,
      requested_changes: requestedChanges,
      original_snapshot: originalSnapshot,
      request_notes: nullableText(input.request.requestNotes),
    })
    .select("*")
    .single();

  if (error) throw new Error(`Could not submit update request: ${error.message}`);
  const request = mapVenueUpdateRequestRowToRequest(data as VenueUpdateRequestRow);
  trackEvent("owner_profile_update_submitted", { venueId: request.venueId, changedFields: getVenueUpdateDiffLabels(request).join(","), status: request.status });
  return request;
}

export async function getMyVenueUpdateRequests(userId: string): Promise<VenueUpdateRequest[]> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_update_requests").select("*").eq("submitted_by", userId).order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load update requests: ${error.message}`);
  return ((data ?? []) as VenueUpdateRequestRow[]).map(mapVenueUpdateRequestRowToRequest);
}

export async function getMyVenueUpdateRequestsForVenue(input: { userId: string; venueId: string }): Promise<VenueUpdateRequest[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_update_requests")
    .select("*")
    .eq("submitted_by", input.userId)
    .eq("venue_id", input.venueId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load update requests: ${error.message}`);
  return ((data ?? []) as VenueUpdateRequestRow[]).map(mapVenueUpdateRequestRowToRequest);
}

export async function cancelOwnerVenueUpdateRequest(input: { userId: string; requestId: string }): Promise<VenueUpdateRequest> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_update_requests")
    .update({ status: "cancelled" })
    .eq("id", input.requestId)
    .eq("submitted_by", input.userId)
    .eq("status", "pending")
    .select("*")
    .single();
  if (error) throw new Error(`Could not cancel update request: ${error.message}`);
  const request = mapVenueUpdateRequestRowToRequest(data as VenueUpdateRequestRow);
  trackEvent("owner_profile_update_cancelled", { venueId: request.venueId, changedFields: getVenueUpdateDiffLabels(request).join(","), status: request.status });
  return request;
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
