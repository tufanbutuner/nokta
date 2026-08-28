import type { VenueEnquiryRow } from "@/types/database";
import type { VenueEnquiry } from "@/types/venueEnquiries";

export function mapVenueEnquiryRowToEnquiry(row: VenueEnquiryRow): VenueEnquiry {
  return {
    id: row.id,
    venueId: row.venue_id,
    submittedBy: row.submitted_by,
    enquiryType: row.enquiry_type,
    partySize: row.party_size,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    message: row.message,
    status: row.status,
    adminNotes: row.admin_notes,
    assignedTo: row.assigned_to,
    contactedVenueAt: row.contacted_venue_at,
    venueResponse: row.venue_response,
    resolvedAt: row.resolved_at,
    ownerLastUpdatedBy: row.owner_last_updated_by ?? null,
    ownerLastUpdatedAt: row.owner_last_updated_at ?? null,
    ownerNotes: row.owner_notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
