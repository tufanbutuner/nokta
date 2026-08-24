import { supabase, supabaseConfigError } from "@/lib/supabase";
import { mapReviewRowToReview } from "@/lib/reviewMappers";
import type { VenueReviewRow } from "@/types/database";
import type { VenueRatingSummary, VenueReview, VenueReviewInput } from "@/types/reviews";

function ensureSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }

  return supabase;
}

export async function getVenueReviews(venueId: string): Promise<VenueReview[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_reviews")
    .select("*")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load reviews: ${error.message}`);
  }

  return ((data ?? []) as VenueReviewRow[]).map(mapReviewRowToReview);
}

export async function getVenueReviewSummaries(venueIds: string[]): Promise<Record<string, VenueRatingSummary>> {
  const uniqueVenueIds = Array.from(new Set(venueIds)).filter(Boolean);

  if (!uniqueVenueIds.length) {
    return {};
  }

  const client = ensureSupabase();
  const { data, error } = await client.from("venue_reviews").select("venue_id, rating").in("venue_id", uniqueVenueIds);

  if (error) {
    throw new Error(`Could not load review summaries: ${error.message}`);
  }

  const ratingsByVenue = (data ?? []).reduce<Record<string, number[]>>((groups, row) => {
    const venueId = row.venue_id as string;
    const rating = row.rating as number;
    groups[venueId] = [...(groups[venueId] ?? []), rating];
    return groups;
  }, {});

  return Object.fromEntries(
    Object.entries(ratingsByVenue).map(([venueId, ratings]) => {
      const total = ratings.reduce((sum, rating) => sum + rating, 0);

      return [
        venueId,
        {
          averageRating: Number((total / ratings.length).toFixed(1)),
          reviewCount: ratings.length,
        },
      ];
    }),
  );
}

export async function getUserReviewForVenue(venueId: string, userId: string): Promise<VenueReview | null> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_reviews")
    .select("*")
    .eq("venue_id", venueId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load your review: ${error.message}`);
  }

  return data ? mapReviewRowToReview(data as VenueReviewRow) : null;
}

export async function createVenueReview(userId: string, input: VenueReviewInput): Promise<VenueReview> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_reviews")
    .insert({
      venue_id: input.venueId,
      user_id: userId,
      rating: input.rating,
      title: nullableText(input.title),
      body: input.body.trim(),
      visit_date: input.visitDate || null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not create review: ${error.message}`);
  }

  return mapReviewRowToReview(data as VenueReviewRow);
}

export async function updateVenueReview(reviewId: string, input: VenueReviewInput): Promise<VenueReview> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_reviews")
    .update({
      rating: input.rating,
      title: nullableText(input.title),
      body: input.body.trim(),
      visit_date: input.visitDate || null,
    })
    .eq("id", reviewId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not update review: ${error.message}`);
  }

  return mapReviewRowToReview(data as VenueReviewRow);
}

export async function deleteVenueReview(reviewId: string): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client.from("venue_reviews").delete().eq("id", reviewId);

  if (error) {
    throw new Error(`Could not delete review: ${error.message}`);
  }
}

export function getVenueRatingSummary(reviews: VenueReview[]): VenueRatingSummary {
  if (!reviews.length) {
    return {
      averageRating: null,
      reviewCount: 0,
    };
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);

  return {
    averageRating: Number((total / reviews.length).toFixed(1)),
    reviewCount: reviews.length,
  };
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
