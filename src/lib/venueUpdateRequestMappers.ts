import type { VenueUpdateRequestRow } from "@/types/database";
import type { VenueProfileUpdateChanges, VenueUpdateRequest } from "@/types/venueUpdateRequests";

export function mapVenueUpdateRequestRowToRequest(row: VenueUpdateRequestRow): VenueUpdateRequest {
  return {
    id: row.id,
    venueId: row.venue_id,
    submittedBy: row.submitted_by,
    status: row.status,
    requestedChanges: row.requested_changes as VenueProfileUpdateChanges,
    originalSnapshot: row.original_snapshot as VenueProfileUpdateChanges,
    requestNotes: row.request_notes,
    adminNotes: row.admin_notes,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    appliedAt: row.applied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
