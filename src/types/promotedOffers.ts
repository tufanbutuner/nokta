export type PromotedOfferType = "food" | "drink" | "birthday" | "group" | "football" | "student" | "private-hire" | "event" | "other";

export type PromotedOfferStatus = "draft" | "active" | "paused" | "expired" | "cancelled";

export interface PromotedOffer {
  id: string;
  venueId: string;
  title: string;
  description: string | null;
  terms: string | null;
  offerType: PromotedOfferType;
  city: string | null;
  area: string | null;
  startsAt: string;
  endsAt: string;
  status: PromotedOfferStatus;
  priority: number;
  ctaLabel: string | null;
  ctaUrl: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromotedOfferInput {
  venueId: string;
  title: string;
  description?: string | null;
  terms?: string | null;
  offerType: PromotedOfferType;
  city?: string | null;
  area?: string | null;
  startsAt: string;
  endsAt: string;
  status: PromotedOfferStatus;
  priority?: number;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}
