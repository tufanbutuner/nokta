import { mapReviewRowToReview } from "@/lib/reviewMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { VenueReviewRow } from "@/types/database";
import type { ReviewStatus, VenueReview } from "@/types/reviews";

function ensureSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }

  return supabase;
}

export async function getAdminReviews(): Promise<VenueReview[]> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_reviews").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load admin reviews: ${error.message}`);
  }

  return ((data ?? []) as VenueReviewRow[]).map(mapReviewRowToReview);
}

export async function getAdminReviewsByStatus(status: ReviewStatus): Promise<VenueReview[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_reviews")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load ${status} reviews: ${error.message}`);
  }

  return ((data ?? []) as VenueReviewRow[]).map(mapReviewRowToReview);
}

export async function updateReviewModerationStatus(input: {
  reviewId: string;
  status: ReviewStatus;
  moderationNotes?: string | null;
  adminUserId: string;
}): Promise<VenueReview> {
  const client = ensureSupabase();
  const now = new Date().toISOString();
  const patch: Partial<VenueReviewRow> = {
    status: input.status,
    moderation_notes: nullableText(input.moderationNotes),
  };

  if (input.status === "published") {
    patch.hidden_at = null;
    patch.hidden_by = null;
    patch.deleted_at = null;
  }

  if (input.status === "hidden") {
    patch.hidden_at = now;
    patch.hidden_by = input.adminUserId;
    patch.deleted_at = null;
  }

  if (input.status === "flagged") {
    patch.deleted_at = null;
  }

  if (input.status === "deleted") {
    patch.hidden_at = now;
    patch.hidden_by = input.adminUserId;
    patch.deleted_at = now;
  }

  const { data, error } = await client.from("venue_reviews").update(patch).eq("id", input.reviewId).select("*").single();

  if (error) {
    throw new Error(`Could not update review moderation: ${error.message}`);
  }

  return mapReviewRowToReview(data as VenueReviewRow);
}

export async function updateReviewModerationNotes(input: {
  reviewId: string;
  moderationNotes?: string | null;
}): Promise<VenueReview> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_reviews")
    .update({ moderation_notes: nullableText(input.moderationNotes) })
    .eq("id", input.reviewId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not update moderation notes: ${error.message}`);
  }

  return mapReviewRowToReview(data as VenueReviewRow);
}

export async function softDeleteReview(input: {
  reviewId: string;
  moderationNotes?: string | null;
  adminUserId: string;
}): Promise<VenueReview> {
  return updateReviewModerationStatus({
    reviewId: input.reviewId,
    status: "deleted",
    moderationNotes: input.moderationNotes,
    adminUserId: input.adminUserId,
  });
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
