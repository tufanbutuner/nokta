import { DEFAULT_CITY, DEFAULT_COUNTRY } from "@/lib/cities";
import type { VenueSuggestionRow } from "@/types/database";
import type { VenueSuggestion } from "@/types/venueSuggestions";
import type { VenuePrimaryCategory, VenueSecondaryCategory } from "@/types/venueCategories";

export function mapVenueSuggestionRowToSuggestion(row: VenueSuggestionRow): VenueSuggestion {
  return {
    id: row.id,
    submittedBy: row.submitted_by,
    venueName: row.venue_name,
    country: row.country ?? DEFAULT_COUNTRY,
    city: row.city ?? DEFAULT_CITY,
    area: row.area,
    address: row.address,
    postcode: row.postcode,
    website: row.website,
    instagram: row.instagram,
    phone: row.phone,
    primaryCategory: mapPrimaryCategory(row.primary_category),
    secondaryCategories: mapSecondaryCategories(row.secondary_categories),
    notes: row.notes,
    status: row.status,
    adminNotes: row.admin_notes,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPrimaryCategory(category?: string | null): VenuePrimaryCategory {
  const allowed: VenuePrimaryCategory[] = ["shisha_lounge", "restaurant", "bar", "cafe", "dessert", "lounge", "late_night", "private_hire", "other"];
  return allowed.includes(category as VenuePrimaryCategory) ? (category as VenuePrimaryCategory) : "shisha_lounge";
}

function mapSecondaryCategories(categories?: string[] | null): VenueSecondaryCategory[] {
  const allowed = new Set<VenueSecondaryCategory>(["shisha", "food", "mocktails", "cocktails", "coffee", "dessert", "brunch", "late_night", "live_sport", "private_hire", "outdoor_seating", "date_night", "groups", "events"]);
  return (categories ?? []).filter((category): category is VenueSecondaryCategory => allowed.has(category as VenueSecondaryCategory));
}
