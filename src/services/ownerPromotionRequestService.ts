import { canRequestFeaturedPlacement, canRequestPromotedOffer } from "@/lib/ownerPromotionAccess";
import { mapOwnerPromotionRequestRowToRequest } from "@/lib/ownerPromotionRequestMappers";
import { validateOwnerPromotionRequestInput } from "@/lib/ownerPromotionRequestValidation";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import { getOwnerVenueSubscription } from "@/services/ownerSubscriptionService";
import { getMyClaimedVenue } from "@/services/ownerVenueService";
import type { OwnerPromotionRequestRow } from "@/types/database";
import type { OwnerPromotionRequest, OwnerPromotionRequestInput } from "@/types/ownerPromotionRequests";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function createOwnerPromotionRequest(input: { userId: string; request: OwnerPromotionRequestInput }): Promise<OwnerPromotionRequest> {
  const client = ensureSupabase();
  const venue = await getMyClaimedVenue({ userId: input.userId, venueId: input.request.venueId });
  if (!venue) throw new Error("You can only request promotions for venues you manage.");

  const subscription = await getOwnerVenueSubscription({ userId: input.userId, venueId: venue.id });
  if (input.request.requestType === "promoted_offer" && !canRequestPromotedOffer(subscription)) {
    throw new Error("Promoted offer requests require the Growth plan.");
  }
  if (input.request.requestType === "featured_placement" && !canRequestFeaturedPlacement(subscription)) {
    throw new Error("Featured placement requests require the Pro plan.");
  }

  const validation = validateOwnerPromotionRequestInput({ ...input.request, venueId: venue.id });
  if (!validation.isValid) throw new Error(Object.values(validation.errors)[0] ?? "Promotion request is invalid.");

  const { data, error } = await client
    .from("owner_promotion_requests")
    .insert({ ...toRowInput({ ...input.request, venueId: venue.id }), submitted_by: input.userId })
    .select("*")
    .single();

  if (error) throw new Error(`Could not create promotion request: ${error.message}`);
  return mapOwnerPromotionRequestRowToRequest(data as OwnerPromotionRequestRow);
}

export async function getMyPromotionRequests(userId: string): Promise<OwnerPromotionRequest[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("owner_promotion_requests")
    .select("*")
    .eq("submitted_by", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load promotion requests: ${error.message}`);
  return ((data ?? []) as OwnerPromotionRequestRow[]).map(mapOwnerPromotionRequestRowToRequest);
}

export async function getMyPromotionRequestsForVenue(input: { userId: string; venueId: string }): Promise<OwnerPromotionRequest[]> {
  const venue = await getMyClaimedVenue({ userId: input.userId, venueId: input.venueId });
  if (!venue) throw new Error("You can only view promotion requests for venues you manage.");
  const client = ensureSupabase();
  const { data, error } = await client
    .from("owner_promotion_requests")
    .select("*")
    .eq("submitted_by", input.userId)
    .eq("venue_id", venue.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load venue promotion requests: ${error.message}`);
  return ((data ?? []) as OwnerPromotionRequestRow[]).map(mapOwnerPromotionRequestRowToRequest);
}

export async function cancelOwnerPromotionRequest(input: { userId: string; requestId: string }): Promise<OwnerPromotionRequest> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("owner_promotion_requests")
    .update({ status: "cancelled" })
    .eq("id", input.requestId)
    .eq("submitted_by", input.userId)
    .eq("status", "pending")
    .select("*")
    .single();

  if (error) throw new Error(`Could not cancel promotion request: ${error.message}`);
  return mapOwnerPromotionRequestRowToRequest(data as OwnerPromotionRequestRow);
}

function toRowInput(request: OwnerPromotionRequestInput) {
  return {
    venue_id: request.venueId,
    request_type: request.requestType,
    status: "pending",
    title: request.title.trim(),
    description: nullableText(request.description),
    terms: nullableText(request.terms),
    offer_type: request.requestType === "promoted_offer" ? request.offerType : null,
    placement_type: request.requestType === "featured_placement" ? request.placementType : null,
    requested_city: nullableText(request.requestedCity),
    requested_area: nullableText(request.requestedArea),
    requested_starts_at: request.requestedStartsAt || null,
    requested_ends_at: request.requestedEndsAt || null,
    requested_priority: request.requestedPriority ?? 0,
    cta_label: nullableText(request.ctaLabel),
    cta_url: nullableText(request.ctaUrl),
    owner_notes: nullableText(request.ownerNotes),
  };
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
