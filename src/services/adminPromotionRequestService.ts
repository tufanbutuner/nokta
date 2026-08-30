import { createFeaturedPlacement } from "@/services/adminFeaturedPlacementService";
import { createPromotedOffer } from "@/services/adminPromotedOfferService";
import { mapOwnerPromotionRequestRowToRequest } from "@/lib/ownerPromotionRequestMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { OwnerPromotionRequestRow } from "@/types/database";
import type { OwnerPromotionRequest } from "@/types/ownerPromotionRequests";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getAdminPromotionRequests(): Promise<OwnerPromotionRequest[]> {
  const client = ensureSupabase();
  const { data, error } = await client.from("owner_promotion_requests").select("*").order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load promotion requests: ${error.message}`);
  return ((data ?? []) as OwnerPromotionRequestRow[]).map(mapOwnerPromotionRequestRowToRequest);
}

export async function approvePromotionRequest(input: { requestId: string; adminUserId: string; adminNotes?: string | null }): Promise<OwnerPromotionRequest> {
  return updatePromotionRequest(input.requestId, {
    status: "approved",
    admin_notes: nullableText(input.adminNotes),
    reviewed_by: input.adminUserId,
    reviewed_at: new Date().toISOString(),
  });
}

export async function rejectPromotionRequest(input: { requestId: string; adminUserId: string; adminNotes?: string | null }): Promise<OwnerPromotionRequest> {
  return updatePromotionRequest(input.requestId, {
    status: "rejected",
    admin_notes: nullableText(input.adminNotes),
    reviewed_by: input.adminUserId,
    reviewed_at: new Date().toISOString(),
  });
}

export async function convertPromotionRequest(input: { requestId: string; adminUserId: string }): Promise<OwnerPromotionRequest> {
  const request = await getAdminPromotionRequest(input.requestId);
  if (request.status !== "approved") throw new Error("Approve the request before converting it.");

  if (request.requestType === "promoted_offer") {
    if (!request.offerType || !request.requestedStartsAt || !request.requestedEndsAt) {
      throw new Error("Promoted offer requests need an offer type and requested dates before conversion.");
    }
    const offer = await createPromotedOffer({
      adminUserId: input.adminUserId,
      offer: {
        venueId: request.venueId,
        title: request.title,
        description: request.description,
        terms: request.terms,
        offerType: request.offerType,
        city: request.requestedCity,
        area: request.requestedArea,
        startsAt: request.requestedStartsAt,
        endsAt: request.requestedEndsAt,
        status: "draft",
        priority: request.requestedPriority,
        ctaLabel: request.ctaLabel,
        ctaUrl: request.ctaUrl,
      },
    });
    return updatePromotionRequest(input.requestId, { status: "converted", created_offer_id: offer.id });
  }

  if (!request.placementType || !request.requestedStartsAt || !request.requestedEndsAt) {
    throw new Error("Featured placement requests need a placement type and requested dates before conversion.");
  }
  const placement = await createFeaturedPlacement({
    adminUserId: input.adminUserId,
    placement: {
      venueId: request.venueId,
      placementType: request.placementType,
      city: request.requestedCity,
      area: request.requestedArea,
      title: request.title,
      description: request.description,
      startsAt: request.requestedStartsAt,
      endsAt: request.requestedEndsAt,
      status: "draft",
      priority: request.requestedPriority,
    },
  });
  return updatePromotionRequest(input.requestId, { status: "converted", created_featured_placement_id: placement.id });
}

async function getAdminPromotionRequest(requestId: string): Promise<OwnerPromotionRequest> {
  const client = ensureSupabase();
  const { data, error } = await client.from("owner_promotion_requests").select("*").eq("id", requestId).single();
  if (error) throw new Error(`Could not load promotion request: ${error.message}`);
  return mapOwnerPromotionRequestRowToRequest(data as OwnerPromotionRequestRow);
}

async function updatePromotionRequest(requestId: string, values: Partial<OwnerPromotionRequestRow>): Promise<OwnerPromotionRequest> {
  const client = ensureSupabase();
  const { data, error } = await client.from("owner_promotion_requests").update(values).eq("id", requestId).select("*").single();
  if (error) throw new Error(`Could not update promotion request: ${error.message}`);
  return mapOwnerPromotionRequestRowToRequest(data as OwnerPromotionRequestRow);
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
