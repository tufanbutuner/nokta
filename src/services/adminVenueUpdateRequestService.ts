import { trackEvent } from "@/lib/analytics";
import { getVenueUpdateDiffLabels } from "@/lib/venueUpdateDiff";
import { filterOwnerEditableVenueChanges } from "@/lib/venueUpdateRequestValidation";
import { mapVenueUpdateRequestRowToRequest } from "@/lib/venueUpdateRequestMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { VenueUpdateRequestRow } from "@/types/database";
import type { VenueProfileUpdateChanges, VenueUpdateRequest } from "@/types/venueUpdateRequests";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getAdminVenueUpdateRequests(): Promise<VenueUpdateRequest[]> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_update_requests").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load venue update requests: ${error.message}`);
  return ((data ?? []) as VenueUpdateRequestRow[]).map(mapVenueUpdateRequestRowToRequest);
}

export async function approveVenueUpdateRequest(input: { requestId: string; adminUserId: string; adminNotes?: string | null }): Promise<VenueUpdateRequest> {
  const request = await updateRequest(input.requestId, { status: "approved", admin_notes: nullableText(input.adminNotes), reviewed_by: input.adminUserId, reviewed_at: new Date().toISOString() });
  trackEvent("admin_profile_update_approved", { venueId: request.venueId, changedFields: getVenueUpdateDiffLabels(request).join(","), status: request.status });
  return request;
}

export async function rejectVenueUpdateRequest(input: { requestId: string; adminUserId: string; adminNotes?: string | null }): Promise<VenueUpdateRequest> {
  const request = await updateRequest(input.requestId, { status: "rejected", admin_notes: nullableText(input.adminNotes), reviewed_by: input.adminUserId, reviewed_at: new Date().toISOString() });
  trackEvent("admin_profile_update_rejected", { venueId: request.venueId, changedFields: getVenueUpdateDiffLabels(request).join(","), status: request.status });
  return request;
}

export async function applyVenueUpdateRequest(input: { requestId: string; adminUserId: string }): Promise<VenueUpdateRequest> {
  const client = ensureSupabase();
  const request = await getRequest(input.requestId);
  if (request.status !== "approved" && request.status !== "pending") throw new Error("Only pending or approved requests can be applied.");
  const changes = filterOwnerEditableVenueChanges(request.requestedChanges);
  const venueUpdate = await toVenueUpdate(request.venueId, changes);

  const { error: venueError } = await client.from("venues").update(venueUpdate).eq("id", request.venueId);
  if (venueError) throw new Error(`Could not apply venue update: ${venueError.message}`);

  const updated = await updateRequest(input.requestId, {
    status: "applied",
    reviewed_by: request.reviewedBy ?? input.adminUserId,
    reviewed_at: request.reviewedAt ?? new Date().toISOString(),
    applied_at: new Date().toISOString(),
  });
  trackEvent("admin_profile_update_applied", { venueId: updated.venueId, changedFields: getVenueUpdateDiffLabels(updated).join(","), status: updated.status });
  return updated;
}

async function getRequest(requestId: string) {
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_update_requests").select("*").eq("id", requestId).single();
  if (error) throw new Error(`Could not load venue update request: ${error.message}`);
  return mapVenueUpdateRequestRowToRequest(data as VenueUpdateRequestRow);
}

async function updateRequest(requestId: string, updates: Record<string, unknown>) {
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_update_requests").update(updates).eq("id", requestId).select("*").single();
  if (error) throw new Error(`Could not update venue update request: ${error.message}`);
  return mapVenueUpdateRequestRowToRequest(data as VenueUpdateRequestRow);
}

async function toVenueUpdate(venueId: string, changes: VenueProfileUpdateChanges) {
  const update: Record<string, unknown> = {};
  if (changes.description !== undefined) update.description = changes.description;
  if (changes.phone !== undefined) update.phone = changes.phone;
  if (changes.website !== undefined) update.website = changes.website;
  if (changes.instagram !== undefined) update.instagram = changes.instagram;
  if (changes.priceFrom !== undefined) update.price_from = changes.priceFrom;
  if (changes.openingHours !== undefined) update.opening_hours = changes.openingHours;
  if (changes.vibes !== undefined) update.vibes = changes.vibes;
  if (changes.features !== undefined) {
    update.food = changes.features.includes("food");
    update.alcohol = changes.features.includes("alcohol");
    update.indoor = changes.features.includes("indoor");
    update.outdoor = changes.features.includes("outdoor");
    update.open_late = changes.features.includes("openLate");
  }
  if (changes.menuUrl !== undefined || changes.bookingUrl !== undefined || changes.contactUrl !== undefined) {
    const existing = await getVenueDataSources(venueId);
    update.data_sources = {
      ...existing,
      ...(changes.menuUrl !== undefined ? { menuUrl: changes.menuUrl } : {}),
      ...(changes.bookingUrl !== undefined ? { bookingUrl: changes.bookingUrl } : {}),
      ...(changes.contactUrl !== undefined ? { contactUrl: changes.contactUrl } : {}),
    };
  }
  return update;
}

async function getVenueDataSources(venueId: string): Promise<Record<string, string>> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venues").select("data_sources").eq("id", venueId).single();
  if (error) return {};
  const value = (data as { data_sources?: unknown }).data_sources;
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, string> : {};
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
