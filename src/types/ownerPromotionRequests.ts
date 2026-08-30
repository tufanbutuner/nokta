export type OwnerPromotionRequestType = "promoted_offer" | "featured_placement";
export type OwnerPromotionRequestStatus = "pending" | "approved" | "rejected" | "cancelled" | "converted";
export type OwnerPromotionOfferType = "food" | "drink" | "birthday" | "group" | "football" | "student" | "private-hire" | "event" | "other";
export type OwnerPromotionPlacementType = "homepage" | "city" | "area" | "discover" | "recommendation";

export interface OwnerPromotionRequest {
  id: string;
  venueId: string;
  submittedBy: string;
  requestType: OwnerPromotionRequestType;
  status: OwnerPromotionRequestStatus;
  title: string;
  description: string | null;
  terms: string | null;
  offerType: OwnerPromotionOfferType | null;
  placementType: OwnerPromotionPlacementType | null;
  requestedCity: string | null;
  requestedArea: string | null;
  requestedStartsAt: string | null;
  requestedEndsAt: string | null;
  requestedPriority: number;
  ctaLabel: string | null;
  ctaUrl: string | null;
  ownerNotes: string | null;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdOfferId: string | null;
  createdFeaturedPlacementId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerPromotionRequestInput {
  venueId: string;
  requestType: OwnerPromotionRequestType;
  title: string;
  description?: string | null;
  terms?: string | null;
  offerType?: OwnerPromotionOfferType | null;
  placementType?: OwnerPromotionPlacementType | null;
  requestedCity?: string | null;
  requestedArea?: string | null;
  requestedStartsAt?: string | null;
  requestedEndsAt?: string | null;
  requestedPriority?: number;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  ownerNotes?: string | null;
}
