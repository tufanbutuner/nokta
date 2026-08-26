import { DEFAULT_CITY, DEFAULT_COUNTRY } from "@/lib/cities";
import type { VenueSuggestionRow } from "@/types/database";
import type { VenueSuggestion } from "@/types/venueSuggestions";

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
    notes: row.notes,
    status: row.status,
    adminNotes: row.admin_notes,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
