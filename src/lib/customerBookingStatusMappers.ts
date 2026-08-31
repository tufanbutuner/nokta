import type { CustomerBookingStatus, CustomerBookingStatusRow } from "@/types/customerBookingStatus";

export function mapCustomerBookingStatusRow(row: CustomerBookingStatusRow): CustomerBookingStatus {
  return {
    id: row.id,
    venueId: row.venue_id,
    venueName: row.venue_name,
    venueSlug: row.venue_slug,
    venueArea: row.venue_area,
    venueCity: row.venue_city,
    customerName: row.customer_name,
    partySize: row.party_size,
    requestedDate: row.requested_date,
    requestedTime: row.requested_time,
    occasion: row.occasion,
    status: row.status,
    ownerResponseMessage: row.owner_response_message,
    proposedDate: row.proposed_date,
    proposedTime: row.proposed_time,
    proposedMessage: row.proposed_message,
    customerAlternativeResponseMessage: row.customer_alternative_response_message,
    customerRespondedAt: row.customer_responded_at,
    confirmedAt: row.confirmed_at,
    confirmationReference: row.confirmation_reference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
