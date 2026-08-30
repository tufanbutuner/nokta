import { supabase, supabaseConfigError } from "@/lib/supabase";
import { mapVenueMediaRowToMedia } from "@/lib/venueMediaMappers";
import type { VenueMediaRow } from "@/types/database";
import type { VenueMedia, VenueMediaReviewStatus } from "@/types/venueMedia";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getAdminVenueMedia(status: VenueMediaReviewStatus | "all" = "pending"): Promise<VenueMedia[]> {
  const client = ensureSupabase();
  let query = client.from("venue_media").select("*").eq("source_type", "owner-uploaded").order("created_at", { ascending: false });
  if (status !== "all") query = query.eq("review_status", status);
  const { data, error } = await query;

  if (error) throw new Error(`Could not load media review queue: ${error.message}`);
  return ((data ?? []) as VenueMediaRow[]).map(mapVenueMediaRowToMedia);
}

export async function getPendingOwnerMedia(): Promise<VenueMedia[]> {
  return getAdminVenueMedia("pending");
}

export async function approveVenueMedia(input: { mediaId: string; adminUserId: string; reviewNotes?: string | null }): Promise<VenueMedia> {
  return updateMediaReview(input.mediaId, {
    review_status: "approved",
    verification_status: "verified",
    reviewed_by: input.adminUserId,
    reviewed_at: new Date().toISOString(),
    review_notes: nullableText(input.reviewNotes),
  });
}

export async function rejectVenueMedia(input: { mediaId: string; adminUserId: string; reviewNotes?: string | null }): Promise<VenueMedia> {
  return updateMediaReview(input.mediaId, {
    review_status: "rejected",
    reviewed_by: input.adminUserId,
    reviewed_at: new Date().toISOString(),
    review_notes: nullableText(input.reviewNotes),
  });
}

export async function setVenueMediaPrimary(input: { mediaId: string; venueId: string; adminUserId: string }): Promise<VenueMedia> {
  const client = ensureSupabase();
  await client.from("venue_media").update({ is_primary: false, updated_at: new Date().toISOString() }).eq("venue_id", input.venueId);
  return updateMediaReview(input.mediaId, { is_primary: true, updated_at: new Date().toISOString(), reviewed_by: input.adminUserId });
}

async function updateMediaReview(mediaId: string, values: Partial<VenueMediaRow>): Promise<VenueMedia> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_media").update(values).eq("id", mediaId).select("*").single();
  if (error) throw new Error(`Could not update media review item: ${error.message}`);
  return mapVenueMediaRowToMedia(data as VenueMediaRow);
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
