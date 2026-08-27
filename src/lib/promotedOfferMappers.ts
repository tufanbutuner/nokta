import type { PromotedOfferRow } from "@/types/database";
import type { PromotedOffer } from "@/types/promotedOffers";

export function mapPromotedOfferRowToOffer(row: PromotedOfferRow): PromotedOffer {
  return {
    id: row.id,
    venueId: row.venue_id,
    title: row.title,
    description: row.description,
    terms: row.terms,
    offerType: row.offer_type,
    city: row.city,
    area: row.area,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    priority: row.priority,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
