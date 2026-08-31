import type { BookingRequestRow } from "@/types/database";
import type { BookingRequest } from "@/types/bookingRequests";

export function mapBookingRequestRowToBookingRequest(row: BookingRequestRow): BookingRequest {
  return {
    id: row.id,
    venueId: row.venue_id,
    submittedBy: row.submitted_by,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    partySize: row.party_size,
    requestedDate: row.requested_date,
    requestedTime: row.requested_time,
    occasion: row.occasion,
    message: row.message,
    status: row.status,
    ownerResponseMessage: row.owner_response_message,
    proposedDate: row.proposed_date,
    proposedTime: row.proposed_time,
    proposedMessage: row.proposed_message,
    acceptedAt: row.accepted_at,
    declinedAt: row.declined_at,
    proposedAt: row.proposed_at,
    cancelledAt: row.cancelled_at,
    customerAccessToken: row.customer_access_token,
    customerAccessTokenExpiresAt: row.customer_access_token_expires_at,
    customerAlternativeResponseMessage: row.customer_alternative_response_message,
    customerRespondedAt: row.customer_responded_at,
    confirmedAt: row.confirmed_at,
    confirmationReference: row.confirmation_reference,
    ownerLastUpdatedBy: row.owner_last_updated_by,
    ownerLastUpdatedAt: row.owner_last_updated_at,
    adminNotes: row.admin_notes,
    sourceSurface: row.source_surface,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
