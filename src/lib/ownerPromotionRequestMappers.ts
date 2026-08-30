import type { OwnerPromotionRequestRow } from "@/types/database";
import type { OwnerPromotionRequest } from "@/types/ownerPromotionRequests";

export function mapOwnerPromotionRequestRowToRequest(row: OwnerPromotionRequestRow): OwnerPromotionRequest {
  return {
    id: row.id,
    venueId: row.venue_id,
    submittedBy: row.submitted_by,
    requestType: row.request_type,
    status: row.status,
    title: row.title,
    description: row.description,
    terms: row.terms,
    offerType: row.offer_type,
    placementType: row.placement_type,
    requestedCity: row.requested_city,
    requestedArea: row.requested_area,
    requestedStartsAt: row.requested_starts_at,
    requestedEndsAt: row.requested_ends_at,
    requestedPriority: row.requested_priority,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    ownerNotes: row.owner_notes,
    adminNotes: row.admin_notes,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdOfferId: row.created_offer_id,
    createdFeaturedPlacementId: row.created_featured_placement_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
